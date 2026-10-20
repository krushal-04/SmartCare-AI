import React, { useEffect, useState } from "react";
import {
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
    TextField,
    Typography,
    Alert,
} from "@mui/material";
import {
    EmergencyOutlined,
    PhoneOutlined,
    LocationOnOutlined,
    RefreshRounded,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PageHeader from "../../components/dashboard/PageHeader";
import api from "../../services/api";

const STATUS_COLOR_MAP = {
    Requested: "error",
    Assigned: "warning",
    "On The Way": "secondary",
    Arrived: "info",
    Completed: "success",
    Cancelled: "default",
};

export default function HospitalEmergency() {
    const [emergencies, setEmergencies] = useState([]);
    const [ambulances, setAmbulances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [alert, setAlert] = useState({ type: "", message: "" });

    // Action Modal
    const [selectedEmergency, setSelectedEmergency] = useState(null);
    const [newStatus, setNewStatus] = useState("");
    const [selectedAmbulanceId, setSelectedAmbulanceId] = useState("");
    const [hospitalNotes, setHospitalNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [emRes, ambRes] = await Promise.all([
                api.get("/emergency/hospital"),
                api.get("/ambulance/all"),
            ]);

            if (emRes.data.success) {
                setEmergencies(emRes.data.emergencies || []);
            }
            if (ambRes.data.success) {
                setAmbulances(ambRes.data.ambulances || []);
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to load emergency data.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Auto-refresh emergencies every 15 seconds
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleOpenAction = (em) => {
        setSelectedEmergency(em);
        setNewStatus(em.status || "Assigned");
        setSelectedAmbulanceId(em.ambulanceId?._id || em.ambulanceId || "");
        setHospitalNotes(em.hospitalNotes || "");
    };

    const handleUpdateEmergency = async (e) => {
        e.preventDefault();
        if (!selectedEmergency) return;

        setSubmitting(true);
        setAlert({ type: "", message: "" });
        try {
            const res = await api.put(`/emergency/${selectedEmergency._id}/status`, {
                status: newStatus,
                ambulanceId: selectedAmbulanceId || undefined,
                hospitalNotes,
            });

            if (res.data.success) {
                setAlert({
                    type: "success",
                    message: `Emergency status updated to "${newStatus}". Patient notified via in-app alert and email.`,
                });
                setSelectedEmergency(null);
                fetchData();
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to update emergency status.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = emergencies.filter((e) => {
        if (statusFilter === "all") return true;
        if (statusFilter === "active") {
            return ["Requested", "Assigned", "On The Way", "Arrived"].includes(e.status);
        }
        return e.status === statusFilter;
    });

    const activeCount = emergencies.filter((e) =>
        ["Requested", "Assigned", "On The Way", "Arrived"].includes(e.status)
    ).length;

    return (
        <DashboardLayout
            role="hospital"
            title="Emergency Command & Dispatch"
            subtitle="Live patient distress requests, triage assessment, and ambulance mobilization"
        >
            <PageHeader
                title="Emergency Operations Console"
                subtitle="Accept incoming distress calls, dispatch ambulances, and update transit status"
                backTo="/hospital"
                backLabel="← Back to Dashboard"
                action={
                    <Button
                        variant="outlined"
                        startIcon={<RefreshRounded />}
                        onClick={fetchData}
                        sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700 }}
                    >
                        Refresh Console
                    </Button>
                }
            />

            {alert.message && (
                <Alert severity={alert.type} sx={{ mb: 3, borderRadius: 3 }}>
                    {alert.message}
                </Alert>
            )}

            {/* Filter Chips & Active Count */}
            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                sx={{ mb: 3 }}
            >
                <Stack direction="row" spacing={1} flexWrap="wrap">
                    {[
                        { label: `Active (${activeCount})`, val: "active" },
                        { label: "All Requests", val: "all" },
                        { label: "Requested", val: "Requested" },
                        { label: "Ambulance Assigned", val: "Assigned" },
                        { label: "On The Way", val: "On The Way" },
                        { label: "Arrived", val: "Arrived" },
                        { label: "Completed", val: "Completed" },
                    ].map((f) => (
                        <Chip
                            key={f.val}
                            label={f.label}
                            clickable
                            color={statusFilter === f.val ? "primary" : "default"}
                            variant={statusFilter === f.val ? "filled" : "outlined"}
                            onClick={() => setStatusFilter(f.val)}
                            sx={{ fontWeight: 700, mb: 1 }}
                        />
                    ))}
                </Stack>
            </Stack>

            {loading ? (
                <Box py={8} textAlign="center">
                    <CircularProgress />
                </Box>
            ) : filtered.length === 0 ? (
                <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #E3EBEE", p: 5, textAlign: "center" }}>
                    <EmergencyOutlined sx={{ fontSize: 52, color: "text.secondary", mb: 1.5 }} />
                    <Typography fontWeight={800} variant="h6">
                        No Emergency Requests in this Queue
                    </Typography>
                    <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                        Incoming patient emergency requests will stream into this dashboard automatically.
                    </Typography>
                </Card>
            ) : (
                <Grid container spacing={2.5}>
                    {filtered.map((em) => {
                        const isUrgent = em.status === "Requested";
                        const amb = em.ambulanceId;
                        return (
                            <Grid item xs={12} key={em._id}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        borderRadius: 3.5,
                                        border: "1px solid",
                                        borderColor: isUrgent ? "error.main" : "#E3EBEE",
                                        bgcolor: isUrgent ? "rgba(220,38,38,0.02)" : "background.paper",
                                        p: { xs: 2.5, md: 3 },
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    <Stack
                                        direction={{ xs: "column", md: "row" }}
                                        justifyContent="space-between"
                                        alignItems={{ xs: "flex-start", md: "center" }}
                                        gap={2}
                                    >
                                        <Box sx={{ flex: 1 }}>
                                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                                                <Chip
                                                    label={em.status}
                                                    color={STATUS_COLOR_MAP[em.status] || "default"}
                                                    sx={{ fontWeight: 800, fontSize: 13 }}
                                                />
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                    Received {new Date(em.createdAt).toLocaleString()}
                                                </Typography>
                                            </Stack>

                                            <Typography variant="h6" fontWeight={800} color={isUrgent ? "error.main" : "text.primary"}>
                                                "{em.description}"
                                            </Typography>

                                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                                <Grid item xs={12} sm={4}>
                                                    <Typography variant="body2" color="text.secondary" fontSize={12}>
                                                        Patient / Caller
                                                    </Typography>
                                                    <Typography fontWeight={700} fontSize={14}>
                                                        {em.patientId?.fullName || "Emergency Patient"}
                                                    </Typography>
                                                    <Typography
                                                        component="a"
                                                        href={`tel:${em.contactNumber}`}
                                                        fontSize={13}
                                                        sx={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: 0.5,
                                                            color: "primary.main",
                                                            fontWeight: 700,
                                                            mt: 0.2,
                                                            textDecoration: "none",
                                                            "&:hover": { textDecoration: "underline" },
                                                        }}
                                                    >
                                                        <PhoneOutlined fontSize="small" /> {em.contactNumber?.length === 10 ? `+91 ${em.contactNumber}` : em.contactNumber}
                                                    </Typography>
                                                </Grid>

                                                <Grid item xs={12} sm={4}>
                                                    <Typography variant="body2" color="text.secondary" fontSize={12}>
                                                        Location / Address
                                                    </Typography>
                                                    <Typography fontSize={13} fontWeight={600} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                        <LocationOnOutlined fontSize="small" color="error" />
                                                        {em.address || "GPS Position Supplied"}
                                                    </Typography>
                                                    {em.latitude && em.longitude && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            Coordinates: {em.latitude.toFixed(4)}, {em.longitude.toFixed(4)}
                                                        </Typography>
                                                    )}
                                                </Grid>

                                                <Grid item xs={12} sm={4}>
                                                    <Typography variant="body2" color="text.secondary" fontSize={12}>
                                                        Assigned Ambulance
                                                    </Typography>
                                                    {amb ? (
                                                        <Box sx={{ mt: 0.2 }}>
                                                            <Typography fontSize={13} fontWeight={700}>
                                                                {amb.ambulanceNumber} ({amb.vehicleType})
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Driver: {amb.driverName} • {amb.driverPhone}
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Typography fontSize={13} color="text.secondary" sx={{ fontStyle: "italic", mt: 0.2 }}>
                                                            No ambulance assigned yet
                                                        </Typography>
                                                    )}
                                                </Grid>
                                            </Grid>

                                            {em.hospitalNotes && (
                                                <Box sx={{ mt: 1.5, p: 1, bgcolor: "#F1F5F9", borderRadius: 2 }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        <strong>Hospital Notes:</strong> {em.hospitalNotes}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>

                                        <Box sx={{ alignSelf: { xs: "stretch", md: "center" } }}>
                                            <Button
                                                variant="contained"
                                                color={isUrgent ? "error" : "primary"}
                                                onClick={() => handleOpenAction(em)}
                                                sx={{
                                                    borderRadius: 2.5,
                                                    fontWeight: 800,
                                                    textTransform: "none",
                                                    px: 3,
                                                    width: { xs: "100%", md: "auto" },
                                                }}
                                            >
                                                {isUrgent ? "Accept & Dispatch" : "Update Status"}
                                            </Button>
                                        </Box>
                                    </Stack>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Status & Ambulance Assignment Modal */}
            <Dialog open={Boolean(selectedEmergency)} onClose={() => setSelectedEmergency(null)} maxWidth="sm" fullWidth>
                <form onSubmit={handleUpdateEmergency}>
                    <DialogTitle sx={{ fontWeight: 800 }}>
                        Manage Emergency Dispatch
                    </DialogTitle>
                    <DialogContent dividers>
                        {selectedEmergency && (
                            <Stack spacing={2.5} sx={{ mt: 0.5 }}>
                                <Box sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: 3, border: "1px solid #E2E8F0" }}>
                                    <Typography fontWeight={700} fontSize={14} color="error.main">
                                        Distress: "{selectedEmergency.description}"
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                        Contact: {selectedEmergency.contactNumber} • Address: {selectedEmergency.address || "GPS Position"}
                                    </Typography>
                                </Box>

                                <FormControl fullWidth required>
                                    <InputLabel>Update Transit Status</InputLabel>
                                    <Select
                                        value={newStatus}
                                        label="Update Transit Status"
                                        onChange={(e) => setNewStatus(e.target.value)}
                                    >
                                        <MenuItem value="Requested">Requested (Unassigned)</MenuItem>
                                        <MenuItem value="Assigned">Assigned (Preparing Ambulance)</MenuItem>
                                        <MenuItem value="On The Way">On The Way (En Route to Patient)</MenuItem>
                                        <MenuItem value="Arrived">Arrived (On Scene)</MenuItem>
                                        <MenuItem value="Completed">Completed (Patient Transported)</MenuItem>
                                        <MenuItem value="Cancelled">Cancelled</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth>
                                    <InputLabel>Assign Ambulance Vehicle</InputLabel>
                                    <Select
                                        value={selectedAmbulanceId}
                                        label="Assign Ambulance Vehicle"
                                        onChange={(e) => setSelectedAmbulanceId(e.target.value)}
                                    >
                                        <MenuItem value="">
                                            <em>None / Retain Existing</em>
                                        </MenuItem>
                                        {ambulances.map((amb) => (
                                            <MenuItem key={amb._id} value={amb._id}>
                                                {amb.ambulanceNumber} — {amb.vehicleType} ({amb.driverName}, {amb.status})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Hospital Emergency Notes"
                                    placeholder="Enter instructions, medical team notes, or triage details..."
                                    value={hospitalNotes}
                                    onChange={(e) => setHospitalNotes(e.target.value)}
                                />
                            </Stack>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 2.5 }}>
                        <Button onClick={() => setSelectedEmergency(null)} color="inherit" sx={{ fontWeight: 600 }}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={submitting}
                            sx={{ fontWeight: 800, textTransform: "none", px: 3 }}
                        >
                            {submitting ? "Updating..." : "Save & Notify Patient"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </DashboardLayout>
    );
}
