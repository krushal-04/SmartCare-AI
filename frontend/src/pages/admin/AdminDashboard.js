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
    AdminPanelSettingsOutlined,
    AnalyticsOutlined,
    DomainOutlined,
    EmergencyOutlined,
    GroupOutlined,
    LocalHospitalOutlined,
    LocalPharmacyOutlined,
    MedicalServicesOutlined,
    TimeToLeaveOutlined,
    DescriptionOutlined,
    NotificationsOutlined,
    RefreshRounded,
    ArrowForwardRounded,
    CheckCircleOutline,
    HourglassEmptyRounded,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../services/api";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [stats, setStats] = useState(null);
    const [charts, setCharts] = useState(null);

    const fetchStats = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.get("/admin/dashboard-stats");
            if (res.data.success) {
                setStats(res.data.stats);
                setCharts(res.data.charts);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load administrative dashboard.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const maxAppointmentTrend = charts?.appointmentTrend?.length
        ? Math.max(...charts.appointmentTrend.map((a) => a.appointments), 1)
        : 1;

    const maxUserGrowth = charts?.userGrowth?.length
        ? Math.max(...charts.userGrowth.map((u) => u.users), 1)
        : 1;

    return (
        <DashboardLayout
            role="admin"
            title="System Administration Console"
            subtitle="Platform-wide healthcare operations, compliance, fleet, and security"
        >
            {/* Top Toolbar */}
            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                gap={2}
                sx={{ mb: 3 }}
            >
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Chip
                        icon={<AdminPanelSettingsOutlined sx={{ fontSize: "18px !important" }} />}
                        label="Super Administrator"
                        color="primary"
                        sx={{ fontWeight: 800, px: 0.5 }}
                    />

                </Stack>

                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<RefreshRounded />}
                    onClick={fetchStats}
                    sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700 }}
                >
                    Refresh Metrics
                </Button>
            </Stack>


            {stats?.pendingHospitals > 0 && (
                <Alert
                    severity="warning"
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            onClick={() => navigate("/admin/hospitals?filter=Pending")}
                            sx={{ fontWeight: 800, textTransform: "none" }}
                        >
                            Review Applications ({stats.pendingHospitals})
                        </Button>
                    }
                    sx={{ mb: 3, borderRadius: 3 }}
                >
                    <strong>Action Required:</strong> {stats.pendingHospitals} hospital registration application(s) awaiting verification and approval.
                </Alert>
            )}

            {loading ? (
                <Box py={10} textAlign="center">
                    <CircularProgress />
                    <Typography color="text.secondary" mt={2} fontWeight={600}>
                        Loading platform statistics from database...
                    </Typography>
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
                    {error}
                </Alert>
            ) : (
                <>

                    <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                        {[
                            {
                                label: "Total Users",
                                value: stats?.totalUsers ?? 0,
                                sub: `${stats?.totalPatients ?? 0} Patients`,
                                icon: <GroupOutlined sx={{ fontSize: 26 }} />,
                                color: "#0F524B",
                                bg: "rgba(15,82,75,0.08)",
                                path: "/admin/users",
                            },
                            {
                                label: "Total Hospitals",
                                value: stats?.totalHospitals ?? 0,
                                sub: `${stats?.approvedHospitals ?? 0} Approved • ${stats?.pendingHospitals ?? 0} Pending`,
                                icon: <LocalHospitalOutlined sx={{ fontSize: 26 }} />,
                                color: "#0284C7",
                                bg: "rgba(2,132,199,0.08)",
                                path: "/admin/hospitals",
                            },
                            {
                                label: "Pending Approvals",
                                value: stats?.pendingHospitals ?? 0,
                                sub: "Awaiting Admin Review",
                                icon: <HourglassEmptyRounded sx={{ fontSize: 26 }} />,
                                color: "#D97706",
                                bg: "rgba(217,119,6,0.08)",
                                path: "/admin/hospitals?filter=Pending",
                            },
                            {
                                label: "Doctors Network",
                                value: stats?.totalDoctors ?? 0,
                                sub: `${stats?.totalDepartments ?? 0} Specialties`,
                                icon: <MedicalServicesOutlined sx={{ fontSize: 26 }} />,
                                color: "#7C3AED",
                                bg: "rgba(124,58,237,0.08)",
                                path: "/admin/doctors",
                            },
                            {
                                label: "Total Appointments",
                                value: stats?.totalAppointments ?? 0,
                                sub: `${stats?.todayAppointments ?? 0} Today`,
                                icon: <AnalyticsOutlined sx={{ fontSize: 26 }} />,
                                color: "#059669",
                                bg: "rgba(5,150,105,0.08)",
                                path: "/admin/analytics",
                            },
                            {
                                label: "Emergency Distress",
                                value: stats?.emergencyRequests ?? 0,
                                sub: "Ambulance Dispatches",
                                icon: <EmergencyOutlined sx={{ fontSize: 26 }} />,
                                color: "#DC2626",
                                bg: "rgba(220,38,38,0.08)",
                                path: "/admin/analytics",
                            },
                            {
                                label: "Ambulance Fleet",
                                value: stats?.totalAmbulances ?? 0,
                                sub: "Active Vehicles",
                                icon: <TimeToLeaveOutlined sx={{ fontSize: 26 }} />,
                                color: "#4B5563",
                                bg: "rgba(75,85,99,0.08)",
                                path: "/admin/ambulances",
                            },
                            /*
                            {
                                label: "Pharmacy Catalog",
                                value: stats?.totalMedicines ?? 0,
                                sub: "Verified Formulations",
                                icon: <LocalPharmacyOutlined sx={{ fontSize: 26 }} />,
                                color: "#0D9488",
                                bg: "rgba(13,148,136,0.08)",
                                path: "/admin/medicines",
                            },
                            */
                        ].map((m) => (
                            <Grid item xs={12} sm={6} md={3} key={m.label}>
                                <Card
                                    elevation={0}
                                    onClick={() => navigate(m.path)}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: 3.5,
                                        border: "1px solid #E3EBEE",
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                            transform: "translateY(-3px)",
                                            boxShadow: "0 10px 20px rgba(15,82,75,0.07)",
                                            borderColor: m.color,
                                        },
                                    }}
                                >
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                        <Box>
                                            <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                                {m.label}
                                            </Typography>
                                            <Typography variant="h4" fontWeight={900} sx={{ mt: 0.5, color: "#1E293B" }}>
                                                {m.value}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block", fontWeight: 600 }}>
                                                {m.sub}
                                            </Typography>
                                        </Box>
                                        <Box
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 2.5,
                                                bgcolor: m.bg,
                                                color: m.color,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            {m.icon}
                                        </Box>
                                    </Stack>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Analytics Charts */}
                    <Grid container spacing={3} sx={{ mb: 3.5 }}>
                        {/* 7-Day Appointments Bar Chart */}
                        <Grid item xs={12} md={6}>
                            <Card elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #E3EBEE", height: "100%" }}>
                                <Typography variant="h6" fontWeight={800} gutterBottom>
                                    Platform Appointment Bookings (Last 7 Days)
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    System-wide patient booking volume
                                </Typography>

                                <Box sx={{ display: "flex", alignItems: "flex-end", height: 180, gap: 2, pt: 2 }}>
                                    {charts?.appointmentTrend?.map((d) => {
                                        const hPct = Math.max((d.appointments / maxAppointmentTrend) * 100, 10);
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
                                                    {d.appointments}
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        width: "100%",
                                                        maxWidth: 36,
                                                        height: `${hPct}%`,
                                                        bgcolor: "#0F524B",
                                                        borderRadius: "6px 6px 0 0",
                                                    }}
                                                />
                                                <Typography fontSize={11} color="text.secondary" fontWeight={600} sx={{ mt: 1 }}>
                                                    {d.day}
                                                </Typography>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Card>
                        </Grid>

                        {/* User Growth (Last 6 Months) */}
                        <Grid item xs={12} md={6}>
                            <Card elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #E3EBEE", height: "100%" }}>
                                <Typography variant="h6" fontWeight={800} gutterBottom>
                                    User Registration Growth (Last 6 Months)
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Patient and hospital onboarding trajectory
                                </Typography>

                                <Box sx={{ display: "flex", alignItems: "flex-end", height: 180, gap: 2, pt: 2 }}>
                                    {charts?.userGrowth?.map((u) => {
                                        const hPct = Math.max((u.users / maxUserGrowth) * 100, 10);
                                        return (
                                            <Box
                                                key={u.month}
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
                                                    {u.users}
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        width: "100%",
                                                        maxWidth: 36,
                                                        height: `${hPct}%`,
                                                        bgcolor: "#0284C7",
                                                        borderRadius: "6px 6px 0 0",
                                                    }}
                                                />
                                                <Typography fontSize={11} color="text.secondary" fontWeight={600} sx={{ mt: 1 }}>
                                                    {u.month.split(" ")[0]}
                                                </Typography>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Card>
                        </Grid>

                        {/* Emergency Triage Status Breakdown */}
                        <Grid item xs={12} md={6}>
                            <Card elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #E3EBEE" }}>
                                <Typography variant="h6" fontWeight={800} gutterBottom>
                                    Emergency Response Status
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                                    System-wide distress call lifecycle
                                </Typography>

                                <Grid container spacing={1.5}>
                                    {[
                                        { label: "Requested", val: charts?.emergencyBreakdown?.requested || 0, color: "error" },
                                        { label: "Ambulance Assigned", val: charts?.emergencyBreakdown?.assigned || 0, color: "warning" },
                                        { label: "On The Way", val: charts?.emergencyBreakdown?.onTheWay || 0, color: "secondary" },
                                        { label: "Arrived On Scene", val: charts?.emergencyBreakdown?.arrived || 0, color: "info" },
                                        { label: "Completed", val: charts?.emergencyBreakdown?.completed || 0, color: "success" },
                                        { label: "Cancelled", val: charts?.emergencyBreakdown?.cancelled || 0, color: "default" },
                                    ].map((e) => (
                                        <Grid item xs={6} sm={4} key={e.label}>
                                            <Box sx={{ p: 1.5, borderRadius: 2.5, border: "1px solid #EAEAEA", bgcolor: "#FAFCFC" }}>
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

                        {/* Clinical Specialties Utilization */}
                        <Grid item xs={12} md={6}>
                            <Card elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #E3EBEE" }}>
                                <Typography variant="h6" fontWeight={800} gutterBottom>
                                    Clinical Specialty Distribution
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                                    Hospital department registration counts
                                </Typography>

                                {charts?.departmentUsage?.length === 0 ? (
                                    <Typography color="text.secondary" fontSize={14}>
                                        No departments configured yet.
                                    </Typography>
                                ) : (
                                    <Stack spacing={1.5}>
                                        {charts?.departmentUsage?.map((d) => (
                                            <Box key={d.name}>
                                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                                    <Typography fontSize={13} fontWeight={700}>
                                                        {d.name}
                                                    </Typography>
                                                    <Typography fontSize={13} color="text.secondary">
                                                        {d.count} Units
                                                    </Typography>
                                                </Stack>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={Math.min((d.count / (stats?.totalDepartments || 1)) * 100, 100)}
                                                    sx={{ height: 6, borderRadius: 3, bgcolor: "#E2E8F0" }}
                                                />
                                            </Box>
                                        ))}
                                    </Stack>
                                )}
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Operational Management Modules */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                            Management & Governance Modules
                        </Typography>
                        <Grid container spacing={2}>
                            {[
                                {
                                    title: "Hospital Verification & Network",
                                    desc: "Review credentials, approve or reject pending hospitals",
                                    icon: <AdminPanelSettingsOutlined />,
                                    path: "/admin/hospitals",
                                    highlight: stats?.pendingHospitals > 0,
                                },
                                {
                                    title: "User Accounts & Security",
                                    desc: "Manage patients, hospital logins, activate or deactivate accounts",
                                    icon: <GroupOutlined />,
                                    path: "/admin/users",
                                },
                                {
                                    title: "Physicians & Medical Staff",
                                    desc: "View cross-hospital medical doctors, qualifications, and fees",
                                    icon: <MedicalServicesOutlined />,
                                    path: "/admin/doctors",
                                },
                                {
                                    title: "Specialties & Departments",
                                    desc: "Monitor clinical departments and specialty units",
                                    icon: <DomainOutlined />,
                                    path: "/admin/departments",
                                },
                                {
                                    title: "Ambulance Fleet Dispatch",
                                    desc: "Configure emergency vehicles, drivers, and status",
                                    icon: <TimeToLeaveOutlined />,
                                    path: "/admin/ambulances",
                                },
                                /*
                                {
                                    title: "Pharmacy & Medicines Catalog",
                                    desc: "Manage drug directory, indications, and safety information",
                                    icon: <LocalPharmacyOutlined />,
                                    path: "/admin/medicines",
                                },
                                */
                                {
                                    title: "System Reports & Export",
                                    desc: "Generate filtered CSV/PDF reports across appointments and users",
                                    icon: <DescriptionOutlined />,
                                    path: "/admin/reports",
                                },
                                {
                                    title: "Deep System Analytics",
                                    desc: "Comprehensive operational analytics and hospital performance",
                                    icon: <AnalyticsOutlined />,
                                    path: "/admin/analytics",
                                },
                                {
                                    title: "Audit & System Alerts",
                                    desc: "Inspect compliance audit trails and administrator activity",
                                    icon: <NotificationsOutlined />,
                                    path: "/admin/notifications",
                                },
                            ].map((m) => (
                                <Grid item xs={12} sm={6} md={4} key={m.title}>
                                    <Card
                                        elevation={0}
                                        onClick={() => navigate(m.path)}
                                        sx={{
                                            p: 2.5,
                                            borderRadius: 3.5,
                                            border: "1px solid",
                                            borderColor: m.highlight ? "warning.light" : "#E3EBEE",
                                            bgcolor: m.highlight ? "rgba(217,119,6,0.02)" : "background.paper",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                            "&:hover": {
                                                borderColor: m.highlight ? "warning.main" : "primary.main",
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
                                                    bgcolor: m.highlight ? "rgba(217,119,6,0.1)" : "rgba(15,82,75,0.08)",
                                                    color: m.highlight ? "warning.main" : "primary.main",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                {m.icon}
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography fontWeight={800} fontSize={15}>
                                                    {m.title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" fontSize={12}>
                                                    {m.desc}
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