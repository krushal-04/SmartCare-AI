import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Container,
    Typography,
    TextField,
    InputAdornment,
    Card,
    CardContent,
    CardMedia,
    Button,
    Grid,
    Chip,
    CircularProgress,
    Alert,
    Stack,
    Paper,
} from "@mui/material";
import {
    Search,
    LocationOnOutlined,
    EmergencyOutlined,
    CalendarMonth,
    MyLocation,
    LocalHospital,
} from "@mui/icons-material";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import MedicalMap from "../components/MedicalMap";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// Haversine distance calculator
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export default function Hospitals() {
    const navigate = useNavigate();
    const { isAuthenticated, role, user } = useAuth();

    const [hospitals, setHospitals] = useState([]);
    const [search, setSearch] = useState("");
    const [filterEmergency, setFilterEmergency] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [geoLoading, setGeoLoading] = useState(false);
    const [geoError, setGeoError] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedHospitalId, setSelectedHospitalId] = useState(null);

    useEffect(() => {
        const fetchHospitals = async () => {
            try {
                const response = await api.get("/hospitals/all");
                setHospitals(response.data.hospitals || []);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load hospital network");
            } finally {
                setLoading(false);
            }
        };
        fetchHospitals();
    }, []);

    // Locate Patient via GPS
    const handleLocateUser = () => {
        if (!navigator.geolocation) {
            setGeoError("Geolocation is not supported by your browser.");
            return;
        }

        setGeoLoading(true);
        setGeoError("");

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                });
                setGeoLoading(false);
            },
            (err) => {
                setGeoLoading(false);
                if (err.code === 1) {
                    setGeoError("Location permission denied. Please enable location to find hospitals near you.");
                } else {
                    setGeoError("Unable to acquire GPS location. Please check device settings.");
                }
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Enrich and sort hospitals by proximity if GPS is available
    const enrichedHospitals = useMemo(() => {
        return hospitals.map((hosp) => {
            let distanceKm = null;
            if (userLocation && hosp.latitude != null && hosp.longitude != null) {
                distanceKm = calculateDistanceKm(
                    userLocation.latitude,
                    userLocation.longitude,
                    Number(hosp.latitude),
                    Number(hosp.longitude)
                );
            }
            return {
                ...hosp,
                distanceKm,
            };
        });
    }, [hospitals, userLocation]);

    // Filter by search query and emergency filter
    const filteredHospitals = useMemo(() => {
        let list = enrichedHospitals.filter((h) => {
            const query = `${h.hospitalName || ""} ${h.city || ""} ${h.state || ""} ${h.address || ""}`.toLowerCase();
            const matchesSearch = query.includes(search.toLowerCase());
            const matchesEmergency = filterEmergency ? h.emergencyAvailable : true;
            return matchesSearch && matchesEmergency;
        });

        if (userLocation) {
            list.sort((a, b) => {
                if (a.distanceKm == null) return 1;
                if (b.distanceKm == null) return -1;
                return a.distanceKm - b.distanceKm;
            });
        }

        return list;
    }, [enrichedHospitals, search, filterEmergency, userLocation]);

    const renderContent = () => (
        <Box>
            {/* SEARCH & GPS CONTROL BAR */}
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, sm: 2.5 },
                    mb: 3.5,
                    borderRadius: 3.5,
                    border: "1px solid #E2E8F0",
                    bgcolor: "#FFFFFF",
                    boxShadow: "0 4px 16px -2px rgba(15,23,42,0.04)",
                }}
            >
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5}>
                        <TextField
                            fullWidth
                            size="small"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by hospital name, city, state, or address..."
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search sx={{ color: "#0D9488" }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={12} md={7}>
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: "flex-start", md: "flex-end" }} flexWrap="wrap" gap={1}>
                            <Button
                                variant={userLocation ? "contained" : "outlined"}
                                color={userLocation ? "success" : "primary"}
                                size="small"
                                onClick={handleLocateUser}
                                disabled={geoLoading}
                                startIcon={geoLoading ? <CircularProgress size={16} /> : <MyLocation />}
                                sx={{
                                    borderRadius: 2,
                                    py: 0.9,
                                    fontWeight: 700,
                                    flexShrink: 0,
                                }}
                            >
                                {geoLoading
                                    ? "Detecting..."
                                    : userLocation
                                    ? "GPS Active (Sorted by Distance)"
                                    : "Hospitals Near Me"}
                            </Button>

                            <Chip
                                label="Emergency Only"
                                clickable
                                color={filterEmergency ? "error" : "default"}
                                variant={filterEmergency ? "filled" : "outlined"}
                                onClick={() => setFilterEmergency((prev) => !prev)}
                                sx={{ fontWeight: 700, borderRadius: 2 }}
                            />
                        </Stack>
                    </Grid>
                </Grid>

                {geoError && (
                    <Alert severity="warning" onClose={() => setGeoError("")} sx={{ mt: 2, borderRadius: 2 }}>
                        {geoError}
                    </Alert>
                )}

                {userLocation && (
                    <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                        GPS position active: <strong>{userLocation.latitude.toFixed(4)}° N, {userLocation.longitude.toFixed(4)}° E</strong>. Showing closest hospitals first.
                    </Alert>
                )}
            </Paper>

            {loading && (
                <Box textAlign="center" py={8}>
                    <CircularProgress sx={{ color: "#0D9488" }} />
                    <Typography mt={2} color="text.secondary">Loading SmartCare Hospitals...</Typography>
                </Box>
            )}

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {!loading && !error && (
                <Grid container spacing={3.5}>
                    {/* LEFT / TOP: INTERACTIVE MAP */}
                    <Grid item xs={12} lg={6}>
                        <Box sx={{ position: "sticky", top: 88 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                                <Typography fontSize={17} fontWeight={800} color="#0F172A">
                                    Interactive Hospital Locator
                                </Typography>
                                <Typography fontSize={12} color="#0D9488" fontWeight={700}>
                                    Live OpenStreetMap & Carto Engine
                                </Typography>
                            </Box>

                            <MedicalMap
                                hospitals={filteredHospitals}
                                patientLocation={userLocation}
                                onLocateMe={(coords) => setUserLocation(coords)}
                                selectedHospitalId={selectedHospitalId}
                                height={520}
                            />
                        </Box>
                    </Grid>

                    {/* RIGHT: HOSPITAL CARDS */}
                    <Grid item xs={12} lg={6}>
                        <Stack spacing={2.5}>
                            {filteredHospitals.length === 0 ? (
                                <Paper elevation={0} sx={{ p: 6, textAlign: "center", borderRadius: 3, border: "1px dashed #CBD5E1" }}>
                                    <LocalHospital sx={{ fontSize: 48, color: "#94A3B8", mb: 1 }} />
                                    <Typography fontWeight={700} fontSize={16} color="text.secondary">
                                        No hospitals match your search criteria.
                                    </Typography>
                                    <Button
                                        variant="text"
                                        onClick={() => {
                                            setSearch("");
                                            setFilterEmergency(false);
                                        }}
                                        sx={{ mt: 1, color: "#0D9488" }}
                                    >
                                        Clear search filters
                                    </Button>
                                </Paper>
                            ) : (
                                filteredHospitals.map((hospital) => {
                                    const hasImages = Array.isArray(hospital.hospitalImages) && hospital.hospitalImages.length > 0;
                                    const bannerImg = hasImages ? hospital.hospitalImages[0] : null;

                                    const defaultHospitalImg = "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=600&q=80";
                                    const displayImg = bannerImg || defaultHospitalImg;

                                    return (
                                        <Card
                                            key={hospital._id}
                                            elevation={0}
                                            onClick={() => setSelectedHospitalId(hospital._id)}
                                            sx={{
                                                borderRadius: 3.5,
                                                border: selectedHospitalId === hospital._id ? "2px solid #0D9488" : "1px solid #E2E8F0",
                                                overflow: "hidden",
                                                display: "flex",
                                                flexDirection: { xs: "column", sm: "row" },
                                                cursor: "pointer",
                                                transition: "all 0.2s ease-in-out",
                                                "&:hover": {
                                                    boxShadow: "0 10px 24px -4px rgba(13,148,136,0.12)",
                                                    transform: "translateY(-2px)",
                                                },
                                            }}
                                        >
                                            {/* Hospital Image / Banner */}
                                            <CardMedia
                                                component="img"
                                                image={displayImg}
                                                alt={hospital.hospitalName}
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null;
                                                    e.currentTarget.src = "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80";
                                                }}
                                                sx={{
                                                    width: { xs: "100%", sm: 190 },
                                                    height: { xs: 160, sm: "auto" },
                                                    objectFit: "cover",
                                                    bgcolor: "#F1F5F9",
                                                }}
                                            />

                                            <CardContent sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column" }}>
                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                                                    <Box>
                                                        <Typography fontSize={18} fontWeight={800} color="#0F172A">
                                                            {hospital.hospitalName}
                                                        </Typography>
                                                        <Stack direction="row" spacing={0.5} alignItems="center" mt={0.5}>
                                                            <LocationOnOutlined sx={{ fontSize: 16, color: "#64748B" }} />
                                                            <Typography fontSize={13} color="text.secondary">
                                                                {hospital.city}, {hospital.state}
                                                            </Typography>
                                                        </Stack>
                                                    </Box>

                                                    {hospital.distanceKm != null && (
                                                        <Chip
                                                            label={`${hospital.distanceKm.toFixed(1)} km away`}
                                                            size="small"
                                                            color="primary"
                                                            sx={{ fontWeight: 800, fontSize: 11.5 }}
                                                        />
                                                    )}
                                                </Box>

                                                {hospital.address && (
                                                    <Typography fontSize={12.5} color="text.secondary" mt={1} noWrap>
                                                        {hospital.address}
                                                    </Typography>
                                                )}

                                                <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap" gap={0.5}>
                                                    {hospital.emergencyAvailable && (
                                                        <Chip
                                                            size="small"
                                                            icon={<EmergencyOutlined sx={{ fontSize: 13 }} />}
                                                            label="24x7 Emergency"
                                                            sx={{ bgcolor: "#FEE2E2", color: "#DC2626", fontWeight: 700 }}
                                                        />
                                                    )}
                                                </Stack>

                                                <Box sx={{ mt: 2.5, pt: 1.5, borderTop: "1px solid #F1F5F9" }}>
                                                    <Button
                                                        fullWidth
                                                        variant="contained"
                                                        size="small"
                                                        startIcon={<CalendarMonth />}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/book-appointment?hospitalId=${hospital._id}`);
                                                        }}
                                                        sx={{ fontWeight: 700, borderRadius: 2, py: 1 }}
                                                    >
                                                        Book Visit
                                                    </Button>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            )}
                        </Stack>
                    </Grid>
                </Grid>
            )}
        </Box>
    );

    if (isAuthenticated) {
        return (
            <DashboardLayout
                role={role || user?.role || "patient"}
                title="Hospitals Network & GPS Radar"
                subtitle="Explore accredited medical facilities, check live coordinates, and calculate distances"
            >
                {renderContent()}
            </DashboardLayout>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#F8FAFC", display: "flex", flexDirection: "column" }}>
            <Navbar />

            {/* HERO HEADER */}
            <Box
                sx={{
                    py: { xs: 5, md: 7 },
                    background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
                    color: "#FFFFFF",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1 }}>
                    <Stack spacing={1.5} maxWidth={720}>
                        <Chip
                            label="SmartCare Geospatial Network"
                            size="small"
                            sx={{
                                bgcolor: "rgba(13,148,136,0.2)",
                                color: "#5EEAD4",
                                border: "1px solid rgba(13,148,136,0.4)",
                                fontWeight: 800,
                                width: "fit-content",
                            }}
                        />
                        <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: "-0.03em" }}>
                            Find Certified Hospitals & Emergency Centers
                        </Typography>
                        <Typography fontSize={16} sx={{ color: "#94A3B8", lineHeight: 1.6 }}>
                            Locate nearby medical centers in real-time, view ambulance accessibility, inspect doctor availability, and book your visit instantly.
                        </Typography>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="xl" sx={{ py: 4, flex: 1 }}>
                {renderContent()}
            </Container>

            <Footer />
        </Box>
    );
}