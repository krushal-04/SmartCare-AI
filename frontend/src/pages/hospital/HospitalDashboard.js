import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Grid,
    LinearProgress,
    Stack,
    Typography,
    Alert,
} from "@mui/material";
import {
    CalendarMonthOutlined,
    DomainOutlined,
    EmergencyOutlined,
    GroupOutlined,
    LocalHospitalOutlined,
    MedicalServicesOutlined,
    ScheduleOutlined,
    DescriptionOutlined,
    NotificationsOutlined,
    VerifiedOutlined,
    CheckCircleOutlined,
    TrendingUpOutlined,
    ArrowForwardRounded,
    RefreshRounded,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../services/api";

export default function HospitalDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [stats, setStats] = useState(null);
    const [charts, setCharts] = useState(null);

    const fetchStats = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.get("/hospitals/dashboard-stats");
            if (res.data.success) {
                setStats(res.data.stats);
                setCharts(res.data.charts);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load dashboard statistics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const maxDaily = charts?.dailyAppointments?.length
        ? Math.max(...charts.dailyAppointments.map((d) => d.count), 1)
        : 1;

    const maxMonthly = charts?.monthlyTrends?.length
        ? Math.max(...charts.monthlyTrends.map((m) => m.count), 1)
        : 1;

    return (
        <DashboardLayout
            role="hospital"
            title={stats?.hospitalName || "Hospital Operations Dashboard"}
            subtitle="Real-time healthcare facility activity and clinical management"
        >
            {/* Top Bar with Approval Badge & Refresh */}
            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                gap={2}
                sx={{ mb: 3 }}
            >
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Chip
                        icon={<VerifiedOutlined sx={{ fontSize: "18px !important" }} />}
                        label={`Status: ${stats?.approvalStatus || "Approved"}`}
                        color={stats?.approvalStatus === "Approved" ? "success" : "warning"}
                        sx={{ fontWeight: 800, px: 0.5 }}
                    />
                    {stats?.isVerified && (
                        <Chip
                            icon={<CheckCircleOutlined sx={{ fontSize: "16px !important" }} />}
                            label="Government Verified"
                            variant="outlined"
                            color="primary"
                            sx={{ fontWeight: 700 }}
                        />
                    )}
                </Stack>

                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<RefreshRounded />}
                    onClick={fetchStats}
                    sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700 }}
                >
                    Refresh Data
                </Button>
            </Stack>

            {loading ? (
                <Box py={10} textAlign="center">
                    <CircularProgress />
                    <Typography color="text.secondary" mt={2} fontWeight={600}>
                        Loading real-time hospital statistics...
                    </Typography>
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
                    {error}
                </Alert>
            ) : (
                <>
                    {/* Key Metrics Grid */}
                    <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                        {[
                            {
                                label: "Total Doctors",
                                value: stats?.totalDoctors ?? 0,
                                icon: <MedicalServicesOutlined sx={{ fontSize: 28 }} />,
                                color: "#0F524B",
                                bg: "rgba(15,82,75,0.08)",
                                path: "/hospital/doctors",
                            },
                            {
                                label: "Departments",
                                value: stats?.totalDepartments ?? 0,
                                icon: <DomainOutlined sx={{ fontSize: 28 }} />,
                                color: "#0284C7",
                                bg: "rgba(2,132,199,0.08)",
                                path: "/hospital/departments",
                            },
                            {
                                label: "Total Appointments",
                                value: stats?.totalAppointments ?? 0,
                                icon: <CalendarMonthOutlined sx={{ fontSize: 28 }} />,
                                color: "#7C3AED",
                                bg: "rgba(124,58,237,0.08)",
                                path: "/hospital/appointments",
                            },
                            {
                                label: "Today's Appointments",
                                value: stats?.todayAppointments ?? 0,
                                icon: <ScheduleOutlined sx={{ fontSize: 28 }} />,
                                color: "#D97706",
                                bg: "rgba(217,119,6,0.08)",
                                path: "/hospital/appointments",
                            },
                            {
                                label: "Upcoming Appointments",
                                value: stats?.upcomingAppointments ?? 0,
                                icon: <TrendingUpOutlined sx={{ fontSize: 28 }} />,
                                color: "#059669",
                                bg: "rgba(5,150,105,0.08)",
                                path: "/hospital/appointments",
                            },
                            {
                                label: "Registered Patients",
                                value: stats?.totalPatients ?? 0,
                                icon: <GroupOutlined sx={{ fontSize: 28 }} />,
                                color: "#2563EB",
                                bg: "rgba(37,99,235,0.08)",
                                path: "/hospital/patients",
                            },
                            {
                                label: "Emergency Requests",
                                value: stats?.emergencyRequests ?? 0,
                                icon: <EmergencyOutlined sx={{ fontSize: 28 }} />,
                                color: "#DC2626",
                                bg: "rgba(220,38,38,0.08)",
                                path: "/hospital/emergency",
                            },
                            {
                                label: "Medical Reports",
                                value: stats?.medicalReports ?? 0,
                                icon: <DescriptionOutlined sx={{ fontSize: 28 }} />,
                                color: "#4B5563",
                                bg: "rgba(75,85,99,0.08)",
                                path: "/hospital/reports",
                            },
                        ].map((item) => (
                            <Grid item xs={12} sm={6} md={3} key={item.label}>
                                <Card
                                    elevation={0}
                                    onClick={() => navigate(item.path)}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: 3.5,
                                        border: "1px solid #E3EBEE",
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                            transform: "translateY(-3px)",
                                            boxShadow: "0 10px 20px rgba(15,82,75,0.07)",
                                            borderColor: item.color,
                                        },
                                    }}
                                >
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                                {item.label}
                                            </Typography>
                                            <Typography variant="h4" fontWeight={900} sx={{ mt: 0.5, color: "#1E293B" }}>
                                                {item.value}
                                            </Typography>
                                        </Box>
                                        <Box
                                            sx={{
                                                width: 52,
                                                height: 52,
                                                borderRadius: 3,
                                                bgcolor: item.bg,
                                                color: item.color,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            {item.icon}
                                        </Box>
                                    </Stack>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Charts Section */}
                    <Grid container spacing={3} sx={{ mb: 3.5 }}>
                        {/* Daily Appointments Trend (7 Days) */}
                        <Grid item xs={12} md={6}>
                            <Card elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #E3EBEE", height: "100%" }}>
                                <Typography variant="h6" fontWeight={800} gutterBottom>
                                    Daily Appointments (Last 7 Days)
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Live booking traffic processed by your hospital
                                </Typography>

                                <Box sx={{ display: "flex", alignItems: "flex-end", height: 180, gap: 2, pt: 2 }}>
                                    {charts?.dailyAppointments?.map((d) => {
                                        const heightPercent = Math.max((d.count / maxDaily) * 100, 10);
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
                                                <Typography fontSize={11} fontWeight={800} color="primary.main" sx={{ mb: 0.5 }}>
                                                    {d.count}
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        width: "100%",
                                                        maxWidth: 36,
                                                        height: `${heightPercent}%`,
                                                        bgcolor: "#0F524B",
                                                        borderRadius: "6px 6px 0 0",
                                                        transition: "height 0.3s ease",
                                                    }}
                                                />
                                                <Typography fontSize={11} color="text.secondary" fontWeight={600} sx={{ mt: 1 }}>
                                                    {d.label}
                                                </Typography>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Card>
                        </Grid>

                        {/* Monthly Trends */}
                        <Grid item xs={12} md={6}>
                            <Card elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #E3EBEE", height: "100%" }}>
                                <Typography variant="h6" fontWeight={800} gutterBottom>
                                    Monthly Trend (Last 6 Months)
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Monthly patient consults volume
                                </Typography>

                                <Box sx={{ display: "flex", alignItems: "flex-end", height: 180, gap: 2, pt: 2 }}>
                                    {charts?.monthlyTrends?.map((m) => {
                                        const heightPercent = Math.max((m.count / maxMonthly) * 100, 10);
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
                                                <Typography fontSize={11} fontWeight={800} color="secondary.main" sx={{ mb: 0.5 }}>
                                                    {m.count}
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        width: "100%",
                                                        maxWidth: 36,
                                                        height: `${heightPercent}%`,
                                                        bgcolor: "#0284C7",
                                                        borderRadius: "6px 6px 0 0",
                                                        transition: "height 0.3s ease",
                                                    }}
                                                />
                                                <Typography fontSize={11} color="text.secondary" fontWeight={600} sx={{ mt: 1 }}>
                                                    {m.month.split(" ")[0]}
                                                </Typography>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Card>
                        </Grid>

                        {/* Department Distribution */}
                        <Grid item xs={12} md={6}>
                            <Card elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #E3EBEE" }}>
                                <Typography variant="h6" fontWeight={800} gutterBottom>
                                    Department Utilization
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                                    Appointments assigned per department
                                </Typography>

                                {charts?.departmentUsage?.length === 0 ? (
                                    <Typography color="text.secondary" fontSize={14}>
                                        No departments registered yet.
                                    </Typography>
                                ) : (
                                    <Stack spacing={2}>
                                        {charts?.departmentUsage?.map((dept) => {
                                            const total = stats?.totalAppointments || 1;
                                            const pct = Math.round((dept.count / total) * 100);
                                            return (
                                                <Box key={dept.name}>
                                                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                                        <Typography fontSize={13} fontWeight={700}>
                                                            {dept.name}
                                                        </Typography>
                                                        <Typography fontSize={13} color="text.secondary">
                                                            {dept.count} appts ({pct}%)
                                                        </Typography>
                                                    </Stack>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={pct}
                                                        sx={{ height: 8, borderRadius: 4, bgcolor: "#E2E8F0" }}
                                                    />
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                )}
                            </Card>
                        </Grid>

                        {/* Emergency Status Breakdown */}
                        <Grid item xs={12} md={6}>
                            <Card elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #E3EBEE" }}>
                                <Typography variant="h6" fontWeight={800} gutterBottom>
                                    Emergency Operations Status
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                                    Breakdown of patient emergency calls
                                </Typography>

                                <Grid container spacing={1.5}>
                                    {[
                                        { label: "Requested", val: charts?.emergencyBreakdown?.requested || 0, color: "warning" },
                                        { label: "Ambulance Assigned", val: charts?.emergencyBreakdown?.assigned || 0, color: "info" },
                                        { label: "On The Way", val: charts?.emergencyBreakdown?.onTheWay || 0, color: "secondary" },
                                        { label: "Arrived", val: charts?.emergencyBreakdown?.arrived || 0, color: "primary" },
                                        { label: "Completed", val: charts?.emergencyBreakdown?.completed || 0, color: "success" },
                                        { label: "Cancelled", val: charts?.emergencyBreakdown?.cancelled || 0, color: "error" },
                                    ].map((e) => (
                                        <Grid item xs={6} key={e.label}>
                                            <Box
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: 2.5,
                                                    border: "1px solid #EAEAEA",
                                                    bgcolor: "#FAFCFC",
                                                }}
                                            >
                                                <Typography fontSize={12} color="text.secondary" fontWeight={600}>
                                                    {e.label}
                                                </Typography>
                                                <Typography variant="h6" fontWeight={900} sx={{ mt: 0.5 }}>
                                                    {e.val}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Quick Operational Shortcuts */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                            Quick Operational Actions
                        </Typography>
                        <Grid container spacing={2}>
                            {[
                                {
                                    title: "Manage Doctors",
                                    desc: "Add or edit doctors, fees & qualifications",
                                    icon: <MedicalServicesOutlined />,
                                    path: "/hospital/doctors",
                                },
                                {
                                    title: "Manage Departments",
                                    desc: "Add specialty units & services",
                                    icon: <DomainOutlined />,
                                    path: "/hospital/departments",
                                },
                                {
                                    title: "Duty Schedules",
                                    desc: "Configure working hours & time slots",
                                    icon: <ScheduleOutlined />,
                                    path: "/hospital/schedules",
                                },
                                {
                                    title: "Process Appointments",
                                    desc: "Confirm, complete or reject appointments",
                                    icon: <CalendarMonthOutlined />,
                                    path: "/hospital/appointments",
                                },
                                {
                                    title: "Emergency Dispatch",
                                    desc: "Incoming emergencies & ambulance dispatch",
                                    icon: <EmergencyOutlined />,
                                    path: "/hospital/emergency",
                                    highlight: true,
                                },
                                {
                                    title: "Upload Medical Reports",
                                    desc: "Send diagnostic reports directly to patients",
                                    icon: <DescriptionOutlined />,
                                    path: "/hospital/reports",
                                },
                            ].map((a) => (
                                <Grid item xs={12} sm={6} md={4} key={a.title}>
                                    <Card
                                        elevation={0}
                                        onClick={() => navigate(a.path)}
                                        sx={{
                                            p: 2.5,
                                            borderRadius: 3.5,
                                            border: "1px solid",
                                            borderColor: a.highlight ? "error.light" : "#E3EBEE",
                                            bgcolor: a.highlight ? "rgba(220,38,38,0.02)" : "background.paper",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                            "&:hover": {
                                                borderColor: a.highlight ? "error.main" : "primary.main",
                                                transform: "translateY(-2px)",
                                                boxShadow: "0 8px 16px rgba(15,82,75,0.06)",
                                            },
                                        }}
                                    >
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Box
                                                sx={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: 2.5,
                                                    bgcolor: a.highlight ? "rgba(220,38,38,0.1)" : "rgba(15,82,75,0.08)",
                                                    color: a.highlight ? "error.main" : "primary.main",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                {a.icon}
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography fontWeight={800} fontSize={15}>
                                                    {a.title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" fontSize={12}>
                                                    {a.desc}
                                                </Typography>
                                            </Box>
                                            <ArrowForwardRounded fontSize="small" sx={{ color: "text.secondary" }} />
                                        </Stack>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </>
            )}
        </DashboardLayout>
    );
}