import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
    Alert,
} from "@mui/material";
import {
    NotificationsOutlined,
    DoneAllRounded,
    CalendarMonthOutlined,
    EmergencyOutlined,
    DescriptionOutlined,
    LocalHospitalOutlined,
    ArrowForwardRounded,
    CheckCircleOutlined,
    SearchRounded,
    AdminPanelSettingsOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PageHeader from "../../components/dashboard/PageHeader";
import api from "../../services/api";

export default function AdminNotifications() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState("all");
    const [alert, setAlert] = useState({ type: "", message: "" });

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await api.get("/notifications/my");
            if (res.data.success) {
                setNotifications(res.data.notifications || []);
                setUnreadCount(res.data.unreadCount || 0);
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
            await api.put(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error("handleMarkOneRead error:", err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put("/notifications/read-all");
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
            setAlert({ type: "success", message: "All notifications marked as read." });
        } catch (err) {
            setAlert({ type: "error", message: "Failed to mark all as read." });
        }
    };

    const handleNavigateRelated = (n) => {
        if (!n.isRead) {
            handleMarkOneRead(n._id);
        }

        const msgLower = (n.message || "").toLowerCase();
        const titleLower = (n.title || "").toLowerCase();

        if (n.type === "Hospital" || titleLower.includes("hospital") || msgLower.includes("hospital")) {
            navigate("/admin/hospitals");
        } else if (n.type === "Emergency" || titleLower.includes("emergency") || msgLower.includes("emergency")) {
            navigate("/admin/ambulances");
        } else if (n.type === "Appointment") {
            navigate("/admin/reports");
        } else if (n.type === "Report") {
            navigate("/admin/reports");
        } else {
            navigate("/admin");
        }
    };

    const getIconForType = (type) => {
        switch (type) {
            case "Hospital":
                return <LocalHospitalOutlined color="primary" />;
            case "Emergency":
                return <EmergencyOutlined color="error" />;
            case "Appointment":
                return <CalendarMonthOutlined color="info" />;
            case "Report":
                return <DescriptionOutlined color="secondary" />;
            default:
                return <AdminPanelSettingsOutlined color="action" />;
        }
    };

    const filteredNotifications = useMemo(() => {
        return notifications.filter((n) => {
            const matchesSearch =
                (n.title || "").toLowerCase().includes(search.toLowerCase()) ||
                (n.message || "").toLowerCase().includes(search.toLowerCase());

            if (!matchesSearch) return false;

            if (tab === "unread") return !n.isRead;
            if (tab === "hospital") return n.type === "Hospital";
            if (tab === "emergency") return n.type === "Emergency";
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
                    unreadCount > 0 && (
                        <Button
                            variant="outlined"
                            startIcon={<DoneAllRounded />}
                            onClick={handleMarkAllRead}
                            sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700 }}
                        >
                            Mark All Read ({unreadCount})
                        </Button>
                    )
                }
            />

            {alert.message && (
                <Alert severity={alert.type} sx={{ mb: 3, borderRadius: 3 }}>
                    {alert.message}
                </Alert>
            )}

            <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #E3EBEE", mb: 3 }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        justifyContent="space-between"
                        alignItems={{ xs: "stretch", sm: "center" }}
                    >
                        <Tabs
                            value={tab}
                            onChange={(e, val) => setTab(val)}
                            sx={{
                                "& .MuiTab-root": {
                                    textTransform: "none",
                                    fontWeight: 700,
                                    fontSize: 14,
                                    minWidth: 100,
                                },
                            }}
                        >
                            <Tab label={`All (${notifications.length})`} value="all" />
                            <Tab
                                label={`Unread (${notifications.filter((n) => !n.isRead).length})`}
                                value="unread"
                            />
                            <Tab
                                label={`Hospitals (${notifications.filter((n) => n.type === "Hospital").length})`}
                                value="hospital"
                            />
                            <Tab
                                label={`Emergencies (${notifications.filter((n) => n.type === "Emergency").length})`}
                                value="emergency"
                            />
                        </Tabs>

                        <TextField
                            size="small"
                            placeholder="Search alerts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchRounded fontSize="small" color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ width: { xs: "100%", sm: 260 } }}
                        />
                    </Stack>
                </CardContent>
            </Card>

            <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #E3EBEE" }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    {loading ? (
                        <Box py={8} textAlign="center">
                            <CircularProgress />
                        </Box>
                    ) : filteredNotifications.length === 0 ? (
                        <Box py={8} textAlign="center">
                            <NotificationsOutlined sx={{ fontSize: 52, color: "text.secondary", mb: 1.5 }} />
                            <Typography fontWeight={800} variant="h6">
                                No Notifications Found
                            </Typography>
                            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                                {search
                                    ? "No notifications matched your search term."
                                    : "You have no active alerts in this category."}
                            </Typography>
                        </Box>
                    ) : (
                        <List disablePadding>
                            {filteredNotifications.map((n, idx) => (
                                <React.Fragment key={n._id}>
                                    {idx > 0 && <Divider />}
                                    <ListItem
                                        onClick={() => handleNavigateRelated(n)}
                                        sx={{
                                            py: 2,
                                            px: { xs: 1.5, sm: 2.5 },
                                            borderRadius: 2.5,
                                            bgcolor: n.isRead ? "transparent" : "rgba(15,82,75,0.03)",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                            "&:hover": {
                                                bgcolor: "rgba(15,82,75,0.06)",
                                            },
                                        }}
                                        secondaryAction={
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                {!n.isRead && (
                                                    <Tooltip title="Mark as read">
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={(e) => handleMarkOneRead(n._id, e)}
                                                        >
                                                            <CheckCircleOutlined fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                <Tooltip title="View details">
                                                    <IconButton size="small">
                                                        <ArrowForwardRounded fontSize="small" sx={{ color: "text.secondary" }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        }
                                    >
                                        <ListItemAvatar sx={{ minWidth: 48 }}>
                                            <Box
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 2.5,
                                                    bgcolor: n.isRead ? "action.hover" : "rgba(15,82,75,0.08)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                {getIconForType(n.type)}
                                            </Box>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <Typography fontWeight={n.isRead ? 600 : 800} fontSize={15}>
                                                        {n.title}
                                                    </Typography>
                                                    <Chip
                                                        label={n.type || "System"}
                                                        size="small"
                                                        variant="outlined"
                                                        color={
                                                            n.type === "Emergency"
                                                                ? "error"
                                                                : n.type === "Hospital"
                                                                ? "primary"
                                                                : "default"
                                                        }
                                                        sx={{ fontSize: 11, height: 20, fontWeight: 700 }}
                                                    />
                                                    {!n.isRead && (
                                                        <Box
                                                            sx={{
                                                                width: 8,
                                                                height: 8,
                                                                borderRadius: "50%",
                                                                bgcolor: "primary.main",
                                                            }}
                                                        />
                                                    )}
                                                </Stack>
                                            }
                                            secondary={
                                                <Box sx={{ mt: 0.5 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {n.message}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.disabled"
                                                        sx={{ mt: 0.5, display: "block" }}
                                                    >
                                                        {new Date(n.createdAt).toLocaleString()}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}
