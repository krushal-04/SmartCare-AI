import React, { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Stack,
    Typography,
    Grid,
} from "@mui/material";
import {
    PersonOutlined,
    PhoneOutlined,
    EmailOutlined,
    TimeToLeaveOutlined,
    LocalHospitalOutlined,
    ShieldOutlined,
    CheckCircleRounded,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../services/api";
import { colors } from "../../theme/colors";

export default function DriverProfile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const res = await api.get("/driver/profile");
                if (res.data?.success) {
                    setProfile(res.data.driver);
                }
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load driver profile.");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const ambulance = profile?.assignedAmbulanceId;
    const hospital = profile?.hospitalId;

    return (
        <DashboardLayout
            role="driver"
            title="Driver Profile"
            subtitle="Driver credentials, vehicle assignment, and operational parameters"
        >
            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box textAlign="center" py={8}>
                    <CircularProgress sx={{ color: colors.pine }} />
                    <Typography mt={2} color={colors.slate} fontSize={14}>
                        Loading profile credentials...
                    </Typography>
                </Box>
            ) : !profile ? (
                <Typography color={colors.slate}>Profile record unavailable.</Typography>
            ) : (
                <Grid container spacing={3}>
                    {/* PERSONAL CREDENTIALS */}
                    <Grid item xs={12} md={6}>
                        <Card
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 3.5,
                                border: `1px solid ${colors.hairline}`,
                                bgcolor: colors.white,
                                height: "100%",
                            }}
                        >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                                <Box
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: "50%",
                                        bgcolor: "#FEF3C7",
                                        display: "grid",
                                        placeItems: "center",
                                        color: "#D97706",
                                    }}
                                >
                                    <PersonOutlined sx={{ fontSize: 30 }} />
                                </Box>
                                <Box>
                                    <Typography fontSize={19} fontWeight={850} color={colors.ink}>
                                        {profile.fullName}
                                    </Typography>
                                    <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                                        <Chip
                                            label="Authorized Driver"
                                            size="small"
                                            sx={{
                                                bgcolor: "#EFF6FF",
                                                color: "#2563EB",
                                                fontWeight: 800,
                                                fontSize: 11,
                                            }}
                                        />
                                        <Chip
                                            label={profile.dutyStatus === "ON_DUTY" ? "● ON DUTY" : "○ OFF DUTY"}
                                            size="small"
                                            sx={{
                                                bgcolor: profile.dutyStatus === "ON_DUTY" ? "#DCFCE7" : "#F1F5F9",
                                                color: profile.dutyStatus === "ON_DUTY" ? "#16A34A" : colors.slate,
                                                fontWeight: 800,
                                                fontSize: 11,
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Stack spacing={2}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <PhoneOutlined sx={{ color: colors.slate, fontSize: 18 }} />
                                    <Box>
                                        <Typography fontSize={11.5} color={colors.slate} fontWeight={600}>
                                            CONTACT MOBILE
                                        </Typography>
                                        <Typography fontSize={14} fontWeight={700} color={colors.ink}>
                                            {profile.phone}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <EmailOutlined sx={{ color: colors.slate, fontSize: 18 }} />
                                    <Box>
                                        <Typography fontSize={11.5} color={colors.slate} fontWeight={600}>
                                            EMAIL ADDRESS
                                        </Typography>
                                        <Typography fontSize={14} fontWeight={700} color={colors.ink}>
                                            {profile.email}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <ShieldOutlined sx={{ color: colors.slate, fontSize: 18 }} />
                                    <Box>
                                        <Typography fontSize={11.5} color={colors.slate} fontWeight={600}>
                                            ACCOUNT VERIFICATION
                                        </Typography>
                                        <Typography fontSize={14} fontWeight={700} color="#16A34A">
                                            Verified Operator
                                        </Typography>
                                    </Box>
                                </Box>
                            </Stack>
                        </Card>
                    </Grid>

                    {/* VEHICLE & BASE HOSPITAL */}
                    <Grid item xs={12} md={6}>
                        <Card
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 3.5,
                                border: `1px solid ${colors.hairline}`,
                                bgcolor: colors.white,
                                height: "100%",
                            }}
                        >
                            <Typography fontSize={13} fontWeight={800} color={colors.slate} letterSpacing={0.5} mb={2.5}>
                                ASSIGNED VEHICLE & AFFILIATION
                            </Typography>

                            {ambulance ? (
                                <Box sx={{ mb: 3 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                                        <TimeToLeaveOutlined sx={{ color: colors.pine, fontSize: 24 }} />
                                        <Typography fontSize={16} fontWeight={850} color={colors.ink}>
                                            {ambulance.ambulanceNumber}
                                        </Typography>
                                    </Box>
                                    <Typography fontSize={13} color={colors.slate}>
                                        {ambulance.vehicleType} • Plate: {ambulance.vehicleRegNumber || ambulance.ambulanceNumber}
                                    </Typography>
                                    <Box sx={{ display: "flex", gap: 0.8, mt: 1, flexWrap: "wrap" }}>
                                        {(ambulance.capability || ["BASIC"]).map((cap) => (
                                            <Chip
                                                key={cap}
                                                label={cap}
                                                size="small"
                                                sx={{
                                                    bgcolor: "#F0FDFA",
                                                    color: colors.pine,
                                                    border: "1px solid #CCFBF1",
                                                    fontWeight: 800,
                                                    fontSize: 10.5,
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            ) : (
                                <Typography color={colors.slate} fontSize={13.5} mb={2}>
                                    No vehicle assigned yet.
                                </Typography>
                            )}

                            <Divider sx={{ my: 2 }} />

                            {hospital ? (
                                <Box>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                                        <LocalHospitalOutlined sx={{ color: colors.info, fontSize: 24 }} />
                                        <Typography fontSize={16} fontWeight={850} color={colors.ink}>
                                            {hospital.hospitalName}
                                        </Typography>
                                    </Box>
                                    <Typography fontSize={13} color={colors.slate}>
                                        {hospital.address}, {hospital.city}
                                    </Typography>
                                    <Typography fontSize={13} color={colors.slate} mt={0.5}>
                                        Dispatch Line: {hospital.hospitalPhone}
                                    </Typography>
                                </Box>
                            ) : (
                                <Typography color={colors.slate} fontSize={13.5}>
                                    Network Fleet Base
                                </Typography>
                            )}
                        </Card>
                    </Grid>
                </Grid>
            )}
        </DashboardLayout>
    );
}
