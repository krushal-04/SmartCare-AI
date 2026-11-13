import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    InputAdornment,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    NotificationsOutlined,
    DoneAllOutlined,
    CalendarMonthOutlined,
    EmergencyOutlined,
    DescriptionOutlined,
    CheckCircleOutlined,
    UpdateOutlined,
    AccessTimeOutlined,
    ReplayOutlined,
    ArrowForwardOutlined,
    SearchOutlined,
    LocalHospitalOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../services/api";
import { colors } from "../../theme/colors";
import { useNotifications } from "../../context/NotificationContext";

// Clean any double prefix like "Dr. Dr."
const cleanNotificationMessage = (msg) => {
    if (!msg) return "";
    return msg.replace(/\bDr\.\s*Dr\.\s*/gi, "Dr. ").trim();
};

// Formats timestamp cleanly into "12 Nov 2026 • 06:18 PM"
const formatNotificationDate = (dateVal) => {
    if (!dateVal) return "—";
    try {
        const d = new Date(dateVal);
        return new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        }).format(d).replace(",", " •");
    } catch {
        return String(dateVal);
    }
};

// Hospital-specific category mapping
const getHospitalNotificationMeta = (notification) => {
    const title = (notification.title || "").toLowerCase();
    const message = (notification.message || "").toLowerCase();
    const type = notification.type || "System";

    // 1. Emergency
    if (type === "Emergency" || title.includes("emergency") || message.includes("emergency")) {
        return {
            category: "Emergency",
            label: "Emergency Dispatch",
            color: "#DC2626",
            bgLight: "#FEF2F2",
            borderLight: "#FECACA",
            accentBorder: "#DC2626",
            icon: <EmergencyOutlined sx={{ color: "#DC2626", fontSize: 22 }} />,
            actionLabel: "Open Emergency Hub",
            actionPath: "/hospital/emergency",
        };
    }

    // 2. Cancellation & Refund
    if (type === "Refund" || title.includes("refund") || title.includes("cancelled") || message.includes("refund")) {
        return {
            category: "Refund",
            label: title.includes("refund") ? "Refund Notice" : "Consultation Cancelled",
            color: "#2563EB",
            bgLight: "#EFF6FF",
            borderLight: "#BFDBFE",
            accentBorder: "#2563EB",
            icon: <ReplayOutlined sx={{ color: "#2563EB", fontSize: 22 }} />,
            actionLabel: "View Revenue & Refunds",
            actionPath: "/hospital/payments",
        };
    }

    // 3. Rescheduled Appointment Pending Approval
    if (title.includes("reschedule") || message.includes("reschedule") || title.includes("pending approval") || message.includes("review and approve")) {
        return {
            category: "Rescheduled",
            label: "Rescheduled • Approval Required",
            color: "#D97706",
            bgLight: "#FFFBEB",
            borderLight: "#FDE68A",
            accentBorder: "#D97706",
            icon: <UpdateOutlined sx={{ color: "#D97706", fontSize: 22 }} />,
            actionLabel: "Review & Approve Slot",
            actionPath: "/hospital/appointments",
        };
    }

    // 4. Confirmed Consultations
    if (title.includes("confirmed") || title.includes("approved")) {
        return {
            category: "Confirmed",
            label: "Consultation Confirmed",
            color: "#16A34A",
            bgLight: "#F0FDF4",
            borderLight: "#BBF7D0",
            accentBorder: "#16A34A",
            icon: <CheckCircleOutlined sx={{ color: "#16A34A", fontSize: 22 }} />,
            actionLabel: "View Schedule",
            actionPath: "/hospital/appointments",
        };
    }

    // 5. Automated Schedule Reminders
    if (title.includes("reminder") || message.includes("reminder")) {
        return {
            category: "Reminder",
            label: "Schedule Reminder",
            color: "#0D9488",
            bgLight: "#F0FDFA",
            borderLight: "#CCFBF1",
            accentBorder: "#0D9488",
            icon: <AccessTimeOutlined sx={{ color: "#0D9488", fontSize: 22 }} />,
            actionLabel: "View Operations",
            actionPath: "/hospital/appointments",
        };
    }

    // 6. Medical Reports / Diagnostics
    if (type === "Report" || title.includes("report") || message.includes("report")) {
        return {
            category: "Report",
            label: "Clinical Report",
            color: "#7C3AED",
            bgLight: "#F5F3FF",
            borderLight: "#DDD6FE",
            accentBorder: "#7C3AED",
            icon: <DescriptionOutlined sx={{ color: "#7C3AED", fontSize: 22 }} />,
            actionLabel: "View Reports",
            actionPath: "/hospital/reports",
        };
    }

    // 7. General Appointment Updates
    if (type === "Appointment" || title.includes("appointment") || title.includes("booking")) {
        return {
            category: "Appointment",
            label: "Appointment Booking",
            color: "#0D9488",
            bgLight: "#F0FDFA",
            borderLight: "#CCFBF1",
            accentBorder: "#0D9488",
            icon: <CalendarMonthOutlined sx={{ color: "#0D9488", fontSize: 22 }} />,
            actionLabel: "Manage Appointments",
            actionPath: "/hospital/appointments",
        };
    }

    // 8. Hospital Facility & Accreditation
    return {
        category: "Hospital",
        label: "Operational Update",
        color: "#475569",
        bgLight: "#F8FAFC",
        borderLight: "#E2E8F0",
        accentBorder: "#475569",
        icon: <LocalHospitalOutlined sx={{ color: "#475569", fontSize: 22 }} />,
        actionLabel: "Hospital Profile",
        actionPath: "/hospital/profile",
    };
};

export default function HospitalNotifications() {
    const navigate = useNavigate();
    const { markAsRead: contextMarkAsRead, markAllAsRead: contextMarkAllAsRead } = useNotifications();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/notifications/my");
            setNotifications(res.data.notifications || []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load notifications.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkOneRead = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            await contextMarkAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );
        } catch (err) {
            console.error("handleMarkOneRead error:", err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await contextMarkAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch (err) {
            console.error("handleMarkAllRead error:", err);
        }
    };

    const handleCardAction = (n, meta) => {
        if (!n.isRead) {
            handleMarkOneRead(n._id);
        }
        if (meta.actionPath) {
            navigate(meta.actionPath);
        }
    };

    // Filter and search
    const filteredNotifications = useMemo(() => {
        return notifications.filter((item) => {
            const q = search.toLowerCase().trim();
            const matchesSearch =
                !q ||
                (item.title || "").toLowerCase().includes(q) ||
                (item.message || "").toLowerCase().includes(q);

            if (!matchesSearch) return false;

            if (activeTab === "unread") return !item.isRead;
            if (activeTab === "appointments") {
                const t = (item.type || "").toLowerCase();
                const tit = (item.title || "").toLowerCase();
                return t === "appointment" || tit.includes("appointment") || tit.includes("reschedule");
            }
            if (activeTab === "emergency") {
                const t = (item.type || "").toLowerCase();
                const tit = (item.title || "").toLowerCase();
                return t === "emergency" || tit.includes("emergency");
            }
            if (activeTab === "reports") {
                const t = (item.type || "").toLowerCase();
                const tit = (item.title || "").toLowerCase();
                return t === "report" || tit.includes("report");
            }
            return true;
        });
    }, [notifications, search, activeTab]);

    // Counts
    const totalCount = notifications.length;
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const appointmentCount = notifications.filter((n) => {
        const tit = (n.title || "").toLowerCase();
        return tit.includes("appointment") || tit.includes("reschedule") || n.type === "Appointment";
    }).length;
    const emergencyCount = notifications.filter((n) => {
        const tit = (n.title || "").toLowerCase();
        return tit.includes("emergency") || n.type === "Emergency";
    }).length;

    return (
        <DashboardLayout
            role="hospital"
            title="Hospital Notifications"
            subtitle="Real-time operational alerts, patient schedule modifications, and emergency signals"
        >
            {/* KPI STATS CARDS */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
                    gap: 2,
                    mb: 3,
                }}
            >
                <Card
                    elevation={0}
                    sx={{
                        p: 2.2,
                        borderRadius: 3,
                        border: `1px solid ${colors.hairline}`,
                        bgcolor: colors.white,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.8,
                    }}
                >
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2.5,
                            bgcolor: "#F1F5F9",
                            display: "grid",
                            placeItems: "center",
                            color: colors.ink,
                        }}
                    >
                        <NotificationsOutlined />
                    </Box>
                    <Box>
                        <Typography fontSize={22} fontWeight={850} color={colors.ink} lineHeight={1.1}>
                            {totalCount}
                        </Typography>
                        <Typography fontSize={12} color={colors.slate} fontWeight={600}>
                            Total Signals
                        </Typography>
                    </Box>
                </Card>

                <Card
                    elevation={0}
                    sx={{
                        p: 2.2,
                        borderRadius: 3,
                        border: unreadCount > 0 ? "1px solid #FECACA" : `1px solid ${colors.hairline}`,
                        bgcolor: unreadCount > 0 ? "#FEF2F2" : colors.white,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.8,
                    }}
                >
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2.5,
                            bgcolor: unreadCount > 0 ? "#FEE2E2" : "#F1F5F9",
                            display: "grid",
                            placeItems: "center",
                            color: unreadCount > 0 ? "#DC2626" : colors.slate,
                        }}
                    >
                        <NotificationsOutlined />
                    </Box>
                    <Box>
                        <Typography fontSize={22} fontWeight={850} color={unreadCount > 0 ? "#DC2626" : colors.ink} lineHeight={1.1}>
                            {unreadCount}
                        </Typography>
                        <Typography fontSize={12} color={unreadCount > 0 ? "#B91C1C" : colors.slate} fontWeight={600}>
                            Action Required
                        </Typography>
                    </Box>
                </Card>

                <Card
                    elevation={0}
                    sx={{
                        p: 2.2,
                        borderRadius: 3,
                        border: `1px solid ${colors.hairline}`,
                        bgcolor: colors.white,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.8,
                    }}
                >
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2.5,
                            bgcolor: "#F0FDFA",
                            display: "grid",
                            placeItems: "center",
                            color: colors.pine,
                        }}
                    >
                        <CalendarMonthOutlined />
                    </Box>
                    <Box>
                        <Typography fontSize={22} fontWeight={850} color={colors.ink} lineHeight={1.1}>
                            {appointmentCount}
                        </Typography>
                        <Typography fontSize={12} color={colors.slate} fontWeight={600}>
                            Appointments
                        </Typography>
                    </Box>
                </Card>

                <Card
                    elevation={0}
                    sx={{
                        p: 2.2,
                        borderRadius: 3,
                        border: emergencyCount > 0 ? "1px solid #FECACA" : `1px solid ${colors.hairline}`,
                        bgcolor: emergencyCount > 0 ? "#FEF2F2" : colors.white,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.8,
                    }}
                >
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2.5,
                            bgcolor: emergencyCount > 0 ? "#FEE2E2" : "#F1F5F9",
                            display: "grid",
                            placeItems: "center",
                            color: emergencyCount > 0 ? "#DC2626" : colors.slate,
                        }}
                    >
                        <EmergencyOutlined />
                    </Box>
                    <Box>
                        <Typography fontSize={22} fontWeight={850} color={emergencyCount > 0 ? "#DC2626" : colors.ink} lineHeight={1.1}>
                            {emergencyCount}
                        </Typography>
                        <Typography fontSize={12} color={emergencyCount > 0 ? "#B91C1C" : colors.slate} fontWeight={600}>
                            Emergencies
                        </Typography>
                    </Box>
                </Card>
            </Box>

            {/* SEARCH & FILTER CONTROLS */}
            <Card
                elevation={0}
                sx={{
                    mb: 3,
                    borderRadius: 3.5,
                    border: `1px solid ${colors.hairline}`,
                    bgcolor: colors.white,
                    p: { xs: 2, sm: 2.5 },
                }}
            >
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", md: "center" }}
                >
                    <Tabs
                        value={activeTab}
                        onChange={(e, val) => setActiveTab(val)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            minHeight: 40,
                            "& .MuiTab-root": {
                                textTransform: "none",
                                fontWeight: 700,
                                fontSize: 13.5,
                                minHeight: 40,
                                py: 0.8,
                                px: 2,
                                borderRadius: 2,
                            },
                        }}
                    >
                        <Tab label={`All (${totalCount})`} value="all" />
                        <Tab
                            label={
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                    <span>Unread</span>
                                    {unreadCount > 0 && (
                                        <Chip
                                            label={unreadCount}
                                            size="small"
                                            sx={{
                                                bgcolor: "#DC2626",
                                                color: colors.white,
                                                fontWeight: 800,
                                                fontSize: 10.5,
                                                height: 18,
                                            }}
                                        />
                                    )}
                                </Box>
                            }
                            value="unread"
                        />
                        <Tab label={`Appointments (${appointmentCount})`} value="appointments" />
                        <Tab label={`Emergency (${emergencyCount})`} value="emergency" />
                        <Tab label="Reports" value="reports" />
                    </Tabs>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <TextField
                            size="small"
                            placeholder="Filter alerts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchOutlined sx={{ color: colors.slate, fontSize: 18 }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ minWidth: { xs: "100%", sm: 240 } }}
                        />

                        {unreadCount > 0 && (
                            <Button
                                variant="outlined"
                                startIcon={<DoneAllOutlined />}
                                onClick={handleMarkAllRead}
                                sx={{
                                    borderRadius: 2.2,
                                    fontWeight: 750,
                                    fontSize: 12.5,
                                    textTransform: "none",
                                    borderColor: colors.hairline,
                                    color: colors.ink,
                                    whiteSpace: "nowrap",
                                    "&:hover": { bgcolor: "#F8FAFC", borderColor: colors.slate },
                                }}
                            >
                                Mark All Read ({unreadCount})
                            </Button>
                        )}
                    </Stack>
                </Stack>
            </Card>

            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}

            {/* NOTIFICATIONS CARDS LIST */}
            {loading ? (
                <Box textAlign="center" py={8}>
                    <CircularProgress sx={{ color: colors.pine }} />
                    <Typography mt={2} color={colors.slate} fontSize={14}>
                        Loading hospital alerts...
                    </Typography>
                </Box>
            ) : filteredNotifications.length === 0 ? (
                <Card
                    elevation={0}
                    sx={{
                        border: `1px solid ${colors.hairline}`,
                        borderRadius: 3.5,
                        bgcolor: colors.white,
                        py: 8,
                        textAlign: "center",
                    }}
                >
                    <Box
                        sx={{
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            bgcolor: "#F0FDFA",
                            display: "grid",
                            placeItems: "center",
                            color: colors.pine,
                            margin: "0 auto 16px",
                        }}
                    >
                        <CheckCircleOutlined sx={{ fontSize: 36 }} />
                    </Box>
                    <Typography fontWeight={850} fontSize={18} color={colors.ink}>
                        All Caught Up!
                    </Typography>
                    <Typography fontSize={13.5} color={colors.slate} mt={0.5} maxWidth={400} mx="auto">
                        {search || activeTab !== "all"
                            ? "No alerts match your active filter."
                            : "No incoming hospital alerts or pending operational tasks at this time."}
                    </Typography>
                </Card>
            ) : (
                <Stack spacing={1.8}>
                    {filteredNotifications.map((item) => {
                        const meta = getHospitalNotificationMeta(item);
                        return (
                            <Card
                                key={item._id}
                                elevation={0}
                                sx={{
                                    borderRadius: 3.2,
                                    bgcolor: item.isRead ? colors.white : "#FAFBFD",
                                    border: "1px solid",
                                    borderColor: item.isRead ? colors.hairline : "#CBD5E1",
                                    borderLeft: `5px solid ${meta.accentBorder}`,
                                    boxShadow: item.isRead
                                        ? "0 1px 3px rgba(16,42,67,0.03)"
                                        : "0 4px 16px rgba(16,42,67,0.06)",
                                    transition: "all 0.2s ease-in-out",
                                    "&:hover": {
                                        boxShadow: "0 8px 24px rgba(16,42,67,0.08)",
                                        borderColor: meta.color,
                                        transform: "translateY(-1px)",
                                    },
                                }}
                            >
                                <CardContent sx={{ p: { xs: 2.2, sm: 2.8 } }}>
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        spacing={2}
                                        alignItems={{ xs: "stretch", sm: "flex-start" }}
                                        justifyContent="space-between"
                                    >
                                        {/* LEFT: ICON + DETAILS */}
                                        <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ flex: 1 }}>
                                            <Box
                                                sx={{
                                                    width: 46,
                                                    height: 46,
                                                    borderRadius: 2.5,
                                                    bgcolor: meta.bgLight,
                                                    border: `1px solid ${meta.borderLight}`,
                                                    display: "grid",
                                                    placeItems: "center",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {meta.icon}
                                            </Box>

                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                {/* Category Chip + Title + New Badge */}
                                                <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 0.6 }}>
                                                    <Chip
                                                        label={meta.label}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: meta.bgLight,
                                                            color: meta.color,
                                                            border: `1px solid ${meta.borderLight}`,
                                                            fontWeight: 800,
                                                            fontSize: 11,
                                                            height: 22,
                                                        }}
                                                    />
                                                    <Typography
                                                        fontSize={15.5}
                                                        fontWeight={item.isRead ? 750 : 850}
                                                        color={colors.ink}
                                                    >
                                                        {item.title}
                                                    </Typography>
                                                    {!item.isRead && (
                                                        <Chip
                                                            label="NEW"
                                                            size="small"
                                                            sx={{
                                                                bgcolor: "#FEF2F2",
                                                                color: "#DC2626",
                                                                border: "1px solid #FECACA",
                                                                fontWeight: 850,
                                                                fontSize: 10,
                                                                height: 20,
                                                            }}
                                                        />
                                                    )}
                                                </Box>

                                                {/* Message Body */}
                                                <Typography
                                                    fontSize={13.5}
                                                    color="#334155"
                                                    lineHeight={1.6}
                                                    sx={{ mb: 1.2 }}
                                                >
                                                    {cleanNotificationMessage(item.message)}
                                                </Typography>

                                                {/* Timestamp */}
                                                <Stack direction="row" spacing={0.6} alignItems="center">
                                                    <AccessTimeOutlined sx={{ fontSize: 13, color: colors.slate }} />
                                                    <Typography fontSize={12} color={colors.slate} fontWeight={500}>
                                                        {formatNotificationDate(item.createdAt)}
                                                    </Typography>
                                                </Stack>
                                            </Box>
                                        </Stack>

                                        {/* RIGHT: ACTION BUTTONS */}
                                        <Stack
                                            direction={{ xs: "row", sm: "column" }}
                                            spacing={1}
                                            alignItems={{ xs: "center", sm: "flex-end" }}
                                            justifyContent={{ xs: "space-between", sm: "flex-start" }}
                                            sx={{ flexShrink: 0, mt: { xs: 1.5, sm: 0 } }}
                                        >
                                            {meta.actionLabel && (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    endIcon={<ArrowForwardOutlined sx={{ fontSize: 13 }} />}
                                                    onClick={() => handleCardAction(item, meta)}
                                                    sx={{
                                                        borderRadius: 2,
                                                        textTransform: "none",
                                                        fontWeight: 750,
                                                        fontSize: 12,
                                                        color: meta.color,
                                                        borderColor: meta.borderLight,
                                                        bgcolor: meta.bgLight,
                                                        px: 1.8,
                                                        py: 0.6,
                                                        "&:hover": {
                                                            bgcolor: meta.borderLight,
                                                            borderColor: meta.color,
                                                        },
                                                    }}
                                                >
                                                    {meta.actionLabel}
                                                </Button>
                                            )}

                                            {!item.isRead && (
                                                <Tooltip title="Mark as read">
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        startIcon={<CheckCircleOutlined sx={{ fontSize: 14 }} />}
                                                        onClick={(e) => handleMarkOneRead(item._id, e)}
                                                        sx={{
                                                            textTransform: "none",
                                                            fontSize: 12,
                                                            fontWeight: 700,
                                                            color: colors.slate,
                                                            p: "4px 8px",
                                                            "&:hover": { color: colors.ink, bgcolor: "#F1F5F9" },
                                                        }}
                                                    >
                                                        Mark read
                                                    </Button>
                                                </Tooltip>
                                            )}
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Stack>
            )}
        </DashboardLayout>
    );
}
