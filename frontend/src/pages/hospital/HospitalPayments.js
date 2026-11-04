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
    CheckCircleOutlined,
    CloseOutlined,
    CurrencyRupeeOutlined,
    ReceiptLongOutlined,
    ReplayOutlined,
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

export default function HospitalPayments() {
    const [summary, setSummary] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDetail, setSelectedDetail] = useState(null);

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/payment/hospital-summary");
            setSummary(res.data.summary || {});
            setPayments(res.data.payments || []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load hospital payment summary.");
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
            const ref = p.gatewayPaymentId?.toLowerCase() || "";
            const term = searchTerm.toLowerCase();

            const matchesSearch =
                !searchTerm || patient.includes(term) || doctor.includes(term) || ref.includes(term);

            return matchesStatus && matchesSearch;
        });
    }, [payments, filterStatus, searchTerm]);

    return (
        <DashboardLayout
            role="hospital"
            title="Hospital Revenue & Payment Management"
            subtitle="Monitor patient consultation payments, collections per doctor and processed refunds"
        >
            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}

            {/* KPI METRIC CARDS */}
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
                            TOTAL REVENUE
                        </Typography>
                    </Stack>
                    <Typography variant="h4" fontWeight={900} color={colors.ink}>
                        ₹{summary?.totalRevenue || 0}
                    </Typography>
                    <Typography fontSize={11.5} color={colors.slate} mt={0.5}>
                        Gross fee collections
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
                        ₹{summary?.netRevenue || 0}
                    </Typography>
                    <Typography fontSize={11.5} color={colors.slate} mt={0.5}>
                        Net revenue after refunds
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
                        ₹{summary?.totalRefunded || 0}
                    </Typography>
                    <Typography fontSize={11.5} color={colors.slate} mt={0.5}>
                        Processed cancellations
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
                                bgcolor: "#FFFBEB",
                                color: "#B45309",
                                display: "grid",
                                placeItems: "center",
                            }}
                        >
                            <CheckCircleOutlined fontSize="small" />
                        </Box>
                        <Typography fontSize={12} fontWeight={750} color={colors.slate}>
                            SETTLED VISITS
                        </Typography>
                    </Stack>
                    <Typography variant="h4" fontWeight={900} color={colors.ink}>
                        {summary?.totalPaid || 0}
                    </Typography>
                    <Typography fontSize={11.5} color={colors.slate} mt={0.5}>
                        Paid consultation volume
                    </Typography>
                </Card>
            </Box>

            {/* TABLE CARD */}
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
                            Hospital Transactions ({filteredPayments.length})
                        </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                        <TextField
                            size="small"
                            placeholder="Search patient, doctor, ID..."
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
                        </Select>
                    </Stack>
                </Box>

                <CardContent sx={{ p: 0 }}>
                    {loading ? (
                        <Box py={8} textAlign="center">
                            <CircularProgress sx={{ color: colors.pine }} />
                            <Typography mt={2} color={colors.slate} fontSize={14}>
                                Loading hospital transaction ledger...
                            </Typography>
                        </Box>
                    ) : filteredPayments.length === 0 ? (
                        <Box py={8} textAlign="center">
                            <ReceiptLongOutlined sx={{ fontSize: 48, color: colors.slate, opacity: 0.5, mb: 1 }} />
                            <Typography fontWeight={750} color={colors.ink}>
                                No hospital payment transactions found
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer sx={{ overflowX: "auto" }}>
                            <Table sx={{ minWidth: 850 }}>
                                <TableHead sx={{ bgcolor: colors.canvas }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, fontSize: 12, color: colors.slate }}>
                                            TRANSACTION ID
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: 12, color: colors.slate }}>
                                            PATIENT NAME
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: 12, color: colors.slate }}>
                                            DOCTOR
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: 12, color: colors.slate }}>
                                            APPOINTMENT SLOT
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
                                                        {patientName}
                                                    </Typography>
                                                    <Typography fontSize={11.5} color={colors.slate}>
                                                        {p.patientId?.phone || ""}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography fontWeight={750} fontSize={13.5} color={colors.ink}>
                                                        {docName}
                                                    </Typography>
                                                    <Typography fontSize={11.5} color={colors.slate}>
                                                        {p.doctorId?.specialization || ""}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography fontSize={13} fontWeight={600} color={colors.ink}>
                                                        {apptDate}
                                                    </Typography>
                                                    <Typography fontSize={12} color={colors.pine} fontWeight={700}>
                                                        {p.appointmentId?.appointmentTime || "—"}
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
                            Hospital Payment Record
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
                                    Amount:
                                </Typography>
                                <Typography fontSize={16} fontWeight={900} color={colors.pine}>
                                    ₹{selectedDetail.amount}
                                </Typography>
                            </Stack>

                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontSize={13} color={colors.slate} fontWeight={600}>
                                    Payment ID:
                                </Typography>
                                <Typography fontSize={13} fontFamily="monospace" fontWeight={750} color={colors.ink}>
                                    {selectedDetail.gatewayPaymentId || "—"}
                                </Typography>
                            </Stack>

                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontSize={13} color={colors.slate} fontWeight={600}>
                                    Payment Method:
                                </Typography>
                                <Typography fontSize={13} fontWeight={600} sx={{ textTransform: "uppercase" }}>
                                    {selectedDetail.paymentMethod || "Online"} (Razorpay)
                                </Typography>
                            </Stack>

                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontSize={13} color={colors.slate} fontWeight={600}>
                                    Date:
                                </Typography>
                                <Typography fontSize={13} color={colors.ink}>
                                    {new Date(selectedDetail.paidAt || selectedDetail.createdAt).toLocaleString()}
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
                                            Razorpay Refund ID:
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
