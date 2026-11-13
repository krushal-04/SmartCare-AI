import React, { useEffect, useState, useCallback, useRef } from "react";
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
    Divider,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    EmergencyOutlined,
    LocationOnOutlined,
    PhoneOutlined,
    RefreshRounded,
    TimeToLeaveOutlined,
    LocalHospitalOutlined,
    WarningAmberRounded,
    CheckCircleRounded,
    ShieldOutlined,
    NavigationRounded,
    ReportProblemOutlined,
    SwapHorizRounded,
    VisibilityOutlined,
} from "@mui/icons-material";
import { io } from "socket.io-client";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PageHeader from "../../components/dashboard/PageHeader";
import api from "../../services/api";
import { colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";

const SOCKET_URL = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace(/\/api\/?$/, "")
    : "http://localhost:5000";

export default function AdminEmergencyMonitor() {
    const { user } = useAuth();

    // Data state
    const [metrics, setMetrics] = useState({
        activeCount: 0,
        criticalCount: 0,
        ambulancesActive: 0,
        exceptionCount: 0,
    });
    const [exceptionAlerts, setExceptionAlerts] = useState([]);
    const [activeEmergencies, setActiveEmergencies] = useState([]);
    const [activeAmbulances, setActiveAmbulances] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [selectedEmergency, setSelectedEmergency] = useState(null);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ type: "", message: "" });

    // Override Hospital Modal
    const [openOverrideHosp, setOpenOverrideHosp] = useState(false);
    const [targetHospitalId, setTargetHospitalId] = useState("");
    const [overrideHospReason, setOverrideHospReason] = useState("");
    const [overrideHospSubmitting, setOverrideHospSubmitting] = useState(false);

    // Override Ambulance Modal
    const [openOverrideAmb, setOpenOverrideAmb] = useState(false);
    const [targetAmbulanceId, setTargetAmbulanceId] = useState("");
    const [overrideAmbReason, setOverrideAmbReason] = useState("");
    const [overrideAmbSubmitting, setOverrideAmbSubmitting] = useState(false);

    // Leaflet map refs
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef({});
    const socketRef = useRef(null);

    // Fetch live monitor data
    const fetchMonitorData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/emergency-monitor");
            if (res.data?.success) {
                setMetrics(res.data.metrics || {});
                setExceptionAlerts(res.data.exceptionAlerts || []);
                const emergencies = res.data.activeEmergencies || [];
                setActiveEmergencies(emergencies);
                setActiveAmbulances(res.data.activeAmbulances || []);
                setHospitals(res.data.hospitals || []);

                if (emergencies.length > 0 && !selectedEmergency) {
                    setSelectedEmergency(emergencies[0]);
                }
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to load live emergency monitor.",
            });
        } finally {
            setLoading(false);
        }
    }, [selectedEmergency]);

    // Socket.IO for real-time monitoring
    useEffect(() => {
        fetchMonitorData();

        const socket = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("join_role", "admin");
        });

        socket.on("emergency:created", (data) => {
            setAlert({
                type: "info",
                message: `New emergency created: #${data.emergencyId?.toString().slice(-6)} (${data.emergencyCategory}).`,
            });
            fetchMonitorData();
        });

        socket.on("emergency:hospital-rejected", (data) => {
            setAlert({
                type: "error",
                message: `ALERT: Hospital rejected emergency #${data.emergencyId?.toString().slice(-6)}: "${data.reason}". Intervention needed.`,
            });
            fetchMonitorData();
        });

        socket.on("ambulance:not-responding", (data) => {
            setAlert({
                type: "error",
                message: `CRITICAL: Ambulance reported breakdown / delay for emergency #${data.emergencyId?.toString().slice(-6)}.`,
            });
            fetchMonitorData();
        });

        socket.on("ambulance:journey-status-updated", () => {
            fetchMonitorData();
        });

        return () => {
            socket.disconnect();
        };
    }, [fetchMonitorData]);

    // Initialize / update Leaflet map with active incidents
    useEffect(() => {
        if (!mapContainerRef.current || !window.L) return;
        const L = window.L;

        if (!mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: [22.3072, 73.1812],
                zoom: 11,
                zoomControl: true,
            });
            mapInstanceRef.current = map;

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "© OpenStreetMap",
                maxZoom: 19,
            }).addTo(map);
        }

        const map = mapInstanceRef.current;

        // Clear previous markers
        Object.values(markersRef.current).forEach((m) => {
            if (m && map.hasLayer(m)) map.removeLayer(m);
        });
        markersRef.current = {};

        const bounds = [];

        // 1. Hospital markers
        hospitals.forEach((h) => {
            if (h.latitude != null && h.longitude != null) {
                const hospIcon = L.divIcon({
                    className: "custom-hosp-marker",
                    html: `
                        <div style="background:#0D9488; width:30px; height:30px; border-radius:50%; border:2px solid #fff; box-shadow:0 3px 10px rgba(0,0,0,0.25); display:grid; place-items:center;">
                            <svg viewBox="0 0 24 24" style="width:16px; height:16px; fill:#fff;">
                                <path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z"/>
                            </svg>
                        </div>
                    `,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15],
                });
                const m = L.marker([h.latitude, h.longitude], { icon: hospIcon }).addTo(map);
                m.bindPopup(`<b>${h.hospitalName}</b><br>Intake: ${h.emergencyAvailable ? "OPEN" : "CLOSED"}`);
                markersRef.current[`hosp_${h._id}`] = m;
                bounds.push([h.latitude, h.longitude]);
            }
        });

        // 2. Active emergency patient pins
        activeEmergencies.forEach((em) => {
            if (em.latitude != null && em.longitude != null) {
                const isSelected = selectedEmergency?._id === em._id;
                const patIcon = L.divIcon({
                    className: "custom-pat-marker",
                    html: `
                        <div style="background:${isSelected ? "#DC2626" : "#E11D48"}; width:${isSelected ? "38px" : "32px"}; height:${isSelected ? "38px" : "32px"}; border-radius:50%; border:3px solid #fff; box-shadow:0 4px 14px rgba(220,38,38,0.5); display:grid; place-items:center;">
                            <svg viewBox="0 0 24 24" style="width:18px; height:18px; fill:#fff;">
                                <circle cx="12" cy="8" r="4"/><path d="M12 14c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z"/>
                            </svg>
                        </div>
                    `,
                    iconSize: [36, 36],
                    iconAnchor: [18, 18],
                });
                const m = L.marker([em.latitude, em.longitude], { icon: patIcon }).addTo(map);
                m.bindPopup(`<b>Emergency #${em._id.toString().slice(-6)}</b><br>${em.emergencyCategory}<br>Status: ${em.status}`);
                markersRef.current[`em_${em._id}`] = m;
                bounds.push([em.latitude, em.longitude]);
            }
        });

        // 3. Active ambulances
        activeAmbulances.forEach((amb) => {
            const loc = amb.currentLocation;
            if (loc?.latitude != null && loc?.longitude != null) {
                const ambIcon = L.divIcon({
                    className: "custom-amb-marker",
                    html: `
                        <div style="background:#F59E0B; width:34px; height:34px; border-radius:50%; border:2px solid #fff; box-shadow:0 4px 12px rgba(245,158,11,0.4); display:grid; place-items:center;">
                            <svg viewBox="0 0 24 24" style="width:18px; height:18px; fill:#fff;">
                                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                            </svg>
                        </div>
                    `,
                    iconSize: [34, 34],
                    iconAnchor: [17, 17],
                });
                const m = L.marker([loc.latitude, loc.longitude], { icon: ambIcon }).addTo(map);
                m.bindPopup(`<b>${amb.ambulanceNumber}</b><br>Driver: ${amb.driverName}<br>Status: ${amb.status}`);
                markersRef.current[`amb_${amb._id}`] = m;
                bounds.push([loc.latitude, loc.longitude]);
            }
        });

        if (bounds.length > 1) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [activeEmergencies, activeAmbulances, hospitals, selectedEmergency]);

    // Handle Admin Hospital Override
    const handleOverrideHospital = async (e) => {
        e.preventDefault();
        if (!selectedEmergency || !targetHospitalId || !overrideHospReason.trim()) return;

        setOverrideHospSubmitting(true);
        try {
            const res = await api.post(`/admin/emergencies/${selectedEmergency._id}/override-hospital`, {
                hospitalId: targetHospitalId,
                reason: overrideHospReason.trim(),
            });

            if (res.data?.success) {
                setAlert({
                    type: "success",
                    message: `Hospital assignment successfully overridden by administrator.`,
                });
                setOpenOverrideHosp(false);
                setOverrideHospReason("");
                fetchMonitorData();
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to override hospital.",
            });
        } finally {
            setOverrideHospSubmitting(false);
        }
    };

    // Handle Admin Ambulance Override
    const handleOverrideAmbulance = async (e) => {
        e.preventDefault();
        if (!selectedEmergency || !targetAmbulanceId || !overrideAmbReason.trim()) return;

        setOverrideAmbSubmitting(true);
        try {
            const res = await api.post(`/admin/emergencies/${selectedEmergency._id}/override-ambulance`, {
                ambulanceId: targetAmbulanceId,
                reason: overrideAmbReason.trim(),
            });

            if (res.data?.success) {
                setAlert({
                    type: "success",
                    message: `Ambulance successfully reassigned by administrator.`,
                });
                setOpenOverrideAmb(false);
                setOverrideAmbReason("");
                fetchMonitorData();
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to override ambulance.",
            });
        } finally {
            setOverrideAmbSubmitting(false);
        }
    };

    return (
        <DashboardLayout
            role="admin"
            title="Emergency Live Monitor"
            subtitle="Executive surveillance, telemetry tracking, and administrative exception intervention"
        >
            <PageHeader
                title="Emergency Operations Command"
                subtitle="Real-time multi-patient telemetry, hospital acceptance status, and administrative override intervention"
                action={
                    <Button
                        variant="outlined"
                        startIcon={<RefreshRounded />}
                        onClick={fetchMonitorData}
                        sx={{
                            borderRadius: 2.2,
                            textTransform: "none",
                            fontWeight: 700,
                            color: colors.slate,
                            borderColor: colors.hairline,
                            bgcolor: colors.white,
                        }}
                    >
                        Refresh Feed
                    </Button>
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

            {/* KPI STATS CARDS */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
                    gap: 2,
                    mb: 3,
                }}
            >
                <Card
                    elevation={0}
                    sx={{ p: 2.2, borderRadius: 3, border: `1px solid ${colors.hairline}`, bgcolor: colors.white }}
                >
                    <Typography fontSize={12} color={colors.slate} fontWeight={700}>
                        ACTIVE EMERGENCIES
                    </Typography>
                    <Typography fontSize={24} fontWeight={850} color={colors.ink} mt={0.5}>
                        {metrics.activeCount || 0}
                    </Typography>
                </Card>

                <Card
                    elevation={0}
                    sx={{
                        p: 2.2,
                        borderRadius: 3,
                        border: metrics.criticalCount > 0 ? "1px solid #FECACA" : `1px solid ${colors.hairline}`,
                        bgcolor: metrics.criticalCount > 0 ? "#FEF2F2" : colors.white,
                    }}
                >
                    <Typography fontSize={12} color={metrics.criticalCount > 0 ? "#DC2626" : colors.slate} fontWeight={700}>
                        CRITICAL CASES
                    </Typography>
                    <Typography fontSize={24} fontWeight={850} color={metrics.criticalCount > 0 ? "#DC2626" : colors.ink} mt={0.5}>
                        {metrics.criticalCount || 0}
                    </Typography>
                </Card>

                <Card
                    elevation={0}
                    sx={{ p: 2.2, borderRadius: 3, border: `1px solid ${colors.hairline}`, bgcolor: colors.white }}
                >
                    <Typography fontSize={12} color={colors.slate} fontWeight={700}>
                        ACTIVE AMBULANCES
                    </Typography>
                    <Typography fontSize={24} fontWeight={850} color={colors.ink} mt={0.5}>
                        {metrics.ambulancesActive || 0}
                    </Typography>
                </Card>

                <Card
                    elevation={0}
                    sx={{
                        p: 2.2,
                        borderRadius: 3,
                        border: metrics.exceptionCount > 0 ? "1px solid #FDE68A" : `1px solid ${colors.hairline}`,
                        bgcolor: metrics.exceptionCount > 0 ? "#FFFBEB" : colors.white,
                    }}
                >
                    <Typography fontSize={12} color={metrics.exceptionCount > 0 ? "#D97706" : colors.slate} fontWeight={700}>
                        EXCEPTION ALERTS
                    </Typography>
                    <Typography fontSize={24} fontWeight={850} color={metrics.exceptionCount > 0 ? "#D97706" : colors.ink} mt={0.5}>
                        {metrics.exceptionCount || 0}
                    </Typography>
                </Card>
            </Box>

            {loading ? (
                <Box textAlign="center" py={8}>
                    <CircularProgress sx={{ color: colors.pine }} />
                    <Typography mt={2} color={colors.slate} fontSize={14}>
                        Synchronizing multi-marker telemetry feed...
                    </Typography>
                </Box>
            ) : (
                /* THREE-PANEL SPLIT COMMAND VIEW */
                <Grid container spacing={2.5}>
                    {/* LEFT PANEL: EMERGENCY QUEUE */}
                    <Grid item xs={12} lg={4}>
                        <Card
                            elevation={0}
                            sx={{
                                borderRadius: 3.5,
                                border: `1px solid ${colors.hairline}`,
                                bgcolor: colors.white,
                                height: 600,
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <Box sx={{ p: 2, borderBottom: `1px solid ${colors.hairline}` }}>
                                <Typography fontSize={14.5} fontWeight={850} color={colors.ink}>
                                    Live Emergency Queue ({activeEmergencies.length})
                                </Typography>
                            </Box>

                            <Box sx={{ flex: 1, overflowY: "auto", p: 1.5 }}>
                                {activeEmergencies.length === 0 ? (
                                    <Box py={6} textAlign="center">
                                        <CheckCircleRounded sx={{ fontSize: 32, color: colors.pine, mb: 1 }} />
                                        <Typography fontSize={14} fontWeight={750} color={colors.ink}>
                                            No Active Incidents
                                        </Typography>
                                        <Typography fontSize={12} color={colors.slate}>
                                            All incoming transfers are currently resolved.
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Stack spacing={1.5}>
                                        {activeEmergencies.map((em) => {
                                            const isSelected = selectedEmergency?._id === em._id;
                                            return (
                                                <Card
                                                    key={em._id}
                                                    elevation={0}
                                                    onClick={() => setSelectedEmergency(em)}
                                                    sx={{
                                                        p: 1.8,
                                                        borderRadius: 2.5,
                                                        cursor: "pointer",
                                                        border: "1px solid",
                                                        borderColor: isSelected ? "#DC2626" : colors.hairline,
                                                        bgcolor: isSelected ? "#FFF5F5" : colors.white,
                                                        transition: "all 0.15s ease",
                                                        "&:hover": { borderColor: "#DC2626" },
                                                    }}
                                                >
                                                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.8 }}>
                                                        <Chip
                                                            label={`#ER-${em._id.toString().slice(-4)}`}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: isSelected ? "#DC2626" : "#FEE2E2",
                                                                color: isSelected ? colors.white : "#B91C1C",
                                                                fontWeight: 850,
                                                                fontSize: 10,
                                                            }}
                                                        />
                                                        <Chip
                                                            label={em.journeyStatus || em.status}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: "#F1F5F9",
                                                                color: colors.slate,
                                                                fontWeight: 750,
                                                                fontSize: 10,
                                                            }}
                                                        />
                                                    </Box>
                                                    <Typography fontSize={14} fontWeight={800} color={colors.ink}>
                                                        {em.emergencyCategory}
                                                    </Typography>
                                                    <Typography fontSize={12} color={colors.slate} noWrap mt={0.3}>
                                                        Hospital: {em.hospitalId?.hospitalName || "Pending Match"}
                                                    </Typography>
                                                    <Typography fontSize={11.5} color={colors.slate}>
                                                        Ambulance: {em.ambulanceId?.ambulanceNumber || "Not dispatched"}
                                                    </Typography>
                                                </Card>
                                            );
                                        })}
                                    </Stack>
                                )}
                            </Box>
                        </Card>
                    </Grid>

                    {/* CENTER PANEL: LIVE TELEMETRY MAP */}
                    <Grid item xs={12} lg={5}>
                        <Card
                            elevation={0}
                            sx={{
                                borderRadius: 3.5,
                                border: `1px solid ${colors.hairline}`,
                                bgcolor: colors.white,
                                height: 600,
                                overflow: "hidden",
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <Box sx={{ p: 2, borderBottom: `1px solid ${colors.hairline}`, display: "flex", justifyContent: "space-between" }}>
                                <Typography fontSize={14.5} fontWeight={850} color={colors.ink}>
                                    Live GPS Radar Map
                                </Typography>
                                <Typography fontSize={12} color={colors.slate}>
                                    {activeAmbulances.length} Active Fleet Units
                                </Typography>
                            </Box>
                            <Box ref={mapContainerRef} sx={{ flex: 1, width: "100%", bgcolor: "#E2E8F0" }} />
                        </Card>
                    </Grid>

                    {/* RIGHT PANEL: EXCEPTION ALERTS & ADMINISTRATIVE INTERVENTION */}
                    <Grid item xs={12} lg={3}>
                        <Card
                            elevation={0}
                            sx={{
                                borderRadius: 3.5,
                                border: `1px solid ${colors.hairline}`,
                                bgcolor: colors.white,
                                height: 600,
                                display: "flex",
                                flexDirection: "column",
                                overflowY: "auto",
                                p: 2,
                            }}
                        >
                            <Typography fontSize={14} fontWeight={850} color={colors.ink} mb={2}>
                                Exception Alerts & Overrides
                            </Typography>

                            {/* Exception Alerts */}
                            {exceptionAlerts.length > 0 ? (
                                <Stack spacing={1.5} mb={2.5}>
                                    {exceptionAlerts.map((alertItem, idx) => (
                                        <Alert
                                            key={idx}
                                            severity={alertItem.severity || "warning"}
                                            sx={{ borderRadius: 2.5, p: 1 }}
                                        >
                                            <Typography fontSize={12} fontWeight={800}>
                                                {alertItem.title}
                                            </Typography>
                                            <Typography fontSize={11.5} mt={0.3}>
                                                {alertItem.message}
                                            </Typography>
                                        </Alert>
                                    ))}
                                </Stack>
                            ) : (
                                <Alert severity="success" sx={{ borderRadius: 2.5, mb: 2.5 }}>
                                    No active exception delays or rejections recorded.
                                </Alert>
                            )}

                            <Divider sx={{ my: 1.5 }} />

                            {/* Selected Incident Actions */}
                            {selectedEmergency ? (
                                <Box>
                                    <Typography fontSize={12.5} fontWeight={800} color={colors.slate} mb={1}>
                                        INCIDENT #{selectedEmergency._id.toString().slice(-6)}
                                    </Typography>
                                    <Typography fontSize={14} fontWeight={800} color={colors.ink}>
                                        {selectedEmergency.emergencyCategory}
                                    </Typography>
                                    <Typography fontSize={12} color={colors.slate} mt={0.5}>
                                        Assigned Hospital: {selectedEmergency.hospitalId?.hospitalName || "None"}
                                    </Typography>
                                    <Typography fontSize={12} color={colors.slate}>
                                        Vehicle: {selectedEmergency.ambulanceId?.ambulanceNumber || "None"}
                                    </Typography>

                                    <Stack spacing={1.5} mt={2.5}>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            fullWidth
                                            startIcon={<SwapHorizRounded />}
                                            onClick={() => setOpenOverrideHosp(true)}
                                            sx={{
                                                bgcolor: colors.pine,
                                                color: colors.white,
                                                borderRadius: 2.2,
                                                textTransform: "none",
                                                fontWeight: 750,
                                                "&:hover": { bgcolor: colors.pineDeep },
                                            }}
                                        >
                                            Override Hospital
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            size="small"
                                            fullWidth
                                            startIcon={<TimeToLeaveOutlined />}
                                            onClick={() => setOpenOverrideAmb(true)}
                                            sx={{
                                                borderRadius: 2.2,
                                                textTransform: "none",
                                                fontWeight: 750,
                                                borderColor: colors.hairline,
                                                color: colors.ink,
                                            }}
                                        >
                                            Override Ambulance
                                        </Button>
                                    </Stack>
                                </Box>
                            ) : (
                                <Typography color={colors.slate} fontSize={13}>
                                    Select an incident from the queue to review or intervene.
                                </Typography>
                            )}
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* OVERRIDE HOSPITAL MODAL */}
            <Dialog
                open={openOverrideHosp}
                onClose={() => setOpenOverrideHosp(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3.5 } }}
            >
                <form onSubmit={handleOverrideHospital}>
                    <DialogTitle sx={{ fontWeight: 850, fontSize: 18 }}>
                        Override Hospital Assignment
                    </DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2.5}>
                            <Typography fontSize={13.5} color={colors.slate}>
                                As an administrator, you may reassign this emergency transfer to an alternative hospital facility.
                            </Typography>

                            <FormControl fullWidth required>
                                <InputLabel>Target Hospital</InputLabel>
                                <Select
                                    value={targetHospitalId}
                                    label="Target Hospital"
                                    onChange={(e) => setTargetHospitalId(e.target.value)}
                                >
                                    {hospitals.map((h) => (
                                        <MenuItem key={h._id} value={h._id}>
                                            {h.hospitalName} ({h.city})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                label="Administrative Override Reason"
                                placeholder="Explain why the hospital is being reassigned..."
                                fullWidth
                                multiline
                                rows={3}
                                required
                                value={overrideHospReason}
                                onChange={(e) => setOverrideHospReason(e.target.value)}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2.5 }}>
                        <Button
                            onClick={() => setOpenOverrideHosp(false)}
                            sx={{ textTransform: "none", fontWeight: 700, color: colors.slate }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={overrideHospSubmitting || !targetHospitalId || !overrideHospReason.trim()}
                            sx={{
                                bgcolor: colors.pine,
                                color: colors.white,
                                borderRadius: 2.5,
                                textTransform: "none",
                                fontWeight: 800,
                            }}
                        >
                            {overrideHospSubmitting ? "Overriding..." : "Confirm Override"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* OVERRIDE AMBULANCE MODAL */}
            <Dialog
                open={openOverrideAmb}
                onClose={() => setOpenOverrideAmb(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3.5 } }}
            >
                <form onSubmit={handleOverrideAmbulance}>
                    <DialogTitle sx={{ fontWeight: 850, fontSize: 18 }}>
                        Override Ambulance Assignment
                    </DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2.5}>
                            <Typography fontSize={13.5} color={colors.slate}>
                                Reassign a replacement emergency ambulance from the available fleet.
                            </Typography>

                            <FormControl fullWidth required>
                                <InputLabel>Replacement Ambulance</InputLabel>
                                <Select
                                    value={targetAmbulanceId}
                                    label="Replacement Ambulance"
                                    onChange={(e) => setTargetAmbulanceId(e.target.value)}
                                >
                                    {activeAmbulances.map((amb) => (
                                        <MenuItem key={amb._id} value={amb._id}>
                                            {amb.ambulanceNumber} ({amb.vehicleType}) - Driver: {amb.driverName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                label="Administrative Reassignment Reason"
                                placeholder="Explain reason (e.g. driver breakdown, proximity)..."
                                fullWidth
                                multiline
                                rows={3}
                                required
                                value={overrideAmbReason}
                                onChange={(e) => setOverrideAmbReason(e.target.value)}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2.5 }}>
                        <Button
                            onClick={() => setOpenOverrideAmb(false)}
                            sx={{ textTransform: "none", fontWeight: 700, color: colors.slate }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={overrideAmbSubmitting || !targetAmbulanceId || !overrideAmbReason.trim()}
                            sx={{
                                bgcolor: colors.pine,
                                color: colors.white,
                                borderRadius: 2.5,
                                textTransform: "none",
                                fontWeight: 800,
                            }}
                        >
                            {overrideAmbSubmitting ? "Reassigning..." : "Confirm Reassignment"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </DashboardLayout>
    );
}
