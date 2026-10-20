import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
    Box,
    Typography,
    Button,
    Container,
    Stack,
    Chip,
    Card,
} from "@mui/material";

import {
    ArrowForward,
    Psychology,
    LocalHospital,
    CalendarMonth,
    EmergencyOutlined,
    MedicalServicesOutlined,
    LocationOn,
    CheckCircle,
    DashboardOutlined,
} from "@mui/icons-material";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

function Home() {
    const navigate = useNavigate();
    const { isAuthenticated, role } = useAuth();

    useEffect(() => {
        if (isAuthenticated && role) {
            const dest = role === "admin" ? "/admin" : role === "hospital" ? "/hospital" : "/patient";
            navigate(dest, { replace: true });
        }
    }, [isAuthenticated, role, navigate]);

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: "#F7FBFC",
            }}
        >
            <Navbar />

            {/* HERO */}

            <Container maxWidth="xl">
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            lg: "1.05fr .95fr",
                        },
                        alignItems: "center",
                        gap: {
                            xs: 5,
                            lg: 8,
                        },
                        py: {
                            xs: 6,
                            md: 9,
                        },
                    }}
                >
                    <Box>
                        <Chip
                            icon={<Psychology />}
                            label="SMART HEALTHCARE PLATFORM"
                            sx={{
                                bgcolor: "#E5F7F8",
                                color: "#0B8793",
                                fontWeight: 900,
                                mb: 3,
                            }}
                        />

                        <Typography
                            sx={{
                                fontSize: {
                                    xs: 44,
                                    sm: 54,
                                    md: 68,
                                },
                                fontWeight: 900,
                                lineHeight: 1,
                                letterSpacing: "-0.055em",
                                color: "#102F42",
                            }}
                        >
                            Healthcare,
                            <Box
                                component="span"
                                sx={{
                                    display: "block",
                                    color: "#0B8793",
                                }}
                            >
                                connected better.
                            </Box>
                        </Typography>

                        <Typography
                            sx={{
                                mt: 3,
                                maxWidth: 610,
                                fontSize: {
                                    xs: 16,
                                    md: 18,
                                },
                                color: "#667D88",
                                lineHeight: 1.8,
                            }}
                        >
                            SmartCare AI brings patients,
                            hospitals and doctors together in one
                            simple hospital management platform.
                        </Typography>

                        <Stack
                            direction={{
                                xs: "column",
                                sm: "row",
                            }}
                            spacing={1.5}
                            mt={4}
                        >
                            {isAuthenticated && role === "patient" ? (
                                <>
                                    <Button
                                        size="large"
                                        variant="contained"
                                        startIcon={<CalendarMonth />}
                                        onClick={() => navigate("/book-appointment")}
                                        sx={{
                                            px: 3.2,
                                            py: 1.6,
                                            bgcolor: colors.amber,
                                            color: colors.ink,
                                            fontWeight: 800,
                                            boxShadow: "0 6px 20px rgba(214,138,60,0.35)",
                                            "&:hover": {
                                                bgcolor: colors.amberDeep,
                                            },
                                        }}
                                    >
                                        Book Appointment
                                    </Button>
                                    <Button
                                        size="large"
                                        variant="outlined"
                                        startIcon={<DashboardOutlined />}
                                        onClick={() => navigate("/patient")}
                                        sx={{
                                            px: 3.2,
                                            py: 1.6,
                                            borderColor: colors.pine,
                                            color: colors.pine,
                                            fontWeight: 700,
                                        }}
                                    >
                                        Patient Dashboard
                                    </Button>
                                </>
                            ) : isAuthenticated && role === "hospital" ? (
                                <>
                                    <Button
                                        size="large"
                                        variant="contained"
                                        startIcon={<DashboardOutlined />}
                                        onClick={() => navigate("/hospital")}
                                        sx={{
                                            px: 3.2,
                                            py: 1.6,
                                            bgcolor: colors.pine,
                                            color: colors.white,
                                            fontWeight: 700,
                                        }}
                                    >
                                        Hospital Portal
                                    </Button>
                                    <Button
                                        size="large"
                                        variant="outlined"
                                        onClick={() => navigate("/hospital/doctors")}
                                        sx={{
                                            px: 3.2,
                                            py: 1.6,
                                        }}
                                    >
                                        Manage Doctors
                                    </Button>
                                </>
                            ) : isAuthenticated && role === "admin" ? (
                                <Button
                                    size="large"
                                    variant="contained"
                                    startIcon={<DashboardOutlined />}
                                    onClick={() => navigate("/admin")}
                                    sx={{
                                        px: 3.5,
                                        py: 1.6,
                                        bgcolor: colors.pine,
                                        color: colors.white,
                                    }}
                                >
                                    Admin Dashboard
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        size="large"
                                        variant="contained"
                                        startIcon={<CalendarMonth />}
                                        onClick={() => navigate("/book-appointment")}
                                        sx={{
                                            px: 3.2,
                                            py: 1.6,
                                            bgcolor: colors.amber,
                                            color: colors.ink,
                                            fontWeight: 800,
                                            boxShadow: "0 6px 20px rgba(214,138,60,0.35)",
                                            "&:hover": {
                                                bgcolor: colors.amberDeep,
                                            },
                                        }}
                                    >
                                        Book Appointment
                                    </Button>

                                    <Button
                                        size="large"
                                        variant="outlined"
                                        onClick={() => navigate("/login")}
                                        sx={{
                                            px: 3.2,
                                            py: 1.6,
                                            borderColor: colors.pine,
                                            color: colors.pine,
                                            fontWeight: 700,
                                        }}
                                    >
                                        Sign In
                                    </Button>
                                </>
                            )}
                        </Stack>

                        <Stack
                            direction="row"
                            spacing={{
                                xs: 2.5,
                                sm: 4,
                            }}
                            mt={4}
                        >
                            <Box>
                                <Typography
                                    fontSize={25}
                                    fontWeight={900}
                                    color="primary.main"
                                >
                                    24/7
                                </Typography>

                                <Typography
                                    fontSize={12}
                                    color="text.secondary"
                                >
                                    Emergency support
                                </Typography>
                            </Box>

                            <Box>
                                <Typography
                                    fontSize={25}
                                    fontWeight={900}
                                    color="primary.main"
                                >
                                    AI
                                </Typography>

                                <Typography
                                    fontSize={12}
                                    color="text.secondary"
                                >
                                    Smart routing
                                </Typography>
                            </Box>

                            <Box>
                                <Typography
                                    fontSize={25}
                                    fontWeight={900}
                                    color="primary.main"
                                >
                                    Live
                                </Typography>

                                <Typography
                                    fontSize={12}
                                    color="text.secondary"
                                >
                                    Ambulance
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>

                    {/* PRODUCT PREVIEW */}

                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >
                        <Card
                            elevation={0}
                            sx={{
                                width: "100%",
                                maxWidth: 520,
                                borderRadius: 5,
                                p: 1,
                                background:
                                    "linear-gradient(145deg,#FFFFFF,#EEF8F9)",
                                border:
                                    "1px solid #E0ECEE",
                                boxShadow:
                                    "0 30px 80px rgba(16,70,85,.13)",
                            }}
                        >
                            <Box
                                sx={{
                                    bgcolor: "#102F42",
                                    borderRadius: 4,
                                    p: {
                                        xs: 2,
                                        sm: 3,
                                    },
                                    color: "#fff",
                                }}
                            >
                                <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                >
                                    <Box>
                                        <Typography
                                            fontWeight={900}
                                        >
                                            SmartCare
                                        </Typography>

                                        <Typography
                                            fontSize={11}
                                            color="rgba(255,255,255,.55)"
                                        >
                                            Find the right care
                                        </Typography>
                                    </Box>

                                    <Chip
                                        label="Online"
                                        size="small"
                                        sx={{
                                            bgcolor:
                                                "rgba(111,233,223,.13)",
                                            color: "#71E9DF",
                                            fontWeight: 800,
                                        }}
                                    />
                                </Stack>

                                <Typography
                                    mt={4}
                                    fontSize={13}
                                    color="rgba(255,255,255,.55)"
                                >
                                    WHAT DO YOU NEED TODAY?
                                </Typography>

                                <Box
                                    sx={{
                                        mt: 1,
                                        p: 2,
                                        borderRadius: 3,
                                        bgcolor:
                                            "rgba(255,255,255,.07)",
                                        border:
                                            "1px solid rgba(255,255,255,.08)",
                                    }}
                                >
                                    <Typography
                                        color="rgba(255,255,255,.68)"
                                    >
                                        Search hospital,
                                        doctor, department...
                                    </Typography>
                                </Box>

                                <Stack
                                    direction="row"
                                    spacing={1}
                                    mt={3}
                                    flexWrap="wrap"
                                    useFlexGap
                                >
                                    {[
                                        {
                                            icon: (
                                                <LocalHospital />
                                            ),
                                            label: "Hospitals",
                                        },
                                        {
                                            icon: (
                                                <MedicalServicesOutlined />
                                            ),
                                            label: "Doctors",
                                        },
                                        {
                                            icon: (
                                                <CalendarMonth />
                                            ),
                                            label: "Appointments",
                                        },
                                    ].map((item) => (
                                        <Box
                                            key={item.label}
                                            sx={{
                                                flex: "1 1 30%",
                                                minWidth: 110,
                                                p: 2,
                                                borderRadius: 3,
                                                bgcolor:
                                                    "rgba(255,255,255,.06)",
                                                border:
                                                    "1px solid rgba(255,255,255,.08)",
                                                textAlign: "center",
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    color: "#71E9DF",
                                                }}
                                            >
                                                {item.icon}
                                            </Box>

                                            <Typography
                                                fontSize={11}
                                                mt={1}
                                            >
                                                {item.label}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>

                                <Box
                                    sx={{
                                        mt: 3,
                                        p: 2.5,
                                        borderRadius: 3,
                                        bgcolor: "#0B8793",
                                    }}
                                >
                                    <Stack
                                        direction="row"
                                        spacing={1.5}
                                        alignItems="center"
                                    >
                                        <Psychology />

                                        <Box>
                                            <Typography
                                                fontWeight={800}
                                                fontSize={13}
                                            >
                                                AI Care Guidance
                                            </Typography>

                                            <Typography
                                                fontSize={11}
                                                color="rgba(255,255,255,.72)"
                                            >
                                                Get help finding the
                                                right department.
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            </Box>
                        </Card>
                    </Box>
                </Box>
            </Container>

            {/* SERVICES */}

            <Box
                id="services"
                sx={{
                    py: {
                        xs: 7,
                        md: 11,
                    },
                    bgcolor: "#fff",
                }}
            >
                <Container maxWidth="lg">
                    <Box textAlign="center" mb={6}>
                        <Chip
                            label="SERVICES"
                            sx={{
                                bgcolor: "#E5F7F8",
                                color: "primary.main",
                                fontWeight: 900,
                                mb: 2,
                            }}
                        />

                        <Typography
                            sx={{
                                fontSize: {
                                    xs: 34,
                                    md: 50,
                                },
                                fontWeight: 900,
                            }}
                        >
                            Everything in one place.
                        </Typography>

                        <Typography
                            mt={1.5}
                            color="text.secondary"
                        >
                            Built for patients, doctors and
                            hospitals.
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "1fr 1fr",
                                lg: "repeat(4,1fr)",
                            },
                            gap: 2,
                        }}
                    >
                        {[
                            {
                                icon: (
                                    <LocalHospital />
                                ),
                                title: "Hospitals",
                                text: "Explore hospitals, facilities and specialties.",
                            },
                            {
                                icon: (
                                    <MedicalServicesOutlined />
                                ),
                                title: "Doctors",
                                text: "Find doctors by department and specialization.",
                            },
                            {
                                icon: (
                                    <CalendarMonth />
                                ),
                                title: "Appointments",
                                text: "Book and manage appointments easily.",
                            },
                            {
                                icon: (
                                    <EmergencyOutlined />
                                ),
                                title: "Emergency",
                                text: "Get connected to emergency assistance.",
                            },
                        ].map((service) => (
                            <Card
                                key={service.title}
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 4,
                                    border:
                                        "1px solid #E3EEF0",
                                    transition: ".25s",
                                    "&:hover": {
                                        transform:
                                            "translateY(-6px)",
                                        boxShadow:
                                            "0 18px 40px rgba(16,70,85,.08)",
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 52,
                                        height: 52,
                                        borderRadius: 3,
                                        bgcolor: "#E9F8F9",
                                        color: "primary.main",
                                        display: "grid",
                                        placeItems: "center",
                                    }}
                                >
                                    {service.icon}
                                </Box>

                                <Typography
                                    fontSize={21}
                                    fontWeight={900}
                                    mt={3}
                                >
                                    {service.title}
                                </Typography>

                                <Typography
                                    mt={1}
                                    color="text.secondary"
                                    lineHeight={1.7}
                                >
                                    {service.text}
                                </Typography>
                            </Card>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* HOSPITALS / DOCTORS */}

            <Box
                id="hospitals"
                sx={{
                    py: 10,
                    bgcolor: "#F5FAFB",
                }}
            >
                <Container maxWidth="lg">
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                md: "1fr 1fr",
                            },
                            gap: 3,
                        }}
                    >
                        <Card
                            elevation={0}
                            sx={{
                                borderRadius: 5,
                                p: {
                                    xs: 3,
                                    md: 4,
                                },
                                bgcolor: "#102F42",
                                color: "#fff",
                            }}
                        >
                            <LocationOn
                                sx={{
                                    color: "#71E9DF",
                                    fontSize: 38,
                                }}
                            />

                            <Typography
                                fontSize={30}
                                fontWeight={900}
                                mt={3}
                            >
                                Find hospitals
                            </Typography>

                            <Typography
                                mt={1}
                                color="rgba(255,255,255,.65)"
                                lineHeight={1.7}
                            >
                                View nearby hospitals, departments,
                                doctors, facilities and emergency
                                availability.
                            </Typography>

                            <Button
                                variant="outlined"
                                onClick={() =>
                                    navigate("/hospitals")
                                }
                                sx={{
                                    mt: 3,
                                    color: "#fff",
                                    borderColor:
                                        "rgba(255,255,255,.25)",
                                }}
                            >
                                Explore Hospitals
                            </Button>
                        </Card>

                        <Card
                            id="doctors"
                            elevation={0}
                            sx={{
                                borderRadius: 5,
                                p: {
                                    xs: 3,
                                    md: 4,
                                },
                                bgcolor: "#E9F8F9",
                            }}
                        >
                            <MedicalServicesOutlined
                                sx={{
                                    color: "#0B8793",
                                    fontSize: 38,
                                }}
                            />

                            <Typography
                                fontSize={30}
                                fontWeight={900}
                                mt={3}
                            >
                                Find doctors
                            </Typography>

                            <Typography
                                mt={1}
                                color="text.secondary"
                                lineHeight={1.7}
                            >
                                Search doctors by specialization,
                                department and hospital.
                            </Typography>

                            <Button
                                variant="contained"
                                onClick={() =>
                                    navigate("/doctors")
                                }
                                sx={{
                                    mt: 3,
                                    bgcolor: colors.pine,
                                    "&:hover": { bgcolor: colors.pineDeep },
                                }}
                            >
                                Explore Doctors
                            </Button>
                        </Card>
                    </Box>
                </Container>
            </Box>

            {/* HOW IT WORKS */}

            <Box
                id="about"
                sx={{
                    py: 11,
                    bgcolor: "#fff",
                }}
            >
                <Container maxWidth="lg">
                    <Box textAlign="center">
                        <Typography
                            sx={{
                                fontSize: {
                                    xs: 34,
                                    md: 50,
                                },
                                fontWeight: 900,
                            }}
                        >
                            Simple by design.
                        </Typography>

                        <Typography
                            mt={1.5}
                            color="text.secondary"
                        >
                            The journey from finding care to getting
                            it should be simple.
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            mt: 6,
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "1fr 1fr",
                                md: "repeat(4,1fr)",
                            },
                            gap: 2,
                        }}
                    >
                        {[
                            {
                                n: "01",
                                title: "Search",
                                text: "Find hospitals, doctors or departments.",
                            },
                            {
                                n: "02",
                                title: "Understand",
                                text: "Use AI guidance to find the right care path.",
                            },
                            {
                                n: "03",
                                title: "Choose",
                                text: "Compare healthcare options.",
                            },
                            {
                                n: "04",
                                title: "Book",
                                text: "Schedule your appointment.",
                            },
                        ].map((item) => (
                            <Card
                                key={item.n}
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: 4,
                                    border:
                                        "1px solid #E2EDF0",
                                }}
                            >
                                <Typography
                                    color="primary.main"
                                    fontWeight={900}
                                >
                                    {item.n}
                                </Typography>

                                <Typography
                                    fontSize={22}
                                    fontWeight={900}
                                    mt={2.5}
                                >
                                    {item.title}
                                </Typography>

                                <Typography
                                    mt={1}
                                    color="text.secondary"
                                    lineHeight={1.7}
                                >
                                    {item.text}
                                </Typography>

                                <CheckCircle
                                    sx={{
                                        mt: 2.5,
                                        color: "#65B979",
                                    }}
                                />
                            </Card>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* EMERGENCY */}

            <Box
                id="emergency"
                sx={{
                    py: 9,
                    bgcolor: "#FFF5F5",
                }}
            >
                <Container maxWidth="lg">
                    <Box
                        sx={{
                            p: {
                                xs: 3,
                                md: 5,
                            },
                            borderRadius: 5,
                            bgcolor: "#fff",
                            border:
                                "1px solid #FFE0E0",
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                md: "1fr auto",
                            },
                            gap: 3,
                            alignItems: "center",
                        }}
                    >
                        <Box>
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                            >
                                <EmergencyOutlined
                                    sx={{
                                        color: "#D95C5C",
                                    }}
                                />

                                <Typography
                                    fontWeight={900}
                                    color="#C84A4A"
                                >
                                    EMERGENCY HELP
                                </Typography>
                            </Stack>

                            <Typography
                                fontSize={{
                                    xs: 28,
                                    md: 38,
                                }}
                                fontWeight={900}
                                mt={1}
                                color="#102F42"
                            >
                                Need urgent medical
                                assistance?
                            </Typography>

                            <Typography
                                mt={1}
                                color="text.secondary"
                                maxWidth={650}
                                lineHeight={1.7}
                            >
                                SmartCare will connect patients with
                                emergency ambulance support and the
                                appropriate hospital.
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<EmergencyOutlined />}
                            onClick={() =>
                                navigate("/emergency")
                            }
                            sx={{
                                px: 3,
                                py: 1.5,
                            }}
                        >
                            Get Emergency Help
                        </Button>
                    </Box>
                </Container>
            </Box>

            {/* CTA */}

            <Container maxWidth="lg" sx={{ py: 10 }}>
                <Box
                    sx={{
                        p: {
                            xs: 4,
                            md: 7,
                        },
                        borderRadius: 6,
                        bgcolor: "#0B8793",
                        color: "#fff",
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            md: "1fr auto",
                        },
                        gap: 3,
                        alignItems: "center",
                    }}
                >
                    <Box>
                        <Typography
                            fontSize={{
                                xs: 30,
                                md: 42,
                            }}
                            fontWeight={900}
                        >
                            Better care starts with
                            better connection.
                        </Typography>

                        <Typography
                            mt={1.5}
                            color="rgba(255,255,255,.76)"
                        >
                            Create your SmartCare account today.
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        size="large"
                        endIcon={<ArrowForward />}
                        onClick={() =>
                            navigate("/register")
                        }
                        sx={{
                            bgcolor: "#fff",
                            color: "#0B8793",
                            px: 3,
                            "&:hover": {
                                bgcolor: "#F4FFFF",
                            },
                        }}
                    >
                        Create Account
                    </Button>
                </Box>
            </Container>

            <Footer />
        </Box>
    );
}

export default Home;