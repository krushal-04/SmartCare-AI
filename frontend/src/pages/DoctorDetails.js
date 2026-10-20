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
    CheckCircleOutlined,
    LocalHospital,
    MedicalServicesOutlined,
    PaymentsOutlined,
    SchoolOutlined,
    TranslateOutlined,
    WorkHistoryOutlined,
} from "@mui/icons-material";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import api from "../services/api";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

function DoctorDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { role, isAuthenticated } = useAuth();

    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDoctor = async () => {
            try {
                const response = await api.get(`/doctor/${id}`);
                setDoctor(response.data.doctor);
            } catch (err) {
                setError("Unable to load doctor details.");
            } finally {
                setLoading(false);
            }
        };

        fetchDoctor();
    }, [id]);

    const handleBookAppointment = () => {
        const targetBookingUrl = `/book-appointment?doctorId=${doctor._id}&hospitalId=${doctor.hospitalId?._id || doctor.hospitalId}&departmentId=${doctor.departmentId?._id || doctor.departmentId}`;

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
            // Non-patient logged in
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

    if (error || !doctor) {
        return (
            <Box sx={{ minHeight: "100vh", bgcolor: colors.canvas }}>
                <Navbar />
                <Container sx={{ py: 8 }}>
                    <Alert severity="error">{error || "Doctor not found."}</Alert>
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={() => navigate("/doctors")}
                        sx={{ mt: 3, color: colors.pine }}
                    >
                        Back to doctors
                    </Button>
                </Container>
                <Footer />
            </Box>
        );
    }

    const isPatient = isAuthenticated && role === "patient";

    const getCleanDoctorName = (name) => {
        if (!name) return "";
        const trimmed = String(name).trim();
        if (trimmed.toLowerCase().startsWith("dr.") || trimmed.toLowerCase().startsWith("dr ")) {
            return trimmed;
        }
        return `Dr. ${trimmed}`;
    };

    const mainContent = (
        <Container maxWidth="md" sx={{ py: isAuthenticated ? 2 : 5, flex: 1 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate("/doctors")}
                    sx={{ mb: 3, color: colors.slate, fontWeight: 700 }}
                >
                    Back to doctors directory
                </Button>

                <Card
                    elevation={0}
                    sx={{
                        borderRadius: 4,
                        border: `1px solid ${colors.hairline}`,
                        bgcolor: colors.white,
                        boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
                        overflow: "hidden",
                    }}
                >
                    <Box
                        sx={{
                            height: 12,
                            background: `linear-gradient(90deg, ${colors.pine} 0%, ${colors.amber} 100%)`,
                        }}
                    />

                    <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                        {/* HEADER PROFILE */}
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={3}
                            alignItems={{ xs: "flex-start", sm: "center" }}
                        >
                            {doctor.doctorImage ? (
                                <Box
                                    component="img"
                                    src={doctor.doctorImage}
                                    alt={doctor.doctorName}
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80";
                                    }}
                                    sx={{
                                        width: { xs: 90, sm: 110 },
                                        height: { xs: 90, sm: 110 },
                                        borderRadius: 3.5,
                                        objectFit: "cover",
                                        objectPosition: "top",
                                        border: "2px solid #E2E8F0",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                        flexShrink: 0,
                                    }}
                                />
                            ) : (
                                <Box
                                    sx={{
                                        width: { xs: 90, sm: 110 },
                                        height: { xs: 90, sm: 110 },
                                        borderRadius: 3.5,
                                        bgcolor: colors.pineSoft,
                                        display: "grid",
                                        placeItems: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    <MedicalServicesOutlined sx={{ fontSize: 54, color: colors.pine }} />
                                </Box>
                            )}

                            <Box sx={{ flex: 1 }}>
                                <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                                    <Typography
                                        fontSize={{ xs: 26, md: 34 }}
                                        fontWeight={800}
                                        color={colors.ink}
                                        sx={{ fontFamily: "'Newsreader', serif" }}
                                    >
                                        {getCleanDoctorName(doctor.doctorName)}
                                    </Typography>
                                    <Chip
                                        icon={<CheckCircleOutlined sx={{ fontSize: "16px !important", color: `${colors.pine} !important` }} />}
                                        label="Verified Specialist"
                                        size="small"
                                        sx={{
                                            bgcolor: colors.pineSoft,
                                            color: colors.pineDeep,
                                            fontWeight: 700,
                                            fontSize: 11,
                                        }}
                                    />
                                </Stack>

                                <Typography color={colors.pine} fontWeight={700} fontSize={16} mt={0.5}>
                                    {doctor.specialization}
                                </Typography>

                                <Typography color={colors.slate} fontSize={14} mt={0.4}>
                                    {doctor.qualification}
                                </Typography>
                            </Box>
                        </Stack>

                        <Divider sx={{ my: 4, borderColor: colors.hairline }} />

                        {/* DETAILS GRID */}
                        <Grid container spacing={2.5}>
                            {doctor.hospitalId?.hospitalName && (
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: colors.canvas, border: `1px solid ${colors.hairline}` }}>
                                        <Stack direction="row" spacing={1.2} alignItems="center">
                                            <LocalHospital sx={{ color: colors.pine, fontSize: 22 }} />
                                            <Box>
                                                <Typography fontSize={11.5} fontWeight={700} color={colors.slate}>
                                                    AFFILIATED HOSPITAL
                                                </Typography>
                                                <Typography fontSize={14.5} fontWeight={700} color={colors.ink}>
                                                    {doctor.hospitalId.hospitalName}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Box>
                                </Grid>
                            )}

                            {doctor.departmentId?.departmentName && (
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: colors.canvas, border: `1px solid ${colors.hairline}` }}>
                                        <Stack direction="row" spacing={1.2} alignItems="center">
                                            <SchoolOutlined sx={{ color: colors.amber, fontSize: 22 }} />
                                            <Box>
                                                <Typography fontSize={11.5} fontWeight={700} color={colors.slate}>
                                                    DEPARTMENT
                                                </Typography>
                                                <Typography fontSize={14.5} fontWeight={700} color={colors.ink}>
                                                    {doctor.departmentId.departmentName}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Box>
                                </Grid>
                            )}

                            <Grid item xs={12} sm={4}>
                                <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: colors.canvas, border: `1px solid ${colors.hairline}` }}>
                                    <Stack direction="row" spacing={1.2} alignItems="center">
                                        <WorkHistoryOutlined sx={{ color: colors.pine, fontSize: 22 }} />
                                        <Box>
                                            <Typography fontSize={11.5} fontWeight={700} color={colors.slate}>
                                                EXPERIENCE
                                            </Typography>
                                            <Typography fontSize={14.5} fontWeight={700} color={colors.ink}>
                                                {doctor.experience || 0}+ Years
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: colors.canvas, border: `1px solid ${colors.hairline}` }}>
                                    <Stack direction="row" spacing={1.2} alignItems="center">
                                        <PaymentsOutlined sx={{ color: colors.pine, fontSize: 22 }} />
                                        <Box>
                                            <Typography fontSize={11.5} fontWeight={700} color={colors.slate}>
                                                CONSULTATION FEE
                                            </Typography>
                                            <Typography fontSize={14.5} fontWeight={800} color={colors.pine}>
                                                ₹{doctor.consultationFee || 0}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: colors.canvas, border: `1px solid ${colors.hairline}` }}>
                                    <Stack direction="row" spacing={1.2} alignItems="center">
                                        <TranslateOutlined sx={{ color: colors.amber, fontSize: 22 }} />
                                        <Box>
                                            <Typography fontSize={11.5} fontWeight={700} color={colors.slate}>
                                                LANGUAGES
                                            </Typography>
                                            <Typography fontSize={13.5} fontWeight={700} color={colors.ink} noWrap>
                                                {(doctor.languages || []).join(", ") || "English"}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            </Grid>
                        </Grid>

                        {/* CTA SECTION */}
                        <Box sx={{ mt: 5 }}>
                            {isAuthenticated && role !== "patient" ? (
                                <Alert severity="info" sx={{ borderRadius: 2.5 }}>
                                    You are currently logged in as a <strong>{role === "hospital" ? "Hospital Staff" : "Administrator"}</strong>.
                                    Only patients can schedule clinical appointments.
                                </Alert>
                            ) : (
                                <Box>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        fullWidth
                                        startIcon={<CalendarMonth />}
                                        onClick={handleBookAppointment}
                                        sx={{
                                            bgcolor: colors.amber,
                                            color: colors.ink,
                                            fontWeight: 800,
                                            fontSize: 16,
                                            py: 1.6,
                                            borderRadius: 2.5,
                                            boxShadow: "0 6px 20px rgba(214,138,60,0.35)",
                                            "&:hover": {
                                                bgcolor: colors.amberDeep,
                                                boxShadow: "0 8px 24px rgba(214,138,60,0.45)",
                                            },
                                        }}
                                    >
                                        {isPatient
                                            ? `Book Appointment with ${getCleanDoctorName(doctor.doctorName)}`
                                            : "Book Appointment"}
                                    </Button>

                                    {!isAuthenticated && (
                                        <Typography
                                            textAlign="center"
                                            fontSize={12.5}
                                            color={colors.slate}
                                            mt={1.2}
                                        >
                                            You will be prompted to sign in or create a patient account before booking.
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Box>
                    </CardContent>
                </Card>
        </Container>
    );

    if (isAuthenticated) {
        return (
            <DashboardLayout
                role={role || "patient"}
                title="Doctor Profile"
                subtitle="Specialist details, hospital affiliation and consultation scheduling"
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

export default DoctorDetails;