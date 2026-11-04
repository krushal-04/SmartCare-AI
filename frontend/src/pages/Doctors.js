import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
    Alert,
    Box,
    Button,
    Card,
    Chip,
    CircularProgress,
    Container,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import {
    Clear,
    FilterListOutlined,
    LocalHospitalOutlined,
    MedicalServicesOutlined,
    RestartAltOutlined,
    Search,
} from "@mui/icons-material";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import DoctorCard from "../components/DoctorCard";
import api from "../services/api";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

function Doctors() {
    const { isAuthenticated, role, user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    const queryHospitalId = searchParams.get("hospitalId") || "";
    const queryDepartmentId = searchParams.get("departmentId") || "";

    const [doctors, setDoctors] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [search, setSearch] = useState("");
    const [selectedHospital, setSelectedHospital] = useState(queryHospitalId);
    const [selectedDepartment, setSelectedDepartment] = useState(queryDepartmentId);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Load Doctors, Hospitals, and Departments
    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError("");

                const [doctorRes, hospitalRes, deptRes] = await Promise.all([
                    api.get("/doctor/all"),
                    api.get("/hospitals/all"),
                    api.get("/department/all"),
                ]);

                if (!isMounted) return;

                setDoctors(doctorRes.data.doctors || []);
                setHospitals(hospitalRes.data.hospitals || []);
                setDepartments(deptRes.data.departments || []);
            } catch (err) {
                if (isMounted) {
                    setError("Unable to load doctors and directory filters.");
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, []);

    // Filter available departments based on selected hospital
    const availableDepartments = useMemo(() => {
        if (!selectedHospital || selectedHospital === "all") {
            return departments;
        }
        return departments.filter((dept) => {
            const hId = String(dept.hospitalId?._id || dept.hospitalId || "");
            return hId === String(selectedHospital);
        });
    }, [departments, selectedHospital]);

    // Handle Hospital Change
    const handleHospitalChange = (val) => {
        setSelectedHospital(val);
        // If current department is not in selected hospital's departments, reset it
        if (val && val !== "all") {
            const inSelected = departments.some((d) => {
                const dHosp = String(d.hospitalId?._id || d.hospitalId || "");
                return dHosp === String(val) && String(d._id) === String(selectedDepartment);
            });
            if (!inSelected) {
                setSelectedDepartment("");
            }
        }
    };

    // Reset all filters
    const handleResetFilters = () => {
        setSearch("");
        setSelectedHospital("");
        setSelectedDepartment("");
        setSearchParams({});
    };

    const hasActiveFilters = Boolean(
        search || (selectedHospital && selectedHospital !== "all") || (selectedDepartment && selectedDepartment !== "all")
    );

    // Compute Filtered Doctors
    const filteredDoctors = useMemo(() => {
        return doctors.filter((doctor) => {
            // Search text
            const text = `
                ${doctor.doctorName || ""}
                ${doctor.specialization || ""}
                ${doctor.qualification || ""}
                ${doctor.hospitalId?.hospitalName || ""}
                ${doctor.departmentId?.departmentName || ""}
            `.toLowerCase();

            const matchesSearch = !search || text.includes(search.toLowerCase());

            // Hospital filter
            const docHospId = String(doctor.hospitalId?._id || doctor.hospitalId || "");
            const matchesHospital =
                !selectedHospital || selectedHospital === "all" || docHospId === String(selectedHospital);

            // Department filter
            const docDeptId = String(doctor.departmentId?._id || doctor.departmentId || "");
            const matchesDepartment =
                !selectedDepartment || selectedDepartment === "all" || docDeptId === String(selectedDepartment);

            return matchesSearch && matchesHospital && matchesDepartment;
        });
    }, [doctors, search, selectedHospital, selectedDepartment]);

    // RENDER FILTER BAR COMPONENT
    const renderFilterBar = (isDark = false) => (
        <Card
            elevation={0}
            sx={{
                p: { xs: 2, sm: 2.5 },
                mb: 3.5,
                borderRadius: 3.5,
                bgcolor: isDark ? "rgba(255,255,255,0.08)" : colors.white,
                border: isDark ? "1px solid rgba(255,255,255,0.15)" : `1px solid ${colors.hairline}`,
                boxShadow: isDark ? "none" : "0 4px 16px rgba(16,42,67,0.04)",
                backdropFilter: isDark ? "blur(10px)" : "none",
            }}
        >
            <Stack spacing={2}>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            md: "minmax(240px, 1.8fr) minmax(200px, 1.2fr) minmax(200px, 1.2fr) auto",
                        },
                        gap: 2,
                        alignItems: "center",
                    }}
                >
                    {/* 1. TEXT SEARCH */}
                    <TextField
                        fullWidth
                        size="small"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search doctor name, specialization..."
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: isDark ? "#94A3B8" : colors.pine, fontSize: 20 }} />
                                </InputAdornment>
                            ),
                            endAdornment: search ? (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setSearch("")} edge="end">
                                        <Clear sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </InputAdornment>
                            ) : null,
                        }}
                        sx={{
                            bgcolor: isDark ? "rgba(255,255,255,0.95)" : colors.canvas,
                            borderRadius: 2.2,
                            "& .MuiOutlinedInput-root": {
                                borderRadius: 2.2,
                            },
                        }}
                    />

                    {/* 2. SELECT HOSPITAL DROPDOWN */}
                    <FormControl size="small" fullWidth>
                        <InputLabel
                            id="hospital-select-label"
                            sx={{ color: isDark ? "#E2E8F0" : undefined }}
                        >
                            Select Hospital
                        </InputLabel>
                        <Select
                            labelId="hospital-select-label"
                            label="Select Hospital"
                            value={selectedHospital || "all"}
                            onChange={(e) => handleHospitalChange(e.target.value)}
                            startAdornment={
                                <InputAdornment position="start">
                                    <LocalHospitalOutlined
                                        sx={{ color: isDark ? "#94A3B8" : colors.pine, fontSize: 18, mr: -0.5 }}
                                    />
                                </InputAdornment>
                            }
                            sx={{
                                bgcolor: isDark ? "rgba(255,255,255,0.95)" : colors.canvas,
                                borderRadius: 2.2,
                                fontSize: 13.5,
                                color: colors.ink,
                            }}
                        >
                            <MenuItem value="all">
                                <em>All Hospitals</em>
                            </MenuItem>
                            {hospitals.map((hosp) => (
                                <MenuItem key={hosp._id} value={hosp._id}>
                                    {hosp.hospitalName} {hosp.city ? `(${hosp.city})` : ""}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* 3. SELECT DEPARTMENT DROPDOWN */}
                    <FormControl size="small" fullWidth>
                        <InputLabel
                            id="dept-select-label"
                            sx={{ color: isDark ? "#E2E8F0" : undefined }}
                        >
                            Select Department
                        </InputLabel>
                        <Select
                            labelId="dept-select-label"
                            label="Select Department"
                            value={selectedDepartment || "all"}
                            onChange={(e) => setSelectedDepartment(e.target.value)}
                            startAdornment={
                                <InputAdornment position="start">
                                    <MedicalServicesOutlined
                                        sx={{ color: isDark ? "#94A3B8" : colors.pine, fontSize: 18, mr: -0.5 }}
                                    />
                                </InputAdornment>
                            }
                            sx={{
                                bgcolor: isDark ? "rgba(255,255,255,0.95)" : colors.canvas,
                                borderRadius: 2.2,
                                fontSize: 13.5,
                                color: colors.ink,
                            }}
                        >
                            <MenuItem value="all">
                                <em>All Departments</em>
                            </MenuItem>
                            {availableDepartments.map((dept) => (
                                <MenuItem key={dept._id} value={dept._id}>
                                    {dept.departmentName}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* 4. RESET BUTTON */}
                    {hasActiveFilters && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleResetFilters}
                            startIcon={<RestartAltOutlined />}
                            sx={{
                                borderRadius: 2,
                                fontWeight: 700,
                                fontSize: 12.5,
                                py: 0.9,
                                px: 2,
                                whiteSpace: "nowrap",
                                borderColor: isDark ? "rgba(255,255,255,0.4)" : colors.hairline,
                                color: isDark ? "#FFFFFF" : colors.slate,
                                bgcolor: isDark ? "rgba(255,255,255,0.1)" : "transparent",
                                "&:hover": {
                                    borderColor: colors.pine,
                                    bgcolor: colors.pineSoft,
                                    color: colors.pine,
                                },
                            }}
                        >
                            Reset
                        </Button>
                    )}
                </Box>

                {/* ACTIVE FILTER SUMMARY CHIPS */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography
                            fontSize={12.5}
                            fontWeight={700}
                            color={isDark ? "rgba(255,255,255,0.7)" : colors.slate}
                        >
                            Active Filters:
                        </Typography>

                        {!hasActiveFilters && (
                            <Typography fontSize={12} color={isDark ? "rgba(255,255,255,0.5)" : colors.slate}>
                                Showing all doctors
                            </Typography>
                        )}

                        {selectedHospital && selectedHospital !== "all" && (
                            <Chip
                                size="small"
                                icon={<LocalHospitalOutlined sx={{ fontSize: "14px !important" }} />}
                                label={
                                    hospitals.find((h) => String(h._id) === String(selectedHospital))?.hospitalName ||
                                    "Hospital"
                                }
                                onDelete={() => setSelectedHospital("")}
                                sx={{
                                    bgcolor: colors.pineSoft,
                                    color: colors.pine,
                                    fontWeight: 700,
                                    fontSize: 11.5,
                                }}
                            />
                        )}

                        {selectedDepartment && selectedDepartment !== "all" && (
                            <Chip
                                size="small"
                                icon={<MedicalServicesOutlined sx={{ fontSize: "14px !important" }} />}
                                label={
                                    departments.find((d) => String(d._id) === String(selectedDepartment))
                                        ?.departmentName || "Department"
                                }
                                onDelete={() => setSelectedDepartment("")}
                                sx={{
                                    bgcolor: "#EFF6FF",
                                    color: "#1D4ED8",
                                    fontWeight: 700,
                                    fontSize: 11.5,
                                }}
                            />
                        )}

                        {search && (
                            <Chip
                                size="small"
                                label={`Search: "${search}"`}
                                onDelete={() => setSearch("")}
                                sx={{
                                    bgcolor: colors.canvas,
                                    color: colors.ink,
                                    fontWeight: 700,
                                    fontSize: 11.5,
                                }}
                            />
                        )}
                    </Stack>

                    <Typography
                        fontSize={12.5}
                        fontWeight={750}
                        color={isDark ? "#5EEAD4" : colors.pine}
                    >
                        Showing {filteredDoctors.length} of {doctors.length} Doctors
                    </Typography>
                </Stack>
            </Stack>
        </Card>
    );

    // ==========================================
    // 1. AUTHENTICATED PATIENT / USER DASHBOARD VIEW
    // ==========================================
    if (isAuthenticated) {
        return (
            <DashboardLayout
                role={role || user?.role || "patient"}
                title="Find Doctors"
                subtitle="Explore healthcare specialists by hospital and department"
            >
                {/* FILTER DROPDOWNS BAR */}
                {renderFilterBar(false)}

                {loading && (
                    <Box textAlign="center" py={8}>
                        <CircularProgress sx={{ color: colors.pine }} />
                        <Typography fontSize={13.5} color={colors.slate} mt={1.5}>
                            Loading specialists and clinical directory...
                        </Typography>
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }}>
                        {error}
                    </Alert>
                )}

                {!loading && !error && (
                    <>
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    sm: "repeat(2, minmax(0, 1fr))",
                                    lg: "repeat(3, minmax(0, 1fr))",
                                    xl: "repeat(4, minmax(0, 1fr))",
                                },
                                gap: 3,
                            }}
                        >
                            {filteredDoctors.map((doctor) => (
                                <Box key={doctor._id} sx={{ minWidth: 0, display: "flex" }}>
                                    <DoctorCard doctor={doctor} />
                                </Box>
                            ))}
                        </Box>

                        {filteredDoctors.length === 0 && (
                            <Box
                                textAlign="center"
                                py={8}
                                sx={{
                                    bgcolor: colors.white,
                                    borderRadius: 3.5,
                                    border: `1px solid ${colors.hairline}`,
                                }}
                            >
                                <FilterListOutlined sx={{ fontSize: 50, color: colors.slate, opacity: 0.5, mb: 1 }} />
                                <Typography variant="h6" fontWeight={800} color={colors.ink}>
                                    No doctors match your filter criteria
                                </Typography>
                                <Typography fontSize={13.5} color={colors.slate} mt={0.5} mb={2}>
                                    Try selecting a different hospital, department, or clearing your search keywords.
                                </Typography>
                                <Button
                                    variant="outlined"
                                    onClick={handleResetFilters}
                                    sx={{ borderRadius: 2, fontWeight: 700 }}
                                >
                                    Clear All Filters
                                </Button>
                            </Box>
                        )}
                    </>
                )}
            </DashboardLayout>
        );
    }

    // ==========================================
    // 2. PUBLIC WEBSITE VIEW
    // ==========================================
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
                    <Typography fontSize={{ xs: 34, md: 48 }} fontWeight={900}>
                        Find a Doctor & Specialist
                    </Typography>

                    <Typography mt={1} maxWidth={650} color="rgba(255,255,255,.7)" lineHeight={1.6}>
                        Filter certified medical practitioners by healthcare hospital, clinical department, and
                        specialization.
                    </Typography>

                    <Box sx={{ mt: 3.5 }}>
                        {renderFilterBar(true)}
                    </Box>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: 6 }}>
                {loading && (
                    <Box textAlign="center" py={8}>
                        <CircularProgress sx={{ color: colors.pine }} />
                    </Box>
                )}

                {error && <Alert severity="error">{error}</Alert>}

                {!loading && !error && (
                    <>
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    sm: "repeat(2, minmax(0, 1fr))",
                                    lg: "repeat(3, minmax(0, 1fr))",
                                },
                                gap: 3,
                            }}
                        >
                            {filteredDoctors.map((doctor) => (
                                <Box key={doctor._id} sx={{ minWidth: 0, display: "flex" }}>
                                    <DoctorCard doctor={doctor} />
                                </Box>
                            ))}
                        </Box>

                        {filteredDoctors.length === 0 && (
                            <Box textAlign="center" py={8}>
                                <Typography variant="h6" fontWeight={800} color="text.secondary">
                                    No doctors found matching selected filters
                                </Typography>
                                <Button
                                    variant="outlined"
                                    onClick={handleResetFilters}
                                    sx={{ mt: 2, borderRadius: 2, fontWeight: 700 }}
                                >
                                    Clear Filters
                                </Button>
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
