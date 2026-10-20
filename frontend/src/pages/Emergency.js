import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Container,
    Typography,
    Button,
    Card,
    CardContent,
    Stack,
    TextField,
    Alert,
    Grid,
    Paper,
    Chip,
    CircularProgress,
    InputAdornment,
} from "@mui/material";
import {
    EmergencyOutlined,
    ArrowBack,
    Phone,
    MyLocation,
    LocalHospital,
} from "@mui/icons-material";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MedicalMap from "../components/MedicalMap";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Emergency() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [description, setDescription] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [location, setLocation] = useState(null);
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [geoLoading, setGeoLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const isPhoneValid = phone.length === 10 && /^[6-9]\d{9}$/.test(phone);

    useEffect(() => {
        // Fetch active emergency hospitals for the map
        const fetchHospitals = async () => {
            try {
                const res = await api.get("/hospitals/all?emergencyAvailable=true");
                setHospitals(res.data.hospitals || []);
            } catch (e) {
                // Ignore background fetch error
            }
        };
        fetchHospitals();

        // Auto-detect geolocation
        if (navigator.geolocation) {
            setGeoLoading(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocation({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                    });
                    setGeoLoading(false);
                },
                () => {
                    setGeoLoading(false);
                },
                { enableHighAccuracy: true, timeout: 8000 }
            );
        }
    }, []);

    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            return;
        }

        setGeoLoading(true);
        setError("");

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                });
                setGeoLoading(false);
            },
            (err) => {
                setGeoLoading(false);
                setError("Unable to get current GPS location. Please check browser permissions.");
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleEmergencySubmit = async () => {
        if (!description.trim()) {
            setError("Please provide a description of the emergency.");
            return;
        }

        let cleanPhone = phone.trim().replace(/\D/g, "");
        if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) cleanPhone = cleanPhone.slice(2);
        else if (cleanPhone.length === 11 && cleanPhone.startsWith("0")) cleanPhone = cleanPhone.slice(1);

        if (cleanPhone.length !== 10) {
            setError("Please enter a valid 10-digit mobile number so the ambulance team can reach you.");
            return;
        }

        if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
            setError("Mobile number must be a valid 10-digit number starting with 6, 7, 8, or 9.");
            return;
        }

        if (!isAuthenticated) {
            // If guest, prompt to login with state or call emergency hotline
            navigate("/login", {
                state: {
                    from: "/patient/emergency",
                    emergencyData: { description: description.trim(), phone: cleanPhone, address: address.trim(), location },
                },
            });
            return;
        }

        try {
            setLoading(true);
            setError("");
            const payload = {
                description: description.trim(),
                contactNumber: cleanPhone,
                address: address.trim(),
            };
            if (location) {
                payload.latitude = location.latitude;
                payload.longitude = location.longitude;
            }

            await api.post("/emergency/request", payload);
            setSuccessMessage("Ambulance dispatched! The nearest hospital has been alerted and response team is en route.");
            setDescription("");
            setPhone("");
            setAddress("");
            setTimeout(() => {
                navigate("/patient/emergency");
            }, 2500);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to dispatch ambulance. Please dial 108 / 911 immediately.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#F8FAFC", display: "flex", flexDirection: "column" }}>
            <Navbar />

            <Box
                sx={{
                    background: "linear-gradient(135deg, #7F1D1D 0%, #991B1B 50%, #B91C1C 100%)",
                    color: "#FFFFFF",
                    py: { xs: 4, md: 5.5 },
                }}
            >
                <Container maxWidth="lg">
                    <Stack spacing={1}>
                        <Chip
                            icon={<EmergencyOutlined sx={{ color: "#FFFFFF !important" }} />}
                            label="24x7 Critical Medical Assistance"
                            sx={{
                                bgcolor: "rgba(255,255,255,0.2)",
                                color: "#FFFFFF",
                                fontWeight: 800,
                                width: "fit-content",
                            }}
                        />
                        <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: "-0.02em" }}>
                            Emergency Ambulance & Hospital Dispatch
                        </Typography>
                        <Typography fontSize={16} sx={{ color: "#FECACA", maxWidth: 700 }}>
                            Real-time GPS routing to the nearest trauma-ready hospital center. Immediate priority response.
                        </Typography>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate("/")}
                    sx={{ mb: 3, color: "#64748B", fontWeight: 700 }}
                >
                    Back to Home
                </Button>

                {/* EMERGENCY HOTLINE QUICK CALL BAR */}
                <Grid container spacing={2} sx={{ mb: 3.5 }}>
                    <Grid item xs={12} sm={4}>
                        <Paper
                            elevation={0}
                            component="a"
                            href="tel:108"
                            sx={{
                                p: 2,
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                borderRadius: 3,
                                bgcolor: "#FEF2F2",
                                border: "1.5px solid #FCA5A5",
                                textDecoration: "none",
                                color: "#991B1B",
                                transition: "transform 0.2s",
                                "&:hover": { transform: "translateY(-2px)" },
                            }}
                        >
                            <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "#EF4444", color: "#FFFFFF" }}>
                                <Phone />
                            </Box>
                            <Box>
                                <Typography fontSize={11} fontWeight={800} textTransform="uppercase" letterSpacing={0.5}>
                                    National Ambulance
                                </Typography>
                                <Typography fontSize={20} fontWeight={900}>
                                    Dial 108 / 112
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <Paper
                            elevation={0}
                            component="a"
                            href="tel:+919999988888"
                            sx={{
                                p: 2,
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                borderRadius: 3,
                                bgcolor: "#F0FDFA",
                                border: "1.5px solid #99F6E4",
                                textDecoration: "none",
                                color: "#0F766E",
                                transition: "transform 0.2s",
                                "&:hover": { transform: "translateY(-2px)" },
                            }}
                        >
                            <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "#0D9488", color: "#FFFFFF" }}>
                                <LocalHospital />
                            </Box>
                            <Box>
                                <Typography fontSize={11} fontWeight={800} textTransform="uppercase" letterSpacing={0.5}>
                                    SmartCare 24x7 Helpline
                                </Typography>
                                <Typography fontSize={18} fontWeight={900}>
                                    +91 99999 88888
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <Paper
                            elevation={0}
                            component="a"
                            href="mailto:smartcareai.admin@gmail.com"
                            sx={{
                                p: 2,
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                borderRadius: 3,
                                bgcolor: "#F0F9FF",
                                border: "1.5px solid #BAE6FD",
                                textDecoration: "none",
                                color: "#0369A1",
                                transition: "transform 0.2s",
                                "&:hover": { transform: "translateY(-2px)" },
                            }}
                        >
                            <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "#0284C7", color: "#FFFFFF" }}>
                                <EmergencyOutlined />
                            </Box>
                            <Box>
                                <Typography fontSize={11} fontWeight={800} textTransform="uppercase" letterSpacing={0.5}>
                                    Emergency Admin Desk
                                </Typography>
                                <Typography fontSize={13} fontWeight={700} noWrap>
                                    smartcareai.admin@gmail.com
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>

                <Grid container spacing={3.5}>
                    {/* DISPATCH FORM */}
                    <Grid item xs={12} md={6}>
                        <Card elevation={0} sx={{ borderRadius: 3.5, border: "1.5px solid #FECACA", overflow: "hidden" }}>
                            <Box sx={{ p: 3, bgcolor: "#FEF2F2", borderBottom: "1px solid #FECACA" }}>
                                <Typography variant="h5" fontWeight={900} color="#991B1B">
                                    Request Ambulance
                                </Typography>
                                <Typography fontSize={13} color="#B91C1C">
                                    Fill details below to deploy the nearest emergency vehicle
                                </Typography>
                            </Box>

                            <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                                {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}
                                {successMessage && <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>{successMessage}</Alert>}

                                <Stack spacing={2.5}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        minRows={3}
                                        label="Describe the emergency"
                                        placeholder="Accident, breathing problem, unconscious patient, severe pain..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                    />

                                    <TextField
                                        fullWidth
                                        label="Contact Phone Number (10 Digits)"
                                        placeholder="Enter 10-digit mobile number"
                                        value={phone}
                                        onChange={(e) => {
                                            const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                                            setPhone(digitsOnly);
                                            if (error) setError("");
                                        }}
                                        required
                                        inputProps={{
                                            maxLength: 10,
                                            inputMode: "numeric",
                                            pattern: "[0-9]*",
                                        }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Phone sx={{ color: "#64748B", fontSize: 20 }} />
                                                    <Typography variant="body2" sx={{ ml: 0.5, mr: 0.5, fontWeight: 700, color: "#64748B" }}>
                                                        +91
                                                    </Typography>
                                                </InputAdornment>
                                            ),
                                        }}
                                        error={Boolean(phone && (!isPhoneValid || phone.length !== 10))}
                                        helperText={
                                            !phone
                                                ? "10-digit Indian mobile number for ambulance driver to call"
                                                : phone.length < 10
                                                ? `${phone.length}/10 digits entered (${10 - phone.length} more needed)`
                                                : !/^[6-9]/.test(phone)
                                                ? "Mobile number must start with 6, 7, 8, or 9"
                                                : "Valid 10-digit mobile number"
                                        }
                                        FormHelperTextProps={{
                                            sx: {
                                                fontWeight: 600,
                                                color: isPhoneValid ? "#059669" : undefined,
                                            },
                                        }}
                                    />

                                    <TextField
                                        fullWidth
                                        label="Pickup Address / Landmark"
                                        placeholder="Street name, landmark, building number"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                    />

                                    {/* GPS STATUS CARD */}
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2.5,
                                            bgcolor: location ? "rgba(16,185,129,0.08)" : "#F8FAFC",
                                            border: `1px solid ${location ? "#10B981" : "#E2E8F0"}`,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 1.5,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <Box>
                                            <Typography fontSize={13.5} fontWeight={800} color="#0F172A">
                                                {location
                                                    ? `GPS: ${location.latitude.toFixed(4)}° N, ${location.longitude.toFixed(4)}° E`
                                                    : "GPS Position (Auto-detecting...)"}
                                            </Typography>
                                            <Typography fontSize={12} color="text.secondary">
                                                {location
                                                    ? "High-precision GPS coordinates verified."
                                                    : "Enable GPS so ambulance navigates directly to your spot."}
                                            </Typography>
                                        </Box>

                                        <Button
                                            size="small"
                                            variant={location ? "outlined" : "contained"}
                                            onClick={handleLocateMe}
                                            disabled={geoLoading}
                                            startIcon={geoLoading ? <CircularProgress size={14} /> : <MyLocation />}
                                            sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none" }}
                                        >
                                            {geoLoading ? "Detecting..." : location ? "Update GPS" : "Locate Me"}
                                        </Button>
                                    </Paper>

                                    <Button
                                        fullWidth
                                        variant="contained"
                                        color="error"
                                        size="large"
                                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <EmergencyOutlined />}
                                        onClick={handleEmergencySubmit}
                                        disabled={loading || !description.trim() || !isPhoneValid}
                                        sx={{
                                            py: 1.6,
                                            borderRadius: 2.5,
                                            fontWeight: 800,
                                            fontSize: "1.05rem",
                                            bgcolor: "#DC2626",
                                            "&:hover": { bgcolor: "#B91C1C" },
                                        }}
                                    >
                                        {isAuthenticated ? "Deploy Ambulance Now" : "Continue to Dispatch"}
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* LIVE RADAR MAP */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ position: "sticky", top: 88 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                                <Typography fontSize={17} fontWeight={800} color="#0F172A">
                                    Live Ambulance & Hospital Locator
                                </Typography>
                                <Typography fontSize={12} color="#DC2626" fontWeight={700}>
                                    Tap map to adjust pickup pin
                                </Typography>
                            </Box>

                            <MedicalMap
                                hospitals={hospitals}
                                patientLocation={location}
                                selectable={true}
                                onLocationSelect={(coords) => setLocation(coords)}
                                onLocateMe={(coords) => setLocation(coords)}
                                height={460}
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Container>

            <Footer />
        </Box>
    );
}