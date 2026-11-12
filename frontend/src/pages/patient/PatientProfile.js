import { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    FormControlLabel,
    Stack,
    Switch,
    TextField,
    Typography,
    Chip,
} from "@mui/material";
import {
    NotificationsActiveOutlined,
    AccessTimeOutlined,
    EmailOutlined,
    SmartphoneOutlined,
    SaveOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../services/api";
import { colors } from "../../theme/colors";

export default function PatientProfile() {
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        phone: "",
    });

    // Reminder Settings state
    const [reminderSettings, setReminderSettings] = useState({
        enabled: true,
        reminder24h: true,
        reminder1h: true,
        channels: {
            inApp: true,
            email: true,
            sms: false,
        },
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingReminders, setSavingReminders] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [reminderMessage, setReminderMessage] = useState("");
    const [reminderError, setReminderError] = useState("");

    useEffect(() => {
        const loadProfileAndSettings = async () => {
            try {
                setLoading(true);
                const [profileRes, reminderRes] = await Promise.all([
                    api.get("/patient/profile"),
                    api.get("/patient/reminder-settings").catch(() => ({ data: {} })),
                ]);

                const user = profileRes.data.user;
                setForm({
                    fullName: user.fullName || "",
                    email: user.email || "",
                    phone: user.phone || "",
                });

                if (reminderRes.data?.reminderSettings) {
                    setReminderSettings({
                        enabled: reminderRes.data.reminderSettings.enabled ?? true,
                        reminder24h: reminderRes.data.reminderSettings.reminder24h ?? true,
                        reminder1h: reminderRes.data.reminderSettings.reminder1h ?? true,
                        channels: {
                            inApp: true,
                            email: reminderRes.data.reminderSettings.channels?.email ?? true,
                            sms: reminderRes.data.reminderSettings.channels?.sms ?? false,
                        },
                    });
                }
            } catch (err) {
                setError(err.response?.data?.message || "Unable to load profile.");
            } finally {
                setLoading(false);
            }
        };

        loadProfileAndSettings();
    }, []);

    const saveProfile = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setMessage("");
            setError("");

            const response = await api.put("/patient/profile", {
                fullName: form.fullName,
                phone: form.phone,
            });

            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem(
                "user",
                JSON.stringify({
                    ...storedUser,
                    ...response.data.user,
                })
            );

            setMessage("Profile updated successfully.");
        } catch (err) {
            setError(err.response?.data?.message || "Unable to update profile.");
        } finally {
            setSaving(false);
        }
    };

    const saveReminderSettings = async () => {
        try {
            setSavingReminders(true);
            setReminderMessage("");
            setReminderError("");

            const res = await api.put("/patient/reminder-settings", reminderSettings);
            setReminderMessage(res.data?.message || "Appointment reminder preferences saved successfully.");
        } catch (err) {
            setReminderError(err.response?.data?.message || "Failed to update reminder settings.");
        } finally {
            setSavingReminders(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout
                role="patient"
                title="My Profile"
                subtitle="Manage your personal information and consultation reminders"
            >
                <Box textAlign="center" py={8}>
                    <CircularProgress sx={{ color: colors.pine }} />
                </Box>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            role="patient"
            title="My Profile"
            subtitle="Manage your personal information and consultation reminder preferences"
        >
            <Stack spacing={3.5} maxWidth={920}>
                {/* 1. PERSONAL DETAILS CARD */}
                <Card
                    elevation={0}
                    sx={{
                        border: `1px solid ${colors.hairline}`,
                        borderRadius: 3.5,
                        bgcolor: colors.white,
                    }}
                >
                    <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                        <Typography fontSize={22} fontWeight={850} color={colors.ink} mb={1}>
                            Profile Information
                        </Typography>
                        <Typography fontSize={13.5} color={colors.slate} mb={3}>
                            Update your personal identification and contact details used for consultations
                        </Typography>

                        {message && (
                            <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setMessage("")}>
                                {message}
                            </Alert>
                        )}

                        {error && (
                            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setError("")}>
                                {error}
                            </Alert>
                        )}

                        <Box component="form" onSubmit={saveProfile}>
                            <Stack spacing={2.5}>
                                <TextField
                                    fullWidth
                                    label="Full Name"
                                    value={form.fullName}
                                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                    required
                                />

                                <TextField
                                    fullWidth
                                    label="Email Address"
                                    value={form.email}
                                    disabled
                                    helperText="Account email cannot be modified"
                                />

                                <TextField
                                    fullWidth
                                    label="Phone Number"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    required
                                />
                            </Stack>

                            <Button
                                type="submit"
                                variant="contained"
                                disabled={saving}
                                sx={{
                                    mt: 3,
                                    borderRadius: 2.2,
                                    fontWeight: 750,
                                    bgcolor: colors.pine,
                                    "&:hover": { bgcolor: colors.pineDeep },
                                }}
                            >
                                {saving ? "Saving Changes..." : "Save Profile Details"}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

                {/* 2. APPOINTMENT REMINDER SETTINGS CARD */}
                <Card
                    elevation={0}
                    sx={{
                        border: `1px solid ${colors.hairline}`,
                        borderRadius: 3.5,
                        bgcolor: colors.white,
                    }}
                >
                    <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                        <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
                            <NotificationsActiveOutlined sx={{ color: colors.pine, fontSize: 26 }} />
                            <Typography fontSize={22} fontWeight={850} color={colors.ink}>
                                Appointment Reminder Settings
                            </Typography>
                        </Stack>
                        <Typography fontSize={13.5} color={colors.slate} mb={3}>
                            Configure how and when you receive automated reminders for your scheduled doctor appointments
                        </Typography>

                        {reminderMessage && (
                            <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setReminderMessage("")}>
                                {reminderMessage}
                            </Alert>
                        )}

                        {reminderError && (
                            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setReminderError("")}>
                                {reminderError}
                            </Alert>
                        )}

                        <Stack spacing={3}>
                            {/* MASTER SWITCH */}
                            <Box
                                sx={{
                                    p: 2.5,
                                    borderRadius: 3,
                                    bgcolor: reminderSettings.enabled ? "#F0FDF4" : "#F8FAFC",
                                    border: `1px solid ${reminderSettings.enabled ? "#BBF7D0" : colors.hairline}`,
                                }}
                            >
                                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1}>
                                    <Box>
                                        <Typography fontWeight={800} fontSize={15} color={colors.ink}>
                                            Automated Appointment Reminders
                                        </Typography>
                                        <Typography fontSize={12.5} color={colors.slate} mt={0.3}>
                                            Master switch to receive advance notifications for upcoming doctor consultations
                                        </Typography>
                                    </Box>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={reminderSettings.enabled}
                                                onChange={(e) => setReminderSettings({ ...reminderSettings, enabled: e.target.checked })}
                                                color="success"
                                            />
                                        }
                                        label={reminderSettings.enabled ? "Active" : "Disabled"}
                                        sx={{ m: 0 }}
                                    />
                                </Stack>
                            </Box>

                            {/* REMINDER INTERVAL TIMINGS */}
                            <Box sx={{ opacity: reminderSettings.enabled ? 1 : 0.5, pointerEvents: reminderSettings.enabled ? "auto" : "none" }}>
                                <Typography fontSize={14.5} fontWeight={800} color={colors.ink} mb={1.5}>
                                    Reminder Timings
                                </Typography>

                                <Stack spacing={1.5}>
                                    {/* 24-HOUR REMINDER */}
                                    <Box
                                        sx={{
                                            p: 2,
                                            borderRadius: 2.5,
                                            border: `1px solid ${colors.hairline}`,
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <AccessTimeOutlined sx={{ color: colors.pine }} />
                                            <Box>
                                                <Typography fontWeight={750} fontSize={14} color={colors.ink}>
                                                    24 Hours in Advance
                                                </Typography>
                                                <Typography fontSize={12} color={colors.slate}>
                                                    Sends a notification 1 day before your scheduled appointment time
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        <Switch
                                            checked={reminderSettings.reminder24h}
                                            onChange={(e) => setReminderSettings({ ...reminderSettings, reminder24h: e.target.checked })}
                                            color="primary"
                                        />
                                    </Box>

                                    {/* 1-HOUR REMINDER */}
                                    <Box
                                        sx={{
                                            p: 2,
                                            borderRadius: 2.5,
                                            border: `1px solid ${colors.hairline}`,
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <AccessTimeOutlined sx={{ color: colors.amber }} />
                                            <Box>
                                                <Typography fontWeight={750} fontSize={14} color={colors.ink}>
                                                    1 Hour in Advance
                                                </Typography>
                                                <Typography fontSize={12} color={colors.slate}>
                                                    Urgent final alert 60 minutes before your consultation commences
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        <Switch
                                            checked={reminderSettings.reminder1h}
                                            onChange={(e) => setReminderSettings({ ...reminderSettings, reminder1h: e.target.checked })}
                                            color="primary"
                                        />
                                    </Box>
                                </Stack>
                            </Box>

                            {/* NOTIFICATION CHANNELS */}
                            <Box sx={{ opacity: reminderSettings.enabled ? 1 : 0.5, pointerEvents: reminderSettings.enabled ? "auto" : "none" }}>
                                <Typography fontSize={14.5} fontWeight={800} color={colors.ink} mb={1.5}>
                                    Active Notification Channels
                                </Typography>

                                <Stack spacing={1.5}>
                                    {/* IN-APP CHANNEL */}
                                    <Box
                                        sx={{
                                            p: 2,
                                            borderRadius: 2.5,
                                            border: `1px solid ${colors.hairline}`,
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <NotificationsActiveOutlined sx={{ color: colors.pine }} />
                                            <Box>
                                                <Typography fontWeight={750} fontSize={14} color={colors.ink}>
                                                    In-App Notification & Real-Time Alert Bell
                                                </Typography>
                                                <Typography fontSize={12} color={colors.slate}>
                                                    Live popup alerts and unread badge in patient portal (Core Channel)
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        <Chip label="Required" size="small" sx={{ fontWeight: 800, bgcolor: "#ECFDF5", color: "#065F46" }} />
                                    </Box>

                                    {/* EMAIL CHANNEL */}
                                    <Box
                                        sx={{
                                            p: 2,
                                            borderRadius: 2.5,
                                            border: `1px solid ${colors.hairline}`,
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <EmailOutlined sx={{ color: colors.pine }} />
                                            <Box>
                                                <Typography fontWeight={750} fontSize={14} color={colors.ink}>
                                                    Email Notifications
                                                </Typography>
                                                <Typography fontSize={12} color={colors.slate}>
                                                    HTML summary sent to {form.email}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        <Switch
                                            checked={reminderSettings.channels?.email ?? true}
                                            onChange={(e) =>
                                                setReminderSettings({
                                                    ...reminderSettings,
                                                    channels: {
                                                        ...reminderSettings.channels,
                                                        email: e.target.checked,
                                                    },
                                                })
                                            }
                                            color="primary"
                                        />
                                    </Box>

                                    {/* SMS CHANNEL (OPTIONAL FUTURE) */}
                                    <Box
                                        sx={{
                                            p: 2,
                                            borderRadius: 2.5,
                                            border: `1px solid ${colors.hairline}`,
                                            bgcolor: "#FAFAFA",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <SmartphoneOutlined sx={{ color: colors.slate }} />
                                            <Box>
                                                <Typography fontWeight={750} fontSize={14} color={colors.slate}>
                                                    SMS / WhatsApp Alerts
                                                </Typography>
                                                <Typography fontSize={12} color={colors.slate}>
                                                    Direct carrier messaging (Requires SMS Gateway provider setup)
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        <Chip label="Future Integration" size="small" variant="outlined" sx={{ fontWeight: 650, color: colors.slate }} />
                                    </Box>
                                </Stack>
                            </Box>

                            <Box>
                                <Button
                                    variant="contained"
                                    startIcon={<SaveOutlined />}
                                    disabled={savingReminders}
                                    onClick={saveReminderSettings}
                                    sx={{
                                        borderRadius: 2.2,
                                        fontWeight: 800,
                                        px: 3,
                                        py: 1,
                                        bgcolor: colors.secondary,
                                        "&:hover": { bgcolor: colors.secondaryDark },
                                    }}
                                >
                                    {savingReminders ? "Updating Preferences..." : "Save Reminder Preferences"}
                                </Button>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
            </Stack>
        </DashboardLayout>
    );
}
