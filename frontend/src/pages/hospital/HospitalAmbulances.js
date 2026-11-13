import React, { useEffect, useState, useCallback } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
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
    const [drivers, setDrivers] = useState([]);
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
        driverId: "",
        address: "",
    });
    const [openDriverDialog, setOpenDriverDialog] = useState(false);
    const [driverSubmitting, setDriverSubmitting] = useState(false);
    const [driverForm, setDriverForm] = useState({ fullName: "", email: "", phone: "", password: "" });
    const [restrictionTarget, setRestrictionTarget] = useState(null);
    const [restrictionReason, setRestrictionReason] = useState("");
    const [restrictionSubmitting, setRestrictionSubmitting] = useState(false);

    const fetchFleet = useCallback(async () => {
        try {
            setLoading(true);
            const [fleetRes, driversRes] = await Promise.all([api.get("/ambulance/all"), api.get("/hospital/drivers")]);
            if (fleetRes.data?.success) setAmbulances(fleetRes.data.ambulances || []);
            if (driversRes.data?.success) setDrivers(driversRes.data.drivers || []);
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
                    message: "Ambulance registered. Assign its driver and ask them to start duty before dispatching.",
                });
                setOpenAddDialog(false);
                setForm({
                    ambulanceNumber: "",
                    vehicleRegNumber: "",
                    vehicleType: "Basic Life Support (BLS)",
                    capability: ["BASIC"],
                    driverId: "",
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

    const handleCreateDriver = async (event) => {
        event.preventDefault();
        const cleanPhone = driverForm.phone.replace(/\D/g, "");
        if (cleanPhone.length !== 10) {
            setAlert({ type: "error", message: "Driver phone number must be exactly 10 digits." });
            return;
        }
        setDriverSubmitting(true);
        try {
            const res = await api.post("/hospital/drivers", {
                ...driverForm,
                phone: cleanPhone,
            });
            if (res.data?.success) {
                setAlert({ type: "success", message: "Driver account created. You can now link it to an ambulance." });
                setForm((current) => ({ ...current, driverId: res.data.driver._id }));
                setDriverForm({ fullName: "", email: "", phone: "", password: "" });
                setOpenDriverDialog(false);
                fetchFleet();
            }
        } catch (err) {
            setAlert({ type: "error", message: err.response?.data?.message || "Failed to create driver account." });
        } finally {
            setDriverSubmitting(false);
        }
    };

    const handleRestriction = async (restricted) => {
        if (!restrictionTarget) return;
        if (restricted && !restrictionReason.trim()) {
            setAlert({ type: "warning", message: "Enter a reason before restricting this ambulance." });
            return;
        }
        setRestrictionSubmitting(true);
        try {
            const res = await api.patch(`/ambulance/${restrictionTarget._id}/restriction`, {
                restricted,
                reason: restricted ? restrictionReason.trim() : undefined,
            });
            if (res.data?.success) {
                setAlert({ type: "success", message: res.data.message });
                setRestrictionTarget(null);
                setRestrictionReason("");
                fetchFleet();
            }
        } catch (err) {
            setAlert({ type: "error", message: err.response?.data?.message || "Unable to update ambulance restriction." });
        } finally {
            setRestrictionSubmitting(false);
        }
    };

    return (
        <DashboardLayout
            role="hospital"
            title="Hospital Ambulance Fleet"
            subtitle="Register vehicles, link drivers, and monitor fleet readiness"
        >
            <PageHeader
                title="Hospital Fleet Operations"
                subtitle="Register hospital vehicles, assign driver accounts, and monitor live readiness"
                action={
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ width: { xs: "100%", sm: "auto" } }}>
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
                        <Button variant="outlined" onClick={() => setOpenDriverDialog(true)} sx={{ borderRadius: 2.2, textTransform: "none", fontWeight: 750 }}>
                            Add Driver
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
                                    <TableCell sx={{ fontWeight: 800, fontSize: 13, bgcolor: "#F8FAFC" }}>Driver Duty & Vehicle</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: 13, bgcolor: "#F8FAFC" }}>GPS Telemetry</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: 13, bgcolor: "#F8FAFC" }} align="right">Safety control</TableCell>
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
                                                <Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap>
                                                    <Chip label={amb.driverId?.dutyStatus === "ON_DUTY" ? "Driver on duty" : "Driver off duty"} size="small" color={amb.driverId?.dutyStatus === "ON_DUTY" ? "success" : "default"} sx={{ fontWeight: 800, fontSize: 11, height: 22 }} />
                                                    <Chip label={amb.isRestricted ? "Restricted" : amb.status} size="small" color={amb.isRestricted ? "error" : isAvailable ? "success" : "warning"} sx={{ fontWeight: 800, fontSize: 11, height: 22 }} />
                                                </Stack>
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
                                            <TableCell align="right">
                                                <Button
                                                    size="small"
                                                    color={amb.isRestricted ? "success" : "error"}
                                                    variant="outlined"
                                                    disabled={Boolean(amb.assignedEmergencyId)}
                                                    onClick={() => { setRestrictionTarget(amb); setRestrictionReason(""); }}
                                                    sx={{ textTransform: "none", fontWeight: 750, borderRadius: 2 }}
                                                >
                                                    {amb.isRestricted ? "Restore" : "Restrict"}
                                                </Button>
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

                            <FormControl fullWidth required>
                                <InputLabel>Assigned Driver</InputLabel>
                                <Select value={form.driverId} label="Assigned Driver" onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
                                    {drivers.map((driver) => <MenuItem key={driver._id} value={driver._id} disabled={Boolean(driver.assignedAmbulanceId)}>{driver.fullName} · {driver.phone}{driver.assignedAmbulanceId ? ` · Linked to ${driver.assignedAmbulanceId.ambulanceNumber}` : ""}</MenuItem>)}
                                </Select>
                            </FormControl>

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

            <Dialog open={openDriverDialog} onClose={() => setOpenDriverDialog(false)} maxWidth="xs" fullWidth>
                <Box component="form" onSubmit={handleCreateDriver}>
                    <DialogTitle>Create Driver Account</DialogTitle>
                    <DialogContent dividers><Stack spacing={2}>
                        <TextField required fullWidth label="Driver name" value={driverForm.fullName} onChange={(e) => setDriverForm({ ...driverForm, fullName: e.target.value })} />
                        <TextField required fullWidth type="email" label="Email" value={driverForm.email} onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })} />
                        <TextField
                            required
                            fullWidth
                            label="Phone number"
                            placeholder="10-digit mobile number"
                            value={driverForm.phone}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                                setDriverForm({ ...driverForm, phone: val });
                            }}
                            inputProps={{
                                maxLength: 10,
                                inputMode: "numeric",
                                pattern: "[0-9]{10}",
                            }}
                            error={Boolean(driverForm.phone && driverForm.phone.length !== 10)}
                            helperText={
                                driverForm.phone && driverForm.phone.length !== 10
                                    ? `${driverForm.phone.length}/10 digits entered`
                                    : "Only 10-digit phone number allowed."
                            }
                        />
                        <TextField required fullWidth type="password" label="Temporary password" value={driverForm.password} onChange={(e) => setDriverForm({ ...driverForm, password: e.target.value })} helperText="Share this securely with the driver." />
                    </Stack></DialogContent>
                    <DialogActions><Button onClick={() => setOpenDriverDialog(false)}>Cancel</Button><Button type="submit" variant="contained" disabled={driverSubmitting}>{driverSubmitting ? "Creating…" : "Create Driver"}</Button></DialogActions>
                </Box>
            </Dialog>

            <Dialog open={Boolean(restrictionTarget)} onClose={() => setRestrictionTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle>{restrictionTarget?.isRestricted ? "Restore Ambulance" : "Restrict Ambulance"}</DialogTitle>
                <DialogContent dividers>
                    {restrictionTarget?.isRestricted ? (
                        <Typography fontSize={14} color={colors.slate}>
                            Restore {restrictionTarget.ambulanceNumber} to the off-duty state. Its driver must turn On Duty before the ambulance becomes available again.
                        </Typography>
                    ) : (
                        <Stack spacing={2}>
                            <Typography fontSize={14} color={colors.slate}>
                                Restricting this vehicle immediately blocks dispatch and driver activation. Use this for safety, conduct, or operational concerns.
                            </Typography>
                            <TextField autoFocus required fullWidth multiline minRows={3} label="Restriction reason" placeholder="Describe the operational or conduct concern" value={restrictionReason} onChange={(event) => setRestrictionReason(event.target.value)} />
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setRestrictionTarget(null)} sx={{ textTransform: "none" }}>Cancel</Button>
                    <Button variant="contained" color={restrictionTarget?.isRestricted ? "success" : "error"} disabled={restrictionSubmitting} onClick={() => handleRestriction(!restrictionTarget?.isRestricted)} sx={{ textTransform: "none", fontWeight: 750 }}>
                        {restrictionSubmitting ? "Saving..." : restrictionTarget?.isRestricted ? "Restore Ambulance" : "Restrict Ambulance"}
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
}

