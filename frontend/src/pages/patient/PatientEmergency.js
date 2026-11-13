import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Typography,
    useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
    EmergencyOutlined,
    LocationOnOutlined,
    MyLocationRounded,
    PhoneOutlined,
    CheckCircleRounded,
    WarningAmberRounded,
    LocalHospitalOutlined,
    RefreshRounded,
    FavoriteRounded,
    CarCrashRounded,
    AirRounded,
    PsychologyRounded,
    BloodtypeRounded,
    HotelRounded,
    PregnantWomanRounded,
    ChildCareRounded,
    HelpOutlineRounded,
    NavigationRounded,
    CallRounded,
} from "@mui/icons-material";
import { io } from "socket.io-client";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import api from "../../services/api";
import { colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";

const SOCKET_URL = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace(/\/api\/?$/, "")
    : "http://localhost:5000";

const EMERGENCY_CATEGORIES = [
    { id: "Heart / Chest Pain", label: "Heart / Chest Pain", icon: <FavoriteRounded />, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
    { id: "Accident / Trauma", label: "Accident / Trauma", icon: <CarCrashRounded />, color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA" },
    { id: "Breathing Emergency", label: "Breathing Emergency", icon: <AirRounded />, color: "#0284C7", bg: "#F0F9FF", border: "#BAE6FD" },
    { id: "Stroke Symptoms", label: "Stroke Symptoms", icon: <PsychologyRounded />, color: "#9333EA", bg: "#FAF5FF", border: "#E9D5FF" },
    { id: "Severe Bleeding", label: "Severe Bleeding", icon: <BloodtypeRounded />, color: "#BE123C", bg: "#FFF1F2", border: "#FECDD3" },
    { id: "Unconscious Person", label: "Unconscious Person", icon: <HotelRounded />, color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE" },
    { id: "Pregnancy Emergency", label: "Pregnancy Emergency", icon: <PregnantWomanRounded />, color: "#DB2777", bg: "#FDF2F8", border: "#FBCFE8" },
    { id: "Child Emergency", label: "Child Emergency", icon: <ChildCareRounded />, color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
    { id: "Other Emergency", label: "Other Emergency", icon: <HelpOutlineRounded />, color: "#475569", bg: "#F8FAFC", border: "#E2E8F0" },
];

const TIMELINE_STEPS = [
    { key: "NEW", label: "Request Received" },
    { key: "HOSPITAL_RECOMMENDED", label: "Hospital Notified" },
    { key: "HOSPITAL_ACCEPTED", label: "Hospital Accepted" },
    { key: "DISPATCHED", label: "Ambulance Dispatched" },
    { key: "EN_ROUTE_TO_PATIENT", label: "En Route to You" },
    { key: "ARRIVED_AT_PATIENT", label: "Ambulance Arrived" },
    { key: "PATIENT_ONBOARD", label: "Patient Onboard" },
    { key: "HANDOVER_COMPLETE", label: "Reached Hospital" },
];

export default function PatientEmergency() {
    const routerLocation = useLocation();
    const { user } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    // Form inputs
    const [category, setCategory] = useState("Heart / Chest Pain");
    const [consciousness, setConsciousness] = useState("conscious");
    const [breathingStatus, setBreathingStatus] = useState("normal");
    const [patientCount, setPatientCount] = useState(1);
    const [description, setDescription] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [location, setLocation] = useState(null);
    const [locLoading, setLocLoading] = useState(false);

    // Page state
    const [requests, setRequests] = useState([]);
    const [activeEmergency, setActiveEmergency] = useState(null);
    const [liveAmbulanceLocation, setLiveAmbulanceLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [requestToCancel, setRequestToCancel] = useState(null);
    const [cancelling, setCancelling] = useState(false);

    // Leaflet map refs
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef({});
    const socketRef = useRef(null);

    const isPhoneValid = phone.length === 10 && /^[6-9]\d{9}$/.test(phone);

    // Fetch user requests & active emergency
    const getRequests = useCallback(async () => {
        try {
            const res = await api.get("/emergency/my");
            const list = res.data?.requests || [];
            setRequests(list);

            // Determine if there is an active ongoing emergency
            const active = list.find((r) =>
                ["Requested", "Assigned", "On The Way", "Arrived", "NEW", "HOSPITAL_RECOMMENDED", "HOSPITAL_ACCEPTED", "DISPATCHED", "EN_ROUTE_TO_PATIENT", "ARRIVED_AT_PATIENT", "PATIENT_ONBOARD", "EN_ROUTE_TO_HOSPITAL"].includes(r.status)
            );
            setActiveEmergency(active || null);
            if (active?.ambulanceId?.currentLocation) {
                setLiveAmbulanceLocation(active.ambulanceId.currentLocation);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load emergency records.");
        } finally {
            setPageLoading(false);
        }
    }, []);

    // Pre-fill phone from patient profile
    const getPatientProfile = async () => {
        try {
            const res = await api.get("/patient/profile");
            if (res.data?.patient?.phone) {
                let p = res.data.patient.phone.replace(/\D/g, "");
                if (p.length === 12 && p.startsWith("91")) p = p.slice(2);
                else if (p.length === 11 && p.startsWith("0")) p = p.slice(1);
                setPhone((prev) => prev || p.slice(0, 10));
            }
        } catch (e) {
            // ignore
        }
    };

    // Auto capture GPS
    const captureLocation = useCallback((isExplicit = false) => {
        if (!navigator.geolocation) {
            if (isExplicit) setError("Geolocation is not supported by your browser. Please enter address manually.");
            return;
        }

        if (isExplicit) setLocLoading(true);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                });
                if (isExplicit) {
                    setMessage("GPS location captured successfully.");
                    setError("");
                }
                setLocLoading(false);
            },
            () => {
                if (isExplicit) {
                    setError("Location permission was not granted. Please enter address manually.");
                }
                setLocLoading(false);
            },
            { timeout: 8000, enableHighAccuracy: true }
        );
    }, []);

    useEffect(() => {
        getRequests();
        getPatientProfile();
        captureLocation(false);

        // Pre-fill if redirected from public emergency page
        if (routerLocation.state?.emergencyData) {
            const data = routerLocation.state.emergencyData;
            if (data.description) setDescription(data.description);
            if (data.phone) {
                let p = data.phone.replace(/\D/g, "");
                if (p.length === 12 && p.startsWith("91")) p = p.slice(2);
                else if (p.length === 11 && p.startsWith("0")) p = p.slice(1);
                setPhone(p.slice(0, 10));
            }
            if (data.address) setAddress(data.address);
            if (data.location) setLocation(data.location);
        }
    }, [captureLocation, getRequests, routerLocation.state]);

    // Socket.IO for real-time live ambulance tracking
    useEffect(() => {
        const socket = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            if (user?._id) {
                socket.emit("join", user._id);
            }
            if (activeEmergency?._id) {
                socket.emit("join_emergency", activeEmergency._id);
            }
        });

        // Listen for ambulance moving
        socket.on("ambulance:location-updated", (data) => {
            if (data?.location) {
                setLiveAmbulanceLocation(data.location);
                updateAmbulanceMarker(data.location.latitude, data.location.longitude);
            }
        });

        // Listen for journey progression updates
        socket.on("ambulance:journey-status-updated", () => {
            getRequests();
        });

        socket.on("emergency:hospital-accepted", () => {
            getRequests();
        });

        socket.on("emergency:ambulance-dispatched", () => {
            getRequests();
        });

        return () => {
            socket.disconnect();
        };
    }, [user, activeEmergency?._id, getRequests]);

    // Render / update Leaflet map for active emergency
    const updateAmbulanceMarker = (lat, lon) => {
        if (!mapInstanceRef.current || !window.L || lat == null || lon == null) return;
        const L = window.L;

        if (markersRef.current.ambulance) {
            markersRef.current.ambulance.setLatLng([lat, lon]);
        } else {
            const ambIcon = L.divIcon({
                className: "custom-leaflet-amb",
                html: `
                    <div style="background:#F59E0B; width:36px; height:36px; border-radius:50%; border:3px solid #fff; box-shadow:0 4px 12px rgba(0,0,0,0.3); display:grid; place-items:center;">
                        <svg viewBox="0 0 24 24" style="width:18px; height:18px; fill:#fff;">
                            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                        </svg>
                    </div>
                `,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
            });
            const marker = L.marker([lat, lon], { icon: ambIcon }).addTo(mapInstanceRef.current);
            marker.bindPopup("<b>Dispatched Ambulance</b><br>Live GPS tracking active.");
            markersRef.current.ambulance = marker;
        }
    };

    useEffect(() => {
        if (!activeEmergency || !mapContainerRef.current || !window.L) return;
        const L = window.L;

        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
            markersRef.current = {};
        }

        const patientLat = activeEmergency.latitude || 22.3072;
        const patientLon = activeEmergency.longitude || 73.1812;

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

        // Patient pin
        if (activeEmergency.latitude != null && activeEmergency.longitude != null) {
            const patientIcon = L.divIcon({
                className: "custom-leaflet-patient",
                html: `
                    <div style="background:#DC2626; width:36px; height:36px; border-radius:50%; border:3px solid #fff; box-shadow:0 4px 12px rgba(220,38,38,0.4); display:grid; place-items:center;">
                        <svg viewBox="0 0 24 24" style="width:18px; height:18px; fill:#fff;">
                            <circle cx="12" cy="8" r="4"/><path d="M12 14c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z"/>
                        </svg>
                    </div>
                `,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
            });
            const marker = L.marker([activeEmergency.latitude, activeEmergency.longitude], { icon: patientIcon }).addTo(map);
            marker.bindPopup(`<b>Your Pickup Point</b><br>${activeEmergency.address || "Coordinates"}`);
            markersRef.current.patient = marker;
            bounds.push([activeEmergency.latitude, activeEmergency.longitude]);
        }

        // Ambulance live pin
        const ambCoords = liveAmbulanceLocation || activeEmergency.ambulanceId?.currentLocation;
        if (ambCoords?.latitude != null && ambCoords?.longitude != null) {
            updateAmbulanceMarker(ambCoords.latitude, ambCoords.longitude);
            bounds.push([ambCoords.latitude, ambCoords.longitude]);
        }

        if (bounds.length > 1) {
            map.fitBounds(bounds, { padding: [40, 40] });
        }
    }, [activeEmergency, liveAmbulanceLocation]);

    // Submit emergency request
    const handleSubmitEmergency = async (e) => {
        e.preventDefault();
        if (!isPhoneValid) {
            setError("Please enter a valid 10-digit mobile number.");
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const res = await api.post("/emergency/request", {
                emergencyCategory: category,
                consciousness,
                breathingStatus,
                patientCount,
                description: description.trim() || `${category} emergency reported.`,
                contactNumber: phone.trim(),
                latitude: location?.latitude,
                longitude: location?.longitude,
                address: address.trim(),
            });

            if (res.data?.success) {
                setMessage(res.data.message || "Emergency dispatched to recommended facility.");
                setDescription("");
                getRequests();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to submit emergency request.");
        } finally {
            setLoading(false);
        }
    };

    // Cancel emergency request
    const handleCancelRequest = async () => {
        if (!requestToCancel) return;
        setCancelling(true);
        try {
            await api.put(`/emergency/${requestToCancel._id}/cancel`);
            setMessage("Emergency request cancelled successfully.");
            setRequestToCancel(null);
            getRequests();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to cancel request.");
        } finally {
            setCancelling(false);
        }
    };

    // Compute progress percentage & current step
    const getTimelineProgress = (emergency) => {
        if (!emergency) return { stepIdx: 0, label: "Submitted" };
        const jStatus = emergency.journeyStatus;
        const status = emergency.status;

        if (status === "Completed" || jStatus === "HANDOVER_COMPLETE") return { stepIdx: 7, label: "Reached Hospital" };
        if (jStatus === "PATIENT_ONBOARD") return { stepIdx: 6, label: "Patient Onboard" };
        if (jStatus === "ARRIVED_AT_PATIENT" || status === "Arrived") return { stepIdx: 5, label: "Ambulance Arrived" };
        if (jStatus === "EN_ROUTE_TO_PATIENT" || status === "On The Way") return { stepIdx: 4, label: "Ambulance En Route" };
        if (jStatus === "DISPATCHED" || status === "Assigned") return { stepIdx: 3, label: "Ambulance Dispatched" };
        if (emergency.hospitalAcceptanceStatus === "ACCEPTED" || status === "HOSPITAL_ACCEPTED") return { stepIdx: 2, label: "Hospital Accepted" };
        if (emergency.hospitalId || status === "HOSPITAL_RECOMMENDED") return { stepIdx: 1, label: "Hospital Notified" };
        return { stepIdx: 0, label: "Request Received" };
    };

    const currentTimeline = getTimelineProgress(activeEmergency);

    return (
        <DashboardLayout
            role="patient"
            title="Emergency Dispatch & Live Radar"
            subtitle="Hospital-directed emergency mobilization, priority fleet routing, and live telemetry"
        >
            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}
            {message && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setMessage("")}>
                    {message}
                </Alert>
            )}

            {pageLoading ? (
                <Box textAlign="center" py={8}>
                    <CircularProgress sx={{ color: colors.pine }} />
                    <Typography mt={2} color={colors.slate} fontSize={14}>
                        Connecting to Emergency Dispatch Radar...
                    </Typography>
                </Box>
            ) : (
                <Stack spacing={3.5}>
                    {/* ACTIVE EMERGENCY LIVE MONITOR CARD (If currently running) */}
                    {activeEmergency && (
                        <Card
                            elevation={0}
                            sx={{
                                borderRadius: 3.5,
                                border: "2px solid #DC2626",
                                bgcolor: colors.white,
                                overflow: "hidden",
                                boxShadow: "0 10px 30px rgba(220,38,38,0.1)",
                            }}
                        >
                            {/* Card Header Banner */}
                            <Box sx={{ bgcolor: "#DC2626", p: { xs: 2, sm: 2.5 }, color: colors.white }}>
                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    justifyContent="space-between"
                                    alignItems={{ xs: "flex-start", sm: "center" }}
                                    spacing={1.5}
                                >
                                    <Box>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <EmergencyOutlined sx={{ fontSize: 22 }} />
                                            <Typography fontSize={18} fontWeight={850}>
                                                Active Emergency: {activeEmergency.emergencyCategory}
                                            </Typography>
                                        </Box>
                                        <Typography fontSize={12.5} sx={{ opacity: 0.9, mt: 0.4 }}>
                                            Request ID: #{activeEmergency._id.toString().slice(-6)} • Assigned Facility: {activeEmergency.hospitalId?.hospitalName || "Matching Hospital..."}
                                        </Typography>
                                    </Box>

                                    <Stack direction="row" spacing={1}>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            startIcon={<CallRounded />}
                                            href="tel:108"
                                            sx={{
                                                bgcolor: colors.white,
                                                color: "#DC2626",
                                                fontWeight: 850,
                                                fontSize: 12,
                                                borderRadius: 2,
                                                "&:hover": { bgcolor: "#FEF2F2" },
                                            }}
                                        >
                                            Helpline 108
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={getRequests}
                                            sx={{
                                                borderColor: "rgba(255,255,255,0.4)",
                                                color: colors.white,
                                                fontWeight: 700,
                                                fontSize: 12,
                                                borderRadius: 2,
                                            }}
                                        >
                                            Refresh
                                        </Button>
                                    </Stack>
                                </Stack>
                            </Box>

                            {/* 8-Step Timeline Progress */}
                            <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#FFF5F5" }}>
                                <Typography fontSize={12} fontWeight={800} color="#991B1B" letterSpacing={0.5} mb={2}>
                                    LIVE TRANSFER TIMELINE: {currentTimeline.label.toUpperCase()}
                                </Typography>

                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)", md: "repeat(8, 1fr)" },
                                        gap: 1,
                                    }}
                                >
                                    {TIMELINE_STEPS.map((step, idx) => {
                                        const isDone = currentTimeline.stepIdx > idx;
                                        const isCurrent = currentTimeline.stepIdx === idx;
                                        return (
                                            <Box
                                                key={step.key}
                                                sx={{
                                                    p: 1.2,
                                                    borderRadius: 2,
                                                    textAlign: "center",
                                                    bgcolor: isDone ? "#DCFCE7" : isCurrent ? "#DC2626" : colors.white,
                                                    color: isDone ? "#16A34A" : isCurrent ? colors.white : colors.slate,
                                                    border: "1px solid",
                                                    borderColor: isDone ? "#BBF7D0" : isCurrent ? "#DC2626" : colors.hairline,
                                                }}
                                            >
                                                <Typography fontSize={11} fontWeight={800}>
                                                    {isDone ? `✓ ${step.label}` : step.label}
                                                </Typography>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>

                            {/* Details & Live Leaflet Map */}
                            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={5}>
                                        <Stack spacing={2.5}>
                                            <Box>
                                                <Typography fontSize={12} fontWeight={700} color={colors.slate}>
                                                    ASSIGNED HOSPITAL
                                                </Typography>
                                                <Typography fontSize={16} fontWeight={850} color={colors.ink}>
                                                    {activeEmergency.hospitalId?.hospitalName || "Allocating closest capable hospital..."}
                                                </Typography>
                                                <Typography fontSize={13} color={colors.slate}>
                                                    {activeEmergency.hospitalId?.address || "Address pending"}
                                                </Typography>
                                            </Box>

                                            {activeEmergency.ambulanceId && (
                                                <Box sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: 2.5, border: `1px solid ${colors.hairline}` }}>
                                                    <Typography fontSize={12} fontWeight={800} color={colors.pine} mb={1}>
                                                        AMBULANCE EN ROUTE
                                                    </Typography>
                                                    <Typography fontSize={15} fontWeight={800} color={colors.ink}>
                                                        {activeEmergency.ambulanceId.ambulanceNumber}
                                                    </Typography>
                                                    <Typography fontSize={13} color={colors.slate}>
                                                        Driver: {activeEmergency.ambulanceId.driverName}
                                                    </Typography>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<PhoneOutlined />}
                                                        href={`tel:${activeEmergency.ambulanceId.driverPhone}`}
                                                        sx={{
                                                            mt: 1.5,
                                                            borderRadius: 2,
                                                            textTransform: "none",
                                                            fontWeight: 750,
                                                            fontSize: 12,
                                                            color: colors.pine,
                                                            borderColor: colors.pine,
                                                        }}
                                                    >
                                                        Call Driver ({activeEmergency.ambulanceId.driverPhone})
                                                    </Button>
                                                </Box>
                                            )}

                                            {["Requested", "HOSPITAL_RECOMMENDED", "HOSPITAL_ACCEPTED"].includes(activeEmergency.status) && (
                                                <Button
                                                    variant="text"
                                                    color="error"
                                                    size="small"
                                                    onClick={() => setRequestToCancel(activeEmergency)}
                                                    sx={{ textTransform: "none", fontWeight: 700, alignSelf: "flex-start" }}
                                                >
                                                    Cancel Emergency Request
                                                </Button>
                                            )}
                                        </Stack>
                                    </Grid>

                                    {/* Map Container */}
                                    <Grid item xs={12} md={7}>
                                        <Box
                                            sx={{
                                                borderRadius: 3,
                                                overflow: "hidden",
                                                border: `1px solid ${colors.hairline}`,
                                            }}
                                        >
                                            <Box sx={{ p: 1.5, bgcolor: "#F8FAFC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography fontSize={13} fontWeight={750} color={colors.ink}>
                                                    Live Ambulance Telemetry
                                                </Typography>
                                                {liveAmbulanceLocation && (
                                                    <Chip
                                                        label="Live GPS Connected"
                                                        size="small"
                                                        sx={{ bgcolor: "#EFF6FF", color: "#2563EB", fontWeight: 800, fontSize: 11 }}
                                                    />
                                                )}
                                            </Box>
                                            <Box
                                                ref={mapContainerRef}
                                                sx={{
                                                    width: "100%",
                                                    height: 300,
                                                    bgcolor: "#E2E8F0",
                                                }}
                                            />
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    )}

                    {/* NEW EMERGENCY REQUEST CREATION FORM */}
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 3.5,
                            border: `1px solid ${colors.hairline}`,
                            bgcolor: colors.white,
                            p: { xs: 2.5, sm: 3.5 },
                        }}
                    >
                        <Box mb={3}>
                            <Typography fontSize={20} fontWeight={850} color={colors.ink}>
                                Request Immediate Emergency Care
                            </Typography>
                            <Typography fontSize={13.5} color={colors.slate} mt={0.5}>
                                Select the emergency condition below. Our system will immediately identify the required clinical capability and route directly to the best capable hospital.
                            </Typography>
                        </Box>

                        <form onSubmit={handleSubmitEmergency}>
                            <Stack spacing={3}>
                                {/* 1. Emergency Category Selection Cards */}
                                <Box>
                                    <Typography fontSize={13} fontWeight={800} color={colors.slate} letterSpacing={0.5} mb={1.5}>
                                        1. SELECT EMERGENCY CATEGORY
                                    </Typography>
                                    <Grid container spacing={1.5}>
                                        {EMERGENCY_CATEGORIES.map((cat) => {
                                            const isSelected = category === cat.id;
                                            return (
                                                <Grid item xs={6} sm={4} key={cat.id}>
                                                    <Button
                                                        fullWidth
                                                        onClick={() => setCategory(cat.id)}
                                                        sx={{
                                                            p: { xs: 1.5, sm: 2 },
                                                            borderRadius: 2.8,
                                                            textAlign: "left",
                                                            textTransform: "none",
                                                            justifyContent: "flex-start",
                                                            gap: 1.5,
                                                            bgcolor: isSelected ? cat.bg : colors.white,
                                                            border: "2px solid",
                                                            borderColor: isSelected ? cat.color : colors.hairline,
                                                            boxShadow: isSelected ? `0 4px 14px ${cat.bg}` : "none",
                                                            transition: "all 0.15s ease",
                                                            "&:hover": {
                                                                bgcolor: cat.bg,
                                                                borderColor: cat.color,
                                                            },
                                                        }}
                                                    >
                                                        <Box sx={{ color: cat.color, display: "grid", placeItems: "center" }}>
                                                            {cat.icon}
                                                        </Box>
                                                        <Typography
                                                            fontSize={13}
                                                            fontWeight={isSelected ? 850 : 650}
                                                            color={isSelected ? cat.color : colors.ink}
                                                        >
                                                            {cat.label}
                                                        </Typography>
                                                    </Button>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                </Box>

                                {/* 2. Triage & Essential Details */}
                                <Box>
                                    <Typography fontSize={13} fontWeight={800} color={colors.slate} letterSpacing={0.5} mb={1.5}>
                                        2. ESSENTIAL CLINICAL TRIAGE
                                    </Typography>

                                    <Grid container spacing={2.5}>
                                        {/* Consciousness */}
                                        <Grid item xs={12} sm={6}>
                                            <Typography fontSize={12} fontWeight={700} color={colors.slate} mb={1}>
                                                Patient Consciousness:
                                            </Typography>
                                            <Stack direction="row" spacing={1.5}>
                                                <Chip
                                                    label="Conscious / Responsive"
                                                    clickable
                                                    onClick={() => setConsciousness("conscious")}
                                                    sx={{
                                                        bgcolor: consciousness === "conscious" ? "#DCFCE7" : "#F8FAFC",
                                                        color: consciousness === "conscious" ? "#16A34A" : colors.slate,
                                                        border: "1px solid",
                                                        borderColor: consciousness === "conscious" ? "#86EFAC" : colors.hairline,
                                                        fontWeight: 750,
                                                        py: 2.2,
                                                        px: 1,
                                                        flex: 1,
                                                    }}
                                                />
                                                <Chip
                                                    label="Unconscious"
                                                    clickable
                                                    onClick={() => setConsciousness("unconscious")}
                                                    sx={{
                                                        bgcolor: consciousness === "unconscious" ? "#FEE2E2" : "#F8FAFC",
                                                        color: consciousness === "unconscious" ? "#DC2626" : colors.slate,
                                                        border: "1px solid",
                                                        borderColor: consciousness === "unconscious" ? "#FECACA" : colors.hairline,
                                                        fontWeight: 750,
                                                        py: 2.2,
                                                        px: 1,
                                                        flex: 1,
                                                    }}
                                                />
                                            </Stack>
                                        </Grid>

                                        {/* Breathing */}
                                        <Grid item xs={12} sm={6}>
                                            <Typography fontSize={12} fontWeight={700} color={colors.slate} mb={1}>
                                                Breathing Status:
                                            </Typography>
                                            <Stack direction="row" spacing={1}>
                                                {[
                                                    { id: "normal", label: "Normal" },
                                                    { id: "difficulty", label: "Difficulty" },
                                                    { id: "not_breathing", label: "Not Breathing" },
                                                ].map((b) => (
                                                    <Chip
                                                        key={b.id}
                                                        label={b.label}
                                                        clickable
                                                        onClick={() => setBreathingStatus(b.id)}
                                                        sx={{
                                                            bgcolor: breathingStatus === b.id ? (b.id === "not_breathing" ? "#FEE2E2" : "#FEF3C7") : "#F8FAFC",
                                                            color: breathingStatus === b.id ? (b.id === "not_breathing" ? "#DC2626" : "#D97706") : colors.slate,
                                                            border: "1px solid",
                                                            borderColor: breathingStatus === b.id ? (b.id === "not_breathing" ? "#FECACA" : "#FDE68A") : colors.hairline,
                                                            fontWeight: 750,
                                                            flex: 1,
                                                            py: 2.2,
                                                        }}
                                                    />
                                                ))}
                                            </Stack>
                                        </Grid>
                                    </Grid>
                                </Box>

                                {/* 3. Pickup Location & Contact Number */}
                                <Box>
                                    <Typography fontSize={13} fontWeight={800} color={colors.slate} letterSpacing={0.5} mb={1.5}>
                                        3. PICKUP LOCATION & CONTACT NUMBER
                                    </Typography>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="Contact Mobile Number"
                                                placeholder="9876543210"
                                                fullWidth
                                                required
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                                error={phone.length > 0 && !isPhoneValid}
                                                helperText={
                                                    phone.length > 0 && !isPhoneValid
                                                        ? "Enter a valid 10-digit Indian mobile number."
                                                        : "Driver will call this number on dispatch."
                                                }
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <PhoneOutlined sx={{ fontSize: 18, color: colors.slate }} />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>

                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="Pickup Address / Landmark Fallback"
                                                placeholder="House/Building name, street, nearby landmark"
                                                fullWidth
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <LocationOnOutlined sx={{ fontSize: 18, color: colors.slate }} />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>

                                        {/* GPS Auto Status Box */}
                                        <Grid item xs={12}>
                                            <Box
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 2.5,
                                                    bgcolor: location ? "#F0FDFA" : "#FFFBEB",
                                                    border: "1px solid",
                                                    borderColor: location ? "#CCFBF1" : "#FDE68A",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    flexWrap: "wrap",
                                                    gap: 1.5,
                                                }}
                                            >
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                    <MyLocationRounded sx={{ color: location ? colors.pine : "#D97706" }} />
                                                    <Box>
                                                        <Typography fontSize={13.5} fontWeight={750} color={colors.ink}>
                                                            {location
                                                                ? `GPS Coordinates Locked: ${location.latitude.toFixed(4)}°N, ${location.longitude.toFixed(4)}°E`
                                                                : "GPS location pending detection"}
                                                        </Typography>
                                                        <Typography fontSize={12} color={colors.slate}>
                                                            {location
                                                                ? "Dispatched ambulance will navigate directly to this coordinate pin."
                                                                : "Enable device location for fastest precision dispatch."}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => captureLocation(true)}
                                                    disabled={locLoading}
                                                    sx={{
                                                        borderRadius: 2,
                                                        textTransform: "none",
                                                        fontWeight: 700,
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    {locLoading ? "Detecting..." : "Detect Live Location"}
                                                </Button>
                                            </Box>
                                        </Grid>

                                        <Grid item xs={12}>
                                            <TextField
                                                label="Short Description of Situation"
                                                placeholder="e.g. Severe chest pain for 20 minutes, patient is breathing heavily..."
                                                fullWidth
                                                multiline
                                                rows={2}
                                                required
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>

                                {/* SUBMIT EMERGENCY BUTTON */}
                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    disabled={loading || !isPhoneValid || !description.trim()}
                                    sx={{
                                        bgcolor: "#DC2626",
                                        color: colors.white,
                                        py: 1.8,
                                        borderRadius: 2.8,
                                        fontSize: 16,
                                        fontWeight: 850,
                                        textTransform: "none",
                                        boxShadow: "0 8px 24px rgba(220,38,38,0.25)",
                                        "&:hover": { bgcolor: "#B91C1C" },
                                    }}
                                >
                                    {loading ? (
                                        <CircularProgress size={24} sx={{ color: colors.white }} />
                                    ) : (
                                        "🚨 DISPATCH EMERGENCY AMBULANCE NOW"
                                    )}
                                </Button>
                            </Stack>
                        </form>
                    </Card>

                    {/* PREVIOUS EMERGENCY REQUESTS HISTORY */}
                    {requests.length > 0 && (
                        <Card
                            elevation={0}
                            sx={{
                                borderRadius: 3.5,
                                border: `1px solid ${colors.hairline}`,
                                bgcolor: colors.white,
                                p: { xs: 2.5, sm: 3 },
                            }}
                        >
                            <Typography fontSize={16} fontWeight={850} color={colors.ink} mb={2}>
                                Emergency Request History
                            </Typography>

                            <Stack spacing={2}>
                                {requests.map((item) => (
                                    <Box
                                        key={item._id}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2.5,
                                            bgcolor: "#F8FAFC",
                                            border: `1px solid ${colors.hairline}`,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            flexWrap: "wrap",
                                            gap: 1.5,
                                        }}
                                    >
                                        <Box>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                                <Typography fontSize={14.5} fontWeight={800} color={colors.ink}>
                                                    {item.emergencyCategory || "Emergency Transfer"}
                                                </Typography>
                                                <Chip
                                                    label={item.status}
                                                    size="small"
                                                    color={
                                                        item.status === "Completed"
                                                            ? "success"
                                                            : item.status === "Cancelled"
                                                            ? "default"
                                                            : "error"
                                                    }
                                                    sx={{ fontWeight: 800, fontSize: 11, height: 22 }}
                                                />
                                            </Box>
                                            <Typography fontSize={13} color={colors.slate}>
                                                Facility: {item.hospitalId?.hospitalName || "Central Emergency System"} • {new Date(item.createdAt).toLocaleString()}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Stack>
                        </Card>
                    )}
                </Stack>
            )}

            {/* CONFIRM CANCEL DIALOG */}
            <ConfirmDialog
                open={Boolean(requestToCancel)}
                title="Cancel Emergency Request?"
                description="Are you sure you want to cancel this emergency request? If you still require urgent medical assistance, keep the dispatch active."
                confirmText={cancelling ? "Cancelling..." : "Yes, Cancel Request"}
                cancelText="Keep Active"
                isDangerous
                onConfirm={handleCancelRequest}
                onClose={() => setRequestToCancel(null)}
            />
        </DashboardLayout>
    );
}
