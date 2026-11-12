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
                    bgcolor: colors.navy,
                    color: colors.white,
                    borderBottom: `1px solid ${colors.hairlineOnDark}`,
                    backdropFilter: "blur(16px)",
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
                                    fontFamily: "Inter, sans-serif",
                                    fontWeight: 750,
                                    fontSize: { xs: 20, md: 22 },
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
                                    color: "#5EEAD4",
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
                                        bgcolor: active ? "rgba(13,148,136,0.22)" : "transparent",
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
                                bgcolor: colors.pine,
                                color: colors.white,
                                fontWeight: 800,
                                fontSize: 13.5,
                                px: 2,
                                py: 0.85,
                                borderRadius: 2.2,
                                textTransform: "none",
                                boxShadow: "0 4px 12px rgba(13,148,136,0.22)",
                                "&:hover": {
                                    bgcolor: colors.pineDeep,
                                    boxShadow: "0 6px 18px rgba(13,148,136,0.3)",
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
                sx={{
                    zIndex: (theme) => theme.zIndex.modal + 10,
                    "& .MuiDrawer-paper": {
                        width: { xs: "86%", sm: 360 },
                        bgcolor: "#FFFFFF !important",
                        color: "#0F172A !important",
                        p: 3,
                        boxSizing: "border-box",
                        boxShadow: "-12px 0 36px rgba(16,42,67,0.18)",
                    },
                }}
            >
                {/* DRAWER TOP HEADER */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                        <Box
                            sx={{
                                width: 38,
                                height: 38,
                                borderRadius: 2.2,
                                display: "grid",
                                placeItems: "center",
                                bgcolor: colors.pine,
                                color: colors.white,
                                boxShadow: "0 4px 12px rgba(13,148,136,0.25)",
                            }}
                        >
                            <LocalHospitalOutlined fontSize="small" />
                        </Box>
                        <Box>
                            <Typography
                                sx={{
                                    fontFamily: "Inter, sans-serif",
                                    fontWeight: 800,
                                    fontSize: 20,
                                    lineHeight: 1.1,
                                    color: "#0F172A",
                                }}
                            >
                                SmartCare
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: 8.5,
                                    letterSpacing: 1.5,
                                    fontWeight: 800,
                                    color: colors.pine,
                                }}
                            >
                                HEALTHCARE PLATFORM
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton
                        onClick={() => setMobileOpen(false)}
                        sx={{
                            color: "#64748B",
                            bgcolor: "#F1F5F9",
                            "&:hover": { bgcolor: "#E2E8F0", color: "#0F172A" },
                        }}
                        size="small"
                    >
                        <CloseOutlined fontSize="small" />
                    </IconButton>
                </Box>

                <Divider sx={{ borderColor: "#E2E8F0", mb: 2.5 }} />

                {/* 24/7 EMERGENCY CARD */}
                <Box
                    onClick={() => handleNavigate("/emergency")}
                    sx={{
                        p: 2,
                        mb: 2.5,
                        borderRadius: 2.5,
                        bgcolor: "#FEF2F2",
                        border: "1px solid #FECACA",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        transition: "all 0.15s ease",
                        "&:hover": {
                            bgcolor: "#FEE2E2",
                            borderColor: "#FCA5A5",
                        },
                    }}
                >
                    <EmergencyOutlined sx={{ color: "#DC2626", fontSize: 28 }} />
                    <Box>
                        <Typography fontWeight={800} fontSize={14} color="#991B1B">
                            24/7 Emergency Care
                        </Typography>
                        <Typography fontSize={11.5} color="#64748B" fontWeight={500}>
                            Immediate medical response & dispatch
                        </Typography>
                    </Box>
                </Box>

                {/* NAVIGATION LIST */}
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
                                    py: 1.1,
                                    px: 1.5,
                                    bgcolor: active ? "#F0FDFA" : "transparent",
                                    border: active ? "1px solid #CCFBF1" : "1px solid transparent",
                                    color: active ? "#0F766E" : "#1E293B",
                                    transition: "all 0.15s ease",
                                    "&:hover": {
                                        bgcolor: active ? "#E6FFFA" : "#F8FAFC",
                                        color: active ? "#0F766E" : "#0F172A",
                                    },
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        color: active ? "#0D9488" : "#64748B",
                                        minWidth: 36,
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        fontWeight: active ? 800 : 650,
                                        fontSize: 14.5,
                                    }}
                                />
                            </ListItemButton>
                        );
                    })}
                </List>

                <Divider sx={{ borderColor: "#E2E8F0", mb: 3 }} />

                {/* ACTION BUTTONS */}
                <Stack spacing={1.5}>
                    <Button
                        variant="contained"
                        fullWidth
                        startIcon={<CalendarMonthOutlined />}
                        onClick={() => handleNavigate("/book-appointment")}
                        sx={{
                            bgcolor: colors.pine,
                            color: colors.white,
                            py: 1.25,
                            fontWeight: 800,
                            fontSize: 14,
                            borderRadius: 2.2,
                            boxShadow: "0 4px 14px rgba(13,148,136,0.25)",
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
                            borderColor: "#CBD5E1",
                            color: "#0F172A",
                            py: 1.15,
                            fontWeight: 750,
                            fontSize: 14,
                            borderRadius: 2.2,
                            "&:hover": {
                                borderColor: "#94A3B8",
                                bgcolor: "#F8FAFC",
                            },
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
                            bgcolor: "#102A43",
                            color: colors.white,
                            py: 1.2,
                            fontWeight: 800,
                            fontSize: 14,
                            borderRadius: 2.2,
                            "&:hover": { bgcolor: "#0B2033" },
                        }}
                    >
                        Create Account
                    </Button>
                </Stack>
            </Drawer>
        </>
    );
}
