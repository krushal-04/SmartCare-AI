import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Grid,
    Stack,
    Typography,
} from "@mui/material";

import {
    ArrowForward,
    CalendarMonthOutlined,
    DescriptionOutlined,
    EmergencyOutlined,
    LocalHospitalOutlined,
    MedicalServicesOutlined,
    PsychologyOutlined,
    RateReviewOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import StatCard from "../../components/dashboard/StatCard";
import api from "../../services/api";

const distanceKm = (
    lat1,
    lon1,
    lat2,
    lon2
) => {
    const R = 6371;

    const dLat =
        ((lat2 - lat1) * Math.PI) / 180;

    const dLon =
        ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) **
            2 +
        Math.cos(
            (lat1 * Math.PI) / 180
        ) *
            Math.cos(
                (lat2 * Math.PI) /
                    180
            ) *
            Math.sin(dLon / 2) **
            2;

    return (
        R *
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        )
    );
};

export default function PatientDashboard() {
    const navigate =
        useNavigate();

    const [dashboard, setDashboard] =
        useState(null);

    const [hospitals, setHospitals] =
        useState([]);

    const [location, setLocation] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const user = useMemo(() => {
        try {
            return JSON.parse(
                localStorage.getItem(
                    "user"
                ) || "null"
            );
        } catch {
            return null;
        }
    }, []);

    useEffect(() => {
        const loadDashboard =
            async () => {
                try {
                    const [
                        dashboardResponse,
                        hospitalResponse,
                    ] =
                        await Promise.all([
                            api.get(
                                "/patient/dashboard"
                            ),
                            api.get(
                                "/hospitals/all"
                            ),
                        ]);

                    setDashboard(
                        dashboardResponse.data
                    );

                    setHospitals(
                        hospitalResponse.data
                            .hospitals || []
                    );
                } catch (err) {
                    setError(
                        err.response
                            ?.data
                            ?.message ||
                            "Unable to load dashboard."
                    );
                } finally {
                    setLoading(false);
                }
            };

        loadDashboard();

        if (
            navigator.geolocation
        ) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude:
                            position.coords
                                .latitude,

                        longitude:
                            position.coords
                                .longitude,
                    });
                }
            );
        }
    }, []);

    const nearestHospitals =
        useMemo(() => {
            if (
                !location ||
                hospitals.length === 0
            ) {
                return hospitals.slice(
                    0,
                    3
                );
            }

            return hospitals
                .filter(
                    (hospital) =>
                        hospital.latitude !=
                            null &&
                        hospital.longitude !=
                            null
                )
                .map((hospital) => ({
                    ...hospital,

                    distance:
                        distanceKm(
                            location.latitude,
                            location.longitude,
                            hospital.latitude,
                            hospital.longitude
                        ),
                }))
                .sort(
                    (a, b) =>
                        a.distance -
                        b.distance
                )
                .slice(0, 3);
        }, [
            location,
            hospitals,
        ]);

    if (loading) {
        return (
            <DashboardLayout
                role="patient"
                title="Patient Dashboard"
                subtitle="Manage your healthcare journey"
            >
                <Box
                    py={12}
                    textAlign="center"
                >
                    <CircularProgress />
                </Box>
            </DashboardLayout>
        );
    }

    const stats =
        dashboard?.stats || {};

    return (
        <DashboardLayout
            role="patient"
            title="Patient Dashboard"
            subtitle="Manage your healthcare journey"
        >
            {error && (
                <Alert
                    severity="warning"
                    sx={{ mb: 3 }}
                >
                    {error}
                </Alert>
            )}

            <Card
                elevation={0}
                sx={{
                    mb: 3,
                    borderRadius: 5,
                    color: "#fff",
                    overflow: "hidden",
                    background:
                        "linear-gradient(135deg,#102F42 0%,#0B8793 100%)",
                }}
            >
                <CardContent
                    sx={{
                        p: {
                            xs: 3,
                            md: 4,
                        },
                    }}
                >
                    <Typography
                        fontSize={{
                            xs: 28,
                            md: 38,
                        }}
                        fontWeight={900}
                    >
                        Welcome back,{" "}
                        {user?.fullName ||
                            "Patient"}
                    </Typography>

                    <Typography
                        mt={1}
                        maxWidth={700}
                        color="rgba(255,255,255,.72)"
                        lineHeight={1.8}
                    >
                        Find doctors and hospitals,
                        book appointments, manage
                        medical reports and get
                        emergency assistance.
                    </Typography>

                    <Stack
                        direction={{
                            xs: "column",
                            sm: "row",
                        }}
                        spacing={1.5}
                        mt={3}
                    >
                        <Button
                            variant="contained"
                            startIcon={<CalendarMonthOutlined />}
                            onClick={() =>
                                navigate("/book-appointment")
                            }
                            sx={{
                                bgcolor: "#F0C66A",
                                color: "#102F42",
                                fontWeight: 800,
                                px: 3,
                                "&:hover": {
                                    bgcolor: "#E4B84F",
                                },
                            }}
                        >
                            Book Appointment
                        </Button>

                        <Button
                            variant="outlined"
                            endIcon={<ArrowForward />}
                            onClick={() =>
                                navigate("/doctors")
                            }
                            sx={{
                                borderColor: "rgba(255,255,255,.35)",
                                color: "#fff",
                                fontWeight: 700,
                                "&:hover": {
                                    borderColor: "#fff",
                                    bgcolor: "rgba(255,255,255,.08)",
                                },
                            }}
                        >
                            Find a Doctor
                        </Button>

                        <Button
                            variant="outlined"
                            onClick={() =>
                                navigate("/patient/emergency")
                            }
                            sx={{
                                borderColor: "rgba(255,100,100,.4)",
                                color: "#FFB0B0",
                                "&:hover": {
                                    borderColor: "#FF8080",
                                    bgcolor: "rgba(255,100,100,.1)",
                                },
                            }}
                        >
                            Emergency Help
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            <Grid
                container
                spacing={2.5}
                mb={4}
            >
                <Grid
                    item
                    xs={12}
                    sm={6}
                    lg={3}
                >
                    <StatCard
                        title="Upcoming Appointments"
                        value={
                            stats.upcomingAppointments ||
                            0
                        }
                        icon={
                            <CalendarMonthOutlined />
                        }
                    />
                </Grid>

                <Grid
                    item
                    xs={12}
                    sm={6}
                    lg={3}
                >
                    <StatCard
                        title="Total Appointments"
                        value={
                            stats.totalAppointments ||
                            0
                        }
                        icon={
                            <MedicalServicesOutlined />
                        }
                    />
                </Grid>

                <Grid
                    item
                    xs={12}
                    sm={6}
                    lg={3}
                >
                    <StatCard
                        title="Medical Reports"
                        value={
                            stats.reportCount ||
                            0
                        }
                        icon={
                            <DescriptionOutlined />
                        }
                    />
                </Grid>

                <Grid
                    item
                    xs={12}
                    sm={6}
                    lg={3}
                >
                    <StatCard
                        title="Emergency Requests"
                        value={
                            stats.emergencyCount ||
                            0
                        }
                        icon={
                            <EmergencyOutlined />
                        }
                    />
                </Grid>
            </Grid>

            <Grid
                container
                spacing={2.5}
            >
                <Grid
                    item
                    xs={12}
                    lg={8}
                >
                    <Card
                        elevation={0}
                        sx={{
                            border:
                                "1px solid #E3EBEE",
                            borderRadius: 4,
                        }}
                    >
                        <CardContent
                            sx={{ p: 3 }}
                        >
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                mb={2}
                            >
                                <Box>
                                    <Typography
                                        fontSize={21}
                                        fontWeight={900}
                                    >
                                        Recent appointments
                                    </Typography>

                                    <Typography
                                        color="text.secondary"
                                        fontSize={13}
                                    >
                                        Your latest
                                        healthcare
                                        appointments
                                    </Typography>
                                </Box>

                                <Button
                                    onClick={() =>
                                        navigate(
                                            "/patient/appointments"
                                        )
                                    }
                                >
                                    View all
                                </Button>
                            </Stack>

                            {(
                                dashboard?.recentAppointments ||
                                []
                            ).length === 0 ? (
                                <Box
                                    py={6}
                                    textAlign="center"
                                >
                                    <CalendarMonthOutlined
                                        sx={{
                                            fontSize: 45,
                                            color: "#0B8793",
                                        }}
                                    />

                                    <Typography
                                        mt={1}
                                        fontWeight={800}
                                    >
                                        No appointments yet
                                    </Typography>

                                    <Button
                                        sx={{
                                            mt: 1,
                                        }}
                                        onClick={() =>
                                            navigate(
                                                "/book-appointment"
                                            )
                                        }
                                    >
                                        Book an
                                        appointment
                                    </Button>
                                </Box>
                            ) : (
                                dashboard.recentAppointments.map(
                                    (
                                        appointment
                                    ) => (
                                        <Box
                                            key={
                                                appointment._id
                                            }
                                            sx={{
                                                p: 2,
                                                mb: 1.5,
                                                border:
                                                    "1px solid #EDF1F2",
                                                borderRadius: 3,
                                            }}
                                        >
                                            <Stack
                                                direction={{
                                                    xs: "column",
                                                    sm: "row",
                                                }}
                                                justifyContent="space-between"
                                                gap={1}
                                            >
                                                <Box>
                                                    <Typography
                                                        fontWeight={
                                                            900
                                                        }
                                                    >
                                                        {
                                                            appointment
                                                                .doctorId
                                                                ?.doctorName
                                                        }
                                                    </Typography>

                                                    <Typography
                                                        fontSize={
                                                            13
                                                        }
                                                        color="text.secondary"
                                                    >
                                                        {
                                                            appointment
                                                                .hospitalId
                                                                ?.hospitalName
                                                        }
                                                        {" · "}
                                                        {
                                                            appointment
                                                                .departmentId
                                                                ?.departmentName
                                                        }
                                                    </Typography>

                                                    <Typography
                                                        fontSize={
                                                            13
                                                        }
                                                        mt={
                                                            0.5
                                                        }
                                                    >
                                                        {appointment.appointmentDate
                                                            ? new Date(
                                                                  appointment.appointmentDate
                                                              ).toLocaleDateString()
                                                            : "—"}{" "}
                                                        ·{" "}
                                                        {
                                                            appointment.appointmentTime
                                                        }
                                                    </Typography>
                                                </Box>

                                                <Chip
                                                    label={
                                                        appointment.status
                                                    }
                                                    color={
                                                        appointment.status ===
                                                        "Confirmed"
                                                            ? "success"
                                                            : appointment.status ===
                                                              "Rejected"
                                                            ? "error"
                                                            : "default"
                                                    }
                                                />
                                            </Stack>
                                        </Box>
                                    )
                                )
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid
                    item
                    xs={12}
                    lg={4}
                >
                    <Card
                        elevation={0}
                        sx={{
                            height: "100%",
                            border:
                                "1px solid #E3EBEE",
                            borderRadius: 4,
                        }}
                    >
                        <CardContent
                            sx={{ p: 3 }}
                        >
                            <Typography
                                fontSize={21}
                                fontWeight={900}
                            >
                                Quick actions
                            </Typography>

                            {[
                                [
                                    "Medical Reports",
                                    <DescriptionOutlined />,
                                    "/patient/reports",
                                ],
                                [
                                    "AI Assistant",
                                    <PsychologyOutlined />,
                                    "/patient/ai",
                                ],
                                [
                                    "Reviews",
                                    <RateReviewOutlined />,
                                    "/patient/reviews",
                                ],
                                [
                                    "Emergency",
                                    <EmergencyOutlined />,
                                    "/patient/emergency",
                                ],
                            ].map(
                                (item) => (
                                    <Button
                                        key={
                                            item[0]
                                        }
                                        fullWidth
                                        startIcon={
                                            item[1]
                                        }
                                        onClick={() =>
                                            navigate(
                                                item[2]
                                            )
                                        }
                                        sx={{
                                            justifyContent:
                                                "flex-start",
                                            mt: 1,
                                            py: 1.3,
                                            px: 2,
                                            borderRadius: 2.5,
                                            bgcolor:
                                                "#F5FAFB",
                                        }}
                                    >
                                        {
                                            item[0]
                                        }
                                    </Button>
                                )
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box mt={4}>
                <Stack
                    direction={{
                        xs: "column",
                        sm: "row",
                    }}
                    justifyContent="space-between"
                    mb={2}
                >
                    <Box>
                        <Typography
                            fontSize={22}
                            fontWeight={900}
                        >
                            Nearby healthcare
                        </Typography>

                        <Typography
                            color="text.secondary"
                            fontSize={13}
                        >
                            Hospitals available around
                            your current location
                        </Typography>
                    </Box>

                    <Button
                        onClick={() =>
                            navigate(
                                "/hospitals"
                            )
                        }
                    >
                        Explore all
                    </Button>
                </Stack>

                <Grid
                    container
                    spacing={2.5}
                >
                    {nearestHospitals.map(
                        (hospital) => (
                            <Grid
                                item
                                xs={12}
                                sm={6}
                                md={4}
                                key={
                                    hospital._id
                                }
                            >
                                <Card
                                    elevation={0}
                                    sx={{
                                        height: "100%",
                                        border:
                                            "1px solid #E3EBEE",
                                        borderRadius: 4,
                                    }}
                                >
                                    <CardContent>
                                        <Stack
                                            direction="row"
                                            justifyContent="space-between"
                                        >
                                            <Box
                                                sx={{
                                                    width: 48,
                                                    height: 48,
                                                    display: "grid",
                                                    placeItems:
                                                        "center",
                                                    bgcolor:
                                                        "#E9F7F8",
                                                    color:
                                                        "#0B8793",
                                                    borderRadius: 3,
                                                }}
                                            >
                                                <LocalHospitalOutlined />
                                            </Box>

                                            {hospital.emergencyAvailable && (
                                                <Chip
                                                    size="small"
                                                    icon={
                                                        <EmergencyOutlined />
                                                    }
                                                    label="Emergency"
                                                    color="error"
                                                    variant="outlined"
                                                />
                                            )}
                                        </Stack>

                                        <Typography
                                            fontWeight={900}
                                            fontSize={18}
                                            mt={2}
                                        >
                                            {
                                                hospital.hospitalName
                                            }
                                        </Typography>

                                        <Typography
                                            color="text.secondary"
                                            fontSize={13}
                                            mt={0.5}
                                        >
                                            {
                                                hospital.city
                                            }
                                            ,{" "}
                                            {
                                                hospital.state
                                            }
                                        </Typography>

                                        {hospital.distance !=
                                            null && (
                                            <Typography
                                                mt={1}
                                                fontSize={13}
                                                fontWeight={
                                                    700
                                                }
                                                color="primary.main"
                                            >
                                                {hospital.distance.toFixed(
                                                    1
                                                )}{" "}
                                                km away
                                            </Typography>
                                        )}

                                        <Button
                                            fullWidth
                                            onClick={() =>
                                                navigate(
                                                    `/hospital/${hospital._id}`
                                                )
                                            }
                                            sx={{
                                                mt: 2,
                                            }}
                                        >
                                            View Hospital
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        )
                    )}
                </Grid>
            </Box>
        </DashboardLayout>
    );
}