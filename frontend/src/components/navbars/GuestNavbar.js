import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    AppBar,
    Box,
    Button,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Stack,
    Toolbar,
    Typography,
} from "@mui/material";
import {
    CalendarMonthOutlined,
    CloseOutlined,
    EmergencyOutlined,
    HomeOutlined,
    LocalHospitalOutlined,
    LoginOutlined,
    MedicalServicesOutlined,
    MenuOutlined,
    PersonAddOutlined,
} from "@mui/icons-material";
import { colors } from "../../theme/colors";

export default function GuestNavbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const navLinks = [
        { label: "Home", path: "/", icon: <HomeOutlined fontSize="small" /> },
        { label: "Hospitals", path: "/hospitals", icon: <LocalHospitalOutlined fontSize="small" /> },
        { label: "Doctors", path: "/doctors", icon: <MedicalServicesOutlined fontSize="small" /> },
        { label: "Services", path: "/services", icon: <MedicalServicesOutlined fontSize="small" /> },
    ];

    const isActive = (path) => {
        if (path === "/") return location.pathname === "/";
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    const handleNavigate = (path) => {
        setMobileOpen(false);
        navigate(path);
    };

    return (
        <>
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    bgcolor: colors.ink,
                    color: colors.white,
                    borderBottom: `1px solid ${colors.hairlineOnDark}`,
                    backdropFilter: "blur(16px)",
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                }}
            >
                <Toolbar
                    sx={{
                        minHeight: { xs: 64, md: 74 },
                        px: { xs: 2, sm: 3, lg: 5 },
                        width: "100%",
                        justifyContent: "space-between",
                    }}
                >
                    {/* LOGO */}
                    <Box
                        onClick={() => handleNavigate("/")}
                        sx={{
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 1.4,
                            userSelect: "none",
                        }}
                    >
                        <Box
                            sx={{
                                width: { xs: 38, md: 42 },
                                height: { xs: 38, md: 42 },
                                borderRadius: 2.5,
                                display: "grid",
                                placeItems: "center",
                                bgcolor: colors.pine,
                                color: colors.white,
                                boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
                            }}
                        >
                            <LocalHospitalOutlined fontSize="small" />
                        </Box>
                        <Box>
                            <Typography
                                sx={{
                                    fontFamily: "'Newsreader', serif",
                                    fontStyle: "italic",
                                    fontWeight: 600,
                                    fontSize: { xs: 21, md: 25 },
                                    lineHeight: 1,
                                    color: colors.white,
                                }}
                            >
                                SmartCare
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: 8.5,
                                    letterSpacing: 2,
                                    fontWeight: 800,
                                    color: colors.amber,
                                    display: { xs: "none", sm: "block" },
                                    mt: 0.3,
                                }}
                            >
                                HEALTHCARE PLATFORM
                            </Typography>
                        </Box>
                    </Box>

                    {/* DESKTOP NAV LINKS */}
                    <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                        sx={{ display: { xs: "none", md: "flex" } }}
                    >
                        {navLinks.map((item) => {
                            const active = isActive(item.path);
                            return (
                                <Button
                                    key={item.path}
                                    onClick={() => handleNavigate(item.path)}
                                    sx={{
                                        px: 1.6,
                                        py: 0.9,
                                        borderRadius: 2,
                                        color: active ? colors.white : "rgba(243,245,240,0.74)",
                                        bgcolor: active ? "rgba(113,233,223,0.12)" : "transparent",
                                        fontWeight: active ? 800 : 500,
                                        fontSize: 14,
                                        textTransform: "none",
                                        "&:hover": {
                                            color: colors.white,
                                            bgcolor: "rgba(255,255,255,0.08)",
                                        },
                                    }}
                                >
                                    {item.label}
                                </Button>
                            );
                        })}
                    </Stack>

                    {/* RIGHT ACTIONS */}
                    <Stack direction="row" spacing={1.2} alignItems="center">
                        {/* EMERGENCY BUTTON */}
                        <Button
                            startIcon={<EmergencyOutlined fontSize="small" />}
                            onClick={() => handleNavigate("/emergency")}
                            sx={{
                                color: "#F78D78",
                                fontWeight: 700,
                                fontSize: 13,
                                px: 1.5,
                                py: 0.8,
                                borderRadius: 2,
                                border: "1px solid rgba(247,141,120,0.35)",
                                textTransform: "none",
                                display: { xs: "none", sm: "inline-flex" },
                                "&:hover": {
                                    bgcolor: "rgba(247,141,120,0.12)",
                                    borderColor: "#F78D78",
                                },
                            }}
                        >
                            Emergency
                        </Button>

                        {/* BOOK APPOINTMENT CTA */}
                        <Button
                            variant="outlined"
                            startIcon={<CalendarMonthOutlined fontSize="small" />}
                            onClick={() => handleNavigate("/book-appointment")}
                            sx={{
                                borderColor: "rgba(243,245,240,0.3)",
                                color: colors.white,
                                fontWeight: 700,
                                fontSize: 13,
                                px: 1.8,
                                py: 0.8,
                                borderRadius: 2.2,
                                textTransform: "none",
                                display: { xs: "none", lg: "inline-flex" },
                                "&:hover": {
                                    borderColor: colors.white,
                                    bgcolor: "rgba(255,255,255,0.06)",
                                },
                            }}
                        >
                            Book Appointment
                        </Button>

                        {/* LOGIN BUTTON */}
                        <Button
                            onClick={() => handleNavigate("/login")}
                            startIcon={<LoginOutlined fontSize="small" />}
                            sx={{
                                color: "rgba(243,245,240,0.9)",
                                fontWeight: 700,
                                fontSize: 13.5,
                                px: 1.6,
                                py: 0.8,
                                borderRadius: 2,
                                textTransform: "none",
                                display: { xs: "none", sm: "inline-flex" },
                                "&:hover": {
                                    color: colors.white,
                                    bgcolor: "rgba(255,255,255,0.08)",
                                },
                            }}
                        >
                            Sign In
                        </Button>

                        {/* REGISTER / GET STARTED BUTTON */}
                        <Button
                            variant="contained"
                            onClick={() => handleNavigate("/register")}
                            sx={{
                                bgcolor: colors.amber,
                                color: colors.ink,
                                fontWeight: 800,
                                fontSize: 13.5,
                                px: 2,
                                py: 0.85,
                                borderRadius: 2.2,
                                textTransform: "none",
                                boxShadow: "0 4px 12px rgba(214,138,60,0.25)",
                                "&:hover": {
                                    bgcolor: colors.amberDeep,
                                    boxShadow: "0 6px 18px rgba(214,138,60,0.35)",
                                },
                            }}
                        >
                            Register
                        </Button>

                        {/* MOBILE MENU TOGGLE */}
                        <IconButton
                            onClick={() => setMobileOpen(true)}
                            sx={{
                                color: colors.white,
                                display: { xs: "inline-flex", md: "none" },
                                ml: 0.5,
                            }}
                        >
                            <MenuOutlined />
                        </IconButton>
                    </Stack>
                </Toolbar>
            </AppBar>

            {/* MOBILE DRAWER */}
            <Drawer
                anchor="right"
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                PaperProps={{
                    sx: {
                        width: { xs: "85%", sm: 360 },
                        bgcolor: colors.ink,
                        color: colors.white,
                        p: 3,
                    },
                }}
            >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 2,
                                display: "grid",
                                placeItems: "center",
                                bgcolor: colors.pine,
                                color: colors.white,
                            }}
                        >
                            <LocalHospitalOutlined fontSize="small" />
                        </Box>
                        <Typography
                            sx={{
                                fontFamily: "'Newsreader', serif",
                                fontStyle: "italic",
                                fontWeight: 600,
                                fontSize: 22,
                                color: colors.white,
                            }}
                        >
                            SmartCare
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setMobileOpen(false)} sx={{ color: colors.white }}>
                        <CloseOutlined />
                    </IconButton>
                </Box>

                <Divider sx={{ borderColor: colors.hairlineOnDark, mb: 2 }} />

                {/* QUICK EMERGENCY CARD */}
                <Box
                    onClick={() => handleNavigate("/emergency")}
                    sx={{
                        p: 2,
                        mb: 2.5,
                        borderRadius: 3,
                        bgcolor: "rgba(178,70,50,0.15)",
                        border: "1px solid rgba(178,70,50,0.35)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                    }}
                >
                    <EmergencyOutlined sx={{ color: "#F78D78", fontSize: 28 }} />
                    <Box>
                        <Typography fontWeight={800} fontSize={14} color="#F78D78">
                            24/7 Emergency Care
                        </Typography>
                        <Typography fontSize={11.5} color="rgba(255,255,255,0.7)">
                            Immediate medical response
                        </Typography>
                    </Box>
                </Box>

                {/* NAV LIST */}
                <List sx={{ p: 0, mb: 3 }}>
                    {navLinks.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <ListItemButton
                                key={item.path}
                                onClick={() => handleNavigate(item.path)}
                                sx={{
                                    borderRadius: 2,
                                    mb: 0.8,
                                    bgcolor: active ? "rgba(255,255,255,0.12)" : "transparent",
                                    color: active ? colors.amber : "rgba(255,255,255,0.85)",
                                }}
                            >
                                <ListItemIcon sx={{ color: "inherit", minWidth: 38 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        fontWeight: active ? 800 : 500,
                                        fontSize: 15,
                                    }}
                                />
                            </ListItemButton>
                        );
                    })}
                </List>

                <Divider sx={{ borderColor: colors.hairlineOnDark, mb: 3 }} />

                {/* ACTION BUTTONS IN DRAWER */}
                <Stack spacing={1.5}>
                    <Button
                        variant="contained"
                        fullWidth
                        startIcon={<CalendarMonthOutlined />}
                        onClick={() => handleNavigate("/book-appointment")}
                        sx={{
                            bgcolor: colors.pine,
                            color: colors.white,
                            py: 1.2,
                            fontWeight: 700,
                            borderRadius: 2.5,
                            "&:hover": { bgcolor: colors.pineDeep },
                        }}
                    >
                        Book Appointment
                    </Button>
                    <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<LoginOutlined />}
                        onClick={() => handleNavigate("/login")}
                        sx={{
                            borderColor: "rgba(255,255,255,0.3)",
                            color: colors.white,
                            py: 1.1,
                            fontWeight: 700,
                            borderRadius: 2.5,
                            "&:hover": { borderColor: colors.white, bgcolor: "rgba(255,255,255,0.06)" },
                        }}
                    >
                        Sign In
                    </Button>
                    <Button
                        variant="contained"
                        fullWidth
                        startIcon={<PersonAddOutlined />}
                        onClick={() => handleNavigate("/register")}
                        sx={{
                            bgcolor: colors.amber,
                            color: colors.ink,
                            py: 1.1,
                            fontWeight: 800,
                            borderRadius: 2.5,
                            "&:hover": { bgcolor: colors.amberDeep },
                        }}
                    >
                        Create Account
                    </Button>
                </Stack>
            </Drawer>
        </>
    );
}
