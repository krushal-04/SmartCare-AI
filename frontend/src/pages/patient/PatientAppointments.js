import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
    Tooltip,
} from "@mui/material";
import {
    CalendarMonthOutlined,
    CheckCircleOutlined,
    CloseOutlined,
    EventAvailableOutlined,
    HourglassEmptyOutlined,
    ReplayOutlined,
    WarningAmberOutlined,
    UpdateOutlined,
    HistoryOutlined,
    ArrowForwardOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../services/api";
import { colors } from "../../theme/colors";

const formatAppointmentDate = (value) =>
    value
        ? new Intl.DateTimeFormat("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
          }).format(new Date(value))
        : "—";

const isAppointmentPassed = (date, time) => {
    if (!date) return false;
    const now = new Date();
    const apptDate = new Date(date);
    apptDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (apptDate < today) return true;
    if (apptDate > today) return false;

    if (time && time.includes(":")) {
        const parts = time.split(":");
        let h = parseInt(parts[0], 10);
        const isPM = /pm/i.test(time);
        const isAM = /am/i.test(time);
        let min = parseInt(parts[1], 10);
        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;
        if (!isNaN(h) && !isNaN(min)) {
            return (h * 60 + min) <= (now.getHours() * 60 + now.getMinutes());
        }
    }
    return false;
};


const getRescheduleEligibility = (appointment) => {
    if (!appointment) return { eligible: false, reason: "Appointment not found" };
    const rawStatus = appointment.status || appointment.bookingStatus || "Pending";
    const isPassed = isAppointmentPassed(appointment.appointmentDate, appointment.appointmentTime);

    if (isPassed) {
        return { eligible: false, reason: "This appointment has already passed and cannot be rescheduled." };
    }
    if (!["Pending", "Confirmed"].includes(rawStatus)) {
        return { eligible: false, reason: `Appointments with status '${rawStatus}' cannot be rescheduled.` };
    }
    if (!appointment.appointmentDate) {
        return { eligible: false, reason: "Appointment date is missing." };
    }

    const apptDate = new Date(appointment.appointmentDate);
    let h = 9, m = 0;
    if (appointment.appointmentTime && appointment.appointmentTime.includes(":")) {
        const parts = appointment.appointmentTime.split(":");
        let ph = parseInt(parts[0], 10);
        const isPM = /pm/i.test(appointment.appointmentTime);
        const isAM = /am/i.test(appointment.appointmentTime);
        let pm = parseInt(parts[1], 10) || 0;
        if (isPM && ph < 12) ph += 12;
        if (isAM && ph === 12) ph = 0;
        if (!isNaN(ph)) { h = ph; m = pm; }
    }
    apptDate.setHours(h, m, 0, 0);

    const diffHours = (apptDate.getTime() - Date.now()) / (1000 * 60 * 60);
    if (diffHours < 2) {
        return {
            eligible: false,
            reason: "Rescheduling deadline has passed (must be at least 2 hours before the scheduled consultation time).",
        };
    }
    return { eligible: true };
};

export default function PatientAppointments() {
    const navigate = useNavigate();

    const [appointments, setAppointments] = useState([]);
    const [statusFilter, setStatusFilter] = useState("All");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    
    // Cancellation & Refund Preview state
    const [selectedCancelAppt, setSelectedCancelAppt] = useState(null);
    const [refundPreview, setRefundPreview] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [cancelling, setCancelling] = useState(false);

    // Reschedule state
    const [selectedRescheduleAppt, setSelectedRescheduleAppt] = useState(null);
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [rescheduleTime, setRescheduleTime] = useState("");
    const [rescheduleReason, setRescheduleReason] = useState("");
    const [rescheduleSlots, setRescheduleSlots] = useState([]);
    const [rescheduleNotice, setRescheduleNotice] = useState("");
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [rescheduling, setRescheduling] = useState(false);
    const [rescheduleError, setRescheduleError] = useState("");

    // History modal state
    const [selectedHistoryAppt, setSelectedHistoryAppt] = useState(null);

    
    // Fetch reschedule slots for selected appointment and date
    const fetchRescheduleSlots = async (appointmentId, dateStr) => {
        if (!appointmentId || !dateStr) return;
        try {
            setSlotsLoading(true);
            setRescheduleError("");
            setRescheduleNotice("");
            const res = await api.get(`/appointment/${appointmentId}/reschedule/availability?date=${dateStr}`);
            setRescheduleSlots(res.data.slots || []);
            if (res.data.message) {
                setRescheduleNotice(res.data.message);
            }
        } catch (err) {
            setRescheduleError(err.response?.data?.message || "Unable to check doctor availability for this date.");
            setRescheduleSlots([]);
        } finally {
            setSlotsLoading(false);
        }
    };

    // Open reschedule dialog
    const handleOpenRescheduleDialog = async (appointment) => {
        setSelectedRescheduleAppt(appointment);
        setRescheduleError("");
        setRescheduleReason("");
        setRescheduleTime("");

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const defaultDateStr = tomorrow.toISOString().split("T")[0];

        setRescheduleDate(defaultDateStr);
        await fetchRescheduleSlots(appointment._id, defaultDateStr);
    };

    // Change date in reschedule dialog
    const handleRescheduleDateChange = async (newDateVal) => {
        setRescheduleDate(newDateVal);
        setRescheduleTime("");
        if (selectedRescheduleAppt && newDateVal) {
            await fetchRescheduleSlots(selectedRescheduleAppt._id, newDateVal);
        }
    };

    // Execute reschedule
    const executeReschedule = async () => {
        if (!selectedRescheduleAppt || !rescheduleDate || !rescheduleTime) {
            setRescheduleError("Please choose both a new date and an available time slot.");
            return;
        }
        try {
            setRescheduling(true);
            setRescheduleError("");
            const res = await api.put(`/appointment/${selectedRescheduleAppt._id}/reschedule`, {
                newDate: rescheduleDate,
                newTime: rescheduleTime,
                reason: rescheduleReason.trim(),
            });

            setSuccessMessage(res.data?.message || "Appointment rescheduled successfully!");
            setSelectedRescheduleAppt(null);
            await loadAppointments();
        } catch (err) {
            const errMsg = err.response?.data?.message || "Failed to reschedule appointment. Please try again.";
            setRescheduleError(errMsg);
            if (selectedRescheduleAppt && rescheduleDate) {
                await fetchRescheduleSlots(selectedRescheduleAppt._id, rescheduleDate);
            }
        } finally {
            setRescheduling(false);
        }
    };

    const loadAppointments = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await api.get("/appointment/my");
            setAppointments(response.data.appointments || []);
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load appointments.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAppointments();
    }, []);

    const filtered = useMemo(() => {
        if (statusFilter === "All") return appointments;
        return appointments.filter((item) => {
            const isPassed = isAppointmentPassed(item.appointmentDate, item.appointmentTime);
            const effStatus = (item.status === "Cancelled" || item.status === "Rejected")
                ? item.status
                : isPassed
                ? "Completed"
                : item.status;
            return effStatus === statusFilter;
        });
    }, [appointments, statusFilter]);

    // Open cancellation modal and load real refund preview
    const handleOpenCancelDialog = async (appointment) => {
        setSelectedCancelAppt(appointment);
        setCancelReason("");
        setRefundPreview(null);

        if (appointment.paymentStatus === "Paid") {
            try {
                setPreviewLoading(true);
                const res = await api.get(`/payment/refund-preview/${appointment._id}`);
                setRefundPreview(res.data.refundDetails);
            } catch (err) {
                console.error("Refund preview err:", err);
            } finally {
                setPreviewLoading(false);
            }
        }
    };

    // Execute cancellation & refund
    const executeCancelAndRefund = async () => {
        if (!selectedCancelAppt) return;
        try {
            setCancelling(true);
            setError("");
            const res = await api.post(`/payment/cancel-and-refund/${selectedCancelAppt._id}`, {
                reason: cancelReason || "Patient requested cancellation",
            });

            setSuccessMessage(res.data?.message || "Appointment cancelled successfully.");
            setSelectedCancelAppt(null);
            loadAppointments();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to cancel appointment and process refund.");
        } finally {
            setCancelling(false);
        }
    };

    return (
        <DashboardLayout
            role="patient"
            title="My Appointments"
            subtitle="Book, track, manage consultations and instant cancellation refunds"
        >
            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "center" }}
                spacing={2}
                mb={3}
            >
                <Box>
                    <Typography fontSize={24} fontWeight={850} color={colors.ink}>
                        My Consultations
                    </Typography>
                    <Typography fontSize={13.5} color={colors.slate}>
                        {appointments.length} total scheduled appointments
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1.5}>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={statusFilter}
                            label="Status"
                            onChange={(e) => setStatusFilter(e.target.value)}
                            sx={{ borderRadius: 2 }}
                        >
                            <MenuItem value="All">All Statuses</MenuItem>
                            <MenuItem value="Pending">Pending</MenuItem>
                            <MenuItem value="Confirmed">Confirmed</MenuItem>
                            <MenuItem value="Completed">Completed</MenuItem>
                            <MenuItem value="Cancelled">Cancelled</MenuItem>
                            <MenuItem value="Rejected">Rejected</MenuItem>
                        </Select>
                    </FormControl>

                    <Button
                        variant="contained"
                        onClick={() => navigate("/book-appointment")}
                        sx={{
                            borderRadius: 2.2,
                            fontWeight: 700,
                            bgcolor: colors.secondary,
                            "&:hover": { bgcolor: colors.secondaryDark },
                        }}
                    >
                        Book Appointment
                    </Button>
                </Stack>
            </Stack>

            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}

            {successMessage && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setSuccessMessage("")}>
                    {successMessage}
                </Alert>
            )}

            {loading ? (
                <Box textAlign="center" py={8}>
                    <CircularProgress sx={{ color: colors.pine }} />
                    <Typography mt={2} color={colors.slate} fontSize={14}>
                        Loading your appointment history...
                    </Typography>
                </Box>
            ) : filtered.length === 0 ? (
                <Card
                    elevation={0}
                    sx={{
                        border: `1px solid ${colors.hairline}`,
                        borderRadius: 3.5,
                        bgcolor: colors.white,
                    }}
                >
                    <CardContent sx={{ py: 8, textAlign: "center" }}>
                        <CalendarMonthOutlined sx={{ fontSize: 55, color: colors.pine }} />
                        <Typography fontWeight={800} fontSize={16} color={colors.ink} mt={1.5}>
                            No appointments found
                        </Typography>
                        <Typography fontSize={13.5} color={colors.slate} mt={0.5}>
                            You have no {statusFilter === "All" ? "" : statusFilter.toLowerCase()} appointments scheduled.
                        </Typography>
                        <Button
                            variant="contained"
                            sx={{
                                mt: 2.5,
                                borderRadius: 2,
                                bgcolor: colors.pine,
                                "&:hover": { bgcolor: colors.pineDeep },
                            }}
                            onClick={() => navigate("/book-appointment")}
                        >
                            Book a Doctor Now
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                filtered.map((appointment) => {
                    const isPassed = isAppointmentPassed(appointment.appointmentDate, appointment.appointmentTime);
                    const rawStatus = appointment.status || appointment.bookingStatus || "Pending";
                    const effectiveStatus = (rawStatus === "Cancelled" || rawStatus === "Rejected")
                        ? rawStatus
                        : isPassed
                        ? "Completed"
                        : rawStatus;

                    const canCancel =
                        !isPassed &&
                        ["Pending", "Confirmed"].includes(rawStatus);

                    const fee = appointment.consultationFee || appointment.doctorId?.consultationFee || 0;
                    const paymentStatus =
                        (appointment.paymentId && typeof appointment.paymentId === "object" && appointment.paymentId.paymentStatus)
                            ? appointment.paymentId.paymentStatus
                            : (appointment.paymentStatus || "NotRequired");

                    return (
                        <Card
                            key={appointment._id}
                            elevation={0}
                            sx={{
                                mb: 2.5,
                                border: `1px solid ${colors.hairline}`,
                                borderRadius: 3.5,
                                bgcolor: colors.white,
                                transition: "all 0.2s ease-in-out",
                                "&:hover": {
                                    boxShadow: "0 6px 20px rgba(16,42,67,0.06)",
                                    borderColor: colors.pine,
                                },
                            }}
                        >
                            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                                <Stack
                                    direction={{ xs: "column", md: "row" }}
                                    justifyContent="space-between"
                                    alignItems={{ xs: "flex-start", md: "center" }}
                                    gap={2}
                                >
                                    <Box sx={{ flex: 1 }}>
                                        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" gap={1}>
                                            <EventAvailableOutlined sx={{ color: colors.pine }} />
                                            <Typography fontSize={18} fontWeight={850} color={colors.ink}>
                                                Dr. {appointment.doctorId?.doctorName?.replace(/^dr\.?\s+/i, "") || "Specialist"}
                                            </Typography>
                                            <Typography fontSize={13} color={colors.pine} fontWeight={700}>
                                                • {appointment.doctorId?.specialization || "Clinical Consultation"}
                                            </Typography>
                                        </Stack>

                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: { xs: 1.5, sm: 3 },
                                                mt: 1.5,
                                                fontSize: 13.5,
                                                color: colors.slate,
                                            }}
                                        >
                                            <Typography fontSize={13.5}>
                                                Hospital:{" "}
                                                <strong style={{ color: colors.ink }}>
                                                    {appointment.hospitalId?.hospitalName || "Medical Center"}
                                                </strong>
                                            </Typography>

                                            <Typography fontSize={13.5}>
                                                Date:{" "}
                                                <strong style={{ color: colors.ink }}>
                                                    {formatAppointmentDate(appointment.appointmentDate)}
                                                </strong>
                                            </Typography>

                                            <Typography fontSize={13.5}>
                                                Time Slot:{" "}
                                                <strong style={{ color: colors.pine }}>
                                                    {appointment.appointmentTime}
                                                </strong>
                                            </Typography>
                                        </Box>

                                        {appointment.reason && (
                                            <Typography mt={1} color={colors.slate} fontSize={13}>
                                                Reason: {appointment.reason}
                                            </Typography>
                                        )}

                                        {/* PAYMENT & REFUND SUMMARY LINE */}
                                        <Stack direction="row" spacing={1.5} alignItems="center" mt={1.5} flexWrap="wrap" gap={1}>
                                            <Typography fontSize={13} fontWeight={700} color={colors.ink}>
                                                Fee: ₹{fee}
                                            </Typography>

                                            {/* PAYMENT STATUS CHIP */}
                                            {paymentStatus === "Paid" && (
                                                <Chip
                                                    size="small"
                                                    icon={<CheckCircleOutlined fontSize="small" />}
                                                    label="Fee Paid (Online)"
                                                    sx={{
                                                        bgcolor: "#ECFDF5",
                                                        color: "#065F46",
                                                        border: "1px solid #A7F3D0",
                                                        fontWeight: 750,
                                                        fontSize: 11.5,
                                                    }}
                                                />
                                            )}

                                            {paymentStatus === "Pending" && (
                                                <Chip
                                                    size="small"
                                                    label="Payment Pending"
                                                    sx={{
                                                        bgcolor: "#FFFBEB",
                                                        color: "#B45309",
                                                        border: "1px solid #FDE68A",
                                                        fontWeight: 750,
                                                        fontSize: 11.5,
                                                    }}
                                                />
                                            )}

                                            {paymentStatus === "Refunded" && (
                                                <Chip
                                                    size="small"
                                                    icon={<ReplayOutlined fontSize="small" />}
                                                    label={`Refunded ₹${appointment.refundAmount || fee}`}
                                                    sx={{
                                                        bgcolor: "#EFF6FF",
                                                        color: "#1D4ED8",
                                                        border: "1px solid #BFDBFE",
                                                        fontWeight: 750,
                                                        fontSize: 11.5,
                                                    }}
                                                />
                                            )}

                                            {paymentStatus === "PartiallyRefunded" && (
                                                <Chip
                                                    size="small"
                                                    icon={<ReplayOutlined fontSize="small" />}
                                                    label={`Partially Refunded ₹${appointment.refundAmount}`}
                                                    sx={{
                                                        bgcolor: "#F0FDF4",
                                                        color: "#15803D",
                                                        border: "1px solid #BBF7D0",
                                                        fontWeight: 750,
                                                        fontSize: 11.5,
                                                    }}
                                                />
                                            )}

                                            {paymentStatus === "NotRequired" && (
                                                <Chip
                                                    size="small"
                                                    label="Free Consultation"
                                                    sx={{
                                                        bgcolor: "#F1F5F9",
                                                        color: "#475569",
                                                        fontWeight: 700,
                                                        fontSize: 11.5,
                                                    }}
                                                />
                                            )}

                                            {appointment.gatewayRefundId && (
                                                <Typography fontSize={11.5} fontFamily="monospace" color={colors.slate}>
                                                    Ref: {appointment.gatewayRefundId}
                                                </Typography>
                                            )}

                                            {appointment.isRescheduled && (
                                                <Stack direction="row" spacing={0.8} alignItems="center">
                                                    <Chip
                                                        size="small"
                                                        icon={<UpdateOutlined sx={{ fontSize: 13 }} />}
                                                        label={`Rescheduled${(appointment.rescheduleCount || 1) > 1 ? ` (${appointment.rescheduleCount}x)` : ""}`}
                                                        sx={{
                                                            bgcolor: "#F5F3FF",
                                                            color: "#6D28D9",
                                                            border: "1px solid #DDD6FE",
                                                            fontWeight: 750,
                                                            fontSize: 11.5,
                                                        }}
                                                    />
                                                    {appointment.rescheduleHistory && appointment.rescheduleHistory.length > 0 && (
                                                        <Button
                                                            size="small"
                                                            variant="text"
                                                            onClick={() => setSelectedHistoryAppt(appointment)}
                                                            startIcon={<HistoryOutlined sx={{ fontSize: 13 }} />}
                                                            sx={{
                                                                fontSize: 11.5,
                                                                textTransform: "none",
                                                                fontWeight: 700,
                                                                color: "#6D28D9",
                                                                p: 0,
                                                                minWidth: 0,
                                                                "&:hover": { textDecoration: "underline" },
                                                            }}
                                                        >
                                                            History ({appointment.rescheduleHistory.length})
                                                        </Button>
                                                    )}
                                                </Stack>
                                            )}
                                        </Stack>
                                    </Box>

                                    {/* STATUS & ACTIONS */}
                                    <Stack
                                        alignItems={{ xs: "flex-start", md: "flex-end" }}
                                        spacing={0.8}
                                        minWidth={160}
                                    >
                                        <Chip
                                            icon={
                                                effectiveStatus === "Pending" ? (
                                                    <HourglassEmptyOutlined sx={{ fontSize: 16 }} />
                                                ) : effectiveStatus === "Confirmed" ? (
                                                    <CheckCircleOutlined sx={{ fontSize: 16 }} />
                                                ) : undefined
                                            }
                                            label={
                                                effectiveStatus === "Pending"
                                                    ? "Pending Hospital Approval"
                                                    : effectiveStatus === "Confirmed"
                                                    ? "Confirmed"
                                                    : effectiveStatus === "Completed"
                                                    ? "Completed"
                                                    : effectiveStatus === "Cancelled"
                                                    ? "Cancelled"
                                                    : effectiveStatus === "Rejected"
                                                    ? "Rejected by Hospital"
                                                    : effectiveStatus
                                            }
                                            sx={{
                                                fontWeight: 800,
                                                fontSize: 12,
                                                bgcolor:
                                                    effectiveStatus === "Confirmed"
                                                        ? "#ECFDF5"
                                                        : effectiveStatus === "Completed"
                                                        ? "#EFF6FF"
                                                        : effectiveStatus === "Cancelled" || effectiveStatus === "Rejected"
                                                        ? "#FEF2F2"
                                                        : "#FFFBEB",
                                                color:
                                                    effectiveStatus === "Confirmed"
                                                        ? "#065F46"
                                                        : effectiveStatus === "Completed"
                                                        ? "#1D4ED8"
                                                        : effectiveStatus === "Cancelled" || effectiveStatus === "Rejected"
                                                        ? "#B91C1C"
                                                        : "#B45309",
                                                border: "1px solid",
                                                borderColor:
                                                    effectiveStatus === "Confirmed"
                                                        ? "#A7F3D0"
                                                        : effectiveStatus === "Completed"
                                                        ? "#BFDBFE"
                                                        : effectiveStatus === "Cancelled" || effectiveStatus === "Rejected"
                                                        ? "#FECACA"
                                                        : "#FDE68A",
                                            }}
                                        />

                                        {/* Status Explanatory Context Subtext */}
                                        <Typography fontSize={11.5} fontWeight={650} color={colors.slate} textAlign={{ xs: "left", md: "right" }}>
                                            {effectiveStatus === "Pending" && paymentStatus === "Paid"
                                                ? "Payment successful • Awaiting hospital review"
                                                : effectiveStatus === "Pending" && paymentStatus !== "Paid"
                                                ? "Awaiting hospital confirmation"
                                                : effectiveStatus === "Confirmed" && paymentStatus === "Paid"
                                                ? "Approved by hospital"
                                                : effectiveStatus === "Confirmed" && paymentStatus === "NotRequired"
                                                ? "Free consultation approved"
                                                : effectiveStatus === "Rejected" && paymentStatus === "Paid"
                                                ? "Rejected • 100% Refund processing"
                                                : effectiveStatus === "Cancelled" && (paymentStatus === "Refunded" || paymentStatus === "PartiallyRefunded")
                                                ? "Cancelled & refunded"
                                                : effectiveStatus === "Completed"
                                                ? "Consultation completed"
                                                : ""}
                                        </Typography>

                                        <Stack direction="row" spacing={1} alignItems="center" mt={0.5} flexWrap="wrap">
                                            {/* RESCHEDULE BUTTON */}
                                            {(() => {
                                                if (!["Pending", "Confirmed"].includes(rawStatus) || isPassed) {
                                                    return null;
                                                }
                                                const elig = getRescheduleEligibility(appointment);
                                                if (elig.eligible) {
                                                    return (
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            onClick={() => handleOpenRescheduleDialog(appointment)}
                                                            startIcon={<UpdateOutlined fontSize="small" />}
                                                            sx={{
                                                                borderRadius: 2,
                                                                fontWeight: 700,
                                                                fontSize: 12,
                                                                color: colors.pine,
                                                                borderColor: colors.pine,
                                                                "&:hover": {
                                                                    bgcolor: colors.pineSoft,
                                                                    borderColor: colors.pineDeep,
                                                                },
                                                            }}
                                                        >
                                                            Reschedule
                                                        </Button>
                                                    );
                                                } else {
                                                    return (
                                                        <Tooltip title={elig.reason} arrow>
                                                            <span>
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    disabled
                                                                    startIcon={<UpdateOutlined fontSize="small" />}
                                                                    sx={{
                                                                        borderRadius: 2,
                                                                        fontWeight: 700,
                                                                        fontSize: 12,
                                                                    }}
                                                                >
                                                                    Reschedule
                                                                </Button>
                                                            </span>
                                                        </Tooltip>
                                                    );
                                                }
                                            })()}

                                            {canCancel && (
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    onClick={() => handleOpenCancelDialog(appointment)}
                                                    sx={{
                                                        borderRadius: 2,
                                                        fontWeight: 700,
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    Cancel & Refund
                                                </Button>
                                            )}
                                        </Stack>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    );
                })
            )}

            
            {/* RESCHEDULE APPOINTMENT MODAL */}
            {selectedRescheduleAppt && (
                <Dialog
                    open={Boolean(selectedRescheduleAppt)}
                    onClose={() => !rescheduling && setSelectedRescheduleAppt(null)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: { borderRadius: 3.5, p: 1 },
                    }}
                >
                    <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <UpdateOutlined sx={{ color: colors.pine }} />
                            <Box>
                                <Typography fontWeight={850} fontSize={17} color={colors.ink}>
                                    Reschedule Appointment
                                </Typography>
                                <Typography fontSize={12} color={colors.slate}>
                                    Select a new consultation date and available time slot
                                </Typography>
                            </Box>
                        </Stack>
                        <IconButton onClick={() => setSelectedRescheduleAppt(null)} disabled={rescheduling} size="small">
                            <CloseOutlined />
                        </IconButton>
                    </DialogTitle>

                    <Divider />

                    <DialogContent sx={{ py: 2.5 }}>
                        {rescheduleError && (
                            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setRescheduleError("")}>
                                {rescheduleError}
                            </Alert>
                        )}

                        {/* DOCTOR & ORIGINAL DETAILS CARD */}
                        <Box
                            sx={{
                                p: 2,
                                mb: 2.5,
                                borderRadius: 3,
                                bgcolor: "#F8FAFC",
                                border: `1px solid ${colors.hairline}`,
                            }}
                        >
                            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
                                <Box>
                                    <Typography fontWeight={800} fontSize={15} color={colors.ink}>
                                        Dr. {selectedRescheduleAppt.doctorId?.doctorName?.replace(/^dr.?s+/i, "") || "Specialist"}
                                    </Typography>
                                    <Typography fontSize={12.5} color={colors.pine} fontWeight={700}>
                                        {selectedRescheduleAppt.doctorId?.specialization || "Clinical Consultation"} • {selectedRescheduleAppt.hospitalId?.hospitalName || "Hospital"}
                                    </Typography>
                                    <Typography fontSize={12.5} color={colors.slate} mt={0.5}>
                                        Current Slot: <strong>{formatAppointmentDate(selectedRescheduleAppt.appointmentDate)}</strong> at <strong>{selectedRescheduleAppt.appointmentTime}</strong>
                                    </Typography>
                                </Box>

                                <Box textAlign={{ xs: "left", sm: "right" }}>
                                    <Typography fontSize={13} fontWeight={750} color={colors.ink}>
                                        Fee: ₹{selectedRescheduleAppt.consultationFee || 0}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label="Fee Preserved (No Double Charge)"
                                        sx={{
                                            bgcolor: "#ECFDF5",
                                            color: "#065F46",
                                            fontWeight: 750,
                                            fontSize: 11,
                                            mt: 0.5,
                                        }}
                                    />
                                </Box>
                            </Stack>
                        </Box>

                        {/* STEP 1: SELECT NEW DATE */}
                        <Box mb={2.5}>
                            <Typography fontSize={13.5} fontWeight={800} color={colors.ink} mb={1}>
                                Step 1: Choose New Date
                            </Typography>
                            <TextField
                                type="date"
                                fullWidth
                                size="small"
                                value={rescheduleDate}
                                onChange={(e) => handleRescheduleDateChange(e.target.value)}
                                inputProps={{
                                    min: new Date().toISOString().split("T")[0],
                                }}
                                helperText="Doctor's real-time schedule will load automatically for the selected date"
                            />
                        </Box>

                        {/* STEP 2: SELECT NEW TIME SLOT */}
                        <Box mb={2.5}>
                            <Typography fontSize={13.5} fontWeight={800} color={colors.ink} mb={1}>
                                Step 2: Choose Available Time Slot
                            </Typography>

                            {slotsLoading ? (
                                <Box py={3} textAlign="center">
                                    <CircularProgress size={24} sx={{ color: colors.pine }} />
                                    <Typography fontSize={12.5} color={colors.slate} mt={1}>
                                        Checking doctor availability & blocked slots...
                                    </Typography>
                                </Box>
                            ) : rescheduleSlots.length === 0 ? (
                                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                    {rescheduleNotice || "No slots available on this date. Doctor may not be consulting or is on leave."}
                                </Alert>
                            ) : (
                                <Box>
                                    {rescheduleNotice && (
                                        <Typography fontSize={12} color={colors.slate} mb={1.5}>
                                            {rescheduleNotice}
                                        </Typography>
                                    )}
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(auto-fill, minmax(95px, 1fr))",
                                            gap: 1.2,
                                        }}
                                    >
                                        {rescheduleSlots.map((slot) => {
                                            const isSelected = rescheduleTime === slot.time;
                                            return (
                                                <Button
                                                    key={slot.time}
                                                    disabled={!slot.available}
                                                    variant={isSelected ? "contained" : "outlined"}
                                                    onClick={() => setRescheduleTime(slot.time)}
                                                    size="small"
                                                    sx={{
                                                        borderRadius: 2,
                                                        fontWeight: 750,
                                                        fontSize: 12,
                                                        py: 0.8,
                                                        bgcolor: isSelected
                                                            ? colors.pine
                                                            : slot.available
                                                            ? "#FFFFFF"
                                                            : "#F1F5F9",
                                                        color: isSelected
                                                            ? "#FFFFFF"
                                                            : slot.available
                                                            ? colors.ink
                                                            : "#94A3B8",
                                                        borderColor: isSelected
                                                            ? colors.pine
                                                            : slot.available
                                                            ? colors.hairline
                                                            : "#E2E8F0",
                                                        "&:hover": {
                                                            bgcolor: isSelected
                                                                ? colors.pineDeep
                                                                : slot.available
                                                                ? colors.pineSoft
                                                                : "#F1F5F9",
                                                            borderColor: colors.pine,
                                                        },
                                                    }}
                                                >
                                                    {slot.time}
                                                </Button>
                                            );
                                        })}
                                    </Box>
                                </Box>
                            )}
                        </Box>

                        {/* STEP 3: REASON (OPTIONAL) */}
                        <Box mb={2.5}>
                            <Typography fontSize={13.5} fontWeight={800} color={colors.ink} mb={1}>
                                Step 3: Reason for Rescheduling (Optional)
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                minRows={2}
                                placeholder="e.g. Work commitment conflict, feeling unwell, requested earlier slot..."
                                value={rescheduleReason}
                                onChange={(e) => setRescheduleReason(e.target.value)}
                            />
                        </Box>

                        {/* STEP 4: COMPARISON SUMMARY */}
                        {rescheduleTime && (
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 3,
                                    bgcolor: "#F0FDF4",
                                    border: "1px solid #BBF7D0",
                                }}
                            >
                                <Typography fontWeight={800} fontSize={13} color="#166534" mb={1}>
                                    Rescheduling Confirmation Summary
                                </Typography>
                                <Stack direction={{ xs: "column", sm: "row" }} alignItems="center" spacing={2} justifyContent="space-between">
                                    <Box>
                                        <Typography fontSize={12} color={colors.slate}>
                                            From (Current Slot):
                                        </Typography>
                                        <Typography fontSize={13.5} fontWeight={800} color={colors.ink}>
                                            {formatAppointmentDate(selectedRescheduleAppt.appointmentDate)} at {selectedRescheduleAppt.appointmentTime}
                                        </Typography>
                                    </Box>

                                    <ArrowForwardOutlined sx={{ color: "#166534", display: { xs: "none", sm: "block" } }} />

                                    <Box>
                                        <Typography fontSize={12} color="#166534">
                                            To (New Slot):
                                        </Typography>
                                        <Typography fontSize={13.5} fontWeight={800} color="#166534">
                                            {formatAppointmentDate(rescheduleDate)} at {rescheduleTime}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        )}
                    </DialogContent>

                    <DialogActions sx={{ p: 2.5, pt: 0, justifyContent: "space-between" }}>
                        <Button
                            variant="outlined"
                            disabled={rescheduling}
                            onClick={() => setSelectedRescheduleAppt(null)}
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            disabled={rescheduling || !rescheduleTime || !rescheduleDate}
                            onClick={executeReschedule}
                            sx={{
                                borderRadius: 2,
                                fontWeight: 800,
                                px: 3,
                                bgcolor: colors.pine,
                                "&:hover": { bgcolor: colors.pineDeep },
                            }}
                        >
                            {rescheduling ? "Securing Slot..." : "Confirm Reschedule"}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* RESCHEDULE HISTORY MODAL */}
            {selectedHistoryAppt && (
                <Dialog
                    open={Boolean(selectedHistoryAppt)}
                    onClose={() => setSelectedHistoryAppt(null)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: { borderRadius: 3.5, p: 1 },
                    }}
                >
                    <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <HistoryOutlined sx={{ color: colors.pine }} />
                            <Typography fontWeight={850} fontSize={17} color={colors.ink}>
                                Reschedule Audit History
                            </Typography>
                        </Stack>
                        <IconButton onClick={() => setSelectedHistoryAppt(null)} size="small">
                            <CloseOutlined />
                        </IconButton>
                    </DialogTitle>

                    <Divider />

                    <DialogContent sx={{ py: 2.5 }}>
                        <Typography fontSize={13.5} color={colors.slate} mb={2}>
                            Complete history of schedule modifications for this consultation:
                        </Typography>

                        {(!selectedHistoryAppt.rescheduleHistory || selectedHistoryAppt.rescheduleHistory.length === 0) ? (
                            <Typography fontSize={13} color={colors.slate}>
                                No previous rescheduling records on file.
                            </Typography>
                        ) : (
                            <Stack spacing={2}>
                                {selectedHistoryAppt.rescheduleHistory.map((h, idx) => (
                                    <Box
                                        key={idx}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2.5,
                                            border: `1px solid ${colors.hairline}`,
                                            bgcolor: "#FAFAFA",
                                        }}
                                    >
                                        <Stack direction="row" justifyContent="space-between" mb={1}>
                                            <Chip
                                                size="small"
                                                label={`Modification #${idx + 1}`}
                                                sx={{ fontWeight: 800, fontSize: 11, bgcolor: "#EEF2F6" }}
                                            />
                                            <Typography fontSize={11.5} color={colors.slate}>
                                                {h.rescheduledAt ? new Date(h.rescheduledAt).toLocaleString() : "—"}
                                            </Typography>
                                        </Stack>

                                        <Stack direction="row" spacing={1.5} alignItems="center" my={1}>
                                            <Typography fontSize={13} color={colors.slate}>
                                                From: <strong>{formatAppointmentDate(h.oldDate)} ({h.oldTime})</strong>
                                            </Typography>
                                            <ArrowForwardOutlined sx={{ fontSize: 14, color: colors.slate }} />
                                            <Typography fontSize={13} color={colors.ink} fontWeight={750}>
                                                To: <strong>{formatAppointmentDate(h.newDate)} ({h.newTime})</strong>
                                            </Typography>
                                        </Stack>

                                        {h.reason && (
                                            <Typography fontSize={12} color={colors.slate} mt={0.5}>
                                                Reason: <em>"{h.reason}"</em>
                                            </Typography>
                                        )}
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </DialogContent>

                    <DialogActions sx={{ p: 2, pt: 0 }}>
                        <Button
                            variant="contained"
                            onClick={() => setSelectedHistoryAppt(null)}
                            sx={{
                                borderRadius: 2,
                                fontWeight: 700,
                                bgcolor: colors.pine,
                                "&:hover": { bgcolor: colors.pineDeep },
                            }}
                        >
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* CANCELLATION & REFUND POLICY MODAL */}
            {selectedCancelAppt && (
                <Dialog
                    open={Boolean(selectedCancelAppt)}
                    onClose={() => setSelectedCancelAppt(null)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: { borderRadius: 3.5, p: 1 },
                    }}
                >
                    <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <WarningAmberOutlined color="warning" />
                            <Typography fontWeight={850} fontSize={17} color={colors.ink}>
                                Cancel Appointment & Review Refund
                            </Typography>
                        </Stack>
                        <IconButton onClick={() => setSelectedCancelAppt(null)} size="small">
                            <CloseOutlined />
                        </IconButton>
                    </DialogTitle>

                    <Divider />

                    <DialogContent sx={{ py: 2.5 }}>
                        <Typography fontSize={14} color={colors.ink} mb={2}>
                            You are requesting cancellation for consultation with{" "}
                            <strong>
                                Dr. {selectedCancelAppt.doctorId?.doctorName?.replace(/^dr\.?\s+/i, "")}
                            </strong>{" "}
                            on {formatAppointmentDate(selectedCancelAppt.appointmentDate)} at{" "}
                            {selectedCancelAppt.appointmentTime}.
                        </Typography>

                        {/* REFUND PREVIEW BOX */}
                        {previewLoading ? (
                            <Box py={3} textAlign="center">
                                <CircularProgress size={24} sx={{ color: colors.pine }} />
                                <Typography fontSize={13} color={colors.slate} mt={1}>
                                    Checking cancellation policy and calculating refund...
                                </Typography>
                            </Box>
                        ) : selectedCancelAppt.paymentStatus === "Paid" && refundPreview ? (
                            <Box
                                sx={{
                                    p: 2.5,
                                    mb: 2.5,
                                    borderRadius: 3,
                                    bgcolor: refundPreview.refundAmount > 0 ? "#F0FDF4" : "#FEF2F2",
                                    border: `1px solid ${refundPreview.refundAmount > 0 ? "#BBF7D0" : "#FECACA"}`,
                                }}
                            >
                                <Typography
                                    fontWeight={800}
                                    fontSize={14.5}
                                    color={refundPreview.refundAmount > 0 ? "#166534" : "#991B1B"}
                                    mb={1}
                                >
                                    Refund Breakdown ({refundPreview.tierApplied})
                                </Typography>

                                <Stack spacing={1}>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography fontSize={13} color={colors.slate}>
                                            Consultation Fee Paid:
                                        </Typography>
                                        <Typography fontSize={13} fontWeight={700}>
                                            ₹{selectedCancelAppt.consultationFee || 0}
                                        </Typography>
                                    </Stack>

                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography fontSize={13} color={colors.slate}>
                                            Refund Rate:
                                        </Typography>
                                        <Typography fontSize={13} fontWeight={700} color={refundPreview.refundPercentage > 0 ? "#166534" : "#991B1B"}>
                                            {refundPreview.refundPercentage}%
                                        </Typography>
                                    </Stack>

                                    <Divider />

                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography fontSize={14} fontWeight={800} color={refundPreview.refundAmount > 0 ? "#166534" : "#991B1B"}>
                                            Total Refundable Amount:
                                        </Typography>
                                        <Typography fontSize={16} fontWeight={900} color={refundPreview.refundAmount > 0 ? "#166534" : "#991B1B"}>
                                            ₹{refundPreview.refundAmount}
                                        </Typography>
                                    </Stack>
                                </Stack>

                                <Typography fontSize={12} color={colors.slate} mt={1.5}>
                                    Policy: {refundPreview.policyDescription}
                                </Typography>
                            </Box>
                        ) : (
                            <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
                                This appointment does not have an online payment fee or is free of charge.
                            </Alert>
                        )}

                        <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            label="Reason for cancellation (optional)"
                            placeholder="e.g. Schedule conflict, feeling better, doctor requested change..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />
                    </DialogContent>

                    <DialogActions sx={{ p: 2.5, pt: 0, justifyContent: "space-between" }}>
                        <Button
                            variant="outlined"
                            onClick={() => setSelectedCancelAppt(null)}
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                            Keep Appointment
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            disabled={cancelling}
                            onClick={executeCancelAndRefund}
                            sx={{ borderRadius: 2, fontWeight: 800, px: 3 }}
                        >
                            {cancelling ? "Processing Refund..." : "Confirm Cancellation"}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </DashboardLayout>
    );
}
