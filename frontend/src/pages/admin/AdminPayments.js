import React, { useEffect, useMemo, useState } from "react";
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
    IconButton,
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
    AccountBalanceWalletOutlined,
    CloseOutlined,
    CurrencyRupeeOutlined,
    EditOutlined,
    ReceiptLongOutlined,
    ReplayOutlined,
    SaveOutlined,
    SecurityOutlined,
    TuneOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../services/api";
import { colors } from "../../theme/colors";

const statusColors = {
    Paid: { bg: "#ECFDF5", color: "#065F46", border: "#A7F3D0" },
    Pending: { bg: "#FFFBEB", color: "#B45309", border: "#FDE68A" },
    Refunded: { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
    PartiallyRefunded: { bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" },
    Failed: { bg: "#FEF2F2", color: "#B91C1C", border: "#FECACA" },
};

export default function AdminPayments() {
    const [metrics, setMetrics] = useState(null);
    const [payments, setPayments] = useState([]);
    const [policy, setPolicy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDetail, setSelectedDetail] = useState(null);

    // Policy edit modal
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    const [policyForm, setPolicyForm] = useState({
        name: "",
        tiers: [],
        hospitalOrDoctorCancelRefundPercentage: 100,
    });
    const [savingPolicy, setSavingPolicy] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");
            const [overviewRes, policyRes] = await Promise.all([
                api.get("/payment/admin-overview"),
                api.get("/payment/policy"),
            ]);

            setMetrics(overviewRes.data.metrics || {});
            setPayments(overviewRes.data.payments || []);
            setPolicy(policyRes.data.policy || null);
            if (policyRes.data.policy) {
                setPolicyForm({
                    name: policyRes.data.policy.name || "SmartCare Healthcare Cancellation Policy",
                    tiers: policyRes.data.policy.tiers || [],
                    hospitalOrDoctorCancelRefundPercentage:
                        policyRes.data.policy.hospitalOrDoctorCancelRefundPercentage || 100,
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load admin payment overview.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredPayments = useMemo(() => {
        return payments.filter((p) => {
            const matchesStatus = filterStatus === "All" || p.paymentStatus === filterStatus;
            const patient = p.patientId?.fullName?.toLowerCase() || "";
            const doctor = p.doctorId?.doctorName?.toLowerCase() || "";
            const hospital = p.hospitalId?.hospitalName?.toLowerCase() || "";
            const ref = p.gatewayPaymentId?.toLowerCase() || "";
            const term = searchTerm.toLowerCase();

            const matchesSearch =
                !searchTerm ||
                patient.includes(term) ||
                doctor.includes(term) ||
                hospital.includes(term) ||
                ref.includes(term);

            return matchesStatus && matchesSearch;
        });
    }, [payments, filterStatus, searchTerm]);

    const handleSavePolicy = async () => {
        try {
            setSavingPolicy(true);
            setError("");
            const res = await api.put("/payment/policy", policyForm);
            setPolicy(res.data.policy);
            setSuccessMessage("Cancellation and refund policy updated successfully.");
            setIsPolicyModalOpen(false);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save cancellation policy.");
        } finally {
            setSavingPolicy(false);
        }
    };

    return (
        <DashboardLayout
            role="admin"
            title="Platform Payments & Refund Governance"
            subtitle="Real-time Razorpay financial monitoring, transaction audits, and policy management"
        >
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

            {/* PLATFORM METRICS CARDS */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "repeat(2, minmax(0, 1fr))",
                        md: "repeat(4, minmax(0, 1fr))",
                    },
                    gap: 2.5,
                    mb: 3.5,
                }}
            >
                <Card
                    elevation={0}
                    sx={{
                        p: 2.5,
                        borderRadius: 3.5,
                        bgcolor: colors.white,
                        border: `1px solid ${colors.hairline}`,
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2.5,
                                bgcolor: colors.pineSoft,
                                color: colors.pine,
                                display: "grid",
                                placeItems: "center",
                            }}
                        >
                            <CurrencyRupeeOutlined fontSize="small" />
                        </Box>
                        <Typography fontSize={12} fontWeight={750} color={colors.slate}>
                            PLATFORM GROSS
                        </Typography>
                    </Stack>
                    <Typography variant="h4" fontWeight={900} color={colors.ink}>
                        ₹{metrics?.totalRevenue || 0}
                    </Typography>
                    <Typography fontSize={11.5} color={colors.slate} mt={0.5}>
                        Across {metrics?.successfulCount || 0} transactions
                    </Typography>
                </Card>

                <Card
                    elevation={0}
                    sx={{
                        p: 2.5,
                        borderRadius: 3.5,
                        bgcolor: colors.white,
                        border: `1px solid ${colors.hairline}`,
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2.5,
                                bgcolor: "#ECFDF5",
                                color: "#065F46",
                                display: "grid",
                                placeItems: "center",
                            }}
                        >
                            <AccountBalanceWalletOutlined fontSize="small" />
                        </Box>
                        <Typography fontSize={12} fontWeight={750} color={colors.slate}>
                            NET SETTLED
                        </Typography>
                    </Stack>
                    <Typography variant="h4" fontWeight={900} color={colors.pine}>
                        ₹{metrics?.netRevenue || 0}
                    </Typography>
                    <Typography fontSize={11.5} color={colors.slate} mt={0.5}>
                        Net revenue realized
                    </Typography>
                </Card>

                <Card
                    elevation={0}
                    sx={{
                        p: 2.5,
                        borderRadius: 3.5,
                        bgcolor: colors.white,
                        border: `1px solid ${colors.hairline}`,
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2.5,
                                bgcolor: "#EFF6FF",
                                color: "#2563EB",
                                display: "grid",
                                placeItems: "center",
                            }}
                        >
                            <ReplayOutlined fontSize="small" />
                        </Box>
                        <Typography fontSize={12} fontWeight={750} color={colors.slate}>
                            TOTAL REFUNDED
                        </Typography>
                    </Stack>
                    <Typography variant="h4" fontWeight={900} color="#2563EB">
                        ₹{metrics?.totalRefunded || 0}
                    </Typography>
                    <Typography fontSize={11.5} color={colors.slate} mt={0.5}>
                        {metrics?.refundedCount || 0} refunds settled
                    </Typography>
                </Card>

                <Card
                    elevation={0}
                    sx={{
                        p: 2.5,
                        borderRadius: 3.5,
                        bgcolor: colors.white,
                        border: `1px solid ${colors.hairline}`,
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2.5,
                                bgcolor: colors.canvas,
                                color: colors.ink,
                                display: "grid",
                                placeItems: "center",
                            }}
                        >
                            <SecurityOutlined fontSize="small" />
                        </Box>
                        <Typography fontSize={12} fontWeight={750} color={colors.slate}>
                            PRIMARY GATEWAY
                        </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={900} color={colors.ink}>
                        Razorpay
                    </Typography>
                    <Typography fontSize={11.5} color={colors.slate} mt={0.5}>
                        Active API & Webhooks
                    </Typography>
                </Card>
            </Box>

            {/* CANCELLATION POLICY BANNER & CONFIGURATION */}
            <Card
                elevation={0}
                sx={{
                    mb: 3.5,
                    borderRadius: 3.5,
                    bgcolor: "#F8FAFC",
                    border: `1px solid ${colors.hairline}`,
                    p: 3,
                }}
            >
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={2}>
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <TuneOutlined sx={{ color: colors.pine }} />
                            <Typography fontWeight={850} fontSize={16} color={colors.ink}>
                                Active Cancellation & Refund Policy
                            </Typography>
                        </Stack>
                        <Typography fontSize={13} color={colors.slate} mt={0.5}>
                            Automated tiers governing patient refunds according to cancellation lead time.
                        </Typography>

                        {policy && (
                            <Stack direction="row" spacing={2} mt={1.5} flexWrap="wrap" gap={1}>
                                {(policy.tiers || []).map((t, idx) => (
                                    <Chip
                                        key={idx}
                                        size="small"
                                        label={`${t.hoursBeforeAppointment}+ hrs: ${t.refundPercentage}% Refund`}
                                        sx={{
                                            bgcolor: colors.white,
                                            border: `1px solid ${colors.hairline}`,
                                            fontWeight: 750,
                                            fontSize: 12,
                                        }}
                                    />
                                ))}
                                <Chip
                                    size="small"
                                    label={`Hospital/Doctor Cancel: ${policy.hospitalOrDoctorCancelRefundPercentage || 100}%`}
                                    sx={{
                                        bgcolor: "#ECFDF5",
                                        color: "#065F46",
                                        border: "1px solid #A7F3D0",
                                        fontWeight: 750,
                                        fontSize: 12,
                                    }}
                                />
                            </Stack>
                        )}
                    </Box>

                    <Button
                        variant="outlined"
                        startIcon={<EditOutlined />}
                        onClick={() => setIsPolicyModalOpen(true)}
                        sx={{
                            borderRadius: 2,
                            fontWeight: 700,
                            borderColor: colors.pine,
                            color: colors.pine,
                            "&:hover": { bgcolor: colors.pineSoft, borderColor: colors.pineDeep },
                        }}
                    >
                        Configure Policy
                    </Button>
                </Stack>
            </Card>

            {/* TRANSACTIONS TABLE */}
            <Card
                elevation={0}
                sx={{
                    borderRadius: 3.5,
                    border: `1px solid ${colors.hairline}`,
                    bgcolor: colors.white,
                    overflow: "hidden",
                }}
            >
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
                        <ReceiptLongOutlined sx={{ color: colors.pine }} />
                        <Typography fontWeight={850} fontSize={16} color={colors.ink}>
                            Platform Payment Ledger ({filteredPayments.length})
                        </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                        <TextField
                            size="small"
                            placeholder="Search patient, doc, ref..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{ width: 230 }}
                        />

                        <Select
                            size="small"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            sx={{ minWidth: 140, borderRadius: 2, fontSize: 13 }}
                        >
                            <MenuItem value="All">All Statuses</MenuItem>
                            <MenuItem value="Paid">Paid</MenuItem>
                            <MenuItem value="Refunded">Refunded</MenuItem>
                            <MenuItem value="PartiallyRefunded">Partially Refunded</MenuItem>
                            <MenuItem value="Pending">Pending</MenuItem>
                            <MenuItem value="Failed">Failed</MenuItem>
                        </Select>
                    </Stack>
                </Box>

                <CardContent sx={{ p: 0 }}>
                    {loading ? (
                        <Box py={8} textAlign="center">
                            <CircularProgress sx={{ color: colors.pine }} />
                            <Typography mt={2} color={colors.slate} fontSize={14}>
                                Loading platform payment records...
                            </Typography>
                        </Box>
                    ) : filteredPayments.length === 0 ? (
                        <Box py={8} textAlign="center">
                            <ReceiptLongOutlined sx={{ fontSize: 48, color: colors.slate, opacity: 0.5, mb: 1 }} />
                            <Typography fontWeight={750} color={colors.ink}>
                                No platform payment records found
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer sx={{ overflowX: "auto" }}>
                            <Table sx={{ minWidth: 900 }}>
                                <TableHead sx={{ bgcolor: colors.canvas }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, fontSize: 12, color: colors.slate }}>
                                            TRANSACTION ID
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: 12, color: colors.slate }}>
                                            PATIENT
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: 12, color: colors.slate }}>
                                            DOCTOR / HOSPITAL
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: 12, color: colors.slate }}>
                                            AMOUNT
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: 12, color: colors.slate }}>
                                            STATUS
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: 12, color: colors.slate }}>
                                            REFUND
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: 12, color: colors.slate }}>
                                            DATE
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: 12, color: colors.slate }}>
                                            ACTION
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredPayments.map((p) => {
                                        const c = statusColors[p.paymentStatus] || statusColors.Pending;
                                        const patientName = p.patientId?.fullName || "Patient";
                                        const docName = p.doctorId?.doctorName
                                            ? `Dr. ${p.doctorId.doctorName.replace(/^dr\.?\s+/i, "")}`
                                            : "Doctor";
                                        const hospName = p.hospitalId?.hospitalName || "Hospital";

                                        return (
                                            <TableRow key={p._id} hover>
                                                <TableCell sx={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: colors.ink }}>
                                                    {p.gatewayPaymentId || p.transactionReference || "Pending"}
                                                </TableCell>

                                                <TableCell>
                                                    <Typography fontWeight={750} fontSize={13.5} color={colors.ink}>
                                                        {patientName}
                                                    </Typography>
                                                    <Typography fontSize={11.5} color={colors.slate}>
                                                        {p.patientId?.email || ""}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography fontWeight={750} fontSize={13.5} color={colors.ink}>
                                                        {docName}
                                                    </Typography>
                                                    <Typography fontSize={11.5} color={colors.slate}>
                                                        {hospName}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography fontWeight={850} fontSize={14.5} color={colors.ink}>
                                                        ₹{p.amount}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        label={p.paymentStatus}
                                                        sx={{
                                                            bgcolor: c.bg,
                                                            color: c.color,
                                                            border: `1px solid ${c.border}`,
                                                            fontWeight: 800,
                                                            fontSize: 11.5,
                                                        }}
                                                    />
                                                </TableCell>

                                                <TableCell>
                                                    {p.refundAmount > 0 ? (
                                                        <Box>
                                                            <Typography fontSize={13} fontWeight={800} color="#15803D">
                                                                ₹{p.refundAmount}
                                                            </Typography>
                                                            <Typography fontSize={11} color={colors.slate}>
                                                                {p.refundStatus}
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Typography fontSize={12} color={colors.slate}>
                                                            None
                                                        </Typography>
                                                    )}
                                                </TableCell>

                                                <TableCell sx={{ fontSize: 12.5, color: colors.slate }}>
                                                    {new Date(p.createdAt).toLocaleDateString()}
                                                </TableCell>

                                                <TableCell align="right">
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={() => setSelectedDetail(p)}
                                                        sx={{
                                                            borderRadius: 2,
                                                            fontWeight: 700,
                                                            fontSize: 12,
                                                            borderColor: colors.hairline,
                                                            color: colors.pine,
                                                            "&:hover": {
                                                                borderColor: colors.pine,
                                                                bgcolor: colors.pineSoft,
                                                            },
                                                        }}
                                                    >
                                                        Details
                                                    </Button>
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

            {/* POLICY CONFIGURATION MODAL */}
            <Dialog
                open={isPolicyModalOpen}
                onClose={() => setIsPolicyModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
            >
                <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography fontWeight={850} fontSize={17} color={colors.ink}>
                        Configure Cancellation & Refund Policy
                    </Typography>
                    <IconButton onClick={() => setIsPolicyModalOpen(false)} size="small">
                        <CloseOutlined />
                    </IconButton>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ py: 3 }}>
                    <Typography fontSize={13} color={colors.slate} mb={2.5}>
                        Configure the automated refund tiers calculated upon patient appointment cancellation.
                    </Typography>

                    <Stack spacing={2}>
                        {(policyForm.tiers || []).map((tier, idx) => (
                            <Box
                                key={idx}
                                sx={{
                                    p: 2,
                                    borderRadius: 2.5,
                                    bgcolor: colors.canvas,
                                    border: `1px solid ${colors.hairline}`,
                                }}
                            >
                                <Typography fontWeight={750} fontSize={13} mb={1}>
                                    Tier #{idx + 1}
                                </Typography>
                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        label="Hours Before Appointment"
                                        type="number"
                                        size="small"
                                        value={tier.hoursBeforeAppointment}
                                        onChange={(e) => {
                                            const newTiers = [...policyForm.tiers];
                                            newTiers[idx].hoursBeforeAppointment = Number(e.target.value);
                                            setPolicyForm({ ...policyForm, tiers: newTiers });
                                        }}
                                        sx={{ flex: 1 }}
                                    />
                                    <TextField
                                        label="Refund %"
                                        type="number"
                                        size="small"
                                        value={tier.refundPercentage}
                                        onChange={(e) => {
                                            const newTiers = [...policyForm.tiers];
                                            newTiers[idx].refundPercentage = Number(e.target.value);
                                            setPolicyForm({ ...policyForm, tiers: newTiers });
                                        }}
                                        sx={{ width: 120 }}
                                    />
                                </Stack>
                            </Box>
                        ))}

                        <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: colors.canvas, border: `1px solid ${colors.hairline}` }}>
                            <Typography fontWeight={750} fontSize={13} mb={1}>
                                Hospital / Doctor Cancel Refund Rate (%)
                            </Typography>
                            <TextField
                                type="number"
                                size="small"
                                value={policyForm.hospitalOrDoctorCancelRefundPercentage}
                                onChange={(e) =>
                                    setPolicyForm({
                                        ...policyForm,
                                        hospitalOrDoctorCancelRefundPercentage: Number(e.target.value),
                                    })
                                }
                                sx={{ width: 140 }}
                            />
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, pt: 0, justifyContent: "space-between" }}>
                    <Button
                        variant="outlined"
                        onClick={() => setIsPolicyModalOpen(false)}
                        sx={{ borderRadius: 2, fontWeight: 700 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        disabled={savingPolicy}
                        startIcon={<SaveOutlined />}
                        onClick={handleSavePolicy}
                        sx={{
                            borderRadius: 2,
                            fontWeight: 700,
                            bgcolor: colors.pine,
                            "&:hover": { bgcolor: colors.pineDeep },
                        }}
                    >
                        {savingPolicy ? "Saving..." : "Save Policy"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* DETAIL MODAL */}
            {selectedDetail && (
                <Dialog
                    open={Boolean(selectedDetail)}
                    onClose={() => setSelectedDetail(null)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
                >
                    <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography fontWeight={850} fontSize={17} color={colors.ink}>
                            Platform Payment Audit Record
                        </Typography>
                        <IconButton onClick={() => setSelectedDetail(null)} size="small">
                            <CloseOutlined />
                        </IconButton>
                    </DialogTitle>
                    <Divider />
                    <DialogContent sx={{ py: 3 }}>
                        <Stack spacing={1.5}>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontSize={13} color={colors.slate} fontWeight={600}>
                                    Transaction ID:
                                </Typography>
                                <Typography fontSize={13} fontFamily="monospace" fontWeight={750} color={colors.ink}>
                                    {selectedDetail.gatewayPaymentId || selectedDetail.transactionReference || "Pending"}
                                </Typography>
                            </Stack>

                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontSize={13} color={colors.slate} fontWeight={600}>
                                    Gateway Order ID:
                                </Typography>
                                <Typography fontSize={13} fontFamily="monospace" color={colors.ink}>
                                    {selectedDetail.gatewayOrderId || "—"}
                                </Typography>
                            </Stack>

                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontSize={13} color={colors.slate} fontWeight={600}>
                                    Patient Name:
                                </Typography>
                                <Typography fontSize={13} fontWeight={750} color={colors.ink}>
                                    {selectedDetail.patientId?.fullName || "Patient"}
                                </Typography>
                            </Stack>

                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontSize={13} color={colors.slate} fontWeight={600}>
                                    Consulting Doctor:
                                </Typography>
                                <Typography fontSize={13} fontWeight={750} color={colors.ink}>
                                    Dr. {selectedDetail.doctorId?.doctorName}
                                </Typography>
                            </Stack>

                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontSize={13} color={colors.slate} fontWeight={600}>
                                    Hospital Center:
                                </Typography>
                                <Typography fontSize={13} color={colors.ink}>
                                    {selectedDetail.hospitalId?.hospitalName}
                                </Typography>
                            </Stack>

                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontSize={13} color={colors.slate} fontWeight={600}>
                                    Amount:
                                </Typography>
                                <Typography fontSize={16} fontWeight={900} color={colors.pine}>
                                    ₹{selectedDetail.amount}
                                </Typography>
                            </Stack>

                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontSize={13} color={colors.slate} fontWeight={600}>
                                    Status:
                                </Typography>
                                <Typography fontSize={13} fontWeight={750} color={colors.ink}>
                                    {selectedDetail.paymentStatus}
                                </Typography>
                            </Stack>

                            {selectedDetail.refundAmount > 0 && (
                                <>
                                    <Divider sx={{ my: 1 }} />
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography fontSize={13} color="#15803D" fontWeight={700}>
                                            Refund Status:
                                        </Typography>
                                        <Typography fontSize={13} fontWeight={800} color="#15803D">
                                            {selectedDetail.refundStatus} (₹{selectedDetail.refundAmount})
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography fontSize={12} color={colors.slate}>
                                            Refund Reference:
                                        </Typography>
                                        <Typography fontSize={12} fontFamily="monospace" color={colors.slate}>
                                            {selectedDetail.gatewayRefundId || "Processing"}
                                        </Typography>
                                    </Stack>
                                </>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button
                            variant="contained"
                            onClick={() => setSelectedDetail(null)}
                            sx={{
                                bgcolor: colors.pine,
                                fontWeight: 700,
                                "&:hover": { bgcolor: colors.pineDeep },
                            }}
                        >
                            Done
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </DashboardLayout>
    );
}
