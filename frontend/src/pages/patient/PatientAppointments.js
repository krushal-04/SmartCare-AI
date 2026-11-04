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
} from "@mui/material";
import {
    CalendarMonthOutlined,
    CheckCircleOutlined,
    CloseOutlined,
    EventAvailableOutlined,
    HourglassEmptyOutlined,
    ReplayOutlined,
    WarningAmberOutlined,
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
                    const paymentStatus = appointment.paymentStatus || "NotRequired";

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
                            </CardContent>
                        </Card>
                    );
                })
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
