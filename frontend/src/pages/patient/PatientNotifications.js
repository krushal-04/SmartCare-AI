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
    Divider,
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

// Clean any double prefix like "Dr. Dr." in legacy notification texts
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

// Determines professional category meta, accent colors, icons, and primary actions
const getNotificationMeta = (notification) => {
    const title = (notification.title || "").toLowerCase();
    const message = (notification.message || "").toLowerCase();
    const type = notification.type || "System";

    // 1. Emergency
    if (type === "Emergency" || title.includes("emergency") || message.includes("emergency")) {
        return {
            category: "Emergency",
            label: "Emergency Alert",
            color: "#DC2626",
            bgLight: "#FEF2F2",
            borderLight: "#FECACA",
            accentBorder: "#DC2626",
            icon: <EmergencyOutlined sx={{ color: "#DC2626", fontSize: 22 }} />,
            actionLabel: "View Emergency",
            actionPath: "/patient/emergency",
        };
    }

    // 2. Cancellation & Refund
    if (type === "Refund" || title.includes("refund") || title.includes("cancelled") || message.includes("refund")) {
        return {
            category: "Refund",
            label: title.includes("refund") ? "Refund Initiated" : "Appointment Cancelled",
            color: "#2563EB",
            bgLight: "#EFF6FF",
            borderLight: "#BFDBFE",
            accentBorder: "#2563EB",
            icon: <ReplayOutlined sx={{ color: "#2563EB", fontSize: 22 }} />,
            actionLabel: "View Payment History",
            actionPath: "/patient/payments",
        };
    }

    // 3. Confirmed / Hospital Approved
    if (title.includes("confirmed") || title.includes("approved") || message.includes("confirmed")) {
        return {
            category: "Confirmed",
            label: "Appointment Confirmed",
            color: "#16A34A",
            bgLight: "#F0FDF4",
            borderLight: "#BBF7D0",
            accentBorder: "#16A34A",
            icon: <CheckCircleOutlined sx={{ color: "#16A34A", fontSize: 22 }} />,
            actionLabel: "View Consultation",
            actionPath: "/patient/appointments",
        };
    }

    // 4. Rescheduled / Pending Hospital Approval
    if (title.includes("reschedule") || title.includes("pending") || message.includes("pending") || message.includes("rescheduled")) {
        return {
            category: "Pending",
            label: title.includes("reschedule") ? "Rescheduled (Pending Approval)" : "Pending Approval",
            color: "#D97706",
            bgLight: "#FFFBEB",
            borderLight: "#FDE68A",
            accentBorder: "#D97706",
            icon: <UpdateOutlined sx={{ color: "#D97706", fontSize: 22 }} />,
            actionLabel: "View My Appointments",
            actionPath: "/patient/appointments",
        };
    }

    // 5. Automated Reminders (24h / 1h)
    if (title.includes("reminder") || message.includes("reminder") || message.includes("tomorrow at") || message.includes("in 1 hour")) {
        return {
            category: "Reminder",
            label: "Consultation Reminder",
            color: "#0D9488",
            bgLight: "#F0FDFA",
            borderLight: "#CCFBF1",
            accentBorder: "#0D9488",
            icon: <AccessTimeOutlined sx={{ color: "#0D9488", fontSize: 22 }} />,
            actionLabel: "View Schedule",
            actionPath: "/patient/appointments",
        };
    }

    // 6. Medical Reports / Clinical Notes
    if (type === "Report" || title.includes("report") || message.includes("report")) {
        return {
            category: "Report",
            label: "Medical Report",
            color: "#7C3AED",
            bgLight: "#F5F3FF",
            borderLight: "#DDD6FE",
            accentBorder: "#7C3AED",
            icon: <DescriptionOutlined sx={{ color: "#7C3AED", fontSize: 22 }} />,
            actionLabel: "View Medical Reports",
            actionPath: "/patient/reports",
        };
    }

    // 7. Standard Appointment Updates
    if (type === "Appointment" || title.includes("appointment")) {
        return {
            category: "Appointment",
            label: "Appointment Update",
            color: "#0D9488",
            bgLight: "#F0FDFA",
            borderLight: "#CCFBF1",
            accentBorder: "#0D9488",
            icon: <CalendarMonthOutlined sx={{ color: "#0D9488", fontSize: 22 }} />,
            actionLabel: "View Appointment",
            actionPath: "/patient/appointments",
        };
    }

    // 8. General Healthcare / System Update
    return {
        category: "System",
        label: "Healthcare Update",
        color: "#475569",
        bgLight: "#F8FAFC",
        borderLight: "#E2E8F0",
        accentBorder: "#475569",
        icon: <LocalHospitalOutlined sx={{ color: "#475569", fontSize: 22 }} />,
        actionLabel: "View Details",
        actionPath: "/patient/appointments",
    };
};

export default function PatientNotifications() {
    const navigate = useNavigate();
    const { markAsRead: contextMarkAsRead, markAllAsRead: contextMarkAllAsRead } = useNotifications();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    const loadNotifications = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await api.get("/notifications/my");
            setNotifications(response.data.notifications || []);
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load notifications.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    // Marks an individual notification as read
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

    // Marks all notifications as read
    const handleMarkAllRead = async () => {
        try {
            await contextMarkAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch (err) {
            console.error("handleMarkAllRead error:", err);
        }
    };

    // Handles primary card CTA click
    const handleCardAction = (n, meta) => {
        if (!n.isRead) {
            handleMarkOneRead(n._id);
        }
        if (meta.actionPath) {
            navigate(meta.actionPath);
        }
    };

    // Filter and search logic
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
            if (activeTab === "refunds") {
                const tit = (item.title || "").toLowerCase();
                const msg = (item.message || "").toLowerCase();
                return tit.includes("refund") || tit.includes("payment") || msg.includes("refund");
            }
            if (activeTab === "emergency") {
                const t = (item.type || "").toLowerCase();
                const tit = (item.title || "").toLowerCase();
                return t === "emergency" || tit.includes("emergency");
            }
            return true;
        });
    }, [notifications, search, activeTab]);

    // Summary counts
    const totalCount = notifications.length;
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const appointmentCount = notifications.filter((n) => {
        const tit = (n.title || "").toLowerCase();
        return tit.includes("appointment") || tit.includes("reschedule") || n.type === "Appointment";
    }).length;
    const refundCount = notifications.filter((n) => {
        const tit = (n.title || "").toLowerCase();
        return tit.includes("refund") || tit.includes("payment");
    }).length;

    return (
        <DashboardLayout
            role="patient"
            title="Notifications"
            subtitle="Stay updated with your consultations, medical reports, and refund updates"
        >
            {/* KPI SUMMARY CARDS */}
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
                            Total Updates
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
                            Unread Alerts
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
                            Consultations
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
                            bgcolor: "#EFF6FF",
                            display: "grid",
                            placeItems: "center",
                            color: "#2563EB",
                        }}
                    >
                        <ReplayOutlined />
                    </Box>
                    <Box>
                        <Typography fontSize={22} fontWeight={850} color={colors.ink} lineHeight={1.1}>
                            {refundCount}
                        </Typography>
                        <Typography fontSize={12} color={colors.slate} fontWeight={600}>
                            Refunds & Billing
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
                        <Tab label={`Refunds & Billing (${refundCount})`} value="refunds" />
                        <Tab label="Emergency" value="emergency" />
                    </Tabs>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <TextField
                            size="small"
                            placeholder="Filter notifications..."
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
                        Loading your medical notifications...
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
                            ? "No notifications match your active search filter."
                            : "You have no unread healthcare alerts or clinical updates at this time."}
                    </Typography>
                </Card>
            ) : (
                <Stack spacing={1.8}>
                    {filteredNotifications.map((item) => {
                        const meta = getNotificationMeta(item);
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

                                                {/* Notification Message */}
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
