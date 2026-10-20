import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Container,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import {
    AccessTimeOutlined,
    CalendarMonthOutlined,
    CheckCircle,
    MedicalServicesOutlined,
} from "@mui/icons-material";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import api from "../services/api";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

export default function BookAppointment() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { isAuthenticated } = useAuth();

    const queryDoctorId = searchParams.get("doctorId");
    const queryHospitalId = searchParams.get("hospitalId");
    const queryDepartmentId = searchParams.get("departmentId");

    const today = new Date().toISOString().split("T")[0];

    const [hospitals, setHospitals] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [slots, setSlots] = useState([]);

    const [form, setForm] = useState({
        hospitalId: "",
        departmentId: "",
        doctorId: "",
        appointmentDate: today,
        appointmentTime: "",
        reason: "",
    });

    const [loading, setLoading] = useState(true);
    const [slotLoading, setSlotLoading] = useState(false);
    const [slotNotice, setSlotNotice] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [bookingSuccess, setBookingSuccess] = useState(null);

    const getCleanDoctorName = (name) => {
        if (!name) return "";
        const trimmed = String(name).trim();
        if (trimmed.toLowerCase().startsWith("dr.") || trimmed.toLowerCase().startsWith("dr ")) {
            return trimmed;
        }
        return `Dr. ${trimmed}`;
    };

    // AUTH CHECK: Ensure user is logged in
    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login", {
                replace: true,
                state: {
                    from: location.pathname + location.search,
                },
            });
        }
    }, [isAuthenticated, navigate, location]);

    // LOAD ALL DATA & AUTO-SELECT PARAMS
    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                setLoading(true);
                const [hospitalRes, deptRes, doctorRes] = await Promise.all([
                    api.get("/hospitals/all"),
                    api.get("/department/all"),
                    api.get("/doctor/all"),
                ]);

                if (!isMounted) return;

                const loadedHospitals = hospitalRes.data.hospitals || [];
                const loadedDepartments = deptRes.data.departments || [];
                const loadedDoctors = doctorRes.data.doctors || [];

                setHospitals(loadedHospitals);
                setDepartments(loadedDepartments);
                setDoctors(loadedDoctors);

                // Auto-populate based on query parameters
                if (queryDoctorId) {
                    const matchedDoctor = loadedDoctors.find(
                        (d) => String(d._id) === String(queryDoctorId)
                    );
                    if (matchedDoctor) {
                        const hId = matchedDoctor.hospitalId?._id || matchedDoctor.hospitalId || "";
                        const dId = matchedDoctor.departmentId?._id || matchedDoctor.departmentId || "";
                        setForm((prev) => ({
                            ...prev,
                            hospitalId: String(hId),
                            departmentId: String(dId),
                            doctorId: String(matchedDoctor._id),
                        }));
                    }
                } else if (queryHospitalId) {
                    setForm((prev) => ({
                        ...prev,
                        hospitalId: String(queryHospitalId),
                        departmentId: queryDepartmentId ? String(queryDepartmentId) : prev.departmentId,
                    }));
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.response?.data?.message || "Unable to load appointment booking data.");
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (isAuthenticated) {
            loadData();
        }

        return () => {
            isMounted = false;
        };
    }, [isAuthenticated, queryDoctorId, queryHospitalId, queryDepartmentId]);

    // FILTER DEPARTMENTS BY SELECTED HOSPITAL
    const filteredDepartments = useMemo(() => {
        if (!form.hospitalId) return [];
        return departments.filter(
            (dept) => String(dept.hospitalId?._id || dept.hospitalId) === String(form.hospitalId)
        );
    }, [departments, form.hospitalId]);

    // FILTER DOCTORS BY SELECTED HOSPITAL & DEPARTMENT
    const filteredDoctors = useMemo(() => {
        if (!form.hospitalId) return [];
        return doctors.filter((doc) => {
            const docHosp = String(doc.hospitalId?._id || doc.hospitalId);
            const docDept = String(doc.departmentId?._id || doc.departmentId);
            const matchesHosp = docHosp === String(form.hospitalId);
            const matchesDept = !form.departmentId || docDept === String(form.departmentId);
            return matchesHosp && matchesDept;
        });
    }, [doctors, form.hospitalId, form.departmentId]);

    // SELECTED DOCTOR OBJECT
    const selectedDoctor = useMemo(() => {
        if (!form.doctorId) return null;
        return doctors.find((d) => String(d._id) === String(form.doctorId)) || null;
    }, [doctors, form.doctorId]);

    // FETCH AVAILABLE SLOTS WHEN DOCTOR & DATE CHANGE
    useEffect(() => {
        if (!form.doctorId || !form.appointmentDate) {
            setSlots([]);
            return;
        }

        let isMounted = true;
        const loadSlots = async () => {
            try {
                setSlotLoading(true);
                setSlotNotice("");
                const response = await api.get("/appointment/slots", {
                    params: {
                        doctorId: form.doctorId,
                        date: form.appointmentDate,
                    },
                });

                if (isMounted) {
                    setSlots(response.data.slots || []);
                    if (response.data.message) {
                        setSlotNotice(response.data.message);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setSlots([]);
                    const msg = err.response?.data?.message || "No slots available on this date for the selected doctor.";
                    setSlotNotice(msg);
                }
            } finally {
                if (isMounted) setSlotLoading(false);
            }
        };

        loadSlots();

        return () => {
            isMounted = false;
        };
    }, [form.doctorId, form.appointmentDate]);

    const handleHospitalChange = (hId) => {
        setForm((prev) => ({
            ...prev,
            hospitalId: hId,
            departmentId: "",
            doctorId: "",
            appointmentTime: "",
        }));
        setSlots([]);
    };

    const handleDepartmentChange = (dId) => {
        setForm((prev) => ({
            ...prev,
            departmentId: dId,
            doctorId: "",
            appointmentTime: "",
        }));
        setSlots([]);
    };

    const handleDoctorChange = (docId) => {
        setForm((prev) => ({
            ...prev,
            doctorId: docId,
            appointmentTime: "",
        }));
    };

    const submitBooking = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");
            setMessage("");

            const response = await api.post("/appointment/create", {
                hospitalId: form.hospitalId,
                departmentId: form.departmentId,
                doctorId: form.doctorId,
                appointmentDate: form.appointmentDate,
                appointmentTime: form.appointmentTime,
                reason: form.reason,
            });

            const bookedAppt = response.data?.appointment;
            setBookingSuccess(bookedAppt || true);
            setMessage("Appointment booked successfully!");

            setTimeout(() => {
                navigate("/patient/appointments");
            }, 1800);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to book appointment. Please check availability.");
        } finally {
            setSaving(false);
        }
    };

    const bookingContent = (
        <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 }, flex: 1 }}>
                {/* HEADER TITLE */}
                <Box sx={{ mb: 4, textAlign: { xs: "center", sm: "left" } }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} justifyContent={{ xs: "center", sm: "flex-start" }}>
                        <Box
                            sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 3,
                                bgcolor: colors.pineSoft,
                                color: colors.pine,
                                display: "grid",
                                placeItems: "center",
                            }}
                        >
                            <CalendarMonthOutlined />
                        </Box>
                        <Box>
                            <Typography
                                variant="h4"
                                sx={{
                                    fontFamily: "'Newsreader', serif",
                                    fontWeight: 700,
                                    fontSize: { xs: 26, md: 32 },
                                    color: colors.ink,
                                }}
                            >
                                Schedule Doctor Appointment
                            </Typography>
                            <Typography fontSize={13.5} color={colors.slate}>
                                Select medical facility, specialist, and choose your preferred consultation slot.
                            </Typography>
                        </Box>
                    </Stack>
                </Box>

                {/* SUCCESS NOTICE */}
                {bookingSuccess && (
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            p: 4,
                            mb: 4,
                            bgcolor: colors.white,
                            border: `2px solid ${colors.pine}`,
                            textAlign: "center",
                            boxShadow: "0 10px 30px rgba(43,92,82,0.12)",
                        }}
                    >
                        <CheckCircle sx={{ fontSize: 60, color: colors.pine, mb: 1.5 }} />
                        <Typography variant="h5" fontWeight={800} color={colors.ink}>
                            Appointment Confirmed!
                        </Typography>
                        <Typography color={colors.slate} mt={0.5} fontSize={14.5}>
                            Your consultation has been successfully reserved. Redirecting to your appointments...
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => navigate("/patient/appointments")}
                            sx={{
                                mt: 3,
                                bgcolor: colors.pine,
                                color: colors.white,
                                fontWeight: 700,
                                px: 4,
                                py: 1.1,
                                "&:hover": { bgcolor: colors.pineDeep },
                            }}
                        >
                            View My Appointments
                        </Button>
                    </Card>
                )}

                {/* MAIN BOOKING CARD */}
                {!bookingSuccess && (
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            border: `1px solid ${colors.hairline}`,
                            bgcolor: colors.white,
                            boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
                            overflow: "hidden",
                        }}
                    >
                        <Box sx={{ height: 6, bgcolor: colors.amber }} />

                        <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                            {loading && (
                                <Box py={8} textAlign="center">
                                    <CircularProgress sx={{ color: colors.pine }} />
                                    <Typography mt={2} color={colors.slate} fontSize={14}>
                                        Loading healthcare directories & doctor slots...
                                    </Typography>
                                </Box>
                            )}

                            {!loading && (
                                <Box component="form" onSubmit={submitBooking}>
                                    {error && (
                                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }}>
                                            {error}
                                        </Alert>
                                    )}

                                    {message && (
                                        <Alert severity="success" sx={{ mb: 3, borderRadius: 2.5 }}>
                                            {message}
                                        </Alert>
                                    )}

                                    {/* SELECTED DOCTOR HIGHLIGHT CARD */}
                                    {selectedDoctor && (
                                        <Box
                                            sx={{
                                                p: 2.5,
                                                mb: 4,
                                                borderRadius: 3,
                                                bgcolor: colors.canvas,
                                                border: `1px solid ${colors.hairline}`,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 2,
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <Avatar
                                                sx={{
                                                    width: 52,
                                                    height: 52,
                                                    bgcolor: colors.pineSoft,
                                                    color: colors.pine,
                                                }}
                                            >
                                                <MedicalServicesOutlined />
                                            </Avatar>
                                            <Box sx={{ flex: 1, minWidth: 200 }}>
                                                <Typography fontWeight={800} fontSize={16} color={colors.ink}>
                                                    {getCleanDoctorName(selectedDoctor.doctorName)}
                                                </Typography>
                                                <Typography fontSize={13} color={colors.pine} fontWeight={700}>
                                                    {selectedDoctor.specialization} • {selectedDoctor.qualification}
                                                </Typography>
                                                <Typography fontSize={12} color={colors.slate}>
                                                    {selectedDoctor.hospitalId?.hospitalName || "Hospital Medical Center"}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ textAlign: "right" }}>
                                                <Typography fontSize={11.5} color={colors.slate} fontWeight={700}>
                                                    CONSULTATION FEE
                                                </Typography>
                                                <Typography fontSize={18} fontWeight={900} color={colors.pine}>
                                                    ₹{selectedDoctor.consultationFee || 0}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}

                                    {/* FORM FIELDS */}
                                    <Grid container spacing={2.5}>
                                        {/* HOSPITAL SELECT */}
                                        <Grid item xs={12}>
                                            <FormControl fullWidth required>
                                                <InputLabel id="hospital-label">Select Hospital</InputLabel>
                                                <Select
                                                    labelId="hospital-label"
                                                    label="Select Hospital"
                                                    value={form.hospitalId}
                                                    onChange={(e) => handleHospitalChange(e.target.value)}
                                                >
                                                    {hospitals.map((hosp) => (
                                                        <MenuItem key={hosp._id} value={hosp._id}>
                                                            {hosp.hospitalName} ({hosp.city}, {hosp.state})
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>

                                        {/* DEPARTMENT SELECT */}
                                        <Grid item xs={12} sm={6}>
                                            <FormControl fullWidth required disabled={!form.hospitalId}>
                                                <InputLabel id="dept-label">Department</InputLabel>
                                                <Select
                                                    labelId="dept-label"
                                                    label="Department"
                                                    value={form.departmentId}
                                                    onChange={(e) => handleDepartmentChange(e.target.value)}
                                                >
                                                    {filteredDepartments.map((dept) => (
                                                        <MenuItem key={dept._id} value={dept._id}>
                                                            {dept.departmentName}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>

                                        {/* DOCTOR SELECT */}
                                        <Grid item xs={12} sm={6}>
                                            <FormControl fullWidth required disabled={!form.hospitalId}>
                                                <InputLabel id="doctor-label">Doctor / Specialist</InputLabel>
                                                <Select
                                                    labelId="doctor-label"
                                                    label="Doctor / Specialist"
                                                    value={form.doctorId}
                                                    onChange={(e) => handleDoctorChange(e.target.value)}
                                                >
                                                    {filteredDoctors.map((doc) => (
                                                        <MenuItem key={doc._id} value={doc._id}>
                                                            {getCleanDoctorName(doc.doctorName)} - {doc.specialization}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>

                                        {/* DATE SELECT */}
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                type="date"
                                                label="Appointment Date"
                                                InputLabelProps={{ shrink: true }}
                                                inputProps={{ min: today }}
                                                value={form.appointmentDate}
                                                onChange={(e) =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        appointmentDate: e.target.value,
                                                        appointmentTime: "",
                                                    }))
                                                }
                                                required
                                                disabled={!form.doctorId}
                                            />
                                        </Grid>

                                        {/* AVAILABLE SLOTS */}
                                        <Grid item xs={12}>
                                            <Typography fontWeight={800} fontSize={14.5} color={colors.ink} mb={1.2}>
                                                Available Consultation Slots
                                            </Typography>

                                            {slotLoading ? (
                                                <Box py={2.5} textAlign="center">
                                                    <CircularProgress size={24} sx={{ color: colors.pine }} />
                                                    <Typography fontSize={12} color={colors.slate} mt={1}>
                                                        Fetching doctor slot availability...
                                                    </Typography>
                                                </Box>
                                            ) : !form.doctorId ? (
                                                <Alert severity="info" sx={{ borderRadius: 2 }}>
                                                    Please choose a hospital and specialist to view available slots.
                                                </Alert>
                                            ) : slots.length === 0 ? (
                                                <Alert severity="info" sx={{ borderRadius: 2 }}>
                                                    {slotNotice || "No slots available on this date for the selected doctor. Please select another date."}
                                                </Alert>
                                            ) : (
                                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                                    {slots.map((slot) => {
                                                        const isSelected = form.appointmentTime === slot.time;
                                                        return (
                                                            <Button
                                                                key={slot.time}
                                                                variant={isSelected ? "contained" : "outlined"}
                                                                disabled={!slot.available}
                                                                onClick={() =>
                                                                    setForm((prev) => ({
                                                                        ...prev,
                                                                        appointmentTime: slot.time,
                                                                    }))
                                                                }
                                                                startIcon={<AccessTimeOutlined fontSize="small" />}
                                                                sx={{
                                                                    borderRadius: 2.2,
                                                                    px: 2,
                                                                    py: 1,
                                                                    fontSize: 13,
                                                                    fontWeight: isSelected ? 800 : 600,
                                                                    bgcolor: isSelected ? colors.amber : "transparent",
                                                                    color: isSelected ? colors.ink : colors.pine,
                                                                    borderColor: isSelected ? colors.amber : colors.hairline,
                                                                    "&:hover": {
                                                                        bgcolor: isSelected ? colors.amberDeep : colors.pineSoft,
                                                                        borderColor: colors.pine,
                                                                    },
                                                                }}
                                                            >
                                                                {slot.time}
                                                            </Button>
                                                        );
                                                    })}
                                                </Box>
                                            )}
                                        </Grid>

                                        {/* REASON / NOTES */}
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                multiline
                                                minRows={3}
                                                label="Clinical Reason or Symptoms (Optional)"
                                                placeholder="Briefly state your symptoms, concerns, or previous medical context."
                                                value={form.reason}
                                                onChange={(e) =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        reason: e.target.value,
                                                    }))
                                                }
                                            />
                                        </Grid>
                                    </Grid>

                                    {/* SUBMIT BUTTON */}
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        type="submit"
                                        disabled={
                                            saving ||
                                            !form.hospitalId ||
                                            !form.doctorId ||
                                            !form.appointmentDate ||
                                            !form.appointmentTime
                                        }
                                        sx={{
                                            mt: 4,
                                            py: 1.6,
                                            borderRadius: 2.5,
                                            bgcolor: colors.amber,
                                            color: colors.ink,
                                            fontWeight: 800,
                                            fontSize: 15.5,
                                            boxShadow: "0 6px 20px rgba(214,138,60,0.3)",
                                            "&:hover": {
                                                bgcolor: colors.amberDeep,
                                                boxShadow: "0 8px 25px rgba(214,138,60,0.4)",
                                            },
                                        }}
                                    >
                                        {saving ? "Confirming Reservation..." : "Confirm & Book Appointment"}
                                    </Button>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                )}
        </Container>
    );

    if (isAuthenticated) {
        return (
            <DashboardLayout
                role="patient"
                title="Book Doctor Appointment"
                subtitle="Select medical facility, doctor, and choose your preferred consultation slot."
            >
                {bookingContent}
            </DashboardLayout>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: colors.canvas, display: "flex", flexDirection: "column" }}>
            <Navbar />
            {bookingContent}
            <Footer />
        </Box>
    );
}