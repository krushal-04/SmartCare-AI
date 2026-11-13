import React, { useEffect, useState, useCallback } from "react";
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
} from "@mui/material";
import {
    AddRounded,
    TimeToLeaveOutlined,
    PhoneOutlined,
    CheckCircleRounded,
    MyLocationRounded,
    RefreshRounded,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PageHeader from "../../components/dashboard/PageHeader";
import api from "../../services/api";
import { colors } from "../../theme/colors";

const CAPABILITY_OPTIONS = ["BASIC", "CARDIAC", "TRAUMA", "OXYGEN_SUPPORT"];
const VEHICLE_TYPES = [
    "Basic Life Support (BLS)",
    "Advanced Life Support (ALS)",
    "Patient Transport",
    "Neonatal Ambulance",
];

export default function HospitalAmbulances() {
    const [ambulances, setAmbulances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ type: "", message: "" });

    // Register Ambulance Modal
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        ambulanceNumber: "",
        vehicleRegNumber: "",
        vehicleType: "Basic Life Support (BLS)",
        capability: ["BASIC"],
        driverName: "",
        driverPhone: "",
        address: "",
    });

    const fetchFleet = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/ambulance/all");
            if (res.data?.success) {
                setAmbulances(res.data.ambulances || []);
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to load hospital ambulance fleet.",
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFleet();
    }, [fetchFleet]);

    const handleCreateAmbulance = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setAlert({ type: "", message: "" });

        try {
            const res = await api.post("/ambulance/create", form);
            if (res.data?.success) {
                setAlert({
                    type: "success",
                    message: "Ambulance registered successfully! Sent for administrative verification.",
                });
                setOpenAddDialog(false);
                setForm({
                    ambulanceNumber: "",
                    vehicleRegNumber: "",
                    vehicleType: "Basic Life Support (BLS)",
                    capability: ["BASIC"],
                    driverName: "",
                    driverPhone: "",
                    address: "",
                });
                fetchFleet();
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to register ambulance.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardLayout
            role="hospital"
            title="Hospital Ambulance Fleet"
            subtitle="Fleet registration, driver duty telemetry, and capability management"
        >
            <PageHeader
                title="Hospital Fleet Operations"
                subtitle="Manage registered emergency vehicles, vehicle capabilities, and driver duty telemetry"
                action={
                    <Stack direction="row" spacing={1.5}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshRounded />}
                            onClick={fetchFleet}
                            sx={{
                                borderRadius: 2.2,
                                textTransform: "none",
                                fontWeight: 700,
                                color: colors.slate,
                                borderColor: colors.hairline,
                                bgcolor: colors.white,
                            }}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddRounded />}
                            onClick={() => setOpenAddDialog(true)}
                            sx={{
                                bgcolor: colors.pine,
                                color: colors.white,
                                borderRadius: 2.2,
                                textTransform: "none",
                                fontWeight: 800,
                                "&:hover": { bgcolor: colors.pineDeep },
                            }}
                        >
                            Register Ambulance
                        </Button>
                    </Stack>
                }
            />

            {alert.message && (
                <Alert
                    severity={alert.type || "info"}
                    sx={{ mb: 3, borderRadius: 3 }}
                    onClose={() => setAlert({ type: "", message: "" })}
                >
                    {alert.message}
                </Alert>
            )}

            {loading ? (
                <Box textAlign="center" py={8}>
                    <CircularProgress sx={{ color: colors.pine }} />
                    <Typography mt={2} color={colors.slate} fontSize={14}>
                        Loading ambulance fleet...
                    </Typography>
                </Box>
            ) : ambulances.length === 0 ? (
                <Card
                    elevation={0}
                    sx={{
                        p: 6,
                        textAlign: "center",
                        borderRadius: 3.5,
                        border: `1px solid ${colors.hairline}`,
                        bgcolor: colors.white,
                    }}
                >
                    <Box
                        sx={{
                            width: 60,
                            height: 60,
                            borderRadius: "50%",
                            bgcolor: "#F0FDFA",
                            display: "grid",
                            placeItems: "center",
                            color: colors.pine,
                            mx: "auto",
                            mb: 2,
                        }}
                    >
                        <TimeToLeaveOutlined sx={{ fontSize: 32 }} />
                    </Box>
                    <Typography fontSize={18} fontWeight={850} color={colors.ink}>
                        No Ambulances Registered Yet
                    </Typography>
                    <Typography fontSize={13.5} color={colors.slate} mt={0.5} maxWidth={400} mx="auto">
                        Add ambulances to your hospital fleet so that incoming emergency requests can be dispatched immediately.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddRounded />}
                        onClick={() => setOpenAddDialog(true)}
                        sx={{
                            mt: 3,
                            bgcolor: colors.pine,
                            color: colors.white,
                            borderRadius: 2.5,
                            textTransform: "none",
                            fontWeight: 750,
                            "&:hover": { bgcolor: colors.pineDeep },
                        }}
                    >
                        Register First Ambulance
                    </Button>
                </Card>
            ) : (
                <Card
                    elevation={0}
                    sx={{
                        borderRadius: 3.5,
                        border: `1px solid ${colors.hairline}`,
                        bgcolor: colors.white,
                        overflow: "hidden",
                    }}
                >
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800, fontSize: 13, bgcolor: "#F8FAFC" }}>Vehicle</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: 13, bgcolor: "#F8FAFC" }}>Type & Capabilities</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: 13, bgcolor: "#F8FAFC" }}>Assigned Driver</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: 13, bgcolor: "#F8FAFC" }}>Duty & Status</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: 13, bgcolor: "#F8FAFC" }}>Verification</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: 13, bgcolor: "#F8FAFC" }}>GPS Telemetry</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ambulances.map((amb) => {
                                    const isAvailable = amb.availability && amb.status === "Available";
                                    const isGpsActive = Boolean(amb.currentLocation?.latitude);
                                    return (
                                        <TableRow key={amb._id} hover>
                                            <TableCell>
                                                <Typography fontSize={14.5} fontWeight={800} color={colors.ink}>
                                                    {amb.ambulanceNumber}
                                                </Typography>
                                                <Typography fontSize={12} color={colors.slate}>
                                                    Plate: {amb.vehicleRegNumber || amb.ambulanceNumber}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Typography fontSize={13} fontWeight={700} color={colors.ink}>
                                                    {amb.vehicleType}
                                                </Typography>
                                                <Box sx={{ display: "flex", gap: 0.6, mt: 0.5, flexWrap: "wrap" }}>
                                                    {(amb.capability || ["BASIC"]).map((cap) => (
                                                        <Chip
                                                            key={cap}
                                                            label={cap}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: "#F0FDFA",
                                                                color: colors.pine,
                                                                border: "1px solid #CCFBF1",
                                                                fontWeight: 800,
                                                                fontSize: 10,
                                                                height: 20,
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Typography fontSize={13.5} fontWeight={750} color={colors.ink}>
                                                    {amb.driverName}
                                                </Typography>
                                                <Typography fontSize={12} color={colors.slate}>
                                                    {amb.driverPhone}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Chip
                                                    label={amb.status}
                                                    size="small"
                                                    color={isAvailable ? "success" : "warning"}
                                                    sx={{ fontWeight: 800, fontSize: 11, height: 22 }}
                                                />
                                            </TableCell>

                                            <TableCell>
                                                <Chip
                                                    label={amb.verificationStatus || "VERIFIED"}
                                                    size="small"
                                                    sx={{
                                                        bgcolor:
                                                            amb.verificationStatus === "VERIFIED"
                                                                ? "#DCFCE7"
                                                                : amb.verificationStatus === "SUSPENDED"
                                                                ? "#FEE2E2"
                                                                : "#FEF3C7",
                                                        color:
                                                            amb.verificationStatus === "VERIFIED"
                                                                ? "#16A34A"
                                                                : amb.verificationStatus === "SUSPENDED"
                                                                ? "#DC2626"
                                                                : "#D97706",
                                                        fontWeight: 800,
                                                        fontSize: 11,
                                                        height: 22,
                                                    }}
                                                />
                                            </TableCell>

                                            <TableCell>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                                    <MyLocationRounded
                                                        sx={{
                                                            fontSize: 15,
                                                            color: isGpsActive ? "#16A34A" : colors.slate,
                                                        }}
                                                    />
                                                    <Typography fontSize={12} color={colors.slate}>
                                                        {isGpsActive ? "Active Fix" : "Standby"}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            )}

            {/* REGISTER AMBULANCE DIALOG */}
            <Dialog
                open={openAddDialog}
                onClose={() => setOpenAddDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3.5 } }}
            >
                <form onSubmit={handleCreateAmbulance}>
                    <DialogTitle sx={{ fontWeight: 850, fontSize: 18 }}>
                        Register Hospital Ambulance
                    </DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2.5}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Ambulance Code"
                                        placeholder="e.g. AMB-01"
                                        fullWidth
                                        required
                                        value={form.ambulanceNumber}
                                        onChange={(e) => setForm({ ...form, ambulanceNumber: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Registration Plate Number"
                                        placeholder="e.g. GJ-01-AB-1234"
                                        fullWidth
                                        value={form.vehicleRegNumber}
                                        onChange={(e) => setForm({ ...form, vehicleRegNumber: e.target.value })}
                                    />
                                </Grid>
                            </Grid>

                            <FormControl fullWidth>
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

                            <FormControl fullWidth>
                                <InputLabel>Clinical Capabilities</InputLabel>
                                <Select
                                    multiple
                                    value={form.capability}
                                    label="Clinical Capabilities"
                                    onChange={(e) => setForm({ ...form, capability: e.target.value })}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                            {selected.map((val) => (
                                                <Chip key={val} label={val} size="small" />
                                            ))}
                                        </Box>
                                    )}
                                >
                                    {CAPABILITY_OPTIONS.map((c) => (
                                        <MenuItem key={c} value={c}>
                                            {c}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Assigned Driver Name"
                                        placeholder="Driver full name"
                                        fullWidth
                                        required
                                        value={form.driverName}
                                        onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Driver Phone Number"
                                        placeholder="9876543210"
                                        fullWidth
                                        required
                                        value={form.driverPhone}
                                        onChange={(e) => setForm({ ...form, driverPhone: e.target.value })}
                                    />
                                </Grid>
                            </Grid>

                            <TextField
                                label="Base Station / Parking Address"
                                placeholder="Hospital emergency bay or parking lot"
                                fullWidth
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2.5 }}>
                        <Button
                            onClick={() => setOpenAddDialog(false)}
                            sx={{ textTransform: "none", fontWeight: 700, color: colors.slate }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={submitting}
                            sx={{
                                bgcolor: colors.pine,
                                color: colors.white,
                                borderRadius: 2.5,
                                textTransform: "none",
                                fontWeight: 800,
                                px: 3,
                                "&:hover": { bgcolor: colors.pineDeep },
                            }}
                        >
                            {submitting ? "Registering..." : "Submit Registration"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </DashboardLayout>
    );
}

