import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    AppBar,
    Avatar,
    Badge,
    Box,
    Button,
    Chip,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Stack,
    Toolbar,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    CalendarMonthOutlined,
    CloseOutlined,
    DashboardOutlined,
    DescriptionOutlined,
    EmergencyOutlined,
    LocalHospitalOutlined,
    LogoutOutlined,
    MedicalServicesOutlined,
    MenuOutlined,
    NotificationsOutlined,
    PersonOutlineOutlined,
    PsychologyOutlined,
    RateReviewOutlined,
} from "@mui/icons-material";
import { colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";

export default function PatientNavbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const isProfileMenuOpen = Boolean(anchorEl);

    const navLinks = [
        { label: "Dashboard", path: "/patient", icon: <DashboardOutlined fontSize="small" /> },
        { label: "Doctors", path: "/doctors", icon: <MedicalServicesOutlined fontSize="small" /> },
        { label: "Hospitals", path: "/hospitals", icon: <LocalHospitalOutlined fontSize="small" /> },
        { label: "Appointments", path: "/patient/appointments", icon: <CalendarMonthOutlined fontSize="small" /> },
        { label: "Reports", path: "/patient/reports", icon: <DescriptionOutlined fontSize="small" /> },
        { label: "Clinical Assistant", path: "/patient/ai", icon: <PsychologyOutlined fontSize="small" /> },
        { label: "Emergency", path: "/patient/emergency", icon: <EmergencyOutlined fontSize="small" /> },
    ];

    const isActive = (path) => {
        if (path === "/") return location.pathname === "/";
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    const handleNavigate = (path) => {
        setMobileOpen(false);
        setAnchorEl(null);
        navigate(path);
    };

    const handleLogout = () => {
        setAnchorEl(null);
        setMobileOpen(false);
        logout();
        navigate("/");
    };

    const initial = (user?.fullName || user?.email || "P").trim().charAt(0).toUpperCase();

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
                    {/* BRAND WITH PATIENT PORTAL BADGE */}
                    <Box
                        onClick={() => handleNavigate("/patient")}
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
                            <Stack direction="row" alignItems="center" spacing={1}>
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
                                <Chip
                                    label="Patient"
                                    size="small"
                                    sx={{
                                        height: 20,
                                        fontSize: 10,
                                        fontWeight: 800,
                                        letterSpacing: 0.8,
                                        bgcolor: "rgba(113,233,223,0.16)",
                                        color: "#71E9DF",
                                        border: "1px solid rgba(113,233,223,0.3)",
                                    }}
                                />
                            </Stack>
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
                                        px: 1.4,
                                        py: 0.8,
                                        borderRadius: 2,
                                        color: active ? colors.white : "rgba(243,245,240,0.72)",
                                        bgcolor: active ? "rgba(113,233,223,0.12)" : "transparent",
                                        fontWeight: active ? 800 : 500,
                                        fontSize: 13.5,
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

                    {/* RIGHT ACTIONS FOR PATIENT */}
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        {/* PROMINENT BOOK APPOINTMENT CTA BUTTON */}
                        <Button
                            variant="contained"
                            startIcon={<CalendarMonthOutlined fontSize="small" />}
                            onClick={() => handleNavigate("/book-appointment")}
                            sx={{
                                bgcolor: colors.amber,
                                color: colors.ink,
                                fontWeight: 800,
                                fontSize: 13.5,
                                px: 2.2,
                                py: 0.9,
                                borderRadius: 2.2,
                                textTransform: "none",
                                boxShadow: "0 4px 14px rgba(214,138,60,0.3)",
                                "&:hover": {
                                    bgcolor: colors.amberDeep,
                                    boxShadow: "0 6px 20px rgba(214,138,60,0.45)",
                                },
                            }}
                        >
                            Book Appointment
                        </Button>

                        {/* DASHBOARD LINK BUTTON */}
                        <Button
                            startIcon={<DashboardOutlined fontSize="small" />}
                            onClick={() => handleNavigate("/patient")}
                            sx={{
                                color: "rgba(243,245,240,0.85)",
                                fontWeight: 600,
                                fontSize: 13.5,
                                px: 1.5,
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
                            Dashboard
                        </Button>

                        {/* NOTIFICATIONS BELL */}
                        <Tooltip title="Notifications">
                            <IconButton
                                onClick={() => handleNavigate("/patient/notifications")}
                                sx={{
                                    color: "rgba(243,245,240,0.85)",
                                    "&:hover": { color: colors.white, bgcolor: "rgba(255,255,255,0.08)" },
                                }}
                            >
                                <Badge color="warning" variant="dot">
                                    <NotificationsOutlined />
                                </Badge>
                            </IconButton>
                        </Tooltip>

                        {/* PATIENT PROFILE MENU */}
                        <Tooltip title="Account menu">
                            <Box
                                onClick={(e) => setAnchorEl(e.currentTarget)}
                                sx={{
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.2,
                                    p: 0.6,
                                    pr: 1.5,
                                    borderRadius: 3,
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    bgcolor: "rgba(255,255,255,0.04)",
                                    "&:hover": {
                                        bgcolor: "rgba(255,255,255,0.09)",
                                        borderColor: "rgba(255,255,255,0.22)",
                                    },
                                }}
                            >
                                <Avatar
                                    sx={{
                                        width: 34,
                                        height: 34,
                                        bgcolor: colors.pine,
                                        color: colors.white,
                                        fontWeight: 800,
                                        fontSize: 14,
                                    }}
                                >
                                    {initial}
                                </Avatar>
                                <Box sx={{ display: { xs: "none", md: "block" }, textAlign: "left" }}>
                                    <Typography fontSize={13} fontWeight={700} lineHeight={1.2} noWrap sx={{ maxWidth: 120 }}>
                                        {user?.fullName || "Patient"}
                                    </Typography>
                                    <Typography fontSize={10.5} color="rgba(255,255,255,0.6)" lineHeight={1}>
                                        Patient Account
                                    </Typography>
                                </Box>
                            </Box>
                        </Tooltip>

                        {/* PROFILE MENU DROPDOWN */}
                        <Menu
                            anchorEl={anchorEl}
                            open={isProfileMenuOpen}
                            onClose={() => setAnchorEl(null)}
                            PaperProps={{
                                sx: {
                                    mt: 1.5,
                                    minWidth: 240,
                                    borderRadius: 3,
                                    p: 1,
                                    bgcolor: "#FFFFFF",
                                    boxShadow: "0 12px 36px rgba(0,0,0,0.15)",
                                    border: `1px solid ${colors.hairline}`,
                                },
                            }}
                            transformOrigin={{ horizontal: "right", vertical: "top" }}
                            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                        >
                            <Box sx={{ px: 2, py: 1.5 }}>
                                <Typography fontWeight={800} fontSize={14.5} color={colors.ink}>
                                    {user?.fullName || "Patient"}
                                </Typography>
                                <Typography fontSize={12} color={colors.slate} noWrap>
                                    {user?.email || ""}
                                </Typography>
                                <Chip
                                    size="small"
                                    label="Active Patient"
                                    sx={{
                                        mt: 1,
                                        height: 22,
                                        fontSize: 10.5,
                                        fontWeight: 700,
                                        bgcolor: colors.pineSoft,
                                        color: colors.pineDeep,
                                    }}
                                />
                            </Box>

                            <Divider sx={{ my: 1 }} />

                            <MenuItem onClick={() => handleNavigate("/patient")}>
                                <ListItemIcon><DashboardOutlined fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Patient Dashboard" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600 }} />
                            </MenuItem>

                            <MenuItem onClick={() => handleNavigate("/book-appointment")}>
                                <ListItemIcon><CalendarMonthOutlined fontSize="small" sx={{ color: colors.amberDeep }} /></ListItemIcon>
                                <ListItemText primary="Book Appointment" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 700, color: colors.amberDeep }} />
                            </MenuItem>

                            <MenuItem onClick={() => handleNavigate("/patient/appointments")}>
                                <ListItemIcon><CalendarMonthOutlined fontSize="small" /></ListItemIcon>
                                <ListItemText primary="My Appointments" primaryTypographyProps={{ fontSize: 13.5 }} />
                            </MenuItem>

                            <MenuItem onClick={() => handleNavigate("/patient/reports")}>
                                <ListItemIcon><DescriptionOutlined fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Medical Reports" primaryTypographyProps={{ fontSize: 13.5 }} />
                            </MenuItem>

                            <MenuItem onClick={() => handleNavigate("/patient/ai")}>
                                <ListItemIcon><PsychologyOutlined fontSize="small" /></ListItemIcon>
                                <ListItemText primary="AI Health Assistant" primaryTypographyProps={{ fontSize: 13.5 }} />
                            </MenuItem>

                            <MenuItem onClick={() => handleNavigate("/patient/profile")}>
                                <ListItemIcon><PersonOutlineOutlined fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Profile Settings" primaryTypographyProps={{ fontSize: 13.5 }} />
                            </MenuItem>

                            <Divider sx={{ my: 1 }} />

                            <MenuItem onClick={handleLogout} sx={{ color: colors.brick, "&:hover": { bgcolor: colors.brickSoft } }}>
                                <ListItemIcon><LogoutOutlined fontSize="small" sx={{ color: colors.brick }} /></ListItemIcon>
                                <ListItemText primary="Sign Out" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 700 }} />
                            </MenuItem>
                        </Menu>

                        {/* MOBILE MENU TOGGLE */}
                        <IconButton
                            onClick={() => setMobileOpen(true)}
                            sx={{
                                color: colors.white,
                                display: { xs: "inline-flex", xl: "none" },
                                ml: 0.5,
                            }}
                        >
                            <MenuOutlined />
                        </IconButton>
                    </Stack>
                </Toolbar>
            </AppBar>

            {/* MOBILE DRAWER FOR PATIENT */}
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
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                        <Avatar sx={{ bgcolor: colors.pine, width: 38, height: 38, fontWeight: 800 }}>
                            {initial}
                        </Avatar>
                        <Box>
                            <Typography fontWeight={800} fontSize={14.5} color={colors.white}>
                                {user?.fullName || "Patient"}
                            </Typography>
                            <Typography fontSize={11.5} color="rgba(255,255,255,0.6)">
                                {user?.email || "Patient Portal"}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={() => setMobileOpen(false)} sx={{ color: colors.white }}>
                        <CloseOutlined />
                    </IconButton>
                </Box>

                <Divider sx={{ borderColor: colors.hairlineOnDark, mb: 2.5 }} />

                {/* FAST BOOK APPOINTMENT CARD */}
                <Box
                    onClick={() => handleNavigate("/book-appointment")}
                    sx={{
                        p: 2,
                        mb: 2.5,
                        borderRadius: 3,
                        bgcolor: "rgba(214,138,60,0.18)",
                        border: "1px solid rgba(214,138,60,0.45)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                    }}
                >
                    <CalendarMonthOutlined sx={{ color: colors.amber, fontSize: 30 }} />
                    <Box>
                        <Typography fontWeight={800} fontSize={14.5} color={colors.amber}>
                            Book Doctor Appointment
                        </Typography>
                        <Typography fontSize={11.5} color="rgba(255,255,255,0.75)">
                            Find doctors & pick available slots
                        </Typography>
                    </Box>
                </Box>

                {/* PATIENT NAV LIST */}
                <List sx={{ p: 0, mb: 3 }}>
                    {[
                        { label: "Dashboard Overview", path: "/patient", icon: <DashboardOutlined fontSize="small" /> },
                        { label: "My Appointments", path: "/patient/appointments", icon: <CalendarMonthOutlined fontSize="small" /> },
                        { label: "Medical Reports", path: "/patient/reports", icon: <DescriptionOutlined fontSize="small" /> },
                        { label: "Find Doctors", path: "/doctors", icon: <MedicalServicesOutlined fontSize="small" /> },
                        { label: "Hospitals", path: "/hospitals", icon: <LocalHospitalOutlined fontSize="small" /> },
                        { label: "AI Health Assistant", path: "/patient/ai", icon: <PsychologyOutlined fontSize="small" /> },
                        { label: "Reviews & Feedback", path: "/patient/reviews", icon: <RateReviewOutlined fontSize="small" /> },
                        { label: "Emergency Services", path: "/patient/emergency", icon: <EmergencyOutlined fontSize="small" /> },
                        { label: "Profile & Settings", path: "/patient/profile", icon: <PersonOutlineOutlined fontSize="small" /> },
                    ].map((item) => {
                        const active = isActive(item.path);
                        return (
                            <ListItemButton
                                key={item.path}
                                onClick={() => handleNavigate(item.path)}
                                sx={{
                                    borderRadius: 2,
                                    mb: 0.6,
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
                                        fontSize: 14.5,
                                    }}
                                />
                            </ListItemButton>
                        );
                    })}
                </List>

                <Divider sx={{ borderColor: colors.hairlineOnDark, mb: 2 }} />

                {/* LOGOUT */}
                <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<LogoutOutlined />}
                    onClick={handleLogout}
                    sx={{
                        borderColor: "rgba(178,70,50,0.5)",
                        color: "#F78D78",
                        py: 1.1,
                        fontWeight: 700,
                        borderRadius: 2.5,
                        "&:hover": { bgcolor: "rgba(178,70,50,0.15)", borderColor: "#F78D78" },
                    }}
                >
                    Sign Out
                </Button>
            </Drawer>
        </>
    );
}
