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
    AccessTimeOutlined,
    ArrowForwardOutlined,
    SearchOutlined,
    LocalHospitalOutlined,
    AdminPanelSettingsOutlined,
    ReplayOutlined,
    ShieldOutlined,
    RefreshOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PageHeader from "../../components/dashboard/PageHeader";
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

// Admin category meta mapping
const getAdminNotificationMeta = (notification) => {
    const title = (notification.title || "").toLowerCase();
    const message = (notification.message || "").toLowerCase();
    const type = notification.type || "System";

    // 1. Emergency & Ambulance Dispatch
    if (type === "Emergency" || title.includes("emergency") || message.includes("emergency") || title.includes("ambulance") || message.includes("ambulance")) {
        return {
            category: "Emergency",
            label: "Emergency Dispatch",
            color: "#DC2626",
            bgLight: "#FEF2F2",
            borderLight: "#FECACA",
            accentBorder: "#DC2626",
            icon: <EmergencyOutlined sx={{ color: "#DC2626", fontSize: 22 }} />,
            actionLabel: "Ambulance Radar",
            actionPath: "/admin/ambulances",
        };
    }

    // 2. Hospital Onboarding & Approvals
    if (type === "Hospital" || title.includes("hospital") || message.includes("hospital") || title.includes("onboarding") || message.includes("registration")) {
        return {
            category: "Hospital",
            label: "Hospital Network",
            color: "#0D9488",
            bgLight: "#F0FDFA",
            borderLight: "#CCFBF1",
            accentBorder: "#0D9488",
            icon: <LocalHospitalOutlined sx={{ color: "#0D9488", fontSize: 22 }} />,
            actionLabel: "Manage Hospitals",
            actionPath: "/admin/hospitals",
        };
    }

    // 3. Payments, Refunds & Financial Auditing
    if (type === "Payment" || type === "Refund" || title.includes("refund") || message.includes("refund") || title.includes("payment") || message.includes("paid")) {
        return {
            category: "Payment",
            label: title.includes("refund") ? "Refund Reconciled" : "Payment Settlement",
            color: "#2563EB",
            bgLight: "#EFF6FF",
            borderLight: "#BFDBFE",
            accentBorder: "#2563EB",
            icon: <ReplayOutlined sx={{ color: "#2563EB", fontSize: 22 }} />,
            actionLabel: "Financial Audit",
            actionPath: "/admin/payments",
        };
    }

    // 4. Appointments & Reminders
    if (type === "Appointment" || title.includes("appointment") || message.includes("appointment") || title.includes("reminder") || message.includes("reminder")) {
        return {
            category: "Appointment",
            label: title.includes("reminder") ? "Reminder Dispatch" : "Appointment Flow",
            color: "#4F46E5",
            bgLight: "#EEF2FF",
            borderLight: "#C7D2FE",
            accentBorder: "#4F46E5",
            icon: <CalendarMonthOutlined sx={{ color: "#4F46E5", fontSize: 22 }} />,
            actionLabel: "Audit Reports",
            actionPath: "/admin/reports",
        };
    }

    // 5. Medical Reports & Clinical Audit
    if (type === "Report" || title.includes("report") || message.includes("report")) {
        return {
            category: "Report",
            label: "System & Lab Reports",
            color: "#7C3AED",
            bgLight: "#F5F3FF",
            borderLight: "#DDD6FE",
            accentBorder: "#7C3AED",
            icon: <DescriptionOutlined sx={{ color: "#7C3AED", fontSize: 22 }} />,
            actionLabel: "Audit Reports",
            actionPath: "/admin/reports",
        };
    }

    // 6. Platform Security & System Alerts
    return {
        category: "System",
        label: "Platform Security & Logs",
        color: "#475569",
        bgLight: "#F8FAFC",
        borderLight: "#E2E8F0",
        accentBorder: "#475569",
        icon: <AdminPanelSettingsOutlined sx={{ color: "#475569", fontSize: 22 }} />,
        actionLabel: "Platform Overview",
        actionPath: "/admin",
    };
};

export default function AdminNotifications() {
    const navigate = useNavigate();
    const { markAsRead: markGlobalAsRead, markAllAsRead: markGlobalAllRead } = useNotifications();

    const [notifications, setNotifications] = useState([]);
    const [, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState("all");
    const [alert, setAlert] = useState({ type: "", message: "" });

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await api.get("/notifications/my");
            if (res.data.success) {
                const list = res.data.notifications || [];
                setNotifications(list);
                setUnreadCount(res.data.unreadCount ?? list.filter((n) => !n.isRead).length);
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to load notifications.",
            });
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
            await markGlobalAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error("handleMarkOneRead error:", err);
            try {
                await api.put(`/notifications/${id}/read`);
                setNotifications((prev) =>
                    prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            } catch (fallbackErr) {
                console.error("Direct API mark read error:", fallbackErr);
            }
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markGlobalAllRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
            setAlert({ type: "success", message: "All notifications marked as read." });
        } catch (err) {
            try {
                await api.put("/notifications/read-all");
                setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                setUnreadCount(0);
                setAlert({ type: "success", message: "All notifications marked as read." });
            } catch (fallbackErr) {
                setAlert({ type: "error", message: "Failed to mark all as read." });
            }
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

    // Category KPI counts
    const totalCount = notifications.length;
    const computedUnread = notifications.filter((n) => !n.isRead).length;
    const hospitalCount = notifications.filter((n) => {
        const meta = getAdminNotificationMeta(n);
        return meta.category === "Hospital";
    }).length;
    const emergencyCount = notifications.filter((n) => {
        const meta = getAdminNotificationMeta(n);
        return meta.category === "Emergency";
    }).length;
    const appointmentCount = notifications.filter((n) => {
        const meta = getAdminNotificationMeta(n);
        return meta.category === "Appointment";
    }).length;

    // Filter and search logic
    const filteredNotifications = useMemo(() => {
        return notifications.filter((n) => {
            const q = search.toLowerCase().trim();
            const matchesSearch =
                !q ||
                (n.title || "").toLowerCase().includes(q) ||
                (n.message || "").toLowerCase().includes(q);

            if (!matchesSearch) return false;

            if (tab === "unread") return !n.isRead;
            if (tab === "hospital") {
                const meta = getAdminNotificationMeta(n);
                return meta.category === "Hospital";
            }
            if (tab === "emergency") {
                const meta = getAdminNotificationMeta(n);
                return meta.category === "Emergency";
            }
            if (tab === "appointment") {
                const meta = getAdminNotificationMeta(n);
                return meta.category === "Appointment";
            }
            if (tab === "system") {
                const meta = getAdminNotificationMeta(n);
                return meta.category === "System" || meta.category === "Report" || meta.category === "Payment";
            }
            return true;
        });
    }, [notifications, search, tab]);

    return (
        <DashboardLayout
            role="admin"
            title="Admin Notifications"
            subtitle="Platform security events, hospital onboarding requests, and emergency dispatches"
        >
            <PageHeader
                title="Admin Alert Center"
                subtitle="Review registration approvals, urgent emergency requests, and platform logs"
                backTo="/admin"
                backLabel="← Back to Dashboard"
                action={
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Button
                            variant="outlined"
                            startIcon={<RefreshOutlined />}
                            onClick={fetchNotifications}
                            sx={{
                                borderRadius: 2.2,
                                textTransform: "none",
                                fontWeight: 700,
                                borderColor: colors.hairline,
                                color: colors.slate,
                                bgcolor: colors.white,
                                "&:hover": { bgcolor: "#F8FAFC", borderColor: colors.slate },
                            }}
                        >
                            Refresh
                        </Button>
                        {computedUnread > 0 && (
                            <Button
                                variant="contained"
                                startIcon={<DoneAllOutlined />}
                                onClick={handleMarkAllRead}
                                sx={{
                                    borderRadius: 2.2,
                                    textTransform: "none",
                                    fontWeight: 750,
                                    bgcolor: colors.pine,
                                    "&:hover": { bgcolor: colors.pineDeep },
                                }}
                            >
                                Mark All Read ({computedUnread})
                            </Button>
                        )}
                    </Stack>
                }
            />

            {alert.message && (
                <Alert
                    severity={alert.type || "info"}
                    sx={{ mb: 3, borderRadius: 3 }}
                    onClose={() => setAlert({ type: "", message: "" })}
                >
                    {alert.message}
                </Alert>
            )}

            {/* KPI STATS BAR */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
                    gap: 2,
                    mb: 3,
                }}
            >
                {/* 1. Total Platform Alerts */}
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
                            Platform Alerts
                        </Typography>
                    </Box>
                </Card>

                {/* 2. Action Required (Unread) */}
                <Card
                    elevation={0}
                    sx={{
                        p: 2.2,
                        borderRadius: 3,
                        border: computedUnread > 0 ? "1px solid #FECACA" : `1px solid ${colors.hairline}`,
                        bgcolor: computedUnread > 0 ? "#FEF2F2" : colors.white,
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
                            bgcolor: computedUnread > 0 ? "#FEE2E2" : "#F1F5F9",
                            display: "grid",
                            placeItems: "center",
                            color: computedUnread > 0 ? "#DC2626" : colors.slate,
                        }}
                    >
                        <ShieldOutlined />
                    </Box>
                    <Box>
                        <Typography
                            fontSize={22}
                            fontWeight={850}
                            color={computedUnread > 0 ? "#DC2626" : colors.ink}
                            lineHeight={1.1}
                        >
                            {computedUnread}
                        </Typography>
                        <Typography
                            fontSize={12}
                            color={computedUnread > 0 ? "#B91C1C" : colors.slate}
                            fontWeight={600}
                        >
                            Action Required
                        </Typography>
                    </Box>
                </Card>

                {/* 3. Hospital Network */}
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
                        <LocalHospitalOutlined />
                    </Box>
                    <Box>
                        <Typography fontSize={22} fontWeight={850} color={colors.ink} lineHeight={1.1}>
                            {hospitalCount}
                        </Typography>
                        <Typography fontSize={12} color={colors.slate} fontWeight={600}>
                            Hospital Requests
                        </Typography>
                    </Box>
                </Card>

                {/* 4. Emergency Dispatches */}
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
                        <Typography
                            fontSize={22}
                            fontWeight={850}
                            color={emergencyCount > 0 ? "#DC2626" : colors.ink}
                            lineHeight={1.1}
                        >
                            {emergencyCount}
                        </Typography>
                        <Typography
                            fontSize={12}
                            color={emergencyCount > 0 ? "#B91C1C" : colors.slate}
                            fontWeight={600}
                        >
                            Emergency Signals
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
                        value={tab}
                        onChange={(e, val) => setTab(val)}
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
                                    {computedUnread > 0 && (
                                        <Chip
                                            label={computedUnread}
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
                        <Tab label={`Hospitals (${hospitalCount})`} value="hospital" />
                        <Tab label={`Emergencies (${emergencyCount})`} value="emergency" />
                        <Tab label={`Appointments (${appointmentCount})`} value="appointment" />
                        <Tab label="System & Logs" value="system" />
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
                    </Stack>
                </Stack>
            </Card>

            {/* NOTIFICATIONS CARDS LIST */}
            {loading ? (
                <Box textAlign="center" py={8}>
                    <CircularProgress sx={{ color: colors.pine }} />
                    <Typography mt={2} color={colors.slate} fontSize={14}>
                        Loading platform alerts...
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
                        {search || tab !== "all"
                            ? "No alerts match your active filter."
                            : "There are no pending platform notifications or urgent dispatches at this time."}
                    </Typography>
                </Card>
            ) : (
                <Stack spacing={1.8}>
                    {filteredNotifications.map((item) => {
                        const meta = getAdminNotificationMeta(item);
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
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        flexWrap: "wrap",
                                                        gap: 1,
                                                        mb: 0.6,
                                                    }}
                                                >
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
