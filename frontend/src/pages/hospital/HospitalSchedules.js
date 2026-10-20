import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    CircularProgress,
    Divider,
    FormControl,
    FormControlLabel,
    FormGroup,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Switch,
    TextField,
    Typography,
    Alert,
} from "@mui/material";
import {
    SaveRounded,
    AddRounded,
    EventBusyOutlined,
    ClearAllRounded,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PageHeader from "../../components/dashboard/PageHeader";
import api from "../../services/api";

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function HospitalSchedules() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialDoctorId = queryParams.get("doctorId");

    const [doctors, setDoctors] = useState([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId || "");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState({ type: "", message: "" });

    // Schedule form
    const [workingDays, setWorkingDays] = useState(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("17:00");
    const [slotDuration, setSlotDuration] = useState(30);
    const [leaveDates, setLeaveDates] = useState([]);
    const [leaveStartDate, setLeaveStartDate] = useState("");
    const [leaveEndDate, setLeaveEndDate] = useState("");
    const [leaveError, setLeaveError] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [hasUnsavedLeave, setHasUnsavedLeave] = useState(false);

    // Load doctors and initial schedule
    useEffect(() => {
        const fetchInitial = async () => {
            setLoading(true);
            try {
                const res = await api.get("/doctor/hospital");
                if (res.data.success && res.data.doctors?.length > 0) {
                    setDoctors(res.data.doctors);
                    const docId = initialDoctorId || res.data.doctors[0]._id;
                    setSelectedDoctorId(docId);
                    await loadDoctorSchedule(docId);
                }
            } catch (err) {
                setAlert({
                    type: "error",
                    message: err.response?.data?.message || "Failed to load doctors list.",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchInitial();
    }, [initialDoctorId]);

    const loadDoctorSchedule = async (docId) => {
        try {
            const res = await api.get(`/schedule/doctor/${docId}`);
            if (res.data.success && res.data.schedule) {
                const s = res.data.schedule;
                setWorkingDays(s.workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);
                setStartTime(s.startTime || "09:00");
                setEndTime(s.endTime || "17:00");
                setSlotDuration(s.slotDuration || 30);
                setLeaveDates(s.leaveDates || []);
                setIsActive(s.isActive !== false);
                setHasUnsavedLeave(false);
            }
        } catch (err) {
            console.error("loadDoctorSchedule error:", err);
        }
    };

    const handleDoctorChange = async (e) => {
        const docId = e.target.value;
        setSelectedDoctorId(docId);
        setAlert({ type: "", message: "" });
        setLeaveError("");
        setHasUnsavedLeave(false);
        await loadDoctorSchedule(docId);
    };

    const handleDayToggle = (day) => {
        setWorkingDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
        setHasUnsavedLeave(true);
    };

    // Add Leave Range or Single Date
    const handleAddLeaveRange = () => {
        if (!leaveStartDate) {
            setLeaveError("Please select a start date for the leave.");
            return;
        }

        const datesToAdd = [];
        if (!leaveEndDate || leaveEndDate === leaveStartDate) {
            datesToAdd.push(leaveStartDate);
        } else {
            if (leaveStartDate > leaveEndDate) {
                setLeaveError("Start date cannot be after end date.");
                return;
            }

            const [sy, sm, sd] = leaveStartDate.split("-").map(Number);
            const [ey, em, ed] = leaveEndDate.split("-").map(Number);
            const curr = new Date(sy, sm - 1, sd);
            const end = new Date(ey, em - 1, ed);

            while (curr <= end) {
                const y = curr.getFullYear();
                const m = String(curr.getMonth() + 1).padStart(2, "0");
                const d = String(curr.getDate()).padStart(2, "0");
                datesToAdd.push(`${y}-${m}-${d}`);
                curr.setDate(curr.getDate() + 1);
            }
        }

        const merged = Array.from(new Set([...leaveDates, ...datesToAdd])).sort();
        setLeaveDates(merged);
        setHasUnsavedLeave(true);
        setLeaveStartDate("");
        setLeaveEndDate("");
        setLeaveError("");
    };

    // Quick leave presets
    const handleQuickPreset = (daysCount, offsetDays = 0) => {
        const today = new Date();
        today.setDate(today.getDate() + offsetDays);
        const startY = today.getFullYear();
        const startM = String(today.getMonth() + 1).padStart(2, "0");
        const startD = String(today.getDate()).padStart(2, "0");
        const startStr = `${startY}-${startM}-${startD}`;

        const end = new Date(today);
        end.setDate(end.getDate() + (daysCount - 1));
        const endY = end.getFullYear();
        const endM = String(end.getMonth() + 1).padStart(2, "0");
        const endD = String(end.getDate()).padStart(2, "0");
        const endStr = `${endY}-${endM}-${endD}`;

        setLeaveStartDate(startStr);
        setLeaveEndDate(endStr);
        setLeaveError("");
    };

    const handleRemoveLeaveDate = (dateToRemove) => {
        setLeaveDates((prev) => prev.filter((d) => d !== dateToRemove));
        setHasUnsavedLeave(true);
    };

    const handleClearAllLeaves = () => {
        if (leaveDates.length === 0) return;
        setLeaveDates([]);
        setHasUnsavedLeave(true);
    };

    const formatLeaveDate = (dateStr) => {
        try {
            const [y, m, d] = dateStr.split("-").map(Number);
            const dt = new Date(y, m - 1, d);
            return dt.toLocaleDateString("en-GB", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        } catch {
            return dateStr;
        }
    };

    const handleSaveSchedule = async (e) => {
        e.preventDefault();
        if (!selectedDoctorId) {
            return setAlert({ type: "error", message: "Please select a doctor." });
        }
        if (workingDays.length === 0) {
            return setAlert({ type: "error", message: "Please select at least one working day." });
        }
        if (!startTime || !endTime) {
            return setAlert({ type: "error", message: "Start time and End time are required." });
        }

        setSaving(true);
        setAlert({ type: "", message: "" });
        try {
            const payload = {
                workingDays,
                startTime,
                endTime,
                slotDuration: Number(slotDuration),
                leaveDates,
                isActive,
            };

            const res = await api.put(`/schedule/doctor/${selectedDoctorId}`, payload);
            if (res.data.success) {
                setHasUnsavedLeave(false);
                setAlert({
                    type: "success",
                    message: "Doctor duty schedule and slot generation rules saved successfully! Patient booking reflects these changes now.",
                });
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to update schedule.",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout
            role="hospital"
            title="Duty Schedules"
            subtitle="Configure doctor working days, shift hours, slot durations, and planned leave"
        >
            <PageHeader
                title="Doctor Schedule Management"
                subtitle="Ensure accurate appointment slot calculations without double-booking"
                backTo="/hospital"
                backLabel="Back to Dashboard"
            />

            {alert.message && (
                <Alert severity={alert.type} sx={{ mb: 3, borderRadius: 2 }}>
                    {alert.message}
                </Alert>
            )}

            {loading ? (
                <Box py={8} textAlign="center">
                    <CircularProgress />
                </Box>
            ) : doctors.length === 0 ? (
                <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0", p: 4, textAlign: "center" }}>
                    <Typography fontWeight={700} variant="h6">
                        No Doctors Found
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                        Please register doctors before configuring their availability schedules.
                    </Typography>
                </Card>
            ) : (
                <Grid container spacing={3}>
                    {/* Schedule Configuration Card */}
                    <Grid item xs={12} lg={10} xl={9}>
                        <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0" }}>
                            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                                <form onSubmit={handleSaveSchedule}>
                                    {/* 1. Doctor Selector */}
                                    <Box sx={{ mb: 4 }}>
                                        <Typography fontWeight={700} fontSize={15} color="text.primary" gutterBottom>
                                            Select Doctor
                                        </Typography>
                                        <FormControl fullWidth size="small">
                                            <InputLabel id="doctor-select-label">Doctor</InputLabel>
                                            <Select
                                                labelId="doctor-select-label"
                                                value={selectedDoctorId}
                                                label="Doctor"
                                                onChange={handleDoctorChange}
                                            >
                                                {doctors.map((d) => (
                                                    <MenuItem key={d._id} value={d._id}>
                                                        Dr. {d.doctorName.replace(/^Dr\.\s*/i, "")} ({d.specialization || "General Medicine"})
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    {/* 2. Active Schedule Toggle */}
                                    <Box sx={{ mb: 4, p: 2.5, bgcolor: "#F8FAFC", borderRadius: 2, border: "1px solid #E2E8F0" }}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={isActive}
                                                    onChange={(e) => setIsActive(e.target.checked)}
                                                    color="primary"
                                                />
                                            }
                                            label={
                                                <Typography fontWeight={700} fontSize={14.5}>
                                                    Doctor Schedule Active
                                                </Typography>
                                            }
                                        />
                                        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, fontSize: 13, mt: 0.5 }}>
                                            When inactive, patient appointments cannot be booked for this doctor.
                                        </Typography>
                                    </Box>

                                    <Divider sx={{ my: 3 }} />

                                    {/* 3. Working Days */}
                                    <Box sx={{ mb: 4 }}>
                                        <Typography fontWeight={700} fontSize={15} color="text.primary" gutterBottom>
                                            Weekly Working Days
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: 13 }}>
                                            Select all days of the week on which this doctor conducts outpatient consultations.
                                        </Typography>
                                        <FormGroup row sx={{ gap: 1.5 }}>
                                            {ALL_DAYS.map((day) => (
                                                <FormControlLabel
                                                    key={day}
                                                    control={
                                                        <Checkbox
                                                            checked={workingDays.includes(day)}
                                                            onChange={() => handleDayToggle(day)}
                                                            size="small"
                                                        />
                                                    }
                                                    label={day}
                                                    sx={{ mr: 2 }}
                                                />
                                            ))}
                                        </FormGroup>
                                    </Box>

                                    <Divider sx={{ my: 3 }} />

                                    {/* 4. Working Hours & Duration */}
                                    <Box sx={{ mb: 4 }}>
                                        <Typography fontWeight={700} fontSize={15} color="text.primary" gutterBottom>
                                            Shift Hours & Consultation Slot Duration
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, fontSize: 13 }}>
                                            Specify standard shift operating hours and appointment slot duration.
                                        </Typography>
                                        <Grid container spacing={2.5}>
                                            <Grid item xs={12} sm={4}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    required
                                                    label="Shift Start Time (24h)"
                                                    placeholder="09:00"
                                                    value={startTime}
                                                    onChange={(e) => setStartTime(e.target.value)}
                                                    helperText="Format: HH:MM (e.g. 09:00)"
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    required
                                                    label="Shift End Time (24h)"
                                                    placeholder="17:00"
                                                    value={endTime}
                                                    onChange={(e) => setEndTime(e.target.value)}
                                                    helperText="Format: HH:MM (e.g. 17:00)"
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <FormControl fullWidth size="small">
                                                    <InputLabel>Slot Duration</InputLabel>
                                                    <Select
                                                        value={slotDuration}
                                                        label="Slot Duration"
                                                        onChange={(e) => setSlotDuration(e.target.value)}
                                                    >
                                                        <MenuItem value={15}>15 Minutes</MenuItem>
                                                        <MenuItem value={20}>20 Minutes</MenuItem>
                                                        <MenuItem value={30}>30 Minutes</MenuItem>
                                                        <MenuItem value={45}>45 Minutes</MenuItem>
                                                        <MenuItem value={60}>60 Minutes</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                        </Grid>
                                    </Box>

                                    <Divider sx={{ my: 3 }} />

                                    {/* 5. Leave Dates & Range Management */}
                                    <Box sx={{ mb: 4 }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                            <Typography fontWeight={700} fontSize={15} color="text.primary">
                                                Planned Leaves & Unavailable Date Ranges
                                            </Typography>
                                            {leaveDates.length > 0 && (
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    variant="outlined"
                                                    startIcon={<ClearAllRounded />}
                                                    onClick={handleClearAllLeaves}
                                                    sx={{ fontSize: 12, textTransform: "none", py: 0.4 }}
                                                >
                                                    Clear All Leaves
                                                </Button>
                                            )}
                                        </Stack>

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, fontSize: 13 }}>
                                            Select a start date and optional end date to register single-day or multi-day leaves. Patients cannot book slots on these dates.
                                        </Typography>

                                        {/* Date range picker controls */}
                                        <Box sx={{ p: 2.5, bgcolor: "#F8FAFC", borderRadius: 2, border: "1px solid #E2E8F0", mb: 2.5 }}>
                                            <Grid container spacing={2} alignItems="center">
                                                <Grid item xs={12} sm={4}>
                                                    <Box>
                                                        <Typography fontSize={12} fontWeight={700} color="#334155" mb={0.5}>
                                                            From Date *
                                                        </Typography>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            type="date"
                                                            value={leaveStartDate}
                                                            onChange={(e) => {
                                                                setLeaveStartDate(e.target.value);
                                                                if (leaveError) setLeaveError("");
                                                            }}
                                                            inputProps={{
                                                                style: { padding: "8.5px 12px" },
                                                            }}
                                                        />
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} sm={4}>
                                                    <Box>
                                                        <Typography fontSize={12} fontWeight={700} color="#334155" mb={0.5}>
                                                            To Date (Optional)
                                                        </Typography>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            type="date"
                                                            value={leaveEndDate}
                                                            onChange={(e) => {
                                                                setLeaveEndDate(e.target.value);
                                                                if (leaveError) setLeaveError("");
                                                            }}
                                                            inputProps={{
                                                                style: { padding: "8.5px 12px" },
                                                            }}
                                                        />
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} sm={4}>
                                                    <Box sx={{ pt: { xs: 0, sm: 2.8 } }}>
                                                        <Button
                                                            fullWidth
                                                            variant="contained"
                                                            color="primary"
                                                            startIcon={<AddRounded />}
                                                            onClick={handleAddLeaveRange}
                                                            sx={{ py: 1, textTransform: "none", fontWeight: 700 }}
                                                        >
                                                            Add Leave Range
                                                        </Button>
                                                    </Box>
                                                </Grid>
                                            </Grid>

                                            {/* Quick Range Presets */}
                                            <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" useFlexGap alignItems="center">
                                                <Typography fontSize={12} color="text.secondary" fontWeight={600} sx={{ mr: 0.5 }}>
                                                    Quick Presets:
                                                </Typography>
                                                <Chip
                                                    label="Today"
                                                    size="small"
                                                    clickable
                                                    variant="outlined"
                                                    onClick={() => handleQuickPreset(1, 0)}
                                                    sx={{ fontSize: 12 }}
                                                />
                                                <Chip
                                                    label="Tomorrow"
                                                    size="small"
                                                    clickable
                                                    variant="outlined"
                                                    onClick={() => handleQuickPreset(1, 1)}
                                                    sx={{ fontSize: 12 }}
                                                />
                                                <Chip
                                                    label="Next 3 Days"
                                                    size="small"
                                                    clickable
                                                    variant="outlined"
                                                    onClick={() => handleQuickPreset(3, 0)}
                                                    sx={{ fontSize: 12 }}
                                                />
                                                <Chip
                                                    label="Next 7 Days"
                                                    size="small"
                                                    clickable
                                                    variant="outlined"
                                                    onClick={() => handleQuickPreset(7, 0)}
                                                    sx={{ fontSize: 12 }}
                                                />
                                            </Stack>

                                            {leaveError && (
                                                <Alert severity="error" sx={{ mt: 2, py: 0.4, fontSize: 13, borderRadius: 1.5 }}>
                                                    {leaveError}
                                                </Alert>
                                            )}
                                        </Box>

                                        {/* Scheduled Leaves List Display */}
                                        <Box sx={{ mt: 2 }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                                                <Typography fontSize={13.5} fontWeight={700} color="text.secondary">
                                                    Currently Scheduled Leaves ({leaveDates.length} days)
                                                </Typography>
                                            </Stack>

                                            {leaveDates.length === 0 ? (
                                                <Box sx={{ p: 3, textAlign: "center", bgcolor: "#FAFAFA", borderRadius: 2, border: "1px dashed #E2E8F0" }}>
                                                    <Typography color="text.secondary" fontSize={13.5}>
                                                        No planned leave dates scheduled. Doctor is available on all regular working days.
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.2 }}>
                                                    {leaveDates.map((d) => (
                                                        <Chip
                                                            key={d}
                                                            icon={<EventBusyOutlined fontSize="small" />}
                                                            label={`${formatLeaveDate(d)}`}
                                                            onDelete={() => handleRemoveLeaveDate(d)}
                                                            color="error"
                                                            variant="outlined"
                                                            sx={{
                                                                fontWeight: 600,
                                                                borderRadius: 2,
                                                                bgcolor: "#FFF5F5",
                                                                py: 2,
                                                                fontSize: 13,
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>

                                        {hasUnsavedLeave && (
                                            <Alert severity="warning" sx={{ mt: 3, borderRadius: 2, fontSize: 13.5 }}>
                                                You have unsaved schedule changes. Click <strong>"Save Duty Schedule"</strong> below to apply these changes to appointment bookings.
                                            </Alert>
                                        )}
                                    </Box>

                                    <Divider sx={{ my: 3 }} />

                                    {/* Submit Action */}
                                    <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            size="large"
                                            disabled={saving}
                                            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveRounded />}
                                            sx={{
                                                borderRadius: 2,
                                                fontWeight: 700,
                                                px: 4,
                                                py: 1.4,
                                                textTransform: "none",
                                            }}
                                        >
                                            {saving ? "Saving Schedule..." : "Save Duty Schedule"}
                                        </Button>
                                    </Box>
                                </form>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </DashboardLayout>
    );
}