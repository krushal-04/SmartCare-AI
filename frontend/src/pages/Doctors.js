import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Box,
    Container,
    Typography,
    TextField,
    InputAdornment,
    Card,
    CardContent,
    Button,
    Stack,
    Grid,
    Chip,
    CircularProgress,
    Alert,
} from "@mui/material";

import {
    Search,
    MedicalServicesOutlined,
    LocalHospital,
    CalendarMonth,
} from "@mui/icons-material";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import DoctorCard from "../components/DoctorCard";
import api from "../services/api";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

function Doctors() {
    const navigate = useNavigate();
    const { isAuthenticated, role, user } = useAuth();

    const [doctors, setDoctors] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const response = await api.get("/doctor/all");
                setDoctors(response.data.doctors || []);
            } catch (err) {
                setError("Unable to load doctors.");
            } finally {
                setLoading(false);
            }
        };

        fetchDoctors();
    }, []);

    const filteredDoctors = doctors.filter((doctor) => {
        const text = `
            ${doctor.doctorName || ""}
            ${doctor.specialization || ""}
            ${doctor.qualification || ""}
            ${doctor.hospitalId?.hospitalName || ""}
            ${doctor.departmentId?.departmentName || ""}
        `.toLowerCase();

        return text.includes(search.toLowerCase());
    });

    if (isAuthenticated) {
        return (
            <DashboardLayout
                role={role || user?.role || "patient"}
                title="Find Doctors"
                subtitle="Explore healthcare specialists and doctors"
            >
                <Box sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search doctor, specialization or hospital..."
                        sx={{
                            maxWidth: 680,
                            bgcolor: "white",
                            borderRadius: 2.5,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search color="primary" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                {loading && (
                    <Box textAlign="center" py={8}>
                        <CircularProgress sx={{ color: colors.pine }} />
                    </Box>
                )}

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                {!loading && !error && (
                    <>
                        <Grid container spacing={3}>
                            {filteredDoctors.map((doctor) => (
                                <Grid item xs={12} sm={6} md={4} key={doctor._id} sx={{ display: "flex" }}>
                                    <DoctorCard doctor={doctor} />
                                </Grid>
                            ))}
                        </Grid>

                        {filteredDoctors.length === 0 && (
                            <Box textAlign="center" py={8}>
                                <Typography variant="h6" fontWeight={800} color="text.secondary">
                                    No doctors found
                                </Typography>
                            </Box>
                        )}
                    </>
                )}
            </DashboardLayout>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#F6FAFB" }}>
            <Navbar />

            <Box
                sx={{
                    bgcolor: "#102F42",
                    color: "white",
                    py: { xs: 6, md: 8 },
                }}
            >
                <Container maxWidth="lg">
                    <Typography
                        fontSize={{ xs: 36, md: 54 }}
                        fontWeight={900}
                    >
                        Find a doctor
                    </Typography>

                    <Typography
                        mt={1.5}
                        maxWidth={650}
                        color="rgba(255,255,255,.68)"
                        lineHeight={1.7}
                    >
                        Explore doctors by specialization,
                        department and hospital.
                    </Typography>

                    <TextField
                        fullWidth
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        placeholder="Search doctor, specialization or hospital..."
                        sx={{
                            mt: 4,
                            maxWidth: 750,
                            bgcolor: "white",
                            borderRadius: 2,
                            "& fieldset": {
                                border: "none",
                            },
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search color="primary" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: 6 }}>
                {loading && (
                    <Box textAlign="center" py={8}>
                        <CircularProgress />
                    </Box>
                )}

                {error && (
                    <Alert severity="error">{error}</Alert>
                )}

                {!loading && !error && (
                    <>
                        <Grid container spacing={3}>
                            {filteredDoctors.map((doctor) => (
                                <Grid
                                    item
                                    xs={12}
                                    sm={6}
                                    md={4}
                                    key={doctor._id}
                                    sx={{ display: "flex" }}
                                >
                                    <DoctorCard doctor={doctor} />
                                </Grid>
                            ))}
                        </Grid>

                        {filteredDoctors.length === 0 && (
                            <Box textAlign="center" py={8}>
                                <Typography
                                    variant="h6"
                                    fontWeight={800}
                                >
                                    No doctors found
                                </Typography>
                            </Box>
                        )}
                    </>
                )}
            </Container>

            <Footer />
        </Box>
    );
}

export default Doctors;