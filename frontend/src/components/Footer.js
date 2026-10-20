import { useNavigate } from "react-router-dom";

import {
    Box,
    Button,
    Container,
    Divider,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";

import {
    ArrowForward,
    EmergencyOutlined,
    KeyboardArrowUp,
    LocalHospitalOutlined,
    EmailOutlined,
    PhoneOutlined,
} from "@mui/icons-material";

import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

function Footer() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const go = (path) => {
        navigate(path);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const scrollTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const dashboardPath = () => {
        if (!user?.role) {
            return "/login";
        }

        if (user.role === "admin") {
            return "/admin";
        }

        if (user.role === "hospital") {
            return "/hospital";
        }

        return "/patient";
    };

    const profilePath = () => {
        if (!user?.role) {
            return "/login";
        }

        if (user.role === "hospital") {
            return "/hospital/profile";
        }

        if (user.role === "patient") {
            return "/patient/profile";
        }

        return "/admin";
    };

    const exploreLinks = [
        {
            label: "Home",
            path: "/",
        },
        {
            label: "Hospitals",
            path: "/hospitals",
        },
        {
            label: "Doctors",
            path: "/doctors",
        },
        {
            label: "Departments",
            path: "/departments",
        },
        {
            label: "Services",
            path: "/services",
        },
    ];

    return (
        <Box
            component="footer"
            sx={{
                bgcolor:
                    colors.ink,
                color:
                    colors.white,

                mt: "auto",
            }}
        >
            <Container
                maxWidth="xl"
                sx={{
                    px: {
                        xs: 2,
                        sm: 3,
                        lg: 5,
                    },
                }}
            >
                {/* TOP SECTION */}
                <Box
                    sx={{
                        py: {
                            xs: 6,
                            md: 8,
                        },

                        display: "grid",

                        gridTemplateColumns:
                            {
                                xs: "1fr",
                                sm: "1fr 1fr",
                                md: "1.6fr 1fr 1fr 1.25fr",
                            },

                        gap: {
                            xs: 4,
                            md: 5,
                        },
                    }}
                >
                    {/* BRAND */}
                    <Box>
                        <Stack
                            direction="row"
                            spacing={1.3}
                            alignItems="center"
                        >
                            <Box
                                sx={{
                                    width: 46,
                                    height: 46,
                                    borderRadius: 3,
                                    bgcolor:
                                        colors.pine,
                                    display:
                                        "grid",
                                    placeItems:
                                        "center",
                                }}
                            >
                                <LocalHospitalOutlined />
                            </Box>

                            <Box>
                                <Typography
                                    sx={{
                                        fontFamily:
                                            "'Newsreader', serif",
                                        fontStyle:
                                            "italic",
                                        fontSize:
                                            26,
                                        lineHeight:
                                            1,
                                        fontWeight:
                                            600,
                                    }}
                                >
                                    SmartCare
                                </Typography>

                                <Typography
                                    fontSize={
                                        8
                                    }
                                    letterSpacing={
                                        1.8
                                    }
                                    fontWeight={
                                        800
                                    }
                                    color={
                                        colors.amber
                                    }
                                    mt={
                                        0.4
                                    }
                                >
                                    HEALTHCARE
                                    PLATFORM
                                </Typography>
                            </Box>
                        </Stack>

                        <Typography
                            mt={2.5}
                            maxWidth={410}
                            color="rgba(243,245,240,.54)"
                            lineHeight={
                                1.8
                            }
                            fontSize={13.5}
                        >
                            SmartCare connects
                            patients, hospitals,
                            doctors and emergency
                            healthcare services in
                            one connected platform.
                        </Typography>

                        <Button
                            endIcon={
                                <ArrowForward fontSize="small" />
                            }
                            onClick={() =>
                                go(
                                    "/hospitals"
                                )
                            }
                            sx={{
                                mt: 2.5,
                                px: 0,

                                color:
                                    colors.amber,

                                fontWeight:
                                    800,

                                textTransform:
                                    "none",

                                "&:hover":
                                    {
                                        bgcolor:
                                            "transparent",
                                        color:
                                            colors.white,
                                    },
                            }}
                        >
                            Explore healthcare
                        </Button>
                    </Box>

                    {/* EXPLORE */}
                    <Box>
                        <Typography
                            fontSize={
                                16
                            }
                            fontWeight={
                                900
                            }
                            mb={2}
                        >
                            Explore
                        </Typography>

                        <Stack
                            spacing={
                                0.8
                            }
                        >
                            {exploreLinks.map(
                                (
                                    link
                                ) => (
                                    <Button
                                        key={
                                            link.path
                                        }
                                        onClick={() =>
                                            go(
                                                link.path
                                            )
                                        }
                                        sx={{
                                            justifyContent:
                                                "flex-start",

                                            p: 0,

                                            minWidth:
                                                0,

                                            color:
                                                "rgba(243,245,240,.54)",

                                            textTransform:
                                                "none",

                                            fontSize:
                                                13.5,

                                            "&:hover":
                                                {
                                                    color:
                                                        colors.amber,

                                                    bgcolor:
                                                        "transparent",
                                                },
                                        }}
                                    >
                                        {
                                            link.label
                                        }
                                    </Button>
                                )
                            )}
                        </Stack>
                    </Box>

                    {/* ACCOUNT */}
                    <Box>
                        <Typography
                            fontSize={
                                16
                            }
                            fontWeight={
                                900
                            }
                            mb={2}
                        >
                            Account
                        </Typography>

                        <Stack
                            spacing={
                                0.8
                            }
                        >
                            {user ? (
                                <>
                                    <Button
                                        onClick={() =>
                                            go(
                                                dashboardPath()
                                            )
                                        }
                                        sx={{
                                            justifyContent:
                                                "flex-start",
                                            p: 0,
                                            color:
                                                "rgba(243,245,240,.54)",
                                            textTransform:
                                                "none",
                                            fontSize:
                                                13.5,
                                            "&:hover":
                                                {
                                                    color:
                                                        colors.amber,
                                                    bgcolor:
                                                        "transparent",
                                                },
                                        }}
                                    >
                                        Dashboard
                                    </Button>

                                    <Button
                                        onClick={() =>
                                            go(
                                                profilePath()
                                            )
                                        }
                                        sx={{
                                            justifyContent:
                                                "flex-start",
                                            p: 0,
                                            color:
                                                "rgba(243,245,240,.54)",
                                            textTransform:
                                                "none",
                                            fontSize:
                                                13.5,
                                            "&:hover":
                                                {
                                                    color:
                                                        colors.amber,
                                                    bgcolor:
                                                        "transparent",
                                                },
                                        }}
                                    >
                                        Profile
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        onClick={() =>
                                            go(
                                                "/login"
                                            )
                                        }
                                        sx={{
                                            justifyContent:
                                                "flex-start",
                                            p: 0,
                                            color:
                                                "rgba(243,245,240,.54)",
                                            textTransform:
                                                "none",
                                            fontSize:
                                                13.5,
                                            "&:hover":
                                                {
                                                    color:
                                                        colors.amber,
                                                    bgcolor:
                                                        "transparent",
                                                },
                                        }}
                                    >
                                        Login
                                    </Button>

                                    <Button
                                        onClick={() =>
                                            go(
                                                "/register"
                                            )
                                        }
                                        sx={{
                                            justifyContent:
                                                "flex-start",
                                            p: 0,
                                            color:
                                                "rgba(243,245,240,.54)",
                                            textTransform:
                                                "none",
                                            fontSize:
                                                13.5,
                                            "&:hover":
                                                {
                                                    color:
                                                        colors.amber,
                                                    bgcolor:
                                                        "transparent",
                                                },
                                        }}
                                    >
                                        Register
                                    </Button>
                                </>
                            )}
                        </Stack>
                    </Box>

                    {/* EMERGENCY */}
                    <Box>
                        <Typography
                            fontSize={
                                16
                            }
                            fontWeight={
                                900
                            }
                            mb={2}
                        >
                            Need urgent help?
                        </Typography>

                        <Typography
                            fontSize={
                                13
                            }
                            color="rgba(243,245,240,.54)"
                            lineHeight={
                                1.7
                            }
                        >
                            Access emergency assistance
                            and ambulance request
                            services.
                        </Typography>

                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={
                                <EmergencyOutlined />
                            }
                            onClick={() =>
                                go(
                                    "/emergency"
                                )
                            }
                            sx={{
                                mt: 2,

                                py: 1.25,

                                bgcolor:
                                    colors.brick,

                                color:
                                    colors.white,

                                fontWeight:
                                    800,

                                textTransform:
                                    "none",

                                borderRadius:
                                    2.5,

                                boxShadow:
                                    "none",

                                "&:hover":
                                    {
                                        bgcolor:
                                            colors.brickDeep,
                                    },
                            }}
                        >
                            Emergency Help
                        </Button>

                        {/* CONTACT */}
                        <Stack spacing={1.5} mt={2.5}>
                            <Box
                                component="a"
                                href="tel:+919999988888"
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.2,
                                    textDecoration: "none",
                                    color: "rgba(243,245,240,.75)",
                                    transition: "color 0.2s",
                                    "&:hover": { color: colors.amber },
                                }}
                            >
                                <PhoneOutlined sx={{ fontSize: 18, color: colors.amber }} />
                                <Typography fontSize={13} fontWeight={500}>
                                    +91 99999 88888 (24x7 Helpline)
                                </Typography>
                            </Box>

                            <Box
                                component="a"
                                href="mailto:smartcareai.admin@gmail.com"
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.2,
                                    textDecoration: "none",
                                    color: "rgba(243,245,240,.75)",
                                    transition: "color 0.2s",
                                    "&:hover": { color: colors.amber },
                                }}
                            >
                                <EmailOutlined sx={{ fontSize: 18, color: colors.amber }} />
                                <Typography fontSize={13} fontWeight={600}>
                                    smartcareai.admin@gmail.com
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>
                </Box>

                {/* DIVIDER */}
                <Divider
                    sx={{
                        borderColor:
                            "rgba(243,245,240,.09)",
                    }}
                />

                {/* BOTTOM */}
                <Box
                    sx={{
                        py: 2.5,

                        display: "flex",

                        justifyContent:
                            "space-between",

                        alignItems:
                            "center",

                        gap: 2,

                        flexDirection: {
                            xs: "column",
                            sm: "row",
                        },
                    }}
                >
                    <Typography
                        fontSize={
                            11.5
                        }
                        color="rgba(243,245,240,.36)"
                    >
                        © 2026 SmartCare AI —
                        Hospital Management
                        System
                    </Typography>

                    <Stack
                        direction="row"
                        spacing={
                            1
                        }
                        alignItems="center"
                    >
                        <Typography
                            fontSize={
                                11
                            }
                            color="rgba(243,245,240,.34)"
                        >
                            Healthcare,
                            connected better.
                        </Typography>

                        <IconButton
                            onClick={
                                scrollTop
                            }
                            aria-label="Back to top"
                            sx={{
                                width: 36,
                                height: 36,

                                bgcolor:
                                    colors.amber,

                                color:
                                    colors.ink,

                                borderRadius:
                                    2.5,

                                "&:hover":
                                    {
                                        bgcolor:
                                            colors.amberDeep,
                                    },
                            }}
                        >
                            <KeyboardArrowUp
                                fontSize="small"
                            />
                        </IconButton>
                    </Stack>
                </Box>
            </Container>
        </Box>
    );
}

export default Footer;