import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Grid,
    InputAdornment,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import {
    ArrowForward,
    DomainOutlined,
    LocalHospitalOutlined,
    Search,
} from "@mui/icons-material";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";

function Departments() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const hospitalId = searchParams.get("hospitalId");

    const [departments, setDepartments] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get(
                    "/department/all"
                );

                console.log(
                    "Department response:",
                    response.data
                );

                setDepartments(
                    response.data.departments || []
                );
            } catch (error) {
                console.error(
                    "Department API error:",
                    error
                );

                setError(
                    error.response?.data?.message ||
                    "Unable to load departments."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDepartments();
    }, []);

    const filteredDepartments = useMemo(() => {
        let result = departments;

        if (hospitalId) {
            result = result.filter((department) => {
                const departmentHospitalId =
                    department.hospitalId?._id ||
                    department.hospitalId;

                return (
                    String(departmentHospitalId) ===
                    String(hospitalId)
                );
            });
        }

        const query = search.trim().toLowerCase();

        if (!query) {
            return result;
        }

        return result.filter((department) => {
            const text = [
                department.departmentName,
                department.description,
                department.hospitalId?.hospitalName,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return text.includes(query);
        });
    }, [departments, hospitalId, search]);

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: "#F6FAFB",
            }}
        >
            <Navbar />

            <Box
                sx={{
                    bgcolor: "#102F42",
                    color: "#fff",
                }}
            >
                <Container
                    maxWidth="lg"
                    sx={{
                        py: {
                            xs: 6,
                            md: 8,
                        },
                    }}
                >
                    <Chip
                        icon={<DomainOutlined />}
                        label="MEDICAL DEPARTMENTS"
                        sx={{
                            mb: 2.5,
                            color: "#71E9DF",
                            bgcolor:
                                "rgba(113,233,222,.10)",
                            border:
                                "1px solid rgba(113,233,222,.16)",
                            fontWeight: 800,
                        }}
                    />

                    <Typography
                        sx={{
                            fontSize: {
                                xs: 38,
                                md: 58,
                            },
                            lineHeight: 1,
                            fontWeight: 900,
                            letterSpacing: "-0.05em",
                        }}
                    >
                        Explore
                        <Box
                            component="span"
                            sx={{
                                display: "block",
                                color: "#71E9DF",
                            }}
                        >
                            medical departments.
                        </Box>
                    </Typography>

                    <Typography
                        mt={2.5}
                        maxWidth={680}
                        color="rgba(255,255,255,.68)"
                        lineHeight={1.8}
                    >
                        Explore specialties, understand what each
                        department offers and find doctors in that
                        area.
                    </Typography>

                    <TextField
                        fullWidth
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        placeholder="Search cardiology, neurology, orthopedics..."
                        sx={{
                            mt: 4,
                            maxWidth: 760,
                            bgcolor: "#fff",
                            borderRadius: 3,
                            "& fieldset": {
                                border: "none",
                            },
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search
                                        sx={{
                                            color: "#0B8793",
                                        }}
                                    />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Container>
            </Box>

            <Container
                maxWidth="lg"
                sx={{
                    py: {
                        xs: 5,
                        md: 7,
                    },
                }}
            >
                <Stack
                    direction={{
                        xs: "column",
                        sm: "row",
                    }}
                    justifyContent="space-between"
                    alignItems={{
                        xs: "flex-start",
                        sm: "center",
                    }}
                    spacing={1}
                    mb={3}
                >
                    <Box>
                        <Typography
                            fontSize={{
                                xs: 24,
                                md: 30,
                            }}
                            fontWeight={900}
                        >
                            Departments
                        </Typography>

                        <Typography
                            fontSize={14}
                            color="text.secondary"
                        >
                            {filteredDepartments.length} department
                            {filteredDepartments.length !== 1
                                ? "s"
                                : ""}{" "}
                            available
                        </Typography>
                    </Box>

                    {hospitalId && (
                        <Chip
                            icon={
                                <LocalHospitalOutlined />
                            }
                            label="Filtered by hospital"
                            sx={{
                                bgcolor: "#E9F8F9",
                                color: "#0B8793",
                                fontWeight: 800,
                            }}
                        />
                    )}
                </Stack>

                {loading && (
                    <Box
                        sx={{
                            minHeight: 350,
                            display: "grid",
                            placeItems: "center",
                        }}
                    >
                        <Stack
                            alignItems="center"
                            spacing={2}
                        >
                            <CircularProgress />

                            <Typography
                                color="text.secondary"
                            >
                                Loading departments...
                            </Typography>
                        </Stack>
                    </Box>
                )}

                {!loading && error && (
                    <Alert
                        severity="error"
                        sx={{
                            borderRadius: 3,
                        }}
                    >
                        {error}
                    </Alert>
                )}

                {!loading &&
                    !error &&
                    filteredDepartments.length > 0 && (
                        <Grid container spacing={3}>
                            {filteredDepartments.map(
                                (department) => (
                                    <Grid
                                        item
                                        xs={12}
                                        sm={6}
                                        md={4}
                                        key={
                                            department._id
                                        }
                                    >
                                        <Card
                                            elevation={0}
                                            sx={{
                                                height: "100%",
                                                borderRadius: 4,
                                                border:
                                                    "1px solid #DDE9EC",
                                                transition:
                                                    ".25s",
                                                "&:hover": {
                                                    transform:
                                                        "translateY(-5px)",
                                                    boxShadow:
                                                        "0 20px 40px rgba(16,70,85,.10)",
                                                },
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    height: 180,
                                                    bgcolor:
                                                        "#EAF7F8",
                                                    display:
                                                        "grid",
                                                    placeItems:
                                                        "center",
                                                }}
                                            >
                                                <DomainOutlined
                                                    sx={{
                                                        fontSize: 72,
                                                        color:
                                                            "#0B8793",
                                                    }}
                                                />
                                            </Box>

                                            <CardContent
                                                sx={{
                                                    p: 3,
                                                }}
                                            >
                                                <Typography
                                                    fontSize={
                                                        21
                                                    }
                                                    fontWeight={
                                                        900
                                                    }
                                                >
                                                    {
                                                        department.departmentName
                                                    }
                                                </Typography>

                                                <Typography
                                                    mt={1}
                                                    fontSize={
                                                        14
                                                    }
                                                    color="text.secondary"
                                                    lineHeight={
                                                        1.7
                                                    }
                                                >
                                                    {department.description ||
                                                        "Specialized healthcare department."}
                                                </Typography>

                                                {department
                                                    .hospitalId
                                                    ?.hospitalName && (
                                                    <Stack
                                                        direction="row"
                                                        spacing={
                                                            0.7
                                                        }
                                                        mt={2}
                                                        alignItems="center"
                                                    >
                                                        <LocalHospitalOutlined
                                                            sx={{
                                                                fontSize: 18,
                                                                color: "#0B8793",
                                                            }}
                                                        />

                                                        <Typography
                                                            fontSize={
                                                                12
                                                            }
                                                            color="text.secondary"
                                                        >
                                                            {
                                                                department
                                                                    .hospitalId
                                                                    .hospitalName
                                                            }
                                                        </Typography>
                                                    </Stack>
                                                )}

                                                <Button
                                                    fullWidth
                                                    variant="contained"
                                                    endIcon={
                                                        <ArrowForward />
                                                    }
                                                    onClick={() =>
                                                        navigate(
                                                            `/doctors?departmentId=${department._id}`
                                                        )
                                                    }
                                                    sx={{
                                                        mt: 2.5,
                                                    }}
                                                >
                                                    Find Doctors
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )
                            )}
                        </Grid>
                    )}

                {!loading &&
                    !error &&
                    filteredDepartments.length === 0 && (
                        <Box
                            sx={{
                                minHeight: 300,
                                display: "grid",
                                placeItems: "center",
                                textAlign: "center",
                            }}
                        >
                            <Box>
                                <Typography
                                    fontSize={22}
                                    fontWeight={900}
                                >
                                    No departments found
                                </Typography>

                                <Typography
                                    mt={1}
                                    color="text.secondary"
                                >
                                    Try another department
                                    name.
                                </Typography>

                                <Button
                                    onClick={() =>
                                        setSearch("")
                                    }
                                    sx={{ mt: 2 }}
                                >
                                    Clear Search
                                </Button>
                            </Box>
                        </Box>
                    )}
            </Container>

            <Footer />
        </Box>
    );
}

export default Departments;