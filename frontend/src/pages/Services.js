import React from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Button,
    Grid,
    Stack,
    Chip,
} from "@mui/material";
import {
    LocalHospitalOutlined,
    MedicalServicesOutlined,
    CalendarMonthOutlined,
    EmergencyOutlined,
    PsychologyOutlined,
    DescriptionOutlined,
    ArrowForwardOutlined,
    CheckCircleOutlineRounded,
    VerifiedUserOutlined,
    HealthAndSafetyOutlined,
    SpeedOutlined,
    ShieldOutlined,
    PhoneInTalkOutlined,
} from "@mui/icons-material";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

export default function Services() {
    const navigate = useNavigate();
    const { isAuthenticated, role } = useAuth();
    const isPatient = isAuthenticated && role === "patient";

    const services = [
        {
            icon: <LocalHospitalOutlined sx={{ fontSize: 28 }} />,
            title: "Hospital Network & Facilities",
            category: "Inpatient & Facilities",
            description: "Explore accredited hospitals, multi-specialty medical centers, addresses, and real-time emergency readiness across the region.",
            highlights: [
                "Interactive GPS location map & route guidance",
                "Specialized diagnostic & intensive care units",
                "Direct administrative contact and visiting hours",
            ],
            action: "Explore Hospitals",
            path: "/hospitals",
            accentColor: "#0D9488",
            bgColor: "#F0FDFA",
        },
        {
            icon: <MedicalServicesOutlined sx={{ fontSize: 28 }} />,
            title: "Specialist Doctor Directory",
            category: "Multidisciplinary Care",
            description: "Connect with certified physicians and surgeons across cardiology, orthopedics, pediatrics, neurology, and general medicine.",
            highlights: [
                "NMC verified medical credentials & qualifications",
                "Transparent OPD consultation fees",
                "Hospital affiliations & clinical experience records",
            ],
            action: "Find Doctors",
            path: "/doctors",
            accentColor: "#0284C7",
            bgColor: "#F0F9FF",
        },
        {
            icon: <CalendarMonthOutlined sx={{ fontSize: 28 }} />,
            title: "Outpatient Consultation Booking",
            category: "Smart Scheduling",
            description: "Reserve verified doctor consultation slots in real-time with automatic digital confirmation and zero waiting queues at OPD desks.",
            highlights: [
                "Live schedule availability per doctor & hospital",
                "Automated instant confirmation & digital slip",
                "Easy rescheduling and cancellation management",
            ],
            action: isPatient ? "Book Consultation" : "Schedule Appointment",
            path: "/book-appointment",
            requiresAuth: true,
            authFrom: "/book-appointment",
            accentColor: "#0F766E",
            bgColor: "#F0FDFA",
        },
        {
            icon: <EmergencyOutlined sx={{ fontSize: 28 }} />,
            title: "24/7 Trauma & Emergency Network",
            category: "Critical Care Response",
            description: "Priority triage hotline and rapid ambulance dispatch for life-threatening conditions, acute trauma, and critical patient stabilization.",
            highlights: [
                "Round-the-clock emergency desk coordination",
                "Immediate nearest accredited emergency room routing",
                "Pre-arrival clinical notification to hospital trauma teams",
            ],
            action: "Emergency Services",
            path: "/emergency",
            accentColor: "#DC2626",
            bgColor: "#FEF2F2",
            isEmergency: true,
        },
        {
            icon: <PsychologyOutlined sx={{ fontSize: 28 }} />,
            title: "Clinical Health Guidance",
            category: "Triage & Decision Support",
            description: "Preliminary medical assessment and department recommendations powered by structured clinical triage algorithms.",
            highlights: [
                "Symptom categorization and urgency rating",
                "Direct specialty department matching",
                "Evidence-based clinical recommendations",
            ],
            action: isPatient ? "Consult Assistant" : "Access Assistant",
            path: isPatient ? "/patient/ai" : "/login",
            requiresAuth: true,
            authFrom: "/patient/ai",
            accentColor: "#7C3AED",
            bgColor: "#F5F3FF",
        },
        {
            icon: <DescriptionOutlined sx={{ fontSize: 28 }} />,
            title: "Digital Health Records & Reports",
            category: "Secure Diagnostic Vault",
            description: "Secure, centralized digital storage for diagnostic pathology results, radiology scans, clinical notes, and digital prescriptions.",
            highlights: [
                "Encrypted medical history accessible anytime",
                "Diagnostic reports archive with instant PDF view",
                "Seamless record sharing with attending physicians",
            ],
            action: isPatient ? "View My Records" : "Access Medical Records",
            path: isPatient ? "/patient/reports" : "/login",
            requiresAuth: true,
            authFrom: "/patient/reports",
            accentColor: "#0284C7",
            bgColor: "#F0F9FF",
        },
    ];

    const workflowSteps = [
        {
            step: "01",
            title: "Search & Select",
            desc: "Browse certified medical practitioners, specialty departments, and accredited hospitals near you.",
        },
        {
            step: "02",
            title: "Confirm Time Slot",
            desc: "Choose an available date and consultation slot with instant digital confirmation and zero queue time.",
        },
        {
            step: "03",
            title: "Clinical Consultation",
            desc: "Visit the medical facility or connect with the attending specialist for comprehensive evaluation.",
        },
        {
            step: "04",
            title: "Digital Continuity",
            desc: "Receive digital prescriptions, view diagnostic lab reports, and manage follow-up care in your portal.",
        },
    ];

    const handleAction = (service) => {
        if (service.requiresAuth && !isAuthenticated) {
            navigate("/login", {
                state: { from: service.authFrom || service.path },
            });
            return;
        }
        navigate(service.path);
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#F8FAFC", display: "flex", flexDirection: "column" }}>
            <Navbar />

            {/* HERO SECTION */}
            <Box
                sx={{
                    background: "linear-gradient(135deg, #072522 0%, #0F524B 60%, #0A3A35 100%)",
                    color: "#FFFFFF",
                    pt: { xs: 7, md: 9 },
                    pb: { xs: 8, md: 10 },
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
                    <Stack spacing={2} maxWidth={820}>
                        <Box sx={{ display: "inline-flex", width: "fit-content" }}>
                            <Chip
                                icon={<VerifiedUserOutlined sx={{ fontSize: "16px !important", color: "#2DD4BF" }} />}
                                label="ACCREDITED CLINICAL ECOSYSTEM • NABH COMPLIANT"
                                sx={{
                                    bgcolor: "rgba(45, 212, 191, 0.12)",
                                    color: "#2DD4BF",
                                    border: "1px solid rgba(45, 212, 191, 0.3)",
                                    fontWeight: 800,
                                    fontSize: 11.5,
                                    letterSpacing: 0.8,
                                    px: 0.5,
                                }}
                            />
                        </Box>

                        <Typography
                            variant="h1"
                            sx={{
                                fontSize: { xs: 30, sm: 40, md: 46 },
                                fontWeight: 900,
                                lineHeight: 1.2,
                                letterSpacing: -0.5,
                            }}
                        >
                            Comprehensive Healthcare & Clinical Services
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: { xs: 15, md: 17 },
                                color: "rgba(255, 255, 255, 0.82)",
                                lineHeight: 1.7,
                                maxWidth: 740,
                            }}
                        >
                            From immediate 24/7 trauma response to specialist consultations, multi-facility GPS navigation,
                            and encrypted digital records, SmartCare connects patients with trusted healthcare infrastructure.
                        </Typography>
                    </Stack>
                </Container>
            </Box>

            {/* CLINICAL TRUST STRIP */}
            <Box
                sx={{
                    bgcolor: "#FFFFFF",
                    borderBottom: "1px solid #E2E8F0",
                    py: 2.5,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
            >
                <Container maxWidth="lg">
                    <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <SpeedOutlined sx={{ color: "#DC2626", fontSize: 26 }} />
                                <Box>
                                    <Typography fontSize={13.5} fontWeight={800} color="#0F172A">
                                        24/7 Trauma Readiness
                                    </Typography>
                                    <Typography fontSize={11.5} color="text.secondary">
                                        Immediate emergency triage
                                    </Typography>
                                </Box>
                            </Stack>
                        </Grid>

                        <Grid item xs={6} md={3}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <VerifiedUserOutlined sx={{ color: "#0D9488", fontSize: 26 }} />
                                <Box>
                                    <Typography fontSize={13.5} fontWeight={800} color="#0F172A">
                                        Verified Specialists
                                    </Typography>
                                    <Typography fontSize={11.5} color="text.secondary">
                                        NMC registered physicians
                                    </Typography>
                                </Box>
                            </Stack>
                        </Grid>

                        <Grid item xs={6} md={3}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <HealthAndSafetyOutlined sx={{ color: "#0284C7", fontSize: 26 }} />
                                <Box>
                                    <Typography fontSize={13.5} fontWeight={800} color="#0F172A">
                                        Zero OPD Waiting
                                    </Typography>
                                    <Typography fontSize={11.5} color="text.secondary">
                                        Instant slot confirmation
                                    </Typography>
                                </Box>
                            </Stack>
                        </Grid>

                        <Grid item xs={6} md={3}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <ShieldOutlined sx={{ color: "#7C3AED", fontSize: 26 }} />
                                <Box>
                                    <Typography fontSize={13.5} fontWeight={800} color="#0F172A">
                                        Encrypted Health Records
                                    </Typography>
                                    <Typography fontSize={11.5} color="text.secondary">
                                        Secure clinical pathology vault
                                    </Typography>
                                </Box>
                            </Stack>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* SERVICES CARDS GRID */}
            <Container maxWidth="lg" sx={{ py: 7, flex: 1 }}>
                <Box mb={5} textAlign={{ xs: "left", sm: "center" }}>
                    <Typography fontSize={12} fontWeight={800} color="#0D9488" letterSpacing={1.2} textTransform="uppercase">
                        Clinical Solutions
                    </Typography>
                    <Typography variant="h4" fontWeight={900} color="#0F172A" mt={0.5} mb={1}>
                        Integrated Medical Portals & Care Modules
                    </Typography>
                    <Typography fontSize={15} color="text.secondary" maxWidth={650} mx={{ sm: "auto" }}>
                        Select a specialized healthcare service below to access certified medical professionals,
                        book diagnostic consultations, or manage critical care.
                    </Typography>
                </Box>

                <Grid container spacing={3.5}>
                    {services.map((service) => (
                        <Grid item xs={12} sm={6} md={4} key={service.title} sx={{ display: "flex" }}>
                            <Card
                                elevation={0}
                                sx={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: 3.5,
                                    border: service.isEmergency ? "1.5px solid #FECACA" : "1.5px solid #E2E8F0",
                                    bgcolor: "#FFFFFF",
                                    boxShadow: service.isEmergency
                                        ? "0 4px 20px rgba(220, 38, 38, 0.06)"
                                        : "0 4px 18px rgba(15, 23, 42, 0.04)",
                                    display: "flex",
                                    flexDirection: "column",
                                    transition: "all 0.25s ease-in-out",
                                    "&:hover": {
                                        transform: "translateY(-5px)",
                                        boxShadow: service.isEmergency
                                            ? "0 14px 30px rgba(220, 38, 38, 0.12)"
                                            : "0 14px 28px rgba(15, 23, 42, 0.08)",
                                        borderColor: service.isEmergency ? "#F87171" : "#CBD5E1",
                                    },
                                }}
                            >
                                <CardContent sx={{ p: 3.5, flex: 1, display: "flex", flexDirection: "column" }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                                        <Box
                                            sx={{
                                                width: 52,
                                                height: 52,
                                                borderRadius: 2.5,
                                                bgcolor: service.bgColor,
                                                color: service.accentColor,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                border: `1px solid ${service.accentColor}25`,
                                            }}
                                        >
                                            {service.icon}
                                        </Box>

                                        <Chip
                                            size="small"
                                            label={service.category}
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: 11,
                                                bgcolor: service.bgColor,
                                                color: service.accentColor,
                                                border: `1px solid ${service.accentColor}30`,
                                                borderRadius: 1.5,
                                            }}
                                        />
                                    </Box>

                                    <Typography
                                        fontSize={18.5}
                                        fontWeight={800}
                                        color="#0F172A"
                                        lineHeight={1.35}
                                        minHeight={50}
                                    >
                                        {service.title}
                                    </Typography>

                                    <Typography
                                        fontSize={13.5}
                                        color="#475569"
                                        lineHeight={1.6}
                                        mt={1}
                                        mb={2.5}
                                        minHeight={64}
                                    >
                                        {service.description}
                                    </Typography>

                                    {/* Feature Highlights */}
                                    <Stack spacing={1} sx={{ mb: 3, pt: 2, borderTop: "1px solid #F1F5F9" }}>
                                        {service.highlights.map((point, idx) => (
                                            <Stack key={idx} direction="row" spacing={1} alignItems="flex-start">
                                                <CheckCircleOutlineRounded
                                                    sx={{
                                                        fontSize: 16,
                                                        color: service.accentColor,
                                                        flexShrink: 0,
                                                        mt: 0.2,
                                                    }}
                                                />
                                                <Typography fontSize={12} color="#334155" fontWeight={600} lineHeight={1.4}>
                                                    {point}
                                                </Typography>
                                            </Stack>
                                        ))}
                                    </Stack>

                                    {/* Action Button */}
                                    <Button
                                        fullWidth
                                        variant={service.isEmergency ? "contained" : "outlined"}
                                        endIcon={<ArrowForwardOutlined sx={{ fontSize: 16 }} />}
                                        onClick={() => handleAction(service)}
                                        sx={{
                                            mt: "auto",
                                            py: 1.1,
                                            borderRadius: 2.2,
                                            fontWeight: 800,
                                            fontSize: 13,
                                            textTransform: "none",
                                            ...(service.isEmergency
                                                ? {
                                                      bgcolor: "#DC2626",
                                                      color: "#FFFFFF",
                                                      boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)",
                                                      "&:hover": {
                                                          bgcolor: "#B91C1C",
                                                      },
                                                  }
                                                : {
                                                      borderColor: "#CBD5E1",
                                                      color: "#0F172A",
                                                      "&:hover": {
                                                          borderColor: service.accentColor,
                                                          color: service.accentColor,
                                                          bgcolor: service.bgColor,
                                                      },
                                                  }),
                                        }}
                                    >
                                        {service.action}
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* WORKFLOW STEPS: PATIENT JOURNEY */}
                <Box sx={{ mt: 10, pt: 6, borderTop: "1px solid #E2E8F0" }}>
                    <Box textAlign="center" mb={5}>
                        <Typography fontSize={12} fontWeight={800} color="#0D9488" letterSpacing={1.2} textTransform="uppercase">
                            Care Protocol
                        </Typography>
                        <Typography variant="h4" fontWeight={900} color="#0F172A" mt={0.5}>
                            How SmartCare Delivers Seamless Healthcare
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {workflowSteps.map((ws) => (
                            <Grid item xs={12} sm={6} md={3} key={ws.step}>
                                <Box
                                    sx={{
                                        p: 3,
                                        height: "100%",
                                        bgcolor: "#FFFFFF",
                                        borderRadius: 3,
                                        border: "1px solid #E2E8F0",
                                        position: "relative",
                                    }}
                                >
                                    <Typography
                                        fontSize={24}
                                        fontWeight={900}
                                        color="#0D9488"
                                        sx={{ opacity: 0.85, mb: 1.5 }}
                                    >
                                        {ws.step}
                                    </Typography>
                                    <Typography fontSize={16} fontWeight={800} color="#0F172A" mb={1}>
                                        {ws.title}
                                    </Typography>
                                    <Typography fontSize={13} color="text.secondary" lineHeight={1.6}>
                                        {ws.desc}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* EMERGENCY CALLOUT BANNER */}
                <Box
                    sx={{
                        mt: 8,
                        p: { xs: 3.5, md: 5 },
                        borderRadius: 3.5,
                        background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
                        color: "#FFFFFF",
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        alignItems: { xs: "flex-start", md: "center" },
                        justifyContent: "space-between",
                        gap: 3,
                    }}
                >
                    <Box maxWidth={600}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                            <EmergencyOutlined sx={{ color: "#EF4444", fontSize: 24 }} />
                            <Typography fontSize={12} fontWeight={800} color="#F87171" letterSpacing={1} textTransform="uppercase">
                                Immediate Medical Assistance Hotline
                            </Typography>
                        </Stack>
                        <Typography variant="h5" fontWeight={900} mb={1}>
                            Require Urgent Critical or Ambulance Care?
                        </Typography>
                        <Typography fontSize={14} color="#94A3B8" lineHeight={1.6}>
                            Our centralized 24/7 emergency dispatch routes directly to the nearest trauma-ready hospital
                            and alerts standby medical teams before arrival.
                        </Typography>
                    </Box>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} width={{ xs: "100%", md: "auto" }}>
                        <Button
                            variant="contained"
                            startIcon={<EmergencyOutlined />}
                            onClick={() => navigate("/emergency")}
                            sx={{
                                bgcolor: "#DC2626",
                                color: "#FFFFFF",
                                px: 3,
                                py: 1.2,
                                fontWeight: 800,
                                borderRadius: 2,
                                textTransform: "none",
                                boxShadow: "0 4px 14px rgba(220, 38, 38, 0.3)",
                                "&:hover": {
                                    bgcolor: "#B91C1C",
                                },
                            }}
                        >
                            Open Emergency Radar
                        </Button>

                        <Button
                            variant="outlined"
                            startIcon={<PhoneInTalkOutlined />}
                            component="a"
                            href="tel:108"
                            sx={{
                                borderColor: "rgba(255, 255, 255, 0.3)",
                                color: "#FFFFFF",
                                px: 3,
                                py: 1.2,
                                fontWeight: 800,
                                borderRadius: 2,
                                textTransform: "none",
                                "&:hover": {
                                    borderColor: "#FFFFFF",
                                    bgcolor: "rgba(255, 255, 255, 0.08)",
                                },
                            }}
                        >
                            Dial Ambulance (108)
                        </Button>
                    </Stack>
                </Box>
            </Container>

            <Footer />
        </Box>
    );
}