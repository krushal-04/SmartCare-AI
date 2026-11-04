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
    Typography,
} from "@mui/material";
import {
    AccountBalanceWalletOutlined,
    CheckCircleOutlined,
    CloseOutlined,
    CurrencyRupeeOutlined,
    PrintOutlined,
    ReceiptLongOutlined,
    ReplayOutlined,
    SecurityOutlined,
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
    Created: { bg: "#F8FAFC", color: "#64748B", border: "#E2E8F0" },
};

export default function PatientPayments() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    const loadPayments = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/payment/patient-history");
            setPayments(res.data.payments || []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load payment history.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPayments();
    }, []);

    const filteredPayments = useMemo(() => {
        if (statusFilter === "All") return payments;
        return payments.filter((p) => p.paymentStatus === statusFilter);
    }, [payments, statusFilter]);

    // Summary calculations
    const stats = useMemo(() => {
        let totalPaid = 0;
        let totalRefunded = 0;
        let successfulCount = 0;

        payments.forEach((p) => {
            if (p.paymentStatus === "Paid") {
                totalPaid += p.amount;
                successfulCount += 1;
            } else if (p.paymentStatus === "Refunded" || p.paymentStatus === "PartiallyRefunded") {
                totalPaid += p.amount;
                totalRefunded += p.refundAmount || 0;
                successfulCount += 1;
            }
        });

        return {
            totalPaid,
            totalRefunded,
            netPaid: totalPaid - totalRefunded,
            successfulCount,
            totalTransactions: payments.length,
        };
    }, [payments]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <DashboardLayout
            role="patient"
            title="Payment History & Receipts"
            subtitle="Track online consultation fee transactions, invoice receipts and processed refunds"
        >
            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}

            {/* TOP STATS CARDS */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
                    gap: 2,
                    mb: 3.5,
                }}
            >
                <Card
                    elevation={0}
                    sx={{
                        p: 2.5,
                        borderRadius: 3,
                        bgcolor: colors.white,
                        border: `1px solid ${colors.hairline}`,
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 2,
                                bgcolor: colors.pineSoft,
                                color: colors.pine,
                                display: "grid",
                                placeItems: "center",
                            }}
                        >
                            <CurrencyRupeeOutlined fontSize="small" />
                        </Box>
                        <Typography fontSize={12} fontWeight={700} color={colors.slate}>
                            TOTAL PAID
                        </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={850} color={colors.ink}>
                        ₹{stats.totalPaid}
                    </Typography>
                    <Typography fontSize={11.5} color={colors.slate}>
                        Across {stats.successfulCount} consultations
                    </Typography>
                </Card>

                <Card
                    elevation={0}
                    sx={{
                        p: 2.5,
                        borderRadius: 3,
                        bgcolor: colors.white,
                        border: `1px solid ${colors.hairline}`,
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 2,
                                bgcolor: "#EFF6FF",
                                color: "#2563EB",
                                display: "grid",
                                placeItems: "center",
                            }}
                        >
                            <ReplayOutlined fontSize="small" />
                        </Box>
                        <Typography fontSize={12} fontWeight={700} color={colors.slate}>
                            TOTAL REFUNDS
                        </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={850} color="#2563EB">
                        ₹{stats.totalRefunded}
                    </Typography>
                    <Typography fontSize={11.5} color={colors.slate}>
                        Credited per cancellation policy
                    </Typography>
                </Card>

                <Card
                    elevation={0}
                    sx={{
                        p: 2.5,
                        borderRadius: 3,
                        bgcolor: colors.white,
                        border: `1px solid ${colors.hairline}`,
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 2,
                                bgcolor: "#ECFDF5",
                                color: "#059669",
                                display: "grid",
                                placeItems: "center",
                            }}
                        >
                            <AccountBalanceWalletOutlined fontSize="small" />
                        </Box>
                        <Typography fontSize={12} fontWeight={700} color={colors.slate}>
                            NET EXPENDITURE
                        </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={850} color={colors.pine}>
                        ₹{stats.netPaid}
                    </Typography>
                    <Typography fontSize={11.5} color={colors.slate}>
                        Effective medical expenses
                    </Typography>
                </Card>

                <Card
                    elevation={0}
                    sx={{
                        p: 2.5,
                        borderRadius: 3,
                        bgcolor: colors.white,
                        border: `1px solid ${colors.hairline}`,
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 2,
                                bgcolor: colors.canvas,
                                color: colors.ink,
                                display: "grid",
                                placeItems: "center",
                            }}
                        >
                            <SecurityOutlined fontSize="small" />
                        </Box>
                        <Typography fontSize={12} fontWeight={700} color={colors.slate}>
                            GATEWAY
                        </Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight={800} color={colors.ink}>
                        Razorpay
                    </Typography>
                    <Typography fontSize={11.5} color={colors.slate}>
                        256-bit SSL Verified
                    </Typography>
                </Card>
            </Box>

            {/* MAIN TRANSACTIONS CARD */}
            <Card
                elevation={0}
                sx={{
                    borderRadius: 3,
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
                        <ReceiptLongOutlined sx={{ color: colors.pine }} />
                        <Typography fontWeight={800} fontSize={16} color={colors.ink}>
                            Payment Records ({filteredPayments.length})
                        </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Typography fontSize={13} color={colors.slate} fontWeight={600}>
                            Filter:
                        </Typography>
                        <Select
                            size="small"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
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

                {/* CONTENT */}
                <CardContent sx={{ p: 0 }}>
                    {loading ? (
                        <Box py={8} textAlign="center">
                            <CircularProgress sx={{ color: colors.pine }} />
                            <Typography mt={2} color={colors.slate} fontSize={14}>
                                Fetching payment records...
                            </Typography>
                        </Box>
                    ) : filteredPayments.length === 0 ? (
                        <Box py={8} textAlign="center">
                            <ReceiptLongOutlined sx={{ fontSize: 48, color: colors.slate, opacity: 0.5, mb: 1 }} />
                            <Typography fontWeight={700} color={colors.ink}>
                                No payment records found
                            </Typography>
                            <Typography fontSize={13} color={colors.slate} mt={0.5}>
                                When you book doctor appointments with consultation fees, your receipts will appear here.
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer sx={{ overflowX: "auto" }}>
                            <Table sx={{ minWidth: 750 }}>
                                <TableHead sx={{ bgcolor: colors.canvas }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, fontSize: 12, color: colors.slate }}>
                                            TRANSACTION ID
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: 12, color: colors.slate }}>
                                            DOCTOR / HOSPITAL
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: 12, color: colors.slate }}>
                                            APPOINTMENT SLOT
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: 12, color: colors.slate }}>
                                            AMOUNT
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: 12, color: colors.slate }}>
                                            PAYMENT STATUS
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
                                        const c = statusColors[p.paymentStatus] || statusColors.Created;
                                        const docName = p.doctorId?.doctorName
                                            ? `Dr. ${p.doctorId.doctorName.replace(/^dr\.?\s+/i, "")}`
                                            : "Doctor";
                                        const hospName = p.hospitalId?.hospitalName || "Hospital";
                                        const apptDate = p.appointmentId?.appointmentDate
                                            ? new Date(p.appointmentId.appointmentDate).toLocaleDateString()
                                            : "—";

                                        return (
                                            <TableRow key={p._id} hover>
                                                <TableCell sx={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: colors.ink }}>
                                                    {p.gatewayPaymentId || p.transactionReference || "Pending"}
                                                </TableCell>

                                                <TableCell>
                                                    <Typography fontWeight={750} fontSize={13.5} color={colors.ink}>
                                                        {docName}
                                                    </Typography>
                                                    <Typography fontSize={12} color={colors.slate}>
                                                        {hospName}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography fontSize={13} fontWeight={600} color={colors.ink}>
                                                        {apptDate}
                                                    </Typography>
                                                    <Typography fontSize={12} color={colors.pine} fontWeight={600}>
                                                        {p.appointmentId?.appointmentTime || "—"}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography fontWeight={850} fontSize={14.5} color={colors.ink}>
                                                        ₹{p.amount}
                                                    </Typography>
                                                    <Typography fontSize={11} color={colors.slate} sx={{ textTransform: "uppercase" }}>
                                                        {p.paymentMethod || "ONLINE"}
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
                                                        onClick={() => setSelectedReceipt(p)}
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
                                                        Receipt
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

            {/* RECEIPT MODAL DIALOG */}
            {selectedReceipt && (
                <Dialog
                    open={Boolean(selectedReceipt)}
                    onClose={() => setSelectedReceipt(null)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: { borderRadius: 3.5, p: 1 },
                    }}
                >
                    <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box
                                sx={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: 2,
                                    bgcolor: colors.pineSoft,
                                    color: colors.pine,
                                    display: "grid",
                                    placeItems: "center",
                                }}
                            >
                                <ReceiptLongOutlined />
                            </Box>
                            <Box>
                                <Typography fontWeight={850} fontSize={17} color={colors.ink}>
                                    Payment Receipt
                                </Typography>
                                <Typography fontSize={12} color={colors.slate}>
                                    SmartCare AI Hospital Management
                                </Typography>
                            </Box>
                        </Stack>
                        <IconButton onClick={() => setSelectedReceipt(null)} size="small">
                            <CloseOutlined />
                        </IconButton>
                    </DialogTitle>

                    <Divider />

                    <DialogContent sx={{ py: 3 }}>
                        {/* HEADER BADGE */}
                        <Box sx={{ textAlign: "center", mb: 3 }}>
                            <Box
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 1,
                                    bgcolor: "#ECFDF5",
                                    color: "#065F46",
                                    border: "1px solid #A7F3D0",
                                    px: 2,
                                    py: 0.8,
                                    borderRadius: 999,
                                    fontWeight: 800,
                                    fontSize: 13,
                                }}
                            >
                                <CheckCircleOutlined fontSize="small" /> Verified Transaction
                            </Box>
                            <Typography variant="h4" fontWeight={900} color={colors.ink} mt={2}>
                                ₹{selectedReceipt.amount}
                            </Typography>
                            <Typography fontSize={12.5} color={colors.slate} mt={0.5}>
                                Paid on {new Date(selectedReceipt.paidAt || selectedReceipt.createdAt).toLocaleString()}
                            </Typography>
                        </Box>

                        {/* RECEIPT DETAILS BOX */}
                        <Box
                            sx={{
                                p: 2.5,
                                borderRadius: 3,
                                bgcolor: colors.canvas,
                                border: `1px solid ${colors.hairline}`,
                                mb: 2.5,
                            }}
                        >
                            <Stack spacing={1.5}>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography fontSize={13} color={colors.slate} fontWeight={600}>
                                        Transaction Reference:
                                    </Typography>
                                    <Typography fontSize={13} fontWeight={750} fontFamily="monospace" color={colors.ink}>
                                        {selectedReceipt.gatewayPaymentId || selectedReceipt.transactionReference || "Pending"}
                                    </Typography>
                                </Stack>

                                <Stack direction="row" justifyContent="space-between">
                                    <Typography fontSize={13} color={colors.slate} fontWeight={600}>
                                        Gateway Order ID:
                                    </Typography>
                                    <Typography fontSize={13} fontWeight={600} fontFamily="monospace" color={colors.ink}>
                                        {selectedReceipt.gatewayOrderId || "—"}
                                    </Typography>
                                </Stack>

                                <Stack direction="row" justifyContent="space-between">
                                    <Typography fontSize={13} color={colors.slate} fontWeight={600}>
                                        Payment Method:
                                    </Typography>
                                    <Typography fontSize={13} fontWeight={750} color={colors.ink} sx={{ textTransform: "uppercase" }}>
                                        {selectedReceipt.paymentMethod || "Online"} (Razorpay)
                                    </Typography>
                                </Stack>

                                <Divider sx={{ my: 1 }} />

                                <Stack direction="row" justifyContent="space-between">
                                    <Typography fontSize={13} color={colors.slate} fontWeight={600}>
                                        Consulting Doctor:
                                    </Typography>
                                    <Typography fontSize={13} fontWeight={750} color={colors.ink}>
                                        Dr. {selectedReceipt.doctorId?.doctorName?.replace(/^dr\.?\s+/i, "") || "Specialist"}
                                    </Typography>
                                </Stack>

                                <Stack direction="row" justifyContent="space-between">
                                    <Typography fontSize={13} color={colors.slate} fontWeight={600}>
                                        Hospital Center:
                                    </Typography>
                                    <Typography fontSize={13} fontWeight={600} color={colors.ink}>
                                        {selectedReceipt.hospitalId?.hospitalName || "Medical Center"}
                                    </Typography>
                                </Stack>

                                <Stack direction="row" justifyContent="space-between">
                                    <Typography fontSize={13} color={colors.slate} fontWeight={600}>
                                        Appointment Slot:
                                    </Typography>
                                    <Typography fontSize={13} fontWeight={700} color={colors.pine}>
                                        {selectedReceipt.appointmentId?.appointmentDate
                                            ? new Date(selectedReceipt.appointmentId.appointmentDate).toLocaleDateString()
                                            : ""}{" "}
                                        at {selectedReceipt.appointmentId?.appointmentTime || ""}
                                    </Typography>
                                </Stack>

                                {selectedReceipt.refundAmount > 0 && (
                                    <>
                                        <Divider sx={{ my: 1 }} />
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography fontSize={13} color="#15803D" fontWeight={700}>
                                                Refund Processed:
                                            </Typography>
                                            <Typography fontSize={13} fontWeight={800} color="#15803D">
                                                ₹{selectedReceipt.refundAmount}
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography fontSize={12} color={colors.slate}>
                                                Refund Reference:
                                            </Typography>
                                            <Typography fontSize={12} fontFamily="monospace" color={colors.slate}>
                                                {selectedReceipt.gatewayRefundId || "Processing"}
                                            </Typography>
                                        </Stack>
                                    </>
                                )}
                            </Stack>
                        </Box>

                        <Typography fontSize={11.5} color={colors.slate} textAlign="center">
                            This is a computer-generated tax invoice for doctor consultation fees processed securely via Razorpay.
                        </Typography>
                    </DialogContent>

                    <DialogActions sx={{ p: 2.5, pt: 0, justifyContent: "space-between" }}>
                        <Button
                            variant="outlined"
                            startIcon={<PrintOutlined />}
                            onClick={handlePrint}
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                            Print Receipt
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => setSelectedReceipt(null)}
                            sx={{
                                borderRadius: 2,
                                fontWeight: 700,
                                bgcolor: colors.pine,
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
