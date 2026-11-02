import { useEffect, useState } from "react";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    TextField,
    Typography,
} from "@mui/material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../services/api";

export default function PatientProfile() {
    const [form, setForm] =
        useState({
            fullName: "",
            email: "",
            phone: "",
        });

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    useEffect(() => {
        const loadProfile =
            async () => {
                try {
                    const response =
                        await api.get(
                            "/patient/profile"
                        );

                    const user =
                        response.data.user;

                    setForm({
                        fullName:
                            user.fullName ||
                            "",
                        email:
                            user.email ||
                            "",
                        phone:
                            user.phone ||
                            "",
                    });
                } catch (err) {
                    setError(
                        err.response?.data
                            ?.message ||
                        "Unable to load profile."
                    );
                } finally {
                    setLoading(false);
                }
            };

        loadProfile();
    }, []);

    const saveProfile =
        async (event) => {
            event.preventDefault();

            try {
                setSaving(true);
                setMessage("");
                setError("");

                const response =
                    await api.put(
                        "/patient/profile",
                        {
                            fullName:
                                form.fullName,
                            phone:
                                form.phone,
                        }
                    );

                const storedUser =
                    JSON.parse(
                        localStorage.getItem(
                            "user"
                        ) || "{}"
                    );

                localStorage.setItem(
                    "user",
                    JSON.stringify({
                        ...storedUser,
                        ...response.data.user,
                    })
                );

                setMessage(
                    "Profile updated successfully."
                );
            } catch (err) {
                setError(
                    err.response?.data
                        ?.message ||
                    "Unable to update profile."
                );
            } finally {
                setSaving(false);
            }
        };

    if (loading) {
        return (
            <DashboardLayout
                role="patient"
                title="My Profile"
                subtitle="Manage your personal information"
            >
                <Typography textAlign="center">
                    <CircularProgress />
                </Typography>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            role="patient"
            title="My Profile"
            subtitle="Manage your personal information"
        >
            <Card
                elevation={0}
                sx={{
                    maxWidth: 900,
                    border:
                        "1px solid #E3EBEE",
                    borderRadius: 4,
                }}
            >
                <CardContent sx={{ p: 4 }}>
                    <Typography
                        fontSize={25}
                        fontWeight={900}
                        mb={3}
                    >
                        Profile Information
                    </Typography>

                    {message && (
                        <Alert
                            severity="success"
                            sx={{ mb: 2 }}
                        >
                            {message}
                        </Alert>
                    )}

                    {error && (
                        <Alert
                            severity="error"
                            sx={{ mb: 2 }}
                        >
                            {error}
                        </Alert>
                    )}

                    <Box
                        component="form"
                        onSubmit={saveProfile}
                    >
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 2.5 }}>
                            <Box>
                                <TextField
                                    fullWidth
                                    label="Full Name"
                                    value={
                                        form.fullName
                                    }
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            fullName:
                                                e
                                                    .target
                                                    .value,
                                        })
                                    }
                                    required
                                />
                            </Box>

                            <Box>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    value={
                                        form.email
                                    }
                                    disabled
                                />
                            </Box>

                            <Box>
                                <TextField
                                    fullWidth
                                    label="Phone Number"
                                    value={
                                        form.phone
                                    }
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            phone:
                                                e
                                                    .target
                                                    .value,
                                        })
                                    }
                                    required
                                />
                            </Box>
                        </Box>

                        <Button
                            type="submit"
                            variant="contained"
                            disabled={saving}
                            sx={{
                                mt: 3,
                            }}
                        >
                            {saving
                                ? "Saving..."
                                : "Save Changes"}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}