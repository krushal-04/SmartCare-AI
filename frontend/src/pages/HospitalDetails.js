import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Divider,
    Grid,
    Stack,
    Typography,
} from "@mui/material";
import {
    ArrowBack,
    CalendarMonth,
    EmergencyOutlined,
    LocalHospital,
    LocationOnOutlined,
    MedicalServicesOutlined,
} from "@mui/icons-material";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import MedicalMap from "../components/MedicalMap";
import api from "../services/api";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

function HospitalDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { role, isAuthenticated } = useAuth();

    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchHospital = async () => {
            try {
                const response = await api.get(`/hospitals/${id}`);
                setHospital(response.data.hospital);
            } catch (err) {
                setError("Unable to load hospital details.");
            } finally {
                setLoading(false);
            }
        };

        fetchHospital();
    }, [id]);

    const handleBookAppointment = () => {
        const targetBookingUrl = `/book-appointment?hospitalId=${hospital._id}`;

        if (!isAuthenticated) {
            navigate("/login", {
                state: {
                    from: targetBookingUrl,
                },
            });
            return;
        }

        if (role === "patient") {
            navigate(targetBookingUrl);
        } else {
            navigate("/patient");
        }
    };

    if (loading) {
        return (
            <Box sx={{ minHeight: "100vh", bgcolor: colors.canvas }}>
                <Navbar />
                <Box minHeight="65vh" display="grid" placeItems="center">
                    <CircularProgress sx={{ color: colors.pine }} />
                </Box>
                <Footer />
            </Box>
        );
    }

    if (error || !hospital) {
        return (
            <Box sx={{ minHeight: "100vh", bgcolor: colors.canvas }}>
                <Navbar />
                <Container sx={{ py: 8 }}>
                    <Alert severity="error">{error || "Hospital not found."}</Alert>
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={() => navigate("/hospitals")}
                        sx={{ mt: 3, color: colors.pine }}
                    >
                        Back to hospitals
                    </Button>
                </Container>
                <Footer />
            </Box>
        );
    }

    const isPatient = isAuthenticated && role === "patient";

    const mainContent = (
        <Container maxWidth="lg" sx={{ py: isAuthenticated ? 2 : 5, flex: 1 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate("/hospitals")}
                    sx={{ mb: 3, color: colors.slate, fontWeight: 700 }}
                >
                    Back to hospitals
                </Button>

                <Card
                    elevation={0}
                    sx={{
                        borderRadius: 4,
                        overflow: "hidden",
                        border: `1px solid ${colors.hairline}`,
                        bgcolor: colors.white,
                        boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
                    }}
                >
                    {/* HERO BANNER */}
                    <Box
                        sx={{
                            minHeight: { xs: 200, md: 280 },
                            bgcolor: colors.ink,
                            color: colors.white,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            p: 4,
                        }}
                    >
                        <Box sx={{ textAlign: "center" }}>
                            <Box
                                sx={{
                                    width: 76,
                                    height: 76,
                                    borderRadius: 3.5,
                                    bgcolor: "rgba(255,255,255,0.1)",
                                    display: "grid",
                                    placeItems: "center",
                                    mx: "auto",
                                    mb: 2,
                                    color: colors.amber,
                                }}
                            >
                                <LocalHospital sx={{ fontSize: 44 }} />
                            </Box>
                            <Typography
                                variant="h3"
                                sx={{
                                    fontFamily: "'Newsreader', serif",
                                    fontWeight: 700,
                                    fontSize: { xs: 28, md: 42 },
                                    color: colors.white,
                                }}
                            >
                                {hospital.hospitalName}
                            </Typography>
                        </Box>
                    </Box>

                    <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                        <Stack
                            direction={{ xs: "column", md: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", md: "center" }}
                            spacing={2}
                        >
                            <Box>
                                <Stack direction="row" spacing={0.8} alignItems="center" mt={0.5}>
                                    <LocationOnOutlined sx={{ color: colors.pine, fontSize: 20 }} />
                                    <Typography color={colors.slate} fontSize={15}>
                                        {hospital.address ? `${hospital.address}, ` : ""}
                                        {hospital.city}, {hospital.state} - {hospital.pincode}
                                    </Typography>
                                </Stack>
                            </Box>

                            {hospital.emergencyAvailable && (
                                <Chip
                                    icon={<EmergencyOutlined sx={{ color: `${colors.brick} !important` }} />}
                                    label="24/7 Emergency Ready"
                                    sx={{
                                        bgcolor: colors.brickSoft,
                                        color: colors.brickDeep,
                                        fontWeight: 800,
                                        px: 1,
                                    }}
                                />
                            )}
                        </Stack>

                        <Divider sx={{ my: 4, borderColor: colors.hairline }} />

                        {/* ABOUT */}
                        <Typography variant="h6" fontWeight={800} color={colors.ink}>
                            About the Hospital
                        </Typography>
                        <Typography mt={1.5} color={colors.slate} lineHeight={1.8} fontSize={15}>
                            {hospital.description || "Leading healthcare center equipped with advanced clinical technology and patient care."}
                        </Typography>

                        {/* FACILITIES */}
                        {hospital.facilities && hospital.facilities.length > 0 && (
                            <Box mt={4}>
                                <Typography variant="h6" fontWeight={800} color={colors.ink}>
                                    Key Facilities & Specialties
                                </Typography>
                                <Grid container spacing={1.2} mt={1}>
                                    {hospital.facilities.map((facility) => (
                                        <Grid item key={facility}>
                                            <Chip
                                                label={facility}
                                                variant="outlined"
                                                sx={{
                                                    borderRadius: 2,
                                                    borderColor: colors.hairline,
                                                    bgcolor: colors.canvas,
                                                    fontWeight: 600,
                                                }}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}

                        {/* HOSPITAL PHOTOS (CLOUDINARY) */}
                        {hospital.hospitalImages && hospital.hospitalImages.length > 0 && (
                            <Box mt={4}>
                                <Typography variant="h6" fontWeight={800} color={colors.ink} mb={1.5}>
                                    Hospital Gallery & Infrastructure
                                </Typography>
                                <Grid container spacing={2}>
                                    {hospital.hospitalImages.map((imgUrl, idx) => (
                                        <Grid item xs={12} sm={6} md={4} key={idx}>
                                            <Box
                                                component="img"
                                                src={imgUrl}
                                                alt={`${hospital.hospitalName} facility ${idx + 1}`}
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null;
                                                    e.currentTarget.src = "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80";
                                                }}
                                                sx={{
                                                    width: "100%",
                                                    height: 180,
                                                    objectFit: "cover",
                                                    borderRadius: 3,
                                                    border: "1px solid #E2E8F0",
                                                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                                }}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}

                        {/* MAP & GPS NAVIGATION */}
                        <Box mt={4.5}>
                            <Typography variant="h6" fontWeight={800} color={colors.ink} mb={1.5}>
                                Location & Driving Directions
                            </Typography>
                            <MedicalMap
                                hospitals={[hospital]}
                                center={hospital.latitude && hospital.longitude ? { latitude: hospital.latitude, longitude: hospital.longitude } : null}
                                zoom={15}
                                height={340}
                                showLocateButton={true}
                            />
                        </Box>

                        {/* ACTION BUTTONS */}
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2}
                            mt={5}
                        >
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<CalendarMonth />}
                                onClick={handleBookAppointment}
                                sx={{
                                    bgcolor: colors.amber,
                                    color: colors.ink,
                                    fontWeight: 800,
                                    fontSize: 15,
                                    px: 3.5,
                                    py: 1.4,
                                    borderRadius: 2.5,
                                    boxShadow: "0 6px 18px rgba(214,138,60,0.3)",
                                    "&:hover": {
                                        bgcolor: colors.amberDeep,
                                    },
                                }}
                            >
                                {isPatient ? "Book Appointment at this Hospital" : "Book Appointment"}
                            </Button>

                            <Button
                                variant="outlined"
                                size="large"
                                startIcon={<MedicalServicesOutlined />}
                                onClick={() => navigate("/doctors")}
                                sx={{
                                    borderColor: colors.pine,
                                    color: colors.pine,
                                    fontWeight: 700,
                                    fontSize: 15,
                                    px: 3,
                                    py: 1.4,
                                    borderRadius: 2.5,
                                    "&:hover": {
                                        borderColor: colors.pineDeep,
                                        bgcolor: colors.pineSoft,
                                    },
                                }}
                            >
                                View Doctors Directory
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
        </Container>
    );

    if (isAuthenticated) {
        return (
            <DashboardLayout
                role={role || "patient"}
                title="Hospital Details"
                subtitle="Facility overview, clinical specialties, and emergency intake"
            >
                {mainContent}
            </DashboardLayout>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: colors.canvas, display: "flex", flexDirection: "column" }}>
            <Navbar />
            {mainContent}
            <Footer />
        </Box>
    );
}

export default HospitalDetails;