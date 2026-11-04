import React, { useEffect, useState } from "react";
import {
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
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    Alert,
} from "@mui/material";
import {
    CheckCircleOutlined,
    CancelOutlined,
    InfoOutlined,
    SearchRounded,
    CalendarMonthOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PageHeader from "../../components/dashboard/PageHeader";
import api from "../../services/api";
import { colors } from "../../theme/colors";

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

const STATUS_COLORS = {
    Pending: "warning",
    Confirmed: "info",
    Completed: "success",
    Cancelled: "error",
    Rejected: "default",
};

export default function HospitalAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ type: "", message: "" });

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");

    // Action dialog state
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [actionType, setActionType] = useState(""); // "confirm", "reject", "complete", "cancel", "notes", "view"
    const [notes, setNotes] = useState("");
    const [actionSubmitting, setActionSubmitting] = useState(false);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter !== "all") params.status = statusFilter;
            if (dateFilter) params.date = dateFilter;

            const res = await api.get("/appointment/hospital", { params });
            if (res.data.success) {
                setAppointments(res.data.appointments || []);
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to load appointments.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [statusFilter, dateFilter]);

    const handleOpenAction = (appt, type) => {
        setSelectedAppointment(appt);
        setActionType(type);
        setNotes(appt.notes || "");
    };

    const handleExecuteAction = async () => {
        if (!selectedAppointment || !actionType) return;
        setActionSubmitting(true);
        setAlert({ type: "", message: "" });

        try {
            if (actionType === "confirm") {
                const res = await api.put(`/appointment/${selectedAppointment._id}/status`, {
                    status: "Confirmed",
                    notes,
                });
                if (res.data.success) {
                    setAlert({
                        type: "success",
                        message: "Appointment successfully confirmed! Patient notified via email and in-app alert.",
                    });
                    setSelectedAppointment(null);
                    fetchAppointments();
                    return;
                }
            } else if (actionType === "reject") {
                if (selectedAppointment.paymentStatus === "Paid") {
                    const refundRes = await api.post(`/payment/cancel-and-refund/${selectedAppointment._id}`, {
                        reason: notes || "Rejected by hospital administration",
                    });
                    if (refundRes.data.success) {
                        setAlert({
                            type: "success",
                            message: `Appointment rejected and 100% refund of ₹${selectedAppointment.consultationFee || 0} initiated via Razorpay.`,
                        });
                        setSelectedAppointment(null);
                        fetchAppointments();
                        return;
                    }
                } else {
                    const res = await api.put(`/appointment/${selectedAppointment._id}/status`, {
                        status: "Rejected",
                        notes,
                    });
                    if (res.data.success) {
                        setAlert({
                            type: "success",
                            message: "Appointment rejected successfully.",
                        });
                        setSelectedAppointment(null);
                        fetchAppointments();
                        return;
                    }
                }
            } else if (actionType === "cancel") {
                if (selectedAppointment.paymentStatus === "Paid") {
                    const refundRes = await api.post(`/payment/cancel-and-refund/${selectedAppointment._id}`, {
                        reason: notes || "Cancelled by hospital administration",
                    });
                    if (refundRes.data.success) {
                        setAlert({
                            type: "success",
                            message: `Appointment cancelled and 100% refund of ₹${selectedAppointment.consultationFee || 0} initiated via Razorpay.`,
                        });
                        setSelectedAppointment(null);
                        fetchAppointments();
                        return;
                    }
                } else {
                    const res = await api.put(`/appointment/${selectedAppointment._id}/status`, {
                        status: "Cancelled",
                        notes,
                    });
                    if (res.data.success) {
                        setAlert({
                            type: "success",
                            message: "Appointment cancelled successfully.",
                        });
                        setSelectedAppointment(null);
                        fetchAppointments();
                        return;
                    }
                }
            } else if (actionType === "view") {
                // Save / Update Clinical Notes
                const res = await api.put(`/appointment/${selectedAppointment._id}/status`, {
                    status: selectedAppointment.status,
                    notes,
                });
                if (res.data.success) {
                    setAlert({
                        type: "success",
                        message: "Clinical notes updated successfully.",
                    });
                    setSelectedAppointment(null);
                    fetchAppointments();
                    return;
                }
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to process request.",
            });
        } finally {
            setActionSubmitting(false);
        }
    };

    const filtered = appointments.filter((a) => {
        const patientName = a.patientId?.fullName?.toLowerCase() || "";
        const patientEmail = a.patientId?.email?.toLowerCase() || "";
        const doctorName = a.doctorId?.doctorName?.toLowerCase() || "";
        const reason = a.reason?.toLowerCase() || "";
        const q = search.toLowerCase();

        return (
            patientName.includes(q) ||
            patientEmail.includes(q) ||
            doctorName.includes(q) ||
            reason.includes(q)
        );
    });

    return (
        <DashboardLayout
            role="hospital"
            title="Appointment Operations"
            subtitle="Review incoming patient consultations, manage status, and leave clinical notes"
        >
            <PageHeader
                title="Appointment Management"
                subtitle="Live appointment bookings submitted to your hospital"
                backTo="/hospital"
                backLabel="← Back to Dashboard"
            />

            {alert.message && (
                <Alert severity={alert.type} sx={{ mb: 3, borderRadius: 3 }}>
                    {alert.message}
                </Alert>
            )}

            <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #E3EBEE" }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    {/* Filters Toolbar */}
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        justifyContent="space-between"
                        alignItems={{ xs: "stretch", sm: "center" }}
                        sx={{ mb: 3 }}
                    >
                        <TextField
                            size="small"
                            placeholder="Search by patient, doctor, reason..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sx={{ width: { xs: "100%", sm: 320 } }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchRounded fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Status"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <MenuItem value="all">All Statuses</MenuItem>
                                    <MenuItem value="Pending">Pending</MenuItem>
                                    <MenuItem value="Confirmed">Confirmed</MenuItem>
                                    <MenuItem value="Completed">Completed</MenuItem>
                                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                                    <MenuItem value="Rejected">Rejected</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                type="date"
                                size="small"
                                label="Date"
                                InputLabelProps={{ shrink: true }}
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                sx={{ minWidth: 165 }}
                            />

                            {dateFilter && (
                                <Button
                                    size="small"
                                    onClick={() => setDateFilter("")}
                                    sx={{ textTransform: "none", color: "text.secondary" }}
                                >
                                    Clear Date
                                </Button>
                            )}
                        </Stack>
                    </Stack>

                    {loading ? (
                        <Box py={8} textAlign="center">
                            <CircularProgress />
                        </Box>
                    ) : filtered.length === 0 ? (
                        <Box py={8} textAlign="center">
                            <CalendarMonthOutlined sx={{ fontSize: 52, color: "text.secondary", mb: 1.5 }} />
                            <Typography fontWeight={800} variant="h6">
                                No Appointments Found
                            </Typography>
                            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                                {search || statusFilter !== "all" || dateFilter
                                    ? "No appointments match your current search and filter criteria."
                                    : "Appointments booked by patients will appear here in real time."}
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer sx={{ overflowX: "auto" }}>
                            <Table sx={{ minWidth: 720 }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#F8FAFB" }}>
                                        <TableCell sx={{ fontWeight: 800 }}>Patient</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Doctor & Dept</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Date & Slot</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Reason / Notes</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filtered.map((appt) => {
                                        const p = appt.patientId || {};
                                        const d = appt.doctorId || {};
                                        const dept = appt.departmentId?.departmentName || "General";

                                        const dateObj = new Date(appt.appointmentDate);
                                        const dateStr = !isNaN(dateObj)
                                            ? dateObj.toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })
                                            : appt.appointmentDate;

                                        let formattedTime = appt.appointmentTime || "";
                                        if (formattedTime && formattedTime.includes(":")) {
                                            const [h, m] = formattedTime.split(":").map(Number);
                                            if (!isNaN(h)) {
                                                const ampm = h >= 12 ? "PM" : "AM";
                                                const h12 = h % 12 || 12;
                                                formattedTime = `${String(h12).padStart(2, "0")}:${String(m || 0).padStart(2, "0")} ${ampm}`;
                                            }
                                        }

                                        return (
                                            <TableRow key={appt._id} hover>
                                                <TableCell>
                                                    <Stack spacing={0.3}>
                                                        <Typography fontWeight={800} fontSize={14}>
                                                            {p.fullName || "Patient"}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" fontSize={12}>
                                                            {p.phone} • {p.email}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography fontWeight={700} fontSize={14}>
                                                        Dr. {d.doctorName?.replace(/^Dr\.\s*/i, "") || "Doctor"}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" fontSize={12}>
                                                        {dept}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography fontWeight={700} fontSize={13}>
                                                        {dateStr}
                                                    </Typography>
                                                    <Chip
                                                        label={formattedTime || appt.appointmentTime}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontWeight: 700, mt: 0.5, bgcolor: "#F8FAFC" }}
                                                    />
                                                </TableCell>

                                                <TableCell sx={{ maxWidth: 260 }}>
                                                    <Typography variant="body2" noWrap fontWeight={500}>
                                                        {appt.reason || "General Consultation"}
                                                    </Typography>
                                                    {appt.notes && (
                                                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", fontStyle: "italic" }}>
                                                            Note: {appt.notes}
                                                        </Typography>
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    {(() => {
                                                        const isPassed = isAppointmentPassed(appt.appointmentDate, appt.appointmentTime);
                                                        const currentStatus = appt.status || appt.bookingStatus || "Pending";
                                                        const effectiveStatus = (currentStatus === "Cancelled" || currentStatus === "Rejected")
                                                            ? currentStatus
                                                            : isPassed
                                                            ? "Completed"
                                                            : currentStatus;

                                                        return (
                                                            <Stack spacing={0.5} alignItems="flex-start">
                                                                <Chip
                                                                    label={effectiveStatus}
                                                                    color={STATUS_COLORS[effectiveStatus] || "default"}
                                                                    size="small"
                                                                    sx={{ fontWeight: 800 }}
                                                                />
                                                                <Typography fontSize={11.5} fontWeight={750} color={appt.paymentStatus === "Paid" ? "#065F46" : colors.slate}>
                                                                    ₹{appt.consultationFee || 0} • {appt.paymentStatus || "Free"}
                                                                </Typography>
                                                            </Stack>
                                                        );
                                                    })()}
                                                </TableCell>

                                                <TableCell align="right">
                                                    {(() => {
                                                        const isPassed = isAppointmentPassed(appt.appointmentDate, appt.appointmentTime);
                                                        const currentStatus = appt.status || appt.bookingStatus || "Pending";
                                                        const isPending = currentStatus === "Pending" && !isPassed;
                                                        const isConfirmed = currentStatus === "Confirmed" && !isPassed;

                                                        return (
                                                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                                {isPending && (
                                                                    <>
                                                                        <Tooltip title="Confirm & Approve Appointment">
                                                                            <IconButton
                                                                                size="small"
                                                                                color="success"
                                                                                onClick={() => handleOpenAction(appt, "confirm")}
                                                                            >
                                                                                <CheckCircleOutlined fontSize="small" />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                        <Tooltip title="Reject Appointment">
                                                                            <IconButton
                                                                                size="small"
                                                                                color="error"
                                                                                onClick={() => handleOpenAction(appt, "reject")}
                                                                            >
                                                                                <CancelOutlined fontSize="small" />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    </>
                                                                )}

                                                                {isConfirmed && (
                                                                    <Tooltip title="Cancel Appointment">
                                                                        <IconButton
                                                                            size="small"
                                                                            color="error"
                                                                            onClick={() => handleOpenAction(appt, "cancel")}
                                                                        >
                                                                            <CancelOutlined fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}

                                                                <Tooltip title="View Details & Notes">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="info"
                                                                        onClick={() => handleOpenAction(appt, "view")}
                                                                    >
                                                                        <InfoOutlined fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Stack>
                                                        );
                                                    })()}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            {/* Action Confirmation & Notes Dialog */}
            <Dialog open={Boolean(selectedAppointment)} onClose={() => setSelectedAppointment(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>
                    {actionType === "confirm"
                        ? "Confirm & Approve Appointment"
                        : actionType === "reject"
                        ? "Reject Appointment"
                        : actionType === "cancel"
                        ? "Cancel Appointment"
                        : "Appointment Details & Clinical Notes"}
                </DialogTitle>
                <DialogContent dividers>
                    {selectedAppointment && (
                        <Stack spacing={2.5}>
                            <Box sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: 3, border: "1px solid #E2E8F0" }}>
                                <Typography fontWeight={750} fontSize={14.5}>
                                    Patient: {selectedAppointment.patientId?.fullName || "Patient"}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" mt={0.3}>
                                    Doctor: Dr. {selectedAppointment.doctorId?.doctorName} • {selectedAppointment.appointmentTime}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Fee: ₹{selectedAppointment.consultationFee || 0} ({selectedAppointment.paymentStatus || "Free"})
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Reason: {selectedAppointment.reason || "General Consultation"}
                                </Typography>
                            </Box>

                            {(actionType === "cancel" || actionType === "reject") ? (
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label={actionType === "reject" ? "Reason for Rejection" : "Reason for Cancellation"}
                                    placeholder="Explain why this appointment cannot be accepted..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    helperText={selectedAppointment.paymentStatus === "Paid" ? "100% refund will be initiated to the patient." : ""}
                                />
                            ) : actionType === "confirm" ? (
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Instructions for Patient (Optional)"
                                    placeholder="e.g. Please bring prior medical reports, arrive 10 minutes early..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    helperText="These instructions will be visible to the patient upon confirmation."
                                />
                            ) : (
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Clinical Notes / Doctor Instructions"
                                    placeholder="Add clinical instructions or diagnosis notes for this patient..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    helperText="Changes saved here will be stored in the patient's medical consultation record."
                                />
                            )}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5, justifyContent: "space-between" }}>
                    <Button onClick={() => setSelectedAppointment(null)} color="inherit" sx={{ fontWeight: 600 }}>
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        disabled={actionSubmitting}
                        color={
                            actionType === "confirm"
                                ? "success"
                                : actionType === "reject" || actionType === "cancel"
                                ? "error"
                                : "primary"
                        }
                        onClick={handleExecuteAction}
                        sx={{ fontWeight: 800, textTransform: "none", px: 3, borderRadius: 2 }}
                    >
                        {actionSubmitting
                            ? "Processing..."
                            : actionType === "confirm"
                            ? "Confirm Appointment"
                            : actionType === "reject"
                            ? "Confirm Rejection"
                            : actionType === "cancel"
                            ? "Confirm Cancellation"
                            : "Save Clinical Notes"}
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
}
