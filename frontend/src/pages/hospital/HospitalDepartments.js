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
    IconButton,
    InputAdornment,
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
} from "@mui/material";
import {
    AddRounded,
    EditOutlined,
    DeleteOutlineRounded,
    SearchRounded,
    DomainOutlined,
    MedicalServicesOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PageHeader from "../../components/dashboard/PageHeader";
import ImageUpload from "../../components/common/ImageUpload";
import api from "../../services/api";

export default function HospitalDepartments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [alert, setAlert] = useState({ type: "", message: "" });

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [form, setForm] = useState({
        departmentName: "",
        description: "",
        departmentImage: "",
    });
    const [submitting, setSubmitting] = useState(false);

    // Delete dialog
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const res = await api.get("/department/hospital");
            if (res.data.success) {
                setDepartments(res.data.departments || []);
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
        fetchDepartments();
    }, []);

    const handleOpenAdd = () => {
        setEditingDept(null);
        setForm({ departmentName: "", description: "", departmentImage: "" });
        setOpenDialog(true);
    };

    const handleOpenEdit = (dept) => {
        setEditingDept(dept);
        setForm({
            departmentName: dept.departmentName || "",
            description: dept.description || "",
            departmentImage: dept.departmentImage || "",
        });
        setOpenDialog(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.departmentName.trim()) {
            return setAlert({ type: "error", message: "Department name is required." });
        }

        setSubmitting(true);
        setAlert({ type: "", message: "" });
        try {
            if (editingDept) {
                await api.put(`/department/${editingDept._id}`, form);
                setAlert({ type: "success", message: "Department updated successfully!" });
            } else {
                await api.post("/department/add", form);
                setAlert({ type: "success", message: "Department created successfully!" });
            }
            setOpenDialog(false);
            fetchDepartments();
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to save department.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        setAlert({ type: "", message: "" });
        try {
            await api.delete(`/department/${deleteId}`);
            setAlert({ type: "success", message: "Department deleted successfully." });
            setDeleteId(null);
            fetchDepartments();
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

    const filtered = departments.filter((d) =>
        d.departmentName?.toLowerCase().includes(search.toLowerCase()) ||
        d.description?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout
            role="hospital"
            title="Hospital Departments"
            subtitle="Organize clinical specialties and medical units"
        >
            <PageHeader
                title="Departments Management"
                subtitle="Configure medical specialties, descriptions, and assign staff"
                backTo="/hospital"
                backLabel="← Back to Dashboard"
                action={
                    <Button
                        variant="contained"
                        startIcon={<AddRounded />}
                        onClick={handleOpenAdd}
                        sx={{ borderRadius: 3, textTransform: "none", fontWeight: 800, px: 3 }}
                    >
                        Add Department
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
                    {/* Search Bar */}
                    <Box sx={{ mb: 3 }}>
                        <TextField
                            size="small"
                            placeholder="Search departments..."
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
                    </Box>

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
                            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5, mb: 2 }}>
                                {search
                                    ? "No departments matched your search query."
                                    : "Get started by adding clinical departments to your hospital."}
                            </Typography>
                            {!search && (
                                <Button
                                    variant="outlined"
                                    startIcon={<AddRounded />}
                                    onClick={handleOpenAdd}
                                    sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700 }}
                                >
                                    Create First Department
                                </Button>
                            )}
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#F8FAFB" }}>
                                        <TableCell sx={{ fontWeight: 800 }}>Department</TableCell>
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
                                                            width: 42,
                                                            height: 42,
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
                                                    <Box>
                                                        <Typography fontWeight={800} fontSize={15}>
                                                            {dept.departmentName}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 350 }}>
                                                <Typography variant="body2" color="text.secondary" noWrap>
                                                    {dept.description || "No description provided."}
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
                                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleOpenEdit(dept)}
                                                    >
                                                        <EditOutlined fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => setDeleteId(dept._id)}
                                                    >
                                                        <DeleteOutlineRounded fontSize="small" />
                                                    </IconButton>
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

            {/* Add / Edit Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle sx={{ fontWeight: 800 }}>
                        {editingDept ? "Edit Department" : "Add New Department"}
                    </DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            <TextField
                                fullWidth
                                required
                                label="Department Name"
                                placeholder="e.g. Cardiology, Orthopedics, Pediatrics"
                                value={form.departmentName}
                                onChange={(e) => setForm({ ...form, departmentName: e.target.value })}
                            />
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Description"
                                placeholder="Brief overview of clinical scope and facilities..."
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                            <ImageUpload
                                label="Department Image / Badge"
                                value={form.departmentImage}
                                onChange={(url) => setForm({ ...form, departmentImage: url })}
                                folder="smartcare/departments"
                                helperText="Browse or drag department banner or icon to store in Cloudinary."
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2.5 }}>
                        <Button onClick={() => setOpenDialog(false)} color="inherit" sx={{ fontWeight: 600 }}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={submitting}
                            sx={{ fontWeight: 800, px: 3, textTransform: "none" }}
                        >
                            {submitting ? "Saving..." : editingDept ? "Save Changes" : "Create Department"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, color: "error.main" }}>
                    Confirm Delete Department
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to delete this department? This operation cannot be undone. Any doctors currently assigned must be reassigned first.
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
