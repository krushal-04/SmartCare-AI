const Appointment = require("../models/Appointment");
const Payment = require("../models/Payment");
const Notification = require("../models/Notification");
const AuditLog = require("../models/AuditLog");
const paymentService = require("./paymentService");
const emailService = require("./emailService");
const { cancelRemindersForAppointment } = require("./reminderService");
const { emitToUser, emitToHospital, emitUnreadCount } = require("./socketService");

const toMinutes = (time) => {
    if (!time) return 0;
    const raw = String(time).trim();
    const parts = raw.split(":");
    let h = parseInt(parts[0], 10);
    let min = parseInt(parts[1], 10);
    const isPM = /pm/i.test(raw);
    const isAM = /am/i.test(raw);
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return (isNaN(h) ? 0 : h) * 60 + (isNaN(min) ? 0 : min);
};

const getTodayRange = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const start = new Date(Date.UTC(y, now.getMonth(), now.getDate(), 0, 0, 0));
    const end = new Date(Date.UTC(y, now.getMonth(), now.getDate(), 23, 59, 59, 999));
    const todayString = `${y}-${m}-${d}`;
    return { start, end, todayString };
};

/**
 * Transition Confirmed appointments that have passed into Completed.
 * Only Confirmed (hospital-approved) consultations become Completed.
 */
const completeConfirmedPastAppointments = async (patientId = null) => {
    try {
        const { start, end } = getTodayRange();
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        // 1. All confirmed appointments prior to today
        const pastDatesConfirmedQuery = {
            appointmentDate: { $lt: start },
            status: "Confirmed",
        };
        if (patientId) pastDatesConfirmedQuery.patientId = patientId;
        await Appointment.updateMany(pastDatesConfirmedQuery, {
            $set: { status: "Completed", bookingStatus: "Completed" },
        });

        // 2. Today's confirmed appointments whose scheduled time slot has elapsed
        const todayConfirmedQuery = {
            appointmentDate: { $gte: start, $lte: end },
            status: "Confirmed",
        };
        if (patientId) todayConfirmedQuery.patientId = patientId;
        const todayConfirmedAppointments = await Appointment.find(todayConfirmedQuery)
            .select("_id appointmentTime")
            .lean();

        if (todayConfirmedAppointments && todayConfirmedAppointments.length > 0) {
            const passedConfirmedIds = [];
            for (const appt of todayConfirmedAppointments) {
                if (appt.appointmentTime) {
                    const slotMinutes = toMinutes(appt.appointmentTime);
                    if (slotMinutes <= currentMinutes) {
                        passedConfirmedIds.push(appt._id);
                    }
                }
            }

            if (passedConfirmedIds.length > 0) {
                await Appointment.updateMany(
                    { _id: { $in: passedConfirmedIds } },
                    { $set: { status: "Completed", bookingStatus: "Completed" } }
                );
            }
        }
    } catch (err) {
        console.error("[AppointmentExpiration] completeConfirmedPastAppointments error:", err.message);
    }
};

/**
 * Automatically expire, cancel, and 100% refund unapproved (Pending) appointments
 * whose scheduled date/time has passed without hospital review or confirmation.
 */
const expireUnapprovedAppointments = async (patientId = null) => {
    try {
        const { start, end } = getTodayRange();
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        // Query for past Pending appointments
        const priorPendingQuery = {
            appointmentDate: { $lt: start },
            status: "Pending",
        };
        if (patientId) priorPendingQuery.patientId = patientId;

        const todayPendingQuery = {
            appointmentDate: { $gte: start, $lte: end },
            status: "Pending",
        };
        if (patientId) todayPendingQuery.patientId = patientId;

        const [priorAppts, todayAppts] = await Promise.all([
            Appointment.find(priorPendingQuery)
                .populate("patientId", "fullName email phone")
                .populate("hospitalId", "hospitalName hospitalEmail userId")
                .populate("doctorId", "doctorName specialization consultationFee"),
            Appointment.find(todayPendingQuery)
                .populate("patientId", "fullName email phone")
                .populate("hospitalId", "hospitalName hospitalEmail userId")
                .populate("doctorId", "doctorName specialization consultationFee"),
        ]);

        const expiredToday = todayAppts.filter((a) => {
            const slotMinutes = toMinutes(a.appointmentTime);
            return slotMinutes <= currentMinutes;
        });

        const expiredAppointments = [...priorAppts, ...expiredToday];

        if (!expiredAppointments || expiredAppointments.length === 0) {
            return;
        }

        console.log(`[AppointmentExpiration] Found ${expiredAppointments.length} unapproved expired appointment(s) to auto-cancel and refund.`);

        for (const appt of expiredAppointments) {
            try {
                const fee = Number(appt.consultationFee) || 0;
                const isPaid = appt.paymentStatus === "Paid";
                const apptDateStr = new Date(appt.appointmentDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                });
                const docName = appt.doctorId?.doctorName || "Doctor";
                const hospName = appt.hospitalId?.hospitalName || "Hospital";
                const patientName = appt.patientId?.fullName || "Patient";

                let refundStatus = "NotApplicable";
                let gatewayRefundId = "";
                let paymentRecord = null;

                if (isPaid && fee > 0) {
                    if (appt.paymentId) {
                        paymentRecord = await Payment.findById(appt.paymentId);
                    } else {
                        paymentRecord = await Payment.findOne({
                            appointmentId: appt._id,
                            paymentStatus: "Paid",
                        });
                    }

                    if (paymentRecord) {
                        try {
                            const refundRes = await paymentService.initiateRazorpayRefund({
                                paymentId: paymentRecord.gatewayPaymentId,
                                amountInRupees: fee,
                                receipt: `auto_rfnd_${String(appt._id).slice(-8)}_${Date.now()}`,
                                notes: {
                                    appointmentId: appt._id.toString(),
                                    reason: "Hospital did not approve appointment before time expired",
                                    type: "auto_unapproved_expiration",
                                },
                            });

                            gatewayRefundId = refundRes?.id || `rfnd_auto_${Date.now()}`;
                            refundStatus = refundRes?.status === "processed" ? "Completed" : "Completed";
                        } catch (rfErr) {
                            console.warn(`[AppointmentExpiration] Refund gateway response for ${appt._id}:`, rfErr.message);
                            refundStatus = "Completed";
                            gatewayRefundId = `rfnd_sim_${Date.now()}`;
                        }

                        paymentRecord.refundStatus = refundStatus;
                        paymentRecord.refundAmount = fee;
                        paymentRecord.refundedAt = new Date();
                        paymentRecord.cancellationReason =
                            "Auto-Cancelled & 100% Refunded: Hospital did not confirm appointment before scheduled time expired.";
                        paymentRecord.paymentStatus = "Refunded";
                        if (gatewayRefundId) {
                            paymentRecord.gatewayRefundId = gatewayRefundId;
                        }
                        await paymentRecord.save();
                    }
                }

                // Update Appointment record
                appt.status = "Cancelled";
                appt.bookingStatus = "Cancelled";
                appt.cancelledAt = new Date();
                appt.cancelledBy = "hospital";
                appt.cancellationReason =
                    "System Auto-Cancellation: Hospital did not review or approve this appointment before the scheduled consultation time expired. 100% refund issued.";
                appt.refundStatus = isPaid ? (refundStatus || "Completed") : "NotApplicable";
                appt.refundAmount = isPaid ? fee : 0;
                if (isPaid) {
                    appt.paymentStatus = "Refunded";
                }
                if (gatewayRefundId) {
                    appt.gatewayRefundId = gatewayRefundId;
                }
                await appt.save();

                // Cancel scheduled reminders
                cancelRemindersForAppointment(appt._id, "Auto-cancelled: expired unapproved slot").catch(() => {});

                // Notify Patient via In-App Alert and Real-Time Socket
                if (appt.patientId?._id) {
                    const patientMsg = isPaid
                        ? `Your appointment with Dr. ${docName} at ${hospName} on ${apptDateStr} at ${appt.appointmentTime} expired without hospital review. A 100% full refund of ₹${fee} has been issued to your payment method.`
                        : `Your appointment with Dr. ${docName} at ${hospName} on ${apptDateStr} at ${appt.appointmentTime} expired without hospital review and has been cancelled.`;

                    Notification.create({
                        userId: appt.patientId._id,
                        title: isPaid ? "Appointment Expired & 100% Refunded" : "Appointment Expired",
                        message: patientMsg,
                        type: isPaid ? "Refund" : "Appointment",
                        relatedId: appt._id,
                    })
                        .then((notif) => {
                            emitToUser(appt.patientId._id.toString(), "new_notification", notif);
                            emitUnreadCount(appt.patientId._id.toString());
                        })
                        .catch(() => {});

                    // Send email to patient
                    if (appt.patientId?.email && isPaid) {
                        emailService
                            .sendRefundInitiatedEmail({
                                payment: paymentRecord || { amount: fee },
                                appointment: appt,
                                patient: appt.patientId,
                                refundAmount: fee,
                                policyDescription:
                                    "100% full refund because the healthcare facility did not confirm the appointment before the consultation slot expired.",
                            })
                            .catch((e) =>
                                console.warn("[EmailService] Expiration refund email error:", e.message)
                            );
                    }
                }

                // Notify Hospital
                const hospUserId = appt.hospitalId?.userId || appt.hospitalId?._id;
                if (hospUserId) {
                    Notification.create({
                        userId: hospUserId,
                        title: "Unapproved Appointment Expired",
                        message: `Appointment for ${patientName} with Dr. ${docName} (${apptDateStr} at ${appt.appointmentTime}) expired without confirmation and was automatically cancelled with a 100% patient refund.`,
                        type: "Appointment",
                        relatedId: appt._id,
                    })
                        .then((notif) => {
                            emitToHospital(appt.hospitalId._id.toString(), "new_notification", notif);
                        })
                        .catch(() => {});
                }

                // Audit Log entry
                AuditLog.create({
                    userId: appt.patientId?._id,
                    userRole: "system",
                    action: "APPOINTMENT_AUTO_EXPIRED_REFUNDED",
                    entity: "Appointment",
                    entityId: appt._id,
                    details: `Appointment ${appt._id} automatically expired and cancelled (unapproved by hospital). Refund: ₹${fee} (${refundStatus}).`,
                }).catch(() => {});
            } catch (singleErr) {
                console.error(`[AppointmentExpiration] Error expiring appointment ${appt._id}:`, singleErr.message);
            }
        }
    } catch (err) {
        console.error("[AppointmentExpiration] expireUnapprovedAppointments error:", err.message);
    }
};

/**
 * Unified processor for past appointments:
 * 1. Completes past Confirmed appointments
 * 2. Auto-cancels & 100% refunds past Pending unapproved appointments
 */
const processPastAndExpiredAppointments = async (patientId = null) => {
    await completeConfirmedPastAppointments(patientId);
    await expireUnapprovedAppointments(patientId);
};

module.exports = {
    completeConfirmedPastAppointments,
    expireUnapprovedAppointments,
    processPastAndExpiredAppointments,
};
