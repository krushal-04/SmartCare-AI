import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
    Alert,
    Box,
    Button,
    Card,
    Checkbox,
    CircularProgress,
    Container,
    Divider,
    FormControlLabel,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import {
    ArrowBack,
    ArrowForward,
    CheckCircle,
    EmailOutlined,
    HealthAndSafety,
    LocalHospitalOutlined,
    PersonOutlined,
    PhoneOutlined,
    ShieldOutlined,
    Visibility,
    VisibilityOff,
} from "@mui/icons-material";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";

const COLORS = {
    background: "#F3F5F0",
    card: "#FFFFFF",
    ink: "#1C2B27",
    muted: "#5B6B63",
    border: "#DCE3DB",
    primary: "#2B5C52",
    primaryDark: "#1D453D",
    primarySoft: "#E4EEE9",
    amber: "#D68A3C",
    amberSoft: "#FBEEDD",
    success: "#2E7D5B",
    successSoft: "#EAF5EE",
    danger: "#B24632",
};

const INITIAL_FORM = {
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "patient",
};

function Register() {
    const navigate = useNavigate();
    const { isAuthenticated, role } = useAuth();

    useEffect(() => {
        if (isAuthenticated && role) {
            navigate(
                role === "hospital"
                    ? "/hospital"
                    : role === "admin"
                    ? "/admin"
                    : "/patient",
                { replace: true }
            );
        }
    }, [isAuthenticated, role, navigate]);

    const [form, setForm] = useState(INITIAL_FORM);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [agreeTerms, setAgreeTerms] = useState(false);

    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);

    const [errors, setErrors] = useState({});

    const passwordStrength = useMemo(() => {
        const password = form.password;

        if (!password) {
            return {
                score: 0,
                label: "",
                width: 0,
            };
        }

        let score = 0;

        if (password.length >= 6) score += 1;
        if (password.length >= 10) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;

        let label = "Weak";

        if (score >= 4) {
            label = "Strong";
        } else if (score >= 3) {
            label = "Good";
        }

        return {
            score,
            label,
            width: score * 20,
        };
    }, [form.password]);

    const handleChange = (field) => (event) => {
        const value = event.target.value;

        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));

        setMessage("");

        setErrors((previous) => ({
            ...previous,
            [field]: "",
        }));
    };

    const handleRoleChange = (role) => {
        setForm((previous) => ({
            ...previous,
            role,
        }));

        setErrors((previous) => ({
            ...previous,
            role: "",
        }));

        setMessage("");
    };

    const validate = () => {
        const nextErrors = {};

        const fullName = form.fullName.trim();
        const email = form.email.trim();
        const phone = form.phone.trim();

        if (!fullName) {
            nextErrors.fullName = "Please enter your full name.";
        } else if (fullName.length < 3) {
            nextErrors.fullName =
                "Full name must contain at least 3 characters.";
        }

        if (!email) {
            nextErrors.email = "Please enter your email address.";
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            nextErrors.email =
                "Please enter a valid email address.";
        }

        if (!phone) {
            nextErrors.phone = "Please enter your phone number.";
        } else if (!/^[0-9]{10}$/.test(phone)) {
            nextErrors.phone =
                "Phone number must contain exactly 10 digits.";
        }

        if (!form.password) {
            nextErrors.password = "Please create a password.";
        } else if (form.password.length < 6) {
            nextErrors.password =
                "Password must contain at least 6 characters.";
        }

        if (!form.confirmPassword) {
            nextErrors.confirmPassword =
                "Please confirm your password.";
        } else if (
            form.password !== form.confirmPassword
        ) {
            nextErrors.confirmPassword =
                "Passwords do not match.";
        }

        if (!agreeTerms) {
            nextErrors.terms =
                "Please accept the terms to continue.";
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setSuccess(false);

        if (!validate()) {
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("/auth/register", {
                fullName: form.fullName.trim(),
                email: form.email.trim().toLowerCase(),
                phone: form.phone.trim(),
                password: form.password,
                role: form.role,
            });

            setSuccess(true);

            setMessage(
                response.data?.message ||
                    "Your account has been created successfully."
            );
        } catch (error) {
            setSuccess(false);

            const backendMessage =
                error?.response?.data?.message;

            setMessage(
                backendMessage ||
                    "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm(INITIAL_FORM);
        setErrors({});
        setMessage("");
        setSuccess(false);
        setAgreeTerms(false);
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: COLORS.background,
            }}
        >
            <Navbar />

            <Container
                maxWidth="md"
                sx={{
                    py: {
                        xs: 4,
                        sm: 6,
                        md: 8,
                    },
                }}
            >
                {/* HEADER */}
                <Box
                    sx={{
                        maxWidth: 760,
                        mx: "auto",
                        mb: 4,
                    }}
                >
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={() => navigate("/")}
                        sx={{
                            mb: 3,
                            px: 0,
                            color: COLORS.muted,
                            textTransform: "none",
                            fontWeight: 700,
                            "&:hover": {
                                bgcolor: "transparent",
                                color: COLORS.primary,
                            },
                        }}
                    >
                        Back to home
                    </Button>

                    <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        sx={{ mb: 1.5 }}
                    >
                        <Box
                            sx={{
                                width: 42,
                                height: 42,
                                borderRadius: 2.5,
                                bgcolor: COLORS.primarySoft,
                                color: COLORS.primary,
                                display: "grid",
                                placeItems: "center",
                            }}
                        >
                            <HealthAndSafety />
                        </Box>

                        <Typography
                            sx={{
                                fontSize: 13,
                                fontWeight: 800,
                                color: COLORS.primary,
                                letterSpacing: 1.5,
                                textTransform: "uppercase",
                            }}
                        >
                            SmartCare
                        </Typography>
                    </Stack>

                    <Typography
                        sx={{
                            fontSize: {
                                xs: 34,
                                sm: 44,
                                md: 52,
                            },
                            lineHeight: 1.05,
                            fontWeight: 800,
                            letterSpacing: "-0.045em",
                            color: COLORS.ink,
                        }}
                    >
                        Create your account
                    </Typography>

                    <Typography
                        sx={{
                            mt: 1.5,
                            maxWidth: 620,
                            color: COLORS.muted,
                            fontSize: {
                                xs: 14,
                                sm: 16,
                            },
                            lineHeight: 1.7,
                        }}
                    >
                        Join SmartCare to connect with hospitals,
                        doctors and healthcare services from one
                        secure platform.
                    </Typography>
                </Box>

                {/* MAIN CARD */}
                <Card
                    elevation={0}
                    sx={{
                        maxWidth: 760,
                        mx: "auto",
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: {
                            xs: 3,
                            sm: 4,
                        },
                        overflow: "hidden",
                        bgcolor: COLORS.card,
                    }}
                >
                    {success ? (
                        <SuccessView
                            role={form.role}
                            message={message}
                            onLogin={() => navigate("/login")}
                            onCreateAnother={resetForm}
                        />
                    ) : (
                        <Box
                            component="form"
                            onSubmit={handleSubmit}
                            noValidate
                            sx={{
                                p: {
                                    xs: 2.5,
                                    sm: 4,
                                    md: 5,
                                },
                            }}
                        >
                            {/* ACCOUNT TYPE */}
                            <Box sx={{ mb: 4 }}>
                                <Typography
                                    sx={{
                                        fontSize: 13,
                                        fontWeight: 800,
                                        color: COLORS.ink,
                                        letterSpacing: 0.8,
                                        textTransform: "uppercase",
                                        mb: 0.6,
                                    }}
                                >
                                    Account type
                                </Typography>

                                <Typography
                                    sx={{
                                        color: COLORS.muted,
                                        fontSize: 14,
                                        mb: 2,
                                    }}
                                >
                                    Choose how you will use
                                    SmartCare.
                                </Typography>

                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: {
                                            xs: "1fr",
                                            sm: "1fr 1fr",
                                        },
                                        gap: 1.5,
                                    }}
                                >
                                    <RoleCard
                                        selected={
                                            form.role ===
                                            "patient"
                                        }
                                        icon={<PersonOutlined />}
                                        title="Patient"
                                        description="Book appointments, manage reports and access healthcare services."
                                        onClick={() =>
                                            handleRoleChange(
                                                "patient"
                                            )
                                        }
                                    />

                                    <RoleCard
                                        selected={
                                            form.role ===
                                            "hospital"
                                        }
                                        icon={
                                            <LocalHospitalOutlined />
                                        }
                                        title="Hospital"
                                        description="Manage doctors, appointments, departments and hospital services."
                                        onClick={() =>
                                            handleRoleChange(
                                                "hospital"
                                            )
                                        }
                                    />
                                </Box>
                            </Box>

                            <Divider
                                sx={{
                                    mb: 4,
                                }}
                            />

                            {/* PERSONAL DETAILS */}
                            <SectionTitle
                                number="01"
                                title="Personal details"
                            />

                            <Stack spacing={2.2}>
                                <TextField
                                    fullWidth
                                    label="Full name"
                                    placeholder="Enter your full name"
                                    value={form.fullName}
                                    onChange={handleChange(
                                        "fullName"
                                    )}
                                    error={Boolean(
                                        errors.fullName
                                    )}
                                    helperText={
                                        errors.fullName ||
                                        "Use your name as it should appear on your account."
                                    }
                                    autoComplete="name"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonOutlined
                                                    sx={{
                                                        color: COLORS.muted,
                                                    }}
                                                />
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: {
                                            xs: "1fr",
                                            sm: "1fr 1fr",
                                        },
                                        gap: 2.2,
                                    }}
                                >
                                    <TextField
                                        fullWidth
                                        label="Email address"
                                        placeholder="you@example.com"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange(
                                            "email"
                                        )}
                                        error={Boolean(
                                            errors.email
                                        )}
                                        helperText={
                                            errors.email
                                        }
                                        autoComplete="email"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <EmailOutlined
                                                        sx={{
                                                            color: COLORS.muted,
                                                        }}
                                                    />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    <TextField
                                        fullWidth
                                        label="Phone number"
                                        placeholder="10 digit mobile number"
                                        value={form.phone}
                                        onChange={(event) => {
                                            const value =
                                                event.target.value.replace(
                                                    /\D/g,
                                                    ""
                                                );

                                            if (
                                                value.length <=
                                                10
                                            ) {
                                                setForm(
                                                    (
                                                        previous
                                                    ) => ({
                                                        ...previous,
                                                        phone: value,
                                                    })
                                                );

                                                setErrors(
                                                    (
                                                        previous
                                                    ) => ({
                                                        ...previous,
                                                        phone: "",
                                                    })
                                                );
                                            }

                                            setMessage("");
                                        }}
                                        error={Boolean(
                                            errors.phone
                                        )}
                                        helperText={
                                            errors.phone
                                        }
                                        inputProps={{
                                            maxLength: 10,
                                            inputMode: "numeric",
                                        }}
                                        autoComplete="tel"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PhoneOutlined
                                                        sx={{
                                                            color: COLORS.muted,
                                                        }}
                                                    />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Box>
                            </Stack>

                            {/* PASSWORD */}
                            <Box sx={{ mt: 5 }}>
                                <SectionTitle
                                    number="02"
                                    title="Security"
                                />

                                <Stack spacing={2.2}>
                                    <TextField
                                        fullWidth
                                        label="Password"
                                        placeholder="Create a secure password"
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={
                                            form.password
                                        }
                                        onChange={handleChange(
                                            "password"
                                        )}
                                        error={Boolean(
                                            errors.password
                                        )}
                                        helperText={
                                            errors.password ||
                                            "Minimum 6 characters."
                                        }
                                        autoComplete="new-password"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <ShieldOutlined
                                                        sx={{
                                                            color: COLORS.muted,
                                                        }}
                                                    />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        edge="end"
                                                        onClick={() =>
                                                            setShowPassword(
                                                                (
                                                                    previous
                                                                ) =>
                                                                    !previous
                                                            )
                                                        }
                                                        aria-label={
                                                            showPassword
                                                                ? "Hide password"
                                                                : "Show password"
                                                        }
                                                    >
                                                        {showPassword ? (
                                                            <VisibilityOff />
                                                        ) : (
                                                            <Visibility />
                                                        )}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    {form.password && (
                                        <Box
                                            sx={{
                                                mt: -1,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    height: 5,
                                                    bgcolor:
                                                        "#E8ECE8",
                                                    borderRadius: 10,
                                                    overflow:
                                                        "hidden",
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: `${passwordStrength.width}%`,
                                                        height: "100%",
                                                        bgcolor:
                                                            passwordStrength.score >=
                                                            4
                                                                ? COLORS.success
                                                                : passwordStrength.score >=
                                                                  3
                                                                ? COLORS.amber
                                                                : COLORS.danger,
                                                        transition:
                                                            "width .2s ease",
                                                    }}
                                                />
                                            </Box>

                                            <Typography
                                                sx={{
                                                    mt: 0.8,
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    color:
                                                        passwordStrength.score >=
                                                        4
                                                            ? COLORS.success
                                                            : passwordStrength.score >=
                                                              3
                                                            ? COLORS.amber
                                                            : COLORS.danger,
                                                }}
                                            >
                                                Password strength:{" "}
                                                {
                                                    passwordStrength.label
                                                }
                                            </Typography>
                                        </Box>
                                    )}

                                    <TextField
                                        fullWidth
                                        label="Confirm password"
                                        placeholder="Enter your password again"
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={
                                            form.confirmPassword
                                        }
                                        onChange={handleChange(
                                            "confirmPassword"
                                        )}
                                        error={Boolean(
                                            errors.confirmPassword
                                        )}
                                        helperText={
                                            errors.confirmPassword
                                        }
                                        autoComplete="new-password"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <ShieldOutlined
                                                        sx={{
                                                            color: COLORS.muted,
                                                        }}
                                                    />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        edge="end"
                                                        onClick={() =>
                                                            setShowConfirmPassword(
                                                                (
                                                                    previous
                                                                ) =>
                                                                    !previous
                                                            )
                                                        }
                                                        aria-label={
                                                            showConfirmPassword
                                                                ? "Hide password"
                                                                : "Show password"
                                                        }
                                                    >
                                                        {showConfirmPassword ? (
                                                            <VisibilityOff />
                                                        ) : (
                                                            <Visibility />
                                                        )}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Stack>
                            </Box>

                            {/* HOSPITAL NOTICE */}
                            {form.role ===
                                "hospital" && (
                                <Alert
                                    icon={
                                        <LocalHospitalOutlined />
                                    }
                                    severity="info"
                                    sx={{
                                        mt: 4,
                                        borderRadius: 3,
                                        bgcolor:
                                            COLORS.primarySoft,
                                        color:
                                            COLORS.primaryDark,
                                        border: `1px solid ${COLORS.border}`,
                                        "& .MuiAlert-icon": {
                                            color:
                                                COLORS.primary,
                                        },
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontWeight: 800,
                                            fontSize: 13,
                                            mb: 0.4,
                                        }}
                                    >
                                        Hospital registration
                                    </Typography>

                                    <Typography
                                        sx={{
                                            fontSize: 13,
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        Your hospital account
                                        will be created in{" "}
                                        <strong>
                                            Pending
                                        </strong>{" "}
                                        status and must be
                                        approved by the
                                        administrator before
                                        you can sign in.
                                    </Typography>
                                </Alert>
                            )}

                            {/* TERMS */}
                            <Box sx={{ mt: 3 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={
                                                agreeTerms
                                            }
                                            onChange={(
                                                event
                                            ) => {
                                                setAgreeTerms(
                                                    event
                                                        .target
                                                        .checked
                                                );

                                                setErrors(
                                                    (
                                                        previous
                                                    ) => ({
                                                        ...previous,
                                                        terms: "",
                                                    })
                                                );
                                            }}
                                            sx={{
                                                color:
                                                    COLORS.primary,
                                                "&.Mui-checked":
                                                    {
                                                        color:
                                                            COLORS.primary,
                                                    },
                                            }}
                                        />
                                    }
                                    label={
                                        <Typography
                                            sx={{
                                                fontSize: 13,
                                                color:
                                                    COLORS.muted,
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            I agree to use
                                            SmartCare
                                            responsibly and
                                            provide accurate
                                            account
                                            information.
                                        </Typography>
                                    }
                                />

                                {errors.terms && (
                                    <Typography
                                        sx={{
                                            ml: 1.5,
                                            mt: -0.5,
                                            fontSize: 12,
                                            color:
                                                COLORS.danger,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {errors.terms}
                                    </Typography>
                                )}
                            </Box>

                            {/* ERROR MESSAGE */}
                            {message && (
                                <Alert
                                    severity="error"
                                    sx={{
                                        mt: 3,
                                        borderRadius: 3,
                                    }}
                                >
                                    {message}
                                </Alert>
                            )}

                            {/* SUBMIT */}
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading}
                                endIcon={
                                    !loading && (
                                        <ArrowForward />
                                    )
                                }
                                sx={{
                                    mt: 3,
                                    py: 1.5,
                                    borderRadius: 3,
                                    bgcolor:
                                        COLORS.primary,
                                    color: "#fff",
                                    fontSize: 15,
                                    fontWeight: 800,
                                    textTransform: "none",
                                    boxShadow: "none",
                                    "&:hover": {
                                        bgcolor:
                                            COLORS.primaryDark,
                                        boxShadow:
                                            "0 8px 24px rgba(43,92,82,.18)",
                                    },
                                    "&.Mui-disabled": {
                                        bgcolor:
                                            COLORS.primary,
                                        color: "#fff",
                                        opacity: 0.7,
                                    },
                                }}
                            >
                                {loading ? (
                                    <Stack
                                        direction="row"
                                        spacing={1.2}
                                        alignItems="center"
                                    >
                                        <CircularProgress
                                            size={20}
                                            sx={{
                                                color: "#fff",
                                            }}
                                        />

                                        <span>
                                            Creating account...
                                        </span>
                                    </Stack>
                                ) : (
                                    "Create account"
                                )}
                            </Button>

                            {/* LOGIN LINK */}
                            <Typography
                                sx={{
                                    mt: 3,
                                    textAlign: "center",
                                    fontSize: 14,
                                    color: COLORS.muted,
                                }}
                            >
                                Already have an account?{" "}
                                <Box
                                    component="button"
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            "/login"
                                        )
                                    }
                                    sx={{
                                        border: 0,
                                        p: 0,
                                        bgcolor:
                                            "transparent",
                                        color:
                                            COLORS.primary,
                                        cursor: "pointer",
                                        fontWeight: 800,
                                        fontFamily:
                                            "inherit",
                                        fontSize:
                                            "inherit",
                                        "&:hover": {
                                            textDecoration:
                                                "underline",
                                        },
                                    }}
                                >
                                    Sign in
                                </Box>
                            </Typography>
                        </Box>
                    )}
                </Card>

                {/* TRUST NOTE */}
                {!success && (
                    <Stack
                        direction="row"
                        justifyContent="center"
                        alignItems="center"
                        spacing={1}
                        sx={{
                            mt: 3,
                            color: COLORS.muted,
                        }}
                    >
                        <ShieldOutlined
                            sx={{ fontSize: 18 }}
                        />

                        <Typography
                            sx={{
                                fontSize: 12,
                            }}
                        >
                            Your account details are
                            protected by SmartCare.
                        </Typography>
                    </Stack>
                )}
            </Container>

            <Footer />
        </Box>
    );
}

/* ---------------------------------------------------------
   ROLE CARD
--------------------------------------------------------- */

function RoleCard({
    selected,
    icon,
    title,
    description,
    onClick,
}) {
    return (
        <Box
            component="button"
            type="button"
            onClick={onClick}
            sx={{
                width: "100%",
                textAlign: "left",
                border: `1.5px solid ${
                    selected
                        ? COLORS.primary
                        : COLORS.border
                }`,
                bgcolor: selected
                    ? COLORS.primarySoft
                    : "#fff",
                borderRadius: 3,
                p: 2,
                cursor: "pointer",
                transition:
                    "all .18s ease",
                fontFamily: "inherit",
                position: "relative",
                "&:hover": {
                    borderColor:
                        COLORS.primary,
                    transform:
                        "translateY(-1px)",
                },
                "&:focus-visible": {
                    outline: `2px solid ${COLORS.primary}`,
                    outlineOffset: 2,
                },
            }}
        >
            <Stack
                direction="row"
                spacing={1.4}
                alignItems="flex-start"
            >
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        flexShrink: 0,
                        borderRadius: 2.5,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: selected
                            ? COLORS.primary
                            : "#EEF2EE",
                        color: selected
                            ? "#fff"
                            : COLORS.primary,
                    }}
                >
                    {icon}
                </Box>

                <Box sx={{ pr: 3 }}>
                    <Typography
                        sx={{
                            fontWeight: 800,
                            color: COLORS.ink,
                            fontSize: 15,
                        }}
                    >
                        {title}
                    </Typography>

                    <Typography
                        sx={{
                            mt: 0.5,
                            color: COLORS.muted,
                            fontSize: 12.5,
                            lineHeight: 1.55,
                        }}
                    >
                        {description}
                    </Typography>
                </Box>

                {selected && (
                    <CheckCircle
                        sx={{
                            position:
                                "absolute",
                            right: 14,
                            top: 14,
                            fontSize: 20,
                            color:
                                COLORS.primary,
                        }}
                    />
                )}
            </Stack>
        </Box>
    );
}

/* ---------------------------------------------------------
   SECTION TITLE
--------------------------------------------------------- */

function SectionTitle({ number, title }) {
    return (
        <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ mb: 2.2 }}
        >
            <Box
                sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 2,
                    bgcolor: COLORS.primary,
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0.5,
                }}
            >
                {number}
            </Box>

            <Typography
                sx={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: COLORS.ink,
                }}
            >
                {title}
            </Typography>
        </Stack>
    );
}


function SuccessView({
    role,
    message,
    onLogin,
    onCreateAnother,
}) {
    const hospital = role === "hospital";

    return (
        <Box
            sx={{
                px: {
                    xs: 2.5,
                    sm: 5,
                },
                py: {
                    xs: 6,
                    sm: 8,
                },
                textAlign: "center",
            }}
        >
            <Box
                sx={{
                    width: 76,
                    height: 76,
                    mx: "auto",
                    mb: 3,
                    borderRadius: "50%",
                    bgcolor:
                        COLORS.successSoft,
                    color: COLORS.success,
                    display: "grid",
                    placeItems: "center",
                }}
            >
                <CheckCircle
                    sx={{
                        fontSize: 48,
                    }}
                />
            </Box>

            <Typography
                sx={{
                    fontSize: {
                        xs: 29,
                        sm: 38,
                    },
                    fontWeight: 800,
                    color: COLORS.ink,
                    letterSpacing:
                        "-0.035em",
                }}
            >
                Account created
            </Typography>

            <Typography
                sx={{
                    mt: 1.5,
                    maxWidth: 560,
                    mx: "auto",
                    color: COLORS.muted,
                    lineHeight: 1.75,
                    fontSize: 14,
                }}
            >
                {message}
            </Typography>

            {hospital && (
                <Box
                    sx={{
                        mt: 3.5,
                        p: 2.5,
                        textAlign: "left",
                        borderRadius: 3,
                        bgcolor: "rgba(214,138,60,0.08)",
                        border: "1px solid rgba(214,138,60,0.3)",
                    }}
                >
                    <Typography fontWeight={800} fontSize={15} color="#B96F26" sx={{ mb: 0.8 }}>
                        Hospital Registration Pending Admin Approval
                    </Typography>
                    <Typography fontSize={13.5} color={COLORS.ink} lineHeight={1.6}>
                        • An acknowledgment email has been dispatched to your registered address.<br />
                        • System administrators have received an intake alert to review your facility credentials.<br />
                        • You will receive an official approval email once your account is verified.<br />
                        • <strong>Please note:</strong> You will only be able to log in after administrative approval.
                    </Typography>
                </Box>
            )}

            <Stack
                direction={{
                    xs: "column",
                    sm: "row",
                }}
                spacing={1.5}
                justifyContent="center"
                sx={{ mt: 4 }}
            >
                <Button
                    variant="contained"
                    endIcon={<ArrowForward />}
                    onClick={onLogin}
                    sx={{
                        minWidth: 190,
                        py: 1.3,
                        borderRadius: 3,
                        bgcolor:
                            COLORS.primary,
                        textTransform: "none",
                        fontWeight: 800,
                        boxShadow: "none",
                        "&:hover": {
                            bgcolor:
                                COLORS.primaryDark,
                        },
                    }}
                >
                    Go to sign in
                </Button>

                <Button
                    variant="outlined"
                    onClick={onCreateAnother}
                    sx={{
                        minWidth: 190,
                        py: 1.3,
                        borderRadius: 3,
                        borderColor:
                            COLORS.border,
                        color: COLORS.ink,
                        textTransform: "none",
                        fontWeight: 800,
                        "&:hover": {
                            borderColor:
                                COLORS.primary,
                            bgcolor:
                                COLORS.primarySoft,
                        },
                    }}
                >
                    Create another account
                </Button>
            </Stack>
        </Box>
    );
}

export default Register;