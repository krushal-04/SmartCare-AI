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
    DomainOutlined,
    EmergencyOutlined,
    GroupOutlined,
    LocalHospitalOutlined,
    LogoutOutlined,
    MedicalServicesOutlined,
    MenuOutlined,
    NotificationsOutlined,
    ScheduleOutlined,
} from "@mui/icons-material";
import { colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";

export default function HospitalNavbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const isProfileMenuOpen = Boolean(anchorEl);

    const navLinks = [
        { label: "Dashboard", path: "/hospital", icon: <DashboardOutlined fontSize="small" /> },
        { label: "Doctors", path: "/hospital/doctors", icon: <MedicalServicesOutlined fontSize="small" /> },
        { label: "Schedules", path: "/hospital/schedules", icon: <ScheduleOutlined fontSize="small" /> },
        { label: "Appointments", path: "/hospital/appointments", icon: <CalendarMonthOutlined fontSize="small" /> },
        { label: "Patients", path: "/hospital/patients", icon: <GroupOutlined fontSize="small" /> },
        { label: "Departments", path: "/hospital/departments", icon: <DomainOutlined fontSize="small" /> },
        { label: "Emergency", path: "/hospital/emergency", icon: <EmergencyOutlined fontSize="small" /> },
        { label: "Reports", path: "/hospital/reports", icon: <DescriptionOutlined fontSize="small" /> },
    ];

    const isActive = (path) => {
        if (path === "/hospital") return location.pathname === "/hospital";
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

    const initial = (user?.fullName || user?.email || "H").trim().charAt(0).toUpperCase();

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
                    {/* BRAND WITH HOSPITAL BADGE */}
                    <Box
                        onClick={() => handleNavigate("/hospital")}
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
                                    label="Hospital Hub"
                                    size="small"
                                    sx={{
                                        height: 20,
                                        fontSize: 10,
                                        fontWeight: 800,
                                        letterSpacing: 0.8,
                                        bgcolor: "rgba(214,138,60,0.2)",
                                        color: colors.amber,
                                        border: "1px solid rgba(214,138,60,0.4)",
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
                                HOSPITAL OPERATIONS
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
                                        px: 1.3,
                                        py: 0.8,
                                        borderRadius: 2,
                                        color: active ? colors.white : "rgba(243,245,240,0.72)",
                                        bgcolor: active ? "rgba(214,138,60,0.14)" : "transparent",
                                        fontWeight: active ? 800 : 500,
                                        fontSize: 13,
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
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Button
                            variant="contained"
                            startIcon={<DashboardOutlined fontSize="small" />}
                            onClick={() => handleNavigate("/hospital")}
                            sx={{
                                bgcolor: colors.pine,
                                color: colors.white,
                                fontWeight: 700,
                                fontSize: 13,
                                px: 1.8,
                                py: 0.8,
                                borderRadius: 2.2,
                                textTransform: "none",
                                display: { xs: "none", sm: "inline-flex" },
                                "&:hover": { bgcolor: colors.pineDeep },
                            }}
                        >
                            Operations Hub
                        </Button>

                        {/* NOTIFICATIONS */}
                        <Tooltip title="Notifications">
                            <IconButton
                                onClick={() => handleNavigate("/hospital/notifications")}
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

                        {/* HOSPITAL AVATAR & MENU */}
                        <Tooltip title="Hospital Account">
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
                                        bgcolor: colors.amber,
                                        color: colors.ink,
                                        fontWeight: 800,
                                        fontSize: 14,
                                    }}
                                >
                                    {initial}
                                </Avatar>
                                <Box sx={{ display: { xs: "none", md: "block" }, textAlign: "left" }}>
                                    <Typography fontSize={13} fontWeight={700} lineHeight={1.2} noWrap sx={{ maxWidth: 120 }}>
                                        {user?.fullName || "Hospital Admin"}
                                    </Typography>
                                    <Typography fontSize={10.5} color="rgba(255,255,255,0.6)" lineHeight={1}>
                                        Hospital Staff
                                    </Typography>
                                </Box>
                            </Box>
                        </Tooltip>

                        {/* DROPDOWN MENU */}
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
                                    {user?.fullName || "Hospital"}
                                </Typography>
                                <Typography fontSize={12} color={colors.slate} noWrap>
                                    {user?.email || ""}
                                </Typography>
                                <Chip
                                    size="small"
                                    label="Hospital Staff"
                                    sx={{
                                        mt: 1,
                                        height: 22,
                                        fontSize: 10.5,
                                        fontWeight: 700,
                                        bgcolor: colors.amberSoft,
                                        color: colors.amberDeep,
                                    }}
                                />
                            </Box>

                            <Divider sx={{ my: 1 }} />

                            <MenuItem onClick={() => handleNavigate("/hospital")}>
                                <ListItemIcon><DashboardOutlined fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Hospital Dashboard" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600 }} />
                            </MenuItem>

                            <MenuItem onClick={() => handleNavigate("/hospital/profile")}>
                                <ListItemIcon><LocalHospitalOutlined fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Hospital Profile" primaryTypographyProps={{ fontSize: 13.5 }} />
                            </MenuItem>

                            <MenuItem onClick={() => handleNavigate("/hospital/doctors")}>
                                <ListItemIcon><MedicalServicesOutlined fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Doctors Directory" primaryTypographyProps={{ fontSize: 13.5 }} />
                            </MenuItem>

                            <MenuItem onClick={() => handleNavigate("/hospital/schedules")}>
                                <ListItemIcon><ScheduleOutlined fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Doctor Schedules" primaryTypographyProps={{ fontSize: 13.5 }} />
                            </MenuItem>

                            <MenuItem onClick={() => handleNavigate("/hospital/appointments")}>
                                <ListItemIcon><CalendarMonthOutlined fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Hospital Appointments" primaryTypographyProps={{ fontSize: 13.5 }} />
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
                                display: { xs: "inline-flex", lg: "none" },
                                ml: 0.5,
                            }}
                        >
                            <MenuOutlined />
                        </IconButton>
                    </Stack>
                </Toolbar>
            </AppBar>

            {/* MOBILE DRAWER FOR HOSPITAL */}
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
                        <Avatar sx={{ bgcolor: colors.amber, color: colors.ink, width: 38, height: 38, fontWeight: 800 }}>
                            {initial}
                        </Avatar>
                        <Box>
                            <Typography fontWeight={800} fontSize={14.5} color={colors.white}>
                                {user?.fullName || "Hospital"}
                            </Typography>
                            <Typography fontSize={11.5} color="rgba(255,255,255,0.6)">
                                Hospital Management
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={() => setMobileOpen(false)} sx={{ color: colors.white }}>
                        <CloseOutlined />
                    </IconButton>
                </Box>

                <Divider sx={{ borderColor: colors.hairlineOnDark, mb: 2.5 }} />

                <List sx={{ p: 0, mb: 3 }}>
                    {navLinks.map((item) => {
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
