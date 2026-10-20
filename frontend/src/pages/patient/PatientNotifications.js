import { useEffect, useState } from "react";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Stack,
    Typography,
} from "@mui/material";

import {
    DoneAllOutlined,
    NotificationsOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../services/api";

export default function PatientNotifications() {
    const [
        notifications,
        setNotifications,
    ] = useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const loadNotifications =
        async () => {
            try {
                setLoading(true);

                const response =
                    await api.get(
                        "/notifications/my"
                    );

                setNotifications(
                    response.data
                        .notifications ||
                        []
                );
            } catch (err) {
                setError(
                    err.response?.data
                        ?.message ||
                        "Unable to load notifications."
                );
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        loadNotifications();
    }, []);

    const read =
        async (id) => {
            try {
                await api.put(
                    `/notifications/${id}/read`
                );

                loadNotifications();
            } catch {}
        };

    const readAll =
        async () => {
            try {
                await api.put(
                    "/notifications/read-all"
                );

                loadNotifications();
            } catch {}
        };

    return (
        <DashboardLayout
            role="patient"
            title="Notifications"
            subtitle="Stay updated with your healthcare activity"
        >
            <Stack
                direction={{
                    xs: "column",
                    sm: "row",
                }}
                justifyContent="space-between"
                mb={3}
                gap={2}
            >
                <Box>
                    <Typography
                        fontSize={26}
                        fontWeight={900}
                    >
                        Notifications
                    </Typography>

                    <Typography
                        color="text.secondary"
                    >
                        Appointment, report and emergency
                        updates.
                    </Typography>
                </Box>

                <Button
                    variant="outlined"
                    startIcon={
                        <DoneAllOutlined />
                    }
                    onClick={readAll}
                >
                    Mark all as read
                </Button>
            </Stack>

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                >
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box
                    textAlign="center"
                    py={7}
                >
                    <CircularProgress />
                </Box>
            ) : notifications.length ===
              0 ? (
                <Card
                    elevation={0}
                    sx={{
                        border:
                            "1px solid #E3EBEE",
                        borderRadius: 4,
                    }}
                >
                    <CardContent
                        sx={{
                            py: 7,
                            textAlign:
                                "center",
                        }}
                    >
                        <NotificationsOutlined
                            sx={{
                                fontSize: 52,
                                color:
                                    "#0B8793",
                            }}
                        />

                        <Typography
                            fontWeight={900}
                            mt={1}
                        >
                            No notifications
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                notifications.map(
                    (item) => (
                        <Card
                            key={
                                item._id
                            }
                            elevation={0}
                            sx={{
                                mb: 1.5,
                                border:
                                    "1px solid #E3EBEE",
                                borderRadius: 3,
                                bgcolor:
                                    item.isRead
                                        ? "#fff"
                                        : "#F1FAFA",
                            }}
                        >
                            <CardContent
                                sx={{
                                    p: 2.5,
                                }}
                            >
                                <Stack
                                    direction={{
                                        xs: "column",
                                        sm: "row",
                                    }}
                                    justifyContent="space-between"
                                    gap={2}
                                >
                                    <Box>
                                        <Stack
                                            direction="row"
                                            spacing={
                                                1
                                            }
                                            alignItems="center"
                                        >
                                            <Typography
                                                fontWeight={
                                                    900
                                                }
                                            >
                                                {
                                                    item.title
                                                }
                                            </Typography>

                                            {!item.isRead && (
                                                <Chip
                                                    size="small"
                                                    label="New"
                                                    color="primary"
                                                />
                                            )}
                                        </Stack>

                                        <Typography
                                            color="text.secondary"
                                            mt={
                                                0.6
                                            }
                                        >
                                            {
                                                item.message
                                            }
                                        </Typography>

                                        <Typography
                                            fontSize={
                                                11
                                            }
                                            color="text.secondary"
                                            mt={
                                                1
                                            }
                                        >
                                            {item.createdAt
                                                ? new Date(
                                                      item.createdAt
                                                  ).toLocaleString()
                                                : "—"}
                                        </Typography>
                                    </Box>

                                    {!item.isRead && (
                                        <Button
                                            size="small"
                                            onClick={() =>
                                                read(
                                                    item._id
                                                )
                                            }
                                        >
                                            Mark read
                                        </Button>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    )
                )
            )}
        </DashboardLayout>
    );
}