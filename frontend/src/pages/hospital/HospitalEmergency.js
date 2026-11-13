import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Grid,
    IconButton,
    Radio,
    RadioGroup,
    Stack,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    EmergencyOutlined,
    PhoneOutlined,
    LocationOnOutlined,
    RefreshRounded,
    TimeToLeaveOutlined,
    CheckCircleRounded,
    CloseRounded,
    LocalHospitalOutlined,
    NavigationRounded,
    WarningAmberRounded,
    SendRounded,
    CheckCircleOutlineRounded,
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

export default function HospitalEmergency() {
    const { user } = useAuth();

    // Data state
    const [hospitalInfo, setHospitalInfo] = useState(null);
    const [capabilities, setCapabilities] = useState({
        emergencyOpen: true,
        cardiacCare: false,
        traumaCare: false,
        strokeSupport: false,
        breathingEmergencySupport: false,
        maternityEmergency: false,
        pediatricEmergency: false,
    });
    const [capSaving, setCapSaving] = useState(false);

    const [incomingEmergencies, setIncomingEmergencies] = useState([]);
    const [activeEmergencies, setActiveEmergencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ type: "", message: "" });

    // Ambulance Selection Dialog (after accepting emergency)
    const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
    const [targetEmergency, setTargetEmergency] = useState(null);
    const [recommendedAmbulance, setRecommendedAmbulance] = useState(null);
    const [alternativeAmbulances, setAlternativeAmbulances] = useState([]);
    const [selectedAmbulanceId, setSelectedAmbulanceId] = useState("");
    const [overrideReason, setOverrideReason] = useState("");
    const [dispatching, setDispatching] = useState(false);

    // Reject Dialog
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [rejecting, setRejecting] = useState(false);

    const socketRef = useRef(null);

    // Fetch operations data
    const fetchOperations = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/hospital/emergency-operations");
            if (res.data?.success) {
                setHospitalInfo(res.data.hospital);
                if (res.data.hospital?.capabilities) {
                    setCapabilities((prev) => ({
                        ...prev,
                        ...res.data.hospital.capabilities,
                        emergencyOpen: res.data.hospital.emergencyAvailable ?? true,
                    }));
                }
                setIncomingEmergencies(res.data.incomingEmergencies || []);
                setActiveEmergencies(res.data.activeEmergencies || []);
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to load hospital emergency operations.",
            });
        } finally {
            setLoading(false);
        }
    }, []);

    // Socket.IO for incoming emergencies in real time
    useEffect(() => {
        fetchOperations();

        const socket = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            if (user?._id) {
                socket.emit("join", user._id);
                socket.emit("join_role", "hospital");
            }
        });

        socket.on("emergency:created", (data) => {
            setAlert({
                type: "error",
                message: `🚨 NEW INCOMING EMERGENCY: ${data.emergencyCategory || "Transfer Request"} received! Review & accept below.`,
            });
            fetchOperations();
        });

        socket.on("ambulance:journey-status-updated", () => {
            fetchOperations();
        });

        socket.on("ambulance:not-responding", (data) => {
            setAlert({
                type: "error",
                message: `⚠️ DRIVER ISSUE REPORTED for Emergency #${data.emergencyId?.toString().slice(-6)}. Reassign replacement vehicle immediately.`,
            });
            fetchOperations();
        });

        return () => {
            socket.disconnect();
        };
    }, [fetchOperations, user]);

    // Save capability settings
    const handleSaveCapabilities = async () => {
        setCapSaving(true);
        setAlert({ type: "", message: "" });
        try {
            const res = await api.patch("/hospital/emergency-capabilities", capabilities);
            if (res.data?.success) {
                setAlert({
                    type: "success",
                    message: "Hospital emergency capabilities & intake status saved successfully.",
                });
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to update capabilities.",
            });
        } finally {
            setCapSaving(false);
        }
    };

    // Open Accept & Ambulance selection modal
    const handleOpenAccept = async (emergency) => {
        setTargetEmergency(emergency);
        setDispatching(false);
        setOverrideReason("");

        try {
            // Call accept endpoint to accept emergency and get recommended fleet
            const res = await api.post(`/hospital/emergencies/${emergency._id}/accept`);
            if (res.data?.success) {
                setRecommendedAmbulance(res.data.recommendedAmbulance || null);
                setAlternativeAmbulances(res.data.alternativeAmbulances || []);
                setSelectedAmbulanceId(res.data.recommendedAmbulance?._id || "");
                setDispatchDialogOpen(true);
                fetchOperations();
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to accept emergency.",
            });
        }
    };

    // Dispatch selected ambulance
    const handleConfirmDispatch = async () => {
        if (!selectedAmbulanceId || !targetEmergency) return;

        const isNonRecommended =
            recommendedAmbulance && String(selectedAmbulanceId) !== String(recommendedAmbulance._id);

        if (isNonRecommended && !overrideReason.trim()) {
            setAlert({
                type: "warning",
                message: "Please enter an override reason when selecting a non-recommended vehicle.",
            });
            return;
        }

        setDispatching(true);
        try {
            const res = await api.post(
                `/hospital/emergencies/${targetEmergency._id}/dispatch-ambulance`,
                {
                    ambulanceId: selectedAmbulanceId,
                    overrideReason: isNonRecommended ? overrideReason.trim() : undefined,
                }
            );

            if (res.data?.success) {
                setAlert({
                    type: "success",
                    message: `Ambulance ${res.data.dispatchedAmbulance?.ambulanceNumber} dispatched! Driver received direct orders.`,
                });
                setDispatchDialogOpen(false);
                setTargetEmergency(null);
                fetchOperations();
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to dispatch ambulance.",
            });
        } finally {
            setDispatching(false);
        }
    };

    // Open Reject dialog
    const handleOpenReject = (emergency) => {
        setTargetEmergency(emergency);
        setRejectReason("");
        setRejectDialogOpen(true);
    };

    // Submit reject
    const handleConfirmReject = async () => {
        if (!targetEmergency || !rejectReason.trim()) return;

        setRejecting(true);
        try {
            const res = await api.post(`/hospital/emergencies/${targetEmergency._id}/reject`, {
                reason: rejectReason.trim(),
            });

            if (res.data?.success) {
                setAlert({
                    type: "info",
                    message: "Emergency transfer rejected and escalated to platform administration for redirect.",
                });
                setRejectDialogOpen(false);
                setTargetEmergency(null);
                fetchOperations();
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to reject emergency.",
            });
        } finally {
            setRejecting(false);
        }
    };

    return (
        <DashboardLayout
            role="hospital"
            title="Hospital Emergency Operations"
            subtitle="Real-time emergency intake, capability filters, and direct ambulance fleet dispatch"
        >
            <PageHeader
                title="Emergency Operations Center"
                subtitle="Review urgent transfer requests, dispatch duty ambulances, and manage facility emergency intake"
                action={
                    <Button
                        variant="outlined"
                        startIcon={<RefreshRounded />}
                        onClick={fetchOperations}
                        sx={{
                            borderRadius: 2.2,
                            textTransform: "none",
                            fontWeight: 700,
                            color: colors.slate,
                            borderColor: colors.hairline,
                            bgcolor: colors.white,
                        }}
                    >
                        Refresh Radar
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

            {loading ? (
                <Box textAlign="center" py={8}>
                    <CircularProgress sx={{ color: colors.pine }} />
                    <Typography mt={2} color={colors.slate} fontSize={14}>
                        Loading emergency operations & live incoming radar...
                    </Typography>
                </Box>
            ) : (
                <Stack spacing={3}>
                    {/* 1. SIMPLE HOSPITAL CAPABILITY SETTINGS (Prompt Spec #3) */}
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 3.5,
                            border: `1px solid ${colors.hairline}`,
                            bgcolor: colors.white,
                            p: { xs: 2.5, sm: 3 },
                        }}
                    >
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            spacing={2}
                            mb={2.5}
                        >
                            <Box>
                                <Typography fontSize={17} fontWeight={850} color={colors.ink}>
                                    Hospital Emergency Operations & Intake
                                </Typography>
                                <Typography fontSize={13} color={colors.slate} mt={0.3}>
                                    Configure current emergency capability toggles. System dispatch algorithms only route emergencies matching your enabled services.
                                </Typography>
                            </Box>

                            {/* Emergency Intake Switch */}
                            <Box
                                sx={{
                                    px: 2,
                                    py: 1,
                                    borderRadius: 3,
                                    bgcolor: capabilities.emergencyOpen ? "#DCFCE7" : "#FEE2E2",
                                    border: "1px solid",
                                    borderColor: capabilities.emergencyOpen ? "#86EFAC" : "#FECACA",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                }}
                            >
                                <Typography
                                    fontSize={13}
                                    fontWeight={850}
                                    color={capabilities.emergencyOpen ? "#16A34A" : "#DC2626"}
                                >
                                    Emergency Intake: {capabilities.emergencyOpen ? "OPEN" : "CLOSED"}
                                </Typography>
                                <Switch
                                    checked={capabilities.emergencyOpen}
                                    onChange={(e) =>
                                        setCapabilities((prev) => ({
                                            ...prev,
                                            emergencyOpen: e.target.checked,
                                        }))
                                    }
                                    color="success"
                                />
                            </Box>
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        {/* Capabilities Checkboxes */}
                        <Typography fontSize={12.5} fontWeight={800} color={colors.slate} letterSpacing={0.5} mb={1.5}>
                            ACTIVE EMERGENCY CAPABILITIES
                        </Typography>

                        <Grid container spacing={2}>
                            {[
                                { key: "cardiacCare", label: "Cardiac Care (Heart Emergencies)" },
                                { key: "traumaCare", label: "Trauma Care (Accidents & Hemorrhage)" },
                                { key: "strokeSupport", label: "Stroke Support (Neurology Rapid Response)" },
                                { key: "breathingEmergencySupport", label: "Breathing Emergency (Oxygen & ICU)" },
                                { key: "maternityEmergency", label: "Maternity Emergency (Obstetrics Care)" },
                                { key: "pediatricEmergency", label: "Pediatric Emergency (Child Trauma & Care)" },
                            ].map((item) => (
                                <Grid item xs={12} sm={6} md={4} key={item.key}>
                                    <Box
                                        sx={{
                                            p: 1.5,
                                            borderRadius: 2.5,
                                            bgcolor: capabilities[item.key] ? "#F0FDFA" : "#F8FAFC",
                                            border: "1px solid",
                                            borderColor: capabilities[item.key] ? "#CCFBF1" : colors.hairline,
                                            display: "flex",
                                            alignItems: "center",
                                            transition: "all 0.15s ease",
                                        }}
                                    >
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={Boolean(capabilities[item.key])}
                                                    onChange={(e) =>
                                                        setCapabilities((prev) => ({
                                                            ...prev,
                                                            [item.key]: e.target.checked,
                                                        }))
                                                    }
                                                    sx={{ color: colors.pine, "&.Mui-checked": { color: colors.pine } }}
                                                />
                                            }
                                            label={
                                                <Typography fontSize={13} fontWeight={700} color={colors.ink}>
                                                    {item.label}
                                                </Typography>
                                            }
                                            sx={{ m: 0, width: "100%" }}
                                        />
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>

                        <Box mt={3} display="flex" justifyContent="flex-end">
                            <Button
                                variant="contained"
                                onClick={handleSaveCapabilities}
                                disabled={capSaving}
                                sx={{
                                    bgcolor: colors.pine,
                                    color: colors.white,
                                    borderRadius: 2.5,
                                    px: 3,
                                    py: 1,
                                    textTransform: "none",
                                    fontWeight: 800,
                                    "&:hover": { bgcolor: colors.pineDeep },
                                }}
                            >
                                {capSaving ? "Saving..." : "Save Emergency Availability"}
                            </Button>
                        </Box>
                    </Card>

                    {/* 2. INCOMING EMERGENCY REQUESTS QUEUE (Prompt Spec #4) */}
                    <Box>
                        <Typography fontSize={18} fontWeight={850} color={colors.ink} mb={2}>
                            Incoming Emergency Requests ({incomingEmergencies.length})
                        </Typography>

                        {incomingEmergencies.length === 0 ? (
                            <Card
                                elevation={0}
                                sx={{
                                    py: 6,
                                    textAlign: "center",
                                    borderRadius: 3.5,
                                    border: `1px solid ${colors.hairline}`,
                                    bgcolor: colors.white,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 54,
                                        height: 54,
                                        borderRadius: "50%",
                                        bgcolor: "#F0FDFA",
                                        display: "grid",
                                        placeItems: "center",
                                        color: colors.pine,
                                        mx: "auto",
                                        mb: 1.5,
                                    }}
                                >
                                    <CheckCircleRounded sx={{ fontSize: 30 }} />
                                </Box>
                                <Typography fontSize={16} fontWeight={800} color={colors.ink}>
                                    No Pending Emergency Transfer Requests
                                </Typography>
                                <Typography fontSize={13} color={colors.slate} mt={0.5}>
                                    Incoming requests matching your active emergency capabilities will appear here in real time.
                                </Typography>
                            </Card>
                        ) : (
                            <Stack spacing={2}>
                                {incomingEmergencies.map((em) => (
                                    <Card
                                        key={em._id}
                                        elevation={0}
                                        sx={{
                                            borderRadius: 3.5,
                                            border: "2px solid #DC2626",
                                            bgcolor: "#FEF2F2",
                                            p: { xs: 2.2, sm: 3 },
                                            boxShadow: "0 8px 24px rgba(220,38,38,0.08)",
                                        }}
                                    >
                                        <Stack
                                            direction={{ xs: "column", md: "row" }}
                                            spacing={2.5}
                                            justifyContent="space-between"
                                            alignItems={{ xs: "stretch", md: "center" }}
                                        >
                                            <Box sx={{ flex: 1 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
                                                    <Chip
                                                        label={`EMERGENCY ID: #${em._id.toString().slice(-6)}`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: "#DC2626",
                                                            color: colors.white,
                                                            fontWeight: 850,
                                                            fontSize: 11,
                                                        }}
                                                    />
                                                    <Chip
                                                        label={`PRIORITY: CRITICAL`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: colors.white,
                                                            color: "#DC2626",
                                                            border: "1px solid #FECACA",
                                                            fontWeight: 850,
                                                            fontSize: 11,
                                                        }}
                                                    />
                                                    <Chip
                                                        label={em.emergencyCategory || "Emergency Transfer"}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: "#FEE2E2",
                                                            color: "#B91C1C",
                                                            fontWeight: 800,
                                                            fontSize: 11,
                                                        }}
                                                    />
                                                </Box>

                                                <Typography fontSize={17} fontWeight={850} color={colors.ink}>
                                                    {em.description}
                                                </Typography>

                                                <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} mt={1.5}>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                                        <LocationOnOutlined sx={{ fontSize: 16, color: "#DC2626" }} />
                                                        <Typography fontSize={13} color={colors.ink} fontWeight={600}>
                                                            Location: {em.address || "GPS Coordinates Provided"}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                                        <PhoneOutlined sx={{ fontSize: 16, color: colors.pine }} />
                                                        <Typography fontSize={13} color={colors.ink} fontWeight={600}>
                                                            Patient Contact: {em.contactNumber}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </Box>

                                            <Stack direction={{ xs: "row", sm: "column" }} spacing={1.2} sx={{ flexShrink: 0 }}>
                                                <Button
                                                    variant="contained"
                                                    size="medium"
                                                    onClick={() => handleOpenAccept(em)}
                                                    sx={{
                                                        bgcolor: "#16A34A",
                                                        color: colors.white,
                                                        borderRadius: 2.5,
                                                        textTransform: "none",
                                                        fontWeight: 800,
                                                        px: 3,
                                                        "&:hover": { bgcolor: "#15803D" },
                                                    }}
                                                >
                                                    Accept Emergency
                                                </Button>

                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="medium"
                                                    onClick={() => handleOpenReject(em)}
                                                    sx={{
                                                        borderRadius: 2.5,
                                                        textTransform: "none",
                                                        fontWeight: 750,
                                                        bgcolor: colors.white,
                                                    }}
                                                >
                                                    Reject / Redirect
                                                </Button>
                                            </Stack>
                                        </Stack>
                                    </Card>
                                ))}
                            </Stack>
                        )}
                    </Box>

                    {/* 3. ACTIVE DISPATCHED EMERGENCIES TRACKER */}
                    <Box>
                        <Typography fontSize={18} fontWeight={850} color={colors.ink} mb={2}>
                            Active Dispatched Ambulances ({activeEmergencies.length})
                        </Typography>

                        {activeEmergencies.length === 0 ? (
                            <Card
                                elevation={0}
                                sx={{
                                    py: 5,
                                    textAlign: "center",
                                    borderRadius: 3.5,
                                    border: `1px solid ${colors.hairline}`,
                                    bgcolor: colors.white,
                                }}
                            >
                                <Typography color={colors.slate} fontSize={14}>
                                    No ambulances currently in transit.
                                </Typography>
                            </Card>
                        ) : (
                            <Stack spacing={2}>
                                {activeEmergencies.map((em) => (
                                    <Card
                                        key={em._id}
                                        elevation={0}
                                        sx={{
                                            borderRadius: 3.5,
                                            border: `1px solid ${colors.hairline}`,
                                            bgcolor: colors.white,
                                            p: { xs: 2.2, sm: 2.8 },
                                        }}
                                    >
                                        <Stack
                                            direction={{ xs: "column", md: "row" }}
                                            spacing={2}
                                            justifyContent="space-between"
                                            alignItems={{ xs: "stretch", md: "center" }}
                                        >
                                            <Box>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.8, flexWrap: "wrap" }}>
                                                    <Chip
                                                        label={em.emergencyCategory}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: "#F0FDFA",
                                                            color: colors.pine,
                                                            fontWeight: 800,
                                                            fontSize: 11,
                                                        }}
                                                    />
                                                    <Chip
                                                        label={`TRANSIT: ${em.journeyStatus || em.status}`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: "#EFF6FF",
                                                            color: "#2563EB",
                                                            fontWeight: 800,
                                                            fontSize: 11,
                                                        }}
                                                    />
                                                </Box>

                                                <Typography fontSize={15.5} fontWeight={850} color={colors.ink}>
                                                    Ambulance: {em.ambulanceId?.ambulanceNumber || "Assigned"} • Driver: {em.ambulanceId?.driverName || "Driver"}
                                                </Typography>

                                                <Typography fontSize={13} color={colors.slate} mt={0.5}>
                                                    Destination: {em.address || "GPS Position"} • Patient Phone: {em.contactNumber}
                                                </Typography>
                                            </Box>

                                            <Box>
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<PhoneOutlined />}
                                                    href={`tel:${em.ambulanceId?.driverPhone || em.contactNumber}`}
                                                    sx={{
                                                        borderRadius: 2.5,
                                                        textTransform: "none",
                                                        fontWeight: 750,
                                                        color: colors.ink,
                                                        borderColor: colors.hairline,
                                                    }}
                                                >
                                                    Contact Driver
                                                </Button>
                                            </Box>
                                        </Stack>
                                    </Card>
                                ))}
                            </Stack>
                        )}
                    </Box>
                </Stack>
            )}

            {/* 4. SELECT AMBULANCE DISPATCH MODAL (Prompt Spec #4) */}
            <Dialog
                open={dispatchDialogOpen}
                onClose={() => setDispatchDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3.5 } }}
            >
                <DialogTitle sx={{ fontWeight: 850, fontSize: 19 }}>
                    Select Ambulance for Dispatch
                </DialogTitle>
                <DialogContent dividers>
                    <Typography fontSize={13.5} color={colors.slate} mb={2.5}>
                        System matching prioritizes available ambulances from your fleet matching clinical requirements, GPS freshness, and driver on-duty state.
                    </Typography>

                    {recommendedAmbulance ? (
                        <Box sx={{ mb: 3 }}>
                            <Typography fontSize={12.5} fontWeight={800} color={colors.pine} letterSpacing={0.5} mb={1}>
                                RECOMMENDED FLEET VEHICLE
                            </Typography>
                            <Card
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 3,
                                    border: "2px solid",
                                    borderColor: selectedAmbulanceId === recommendedAmbulance._id ? colors.pine : colors.hairline,
                                    bgcolor: selectedAmbulanceId === recommendedAmbulance._id ? "#F0FDFA" : colors.white,
                                    cursor: "pointer",
                                }}
                                onClick={() => setSelectedAmbulanceId(recommendedAmbulance._id)}
                            >
                                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                        <Radio checked={selectedAmbulanceId === recommendedAmbulance._id} />
                                        <Box>
                                            <Typography fontSize={16} fontWeight={850} color={colors.ink}>
                                                {recommendedAmbulance.ambulanceNumber}
                                            </Typography>
                                            <Typography fontSize={13} color={colors.slate}>
                                                Driver: {recommendedAmbulance.driverName} ({recommendedAmbulance.driverPhone})
                                            </Typography>
                                            <Box sx={{ display: "flex", gap: 0.8, mt: 0.8, flexWrap: "wrap" }}>
                                                {(recommendedAmbulance.capability || ["BASIC"]).map((c) => (
                                                    <Chip
                                                        key={c}
                                                        label={c}
                                                        size="small"
                                                        sx={{ bgcolor: "#E8F3F1", color: colors.pine, fontWeight: 800, fontSize: 10.5 }}
                                                    />
                                                ))}
                                                <Chip
                                                    label="● GPS Active"
                                                    size="small"
                                                    sx={{ bgcolor: "#DCFCE7", color: "#16A34A", fontWeight: 800, fontSize: 10.5 }}
                                                />
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Chip
                                        label="Recommended"
                                        size="small"
                                        color="success"
                                        sx={{ fontWeight: 850, fontSize: 11 }}
                                    />
                                </Stack>
                            </Card>
                        </Box>
                    ) : (
                        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2.5 }}>
                            No ideal recommended vehicle with matching capability found available in your fleet. You may dispatch an alternative available ambulance.
                        </Alert>
                    )}

                    {/* Alternative Ambulances */}
                    {alternativeAmbulances.length > 0 && (
                        <Box>
                            <Typography fontSize={12.5} fontWeight={800} color={colors.slate} letterSpacing={0.5} mb={1}>
                                ALTERNATIVE FLEET AMBULANCES
                            </Typography>
                            <Stack spacing={1.5}>
                                {alternativeAmbulances.map((amb) => {
                                    const isChosen = selectedAmbulanceId === amb._id;
                                    return (
                                        <Card
                                            key={amb._id}
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                borderRadius: 2.8,
                                                border: "1px solid",
                                                borderColor: isChosen ? colors.pine : colors.hairline,
                                                bgcolor: isChosen ? "#F0FDFA" : colors.white,
                                                cursor: "pointer",
                                            }}
                                            onClick={() => setSelectedAmbulanceId(amb._id)}
                                        >
                                            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                    <Radio checked={isChosen} />
                                                    <Box>
                                                        <Typography fontSize={15} fontWeight={800} color={colors.ink}>
                                                            {amb.ambulanceNumber}
                                                        </Typography>
                                                        <Typography fontSize={12.5} color={colors.slate}>
                                                            Driver: {amb.driverName} • Capabilities: {(amb.capability || ["BASIC"]).join(", ")}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Chip
                                                    label="Alternative"
                                                    size="small"
                                                    sx={{ bgcolor: "#F1F5F9", color: colors.slate, fontWeight: 700, fontSize: 11 }}
                                                />
                                            </Stack>
                                        </Card>
                                    );
                                })}
                            </Stack>
                        </Box>
                    )}

                    {/* Override reason field if non-recommended chosen */}
                    {recommendedAmbulance && selectedAmbulanceId && selectedAmbulanceId !== recommendedAmbulance._id && (
                        <Box sx={{ mt: 3, p: 2, bgcolor: "#FFFBEB", borderRadius: 2.5, border: "1px solid #FDE68A" }}>
                            <Typography fontSize={13} fontWeight={750} color="#B45309" mb={1}>
                                Non-Recommended Vehicle Override Reason Required:
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Explain why the recommended ambulance was not selected (e.g. driver closer, vehicle equipped)..."
                                value={overrideReason}
                                onChange={(e) => setOverrideReason(e.target.value)}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button
                        onClick={() => setDispatchDialogOpen(false)}
                        sx={{ textTransform: "none", fontWeight: 700, color: colors.slate }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        disabled={dispatching || !selectedAmbulanceId}
                        onClick={handleConfirmDispatch}
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
                        {dispatching ? "Dispatching..." : "Dispatch This Ambulance"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 5. REJECT / REDIRECT DIALOG */}
            <Dialog
                open={rejectDialogOpen}
                onClose={() => setRejectDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3.5 } }}
            >
                <DialogTitle sx={{ fontWeight: 850, fontSize: 18, color: "#DC2626" }}>
                    Redirect / Reject Emergency Request
                </DialogTitle>
                <DialogContent>
                    <Typography fontSize={13.5} color={colors.slate} mb={2}>
                        Please specify the operational reason for rejecting this transfer (e.g. ICU full, emergency capacity reached, specialist unavailable). Platform administrators will be alerted immediately to redirect the patient.
                    </Typography>
                    <TextField
                        label="Reason for Redirection"
                        placeholder="e.g. All cardiac monitors currently in use..."
                        fullWidth
                        multiline
                        rows={3}
                        required
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button
                        onClick={() => setRejectDialogOpen(false)}
                        sx={{ textTransform: "none", fontWeight: 700, color: colors.slate }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        disabled={rejecting || !rejectReason.trim()}
                        onClick={handleConfirmReject}
                        sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 800 }}
                    >
                        {rejecting ? "Rejecting..." : "Confirm Rejection"}
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
}
