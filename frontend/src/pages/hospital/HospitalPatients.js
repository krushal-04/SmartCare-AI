import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Alert,
} from "@mui/material";
import {
    SearchRounded,
    PersonOutlineOutlined,
    HistoryRounded,
    DescriptionOutlined,
    CalendarMonthOutlined,
    CheckCircleOutlined,
    CloseRounded,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PageHeader from "../../components/dashboard/PageHeader";
import api from "../../services/api";

export default function HospitalPatients() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [alert, setAlert] = useState({ type: "", message: "" });

    // Details Dialog
    const [selectedPatient, setSelectedPatient] = useState(null);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const res = await api.get("/hospitals/patients");
            if (res.data.success) {
                setPatients(res.data.patients || []);
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to load patient records.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const filtered = patients.filter((p) =>
        p.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase()) ||
        p.phone?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout
            role="hospital"
            title="Hospital Patients Directory"
            subtitle="Verified patients who hold active or historical consultation records at your center"
        >
            <PageHeader
                title="Patients Management"
                subtitle="Clinical history and records for patients under your hospital's care"
                backTo="/hospital"
                backLabel="← Back to Dashboard"
            />

            {alert.message && (
                <Alert severity={alert.type} sx={{ mb: 3, borderRadius: 3 }}>
                    {alert.message}
                </Alert>
            )}

            <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #E3EBEE" }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    {/* Search Bar */}
                    <Box sx={{ mb: 3 }}>
                        <TextField
                            size="small"
                            placeholder="Search patients by name, phone, or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sx={{ width: { xs: "100%", sm: 340 } }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchRounded fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>

                    {loading ? (
                        <Box py={8} textAlign="center">
                            <CircularProgress />
                        </Box>
                    ) : filtered.length === 0 ? (
                        <Box py={8} textAlign="center">
                            <PersonOutlineOutlined sx={{ fontSize: 52, color: "text.secondary", mb: 1.5 }} />
                            <Typography fontWeight={800} variant="h6">
                                No Associated Patients Found
                            </Typography>
                            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                                {search
                                    ? "No patients matched your search query."
                                    : "Patients who book appointments with your hospital will appear here."}
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#F8FAFB" }}>
                                        <TableCell sx={{ fontWeight: 800 }}>Patient Details</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Contact Information</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Total Consults</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Completed</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Upcoming</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Reports</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filtered.map((patient) => (
                                        <TableRow key={patient._id} hover>
                                            <TableCell>
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Avatar
                                                        sx={{
                                                            width: 42,
                                                            height: 42,
                                                            bgcolor: "primary.main",
                                                            fontWeight: 800,
                                                        }}
                                                    >
                                                        {patient.fullName?.charAt(0)}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography fontWeight={800} fontSize={14}>
                                                            {patient.fullName}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Registered {new Date(patient.createdAt).toLocaleDateString()}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>

                                            <TableCell>
                                                <Typography fontSize={13} fontWeight={600}>
                                                    {patient.phone}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" fontSize={12}>
                                                    {patient.email}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Chip
                                                    label={`${patient.totalAppointments || 0} Visits`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 700 }}
                                                />
                                            </TableCell>

                                            <TableCell>
                                                <Typography fontWeight={700} fontSize={13} color="success.main">
                                                    {patient.completedAppointments || 0}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Typography fontWeight={700} fontSize={13} color="primary.main">
                                                    {patient.upcomingCount || 0}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Typography fontWeight={700} fontSize={13}>
                                                    {patient.reportsCount || 0}
                                                </Typography>
                                            </TableCell>

                                            <TableCell align="right">
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<HistoryRounded />}
                                                    onClick={() => setSelectedPatient(patient)}
                                                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                                                >
                                                    View History
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            {/* Patient Clinical History Dialog */}
            <Dialog
                open={Boolean(selectedPatient)}
                onClose={() => setSelectedPatient(null)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 800, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                        {selectedPatient?.fullName} — Consultation History
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                            {selectedPatient?.phone} • {selectedPatient?.email}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setSelectedPatient(null)}>
                        <CloseRounded />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedPatient?.appointmentHistory?.length === 0 ? (
                        <Typography color="text.secondary" py={3} textAlign="center">
                            No appointment history recorded for this patient at your hospital.
                        </Typography>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                                        <TableCell sx={{ fontWeight: 800 }}>Date & Time</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Doctor</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Department</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Reason</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Notes</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {selectedPatient?.appointmentHistory?.map((a) => (
                                        <TableRow key={a._id}>
                                            <TableCell>
                                                <Typography fontSize={13} fontWeight={700}>
                                                    {new Date(a.appointmentDate).toLocaleDateString()}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {a.appointmentTime}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography fontSize={13} fontWeight={600}>
                                                    Dr. {a.doctorId?.doctorName}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography fontSize={13} color="text.secondary">
                                                    {a.departmentId?.departmentName || "General"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 200 }}>
                                                <Typography fontSize={12} noWrap>
                                                    {a.reason || "General Consultation"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={a.status}
                                                    size="small"
                                                    color={
                                                        a.status === "Completed"
                                                            ? "success"
                                                            : a.status === "Confirmed"
                                                            ? "info"
                                                            : a.status === "Pending"
                                                            ? "warning"
                                                            : "default"
                                                    }
                                                    sx={{ fontWeight: 700 }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 200 }}>
                                                <Typography fontSize={12} color="text.secondary" noWrap>
                                                    {a.notes || "—"}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<DescriptionOutlined />}
                        onClick={() => {
                            setSelectedPatient(null);
                            navigate(`/hospital/reports?patientId=${selectedPatient?._id}`);
                        }}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                    >
                        Upload Medical Report for Patient
                    </Button>
                    <Button onClick={() => setSelectedPatient(null)} color="inherit" sx={{ fontWeight: 600 }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
}
