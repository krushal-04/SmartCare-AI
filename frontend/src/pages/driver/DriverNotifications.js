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
    Typography,
} from "@mui/material";
import {
    NotificationsOutlined,
    DoneAllOutlined,
    EmergencyOutlined,
    TimeToLeaveOutlined,
    CheckCircleOutlined,
    ArrowForwardOutlined,
    SearchOutlined,
    SpeedOutlined,
    RefreshOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../services/api";
import { colors } from "../../theme/colors";
import { useNotifications } from "../../context/NotificationContext";

// Formats timestamp cleanly into "17 Nov 2026 • 05:32 pm"
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

// Determines professional category meta, accent colors, icons, and primary actions for driver
const getNotificationMeta = (notification) => {
    const title = (notification.title || "").toLowerCase();
    const message = (notification.message || "").toLowerCase();
    const type = notification.type || "System";

    // 1. Direct Dispatch / Emergency Callout
    if (
        type === "Emergency" ||
        title.includes("dispatch") ||
        message.includes("dispatch") ||
        title.includes("emergency") ||
        message.includes("immediate response")
    ) {
        return {
            category: "Emergency",
            label: "Emergency Dispatch • Immediate Response",
            color: "#DC2626",
            bgLight: "#FEF2F2",
            borderLight: "#FECACA",
            accentBorder: "#DC2626",
            icon: <EmergencyOutlined sx={{ color: "#DC2626", fontSize: 22 }} />,
            actionLabel: "Open Active Trip",
            actionPath: "/driver/current-trip",
        };
    }

    // 2. Trip Journey / Handover Complete
    if (
        title.includes("handover") ||
        message.includes("handover") ||
        title.includes("onboard") ||
        message.includes("onboard") ||
        title.includes("en route") ||
        message.includes("en route")
    ) {
        return {
            category: "Trip",
            label: title.includes("handover") ? "Handover Completed" : "Journey Telemetry",
            color: "#16A34A",
            bgLight: "#F0FDF4",
            borderLight: "#BBF7D0",
            accentBorder: "#16A34A",
            icon: <CheckCircleOutlined sx={{ color: "#16A34A", fontSize: 22 }} />,
            actionLabel: "View Work History",
            actionPath: "/driver/history",
        };
    }

    // 3. Duty / Shift / Ambulance assignment
    if (
        title.includes("duty") ||
        message.includes("duty") ||
        title.includes("ambulance") ||
        message.includes("ambulance") ||
        title.includes("vehicle") ||
        message.includes("vehicle")
    ) {
        return {
            category: "Duty",
            label: "Duty & Fleet Status",
            color: "#2563EB",
            bgLight: "#EFF6FF",
            borderLight: "#BFDBFE",
            accentBorder: "#2563EB",
            icon: <TimeToLeaveOutlined sx={{ color: "#2563EB", fontSize: 22 }} />,
            actionLabel: "Driver Portal",
            actionPath: "/driver",
        };
    }

    // 4. Default System
    return {
        category: "System",
        label: "System Broadcast",
        color: "#6366F1",
        bgLight: "#EEF2FF",
        borderLight: "#C7D2FE",
        accentBorder: "#6366F1",
        icon: <NotificationsOutlined sx={{ color: "#6366F1", fontSize: 22 }} />,
        actionLabel: "Driver Portal",
        actionPath: "/driver",
    };
};

export default function DriverNotifications() {
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
            setError(err.response?.data?.message || "Unable to load driver notifications.");
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
            if (activeTab === "dispatch") {
                const tit = (item.title || "").toLowerCase();
                const msg = (item.message || "").toLowerCase();
                return item.type === "Emergency" || tit.includes("dispatch") || msg.includes("dispatch");
            }
            if (activeTab === "duty") {
                const tit = (item.title || "").toLowerCase();
                const msg = (item.message || "").toLowerCase();
                return tit.includes("duty") || msg.includes("duty") || tit.includes("ambulance") || msg.includes("handover");
            }
            return true;
        });
    }, [notifications, search, activeTab]);

    // Summary counts
    const totalCount = notifications.length;
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const dispatchCount = notifications.filter((n) => {
        const tit = (n.title || "").toLowerCase();
        const msg = (n.message || "").toLowerCase();
        return n.type === "Emergency" || tit.includes("dispatch") || msg.includes("dispatch");
    }).length;
    const dutyCount = notifications.filter((n) => {
        const tit = (n.title || "").toLowerCase();
        const msg = (n.message || "").toLowerCase();
        return tit.includes("duty") || msg.includes("duty") || tit.includes("ambulance") || msg.includes("handover");
    }).length;

    return (
        <DashboardLayout
            role="driver"
            title="Notifications & Dispatch Signals"
            subtitle="Real-time emergency dispatch orders, ambulance telemetry alerts, and duty updates"
        >
            {/* KPI SUMMARY CARDS */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                    gap: 2,
                    mb: 3,
                }}
            >
                {/* 1. TOTAL NOTIFICATIONS */}
                <Card
                    elevation={0}
                    sx={{
                        p: 2.2,
                        borderRadius: 3,
                        border: `1px solid ${colors.hairline}`,
                        bgcolor: colors.white,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2.5,
                            bgcolor: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            display: "grid",
                            placeItems: "center",
                            color: colors.slate,
                        }}
                    >
                        <NotificationsOutlined sx={{ fontSize: 24 }} />
                    </Box>
                    <Box>
                        <Typography fontSize={24} fontWeight={850} color={colors.ink} lineHeight={1}>
                            {totalCount}
                        </Typography>
                        <Typography fontSize={12} color={colors.slate} fontWeight={600} mt={0.5}>
                            Total Signals
                        </Typography>
                    </Box>
                </Card>

                {/* 2. UNREAD / ACTION REQUIRED */}
                <Card
                    elevation={0}
                    sx={{
                        p: 2.2,
                        borderRadius: 3,
                        border: `1px solid ${unreadCount > 0 ? "#FCA5A5" : colors.hairline}`,
                        bgcolor: unreadCount > 0 ? "#FEF2F2" : colors.white,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2.5,
                            bgcolor: unreadCount > 0 ? "#FEE2E2" : "#F8FAFC",
                            border: `1px solid ${unreadCount > 0 ? "#FECACA" : "#E2E8F0"}`,
                            display: "grid",
                            placeItems: "center",
                            color: unreadCount > 0 ? "#DC2626" : colors.slate,
                        }}
                    >
                        <EmergencyOutlined sx={{ fontSize: 24 }} />
                    </Box>
                    <Box>
                        <Typography fontSize={24} fontWeight={850} color={unreadCount > 0 ? "#DC2626" : colors.ink} lineHeight={1}>
                            {unreadCount}
                        </Typography>
                        <Typography fontSize={12} color={unreadCount > 0 ? "#B91C1C" : colors.slate} fontWeight={600} mt={0.5}>
                            Unread Signals
                        </Typography>
                    </Box>
                </Card>

                {/* 3. DISPATCH CALLOUTS */}
                <Card
                    elevation={0}
                    sx={{
                        p: 2.2,
                        borderRadius: 3,
                        border: `1px solid ${colors.hairline}`,
                        bgcolor: colors.white,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2.5,
                            bgcolor: "#FFF7ED",
                            border: "1px solid #FED7AA",
                            display: "grid",
                            placeItems: "center",
                            color: "#EA580C",
                        }}
                    >
                        <TimeToLeaveOutlined sx={{ fontSize: 24 }} />
                    </Box>
                    <Box>
                        <Typography fontSize={24} fontWeight={850} color={colors.ink} lineHeight={1}>
                            {dispatchCount}
                        </Typography>
                        <Typography fontSize={12} color={colors.slate} fontWeight={600} mt={0.5}>
                            Emergency Dispatches
                        </Typography>
                    </Box>
                </Card>

                {/* 4. DUTY & FLEET */}
                <Card
                    elevation={0}
                    sx={{
                        p: 2.2,
                        borderRadius: 3,
                        border: `1px solid ${colors.hairline}`,
                        bgcolor: colors.white,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2.5,
                            bgcolor: "#EFF6FF",
                            border: "1px solid #BFDBFE",
                            display: "grid",
                            placeItems: "center",
                            color: "#2563EB",
                        }}
                    >
                        <SpeedOutlined sx={{ fontSize: 24 }} />
                    </Box>
                    <Box>
                        <Typography fontSize={24} fontWeight={850} color={colors.ink} lineHeight={1}>
                            {dutyCount}
                        </Typography>
                        <Typography fontSize={12} color={colors.slate} fontWeight={600} mt={0.5}>
                            Duty & Fleet Updates
                        </Typography>
                    </Box>
                </Card>
            </Box>

            {/* CONTROLS BAR: TABS, SEARCH & MARK ALL */}
            <Card
                elevation={0}
                sx={{
                    mb: 3,
                    borderRadius: 3,
                    border: `1px solid ${colors.hairline}`,
                    bgcolor: colors.white,
                    p: 1.5,
                }}
            >
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    alignItems={{ xs: "stretch", md: "center" }}
                    justifyContent="space-between"
                >
                    <Tabs
                        value={activeTab}
                        onChange={(_, val) => setActiveTab(val)}
                        sx={{
                            minHeight: 40,
                            "& .MuiTab-root": {
                                minHeight: 40,
                                py: 0.5,
                                px: 2,
                                fontWeight: 750,
                                fontSize: 13,
                                textTransform: "none",
                                borderRadius: 2,
                            },
                        }}
                    >
                        <Tab label={`All (${totalCount})`} value="all" />
                        <Tab label={`Unread (${unreadCount})`} value="unread" />
                        <Tab label={`Dispatches (${dispatchCount})`} value="dispatch" />
                        <Tab label={`Duty & Fleet (${dutyCount})`} value="duty" />
                    </Tabs>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <TextField
                            size="small"
                            placeholder="Filter alerts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sx={{ minWidth: { xs: "100%", sm: 220 } }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchOutlined fontSize="small" sx={{ color: colors.slate }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        {unreadCount > 0 && (
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleMarkAllRead}
                                startIcon={<DoneAllOutlined />}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 750,
                                    fontSize: 12.5,
                                    borderColor: colors.hairline,
                                    color: colors.ink,
                                    minHeight: 40,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                Mark all as read
                            </Button>
                        )}

                        <Button
                            variant="outlined"
                            size="small"
                            onClick={loadNotifications}
                            startIcon={<RefreshOutlined />}
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                borderColor: colors.hairline,
                                color: colors.ink,
                                minHeight: 40,
                            }}
                        >
                            Refresh
                        </Button>
                    </Stack>
                </Stack>
            </Card>

            {/* ERROR ALERT */}
            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}

            {/* NOTIFICATIONS LIST */}
            {loading ? (
                <Box py={8} display="grid" placeItems="center">
                    <CircularProgress size={36} sx={{ color: colors.pine }} />
                    <Typography fontSize={14} color={colors.slate} mt={2}>
                        Loading driver notifications...
                    </Typography>
                </Box>
            ) : filteredNotifications.length === 0 ? (
                <Card
                    elevation={0}
                    sx={{
                        p: 6,
                        textAlign: "center",
                        borderRadius: 3.5,
                        border: `1px solid ${colors.hairline}`,
                        bgcolor: colors.white,
                    }}
                >
                    <NotificationsOutlined sx={{ fontSize: 56, color: colors.hairline, mb: 1.5 }} />
                    <Typography fontSize={18} fontWeight={800} color={colors.ink}>
                        No Notifications Found
                    </Typography>
                    <Typography fontSize={13.5} color={colors.slate} mt={0.5} maxWidth={440} mx="auto">
                        {search
                            ? "No alerts match your filter search. Try clearing the filter."
                            : "Your dispatch callouts, patient transfer updates, and duty reminders will appear here."}
                    </Typography>
                    {search && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setSearch("")}
                            sx={{ mt: 2, textTransform: "none", fontWeight: 700 }}
                        >
                            Clear Filter
                        </Button>
                    )}
                </Card>
            ) : (
                <Stack spacing={2}>
                    {filteredNotifications.map((n) => {
                        const meta = getNotificationMeta(n);

                        return (
                            <Card
                                key={n._id}
                                elevation={0}
                                sx={{
                                    borderRadius: 3.5,
                                    border: `1px solid ${!n.isRead ? meta.borderLight : colors.hairline}`,
                                    bgcolor: !n.isRead ? "#FFFFFF" : "rgba(255,255,255,0.85)",
                                    boxShadow: !n.isRead
                                        ? "0 4px 20px rgba(0,0,0,0.04)"
                                        : "none",
                                    borderLeft: `5px solid ${meta.accentBorder}`,
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                        boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
                                        borderColor: meta.accentBorder,
                                    },
                                }}
                            >
                                <CardContent sx={{ p: { xs: 2.2, sm: 2.8 }, "&:last-child": { pb: { xs: 2.2, sm: 2.8 } } }}>
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        spacing={2}
                                        alignItems={{ xs: "flex-start", sm: "center" }}
                                        justifyContent="space-between"
                                    >
                                        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                                            <Box
                                                sx={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: 2.5,
                                                    bgcolor: meta.bgLight,
                                                    border: `1px solid ${meta.borderLight}`,
                                                    display: "grid",
                                                    placeItems: "center",
                                                    flexShrink: 0,
                                                    mt: 0.3,
                                                }}
                                            >
                                                {meta.icon}
                                            </Box>

                                            <Box>
                                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" mb={0.4}>
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
                                                    {!n.isRead && (
                                                        <Chip
                                                            label="New"
                                                            size="small"
                                                            sx={{
                                                                bgcolor: "#0F172A",
                                                                color: "#FFFFFF",
                                                                fontWeight: 850,
                                                                fontSize: 10,
                                                                height: 20,
                                                            }}
                                                        />
                                                    )}
                                                    <Typography fontSize={15} fontWeight={800} color={colors.ink}>
                                                        {n.title}
                                                    </Typography>
                                                </Stack>

                                                <Typography fontSize={13.5} color={colors.slate} lineHeight={1.5} mt={0.5}>
                                                    {n.message}
                                                </Typography>

                                                <Typography fontSize={12} color="#94A3B8" fontWeight={500} mt={0.8}>
                                                    {formatNotificationDate(n.createdAt)}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: "flex-end", sm: "center" }, flexShrink: 0 }}>
                                            {!n.isRead && (
                                                <Button
                                                    size="small"
                                                    variant="text"
                                                    onClick={(e) => handleMarkOneRead(n._id, e)}
                                                    sx={{
                                                        textTransform: "none",
                                                        fontSize: 12.5,
                                                        fontWeight: 700,
                                                        color: colors.slate,
                                                        "&:hover": { color: colors.ink },
                                                    }}
                                                >
                                                    Mark read
                                                </Button>
                                            )}
                                            {meta.actionPath && (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => handleCardAction(n, meta)}
                                                    endIcon={<ArrowForwardOutlined sx={{ fontSize: "14px !important" }} />}
                                                    sx={{
                                                        textTransform: "none",
                                                        fontSize: 12.5,
                                                        fontWeight: 750,
                                                        borderColor: meta.borderLight,
                                                        color: meta.color,
                                                        bgcolor: meta.bgLight,
                                                        borderRadius: 2,
                                                        "&:hover": {
                                                            borderColor: meta.color,
                                                            bgcolor: meta.bgLight,
                                                        },
                                                    }}
                                                >
                                                    {meta.actionLabel}
                                                </Button>
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
