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
    useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
    AnalyticsOutlined,
    CalendarMonthOutlined,
    CloseOutlined,
    DashboardOutlined,
    DescriptionOutlined,
    DomainOutlined,
    EmergencyOutlined,
    GroupOutlined,
    LocalHospitalOutlined,
    LocalPharmacyOutlined,
    LogoutOutlined,
    MedicalServicesOutlined,
    MenuOutlined,
    NotificationsOutlined,
    PersonOutlined,
    PsychologyOutlined,
    RateReviewOutlined,
    ScheduleOutlined,
    TimeToLeaveOutlined,
} from "@mui/icons-material";
import { colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";

const menuConfig = {
    patient: [
        {
            group: "MAIN",
            items: [
                { label: "Dashboard", path: "/patient", icon: <DashboardOutlined /> },
                {
                    label: "Book Appointment",
                    path: "/book-appointment",
                    icon: <CalendarMonthOutlined />,
                    highlight: true,
                },
                { label: "My Appointments", path: "/patient/appointments", icon: <CalendarMonthOutlined /> },
            ],
        },
        {
            group: "CARE & RECORDS",
            items: [
                { label: "Medical Reports", path: "/patient/reports", icon: <DescriptionOutlined /> },
                { label: "Clinical Health Assistant", path: "/patient/ai", icon: <PsychologyOutlined /> },
                { label: "Find Doctors", path: "/doctors", icon: <MedicalServicesOutlined /> },
                { label: "Hospitals", path: "/hospitals", icon: <LocalHospitalOutlined /> },
                { label: "Emergency Services", path: "/patient/emergency", icon: <EmergencyOutlined /> },
            ],
        },
        {
            group: "ACCOUNT",
            items: [
                { label: "My Profile", path: "/patient/profile", icon: <PersonOutlined /> },
                { label: "Reviews & Feedback", path: "/patient/reviews", icon: <RateReviewOutlined /> },
                { label: "Notifications", path: "/patient/notifications", icon: <NotificationsOutlined /> },
            ],
        },
    ],

    hospital: [
        {
            group: "OPERATIONS",
            items: [
                { label: "Dashboard Hub", path: "/hospital", icon: <DashboardOutlined /> },
                { label: "Doctors Directory", path: "/hospital/doctors", icon: <MedicalServicesOutlined /> },
                { label: "Duty Schedules", path: "/hospital/schedules", icon: <ScheduleOutlined /> },
                { label: "Appointments", path: "/hospital/appointments", icon: <CalendarMonthOutlined /> },
                { label: "Patients", path: "/hospital/patients", icon: <GroupOutlined /> },
            ],
        },
        {
            group: "CLINICAL SERVICES",
            items: [
                { label: "Departments", path: "/hospital/departments", icon: <DomainOutlined /> },
                { label: "Emergency Intake", path: "/hospital/emergency", icon: <EmergencyOutlined /> },
                { label: "Medical Reports", path: "/hospital/reports", icon: <DescriptionOutlined /> },
            ],
        },
        {
            group: "MANAGEMENT",
            items: [
                { label: "Hospital Profile", path: "/hospital/profile", icon: <LocalHospitalOutlined /> },
                { label: "Notifications", path: "/hospital/notifications", icon: <NotificationsOutlined /> },
            ],
        },
    ],

    admin: [
        {
            group: "OVERVIEW",
            items: [
                { label: "Control Center", path: "/admin", icon: <DashboardOutlined /> },
                { label: "System Analytics", path: "/admin/analytics", icon: <AnalyticsOutlined /> },
            ],
        },
        {
            group: "RESOURCES",
            items: [
                { label: "Hospitals Network", path: "/admin/hospitals", icon: <LocalHospitalOutlined /> },
                { label: "User Accounts", path: "/admin/users", icon: <GroupOutlined /> },
                { label: "Medical Staff", path: "/admin/doctors", icon: <MedicalServicesOutlined /> },
                { label: "Departments", path: "/admin/departments", icon: <DomainOutlined /> },
                { label: "Ambulance Fleet", path: "/admin/ambulances", icon: <TimeToLeaveOutlined /> },
                // { label: "Pharmacy / Meds", path: "/admin/medicines", icon: <LocalPharmacyOutlined /> },
            ],
        },
        {
            group: "ADMINISTRATION",
            items: [
                { label: "Audit Reports", path: "/admin/reports", icon: <DescriptionOutlined /> },
                { label: "System Alerts", path: "/admin/notifications", icon: <NotificationsOutlined /> },
            ],
        },
    ],
};

const roleMeta = {
    patient: {
        title: "Patient Portal",
        badge: "Patient Account",
        badgeBg: "rgba(113,233,223,0.18)",
        badgeColor: "#71E9DF",
        avatarBg: colors.pine,
        homeRoute: "/patient",
        notifRoute: "/patient/notifications",
    },
    hospital: {
        title: "Hospital Hub",
        badge: "Hospital Staff",
        badgeBg: "rgba(214,138,60,0.2)",
        badgeColor: colors.amber,
        avatarBg: colors.amber,
        homeRoute: "/hospital",
        notifRoute: "/hospital/notifications",
    },
    admin: {
        title: "Admin Console",
        badge: "Administrator",
        badgeBg: "rgba(197,139,42,0.2)",
        badgeColor: "#F6C065",
        avatarBg: "#C58B2A",
        homeRoute: "/admin",
        notifRoute: "/admin/notifications",
    },
};

const SIDEBAR_WIDTH = 275;

export default function DashboardLayout({ role, children, title, subtitle }) {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

    const { user, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileAnchor, setProfileAnchor] = useState(null);

    const activeRole = role || user?.role || "patient";
    const currentMeta = roleMeta[activeRole] || roleMeta.patient;
    const groups = menuConfig[activeRole] || menuConfig.patient;

    const displayName = user?.fullName || (activeRole === "admin" ? "Administrator" : "User");
    const displayEmail = user?.email || "";
    const userInitial = displayName.trim().charAt(0).toUpperCase();

    const handleNavigate = (path) => {
        setMobileOpen(false);
        setProfileAnchor(null);
        navigate(path);
    };

    const handleLogout = () => {
        setMobileOpen(false);
        setProfileAnchor(null);
        logout();
        navigate("/");
    };

    const sidebarContent = (
        <Box
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                bgcolor: colors.ink,
                color: colors.white,
                userSelect: "none",
            }}
        >
            {/* BRAND / LOGO */}
            <Box
                sx={{
                    px: 3,
                    py: 2.6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: `1px solid ${colors.hairlineOnDark}`,
                }}
            >
                <Box
                    onClick={() => handleNavigate(currentMeta.homeRoute || "/patient")}
                    sx={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.3,
                    }}
                >
                    <Box
                        sx={{
                            width: 38,
                            height: 38,
                            borderRadius: 2.5,
                            display: "grid",
                            placeItems: "center",
                            bgcolor: colors.pine,
                            color: colors.white,
                            boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
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
                                    fontSize: 22,
                                    lineHeight: 1,
                                    color: colors.white,
                                }}
                            >
                                SmartCare
                            </Typography>
                        </Stack>
                        <Typography
                            sx={{
                                fontSize: 8.5,
                                letterSpacing: 1.8,
                                fontWeight: 800,
                                color: colors.amber,
                                mt: 0.3,
                            }}
                        >
                            {currentMeta.title.toUpperCase()}
                        </Typography>
                    </Box>
                </Box>

                {isMobile && (
                    <IconButton onClick={() => setMobileOpen(false)} sx={{ color: colors.white }}>
                        <CloseOutlined />
                    </IconButton>
                )}
            </Box>

            {/* USER IDENTITY CARD */}
            <Box sx={{ px: 2.2, py: 2 }}>
                <Box
                    sx={{
                        p: 1.8,
                        borderRadius: 3,
                        bgcolor: "rgba(255,255,255,0.045)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.4,
                    }}
                >
                    <Avatar
                        sx={{
                            width: 42,
                            height: 42,
                            bgcolor: currentMeta.avatarBg,
                            color: colors.white,
                            fontWeight: 800,
                            fontSize: 16,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                        }}
                    >
                        {userInitial}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography fontWeight={800} fontSize={14} noWrap color={colors.white}>
                            {displayName}
                        </Typography>
                        <Chip
                            label={currentMeta.badge}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: 10,
                                fontWeight: 700,
                                bgcolor: currentMeta.badgeBg,
                                color: currentMeta.badgeColor,
                                mt: 0.4,
                            }}
                        />
                    </Box>
                </Box>
            </Box>

            {/* NAVIGATION GROUPS */}
            <Box sx={{ px: 1.6, flex: 1, overflowY: "auto" }}>
                {groups.map((group) => (
                    <Box key={group.group} sx={{ mb: 2 }}>
                        <Typography
                            sx={{
                                px: 1.5,
                                mb: 0.8,
                                fontSize: 10,
                                fontWeight: 800,
                                letterSpacing: 1.4,
                                color: "rgba(255,255,255,0.42)",
                            }}
                        >
                            {group.group}
                        </Typography>

                        <List sx={{ p: 0 }}>
                            {group.items.map((item) => {
                                const active =
                                    location.pathname === item.path ||
                                    (item.path !== "/" &&
                                        item.path !== "/patient" &&
                                        item.path !== "/hospital" &&
                                        item.path !== "/admin" &&
                                        location.pathname.startsWith(`${item.path}/`));

                                if (item.highlight) {
                                    return (
                                        <ListItemButton
                                            key={item.path}
                                            onClick={() => handleNavigate(item.path)}
                                            sx={{
                                                mb: 0.6,
                                                borderRadius: 2.5,
                                                py: 1.1,
                                                px: 1.6,
                                                bgcolor: active ? colors.amberDeep : colors.amber,
                                                color: colors.ink,
                                                boxShadow: "0 4px 14px rgba(214,138,60,0.3)",
                                                "&:hover": {
                                                    bgcolor: colors.amberDeep,
                                                },
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 36, color: colors.ink }}>
                                                {item.icon}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={item.label}
                                                primaryTypographyProps={{
                                                    fontSize: 13.5,
                                                    fontWeight: 800,
                                                    color: colors.ink,
                                                }}
                                            />
                                        </ListItemButton>
                                    );
                                }

                                return (
                                    <ListItemButton
                                        key={item.path}
                                        onClick={() => handleNavigate(item.path)}
                                        sx={{
                                            mb: 0.4,
                                            borderRadius: 2.2,
                                            py: 0.95,
                                            px: 1.6,
                                            color: active ? colors.white : "rgba(255,255,255,0.72)",
                                            bgcolor: active
                                                ? "rgba(113,233,223,0.15)"
                                                : "transparent",
                                            borderLeft: active ? `3px solid ${colors.amber}` : "3px solid transparent",
                                            "&:hover": {
                                                bgcolor: "rgba(255,255,255,0.07)",
                                                color: colors.white,
                                            },
                                        }}
                                    >
                                        <ListItemIcon
                                            sx={{
                                                minWidth: 36,
                                                color: active ? colors.amber : "inherit",
                                            }}
                                        >
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.label}
                                            primaryTypographyProps={{
                                                fontSize: 13.5,
                                                fontWeight: active ? 700 : 500,
                                            }}
                                        />
                                    </ListItemButton>
                                );
                            })}
                        </List>
                    </Box>
                ))}
            </Box>

            {/* BOTTOM ACTIONS */}
            <Box
                sx={{
                    p: 2,
                    borderTop: `1px solid ${colors.hairlineOnDark}`,
                }}
            >
                <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<LogoutOutlined />}
                    onClick={handleLogout}
                    sx={{
                        borderColor: "rgba(178,70,50,0.45)",
                        color: "#F78D78",
                        justifyContent: "flex-start",
                        px: 1.5,
                        py: 0.9,
                        fontSize: 13,
                        fontWeight: 700,
                        borderRadius: 2,
                        "&:hover": {
                            bgcolor: "rgba(178,70,50,0.14)",
                            borderColor: "#F78D78",
                        },
                    }}
                >
                    Sign Out
                </Button>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: colors.canvas }}>
            {/* DESKTOP FIXED SIDEBAR */}
            <Box
                component="nav"
                sx={{
                    width: { lg: SIDEBAR_WIDTH },
                    flexShrink: { lg: 0 },
                    display: { xs: "none", lg: "block" },
                }}
            >
                <Box
                    sx={{
                        width: SIDEBAR_WIDTH,
                        height: "100vh",
                        position: "fixed",
                        top: 0,
                        left: 0,
                        zIndex: 1100,
                    }}
                >
                    {sidebarContent}
                </Box>
            </Box>

            {/* MOBILE SLIDE-IN DRAWER */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                ModalProps={{ keepMounted: true }}
                PaperProps={{
                    sx: {
                        width: { xs: "85%", sm: SIDEBAR_WIDTH + 20 },
                        bgcolor: colors.ink,
                        boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                    },
                }}
            >
                {sidebarContent}
            </Drawer>

            {/* MAIN APP CONTAINER */}
            <Box
                sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* STICKY TOPBAR */}
                <AppBar
                    position="sticky"
                    elevation={0}
                    sx={{
                        bgcolor: colors.white,
                        color: colors.ink,
                        borderBottom: `1px solid ${colors.hairline}`,
                        zIndex: 1000,
                    }}
                >
                    <Toolbar
                        sx={{
                            minHeight: { xs: 62, md: 70 },
                            px: { xs: 2, sm: 3, md: 4 },
                            display: "flex",
                            justifyContent: "space-between",
                        }}
                    >
                        {/* LEFT: HAMBURGER ON MOBILE & PAGE TITLES */}
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            {isMobile && (
                                <IconButton
                                    onClick={() => setMobileOpen(true)}
                                    sx={{
                                        color: colors.ink,
                                        mr: 0.5,
                                    }}
                                >
                                    <MenuOutlined />
                                </IconButton>
                            )}

                            <Box>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontFamily: "'Newsreader', serif",
                                        fontWeight: 600,
                                        fontSize: { xs: 20, md: 24 },
                                        color: colors.ink,
                                        lineHeight: 1.15,
                                    }}
                                >
                                    {title || currentMeta.title}
                                </Typography>
                                {subtitle && (
                                    <Typography
                                        fontSize={12.5}
                                        color={colors.slate}
                                        sx={{ display: { xs: "none", sm: "block" } }}
                                    >
                                        {subtitle}
                                    </Typography>
                                )}
                            </Box>
                        </Stack>

                        {/* RIGHT: ACTIONS & USER PROFILE */}
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            {/* QUICK BOOK APPOINTMENT BUTTON FOR PATIENT */}
                            {activeRole === "patient" && (
                                <Button
                                    variant="contained"
                                    startIcon={<CalendarMonthOutlined fontSize="small" />}
                                    onClick={() => handleNavigate("/book-appointment")}
                                    sx={{
                                        bgcolor: colors.amber,
                                        color: colors.ink,
                                        fontWeight: 800,
                                        fontSize: 13,
                                        px: 2,
                                        py: 0.8,
                                        borderRadius: 2.2,
                                        display: { xs: "none", sm: "inline-flex" },
                                        "&:hover": { bgcolor: colors.amberDeep },
                                    }}
                                >
                                    Book Appointment
                                </Button>
                            )}

                            {/* NOTIFICATION BELL */}
                            <Tooltip title="Notifications">
                                <IconButton
                                    onClick={() => handleNavigate(currentMeta.notifRoute)}
                                    sx={{
                                        color: colors.slate,
                                        bgcolor: "rgba(0,0,0,0.03)",
                                        "&:hover": { bgcolor: "rgba(0,0,0,0.06)", color: colors.ink },
                                    }}
                                >
                                    <Badge color="warning" variant="dot">
                                        <NotificationsOutlined fontSize="small" />
                                    </Badge>
                                </IconButton>
                            </Tooltip>

                            {/* USER PROFILE AVATAR MENU */}
                            <Tooltip title="Account menu">
                                <Box
                                    onClick={(e) => setProfileAnchor(e.currentTarget)}
                                    sx={{
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1.2,
                                        p: 0.5,
                                        pr: 1.5,
                                        borderRadius: 3,
                                        border: `1px solid ${colors.hairline}`,
                                        bgcolor: "transparent",
                                        "&:hover": { bgcolor: "rgba(0,0,0,0.03)" },
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            width: 34,
                                            height: 34,
                                            bgcolor: currentMeta.avatarBg,
                                            color: colors.white,
                                            fontWeight: 800,
                                            fontSize: 14,
                                        }}
                                    >
                                        {userInitial}
                                    </Avatar>
                                    <Box sx={{ display: { xs: "none", md: "block" }, textAlign: "left" }}>
                                        <Typography fontSize={13} fontWeight={700} color={colors.ink} lineHeight={1.2} noWrap sx={{ maxWidth: 120 }}>
                                            {displayName}
                                        </Typography>
                                        <Typography fontSize={10.5} color={colors.slate} lineHeight={1}>
                                            {currentMeta.badge}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Tooltip>

                            {/* PROFILE MENU DROPDOWN */}
                            <Menu
                                anchorEl={profileAnchor}
                                open={Boolean(profileAnchor)}
                                onClose={() => setProfileAnchor(null)}
                                PaperProps={{
                                    sx: {
                                        mt: 1.5,
                                        minWidth: 230,
                                        borderRadius: 3,
                                        p: 1,
                                        boxShadow: "0 12px 36px rgba(0,0,0,0.12)",
                                        border: `1px solid ${colors.hairline}`,
                                    },
                                }}
                                transformOrigin={{ horizontal: "right", vertical: "top" }}
                                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                            >
                                <Box sx={{ px: 2, py: 1.5 }}>
                                    <Typography fontWeight={800} fontSize={14.5} color={colors.ink}>
                                        {displayName}
                                    </Typography>
                                    <Typography fontSize={12} color={colors.slate} noWrap>
                                        {displayEmail}
                                    </Typography>
                                </Box>

                                <Divider sx={{ my: 1 }} />

                                {activeRole === "patient" && (
                                    <>
                                        <MenuItem onClick={() => handleNavigate("/book-appointment")}>
                                            <ListItemIcon><CalendarMonthOutlined fontSize="small" sx={{ color: colors.amberDeep }} /></ListItemIcon>
                                            <ListItemText primary="Book Appointment" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 700, color: colors.amberDeep }} />
                                        </MenuItem>
                                        <MenuItem onClick={() => handleNavigate("/patient/profile")}>
                                            <ListItemIcon><PersonOutlined fontSize="small" /></ListItemIcon>
                                            <ListItemText primary="Profile Settings" primaryTypographyProps={{ fontSize: 13.5 }} />
                                        </MenuItem>
                                    </>
                                )}

                                {activeRole === "hospital" && (
                                    <MenuItem onClick={() => handleNavigate("/hospital/profile")}>
                                        <ListItemIcon><LocalHospitalOutlined fontSize="small" /></ListItemIcon>
                                        <ListItemText primary="Hospital Profile" primaryTypographyProps={{ fontSize: 13.5 }} />
                                    </MenuItem>
                                )}

                                <Divider sx={{ my: 1 }} />

                                <MenuItem onClick={handleLogout} sx={{ color: colors.brick, "&:hover": { bgcolor: colors.brickSoft } }}>
                                    <ListItemIcon><LogoutOutlined fontSize="small" sx={{ color: colors.brick }} /></ListItemIcon>
                                    <ListItemText primary="Sign Out" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 700 }} />
                                </MenuItem>
                            </Menu>
                        </Stack>
                    </Toolbar>
                </AppBar>

                {/* MAIN PAGE BODY */}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: { xs: 2, sm: 3, md: 4 },
                        maxWidth: 1400,
                        width: "100%",
                        mx: "auto",
                    }}
                >
                    {children}
                </Box>
            </Box>
        </Box>
    );
}