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
    TimeToLeaveOutlined,
    PhoneOutlined,
    LocationOnOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PageHeader from "../../components/dashboard/PageHeader";
import api from "../../services/api";

const VEHICLE_TYPES = [
    "Basic Life Support (BLS)",
    "Advanced Life Support (ALS)",
    "Patient Transport",
    "Neonatal Ambulance",
];

const AMBULANCE_STATUSES = ["Available", "Assigned", "On The Way", "Busy", "Offline"];

const STATUS_COLORS = {
    Available: "success",
    Assigned: "warning",
    "On The Way": "secondary",
    Busy: "error",
    Offline: "default",
};

export default function AdminAmbulances() {
    const [ambulances, setAmbulances] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [alert, setAlert] = useState({ type: "", message: "" });

    // Add / Edit Modal
    const [openDialog, setOpenDialog] = useState(false);
    const [editingAmb, setEditingAmb] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        ambulanceNumber: "",
        vehicleType: "Basic Life Support (BLS)",
        driverName: "",
        driverPhone: "",
        hospitalId: "",
        status: "Available",
        address: "",
    });

    // Delete Modal
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ambRes, hospRes] = await Promise.all([
                api.get("/ambulance/all"),
                api.get("/hospitals/all"),
            ]);

            if (ambRes.data.success) {
                setAmbulances(ambRes.data.ambulances || []);
            }
            if (hospRes.data.success) {
                setHospitals(hospRes.data.hospitals || []);
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to load ambulance fleet.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenAdd = () => {
        setEditingAmb(null);
        setForm({
            ambulanceNumber: "",
            vehicleType: "Basic Life Support (BLS)",
            driverName: "",
            driverPhone: "",
            hospitalId: hospitals[0]?._id || "",
            status: "Available",
            address: "",
        });
        setOpenDialog(true);
    };

    const handleOpenEdit = (amb) => {
        setEditingAmb(amb);
        setForm({
            ambulanceNumber: amb.ambulanceNumber || "",
            vehicleType: amb.vehicleType || "Basic Life Support (BLS)",
            driverName: amb.driverName || "",
            driverPhone: amb.driverPhone || "",
            hospitalId: amb.hospitalId?._id || amb.hospitalId || "",
            status: amb.status || "Available",
            address: amb.currentLocation?.address || "",
        });
        setOpenDialog(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlert({ type: "", message: "" });

        if (!form.ambulanceNumber.trim() || !form.driverName.trim() || !form.driverPhone.trim()) {
            return setAlert({ type: "error", message: "Please fill in all required fields." });
        }

        setSubmitting(true);
        try {
            if (editingAmb) {
                await api.put(`/ambulance/${editingAmb._id}`, form);
                setAlert({ type: "success", message: "Ambulance fleet record updated!" });
            } else {
                await api.post("/ambulance/create", form);
                setAlert({ type: "success", message: "New ambulance registered successfully!" });
            }
            setOpenDialog(false);
            fetchData();
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to save ambulance.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await api.delete(`/ambulance/${deleteId}`);
            setAlert({ type: "success", message: "Ambulance deleted from system fleet." });
            setDeleteId(null);
            fetchData();
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to delete ambulance.",
            });
            setDeleteId(null);
        } finally {
            setDeleting(false);
        }
    };

    const filtered = ambulances.filter((a) => {
        const num = a.ambulanceNumber?.toLowerCase() || "";
        const driver = a.driverName?.toLowerCase() || "";
        const phone = a.driverPhone?.toLowerCase() || "";
        const q = search.toLowerCase();

        const matchesSearch = num.includes(q) || driver.includes(q) || phone.includes(q);
        const matchesStatus = statusFilter === "all" || a.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <DashboardLayout
            role="admin"
            title="Emergency Fleet Management"
            subtitle="Real-time ambulance fleet registry, vehicle status, driver assignments, and base locations"
        >
            <PageHeader
                title="Ambulance Fleet Console"
                subtitle="Register ambulances, track deployment states, and assign vehicles to hospitals"
                backTo="/admin"
                backLabel="← Back to Dashboard"
                action={
                    <Button
                        variant="contained"
                        startIcon={<AddRounded />}
                        onClick={handleOpenAdd}
                        sx={{ borderRadius: 3, textTransform: "none", fontWeight: 800, px: 3 }}
                    >
                        Register Ambulance
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
                            placeholder="Search by vehicle number, driver, or phone..."
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

                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>Filter by Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Filter by Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="all">All Statuses</MenuItem>
                                {AMBULANCE_STATUSES.map((s) => (
                                    <MenuItem key={s} value={s}>
                                        {s}
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
                            <TimeToLeaveOutlined sx={{ fontSize: 52, color: "text.secondary", mb: 1.5 }} />
                            <Typography fontWeight={800} variant="h6">
                                No Ambulances Found
                            </Typography>
                            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5, mb: 2 }}>
                                {search || statusFilter !== "all"
                                    ? "No ambulances matched the selected filters."
                                    : "Register your first emergency fleet vehicle."}
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<AddRounded />}
                                onClick={handleOpenAdd}
                                sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700 }}
                            >
                                Register Ambulance
                            </Button>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#F8FAFB" }}>
                                        <TableCell sx={{ fontWeight: 800 }}>Vehicle Details</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Type & Capability</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Driver Information</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Assigned Base / Hospital</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Fleet Status</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filtered.map((amb) => (
                                        <TableRow key={amb._id} hover>
                                            <TableCell>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
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
                                                        <TimeToLeaveOutlined />
                                                    </Box>
                                                    <Box>
                                                        <Typography fontWeight={800} fontSize={14}>
                                                            {amb.ambulanceNumber}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {amb.currentLocation?.address || "Base Station"}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>

                                            <TableCell>
                                                <Chip
                                                    label={amb.vehicleType}
                                                    size="small"
                                                    variant="outlined"
                                                    color="primary"
                                                    sx={{ fontWeight: 700 }}
                                                />
                                            </TableCell>

                                            <TableCell>
                                                <Typography fontWeight={600} fontSize={13}>
                                                    {amb.driverName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" fontSize={12} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                    <PhoneOutlined sx={{ fontSize: 13 }} /> {amb.driverPhone}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Typography fontSize={13} fontWeight={600}>
                                                    {amb.hospitalId?.hospitalName || "Central Fleet"}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {amb.hospitalId?.city || ""}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Chip
                                                    label={amb.status}
                                                    color={STATUS_COLORS[amb.status] || "default"}
                                                    size="small"
                                                    sx={{ fontWeight: 800 }}
                                                />
                                            </TableCell>

                                            <TableCell align="right">
                                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                    <Tooltip title="Edit Ambulance">
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => handleOpenEdit(amb)}
                                                        >
                                                            <EditOutlined fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Ambulance">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => setDeleteId(amb._id)}
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

            {/* Add / Edit Ambulance Modal */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle sx={{ fontWeight: 800 }}>
                        {editingAmb ? "Edit Ambulance" : "Register Fleet Ambulance"}
                    </DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            <TextField
                                fullWidth
                                required
                                label="Ambulance Registration Number"
                                placeholder="e.g. GJ-01-AB-1234"
                                value={form.ambulanceNumber}
                                onChange={(e) => setForm({ ...form, ambulanceNumber: e.target.value })}
                            />

                            <FormControl fullWidth required>
                                <InputLabel>Vehicle Type</InputLabel>
                                <Select
                                    value={form.vehicleType}
                                    label="Vehicle Type"
                                    onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                                >
                                    {VEHICLE_TYPES.map((t) => (
                                        <MenuItem key={t} value={t}>
                                            {t}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="Driver Name"
                                        value={form.driverName}
                                        onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="Driver Phone"
                                        value={form.driverPhone}
                                        onChange={(e) => setForm({ ...form, driverPhone: e.target.value })}
                                    />
                                </Grid>
                            </Grid>

                            <FormControl fullWidth>
                                <InputLabel>Assign to Hospital Center</InputLabel>
                                <Select
                                    value={form.hospitalId}
                                    label="Assign to Hospital Center"
                                    onChange={(e) => setForm({ ...form, hospitalId: e.target.value })}
                                >
                                    <MenuItem value="">
                                        <em>Central Emergency Pool (No specific hospital)</em>
                                    </MenuItem>
                                    {hospitals.map((h) => (
                                        <MenuItem key={h._id} value={h._id}>
                                            {h.hospitalName} ({h.city})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth required>
                                <InputLabel>Operational Status</InputLabel>
                                <Select
                                    value={form.status}
                                    label="Operational Status"
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                >
                                    {AMBULANCE_STATUSES.map((s) => (
                                        <MenuItem key={s} value={s}>
                                            {s}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                label="Current Base Location / Landmark"
                                placeholder="e.g. Navrangpura Station Base"
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
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
                            sx={{ fontWeight: 800, textTransform: "none", px: 3 }}
                        >
                            {submitting ? "Saving..." : editingAmb ? "Save Changes" : "Register Ambulance"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Delete Modal */}
            <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, color: "error.main" }}>
                    Confirm Delete Ambulance
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to remove this ambulance from the fleet? Active vehicles dispatched on an emergency cannot be deleted.
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
                        {deleting ? "Deleting..." : "Delete Ambulance"}
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
}
