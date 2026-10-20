import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Avatar,
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
    AddRounded,
    EditOutlined,
    DeleteOutlineRounded,
    SearchRounded,
    ScheduleOutlined,
    MedicalServicesOutlined,
    EmailOutlined,
    PhoneOutlined,
    FilterListRounded,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PageHeader from "../../components/dashboard/PageHeader";
import ImageUpload from "../../components/common/ImageUpload";
import api from "../../services/api";

export default function HospitalDoctors() {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");
    const [alert, setAlert] = useState({ type: "", message: "" });

    // Add / Edit Modal
    const [openDialog, setOpenDialog] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        doctorName: "",
        email: "",
        phone: "",
        qualification: "",
        specialization: "",
        experience: "",
        consultationFee: "",
        gender: "Male",
        languages: "English, Hindi",
        departmentId: "",
        doctorImage: "",
    });

    // Delete Modal
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [docRes, deptRes] = await Promise.all([
                api.get("/doctor/hospital"),
                api.get("/department/hospital"),
            ]);

            if (docRes.data.success) {
                setDoctors(docRes.data.doctors || []);
            }
            if (deptRes.data.success) {
                setDepartments(deptRes.data.departments || []);
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to load medical staff.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenAdd = () => {
        setEditingDoctor(null);
        setForm({
            doctorName: "",
            email: "",
            phone: "",
            qualification: "MBBS, MD",
            specialization: "",
            experience: "5",
            consultationFee: "500",
            gender: "Male",
            languages: "English, Hindi",
            departmentId: departments[0]?._id || "",
            doctorImage: "",
        });
        setOpenDialog(true);
    };

    const handleOpenEdit = (doc) => {
        setEditingDoctor(doc);
        setForm({
            doctorName: doc.doctorName || "",
            email: doc.email || "",
            phone: doc.phone || "",
            qualification: doc.qualification || "",
            specialization: doc.specialization || "",
            experience: String(doc.experience ?? ""),
            consultationFee: String(doc.consultationFee ?? ""),
            gender: doc.gender || "Male",
            languages: Array.isArray(doc.languages) ? doc.languages.join(", ") : doc.languages || "",
            departmentId: doc.departmentId?._id || doc.departmentId || "",
            doctorImage: doc.doctorImage || "",
        });
        setOpenDialog(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlert({ type: "", message: "" });

        if (!form.doctorName.trim() || !form.email.trim() || !form.phone.trim() || !form.departmentId) {
            return setAlert({ type: "error", message: "Please fill in all required fields." });
        }

        setSubmitting(true);
        try {
            const payload = {
                ...form,
                experience: Number(form.experience) || 0,
                consultationFee: Number(form.consultationFee) || 0,
                languages: form.languages.split(",").map((s) => s.trim()).filter(Boolean),
            };

            if (editingDoctor) {
                await api.put(`/doctor/${editingDoctor._id}`, payload);
                setAlert({ type: "success", message: "Doctor profile updated successfully!" });
            } else {
                await api.post("/doctor/add", payload);
                setAlert({
                    type: "success",
                    message: "Doctor added successfully! An active default schedule (Mon-Sat, 9am-5pm) was provisioned.",
                });
            }
            setOpenDialog(false);
            fetchData();
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to save doctor.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await api.delete(`/doctor/${deleteId}`);
            setAlert({ type: "success", message: "Doctor and associated schedule deleted." });
            setDeleteId(null);
            fetchData();
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to delete doctor.",
            });
            setDeleteId(null);
        } finally {
            setDeleting(false);
        }
    };

    const filtered = doctors.filter((doc) => {
        const matchesSearch =
            doc.doctorName?.toLowerCase().includes(search.toLowerCase()) ||
            doc.specialization?.toLowerCase().includes(search.toLowerCase()) ||
            doc.email?.toLowerCase().includes(search.toLowerCase());

        const docDeptId = doc.departmentId?._id || doc.departmentId;
        const matchesDept = selectedDeptFilter === "all" || docDeptId === selectedDeptFilter;

        return matchesSearch && matchesDept;
    });

    return (
        <DashboardLayout
            role="hospital"
            title="Hospital Doctors"
            subtitle="Manage medical specialists, departments, and consultation fees"
        >
            <PageHeader
                title="Doctors Directory"
                subtitle="Register physicians, assign departments, and configure duty slots"
                backTo="/hospital"
                backLabel="← Back to Dashboard"
                action={
                    <Button
                        variant="contained"
                        startIcon={<AddRounded />}
                        onClick={handleOpenAdd}
                        disabled={departments.length === 0}
                        sx={{ borderRadius: 3, textTransform: "none", fontWeight: 800, px: 3 }}
                    >
                        Add Doctor
                    </Button>
                }
            />

            {departments.length === 0 && !loading && (
                <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
                    You need to create at least one Department before adding doctors.{" "}
                    <Button
                        size="small"
                        onClick={() => navigate("/hospital/departments")}
                        sx={{ fontWeight: 800, textTransform: "none" }}
                    >
                        Go to Departments
                    </Button>
                </Alert>
            )}

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
                            placeholder="Search doctors by name, specialty, email..."
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

                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Filter by Department</InputLabel>
                            <Select
                                value={selectedDeptFilter}
                                label="Filter by Department"
                                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                            >
                                <MenuItem value="all">All Departments</MenuItem>
                                {departments.map((d) => (
                                    <MenuItem key={d._id} value={d._id}>
                                        {d.departmentName}
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
                            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5, mb: 2 }}>
                                {search || selectedDeptFilter !== "all"
                                    ? "No doctors matched the current filters."
                                    : "Add medical specialists to start offering patient appointments."}
                            </Typography>
                            {departments.length > 0 && (
                                <Button
                                    variant="outlined"
                                    startIcon={<AddRounded />}
                                    onClick={handleOpenAdd}
                                    sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700 }}
                                >
                                    Register First Doctor
                                </Button>
                            )}
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#F8FAFB" }}>
                                        <TableCell sx={{ fontWeight: 800 }}>Doctor</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Department & Specialty</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Contact Details</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Experience & Fee</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filtered.map((doc) => {
                                        const deptName = doc.departmentId?.departmentName || "General";
                                        return (
                                            <TableRow key={doc._id} hover>
                                                <TableCell>
                                                    <Stack direction="row" spacing={2} alignItems="center">
                                                        <Avatar
                                                            src={doc.doctorImage}
                                                            alt={doc.doctorName}
                                                            sx={{
                                                                width: 44,
                                                                height: 44,
                                                                bgcolor: "primary.main",
                                                                fontWeight: 800,
                                                            }}
                                                        >
                                                            {doc.doctorName?.charAt(0)}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography fontWeight={800} fontSize={15}>
                                                                Dr. {doc.doctorName.replace(/^Dr\.\s*/i, "")}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary" fontSize={12}>
                                                                {doc.qualification}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </TableCell>

                                                <TableCell>
                                                    <Chip
                                                        label={deptName}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                        sx={{ fontWeight: 700, mb: 0.5 }}
                                                    />
                                                    <Typography variant="body2" color="text.secondary" fontSize={12}>
                                                        {doc.specialization}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Stack spacing={0.3}>
                                                        <Typography fontSize={12} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                            <EmailOutlined sx={{ fontSize: 14, color: "text.secondary" }} />
                                                            {doc.email}
                                                        </Typography>
                                                        <Typography fontSize={12} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                            <PhoneOutlined sx={{ fontSize: 14, color: "text.secondary" }} />
                                                            {doc.phone}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography fontWeight={700} fontSize={13}>
                                                        ₹{doc.consultationFee}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" fontSize={12}>
                                                        {doc.experience} Years Exp.
                                                    </Typography>
                                                </TableCell>

                                                <TableCell align="right">
                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                        <Tooltip title="Manage Duty Schedule">
                                                            <IconButton
                                                                size="small"
                                                                color="info"
                                                                onClick={() => navigate(`/hospital/schedules?doctorId=${doc._id}`)}
                                                            >
                                                                <ScheduleOutlined fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Edit Doctor Profile">
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => handleOpenEdit(doc)}
                                                            >
                                                                <EditOutlined fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete Doctor">
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

            {/* Add / Edit Doctor Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle sx={{ fontWeight: 800 }}>
                        {editingDoctor ? "Edit Doctor Profile" : "Register New Doctor"}
                    </DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Doctor Full Name"
                                    placeholder="e.g. John Doe"
                                    value={form.doctorName}
                                    onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Department</InputLabel>
                                    <Select
                                        value={form.departmentId}
                                        label="Department"
                                        onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                                    >
                                        {departments.map((d) => (
                                            <MenuItem key={d._id} value={d._id}>
                                                {d.departmentName}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    required
                                    type="email"
                                    label="Doctor Email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Phone Number"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Qualification"
                                    placeholder="e.g. MBBS, MD (Cardiology)"
                                    value={form.qualification}
                                    onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Specialization"
                                    placeholder="e.g. Interventional Cardiologist"
                                    value={form.specialization}
                                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                                />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Experience (Years)"
                                    value={form.experience}
                                    onChange={(e) => setForm({ ...form, experience: e.target.value })}
                                />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Consultation Fee (₹)"
                                    value={form.consultationFee}
                                    onChange={(e) => setForm({ ...form, consultationFee: e.target.value })}
                                />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Gender</InputLabel>
                                    <Select
                                        value={form.gender}
                                        label="Gender"
                                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                                    >
                                        <MenuItem value="Male">Male</MenuItem>
                                        <MenuItem value="Female">Female</MenuItem>
                                        <MenuItem value="Other">Other</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Languages Spoken"
                                    placeholder="English, Hindi, Gujarati"
                                    value={form.languages}
                                    onChange={(e) => setForm({ ...form, languages: e.target.value })}
                                    helperText="Comma separated list"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <ImageUpload
                                    label="Doctor Profile Photo"
                                    value={form.doctorImage}
                                    onChange={(url) => setForm({ ...form, doctorImage: url })}
                                    folder="smartcare/doctors"
                                    circle={true}
                                    helperText="Browse or drag doctor profile photo to store in Cloudinary."
                                />
                            </Grid>
                        </Grid>
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
                            {submitting ? "Saving..." : editingDoctor ? "Save Changes" : "Register Doctor"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, color: "error.main" }}>
                    Confirm Delete Doctor
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to remove this doctor? This will also remove the doctor's active schedule and booking slots.
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
                        {deleting ? "Deleting..." : "Delete Doctor"}
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
}
