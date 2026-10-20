import React, { useEffect, useState } from "react";
import {
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
} from "@mui/material";
import {
    SearchRounded,
    DomainOutlined,
    MedicalServicesOutlined,
    DeleteOutlineRounded,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PageHeader from "../../components/dashboard/PageHeader";
import api from "../../services/api";

export default function AdminDepartments() {
    const [departments, setDepartments] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [hospitalFilter, setHospitalFilter] = useState("all");
    const [alert, setAlert] = useState({ type: "", message: "" });

    // Delete dialog
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [deptRes, hospRes] = await Promise.all([
                api.get("/department/all"),
                api.get("/hospitals/all"),
            ]);

            if (deptRes.data.success) {
                setDepartments(deptRes.data.departments || []);
            }
            if (hospRes.data.success) {
                setHospitals(hospRes.data.hospitals || []);
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to load departments.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await api.delete(`/department/${deleteId}`);
            setAlert({ type: "success", message: "Department deleted successfully." });
            setDeleteId(null);
            fetchData();
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to delete department.",
            });
            setDeleteId(null);
        } finally {
            setDeleting(false);
        }
    };

    const filtered = departments.filter((d) => {
        const name = d.departmentName?.toLowerCase() || "";
        const desc = d.description?.toLowerCase() || "";
        const hospName = d.hospitalId?.hospitalName?.toLowerCase() || "";
        const q = search.toLowerCase();

        const matchesSearch = name.includes(q) || desc.includes(q) || hospName.includes(q);
        const matchesHosp =
            hospitalFilter === "all" || String(d.hospitalId?._id || d.hospitalId) === hospitalFilter;

        return matchesSearch && matchesHosp;
    });

    return (
        <DashboardLayout
            role="admin"
            title="System Departments Directory"
            subtitle="Platform-wide clinical specialties and departmental structures"
        >
            <PageHeader
                title="Departments Management"
                subtitle="Oversee clinical units, departmental assignments, and doctor counts across all hospitals"
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
                            placeholder="Search departments by name or description..."
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
                            <DomainOutlined sx={{ fontSize: 52, color: "text.secondary", mb: 1.5 }} />
                            <Typography fontWeight={800} variant="h6">
                                No Departments Found
                            </Typography>
                            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                                No departments matched the selected filters.
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#F8FAFB" }}>
                                        <TableCell sx={{ fontWeight: 800 }}>Department</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Hospital Center</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Description</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Assigned Doctors</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filtered.map((dept) => (
                                        <TableRow key={dept._id} hover>
                                            <TableCell>
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Box
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: 2.5,
                                                            bgcolor: "rgba(15,82,75,0.08)",
                                                            color: "primary.main",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }}
                                                    >
                                                        <DomainOutlined />
                                                    </Box>
                                                    <Typography fontWeight={800} fontSize={14}>
                                                        {dept.departmentName}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>

                                            <TableCell>
                                                <Typography fontWeight={600} fontSize={13}>
                                                    {dept.hospitalId?.hospitalName || "Hospital"}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {dept.hospitalId?.city || ""}
                                                </Typography>
                                            </TableCell>

                                            <TableCell sx={{ maxWidth: 300 }}>
                                                <Typography variant="body2" color="text.secondary" noWrap>
                                                    {dept.description || "—"}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Chip
                                                    icon={<MedicalServicesOutlined sx={{ fontSize: "16px !important" }} />}
                                                    label={`${dept.doctorCount || 0} Doctors`}
                                                    size="small"
                                                    color={dept.doctorCount > 0 ? "primary" : "default"}
                                                    variant="outlined"
                                                    sx={{ fontWeight: 700 }}
                                                />
                                            </TableCell>

                                            <TableCell align="right">
                                                <Tooltip title="Delete Department">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => setDeleteId(dept._id)}
                                                    >
                                                        <DeleteOutlineRounded fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, color: "error.main" }}>
                    Confirm Delete Department
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to remove this department? Any doctors assigned to it must be reassigned first.
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
                        {deleting ? "Deleting..." : "Delete Department"}
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
}
