import React, { useEffect, useState } from "react";
import {
    Box,
    Card,
    CardContent,
    CircularProgress,
    Grid,
    LinearProgress,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Alert,
    Rating,
    Chip,
} from "@mui/material";
import {
    AnalyticsOutlined,
    TrendingUpOutlined,
    LocalHospitalOutlined,
    EmergencyOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PageHeader from "../../components/dashboard/PageHeader";
import api from "../../services/api";

export default function AdminAnalytics() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchAnalytics = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.get("/admin/analytics");
            if (res.data.success) {
                setAnalytics(res.data.analytics);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load system analytics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const maxDaily = analytics?.dailyAppointments?.length
        ? Math.max(...analytics.dailyAppointments.map((d) => d.count), 1)
        : 1;

    const maxMonthly = analytics?.monthlyAppointments?.length
        ? Math.max(...analytics.monthlyAppointments.map((m) => m.count), 1)
        : 1;

    return (
        <DashboardLayout
            role="admin"
            title="System Analytics & Operational Intelligence"
            subtitle="Platform-wide patient appointment trends, emergency dispatch times, and hospital performance metrics"
        >
            <PageHeader
                title="Operational Intelligence & Analytics"
                subtitle="Aggregated multi-dimensional analytics derived directly from database records"
                backTo="/admin"
                backLabel="← Back to Dashboard"
            />

            {loading ? (
                <Box py={8} textAlign="center">
                    <CircularProgress />
                    <Typography color="text.secondary" mt={2} fontWeight={600}>
                        Computing analytics models...
                    </Typography>
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
                    {error}
                </Alert>
            ) : (
                <Grid container spacing={3}>
                    {/* 14-Day Appointment Traffic Trend */}
                    <Grid item xs={12} lg={6}>
                        <Card elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #E3EBEE", height: "100%" }}>
                            <Typography variant="h6" fontWeight={800} gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <TrendingUpOutlined color="primary" /> Daily Appointment Trajectory (14 Days)
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Daily booking volume aggregated across all registered hospitals
                            </Typography>

                            <Box sx={{ display: "flex", alignItems: "flex-end", height: 200, gap: 1, pt: 2 }}>
                                {analytics?.dailyAppointments?.map((d) => {
                                    const hPct = Math.max((d.count / maxDaily) * 100, 8);
                                    return (
                                        <Box
                                            key={d.date}
                                            sx={{
                                                flex: 1,
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                height: "100%",
                                                justifyContent: "flex-end",
                                            }}
                                        >
                                            <Typography fontSize={10} fontWeight={800} color="primary.main" sx={{ mb: 0.5 }}>
                                                {d.count}
                                            </Typography>
                                            <Box
                                                sx={{
                                                    width: "100%",
                                                    maxWidth: 24,
                                                    height: `${hPct}%`,
                                                    bgcolor: "#0F524B",
                                                    borderRadius: "4px 4px 0 0",
                                                }}
                                            />
                                            <Typography fontSize={9} color="text.secondary" fontWeight={600} sx={{ mt: 0.8 }} noWrap>
                                                {d.date.split(" ")[1] || d.date}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Card>
                    </Grid>

                    {/* 12-Month Longitudinal Trend */}
                    <Grid item xs={12} lg={6}>
                        <Card elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #E3EBEE", height: "100%" }}>
                            <Typography variant="h6" fontWeight={800} gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <AnalyticsOutlined color="secondary" /> Monthly Booking Volume (Last 12 Months)
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Annual patient engagement across seasonal healthcare periods
                            </Typography>

                            <Box sx={{ display: "flex", alignItems: "flex-end", height: 200, gap: 1, pt: 2 }}>
                                {analytics?.monthlyAppointments?.map((m) => {
                                    const hPct = Math.max((m.count / maxMonthly) * 100, 8);
                                    return (
                                        <Box
                                            key={m.month}
                                            sx={{
                                                flex: 1,
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                height: "100%",
                                                justifyContent: "flex-end",
                                            }}
                                        >
                                            <Typography fontSize={10} fontWeight={800} color="secondary.main" sx={{ mb: 0.5 }}>
                                                {m.count}
                                            </Typography>
                                            <Box
                                                sx={{
                                                    width: "100%",
                                                    maxWidth: 24,
                                                    height: `${hPct}%`,
                                                    bgcolor: "#0284C7",
                                                    borderRadius: "4px 4px 0 0",
                                                }}
                                            />
                                            <Typography fontSize={9} color="text.secondary" fontWeight={600} sx={{ mt: 0.8 }} noWrap>
                                                {m.month.split(" ")[0]}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Card>
                    </Grid>

                    {/* Hospital Performance Benchmark Table */}
                    <Grid item xs={12} md={8}>
                        <Card elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #E3EBEE" }}>
                            <Typography variant="h6" fontWeight={800} gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <LocalHospitalOutlined color="primary" /> Hospital Performance & Delivery Metrics
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                                Operational efficiency, patient completion rate, and verified center rating
                            </Typography>

                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "#F8FAFB" }}>
                                            <TableCell sx={{ fontWeight: 800 }}>Hospital Center</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>City</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Staff Count</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Total Appts</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Completed</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Patient Rating</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {analytics?.hospitalPerformance?.map((h) => (
                                            <TableRow key={h.name} hover>
                                                <TableCell sx={{ fontWeight: 700 }}>{h.name}</TableCell>
                                                <TableCell sx={{ color: "text.secondary" }}>{h.city}</TableCell>
                                                <TableCell>{h.doctors} Doctors</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>{h.totalAppointments}</TableCell>
                                                <TableCell sx={{ color: "success.main", fontWeight: 700 }}>
                                                    {h.completedAppointments}
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        <Rating value={h.rating} precision={0.5} readOnly size="small" />
                                                        <Typography variant="caption" fontWeight={700}>
                                                            ({h.rating.toFixed(1)})
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Card>
                    </Grid>

                    {/* Emergency Response Status Ratio */}
                    <Grid item xs={12} md={4}>
                        <Card elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #E3EBEE", height: "100%" }}>
                            <Typography variant="h6" fontWeight={800} gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <EmergencyOutlined color="error" /> Emergency Triage Status
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                                Proportion of patient emergency outcomes
                            </Typography>

                            <Stack spacing={2}>
                                {analytics?.emergencyBreakdown?.map((e) => (
                                    <Box key={e.status}>
                                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                            <Typography fontSize={13} fontWeight={700}>
                                                {e.status}
                                            </Typography>
                                            <Typography fontSize={13} color="text.secondary">
                                                {e.count} Requests
                                            </Typography>
                                        </Stack>
                                        <LinearProgress
                                            variant="determinate"
                                            value={Math.min((e.count / 20) * 100, 100)}
                                            color={
                                                e.status === "Completed"
                                                    ? "success"
                                                    : e.status === "Requested"
                                                    ? "error"
                                                    : "primary"
                                            }
                                            sx={{ height: 7, borderRadius: 3 }}
                                        />
                                    </Box>
                                ))}
                            </Stack>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </DashboardLayout>
    );
}
