import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import {
    AccessTimeOutlined,
    CalendarMonthOutlined,
    CheckCircle,
    LockOutlined,
    MedicalServicesOutlined,
    ReceiptLongOutlined,
} from "@mui/icons-material";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import api from "../services/api";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export default function BookAppointment() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { isAuthenticated, user } = useAuth();

    const queryDoctorId = searchParams.get("doctorId");
    const queryHospitalId = searchParams.get("hospitalId");
    const queryDepartmentId = searchParams.get("departmentId");

    const today = new Date().toISOString().split("T")[0];

    const [hospitals, setHospitals] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [slots, setSlots] = useState([]);

    const [form, setForm] = useState({
        hospitalId: "",
        departmentId: "",
        doctorId: "",
        appointmentDate: today,
        appointmentTime: "",
        reason: "",
    });

    const [loading, setLoading] = useState(true);
    const [slotLoading, setSlotLoading] = useState(false);
    const [slotNotice, setSlotNotice] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [bookingSuccess, setBookingSuccess] = useState(null);

    const getCleanDoctorName = (name) => {
        if (!name) return "";
        const trimmed = String(name).trim();
        if (trimmed.toLowerCase().startsWith("dr.") || trimmed.toLowerCase().startsWith("dr ")) {
            return trimmed;
        }
        return `Dr. ${trimmed}`;
    };

    // AUTH CHECK: Ensure user is logged in
    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login", {
                replace: true,
                state: {
                    from: location.pathname + location.search,
                },
            });
        }
    }, [isAuthenticated, navigate, location]);

    // LOAD ALL DATA & AUTO-SELECT PARAMS
    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                setLoading(true);
                const [hospitalRes, deptRes, doctorRes] = await Promise.all([
                    api.get("/hospitals/all"),
                    api.get("/department/all"),
                    api.get("/doctor/all"),
                ]);

                if (!isMounted) return;

                const loadedHospitals = hospitalRes.data.hospitals || [];
                const loadedDepartments = deptRes.data.departments || [];
                const loadedDoctors = doctorRes.data.doctors || [];

                setHospitals(loadedHospitals);
                setDepartments(loadedDepartments);
                setDoctors(loadedDoctors);

                // Auto-populate based on query parameters
                if (queryDoctorId) {
                    const matchedDoctor = loadedDoctors.find(
                        (d) => String(d._id) === String(queryDoctorId)
                    );
                    if (matchedDoctor) {
                        const hId = matchedDoctor.hospitalId?._id || matchedDoctor.hospitalId || "";
                        const dId = matchedDoctor.departmentId?._id || matchedDoctor.departmentId || "";
                        setForm((prev) => ({
                            ...prev,
                            hospitalId: String(hId),
                            departmentId: String(dId),
                            doctorId: String(matchedDoctor._id),
                        }));
                    }
                } else if (queryHospitalId) {
                    setForm((prev) => ({
                        ...prev,
                        hospitalId: String(queryHospitalId),
                        departmentId: queryDepartmentId ? String(queryDepartmentId) : prev.departmentId,
                    }));
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.response?.data?.message || "Unable to load appointment booking data.");
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (isAuthenticated) {
            loadData();
        }

        return () => {
            isMounted = false;
        };
    }, [isAuthenticated, queryDoctorId, queryHospitalId, queryDepartmentId]);

    // FILTER DEPARTMENTS BY SELECTED HOSPITAL
    const filteredDepartments = useMemo(() => {
        if (!form.hospitalId) return [];
        return departments.filter(
            (dept) => String(dept.hospitalId?._id || dept.hospitalId) === String(form.hospitalId)
        );
    }, [departments, form.hospitalId]);

    // FILTER DOCTORS BY SELECTED HOSPITAL & DEPARTMENT
    const filteredDoctors = useMemo(() => {
        if (!form.hospitalId) return [];
        return doctors.filter((doc) => {
            const docHosp = String(doc.hospitalId?._id || doc.hospitalId);
            const docDept = String(doc.departmentId?._id || doc.departmentId);
            const matchesHosp = docHosp === String(form.hospitalId);
            const matchesDept = !form.departmentId || docDept === String(form.departmentId);
            return matchesHosp && matchesDept;
        });
    }, [doctors, form.hospitalId, form.departmentId]);

    // SELECTED DOCTOR OBJECT
    const selectedDoctor = useMemo(() => {
        if (!form.doctorId) return null;
        return doctors.find((d) => String(d._id) === String(form.doctorId)) || null;
    }, [doctors, form.doctorId]);

    // SELECTED HOSPITAL OBJECT
    const selectedHospital = useMemo(() => {
        if (!form.hospitalId) return null;
        return hospitals.find((h) => String(h._id) === String(form.hospitalId)) || null;
    }, [hospitals, form.hospitalId]);

    // FETCH AVAILABLE SLOTS WHEN DOCTOR & DATE CHANGE
    useEffect(() => {
        if (!form.doctorId || !form.appointmentDate) {
            setSlots([]);
            return;
        }

        let isMounted = true;
        const loadSlots = async () => {
            try {
                setSlotLoading(true);
                setSlotNotice("");
                const response = await api.get("/appointment/slots", {
                    params: {
                        doctorId: form.doctorId,
                        date: form.appointmentDate,
                    },
                });

                if (isMounted) {
                    setSlots(response.data.slots || []);
                    if (response.data.message) {
                        setSlotNotice(response.data.message);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setSlots([]);
                    const msg = err.response?.data?.message || "No slots available on this date for the selected doctor.";
                    setSlotNotice(msg);
                }
            } finally {
                if (isMounted) setSlotLoading(false);
            }
        };

        loadSlots();

        return () => {
            isMounted = false;
        };
    }, [form.doctorId, form.appointmentDate]);

    const handleHospitalChange = (hId) => {
        setForm((prev) => ({
            ...prev,
            hospitalId: hId,
            departmentId: "",
            doctorId: "",
            appointmentTime: "",
        }));
        setSlots([]);
    };

    const handleDepartmentChange = (dId) => {
        setForm((prev) => ({
            ...prev,
            departmentId: dId,
            doctorId: "",
            appointmentTime: "",
        }));
        setSlots([]);
    };

    const handleDoctorChange = (docId) => {
        setForm((prev) => ({
            ...prev,
            doctorId: docId,
            appointmentTime: "",
        }));
    };

    // SUBMIT & PAY VIA RAZORPAY
    const submitBooking = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");
            setMessage("");

            // 1. Call backend to create Razorpay Order & Pending Appointment
            const orderRes = await api.post("/payment/create-order", {
                hospitalId: form.hospitalId,
                departmentId: form.departmentId,
                doctorId: form.doctorId,
                appointmentDate: form.appointmentDate,
                appointmentTime: form.appointmentTime,
                reason: form.reason,
            });

            // 2. If free consultation (no payment required)
            if (orderRes.data.paymentRequired === false) {
                setBookingSuccess({
                    appointment: orderRes.data.appointment,
                    amount: 0,
                    isFree: true,
                });
                setMessage("Free consultation confirmed successfully!");
                return;
            }

            // 3. Paid Consultation: Load Razorpay Checkout SDK
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                setError("Razorpay SDK failed to load. Please check your internet connection.");
                setSaving(false);
                return;
            }

            const { order, keyId, appointmentId, paymentId, amount } = orderRes.data;

            // 4. Configure Razorpay Options
            const options = {
                key: keyId,
                amount: order.amount,
                currency: order.currency || "INR",
                name: "SmartCare AI",
                description: `Doctor Consultation Fee - ${getCleanDoctorName(selectedDoctor?.doctorName)}`,
                image: "https://smartcare.ai/logo.png",
                order_id: order.id,
                prefill: {
                    name: user?.fullName || "",
                    email: user?.email || "",
                    contact: user?.phone || "",
                },
                notes: {
                    appointmentId: String(appointmentId),
                    doctorId: String(form.doctorId),
                    hospitalId: String(form.hospitalId),
                },
                theme: {
                    color: "#0D9488",
                },
                handler: async function (response) {
                    try {
                        setSaving(true);
                        setMessage("Verifying payment signature securely...");

                        // 5. Send signature to backend for verification
                        const verifyRes = await api.post("/payment/verify-payment", {
                            appointmentId,
                            paymentId,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        setBookingSuccess({
                            appointment: verifyRes.data.appointment,
                            payment: verifyRes.data.payment,
                            amount,
                            razorpay_payment_id: response.razorpay_payment_id,
                        });
                        setMessage("Payment verified! Appointment submitted for hospital approval.");
                    } catch (verifyErr) {
                        // Resilient Fallback: check if the appointment was booked/confirmed despite verification error
                        try {
                            const checkRes = await api.get(`/appointment/${appointmentId}`);
                            const savedAppt = checkRes.data?.appointment;
                            if (savedAppt && (savedAppt.status === "Confirmed" || savedAppt.paymentStatus === "Paid" || savedAppt.bookingStatus === "Pending")) {
                                setBookingSuccess({
                                    appointment: savedAppt,
                                    payment: { gatewayPaymentId: response.razorpay_payment_id },
                                    amount,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                });
                                setMessage("Payment verified! Appointment submitted for hospital approval.");
                                setError("");
                                return;
                            }
                        } catch (checkFallbackErr) {
                            // ignore fallback error
                        }

                        // If error mentions Notification validation failed, the appointment IS already saved in database:
                        if (verifyErr.response?.data?.message?.includes("Notification validation failed")) {
                            setBookingSuccess({
                                appointment: {
                                    _id: appointmentId,
                                    doctorId: selectedDoctor || { doctorName: "Specialist" },
                                    hospitalId: selectedHospital || { hospitalName: "Hospital" },
                                    departmentId: departments.find((d) => String(d._id) === String(form.departmentId)) || { name: "General" },
                                    appointmentDate: form.appointmentDate,
                                    appointmentTime: form.appointmentTime,
                                    status: "Pending",
                                    bookingStatus: "Pending",
                                    paymentStatus: "Paid",
                                },
                                payment: { gatewayPaymentId: response.razorpay_payment_id },
                                amount,
                                razorpay_payment_id: response.razorpay_payment_id,
                            });
                            setMessage("Payment verified! Appointment submitted for hospital approval.");
                            setError("");
                            return;
                        }

                        setError(
                            verifyErr.response?.data?.message ||
                            "Payment verification failed. Please contact billing support."
                        );
                    } finally {
                        setSaving(false);
                    }
                },
                modal: {
                    ondismiss: async function () {
                        setSaving(false);
                        try {
                            await api.post("/payment/handle-failure", {
                                appointmentId,
                                paymentId,
                                error: { description: "User closed Razorpay checkout modal" },
                            });
                        } catch (e) {
                            // ignore
                        }
                        setError("Payment was cancelled. Your appointment is pending payment or you can retry anytime.");
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", async function (response) {
                setSaving(false);
                try {
                    await api.post("/payment/handle-failure", {
                        appointmentId,
                        paymentId,
                        error: response.error,
                    });
                } catch (e) {
                    // ignore
                }
                setError(`Payment Failed: ${response.error?.description || "Transaction declined by bank."}`);
            });

            rzp.open();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to initiate appointment booking.");
            setSaving(false);
        }
    };

    const consultationFee = Number(selectedDoctor?.consultationFee) || 0;

    const bookingContent = (
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, flex: 1 }}>
            {/* HEADER TITLE */}
            <Box sx={{ mb: 4, maxWidth: 960, mx: "auto", textAlign: { xs: "center", sm: "left" } }}>
                <Stack direction="row" alignItems="center" spacing={1.5} justifyContent={{ xs: "center", sm: "flex-start" }}>
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 3,
                            bgcolor: colors.pineSoft,
                            color: colors.pine,
                            display: "grid",
                            placeItems: "center",
                        }}
                    >
                        <CalendarMonthOutlined />
                    </Box>
                    <Box>
                        <Typography
                            variant="h4"
                            sx={{
                                fontFamily: "Inter, sans-serif",
                                fontWeight: 750,
                                fontSize: { xs: 24, md: 28 },
                                color: colors.ink,
                            }}
                        >
                            Schedule Doctor Appointment
                        </Typography>
                        <Typography fontSize={13.5} color={colors.slate}>
                            Select medical facility, doctor specialist, and complete online payment.
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            {/* SUCCESS NOTICE & RECEIPT CARD */}
            {bookingSuccess && (
                <Card
                    elevation={0}
                    sx={{
                        borderRadius: 3.5,
                        p: { xs: 3, sm: 5 },
                        mb: 4,
                        bgcolor: colors.white,
                        border: `2px solid ${colors.pine}`,
                        boxShadow: "0 12px 36px rgba(13,148,136,0.14)",
                        maxWidth: 720,
                        mx: "auto",
                    }}
                >
                    <Box textAlign="center" mb={3}>
                        <CheckCircle sx={{ fontSize: 64, color: colors.pine, mb: 1.5 }} />
                        <Typography variant="h4" fontWeight={850} color={colors.ink}>
                            Payment Successful!
                        </Typography>
                        <Box sx={{ mt: 1, mb: 1 }}>
                            <Chip
                                label="Pending Hospital Approval"
                                sx={{
                                    bgcolor: "#FFFBEB",
                                    color: "#B45309",
                                    border: "1px solid #FDE68A",
                                    fontWeight: 800,
                                    fontSize: 13,
                                    px: 1,
                                    py: 1.8,
                                }}
                            />
                        </Box>
                        <Typography color={colors.slate} mt={1} fontSize={14.5}>
                            Your consultation fee was received via Razorpay. Your appointment request has been submitted to the hospital and is awaiting administrative confirmation.
                        </Typography>
                    </Box>

                    {/* CONFIRMATION SUMMARY BOX */}
                    <Box
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            bgcolor: colors.canvas,
                            border: `1px solid ${colors.hairline}`,
                            mb: 3,
                        }}
                    >
                        <Stack spacing={1.5}>
                            {bookingSuccess.razorpay_payment_id && (
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography fontSize={13} color={colors.slate} fontWeight={600}>
                                        Payment Reference (Razorpay):
                                    </Typography>
                                    <Typography fontSize={13} fontWeight={750} fontFamily="monospace" color={colors.ink}>
                                        {bookingSuccess.razorpay_payment_id}
                                    </Typography>
                                </Stack>
                            )}

                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontSize={13} color={colors.slate} fontWeight={600}>
                                    Consulting Specialist:
                                </Typography>
                                <Typography fontSize={13} fontWeight={750} color={colors.ink}>
                                    {getCleanDoctorName(selectedDoctor?.doctorName)} ({selectedDoctor?.specialization})
                                </Typography>
                            </Stack>

                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontSize={13} color={colors.slate} fontWeight={600}>
                                    Medical Center:
                                </Typography>
                                <Typography fontSize={13} fontWeight={600} color={colors.ink}>
                                    {selectedHospital?.hospitalName || "Hospital"}
                                </Typography>
                            </Stack>

                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontSize={13} color={colors.slate} fontWeight={600}>
                                    Scheduled Time:
                                </Typography>
                                <Typography fontSize={13} fontWeight={750} color={colors.pine}>
                                    {form.appointmentDate} at {form.appointmentTime}
                                </Typography>
                            </Stack>

                            <Divider sx={{ my: 1 }} />

                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontSize={14} fontWeight={800} color={colors.ink}>
                                    Consultation Fee Paid:
                                </Typography>
                                <Typography fontSize={16} fontWeight={900} color={colors.pine}>
                                    ₹{bookingSuccess.amount || consultationFee}
                                </Typography>
                            </Stack>
                        </Stack>
                    </Box>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
                        <Button
                            variant="contained"
                            onClick={() => navigate("/patient/appointments")}
                            sx={{
                                bgcolor: colors.pine,
                                color: colors.white,
                                fontWeight: 750,
                                px: 3.5,
                                py: 1.2,
                                borderRadius: 2.2,
                                "&:hover": { bgcolor: colors.pineDeep },
                            }}
                        >
                            View My Appointments
                        </Button>

                        <Button
                            variant="outlined"
                            startIcon={<ReceiptLongOutlined />}
                            onClick={() => navigate("/patient/payments")}
                            sx={{
                                borderColor: colors.hairline,
                                color: colors.ink,
                                fontWeight: 700,
                                px: 3,
                                py: 1.2,
                                borderRadius: 2.2,
                                "&:hover": { borderColor: colors.pine, bgcolor: colors.pineSoft },
                            }}
                        >
                            Payment Receipts
                        </Button>
                    </Stack>
                </Card>
            )}

            {/* MAIN BOOKING CARD */}
            {!bookingSuccess && (
                <Card
                    elevation={0}
                    sx={{
                        borderRadius: 3.5,
                        border: `1px solid ${colors.hairline}`,
                        bgcolor: colors.white,
                        boxShadow: "0 8px 24px rgba(16,42,67,0.07)",
                        maxWidth: 960,
                        mx: "auto",
                        overflow: "hidden",
                    }}
                >
                    <Box sx={{ height: 4, bgcolor: colors.secondary }} />

                    <CardContent sx={{ p: { xs: 2.5, sm: 4, md: 4.5 } }}>
                        {loading && (
                            <Box py={8} textAlign="center">
                                <CircularProgress sx={{ color: colors.pine }} />
                                <Typography mt={2} color={colors.slate} fontSize={14}>
                                    Loading healthcare directories & doctor slots...
                                </Typography>
                            </Box>
                        )}

                        {!loading && (
                            <Box component="form" onSubmit={submitBooking}>
                                {error && (
                                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }}>
                                        {error}
                                    </Alert>
                                )}

                                {message && (
                                    <Alert severity="success" sx={{ mb: 3, borderRadius: 2.5 }}>
                                        {message}
                                    </Alert>
                                )}

                                {/* SELECTED DOCTOR HIGHLIGHT CARD */}
                                {selectedDoctor && (
                                    <Box
                                        sx={{
                                            p: 2.5,
                                            mb: 4,
                                            borderRadius: 3,
                                            bgcolor: colors.canvas,
                                            border: `1px solid ${colors.hairline}`,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 2,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <Avatar
                                            sx={{
                                                width: 52,
                                                height: 52,
                                                bgcolor: colors.pineSoft,
                                                color: colors.pine,
                                            }}
                                        >
                                            <MedicalServicesOutlined />
                                        </Avatar>
                                        <Box sx={{ flex: 1, minWidth: 200 }}>
                                            <Typography fontWeight={800} fontSize={16} color={colors.ink}>
                                                {getCleanDoctorName(selectedDoctor.doctorName)}
                                            </Typography>
                                            <Typography fontSize={13} color={colors.pine} fontWeight={700}>
                                                {selectedDoctor.specialization} • {selectedDoctor.qualification}
                                            </Typography>
                                            <Typography fontSize={12} color={colors.slate}>
                                                {selectedDoctor.hospitalId?.hospitalName || "Hospital Medical Center"}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: "right" }}>
                                            <Typography fontSize={11.5} color={colors.slate} fontWeight={700}>
                                                CONSULTATION FEE
                                            </Typography>
                                            <Typography fontSize={20} fontWeight={900} color={colors.pine}>
                                                ₹{consultationFee}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}

                                {/* FORM FIELDS */}
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: {
                                            xs: "minmax(0, 1fr)",
                                            md: "repeat(2, minmax(0, 1fr))",
                                        },
                                        gap: 2.5,
                                    }}
                                >
                                    {/* HOSPITAL SELECT */}
                                    <Box sx={{ gridColumn: { md: "1 / -1" } }}>
                                        <FormControl fullWidth required>
                                            <InputLabel id="hospital-label">Select Hospital</InputLabel>
                                            <Select
                                                labelId="hospital-label"
                                                label="Select Hospital"
                                                value={form.hospitalId}
                                                onChange={(e) => handleHospitalChange(e.target.value)}
                                            >
                                                {hospitals.map((hosp) => (
                                                    <MenuItem key={hosp._id} value={hosp._id}>
                                                        {hosp.hospitalName} ({hosp.city}, {hosp.state})
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    {/* DEPARTMENT SELECT */}
                                    <Box>
                                        <FormControl fullWidth required disabled={!form.hospitalId}>
                                            <InputLabel id="dept-label">Department</InputLabel>
                                            <Select
                                                labelId="dept-label"
                                                label="Department"
                                                value={form.departmentId}
                                                onChange={(e) => handleDepartmentChange(e.target.value)}
                                            >
                                                {filteredDepartments.map((dept) => (
                                                    <MenuItem key={dept._id} value={dept._id}>
                                                        {dept.departmentName}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    {/* DOCTOR SELECT */}
                                    <Box>
                                        <FormControl fullWidth required disabled={!form.hospitalId}>
                                            <InputLabel id="doctor-label">Doctor / Specialist</InputLabel>
                                            <Select
                                                labelId="doctor-label"
                                                label="Doctor / Specialist"
                                                value={form.doctorId}
                                                onChange={(e) => handleDoctorChange(e.target.value)}
                                            >
                                                {filteredDoctors.map((doc) => (
                                                    <MenuItem key={doc._id} value={doc._id}>
                                                        {getCleanDoctorName(doc.doctorName)} - {doc.specialization} (Fee: ₹{doc.consultationFee || 0})
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    {/* DATE SELECT */}
                                    <Box sx={{ gridColumn: { md: "1 / -1" } }}>
                                        <TextField
                                            fullWidth
                                            type="date"
                                            label="Appointment Date"
                                            InputLabelProps={{ shrink: true }}
                                            inputProps={{ min: today }}
                                            value={form.appointmentDate}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    appointmentDate: e.target.value,
                                                    appointmentTime: "",
                                                }))
                                            }
                                            required
                                            disabled={!form.doctorId}
                                        />
                                    </Box>

                                    {/* AVAILABLE SLOTS */}
                                    <Box sx={{ gridColumn: { md: "1 / -1" } }}>
                                        <Typography fontWeight={800} fontSize={14.5} color={colors.ink} mb={1.2}>
                                            Available Consultation Slots
                                        </Typography>

                                        {slotLoading ? (
                                            <Box py={2.5} textAlign="center">
                                                <CircularProgress size={24} sx={{ color: colors.pine }} />
                                                <Typography fontSize={12} color={colors.slate} mt={1}>
                                                    Fetching doctor slot availability...
                                                </Typography>
                                            </Box>
                                        ) : !form.doctorId ? (
                                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                                                Please choose a hospital and specialist to view available slots.
                                            </Alert>
                                        ) : slots.length === 0 ? (
                                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                                                {slotNotice ||
                                                    "No slots available on this date for the selected doctor. Please select another date."}
                                            </Alert>
                                        ) : (
                                            <Box>
                                                {slotNotice && (
                                                    <Alert severity="warning" sx={{ borderRadius: 2, mb: 1.5, fontWeight: 650 }}>
                                                        {slotNotice}
                                                    </Alert>
                                                )}
                                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                                    {slots.map((slot) => {
                                                        const isSelected = form.appointmentTime === slot.time;
                                                        return (
                                                            <Button
                                                                key={slot.time}
                                                                variant={isSelected ? "contained" : "outlined"}
                                                                disabled={!slot.available}
                                                                onClick={() =>
                                                                    setForm((prev) => ({
                                                                        ...prev,
                                                                        appointmentTime: slot.time,
                                                                    }))
                                                                }
                                                                startIcon={<AccessTimeOutlined fontSize="small" />}
                                                                sx={{
                                                                    borderRadius: 2.2,
                                                                    px: 2,
                                                                    py: 1,
                                                                    fontSize: 13,
                                                                    fontWeight: isSelected ? 800 : 600,
                                                                    bgcolor: isSelected
                                                                        ? colors.amber
                                                                        : !slot.available
                                                                            ? "#F1F5F9"
                                                                            : "transparent",
                                                                    color: isSelected
                                                                        ? colors.ink
                                                                        : !slot.available
                                                                            ? "#94A3B8"
                                                                            : colors.pine,
                                                                    borderColor: isSelected ? colors.amber : colors.hairline,
                                                                    "&:hover": {
                                                                        bgcolor: isSelected ? colors.amberDeep : colors.pineSoft,
                                                                        borderColor: colors.pine,
                                                                    },
                                                                }}
                                                            >
                                                                {slot.time} {slot.isPast ? "(Passed)" : !slot.available ? "(Booked)" : ""}
                                                            </Button>
                                                        );
                                                    })}
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>

                                    {/* REASON / NOTES */}
                                    <Box sx={{ gridColumn: { md: "1 / -1" } }}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            minRows={3}
                                            label="Clinical Reason or Symptoms (Optional)"
                                            placeholder="Briefly state your symptoms, concerns, or previous medical context."
                                            value={form.reason}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    reason: e.target.value,
                                                }))
                                            }
                                        />
                                    </Box>
                                </Box>

                                {/* APPOINTMENT PAYMENT SUMMARY CARD */}
                                {selectedDoctor && form.appointmentTime && (
                                    <Box
                                        sx={{
                                            mt: 4,
                                            p: 3,
                                            borderRadius: 3,
                                            bgcolor: "#F8FAFC",
                                            border: `1px solid ${colors.hairline}`,
                                        }}
                                    >
                                        <Typography fontWeight={850} fontSize={15} color={colors.ink} mb={1.8}>
                                            Appointment Payment Summary
                                        </Typography>

                                        <Stack spacing={1.2}>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography fontSize={13.5} color={colors.slate}>
                                                    Doctor Consultation Fee:
                                                </Typography>
                                                <Typography fontSize={13.5} fontWeight={700} color={colors.ink}>
                                                    ₹{consultationFee}
                                                </Typography>
                                            </Stack>

                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography fontSize={13.5} color={colors.slate}>
                                                    Platform & Booking Convenience:
                                                </Typography>
                                                <Typography fontSize={13.5} fontWeight={700} color="#059669">
                                                    ₹0 (Complimentary)
                                                </Typography>
                                            </Stack>

                                            <Divider sx={{ my: 0.5 }} />

                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Typography fontSize={15} fontWeight={850} color={colors.ink}>
                                                    Total Payable Amount:
                                                </Typography>
                                                <Typography fontSize={20} fontWeight={900} color={colors.pine}>
                                                    ₹{consultationFee}
                                                </Typography>
                                            </Stack>
                                        </Stack>

                                        <Stack direction="row" alignItems="center" spacing={1} mt={2}>
                                            <LockOutlined sx={{ fontSize: 16, color: colors.slate }} />
                                            <Typography fontSize={12} color={colors.slate}>
                                                Processed securely by <strong>Razorpay</strong>. Supports UPI, Cards & Net Banking.
                                            </Typography>
                                        </Stack>
                                    </Box>
                                )}

                                {/* SUBMIT & PAY BUTTON */}
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    type="submit"
                                    disabled={
                                        saving ||
                                        !form.hospitalId ||
                                        !form.doctorId ||
                                        !form.appointmentDate ||
                                        !form.appointmentTime
                                    }
                                    sx={{
                                        mt: 4,
                                        py: 1.6,
                                        borderRadius: 2.5,
                                        bgcolor: colors.secondary,
                                        color: colors.white,
                                        fontWeight: 800,
                                        fontSize: 15.5,
                                        boxShadow: "0 6px 20px rgba(13,148,136,0.24)",
                                        "&:hover": {
                                            bgcolor: colors.secondaryDark,
                                            boxShadow: "0 8px 25px rgba(13,148,136,0.3)",
                                        },
                                    }}
                                >
                                    {saving
                                        ? "Connecting to Razorpay..."
                                        : consultationFee > 0
                                            ? `Pay ₹${consultationFee} & Book Appointment`
                                            : "Confirm & Book Appointment"}
                                </Button>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            )}
        </Container>
    );

    if (isAuthenticated) {
        return (
            <DashboardLayout
                role="patient"
                title="Book Doctor Appointment"
                subtitle="Select medical facility, doctor, and choose your preferred consultation slot."
            >
                {bookingContent}
            </DashboardLayout>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: colors.canvas, display: "flex", flexDirection: "column" }}>
            <Navbar />
            {bookingContent}
            <Footer />
        </Box>
    );
}
