import React, { useEffect, useState, useMemo } from "react";
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
    Divider,
    Grid,
    InputAdornment,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography,
} from "@mui/material";
import {
    HistoryOutlined,
    TimeToLeaveOutlined,
    EmergencyOutlined,
    LocalHospitalOutlined,
    PhoneOutlined,
    LocationOnOutlined,
    SearchOutlined,
    ArrowForwardRounded,
    RefreshOutlined,
    SpeedOutlined,
    AssignmentTurnedInOutlined,
    CalendarTodayOutlined,
    InfoOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../services/api";
import { colors } from "../../theme/colors";

// Helper for formatted dates
const formatTripDate = (dateVal) => {
    if (!dateVal) return "—";
    try {
        const d = new Date(dateVal);
        return new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        }).format(d).replace(",", " •");
    } catch {
        return String(dateVal);
    }
};

const getJourneyBadge = (journeyStatus, mainStatus) => {
    switch (journeyStatus) {
        case "HANDOVER_COMPLETE":
            return {
                label: "Handover Complete",
                color: "#16A34A",
                bg: "#F0FDF4",
                border: "#BBF7D0",
            };
        case "EN_ROUTE_TO_HOSPITAL":
            return {
                label: "En Route to Hospital",
                color: "#2563EB",
                bg: "#EFF6FF",
                border: "#BFDBFE",
            };
        case "PATIENT_ONBOARD":
            return {
                label: "Patient Onboard",
                color: "#7C3AED",
                bg: "#F5F3FF",
                border: "#DDD6FE",
            };
        case "ARRIVED_AT_PATIENT":
            return {
                label: "Arrived at Patient",
                color: "#0D9488",
                bg: "#F0FDFA",
                border: "#99F6E4",
            };
        case "EN_ROUTE_TO_PATIENT":
            return {
                label: "En Route to Patient",
                color: "#D97706",
                bg: "#FFFBEB",
                border: "#FDE68A",
            };
        case "DISPATCHED":
            return {
                label: "Dispatched",
                color: "#EA580C",
                bg: "#FFF7ED",
                border: "#FED7AA",
            };
        default:
            return {
                label: mainStatus || journeyStatus || "Completed",
                color: "#475569",
                bg: "#F1F5F9",
                border: "#E2E8F0",
            };
    }
};

export default function DriverHistory() {
    const navigate = useNavigate();

    const [trips, setTrips] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [selectedTrip, setSelectedTrip] = useState(null);

    const loadHistory = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/driver/history");
            if (res.data?.success) {
                setTrips(res.data.trips || []);
                setMetrics(res.data.metrics || null);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load driver work history.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const filteredTrips = useMemo(() => {
        return trips.filter((t) => {
            const q = search.toLowerCase().trim();
            const matchesSearch =
                !q ||
                (t.emergencyCategory || "").toLowerCase().includes(q) ||
                (t.address || "").toLowerCase().includes(q) ||
                (t.contactNumber || "").toLowerCase().includes(q) ||
                (t.patientId?.fullName || "").toLowerCase().includes(q) ||
                (t.hospitalId?.hospitalName || "").toLowerCase().includes(q) ||
                (t.ambulanceId?.ambulanceNumber || "").toLowerCase().includes(q) ||
                String(t._id || "").toLowerCase().includes(q);

            if (!matchesSearch) return false;

            if (activeTab === "completed") {
                return t.journeyStatus === "HANDOVER_COMPLETE" || t.status === "Completed";
            }
            if (activeTab === "active") {
                return !["Completed", "Cancelled", "HOSPITAL_REJECTED"].includes(t.status) && t.journeyStatus !== "HANDOVER_COMPLETE";
            }
            return true;
        });
    }, [trips, search, activeTab]);

    const totalCount = trips.length;
    const completedCount = metrics?.completedTrips ?? trips.filter((t) => t.journeyStatus === "HANDOVER_COMPLETE" || t.status === "Completed").length;
    const activeCount = metrics?.activeTrips ?? trips.filter((t) => !["Completed", "Cancelled", "HOSPITAL_REJECTED"].includes(t.status) && t.journeyStatus !== "HANDOVER_COMPLETE").length;

    return (
        <DashboardLayout
            role="driver"
            title="Work & Trip History"
            subtitle="Review past emergency dispatches, patient transfers, and fleet operational logs"
        >
            {/* KPI METRIC CARDS */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                    gap: 2,
                    mb: 3,
                }}
            >
                {/* 1. TOTAL TRIPS */}
                <Card
                    elevation={0}
                    sx={{
                        p: 2.2,
                        borderRadius: 3,
                        border: `1px solid ${colors.hairline}`,
                        bgcolor: colors.white,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2.5,
                            bgcolor: "#EFF6FF",
                            border: "1px solid #BFDBFE",
                            display: "grid",
                            placeItems: "center",
                            color: "#2563EB",
                        }}
                    >
                        <HistoryOutlined sx={{ fontSize: 24 }} />
                    </Box>
                    <Box>
                        <Typography fontSize={24} fontWeight={850} color={colors.ink} lineHeight={1}>
                            {totalCount}
                        </Typography>
                        <Typography fontSize={12} color={colors.slate} fontWeight={600} mt={0.5}>
                            Total Dispatches
                        </Typography>
                    </Box>
                </Card>

                {/* 2. COMPLETED TRANSFERS */}
                <Card
                    elevation={0}
                    sx={{
                        p: 2.2,
                        borderRadius: 3,
                        border: `1px solid ${colors.hairline}`,
                        bgcolor: colors.white,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2.5,
                            bgcolor: "#F0FDF4",
                            border: "1px solid #BBF7D0",
                            display: "grid",
                            placeItems: "center",
                            color: "#16A34A",
                        }}
                    >
                        <AssignmentTurnedInOutlined sx={{ fontSize: 24 }} />
                    </Box>
                    <Box>
                        <Typography fontSize={24} fontWeight={850} color={colors.ink} lineHeight={1}>
                            {completedCount}
                        </Typography>
                        <Typography fontSize={12} color={colors.slate} fontWeight={600} mt={0.5}>
                            Completed Handovers
                        </Typography>
                    </Box>
                </Card>

                {/* 3. ACTIVE MISSIONS */}
                <Card
                    elevation={0}
                    sx={{
                        p: 2.2,
                        borderRadius: 3,
                        border: `1px solid ${colors.hairline}`,
                        bgcolor: colors.white,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2.5,
                            bgcolor: activeCount > 0 ? "#FFF7ED" : "#F8FAFC",
                            border: `1px solid ${activeCount > 0 ? "#FED7AA" : "#E2E8F0"}`,
                            display: "grid",
                            placeItems: "center",
                            color: activeCount > 0 ? "#EA580C" : colors.slate,
                        }}
                    >
                        <EmergencyOutlined sx={{ fontSize: 24 }} />
                    </Box>
                    <Box>
                        <Typography fontSize={24} fontWeight={850} color={colors.ink} lineHeight={1}>
                            {activeCount}
                        </Typography>
                        <Typography fontSize={12} color={colors.slate} fontWeight={600} mt={0.5}>
                            Active Dispatches
                        </Typography>
                    </Box>
                </Card>

                {/* 4. DUTY STATUS */}
                <Card
                    elevation={0}
                    sx={{
                        p: 2.2,
                        borderRadius: 3,
                        border: `1px solid ${colors.hairline}`,
                        bgcolor: colors.white,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2.5,
                            bgcolor: metrics?.dutyStatus === "ON_DUTY" ? "#F0FDFA" : "#F1F5F9",
                            border: `1px solid ${metrics?.dutyStatus === "ON_DUTY" ? "#99F6E4" : "#E2E8F0"}`,
                            display: "grid",
                            placeItems: "center",
                            color: metrics?.dutyStatus === "ON_DUTY" ? colors.pine : colors.slate,
                        }}
                    >
                        <SpeedOutlined sx={{ fontSize: 24 }} />
                    </Box>
                    <Box>
                        <Typography
                            fontSize={15}
                            fontWeight={850}
                            color={metrics?.dutyStatus === "ON_DUTY" ? "#0F766E" : colors.slate}
                            lineHeight={1.2}
                        >
                            {metrics?.dutyStatus === "ON_DUTY" ? "ON DUTY (Active)" : "OFF DUTY"}
                        </Typography>
                        <Typography fontSize={12} color={colors.slate} fontWeight={600} mt={0.5}>
                            Driver Shift State
                        </Typography>
                    </Box>
                </Card>
            </Box>

            {/* CONTROLS BAR: TABS & SEARCH */}
            <Card
                elevation={0}
                sx={{
                    mb: 3,
                    borderRadius: 3,
                    border: `1px solid ${colors.hairline}`,
                    bgcolor: colors.white,
                    p: 1.5,
                }}
            >
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    alignItems={{ xs: "stretch", md: "center" }}
                    justifyContent="space-between"
                >
                    <Tabs
                        value={activeTab}
                        onChange={(_, val) => setActiveTab(val)}
                        sx={{
                            minHeight: 40,
                            "& .MuiTab-root": {
                                minHeight: 40,
                                py: 0.5,
                                px: 2,
                                fontWeight: 750,
                                fontSize: 13,
                                textTransform: "none",
                                borderRadius: 2,
                            },
                        }}
                    >
                        <Tab label={`All Trips (${totalCount})`} value="all" />
                        <Tab label={`Completed Handover (${completedCount})`} value="completed" />
                        <Tab label={`Active Dispatches (${activeCount})`} value="active" />
                    </Tabs>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <TextField
                            size="small"
                            placeholder="Search by category, patient, hospital, vehicle..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sx={{ minWidth: { xs: "100%", sm: 280 } }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchOutlined fontSize="small" sx={{ color: colors.slate }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={loadHistory}
                            startIcon={<RefreshOutlined />}
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                borderColor: colors.hairline,
                                color: colors.ink,
                                minHeight: 40,
                            }}
                        >
                            Refresh
                        </Button>
                    </Stack>
                </Stack>
            </Card>

            {/* ERROR ALERT */}
            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}

            {/* TRIPS LIST */}
            {loading ? (
                <Box py={8} display="grid" placeItems="center">
                    <CircularProgress size={36} sx={{ color: colors.pine }} />
                    <Typography fontSize={14} color={colors.slate} mt={2}>
                        Loading your trip history...
                    </Typography>
                </Box>
            ) : filteredTrips.length === 0 ? (
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
                    <TimeToLeaveOutlined sx={{ fontSize: 56, color: colors.hairline, mb: 1.5 }} />
                    <Typography fontSize={18} fontWeight={800} color={colors.ink}>
                        No Trip Records Found
                    </Typography>
                    <Typography fontSize={13.5} color={colors.slate} mt={0.5} maxWidth={440} mx="auto">
                        {search
                            ? "No past dispatches match your search query. Try clearing the filter."
                            : "Your completed emergency trips and patient handover logs will appear here once dispatches occur."}
                    </Typography>
                    {search && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setSearch("")}
                            sx={{ mt: 2, textTransform: "none", fontWeight: 700 }}
                        >
                            Clear Search
                        </Button>
                    )}
                </Card>
            ) : (
                <Stack spacing={2}>
                    {filteredTrips.map((trip) => {
                        const badge = getJourneyBadge(trip.journeyStatus, trip.status);
                        const isLive = !["Completed", "Cancelled", "HOSPITAL_REJECTED"].includes(trip.status) && trip.journeyStatus !== "HANDOVER_COMPLETE";

                        return (
                            <Card
                                key={trip._id}
                                elevation={0}
                                sx={{
                                    borderRadius: 3.5,
                                    border: `1px solid ${isLive ? "#FDBA74" : colors.hairline}`,
                                    bgcolor: colors.white,
                                    transition: "all 0.2s ease",
                                    borderLeft: `5px solid ${badge.color}`,
                                    "&:hover": {
                                        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                                        borderColor: isLive ? "#FB923C" : "#CBD5E1",
                                    },
                                }}
                            >
                                <CardContent sx={{ p: { xs: 2.5, sm: 3 }, "&:last-child": { pb: { xs: 2.5, sm: 3 } } }}>
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        spacing={2}
                                        justifyContent="space-between"
                                        alignItems={{ xs: "flex-start", sm: "center" }}
                                        mb={2}
                                    >
                                        <Box>
                                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" mb={0.5}>
                                                <Chip
                                                    label={badge.label}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: badge.bg,
                                                        color: badge.color,
                                                        border: `1px solid ${badge.border}`,
                                                        fontWeight: 800,
                                                        fontSize: 11,
                                                        height: 24,
                                                    }}
                                                />
                                                <Chip
                                                    label={trip.emergencyCategory || "Emergency Case"}
                                                    size="small"
                                                    icon={<EmergencyOutlined sx={{ fontSize: "14px !important", color: "#DC2626 !important" }} />}
                                                    sx={{
                                                        bgcolor: "#FEF2F2",
                                                        color: "#B91C1C",
                                                        border: "1px solid #FECACA",
                                                        fontWeight: 750,
                                                        fontSize: 11,
                                                        height: 24,
                                                    }}
                                                />
                                                <Typography fontSize={12} color={colors.slate} fontWeight={600}>
                                                    ID: #{String(trip._id).slice(-6).toUpperCase()}
                                                </Typography>
                                            </Stack>
                                            <Typography fontSize={13} color={colors.slate} display="flex" alignItems="center" gap={0.6}>
                                                <CalendarTodayOutlined sx={{ fontSize: 13 }} />
                                                Dispatched: {formatTripDate(trip.createdAt)}
                                            </Typography>
                                        </Box>

                                        <Stack direction="row" spacing={1}>
                                            {isLive && (
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    onClick={() => navigate("/driver/current-trip")}
                                                    endIcon={<ArrowForwardRounded />}
                                                    sx={{
                                                        bgcolor: "#EA580C",
                                                        "&:hover": { bgcolor: "#C2410C" },
                                                        textTransform: "none",
                                                        fontWeight: 750,
                                                        fontSize: 12.5,
                                                        borderRadius: 2,
                                                    }}
                                                >
                                                    Active Trip Radar
                                                </Button>
                                            )}
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => setSelectedTrip(trip)}
                                                startIcon={<InfoOutlined />}
                                                sx={{
                                                    borderColor: colors.hairline,
                                                    color: colors.ink,
                                                    textTransform: "none",
                                                    fontWeight: 700,
                                                    fontSize: 12.5,
                                                    borderRadius: 2,
                                                }}
                                            >
                                                Trip Log
                                            </Button>
                                        </Stack>
                                    </Stack>

                                    <Divider sx={{ my: 1.5, borderColor: colors.hairline }} />

                                    {/* TRIP DETAILS GRID */}
                                    <Grid container spacing={2}>
                                        {/* PATIENT INFO */}
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Typography fontSize={11} fontWeight={800} color={colors.slate} letterSpacing={0.5} mb={0.4}>
                                                PATIENT / CALLER
                                            </Typography>
                                            <Typography fontSize={14} fontWeight={800} color={colors.ink}>
                                                {trip.patientId?.fullName || "Emergency Caller"}
                                            </Typography>
                                            {trip.contactNumber && (
                                                <Typography
                                                    component="a"
                                                    href={`tel:${trip.contactNumber}`}
                                                    fontSize={12.5}
                                                    color="#2563EB"
                                                    fontWeight={700}
                                                    sx={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 0.5, mt: 0.3 }}
                                                >
                                                    <PhoneOutlined sx={{ fontSize: 13 }} />
                                                    {trip.contactNumber}
                                                </Typography>
                                            )}
                                        </Grid>

                                        {/* PICKUP ADDRESS */}
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Typography fontSize={11} fontWeight={800} color={colors.slate} letterSpacing={0.5} mb={0.4}>
                                                PICKUP LOCATION
                                            </Typography>
                                            <Typography fontSize={13} color={colors.ink} fontWeight={650} display="flex" alignItems="flex-start" gap={0.5}>
                                                <LocationOnOutlined sx={{ fontSize: 16, color: "#DC2626", mt: "1px", flexShrink: 0 }} />
                                                {trip.address || (trip.latitude && trip.longitude ? `GPS: ${trip.latitude.toFixed(4)}, ${trip.longitude.toFixed(4)}` : "Live GPS Pin")}
                                            </Typography>
                                        </Grid>

                                        {/* HOSPITAL */}
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Typography fontSize={11} fontWeight={800} color={colors.slate} letterSpacing={0.5} mb={0.4}>
                                                RECEIVING HOSPITAL
                                            </Typography>
                                            <Typography fontSize={13.5} fontWeight={750} color={colors.ink} display="flex" alignItems="center" gap={0.5}>
                                                <LocalHospitalOutlined sx={{ fontSize: 15, color: colors.pine }} />
                                                {trip.hospitalId?.hospitalName || "Designated Hospital"}
                                            </Typography>
                                            <Typography fontSize={12} color={colors.slate}>
                                                {trip.hospitalId?.city || "Emergency Center"}
                                            </Typography>
                                        </Grid>

                                        {/* AMBULANCE */}
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Typography fontSize={11} fontWeight={800} color={colors.slate} letterSpacing={0.5} mb={0.4}>
                                                AMBULANCE UNIT
                                            </Typography>
                                            <Typography fontSize={13.5} fontWeight={750} color={colors.ink} display="flex" alignItems="center" gap={0.5}>
                                                <TimeToLeaveOutlined sx={{ fontSize: 15, color: "#2563EB" }} />
                                                {trip.ambulanceId?.ambulanceNumber || "Assigned Ambulance"}
                                            </Typography>
                                            <Typography fontSize={12} color={colors.slate}>
                                                {trip.ambulanceId?.vehicleType || "Advanced Life Support"}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Stack>
            )}

            {/* TRIP LOG DETAILS DIALOG */}
            <Dialog
                open={Boolean(selectedTrip)}
                onClose={() => setSelectedTrip(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
            >
                {selectedTrip && (
                    <>
                        <DialogTitle sx={{ pb: 1 }}>
                            <Typography fontSize={18} fontWeight={850} color={colors.ink}>
                                Emergency Trip Audit Log
                            </Typography>
                            <Typography fontSize={12.5} color={colors.slate}>
                                ID: #{String(selectedTrip._id).slice(-6).toUpperCase()} • {selectedTrip.emergencyCategory}
                            </Typography>
                        </DialogTitle>

                        <DialogContent dividers sx={{ borderColor: colors.hairline }}>
                            <Stack spacing={2.5}>
                                <Box>
                                    <Typography fontSize={12} fontWeight={800} color={colors.slate} letterSpacing={0.5} mb={0.6}>
                                        PATIENT CLINICAL TRIAGE
                                    </Typography>
                                    <Typography fontSize={13.5} color={colors.ink}>
                                        Consciousness: <strong>{selectedTrip.isConscious ? "Conscious" : "Unconscious / Unresponsive"}</strong>
                                    </Typography>
                                    <Typography fontSize={13.5} color={colors.ink}>
                                        Breathing: <strong>{selectedTrip.breathingStatus || "Normal"}</strong>
                                    </Typography>
                                    {selectedTrip.description && (
                                        <Typography fontSize={13} color={colors.slate} mt={0.5} sx={{ fontStyle: "italic" }}>
                                            "{selectedTrip.description}"
                                        </Typography>
                                    )}
                                </Box>

                                <Box>
                                    <Typography fontSize={12} fontWeight={800} color={colors.slate} letterSpacing={0.5} mb={1}>
                                        JOURNEY TRANSITION TIMELINE
                                    </Typography>
                                    {(selectedTrip.statusHistory || []).length === 0 ? (
                                        <Typography fontSize={13} color={colors.slate}>
                                            Standard hospital dispatch recorded.
                                        </Typography>
                                    ) : (
                                        <Stack spacing={1.2}>
                                            {selectedTrip.statusHistory.map((h, i) => (
                                                <Box
                                                    key={i}
                                                    sx={{
                                                        p: 1.2,
                                                        borderRadius: 2,
                                                        bgcolor: "#F8FAFC",
                                                        border: "1px solid #E2E8F0",
                                                    }}
                                                >
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Typography fontSize={12.5} fontWeight={800} color={colors.ink}>
                                                            {h.status?.replace(/_/g, " ")}
                                                        </Typography>
                                                        <Typography fontSize={11} color={colors.slate}>
                                                            {formatTripDate(h.changedAt)}
                                                        </Typography>
                                                    </Stack>
                                                    {h.note && (
                                                        <Typography fontSize={12} color={colors.slate} mt={0.3}>
                                                            {h.note}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            ))}
                                        </Stack>
                                    )}
                                </Box>
                            </Stack>
                        </DialogContent>

                        <DialogActions sx={{ p: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={() => setSelectedTrip(null)}
                                sx={{ textTransform: "none", fontWeight: 700 }}
                            >
                                Close
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </DashboardLayout>
    );
}
