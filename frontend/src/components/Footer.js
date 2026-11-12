import { useNavigate } from "react-router-dom";

import { Box, Button, Container, Divider, IconButton, Stack, Typography } from "@mui/material";
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

const supportEmail = "smartcareai.admin@gmail.com";
const supportPhone = "+91 99999 88888";

const contactLinkSx = {
    display: "flex",
    alignItems: "center",
    gap: 1.2,
    p: 1.25,
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 2,
    textDecoration: "none",
    color: colors.white,
    transition: "background-color .2s ease, border-color .2s ease, transform .2s ease",
    "&:hover": {
        bgcolor: "rgba(255,255,255,.07)",
        borderColor: "rgba(94,234,212,.58)",
        transform: "translateY(-1px)",
    },
};

function Footer() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const go = (path) => {
        navigate(path);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const dashboardPath = () => {
        if (!user?.role) return "/login";
        if (user.role === "admin") return "/admin";
        if (user.role === "hospital") return "/hospital";
        return "/patient";
    };

    const profilePath = () => {
        if (!user?.role) return "/login";
        if (user.role === "hospital") return "/hospital/profile";
        if (user.role === "patient") return "/patient/profile";
        return "/admin";
    };

    const exploreLinks = [
        { label: "Home", path: "/" },
        { label: "Hospitals", path: "/hospitals" },
        { label: "Doctors", path: "/doctors" },
        { label: "Departments", path: "/departments" },
        { label: "Services", path: "/services" },
    ];

    const linkButtonSx = {
        justifyContent: "flex-start",
        width: "fit-content",
        minWidth: 0,
        p: 0,
        color: "rgba(255,255,255,.66)",
        fontSize: 13.5,
        fontWeight: 500,
        textTransform: "none",
        "&:hover": {
            color: colors.white,
            bgcolor: "transparent",
            transform: "translateX(3px)",
        },
    };

    return (
        <Box
            component="footer"
            sx={{
                mt: "auto",
                color: colors.white,
                background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.ink} 55%, #18375D 100%)`,
            }}
        >
            <Container maxWidth="xl" sx={{ px: { xs: 2.5, sm: 4, lg: 6 } }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: { xs: "flex-start", md: "center" },
                        justifyContent: "space-between",
                        flexDirection: { xs: "column", md: "row" },
                        gap: 2,
                        py: 2,
                        borderBottom: "1px solid rgba(255,255,255,.12)",
                    }}
                >
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                        <Box sx={{ display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: "50%", bgcolor: "rgba(13,148,136,.22)", color: "#5EEAD4" }}>
                            <EmergencyOutlined sx={{ fontSize: 19 }} />
                        </Box>
                        <Box>
                            <Typography fontSize={13} fontWeight={800}>Emergency care, when every minute matters.</Typography>
                            <Typography fontSize={12} color="rgba(255,255,255,.62)">Request an ambulance or find urgent care near you.</Typography>
                        </Box>
                    </Stack>
                    <Button
                        onClick={() => go("/emergency")}
                        startIcon={<EmergencyOutlined />}
                        sx={{ px: 2.2, py: 0.85, borderRadius: 2, bgcolor: colors.brick, color: colors.white, fontSize: 12.5, fontWeight: 800, textTransform: "none", whiteSpace: "nowrap", width: { xs: "100%", sm: "auto" }, "&:hover": { bgcolor: colors.brickDeep } }}
                    >
                        Get emergency help
                    </Button>
                </Box>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1.35fr 1fr", lg: "1.5fr .9fr .8fr 1.35fr" },
                        gap: { xs: 4, sm: 5, lg: 7 },
                        py: { xs: 5, md: 6 },
                    }}
                >
                    <Box>
                        <Stack direction="row" spacing={1.35} alignItems="center">
                            <Box sx={{ display: "grid", placeItems: "center", width: 46, height: 46, borderRadius: 2.5, bgcolor: colors.pine, boxShadow: "0 10px 24px rgba(13,148,136,.26)" }}>
                                <LocalHospitalOutlined sx={{ fontSize: 25 }} />
                            </Box>
                            <Box>
                                <Typography fontSize={23} lineHeight={1} fontWeight={850} letterSpacing="-.6px">SmartCare</Typography>
                                <Typography mt={0.5} fontSize={9} fontWeight={800} letterSpacing="1.5px" color="#5EEAD4">HEALTHCARE PLATFORM</Typography>
                            </Box>
                        </Stack>
                        <Typography mt={2.25} maxWidth={335} fontSize={13.5} lineHeight={1.8} color="rgba(255,255,255,.68)">
                            Connected care for patients, hospitals, doctors, and emergency teams—designed to make every healthcare journey simpler.
                        </Typography>
                        <Button endIcon={<ArrowForward fontSize="small" />} onClick={() => go("/hospitals")} sx={{ ...linkButtonSx, mt: 1.75, color: "#5EEAD4", fontWeight: 750 }}>
                            Explore hospitals
                        </Button>
                    </Box>

                    <Box>
                        <Typography fontSize={12} fontWeight={850} letterSpacing=".8px" textTransform="uppercase" color="#A7F3D0" mb={2}>Explore</Typography>
                        <Stack spacing={1.05}>
                            {exploreLinks.map((link) => (
                                <Button key={link.path} onClick={() => go(link.path)} sx={linkButtonSx}>{link.label}</Button>
                            ))}
                        </Stack>
                    </Box>

                    <Box>
                        <Typography fontSize={12} fontWeight={850} letterSpacing=".8px" textTransform="uppercase" color="#A7F3D0" mb={2}>Account</Typography>
                        <Stack spacing={1.05}>
                            {user ? (
                                <>
                                    <Button onClick={() => go(dashboardPath())} sx={linkButtonSx}>Dashboard</Button>
                                    <Button onClick={() => go(profilePath())} sx={linkButtonSx}>Profile</Button>
                                </>
                            ) : (
                                <>
                                    <Button onClick={() => go("/login")} sx={linkButtonSx}>Sign in</Button>
                                    <Button onClick={() => go("/register")} sx={linkButtonSx}>Create account</Button>
                                </>
                            )}
                        </Stack>
                    </Box>

                    <Box>
                        <Typography fontSize={12} fontWeight={850} letterSpacing=".8px" textTransform="uppercase" color="#A7F3D0" mb={2}>Contact & support</Typography>
                        <Typography fontSize={13.5} lineHeight={1.7} color="rgba(255,255,255,.68)" mb={2}>
                            Our support team is here around the clock for urgent care coordination.
                        </Typography>
                        <Stack spacing={1.1}>
                            <Box component="a" href="tel:+919999988888" sx={contactLinkSx}>
                                <PhoneOutlined sx={{ color: "#5EEAD4", fontSize: 19 }} />
                                <Box>
                                    <Typography fontSize={11} color="rgba(255,255,255,.55)">24×7 emergency helpline</Typography>
                                    <Typography fontSize={13.5} fontWeight={750}>{supportPhone}</Typography>
                                </Box>
                            </Box>
                            <Box component="a" href={`mailto:${supportEmail}`} aria-label={`Email ${supportEmail}`} sx={contactLinkSx}>
                                <EmailOutlined sx={{ color: "#5EEAD4", fontSize: 19 }} />
                                <Box>
                                    <Typography fontSize={11} color="rgba(255,255,255,.55)">Email support</Typography>
                                    <Typography fontSize={13.5} fontWeight={750}>{supportEmail}</Typography>
                                </Box>
                            </Box>
                        </Stack>
                    </Box>
                </Box>

                <Divider sx={{ borderColor: "rgba(255,255,255,.12)" }} />

                <Box
                    sx={{
                        minHeight: 70,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        flexDirection: { xs: "column-reverse", sm: "row" },
                        py: { xs: 2, sm: 0 },
                    }}
                >
                    <Typography fontSize={12} color="rgba(255,255,255,.54)">© {new Date().getFullYear()} SmartCare AI. All rights reserved.</Typography>
                    <Stack direction="row" spacing={1.3} alignItems="center" sx={{ width: { xs: "100%", sm: "auto" }, justifyContent: { xs: "space-between", sm: "flex-start" } }}>
                        <Typography fontSize={12} color="rgba(255,255,255,.54)">Healthcare, connected better.</Typography>
                        <IconButton
                            aria-label="Back to top"
                            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                            sx={{ width: 34, height: 34, border: "1px solid rgba(255,255,255,.18)", color: colors.white, "&:hover": { bgcolor: colors.pine, borderColor: colors.pine } }}
                        >
                            <KeyboardArrowUp fontSize="small" />
                        </IconButton>
                    </Stack>
                </Box>
            </Container>
        </Box>
    );
}

export default Footer;
