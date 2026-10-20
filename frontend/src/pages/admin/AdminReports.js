import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    FormControl,
    Grid,
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
    Alert,
    Chip,
} from "@mui/material";
import {
    DescriptionOutlined,
    FileDownloadOutlined,
    FilterListRounded,
    CalendarMonthOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PageHeader from "../../components/dashboard/PageHeader";
import api from "../../services/api";

const REPORT_TYPES = [
    { label: "Appointments Report", value: "appointments" },
    { label: "Hospitals Registry Report", value: "hospitals" },
    { label: "Physicians & Doctors Report", value: "doctors" },
    { label: "Departments & Specialties Report", value: "departments" },
    { label: "Users & Accounts Report", value: "users" },
    { label: "Emergency Distress Calls Report", value: "emergencies" },
    { label: "Medical Diagnostics Archives Report", value: "reports" },
];

export default function AdminReports() {
    const [reportType, setReportType] = useState("appointments");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState("");

    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ type: "", message: "" });
    const [reportData, setReportData] = useState(null);

    const fetchReport = async () => {
        setLoading(true);
        setAlert({ type: "", message: "" });
        try {
            const params = { reportType };
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (status) params.status = status;

            const res = await api.get("/admin/reports", { params });
            if (res.data.success) {
                setReportData(res.data);
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to generate report.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [reportType]);

    // CSV Exporter
    const handleExportCSV = () => {
        if (!reportData?.records || reportData.records.length === 0) return;

        const records = reportData.records;
        let headers = [];
        let rows = [];

        if (reportType === "appointments") {
            headers = ["ID", "Patient", "Doctor", "Hospital", "Department", "Date", "Time", "Status", "Reason"];
            rows = records.map((r) => [
                r._id,
                `"${r.patientId?.fullName || "Patient"}"`,
                `"${r.doctorId?.doctorName || "Doctor"}"`,
                `"${r.hospitalId?.hospitalName || "Hospital"}"`,
                `"${r.departmentId?.departmentName || "General"}"`,
                new Date(r.appointmentDate).toISOString().split("T")[0],
                r.appointmentTime,
                r.status,
                `"${(r.reason || "").replace(/"/g, '""')}"`,
            ]);
        } else if (reportType === "hospitals") {
            headers = ["ID", "Hospital Name", "Email", "Phone", "Status", "Approved", "Registered Date"];
            rows = records.map((r) => [
                r._id,
                `"${r.fullName}"`,
                r.email,
                r.phone,
                r.status,
                r.isApproved ? "Yes" : "No",
                new Date(r.createdAt).toISOString().split("T")[0],
            ]);
        } else if (reportType === "doctors") {
            headers = ["ID", "Doctor Name", "Specialization", "Qualification", "Hospital", "Fee", "Experience"];
            rows = records.map((r) => [
                r._id,
                `"${r.doctorName}"`,
                `"${r.specialization}"`,
                `"${r.qualification}"`,
                `"${r.hospitalId?.hospitalName || ""}"`,
                r.consultationFee,
                r.experience,
            ]);
        } else if (reportType === "emergencies") {
            headers = ["ID", "Patient", "Hospital", "Contact", "Address", "Status", "Created At"];
            rows = records.map((r) => [
                r._id,
                `"${r.patientId?.fullName || ""}"`,
                `"${r.hospitalId?.hospitalName || ""}"`,
                r.contactNumber,
                `"${(r.address || "").replace(/"/g, '""')}"`,
                r.status,
                new Date(r.createdAt).toISOString(),
            ]);
        } else {
            headers = ["ID", "Name", "Email", "Phone", "Role", "Status", "Joined"];
            rows = records.map((r) => [
                r._id,
                `"${r.fullName || ""}"`,
                r.email || "",
                r.phone || "",
                r.role || "",
                r.status || "",
                new Date(r.createdAt).toISOString().split("T")[0],
            ]);
        }

        const csvContent =
            "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `SmartCare_${reportType}_report_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    return (
        <DashboardLayout
            role="admin"
            title="System Audit & Operational Reports"
            subtitle="Configurable multi-dimensional reports with date filtration, summary metrics, and CSV data export"
        >
            <PageHeader
                title="System Report Generation"
                subtitle="Generate comprehensive audit archives across all operational modules"
                backTo="/admin"
                backLabel="← Back to Dashboard"
                action={
                    <Button
                        variant="contained"
                        startIcon={<FileDownloadOutlined />}
                        disabled={!reportData?.records?.length}
                        onClick={handleExportCSV}
                        sx={{ borderRadius: 3, textTransform: "none", fontWeight: 800, px: 3 }}
                    >
                        Export CSV Data
                    </Button>
                }
            />

            {alert.message && (
                <Alert severity={alert.type} sx={{ mb: 3, borderRadius: 3 }}>
                    {alert.message}
                </Alert>
            )}

            {/* Filter Configuration Card */}
            <Card elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #E3EBEE", mb: 3.5 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Report Classification</InputLabel>
                            <Select
                                value={reportType}
                                label="Report Classification"
                                onChange={(e) => setReportType(e.target.value)}
                            >
                                {REPORT_TYPES.map((t) => (
                                    <MenuItem key={t.value} value={t.value}>
                                        {t.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={6} sm={2.5}>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="From Date"
                            InputLabelProps={{ shrink: true }}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            inputProps={{ style: { padding: "8.5px 12px" } }}
                        />
                    </Grid>

                    <Grid item xs={6} sm={2.5}>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="To Date"
                            InputLabelProps={{ shrink: true }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            inputProps={{ style: { padding: "8.5px 12px" } }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={3}>
                        <Stack direction="row" spacing={1}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={fetchReport}
                                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                            >
                                Filter Report
                            </Button>
                            {(startDate || endDate) && (
                                <Button
                                    size="small"
                                    color="inherit"
                                    onClick={() => {
                                        setStartDate("");
                                        setEndDate("");
                                        setTimeout(fetchReport, 50);
                                    }}
                                    sx={{ textTransform: "none" }}
                                >
                                    Reset
                                </Button>
                            )}
                        </Stack>
                    </Grid>
                </Grid>
            </Card>

            {/* Summary Highlights */}
            {reportData?.summary && (
                <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                    {Object.entries(reportData.summary).map(([k, v]) => (
                        <Grid item xs={6} sm={3} key={k}>
                            <Box
                                sx={{
                                    p: 2.2,
                                    borderRadius: 3,
                                    border: "1.5px solid #E2E8F0",
                                    bgcolor: "#FFFFFF",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                                }}
                            >
                                <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                                    {k.replace(/([A-Z])/g, " $1")}
                                </Typography>
                                <Typography variant="h5" fontWeight={900} sx={{ mt: 0.5, color: "#0F766E" }}>
                                    {v}
                                </Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Records Table */}
            <Card elevation={0} sx={{ borderRadius: 4, border: "1.5px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    {loading ? (
                        <Box py={8} textAlign="center">
                            <CircularProgress />
                        </Box>
                    ) : !reportData?.records?.length ? (
                        <Box py={8} textAlign="center">
                            <DescriptionOutlined sx={{ fontSize: 52, color: "text.secondary", mb: 1.5 }} />
                            <Typography fontWeight={800} variant="h6">
                                No Records in Selected Range
                            </Typography>
                            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                                Adjust the date parameters or report type to query records.
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                                        <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Record ID</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Primary Entity</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Reference / Facility</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Classification / Status</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Timestamp</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reportData.records.slice(0, 50).map((r, i) => {
                                        const dt = new Date(r.appointmentDate || r.createdAt);
                                        const formattedDate = !isNaN(dt)
                                            ? dt.toLocaleDateString("en-GB", {
                                                  day: "2-digit",
                                                  month: "short",
                                                  year: "numeric",
                                              })
                                            : "—";

                                        const idSnippet = String(r._id || "").slice(-6).toUpperCase();

                                        return (
                                            <TableRow key={r._id || i} hover>
                                                <TableCell>
                                                    <Chip
                                                        label={`#${idSnippet}`}
                                                        size="small"
                                                        sx={{
                                                            fontFamily: "monospace",
                                                            fontSize: 11.5,
                                                            fontWeight: 700,
                                                            bgcolor: "#F1F5F9",
                                                            color: "#334155",
                                                            borderRadius: 1.5,
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 800, fontSize: 13.5, color: "#0F172A" }}>
                                                    {r.fullName || r.doctorName || r.patientId?.fullName || r.departmentName || r.medicineName || "Record Entry"}
                                                </TableCell>
                                                <TableCell sx={{ color: "text.secondary", fontSize: 13 }}>
                                                    {r.hospitalId?.hospitalName || r.email || r.phone || r.genericName || "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={r.status || r.category || r.reportType || "Active"}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{
                                                            fontWeight: 700,
                                                            fontSize: 12,
                                                            borderColor: "#CBD5E1",
                                                            color: "#334155",
                                                            bgcolor: "#FAFAFA",
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ color: "#475569", fontSize: 12.5, fontWeight: 600 }}>
                                                    {formattedDate}
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
        </DashboardLayout>
    );
}
