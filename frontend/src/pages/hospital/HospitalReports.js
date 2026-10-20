import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
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
    Grid,
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
    CloudUploadOutlined,
    DownloadOutlined,
    DeleteOutlineRounded,
    DescriptionOutlined,
    AttachFileOutlined,
    FilterListRounded,
    SearchRounded,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PageHeader from "../../components/dashboard/PageHeader";
import api from "../../services/api";

const REPORT_TYPES = [
    "Blood Test",
    "X-Ray",
    "MRI",
    "CT Scan",
    "Prescription",
    "Discharge Summary",
    "Other",
];

export default function HospitalReports() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialPatientId = queryParams.get("patientId");

    const [reports, setReports] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ type: "", message: "" });
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");

    // Upload Modal
    const [openUpload, setOpenUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        patientId: initialPatientId || "",
        reportType: "Blood Test",
        notes: "",
        reportFile: null,
    });

    // Delete Modal
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [repRes, patRes] = await Promise.all([
                api.get("/reports/hospital"),
                api.get("/hospitals/patients"),
            ]);

            if (repRes.data.success) {
                setReports(repRes.data.reports || []);
            }
            if (patRes.data.success) {
                setPatients(patRes.data.patients || []);
                if (initialPatientId && !uploadForm.patientId) {
                    setUploadForm((prev) => ({ ...prev, patientId: initialPatientId }));
                    setOpenUpload(true);
                }
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to load medical reports.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setUploadForm({ ...uploadForm, reportFile: e.target.files[0] });
        }
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!uploadForm.patientId) {
            return setAlert({ type: "error", message: "Please select a patient." });
        }
        if (!uploadForm.reportFile) {
            return setAlert({ type: "error", message: "Please choose a PDF, JPG, or PNG report file." });
        }

        setUploading(true);
        setAlert({ type: "", message: "" });

        try {
            const data = new FormData();
            data.append("patientId", uploadForm.patientId);
            data.append("reportType", uploadForm.reportType);
            data.append("notes", uploadForm.notes);
            data.append("reportFile", uploadForm.reportFile);

            const res = await api.post("/reports/hospital/upload", data, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data.success) {
                setAlert({
                    type: "success",
                    message: "Medical report uploaded and securely dispatched to patient!",
                });
                setOpenUpload(false);
                setUploadForm({
                    patientId: "",
                    reportType: "Blood Test",
                    notes: "",
                    reportFile: null,
                });
                fetchData();
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to upload report.",
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (report) => {
        try {
            const res = await api.get(`/reports/${report._id}/download`, {
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", report.originalName || "medical-report");
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setAlert({
                type: "error",
                message: "Failed to download medical report file.",
            });
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await api.delete(`/reports/${deleteId}`);
            setAlert({ type: "success", message: "Report deleted successfully." });
            setDeleteId(null);
            fetchData();
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to delete report.",
            });
            setDeleteId(null);
        } finally {
            setDeleting(false);
        }
    };

    const filtered = reports.filter((r) => {
        const pName = r.patientId?.fullName?.toLowerCase() || "";
        const originalName = r.originalName?.toLowerCase() || "";
        const matchesSearch = pName.includes(search.toLowerCase()) || originalName.includes(search.toLowerCase());
        const matchesType = typeFilter === "all" || r.reportType === typeFilter;
        return matchesSearch && matchesType;
    });

    return (
        <DashboardLayout
            role="hospital"
            title="Hospital Medical Reports"
            subtitle="Secure diagnostic uploads, laboratory reports, and prescription archives"
        >
            <PageHeader
                title="Medical Reports Center"
                subtitle="Upload verified laboratory, imaging, and discharge reports directly to patients"
                backTo="/hospital"
                backLabel="← Back to Dashboard"
                action={
                    <Button
                        variant="contained"
                        startIcon={<CloudUploadOutlined />}
                        onClick={() => setOpenUpload(true)}
                        sx={{ borderRadius: 3, textTransform: "none", fontWeight: 800, px: 3 }}
                    >
                        Upload Patient Report
                    </Button>
                }
            />

            {alert.message && (
                <Alert severity={alert.type} sx={{ mb: 3, borderRadius: 3 }}>
                    {alert.message}
                </Alert>
            )}

            <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #E3EBEE" }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    {/* Filters Bar */}
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        justifyContent="space-between"
                        alignItems={{ xs: "stretch", sm: "center" }}
                        sx={{ mb: 3 }}
                    >
                        <TextField
                            size="small"
                            placeholder="Search by patient name or document name..."
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

                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>Filter by Report Type</InputLabel>
                            <Select
                                value={typeFilter}
                                label="Filter by Report Type"
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <MenuItem value="all">All Report Types</MenuItem>
                                {REPORT_TYPES.map((t) => (
                                    <MenuItem key={t} value={t}>
                                        {t}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>

                    {loading ? (
                        <Box py={8} textAlign="center">
                            <CircularProgress />
                        </Box>
                    ) : filtered.length === 0 ? (
                        <Box py={8} textAlign="center">
                            <DescriptionOutlined sx={{ fontSize: 52, color: "text.secondary", mb: 1.5 }} />
                            <Typography fontWeight={800} variant="h6">
                                No Medical Reports Available
                            </Typography>
                            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5, mb: 2 }}>
                                {search || typeFilter !== "all"
                                    ? "No reports match your current filter settings."
                                    : "Upload your hospital's first patient diagnostic report."}
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<CloudUploadOutlined />}
                                onClick={() => setOpenUpload(true)}
                                sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700 }}
                            >
                                Upload Diagnostic Report
                            </Button>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#F8FAFB" }}>
                                        <TableCell sx={{ fontWeight: 800 }}>Patient</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Report Type</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Document Name & Size</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Upload Date</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Clinical Notes</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filtered.map((report) => (
                                        <TableRow key={report._id} hover>
                                            <TableCell>
                                                <Typography fontWeight={700} fontSize={14}>
                                                    {report.patientId?.fullName || "Patient"}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {report.patientId?.phone || report.patientId?.email}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Chip
                                                    label={report.reportType}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 700 }}
                                                />
                                            </TableCell>

                                            <TableCell>
                                                <Typography fontSize={13} fontWeight={600} noWrap sx={{ maxWidth: 220 }}>
                                                    {report.originalName}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {(report.size / 1024).toFixed(1)} KB
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Typography fontSize={13}>
                                                    {new Date(report.createdAt).toLocaleDateString()}
                                                </Typography>
                                            </TableCell>

                                            <TableCell sx={{ maxWidth: 220 }}>
                                                <Typography fontSize={12} color="text.secondary" noWrap>
                                                    {report.notes || "—"}
                                                </Typography>
                                            </TableCell>

                                            <TableCell align="right">
                                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                    <Tooltip title="Download Report File">
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => handleDownload(report)}
                                                        >
                                                            <DownloadOutlined fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Report">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => setDeleteId(report._id)}
                                                        >
                                                            <DeleteOutlineRounded fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            {/* Upload Report Modal */}
            <Dialog open={openUpload} onClose={() => setOpenUpload(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleUploadSubmit}>
                    <DialogTitle sx={{ fontWeight: 800 }}>
                        Upload Medical Report for Patient
                    </DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
                            <FormControl fullWidth required>
                                <InputLabel>Select Associated Patient</InputLabel>
                                <Select
                                    value={uploadForm.patientId}
                                    label="Select Associated Patient"
                                    onChange={(e) => setUploadForm({ ...uploadForm, patientId: e.target.value })}
                                >
                                    {patients.map((p) => (
                                        <MenuItem key={p._id} value={p._id}>
                                            {p.fullName} ({p.phone || p.email})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth required>
                                <InputLabel>Report Classification</InputLabel>
                                <Select
                                    value={uploadForm.reportType}
                                    label="Report Classification"
                                    onChange={(e) => setUploadForm({ ...uploadForm, reportType: e.target.value })}
                                >
                                    {REPORT_TYPES.map((t) => (
                                        <MenuItem key={t} value={t}>
                                            {t}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Box
                                sx={{
                                    border: "2px dashed #CBD5E1",
                                    borderRadius: 3,
                                    p: 3,
                                    textAlign: "center",
                                    bgcolor: "#F8FAFC",
                                }}
                            >
                                <input
                                    type="file"
                                    id="hospital-report-file"
                                    accept=".pdf,image/png,image/jpeg,image/jpg"
                                    style={{ display: "none" }}
                                    onChange={handleFileChange}
                                />
                                <label htmlFor="hospital-report-file">
                                    <Button
                                        variant="outlined"
                                        component="span"
                                        startIcon={<AttachFileOutlined />}
                                        sx={{ textTransform: "none", fontWeight: 700 }}
                                    >
                                        Choose File (PDF, JPG, PNG)
                                    </Button>
                                </label>
                                {uploadForm.reportFile && (
                                    <Typography fontWeight={700} fontSize={13} color="primary" sx={{ mt: 1.5 }}>
                                        Selected: {uploadForm.reportFile.name} ({(uploadForm.reportFile.size / 1024).toFixed(1)} KB)
                                    </Typography>
                                )}
                            </Box>

                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Clinical Findings & Notes"
                                placeholder="Doctor comments, summary of findings, follow-up instructions..."
                                value={uploadForm.notes}
                                onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2.5 }}>
                        <Button onClick={() => setOpenUpload(false)} color="inherit" sx={{ fontWeight: 600 }}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={uploading}
                            sx={{ fontWeight: 800, textTransform: "none", px: 3 }}
                        >
                            {uploading ? "Uploading Report..." : "Upload & Share Report"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, color: "error.main" }}>
                    Confirm Delete Report
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to remove this medical report? The file will be purged from server storage.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteId(null)} color="inherit" sx={{ fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        disabled={deleting}
                        onClick={handleDelete}
                        sx={{ fontWeight: 800, textTransform: "none" }}
                    >
                        {deleting ? "Deleting..." : "Delete"}
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
}
