import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
    IconButton,
    Stack,
    TextField,
    Typography,
    useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
    ArrowBackRounded,
    DirectionsCarRounded,
    LocationOnOutlined,
    PhoneOutlined,
    WarningAmberRounded,
    CheckCircleRounded,
    LocalHospitalOutlined,
    NavigationRounded,
    ReportProblemOutlined,
    RefreshRounded,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../services/api";
import { colors } from "../../theme/colors";

const JOURNEY_STEPS = [
    { key: "DISPATCHED", label: "Dispatched", nextAction: "Start Journey (En Route)", nextKey: "EN_ROUTE_TO_PATIENT" },
    { key: "EN_ROUTE_TO_PATIENT", label: "En Route to Patient", nextAction: "Mark Arrived at Patient", nextKey: "ARRIVED_AT_PATIENT" },
    { key: "ARRIVED_AT_PATIENT", label: "Arrived at Patient", nextAction: "Mark Patient Onboard", nextKey: "PATIENT_ONBOARD" },
    { key: "PATIENT_ONBOARD", label: "Patient Onboard", nextAction: "En Route to Hospital", nextKey: "EN_ROUTE_TO_HOSPITAL" },
    { key: "EN_ROUTE_TO_HOSPITAL", label: "En Route to Hospital", nextAction: "Complete Patient Handover", nextKey: "HANDOVER_COMPLETE" },
    { key: "HANDOVER_COMPLETE", label: "Handover Complete", nextAction: null, nextKey: null },
];

export default function DriverCurrentTrip() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [alert, setAlert] = useState({ type: "", message: "" });
    const [coords, setCoords] = useState(null);

    // Report Issue Dialog
    const [openIssueDialog, setOpenIssueDialog] = useState(false);
    const [issueReason, setIssueReason] = useState("");
    const [issueSubmitting, setIssueSubmitting] = useState(false);

    // Map refs
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef({});
    const watchIdRef = useRef(null);

    // Fetch active trip
    const fetchTrip = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/driver/current-trip");
            if (res.data?.success) {
                setTrip(res.data.trip);
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to load active dispatch.",
            });
        } finally {
            setLoading(false);
        }
    }, []);

    // Send location to server
    const sendLocationUpdate = useCallback(async (lat, lon, accuracy, speed, heading) => {
        try {
            await api.patch("/driver/location", {
                latitude: lat,
                longitude: lon,
                accuracy,
                speed,
                heading,
            });
            setCoords({ latitude: lat, longitude: lon, accuracy });
            updateAmbulanceMarker(lat, lon);
        } catch (e) {
            // silent retry
        }
    }, []);

    // Update or create ambulance marker on Leaflet map
    const updateAmbulanceMarker = (lat, lon) => {
        if (!mapInstanceRef.current || !window.L || lat == null || lon == null) return;
        const L = window.L;

        if (markersRef.current.ambulance) {
            markersRef.current.ambulance.setLatLng([lat, lon]);
        } else {
            const ambIcon = L.divIcon({
                className: "custom-leaflet-amb",
                html: `
                    <div style="background:#F59E0B; width:38px; height:38px; border-radius:50%; border:3px solid #fff; box-shadow:0 4px 14px rgba(0,0,0,0.3); display:grid; place-items:center;">
                        <svg viewBox="0 0 24 24" style="width:20px; height:20px; fill:#fff;">
                            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                        </svg>
                    </div>
                `,
                iconSize: [38, 38],
                iconAnchor: [19, 19],
            });
            const marker = L.marker([lat, lon], { icon: ambIcon }).addTo(mapInstanceRef.current);
            marker.bindPopup("<b>Your Ambulance</b><br>Live GPS telemetry active.");
            markersRef.current.ambulance = marker;
        }
    };

    // Watch driver GPS while trip is active
    useEffect(() => {
        if (!navigator.geolocation) return;

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, accuracy, speed, heading } = pos.coords;
                sendLocationUpdate(latitude, longitude, accuracy, speed, heading);
            },
            (err) => {
                console.warn("GPS error:", err.message);
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );

        return () => {
            if (watchIdRef.current != null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
    }, [sendLocationUpdate]);

    useEffect(() => {
        fetchTrip();
    }, [fetchTrip]);

    // Initialize Map with patient and hospital points
    useEffect(() => {
        if (!trip || !mapContainerRef.current || !window.L) return;

        const L = window.L;
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
            markersRef.current = {};
        }

        const patientLat = trip.latitude || 22.3072;
        const patientLon = trip.longitude || 73.1812;

        const map = L.map(mapContainerRef.current, {
            center: [patientLat, patientLon],
            zoom: 13,
            zoomControl: true,
        });
        mapInstanceRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap",
            maxZoom: 19,
        }).addTo(map);

        const bounds = [];

        // 1. Patient Marker
        if (trip.latitude != null && trip.longitude != null) {
            const patientIcon = L.divIcon({
                className: "custom-leaflet-patient",
                html: `
                    <div style="background:#DC2626; width:38px; height:38px; border-radius:50%; border:3px solid #fff; box-shadow:0 4px 14px rgba(220,38,38,0.4); display:grid; place-items:center;">
                        <svg viewBox="0 0 24 24" style="width:20px; height:20px; fill:#fff;">
                            <circle cx="12" cy="8" r="4"/><path d="M12 14c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z"/>
                        </svg>
                    </div>
                `,
                iconSize: [38, 38],
                iconAnchor: [19, 19],
            });
            const patientMarker = L.marker([trip.latitude, trip.longitude], { icon: patientIcon }).addTo(map);
            patientMarker.bindPopup(`<b>Patient Location</b><br>${trip.address || "Coordinates"}`, { autoClose: false }).openPopup();
            markersRef.current.patient = patientMarker;
            bounds.push([trip.latitude, trip.longitude]);
        }

        // 2. Hospital Marker
        if (trip.hospitalId?.latitude != null && trip.hospitalId?.longitude != null) {
            const hospIcon = L.divIcon({
                className: "custom-leaflet-hosp",
                html: `
                    <div style="background:#0D9488; width:38px; height:38px; border-radius:50%; border:3px solid #fff; box-shadow:0 4px 14px rgba(13,148,136,0.4); display:grid; place-items:center;">
                        <svg viewBox="0 0 24 24" style="width:20px; height:20px; fill:#fff;">
                            <path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z"/>
                        </svg>
                    </div>
                `,
                iconSize: [38, 38],
                iconAnchor: [19, 19],
            });
            const hospMarker = L.marker([trip.hospitalId.latitude, trip.hospitalId.longitude], { icon: hospIcon }).addTo(map);
            hospMarker.bindPopup(`<b>Destination Hospital</b><br>${trip.hospitalId.hospitalName}`);
            markersRef.current.hospital = hospMarker;
            bounds.push([trip.hospitalId.latitude, trip.hospitalId.longitude]);
        }

        if (bounds.length > 1) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [trip]);

    // Journey status update handler
    const handleTransitionStatus = async (nextKey) => {
        if (!trip || !nextKey) return;
        setActionLoading(true);
        setAlert({ type: "", message: "" });
        try {
            const res = await api.patch(`/driver/emergency/${trip._id}/journey-status`, {
                journeyStatus: nextKey,
            });

            if (res.data?.success) {
                setTrip(res.data.emergency);
                setAlert({
                    type: "success",
                    message: `Trip status updated to: ${nextKey.replace(/_/g, " ")}. Patient and hospital notified.`,
                });

                if (nextKey === "HANDOVER_COMPLETE") {
                    setTimeout(() => {
                        navigate("/driver");
                    }, 2500);
                }
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to update journey status.",
            });
        } finally {
            setActionLoading(false);
        }
    };

    // Report breakdown / medical delay
    const handleReportIssue = async (e) => {
        e.preventDefault();
        if (!issueReason.trim() || !trip) return;

        setIssueSubmitting(true);
        try {
            const res = await api.post(`/driver/emergency/${trip._id}/report-issue`, {
                reason: issueReason.trim(),
            });

            if (res.data?.success) {
                setOpenIssueDialog(false);
                setAlert({
                    type: "warning",
                    message: "Issue reported. Hospital dispatch and platform administrators have been alerted.",
                });
                fetchTrip();
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to report issue.",
            });
        } finally {
            setIssueSubmitting(false);
        }
    };

    // Identify current step
    const currentStepKey = trip?.journeyStatus || "DISPATCHED";
    const currentStepIndex = JOURNEY_STEPS.findIndex((s) => s.key === currentStepKey);
    const currentStep = JOURNEY_STEPS[currentStepIndex] || JOURNEY_STEPS[0];
    const isFinished = currentStepKey === "HANDOVER_COMPLETE";

    return (
        <DashboardLayout
            role="driver"
            title="Active Dispatch Journey"
            subtitle="Live transit controls, patient pickup telemetry, and hospital destination routing"
        >
            <Box mb={2}>
                <Button
                    startIcon={<ArrowBackRounded />}
                    onClick={() => navigate("/driver")}
                    sx={{ textTransform: "none", fontWeight: 700, color: colors.slate }}
                >
                    Back to Driver Portal
                </Button>
            </Box>

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
                        Loading active dispatch...
                    </Typography>
                </Box>
            ) : !trip ? (
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
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            bgcolor: "#F0FDFA",
                            display: "grid",
                            placeItems: "center",
                            color: colors.pine,
                            mx: "auto",
                            mb: 2,
                        }}
                    >
                        <CheckCircleRounded sx={{ fontSize: 36 }} />
                    </Box>
                    <Typography fontSize={20} fontWeight={850} color={colors.ink}>
                        No Active Dispatch Assigned
                    </Typography>
                    <Typography fontSize={13.5} color={colors.slate} mt={0.5} maxWidth={400} mx="auto">
                        You do not have an active emergency trip at this moment. Stay on duty to receive incoming dispatch orders.
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => navigate("/driver")}
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
                        Return to Portal
                    </Button>
                </Card>
            ) : (
                <Stack spacing={2.5}>
                    {/* TOP ACTION & DISPATCH HERO */}
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 3.5,
                            border: "1px solid",
                            borderColor: isFinished ? "#BBF7D0" : "#FECACA",
                            bgcolor: isFinished ? "#F0FDF4" : "#FEF2F2",
                            p: { xs: 2, sm: 3 },
                        }}
                    >
                        <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={2.5}
                            justifyContent="space-between"
                            alignItems={{ xs: "stretch", md: "center" }}
                        >
                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.8 }}>
                                    <Chip
                                        label={`EMERGENCY #${trip._id.toString().slice(-6)}`}
                                        size="small"
                                        sx={{
                                            bgcolor: "#DC2626",
                                            color: colors.white,
                                            fontWeight: 850,
                                            fontSize: 11,
                                        }}
                                    />
                                    <Chip
                                        label={trip.emergencyCategory || "Critical Dispatch"}
                                        size="small"
                                        sx={{
                                            bgcolor: colors.white,
                                            color: colors.ink,
                                            fontWeight: 800,
                                            fontSize: 11,
                                            border: `1px solid ${colors.hairline}`,
                                        }}
                                    />
                                    <Chip
                                        label={`CURRENT STEP: ${currentStep.label}`}
                                        size="small"
                                        sx={{
                                            bgcolor: "#FEE2E2",
                                            color: "#B91C1C",
                                            fontWeight: 800,
                                            fontSize: 11,
                                        }}
                                    />
                                </Box>

                                <Typography fontSize={19} fontWeight={850} color={colors.ink}>
                                    {trip.description}
                                </Typography>

                                <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} mt={1}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                        <LocationOnOutlined sx={{ fontSize: 16, color: "#DC2626" }} />
                                        <Typography fontSize={13} color={colors.ink} fontWeight={600}>
                                            Pickup: {trip.address || "GPS Location"}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                        <LocalHospitalOutlined sx={{ fontSize: 16, color: colors.pine }} />
                                        <Typography fontSize={13} color={colors.ink} fontWeight={600}>
                                            Destination: {trip.hospitalId?.hospitalName}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>

                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center">
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<ReportProblemOutlined />}
                                    onClick={() => setOpenIssueDialog(true)}
                                    disabled={isFinished}
                                    sx={{
                                        borderRadius: 2.5,
                                        textTransform: "none",
                                        fontWeight: 750,
                                        width: { xs: "100%", sm: "auto" },
                                    }}
                                >
                                    Report Issue
                                </Button>

                                <Button
                                    variant="outlined"
                                    startIcon={<PhoneOutlined />}
                                    href={`tel:${trip.contactNumber}`}
                                    sx={{
                                        borderRadius: 2.5,
                                        textTransform: "none",
                                        fontWeight: 750,
                                        borderColor: colors.hairline,
                                        color: colors.ink,
                                        bgcolor: colors.white,
                                        width: { xs: "100%", sm: "auto" },
                                    }}
                                >
                                    Call Patient
                                </Button>
                            </Stack>
                        </Stack>
                    </Card>

                    {/* LARGE MOBILE-FIRST PROGRESS STEP BUTTONS */}
                    <Card
                        elevation={0}
                        sx={{
                            p: { xs: 2, sm: 2.5 },
                            borderRadius: 3.5,
                            border: `1px solid ${colors.hairline}`,
                            bgcolor: colors.white,
                        }}
                    >
                        <Typography fontSize={13} fontWeight={800} color={colors.slate} letterSpacing={0.5} mb={2}>
                            DISPATCH JOURNEY PROGRESSION
                        </Typography>

                        <Stack spacing={1.5}>
                            {currentStep.nextKey && (
                                <Button
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    startIcon={<NavigationRounded />}
                                    onClick={() => handleTransitionStatus(currentStep.nextKey)}
                                    disabled={actionLoading}
                                    sx={{
                                        bgcolor: "#DC2626",
                                        color: colors.white,
                                        py: 1.8,
                                        fontSize: 16,
                                        fontWeight: 850,
                                        borderRadius: 2.8,
                                        textTransform: "none",
                                        boxShadow: "0 8px 24px rgba(220,38,38,0.25)",
                                        "&:hover": { bgcolor: "#B91C1C" },
                                    }}
                                >
                                    {actionLoading ? "Updating Trip..." : `▶ ${currentStep.nextAction}`}
                                </Button>
                            )}

                            {isFinished && (
                                <Alert severity="success" sx={{ borderRadius: 2.5, fontWeight: 700 }}>
                                    ✓ Handover completed! Vehicle released back to available fleet.
                                </Alert>
                            )}

                            {/* Timeline pills */}
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", sm: "repeat(5, 1fr)" },
                                    gap: 1,
                                    pt: 1,
                                }}
                            >
                                {JOURNEY_STEPS.slice(0, 5).map((step, idx) => {
                                    const isDone = currentStepIndex > idx;
                                    const isCurrent = currentStepIndex === idx;
                                    return (
                                        <Box
                                            key={step.key}
                                            sx={{
                                                p: 1.2,
                                                borderRadius: 2,
                                                textAlign: "center",
                                                bgcolor: isDone ? "#F0FDF4" : isCurrent ? "#FEF2F2" : "#F8FAFC",
                                                border: "1px solid",
                                                borderColor: isDone ? "#BBF7D0" : isCurrent ? "#FECACA" : colors.hairline,
                                            }}
                                        >
                                            <Typography
                                                fontSize={11.5}
                                                fontWeight={800}
                                                color={isDone ? "#16A34A" : isCurrent ? "#DC2626" : colors.slate}
                                            >
                                                {isDone ? `✓ ${step.label}` : step.label}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Stack>
                    </Card>

                    {/* LIVE VIEWPORT-SIZED LEAFLET MAP */}
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 3.5,
                            border: `1px solid ${colors.hairline}`,
                            overflow: "hidden",
                            bgcolor: colors.white,
                        }}
                    >
                        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <NavigationRounded sx={{ color: colors.pine, fontSize: 18 }} />
                                <Typography fontSize={14} fontWeight={800} color={colors.ink}>
                                    Live Transit Map
                                </Typography>
                            </Box>
                            {coords && (
                                <Chip
                                    label={`Live GPS: ${coords.latitude.toFixed(4)}°N, ${coords.longitude.toFixed(4)}°E`}
                                    size="small"
                                    sx={{ bgcolor: "#F0FDFA", color: colors.pine, fontWeight: 700, fontSize: 11 }}
                                />
                            )}
                        </Box>
                        <Box
                            ref={mapContainerRef}
                            sx={{
                                width: "100%",
                                height: { xs: 350, sm: 460 },
                                bgcolor: "#E2E8F0",
                            }}
                        />
                    </Card>
                </Stack>
            )}

            {/* REPORT ISSUE DIALOG */}
            <Dialog
                open={openIssueDialog}
                onClose={() => setOpenIssueDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3.5 } }}
            >
                <form onSubmit={handleReportIssue}>
                    <DialogTitle sx={{ fontWeight: 850, fontSize: 18, color: "#DC2626" }}>
                        Report Delay / Mechanical Issue
                    </DialogTitle>
                    <DialogContent>
                        <Typography fontSize={13.5} color={colors.slate} mb={2}>
                            Reporting an issue will instantly alert hospital dispatchers and platform administrators so a replacement ambulance can be dispatched without endangering the patient.
                        </Typography>
                        <TextField
                            label="Issue Description / Reason"
                            placeholder="e.g. Engine failure, severe traffic blockage, flat tire..."
                            fullWidth
                            multiline
                            rows={3}
                            required
                            value={issueReason}
                            onChange={(e) => setIssueReason(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 2.5 }}>
                        <Button
                            onClick={() => setOpenIssueDialog(false)}
                            sx={{ textTransform: "none", fontWeight: 700, color: colors.slate }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="error"
                            disabled={issueSubmitting || !issueReason.trim()}
                            sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 800 }}
                        >
                            {issueSubmitting ? "Reporting..." : "Transmit Alert"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </DashboardLayout>
    );
}
