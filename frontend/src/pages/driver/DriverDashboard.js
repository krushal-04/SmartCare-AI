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
    Stack,
    Typography,
    Grid,
} from "@mui/material";
import {
    TimeToLeaveOutlined,
    MyLocationRounded,
    PlayArrowRounded,
    PowerSettingsNewRounded,
    EmergencyOutlined,
    PhoneOutlined,
    LocationOnOutlined,
    CheckCircleRounded,
    ShieldOutlined,
    ArrowForwardRounded,
} from "@mui/icons-material";
import { io } from "socket.io-client";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../services/api";
import { colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";

const SOCKET_URL = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace(/\/api\/?$/, "")
    : "http://localhost:5000";

export default function DriverDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [profile, setProfile] = useState(null);
    const [currentTrip, setCurrentTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [alert, setAlert] = useState({ type: "", message: "" });
    const [gpsActive, setGpsActive] = useState(false);
    const [coords, setCoords] = useState(null);

    const watchIdRef = useRef(null);
    const socketRef = useRef(null);

    // Fetch driver profile and active trip
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [profRes, tripRes] = await Promise.all([
                api.get("/driver/profile"),
                api.get("/driver/current-trip"),
            ]);

            if (profRes.data?.success) {
                setProfile(profRes.data.driver);
            }
            if (tripRes.data?.success) {
                setCurrentTrip(tripRes.data.trip);
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to load driver dashboard data.",
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
            setGpsActive(true);
        } catch (e) {
            // silent retry
        }
    }, []);

    // Start geolocation watcher
    const startGpsTracking = useCallback(() => {
        if (!navigator.geolocation) {
            setAlert({ type: "warning", message: "Geolocation is not supported by your device." });
            return;
        }

        if (watchIdRef.current != null) return;

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, accuracy, speed, heading } = pos.coords;
                sendLocationUpdate(latitude, longitude, accuracy, speed, heading);
            },
            (err) => {
                console.warn("GPS watchPosition warning:", err.message);
                setGpsActive(false);
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );
    }, [sendLocationUpdate]);

    // Stop geolocation watcher
    const stopGpsTracking = useCallback(() => {
        if (watchIdRef.current != null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setGpsActive(false);
    }, []);

    // Setup Socket.IO listener for direct dispatch orders
    useEffect(() => {
        fetchData();

        const socket = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            if (user?._id) {
                socket.emit("join_driver", user._id);
                socket.emit("join_role", "driver");
            }
        });

        socket.on("emergency:ambulance-dispatched", (data) => {
            setAlert({
                type: "error",
                message: `🚨 NEW DISPATCH ORDER: ${data.emergencyCategory || "Emergency Transfer"}! Tap below to start journey.`,
            });
            fetchData();
        });

        return () => {
            socket.disconnect();
            stopGpsTracking();
        };
    }, [fetchData, user, stopGpsTracking]);

    // Start Duty handler
    const handleStartDuty = async () => {
        setActionLoading(true);
        setAlert({ type: "", message: "" });
        try {
            // Grab immediate coordinates
            let currentLat = null;
            let currentLon = null;

            if (navigator.geolocation) {
                try {
                    const pos = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
                    });
                    currentLat = pos.coords.latitude;
                    currentLon = pos.coords.longitude;
                } catch {
                    // continue without initial GPS
                }
            }

            const res = await api.post("/driver/duty/start", {
                latitude: currentLat,
                longitude: currentLon,
            });

            if (res.data?.success) {
                setProfile((prev) => ({
                    ...prev,
                    dutyStatus: "ON_DUTY",
                    currentLocation: res.data.driver?.currentLocation,
                }));
                setAlert({
                    type: "success",
                    message: "You are now ON DUTY. Assigned ambulance is marked Available for dispatch.",
                });
                startGpsTracking();
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to start duty.",
            });
        } finally {
            setActionLoading(false);
        }
    };

    // End Duty handler
    const handleEndDuty = async () => {
        setActionLoading(true);
        setAlert({ type: "", message: "" });
        try {
            const res = await api.post("/driver/duty/end");
            if (res.data?.success) {
                setProfile((prev) => ({ ...prev, dutyStatus: "OFF_DUTY" }));
                stopGpsTracking();
                setAlert({
                    type: "info",
                    message: "You are now OFF DUTY. GPS tracking paused.",
                });
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to end duty.",
            });
        } finally {
            setActionLoading(false);
        }
    };

    const isOnDuty = profile?.dutyStatus === "ON_DUTY";
    const ambulance = profile?.assignedAmbulanceId;

    return (
        <DashboardLayout
            role="driver"
            title="Driver Portal"
            subtitle="Ambulance dispatch operations, live duty management, and GPS telemetry"
        >
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
                        Loading driver operations center...
                    </Typography>
                </Box>
            ) : (
                <Stack spacing={3}>
                    {/* ACTIVE DISPATCH ALERT HERO CARD (If dispatched) */}
                    {currentTrip && (
                        <Card
                            elevation={0}
                            sx={{
                                borderRadius: 3.5,
                                border: "2px solid #DC2626",
                                bgcolor: "#FEF2F2",
                                p: { xs: 2.5, sm: 3.5 },
                                boxShadow: "0 10px 30px rgba(220,38,38,0.12)",
                            }}
                        >
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={2.5}
                                alignItems={{ xs: "stretch", sm: "center" }}
                                justifyContent="space-between"
                            >
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1 }}>
                                        <Chip
                                            label="🚨 ACTIVE DISPATCH ORDER"
                                            size="small"
                                            sx={{
                                                bgcolor: "#DC2626",
                                                color: colors.white,
                                                fontWeight: 850,
                                                fontSize: 11,
                                                letterSpacing: 0.5,
                                            }}
                                        />
                                        <Chip
                                            label={`STATUS: ${currentTrip.journeyStatus || currentTrip.status}`}
                                            size="small"
                                            sx={{
                                                bgcolor: "#FEE2E2",
                                                color: "#B91C1C",
                                                fontWeight: 800,
                                                fontSize: 11,
                                                border: "1px solid #FECACA",
                                            }}
                                        />
                                    </Box>

                                    <Typography fontSize={20} fontWeight={850} color={colors.ink}>
                                        {currentTrip.emergencyCategory || "Critical Medical Dispatch"}
                                    </Typography>

                                    <Typography fontSize={13.5} color={colors.slate} mt={0.5}>
                                        {currentTrip.description}
                                    </Typography>

                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={1.5}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                            <LocationOnOutlined sx={{ fontSize: 16, color: "#DC2626" }} />
                                            <Typography fontSize={13} fontWeight={600} color={colors.ink}>
                                                {currentTrip.address || "GPS Coordinates Provided"}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                            <PhoneOutlined sx={{ fontSize: 16, color: colors.pine }} />
                                            <Typography fontSize={13} fontWeight={600} color={colors.ink}>
                                                Patient: {currentTrip.contactNumber}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>

                                <Box sx={{ flexShrink: 0 }}>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        fullWidth
                                        endIcon={<ArrowForwardRounded />}
                                        onClick={() => navigate("/driver/current-trip")}
                                        sx={{
                                            bgcolor: "#DC2626",
                                            color: colors.white,
                                            fontWeight: 850,
                                            fontSize: 15,
                                            py: 1.5,
                                            px: 3.5,
                                            borderRadius: 2.8,
                                            textTransform: "none",
                                            boxShadow: "0 6px 20px rgba(220,38,38,0.25)",
                                            "&:hover": { bgcolor: "#B91C1C" },
                                        }}
                                    >
                                        {currentTrip.journeyStatus === "DISPATCHED"
                                            ? "Start Journey Now"
                                            : "Continue Active Trip"}
                                    </Button>
                                </Box>
                            </Stack>
                        </Card>
                    )}

                    {/* DUTY STATUS & GPS TELEMETRY */}
                    <Grid container spacing={2.5}>
                        {/* 1. Duty Control */}
                        <Grid item xs={12} md={6}>
                            <Card
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: 3.5,
                                    border: `1px solid ${colors.hairline}`,
                                    bgcolor: colors.white,
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Box>
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                                        <Typography fontSize={13} fontWeight={800} color={colors.slate} letterSpacing={0.5}>
                                            OPERATIONAL SHIFT
                                        </Typography>
                                        <Chip
                                            label={isOnDuty ? "● ON DUTY" : "○ OFF DUTY"}
                                            sx={{
                                                bgcolor: isOnDuty ? "#DCFCE7" : "#F1F5F9",
                                                color: isOnDuty ? "#16A34A" : colors.slate,
                                                fontWeight: 850,
                                                fontSize: 12,
                                                height: 26,
                                            }}
                                        />
                                    </Box>

                                    <Typography fontSize={20} fontWeight={850} color={colors.ink}>
                                        {isOnDuty ? "Ready for Emergency Dispatch" : "Shift Inactive"}
                                    </Typography>
                                    <Typography fontSize={13.5} color={colors.slate} mt={0.5} lineHeight={1.5}>
                                        {isOnDuty
                                            ? "Your assigned ambulance is currently marked AVAILABLE in hospital fleet records. Incoming dispatch orders will alert you immediately."
                                            : "Start your duty shift to make your ambulance available for hospital emergency dispatches and initialize GPS telemetry."}
                                    </Typography>
                                </Box>

                                <Box mt={3}>
                                    {isOnDuty ? (
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            fullWidth
                                            size="large"
                                            startIcon={<PowerSettingsNewRounded />}
                                            onClick={handleEndDuty}
                                            disabled={actionLoading || Boolean(currentTrip)}
                                            sx={{
                                                borderRadius: 2.5,
                                                textTransform: "none",
                                                fontWeight: 750,
                                                py: 1.2,
                                            }}
                                        >
                                            {actionLoading ? "Ending Shift..." : "End Duty Shift"}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            size="large"
                                            startIcon={<PlayArrowRounded />}
                                            onClick={handleStartDuty}
                                            disabled={actionLoading}
                                            sx={{
                                                bgcolor: colors.pine,
                                                color: colors.white,
                                                borderRadius: 2.5,
                                                textTransform: "none",
                                                fontWeight: 800,
                                                py: 1.2,
                                                "&:hover": { bgcolor: colors.pineDeep },
                                            }}
                                        >
                                            {actionLoading ? "Starting Shift..." : "Start Duty Shift"}
                                        </Button>
                                    )}
                                </Box>
                            </Card>
                        </Grid>

                        {/* 2. GPS Telemetry Status */}
                        <Grid item xs={12} md={6}>
                            <Card
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: 3.5,
                                    border: `1px solid ${colors.hairline}`,
                                    bgcolor: colors.white,
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Box>
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                                        <Typography fontSize={13} fontWeight={800} color={colors.slate} letterSpacing={0.5}>
                                            GPS TELEMETRY
                                        </Typography>
                                        <Chip
                                            icon={<MyLocationRounded sx={{ fontSize: "14px !important" }} />}
                                            label={gpsActive ? "Live GPS Active" : "GPS Inactive"}
                                            sx={{
                                                bgcolor: gpsActive ? "#EFF6FF" : "#F8FAFC",
                                                color: gpsActive ? "#2563EB" : colors.slate,
                                                fontWeight: 800,
                                                fontSize: 11.5,
                                                height: 26,
                                            }}
                                        />
                                    </Box>

                                    <Typography fontSize={20} fontWeight={850} color={colors.ink}>
                                        {gpsActive ? "High-Accuracy Tracking" : "Awaiting Shift Activation"}
                                    </Typography>
                                    <Typography fontSize={13.5} color={colors.slate} mt={0.5} lineHeight={1.5}>
                                        Coordinates update automatically every 5–15 seconds to provide accurate ETA for patients and hospital dispatchers.
                                    </Typography>

                                    {coords && (
                                        <Box sx={{ mt: 1.5, p: 1.5, bgcolor: "#F8FAFC", borderRadius: 2 }}>
                                            <Typography fontSize={12} color={colors.slate} fontFamily="monospace">
                                                Lat: {coords.latitude.toFixed(5)}°N, Lon: {coords.longitude.toFixed(5)}°E
                                                {coords.accuracy != null && ` (±${Math.round(coords.accuracy)}m)`}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>

                                <Box mt={3}>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={<MyLocationRounded />}
                                        onClick={startGpsTracking}
                                        disabled={!isOnDuty}
                                        sx={{
                                            borderRadius: 2.5,
                                            textTransform: "none",
                                            fontWeight: 750,
                                            borderColor: colors.hairline,
                                            color: colors.ink,
                                        }}
                                    >
                                        Calibrate Device GPS
                                    </Button>
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* ASSIGNED FLEET AMBULANCE */}
                    <Card
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 3.5,
                            border: `1px solid ${colors.hairline}`,
                            bgcolor: colors.white,
                        }}
                    >
                        <Typography fontSize={13} fontWeight={800} color={colors.slate} letterSpacing={0.5} mb={2}>
                            ASSIGNED VEHICLE & BASE HOSPITAL
                        </Typography>

                        {ambulance ? (
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={3}
                                alignItems={{ xs: "flex-start", sm: "center" }}
                                justifyContent="space-between"
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <Box
                                        sx={{
                                            width: 54,
                                            height: 54,
                                            borderRadius: 3,
                                            bgcolor: "#EFF6FF",
                                            border: "1px solid #BFDBFE",
                                            display: "grid",
                                            placeItems: "center",
                                            color: "#2563EB",
                                        }}
                                    >
                                        <TimeToLeaveOutlined sx={{ fontSize: 28 }} />
                                    </Box>
                                    <Box>
                                        <Typography fontSize={18} fontWeight={850} color={colors.ink}>
                                            {ambulance.ambulanceNumber}
                                        </Typography>
                                        <Typography fontSize={13} color={colors.slate}>
                                            {ambulance.vehicleType} • Plate: {ambulance.vehicleRegNumber || ambulance.ambulanceNumber}
                                        </Typography>
                                        <Box sx={{ display: "flex", gap: 0.8, mt: 0.8, flexWrap: "wrap" }}>
                                            {(ambulance.capability || ["BASIC"]).map((cap) => (
                                                <Chip
                                                    key={cap}
                                                    label={cap}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: "#F0FDFA",
                                                        color: colors.pine,
                                                        border: "1px solid #CCFBF1",
                                                        fontWeight: 800,
                                                        fontSize: 10.5,
                                                        height: 20,
                                                    }}
                                                />
                                            ))}
                                            <Chip
                                                label={ambulance.verificationStatus || "VERIFIED"}
                                                size="small"
                                                sx={{
                                                    bgcolor: "#F0FDF4",
                                                    color: "#16A34A",
                                                    fontWeight: 800,
                                                    fontSize: 10.5,
                                                    height: 20,
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                </Box>

                                <Box>
                                    <Typography fontSize={12} color={colors.slate} fontWeight={600}>
                                        BASE HOSPITAL
                                    </Typography>
                                    <Typography fontSize={15} fontWeight={800} color={colors.ink}>
                                        {profile?.hospitalId?.hospitalName || "Central Emergency Fleet"}
                                    </Typography>
                                    <Typography fontSize={12.5} color={colors.slate}>
                                        {profile?.hospitalId?.address || "Network Operating Base"}
                                    </Typography>
                                </Box>
                            </Stack>
                        ) : (
                            <Box py={2} textAlign="center">
                                <Typography color={colors.slate} fontSize={14}>
                                    No ambulance is currently linked to your driver profile. Please contact your hospital administrator.
                                </Typography>
                            </Box>
                        )}
                    </Card>
                </Stack>
            )}
        </DashboardLayout>
    );
}
