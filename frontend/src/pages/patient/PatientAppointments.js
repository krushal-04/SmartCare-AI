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
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Typography,
} from "@mui/material";

import {
    CalendarMonthOutlined,
    EventAvailableOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../services/api";

export default function PatientAppointments() {
    const navigate =
        useNavigate();

    const [
        appointments,
        setAppointments,
    ] = useState([]);

    const [statusFilter, setStatusFilter] =
        useState("All");

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const loadAppointments =
        async () => {
            try {
                setLoading(true);
                setError("");

                const response =
                    await api.get(
                        "/appointment/my"
                    );

                setAppointments(
                    response.data
                        .appointments || []
                );
            } catch (err) {
                setError(
                    err.response?.data
                        ?.message ||
                        "Unable to load appointments."
                );
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        loadAppointments();
    }, []);

    const filtered =
        useMemo(() => {
            if (
                statusFilter ===
                "All"
            ) {
                return appointments;
            }

            return appointments.filter(
                (item) =>
                    item.status ===
                    statusFilter
            );
        }, [
            appointments,
            statusFilter,
        ]);

    const cancelAppointment =
        async (id) => {
            const confirmed =
                window.confirm(
                    "Cancel this appointment?"
                );

            if (!confirmed) {
                return;
            }

            try {
                await api.put(
                    `/appointment/${id}/status`,
                    {
                        status:
                            "Cancelled",
                    }
                );

                loadAppointments();
            } catch (err) {
                setError(
                    err.response?.data
                        ?.message ||
                        "Unable to cancel appointment."
                );
            }
        };

    return (
        <DashboardLayout
            role="patient"
            title="My Appointments"
            subtitle="Book, track and manage appointments"
        >
            <Stack
                direction={{
                    xs: "column",
                    sm: "row",
                }}
                justifyContent="space-between"
                alignItems={{
                    xs: "stretch",
                    sm: "center",
                }}
                spacing={2}
                mb={3}
            >
                <Box>
                    <Typography
                        fontSize={26}
                        fontWeight={900}
                    >
                        Appointments
                    </Typography>

                    <Typography
                        color="text.secondary"
                    >
                        {appointments.length}{" "}
                        total appointments
                    </Typography>
                </Box>

                <Stack
                    direction="row"
                    spacing={1.5}
                >
                    <FormControl
                        size="small"
                        sx={{
                            minWidth: 160,
                        }}
                    >
                        <InputLabel>
                            Status
                        </InputLabel>

                        <Select
                            value={
                                statusFilter
                            }
                            label="Status"
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value
                                )
                            }
                        >
                            <MenuItem value="All">
                                All
                            </MenuItem>

                            <MenuItem value="Pending">
                                Pending
                            </MenuItem>

                            <MenuItem value="Confirmed">
                                Confirmed
                            </MenuItem>

                            <MenuItem value="Completed">
                                Completed
                            </MenuItem>

                            <MenuItem value="Cancelled">
                                Cancelled
                            </MenuItem>

                            <MenuItem value="Rejected">
                                Rejected
                            </MenuItem>
                        </Select>
                    </FormControl>

                    <Button
                        variant="contained"
                        onClick={() =>
                            navigate(
                                "/book-appointment"
                            )
                        }
                    >
                        Book Appointment
                    </Button>
                </Stack>
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
                    py={8}
                >
                    <CircularProgress />
                </Box>
            ) : filtered.length ===
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
                            py: 8,
                            textAlign:
                                "center",
                        }}
                    >
                        <CalendarMonthOutlined
                            sx={{
                                fontSize: 55,
                                color:
                                    "#0B8793",
                            }}
                        />

                        <Typography
                            fontWeight={900}
                            mt={1}
                        >
                            No appointments found
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
                            Book your first
                            appointment
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                filtered.map(
                    (appointment) => {
                        const canCancel =
                            [
                                "Pending",
                                "Confirmed",
                            ].includes(
                                appointment.status
                            );

                        return (
                            <Card
                                key={
                                    appointment._id
                                }
                                elevation={
                                    0
                                }
                                sx={{
                                    mb: 2,
                                    border:
                                        "1px solid #E3EBEE",
                                    borderRadius: 4,
                                }}
                            >
                                <CardContent
                                    sx={{
                                        p: 3,
                                    }}
                                >
                                    <Stack
                                        direction={{
                                            xs: "column",
                                            md: "row",
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
                                                <EventAvailableOutlined
                                                    sx={{
                                                        color:
                                                            "#0B8793",
                                                    }}
                                                />

                                                <Typography
                                                    fontSize={
                                                        19
                                                    }
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
                                            </Stack>

                                            <Typography
                                                color="text.secondary"
                                                mt={
                                                    0.5
                                                }
                                            >
                                                {
                                                    appointment
                                                        .doctorId
                                                        ?.specialization
                                                }
                                            </Typography>

                                            <Typography
                                                fontSize={
                                                    14
                                                }
                                                mt={
                                                    1.2
                                                }
                                            >
                                                Hospital:{" "}
                                                <strong>
                                                    {
                                                        appointment
                                                            .hospitalId
                                                            ?.hospitalName
                                                    }
                                                </strong>
                                            </Typography>

                                            <Typography
                                                fontSize={
                                                    14
                                                }
                                            >
                                                Department:{" "}
                                                <strong>
                                                    {
                                                        appointment
                                                            .departmentId
                                                            ?.departmentName
                                                    }
                                                </strong>
                                            </Typography>

                                            <Typography
                                                fontSize={
                                                    14
                                                }
                                                mt={
                                                    1
                                                }
                                            >
                                                Date:{" "}
                                                {appointment.appointmentDate
                                                    ? new Date(
                                                          appointment.appointmentDate
                                                      ).toLocaleDateString()
                                                    : "—"}
                                            </Typography>

                                            <Typography
                                                fontSize={
                                                    14
                                                }
                                            >
                                                Time:{" "}
                                                {
                                                    appointment.appointmentTime
                                                }
                                            </Typography>

                                            {appointment.reason && (
                                                <Typography
                                                    mt={
                                                        1
                                                    }
                                                    color="text.secondary"
                                                    fontSize={
                                                        13
                                                    }
                                                >
                                                    Reason:{" "}
                                                    {
                                                        appointment.reason
                                                    }
                                                </Typography>
                                            )}
                                        </Box>

                                        <Stack
                                            alignItems={{
                                                xs: "flex-start",
                                                md: "flex-end",
                                            }}
                                            gap={1}
                                        >
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
                                                        : appointment.status ===
                                                          "Completed"
                                                        ? "info"
                                                        : "default"
                                                }
                                            />

                                            {canCancel && (
                                                <Button
                                                    color="error"
                                                    onClick={() =>
                                                        cancelAppointment(
                                                            appointment._id
                                                        )
                                                    }
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>
                        );
                    }
                )
            )}
        </DashboardLayout>
    );
}