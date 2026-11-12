import React, { useEffect, useState, useMemo } from "react";
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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import {
    AccessTimeOutlined,
    CheckCircleOutlined,
    CloseOutlined,
    ErrorOutlineOutlined,
    HourglassEmptyOutlined,
    NotificationsActiveOutlined,
    ReplayOutlined,
    SearchRounded,
    CancelOutlined,
    InfoOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../services/api";
import { colors } from "../../theme/colors";

const STATUS_CONFIG = {
    PENDING: { label: "Pending", bg: "#FFFBEB", color: "#B45309", border: "#FDE68A", icon: <HourglassEmptyOutlined fontSize="small" /> },
    PROCESSING: { label: "Processing", bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE", icon: <CircularProgress size={12} /> },
    SENT: { label: "Delivered", bg: "#ECFDF5", color: "#065F46", border: "#A7F3D0", icon: <CheckCircleOutlined fontSize="small" /> },
    FAILED: { label: "Failed", bg: "#FEF2F2", color: "#B91C1C", border: "#FECACA", icon: <ErrorOutlineOutlined fontSize="small" /> },
    CANCELLED: { label: "Cancelled", bg: "#F1F5F9", color: "#475569", border: "#CBD5E1", icon: <CancelOutlined fontSize="small" /> },
};

export default function AdminReminders() {
    const [stats, setStats] = useState({
        totalReminders: 0,
        pendingCount: 0,
        sentCount: 0,
        failedCount: 0,
        cancelledCount: 0,
    });
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Filters
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [search, setSearch] = useState("");

    // Details & Retry
    const [selectedReminder, setSelectedReminder] = useState(null);
    const [retryingId, setRetryingId] = useState(null);

    const loadReminders = async () => {
        try {
            setLoading(true);
            setError("");
            const params = {};
            if (statusFilter !== "ALL") params.status = statusFilter;

            const res = await api.get("/admin/reminders", { params });
            if (res.data?.success) {
                setStats(res.data.stats || {});
                setReminders(res.data.reminders || []);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load reminder monitoring records.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReminders();
    }, [statusFilter]);

    const handleRetry = async (reminderId) => {
        try {
            setRetryingId(reminderId);
            setError("");
            const res = await api.post(`/admin/reminders/${reminderId}/retry`);
            setSuccessMessage(res.data?.message || "Reminder queued for retry successfully.");
            setSelectedReminder(null);
            await loadReminders();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to retry reminder delivery.");
        } finally {
            setRetryingId(null);
        }
    };

    const filtered = useMemo(() => {
        return reminders.filter((item) => {
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            const pName = item.patientId?.fullName?.toLowerCase() || "";
            const dName = item.doctorId?.doctorName?.toLowerCase() || "";
            const hName = item.hospitalId?.hospitalName?.toLowerCase() || "";
            const id = item._id?.toLowerCase() || "";
            return pName.includes(q) || dName.includes(q) || hName.includes(q) || id.includes(q);
        });
    }, [reminders, search]);

    return (
        <DashboardLayout
            role="admin"
            title="Appointment Reminders"
            subtitle="Automated 24-hour and 1-hour patient reminder scheduler monitor"
        >
            {/* KPI STAT CARDS */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "repeat(2, minmax(0, 1fr))",
                        sm: "repeat(3, minmax(0, 1fr))",
                        md: "repeat(5, minmax(0, 1fr))",
                    },
                    gap: 2,
                    mb: 3.5,
                }}
            >
                {/* 1. TOTAL */}
                <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: `1px solid ${colors.hairline}`, bgcolor: colors.white }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <NotificationsActiveOutlined sx={{ color: colors.pine, fontSize: 18 }} />
                        <Typography fontSize={11.5} fontWeight={750} color={colors.slate}>
                            TOTAL
                        </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={900} color={colors.ink}>
                        {stats.totalReminders}
                    </Typography>
                </Card>

                {/* 2. PENDING */}
                <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #FDE68A", bgcolor: "#FFFBEB" }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <HourglassEmptyOutlined sx={{ color: "#B45309", fontSize: 18 }} />
                        <Typography fontSize={11.5} fontWeight={750} color="#B45309">
                            PENDING DUE
                        </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={900} color="#B45309">
                        {stats.pendingCount}
                    </Typography>
                </Card>

                {/* 3. DELIVERED */}
                <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #A7F3D0", bgcolor: "#ECFDF5" }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <CheckCircleOutlined sx={{ color: "#065F46", fontSize: 18 }} />
                        <Typography fontSize={11.5} fontWeight={750} color="#065F46">
                            DELIVERED
                        </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={900} color="#065F46">
                        {stats.sentCount}
                    </Typography>
                </Card>

                {/* 4. FAILED */}
                <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #FECACA", bgcolor: "#FEF2F2" }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <ErrorOutlineOutlined sx={{ color: "#B91C1C", fontSize: 18 }} />
                        <Typography fontSize={11.5} fontWeight={750} color="#B91C1C">
                            FAILED
                        </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={900} color="#B91C1C">
                        {stats.failedCount}
                    </Typography>
                </Card>

                {/* 5. CANCELLED */}
                <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #CBD5E1", bgcolor: "#F8FAFC" }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <CancelOutlined sx={{ color: "#475569", fontSize: 18 }} />
                        <Typography fontSize={11.5} fontWeight={750} color="#475569">
                            CANCELLED
                        </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={900} color="#475569">
                        {stats.cancelledCount}
                    </Typography>
                </Card>
            </Box>

            {/* ALERTS */}
            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}

            {successMessage && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccessMessage("")}>
                    {successMessage}
                </Alert>
            )}

            {/* TABLE CONTAINER */}
            <Card
                elevation={0}
                sx={{
                    borderRadius: 3.5,
                    border: `1px solid ${colors.hairline}`,
                    bgcolor: colors.white,
                    overflow: "hidden",
                }}
            >
                {/* TOOLBAR */}
                <Box
                    sx={{
                        p: 2.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 2,
                        borderBottom: `1px solid ${colors.hairline}`,
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <NotificationsActiveOutlined sx={{ color: colors.pine }} />
                        <Typography fontWeight={850} fontSize={16} color={colors.ink}>
                            Automated Reminder Queue ({filtered.length})
                        </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                        <TextField
                            size="small"
                            placeholder="Search patient, doctor, hospital..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sx={{ width: 240 }}
                            InputProps={{
                                startAdornment: <SearchRounded fontSize="small" sx={{ color: colors.slate, mr: 0.5 }} />,
                            }}
                        />

                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                                sx={{ borderRadius: 2 }}
                            >
                                <MenuItem value="ALL">All Statuses</MenuItem>
                                <MenuItem value="PENDING">Pending</MenuItem>
                                <MenuItem value="SENT">Delivered</MenuItem>
                                <MenuItem value="FAILED">Failed</MenuItem>
                                <MenuItem value="CANCELLED">Cancelled</MenuItem>
                            </Select>
                        </FormControl>

                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ReplayOutlined />}
                            onClick={loadReminders}
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                            Refresh
                        </Button>
                    </Stack>
                </Box>

                {/* TABLE */}
                <CardContent sx={{ p: 0 }}>
                    {loading ? (
                        <Box py={8} textAlign="center">
                            <CircularProgress sx={{ color: colors.pine }} />
                            <Typography mt={2} color={colors.slate} fontSize={14}>
                                Loading automated reminder jobs...
                            </Typography>
                        </Box>
                    ) : filtered.length === 0 ? (
                        <Box py={8} textAlign="center">
                            <NotificationsActiveOutlined sx={{ fontSize: 48, color: colors.slate, opacity: 0.4, mb: 1 }} />
                            <Typography fontWeight={750} color={colors.ink}>
                                No appointment reminder jobs match criteria
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer sx={{ overflowX: "auto" }}>
                            <Table sx={{ minWidth: 900 }}>
                                <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, fontSize: 12 }}>REMINDER TYPE</TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: 12 }}>PATIENT</TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: 12 }}>DOCTOR & HOSPITAL</TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: 12 }}>APPOINTMENT SLOT</TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: 12 }}>SCHEDULED AT</TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: 12 }}>DELIVERY STATUS</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: 12 }}>ACTIONS</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filtered.map((r) => {
                                        const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.PENDING;
                                        const is24h = r.reminderType === "24_HOURS";
                                        const apptDateStr = r.appointmentId?.appointmentDate
                                            ? new Date(r.appointmentId.appointmentDate).toLocaleDateString("en-GB", {
                                                  day: "2-digit",
                                                  month: "short",
                                                  year: "numeric",
                                              })
                                            : "—";

                                        return (
                                            <TableRow key={r._id} hover>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        label={is24h ? "24 Hours Ahead" : "1 Hour Ahead"}
                                                        sx={{
                                                            fontWeight: 800,
                                                            fontSize: 11,
                                                            bgcolor: is24h ? "#EFF6FF" : "#FFF7ED",
                                                            color: is24h ? "#1D4ED8" : "#C2410C",
                                                            border: `1px solid ${is24h ? "#BFDBFE" : "#FFEDD5"}`,
                                                        }}
                                                    />
                                                    <Typography fontSize={10} fontFamily="monospace" color={colors.slate} mt={0.5}>
                                                        v{r.appointmentVersion || 1}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography fontWeight={750} fontSize={13.5} color={colors.ink}>
                                                        {r.patientId?.fullName || "Patient"}
                                                    </Typography>
                                                    <Typography fontSize={11.5} color={colors.slate}>
                                                        {r.patientId?.phone || r.patientId?.email}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography fontWeight={700} fontSize={13.5} color={colors.ink}>
                                                        Dr. {r.doctorId?.doctorName?.replace(/^dr\.?\s+/i, "")}
                                                    </Typography>
                                                    <Typography fontSize={11.5} color={colors.slate}>
                                                        {r.hospitalId?.hospitalName}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography fontSize={13} fontWeight={650}>
                                                        {apptDateStr}
                                                    </Typography>
                                                    <Typography fontSize={12} color={colors.pine} fontWeight={750}>
                                                        {r.appointmentId?.appointmentTime || "—"}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography fontSize={12.5} color={colors.ink} fontWeight={600}>
                                                        {r.scheduledAt ? new Date(r.scheduledAt).toLocaleString() : "—"}
                                                    </Typography>
                                                    {r.sentAt && (
                                                        <Typography fontSize={11} color="#065F46">
                                                            Sent: {new Date(r.sentAt).toLocaleTimeString()}
                                                        </Typography>
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        icon={cfg.icon}
                                                        label={cfg.label}
                                                        sx={{
                                                            bgcolor: cfg.bg,
                                                            color: cfg.color,
                                                            border: `1px solid ${cfg.border}`,
                                                            fontWeight: 800,
                                                            fontSize: 11,
                                                        }}
                                                    />
                                                    {r.lastError && (
                                                        <Typography fontSize={11} color="#B91C1C" noWrap sx={{ maxWidth: 140 }} mt={0.3}>
                                                            {r.lastError}
                                                        </Typography>
                                                    )}
                                                </TableCell>

                                                <TableCell align="right">
                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                        {r.status === "FAILED" && (
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                color="error"
                                                                disabled={retryingId === r._id}
                                                                onClick={() => handleRetry(r._id)}
                                                                startIcon={<ReplayOutlined />}
                                                                sx={{ borderRadius: 2, fontWeight: 750, fontSize: 11 }}
                                                            >
                                                                {retryingId === r._id ? "Retrying..." : "Retry"}
                                                            </Button>
                                                        )}
                                                        <IconButton
                                                            size="small"
                                                            color="info"
                                                            onClick={() => setSelectedReminder(r)}
                                                        >
                                                            <InfoOutlined fontSize="small" />
                                                        </IconButton>
                                                    </Stack>
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

            {/* REMINDER DETAILS MODAL */}
            {selectedReminder && (
                <Dialog
                    open={Boolean(selectedReminder)}
                    onClose={() => setSelectedReminder(null)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
                >
                    <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <AccessTimeOutlined sx={{ color: colors.pine }} />
                            <Typography fontWeight={850} fontSize={17} color={colors.ink}>
                                Reminder Job Diagnostic Record
                            </Typography>
                        </Stack>
                        <IconButton onClick={() => setSelectedReminder(null)} size="small">
                            <CloseOutlined />
                        </IconButton>
                    </DialogTitle>
                    <Divider />
                    <DialogContent sx={{ py: 2.5 }}>
                        <Stack spacing={1.5}>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontSize={13} color={colors.slate}>Reminder ID:</Typography>
                                <Typography fontSize={13} fontFamily="monospace" fontWeight={750}>{selectedReminder._id}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontSize={13} color={colors.slate}>Type:</Typography>
                                <Typography fontSize={13} fontWeight={750}>{selectedReminder.reminderType === "24_HOURS" ? "24 Hours Before" : "1 Hour Before"}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontSize={13} color={colors.slate}>Schedule Version:</Typography>
                                <Typography fontSize={13} fontWeight={750}>v{selectedReminder.appointmentVersion || 1}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontSize={13} color={colors.slate}>Idempotency Key:</Typography>
                                <Typography fontSize={11} fontFamily="monospace" color={colors.ink}>{selectedReminder.idempotencyKey}</Typography>
                            </Stack>
                            <Divider />
                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontSize={13} color={colors.slate}>Patient:</Typography>
                                <Typography fontSize={13} fontWeight={750}>{selectedReminder.patientId?.fullName} ({selectedReminder.patientId?.email})</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontSize={13} color={colors.slate}>Doctor:</Typography>
                                <Typography fontSize={13} fontWeight={750}>Dr. {selectedReminder.doctorId?.doctorName}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontSize={13} color={colors.slate}>Hospital:</Typography>
                                <Typography fontSize={13} fontWeight={750}>{selectedReminder.hospitalId?.hospitalName}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontSize={13} color={colors.slate}>Appointment Time:</Typography>
                                <Typography fontSize={13} fontWeight={750}>{selectedReminder.appointmentId?.appointmentTime}</Typography>
                            </Stack>
                            <Divider />
                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontSize={13} color={colors.slate}>Delivery Status:</Typography>
                                <Typography fontSize={13} fontWeight={800}>{selectedReminder.status}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontSize={13} color={colors.slate}>Delivery Attempts:</Typography>
                                <Typography fontSize={13} fontWeight={750}>{selectedReminder.attempts || 0}</Typography>
                            </Stack>
                            {selectedReminder.lastError && (
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#FEF2F2", border: "1px solid #FECACA" }}>
                                    <Typography fontSize={12} color="#B91C1C">
                                        <strong>Last Error:</strong> {selectedReminder.lastError}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
                        <Button onClick={() => setSelectedReminder(null)} variant="outlined">Close</Button>
                        {selectedReminder.status === "FAILED" && (
                            <Button
                                variant="contained"
                                color="error"
                                onClick={() => handleRetry(selectedReminder._id)}
                                disabled={retryingId === selectedReminder._id}
                            >
                                {retryingId === selectedReminder._id ? "Retrying..." : "Retry Delivery Now"}
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>
            )}
        </DashboardLayout>
    );
}

