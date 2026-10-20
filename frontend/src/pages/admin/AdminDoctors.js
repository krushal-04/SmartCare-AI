import React, { useEffect, useState } from "react";
import {
    Avatar,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
} from "@mui/material";
import {
    SearchRounded,
    MedicalServicesOutlined,
    LocalHospitalOutlined,
    InfoOutlined,
    DeleteOutlineRounded,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PageHeader from "../../components/dashboard/PageHeader";
import api from "../../services/api";

export default function AdminDoctors() {
    const [doctors, setDoctors] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [hospitalFilter, setHospitalFilter] = useState("all");
    const [alert, setAlert] = useState({ type: "", message: "" });

    // Details Dialog
    const [detailDoctor, setDetailDoctor] = useState(null);

    // Delete Dialog
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [docRes, hospRes] = await Promise.all([
                api.get("/doctor/all"),
                api.get("/hospitals/all"),
            ]);

            if (docRes.data.success) {
                setDoctors(docRes.data.doctors || []);
            }
            if (hospRes.data.success) {
                setHospitals(hospRes.data.hospitals || []);
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to load doctors list.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDeleteDoctor = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await api.delete(`/doctor/${deleteId}`);
            setAlert({ type: "success", message: "Doctor record and schedule removed." });
            setDeleteId(null);
            fetchData();
        } catch (err) {
            setAlert({ type: "error", message: err.response?.data?.message || "Failed to delete doctor." });
            setDeleteId(null);
        } finally {
            setDeleting(false);
        }
    };

    const filtered = doctors.filter((doc) => {
        const name = doc.doctorName?.toLowerCase() || "";
        const spec = doc.specialization?.toLowerCase() || "";
        const hospName = doc.hospitalId?.hospitalName?.toLowerCase() || "";
        const q = search.toLowerCase();

        const matchesSearch = name.includes(q) || spec.includes(q) || hospName.includes(q);
        const matchesHospital =
            hospitalFilter === "all" || String(doc.hospitalId?._id || doc.hospitalId) === hospitalFilter;

        return matchesSearch && matchesHospital;
    });

    return (
        <DashboardLayout
            role="admin"
            title="System Doctors Directory"
            subtitle="Platform-wide medical practitioners, specialties, credentials, and hospital affiliations"
        >
            <PageHeader
                title="Doctors Management"
                subtitle="Oversee medical staff cross-referenced by hospital and department"
                backTo="/admin"
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
                            placeholder="Search doctors by name, specialty, or hospital..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sx={{ width: { xs: "100%", sm: 340 } }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchRounded fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <FormControl size="small" sx={{ minWidth: 220 }}>
                            <InputLabel>Filter by Hospital</InputLabel>
                            <Select
                                value={hospitalFilter}
                                label="Filter by Hospital"
                                onChange={(e) => setHospitalFilter(e.target.value)}
                            >
                                <MenuItem value="all">All Hospitals</MenuItem>
                                {hospitals.map((h) => (
                                    <MenuItem key={h._id} value={h._id}>
                                        {h.hospitalName} ({h.city})
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
                            <MedicalServicesOutlined sx={{ fontSize: 52, color: "text.secondary", mb: 1.5 }} />
                            <Typography fontWeight={800} variant="h6">
                                No Doctors Found
                            </Typography>
                            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                                {search || hospitalFilter !== "all"
                                    ? "No doctors matched the specified filters."
                                    : "No doctors have been registered by hospitals yet."}
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#F8FAFB" }}>
                                        <TableCell sx={{ fontWeight: 800 }}>Physician</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Hospital Affiliation</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Department & Specialty</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Experience & Fee</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filtered.map((doc) => {
                                        const hName = doc.hospitalId?.hospitalName || "Hospital Center";
                                        const deptName = doc.departmentId?.departmentName || "General";
                                        return (
                                            <TableRow key={doc._id} hover>
                                                <TableCell>
                                                    <Stack direction="row" spacing={2} alignItems="center">
                                                        <Avatar
                                                            src={doc.doctorImage}
                                                            sx={{ width: 42, height: 42, bgcolor: "primary.main", fontWeight: 800 }}
                                                        >
                                                            {doc.doctorName?.charAt(0)}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography fontWeight={800} fontSize={14}>
                                                                Dr. {doc.doctorName.replace(/^Dr\.\s*/i, "")}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {doc.qualification}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography fontWeight={600} fontSize={13}>
                                                        {hName}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {doc.hospitalId?.city || ""}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Chip
                                                        label={deptName}
                                                        size="small"
                                                        variant="outlined"
                                                        color="primary"
                                                        sx={{ fontWeight: 700, mb: 0.3 }}
                                                    />
                                                    <Typography variant="body2" color="text.secondary" fontSize={12}>
                                                        {doc.specialization}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography fontWeight={700} fontSize={13}>
                                                        ₹{doc.consultationFee}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {doc.experience} Years Exp.
                                                    </Typography>
                                                </TableCell>

                                                <TableCell align="right">
                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                        <Tooltip title="View Physician Dossier">
                                                            <IconButton
                                                                size="small"
                                                                color="info"
                                                                onClick={() => setDetailDoctor(doc)}
                                                            >
                                                                <InfoOutlined fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete Doctor Record">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => setDeleteId(doc._id)}
                                                            >
                                                                <DeleteOutlineRounded fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
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

            {/* Doctor Details Modal */}
            <Dialog open={Boolean(detailDoctor)} onClose={() => setDetailDoctor(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>
                    Physician Profile & Credentials
                </DialogTitle>
                <DialogContent dividers>
                    {detailDoctor && (
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">Full Name</Typography>
                                <Typography fontWeight={700}>Dr. {detailDoctor.doctorName}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">Hospital</Typography>
                                <Typography fontWeight={700}>{detailDoctor.hospitalId?.hospitalName}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">Specialization</Typography>
                                <Typography fontWeight={600}>{detailDoctor.specialization}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">Qualification</Typography>
                                <Typography fontWeight={600}>{detailDoctor.qualification}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">Email</Typography>
                                <Typography fontWeight={600}>{detailDoctor.email}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">Phone</Typography>
                                <Typography fontWeight={600}>{detailDoctor.phone}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">Fee</Typography>
                                <Typography fontWeight={700}>₹{detailDoctor.consultationFee}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">Experience</Typography>
                                <Typography fontWeight={600}>{detailDoctor.experience} Years</Typography>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDetailDoctor(null)} color="inherit" sx={{ fontWeight: 600 }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Doctor Modal */}
            <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, color: "error.main" }}>
                    Confirm Delete Doctor
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to remove this doctor from the platform? Their active schedule and slots will also be purged.
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
                        onClick={handleDeleteDoctor}
                        sx={{ fontWeight: 800, textTransform: "none" }}
                    >
                        {deleting ? "Deleting..." : "Delete Doctor"}
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
}
