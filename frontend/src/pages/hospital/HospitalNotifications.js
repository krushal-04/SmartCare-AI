import React, { useEffect, useState } from "react";
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
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Stack,
    Typography,
    Alert,
    Tooltip,
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
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PageHeader from "../../components/dashboard/PageHeader";
import api from "../../services/api";

export default function HospitalNotifications() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
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

        if (n.type === "Appointment") {
            navigate("/hospital/appointments");
        } else if (n.type === "Emergency") {
            navigate("/hospital/emergency");
        } else if (n.type === "Report") {
            navigate("/hospital/reports");
        } else if (n.type === "Hospital") {
            navigate("/hospital/profile");
        } else {
            navigate("/hospital");
        }
    };

    const getIconForType = (type) => {
        switch (type) {
            case "Appointment":
                return <CalendarMonthOutlined color="primary" />;
            case "Emergency":
                return <EmergencyOutlined color="error" />;
            case "Report":
                return <DescriptionOutlined color="info" />;
            case "Hospital":
            default:
                return <LocalHospitalOutlined color="secondary" />;
        }
    };

    return (
        <DashboardLayout
            role="hospital"
            title="Hospital Notifications"
            subtitle="Real-time operational alerts, appointment notices, and emergency signals"
        >
            <PageHeader
                title="Notifications & Alerts"
                subtitle="Track patient actions, system updates, and urgent notices"
                backTo="/hospital"
                backLabel="← Back to Dashboard"
                action={
                    unreadCount > 0 && (
                        <Button
                            variant="outlined"
                            startIcon={<DoneAllRounded />}
                            onClick={handleMarkAllRead}
                            sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700 }}
                        >
                            Mark All as Read ({unreadCount})
                        </Button>
                    )
                }
            />

            {alert.message && (
                <Alert severity={alert.type} sx={{ mb: 3, borderRadius: 3 }}>
                    {alert.message}
                </Alert>
            )}

            <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #E3EBEE" }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    {loading ? (
                        <Box py={8} textAlign="center">
                            <CircularProgress />
                        </Box>
                    ) : notifications.length === 0 ? (
                        <Box py={8} textAlign="center">
                            <NotificationsOutlined sx={{ fontSize: 52, color: "text.secondary", mb: 1.5 }} />
                            <Typography fontWeight={800} variant="h6">
                                All Caught Up
                            </Typography>
                            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                                You have no new hospital notifications at this time.
                            </Typography>
                        </Box>
                    ) : (
                        <List disablePadding>
                            {notifications.map((n, idx) => (
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
                                                <ArrowForwardRounded fontSize="small" sx={{ color: "text.secondary" }} />
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
                                                        label={n.type}
                                                        size="small"
                                                        variant="outlined"
                                                        color={n.type === "Emergency" ? "error" : "default"}
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
                                                    <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block" }}>
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
