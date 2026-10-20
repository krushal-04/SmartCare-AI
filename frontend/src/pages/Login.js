import { useEffect, useState } from "react";
import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Divider,
    InputAdornment,
    IconButton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import {
    ArrowBack,
    ArrowForward,
    EmailOutlined,
    LockOutlined,
    LocalHospitalOutlined,
    Visibility,
    VisibilityOff,
    VerifiedUserOutlined,
} from "@mui/icons-material";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const getDashboardPath = (role) => {
    switch (role) {
        case "admin":
            return "/admin";

        case "hospital":
            return "/hospital";

        case "patient":
        default:
            return "/patient";
    }
};

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated, user } = useAuth();

    useEffect(() => {
        if (isAuthenticated && user?.role) {
            const requestedPath = location.state?.from;
            const validReturnPath =
                typeof requestedPath === "string" &&
                (
                    requestedPath.startsWith(`/${user.role}`) ||
                    (user.role === "patient" && (requestedPath.startsWith("/book-appointment") || requestedPath.startsWith("/doctor/")))
                );

            navigate(validReturnPath ? requestedPath : getDashboardPath(user.role), {
                replace: true,
            });
        }
    }, [isAuthenticated, user, navigate, location.state]);

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [showPassword, setShowPassword] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [fieldErrors, setFieldErrors] =
        useState({
            email: "",
            password: "",
        });

    useEffect(() => {
        const token =
            localStorage.getItem("token");

        const storedUser =
            localStorage.getItem("user");

        if (!token || !storedUser) {
            return;
        }

        try {
            const user =
                JSON.parse(storedUser);

            if (user?.role) {
                navigate(
                    getDashboardPath(
                        user.role
                    ),
                    {
                        replace: true,
                    }
                );
            }
        } catch {
            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "user"
            );
        }
    }, [navigate]);

    const validateForm = () => {
        const errors = {
            email: "",
            password: "",
        };

        const email =
            form.email.trim();

        if (!email) {
            errors.email =
                "Email address is required.";
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                email
            )
        ) {
            errors.email =
                "Enter a valid email address.";
        }

        if (!form.password) {
            errors.password =
                "Password is required.";
        }

        setFieldErrors(errors);

        return (
            !errors.email &&
            !errors.password
        );
    };

    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));

        setMessage("");

        setFieldErrors((previous) => ({
            ...previous,
            [name]: "",
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");

        const valid =
            validateForm();

        if (!valid) {
            return;
        }

        setLoading(true);

        try {
            const response =
                await api.post(
                    "/auth/login",
                    {
                        email:
                            form.email
                                .trim()
                                .toLowerCase(),

                        password:
                            form.password,
                    }
                );

            const token =
                response.data?.token;

            const user =
                response.data?.user;

            if (!token || !user) {
                throw new Error(
                    "Invalid login response."
                );
            }

            login(token, user);

            /*
             * Always use the server-provided
             * role for navigation.
             */
            /*
             * Always navigate user directly to their role dashboard:
             * Patient -> /patient
             * Hospital -> /hospital
             * Admin -> /admin
             * Never redirect back to old doctor or hospital public pages.
             */
            const dashboard = getDashboardPath(user.role);
            navigate(dashboard, { replace: true });
        } catch (error) {
            /*
             * Do not leave stale authentication
             * data after a failed login.
             */
            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "user"
            );

            const apiMessage =
                error.response?.data
                    ?.message;

            setMessage(
                apiMessage ||
                    "Unable to sign in. Please check your email and password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: "#F5FAFB",
            }}
        >
            <Navbar />

            <Container
                maxWidth="lg"
                sx={{
                    py: {
                        xs: 4,
                        sm: 6,
                        md: 8,
                    },
                }}
            >
                <Box
                    sx={{
                        maxWidth: 1050,
                        mx: "auto",

                        display: "grid",

                        gridTemplateColumns: {
                            xs: "1fr",
                            md: "0.95fr 1.05fr",
                        },

                        gap: {
                            xs: 2,
                            md: 3,
                        },
                    }}
                >
                    {/* LEFT PANEL */}
                    <Card
                        elevation={0}
                        sx={{
                            display: {
                                xs: "none",
                                md: "block",
                            },

                            minHeight: 640,

                            borderRadius: 5,

                            overflow: "hidden",

                            bgcolor:
                                "#102F42",

                            color: "#fff",

                            position:
                                "relative",
                        }}
                    >
                        <Box
                            sx={{
                                position:
                                    "absolute",

                                width: 220,
                                height: 220,

                                borderRadius:
                                    "50%",

                                background:
                                    "rgba(113,233,223,.09)",

                                right: -70,
                                top: -70,
                            }}
                        />

                        <Box
                            sx={{
                                position:
                                    "absolute",

                                width: 160,
                                height: 160,

                                borderRadius:
                                    "50%",

                                background:
                                    "rgba(240,198,106,.07)",

                                left: -60,
                                bottom: -50,
                            }}
                        />

                        <CardContent
                            sx={{
                                p: 4,
                                height: "100%",

                                position:
                                    "relative",

                                display: "flex",
                                flexDirection:
                                    "column",
                            }}
                        >
                            <Stack
                                direction="row"
                                spacing={1.5}
                                alignItems="center"
                            >
                                <Box
                                    sx={{
                                        width: 52,
                                        height: 52,

                                        borderRadius: 3,

                                        display:
                                            "grid",

                                        placeItems:
                                            "center",

                                        bgcolor:
                                            "#71E9DF",

                                        color:
                                            "#102F42",
                                    }}
                                >
                                    <LocalHospitalOutlined />
                                </Box>

                                <Box>
                                    <Typography
                                        fontSize={
                                            23
                                        }
                                        fontWeight={
                                            900
                                        }
                                    >
                                        SmartCare
                                    </Typography>

                                    <Typography
                                        fontSize={
                                            9
                                        }
                                        letterSpacing={
                                            2
                                        }
                                        fontWeight={
                                            800
                                        }
                                        color="#71E9DF"
                                    >
                                        HEALTHCARE
                                        PLATFORM
                                    </Typography>
                                </Box>
                            </Stack>

                            <Box
                                sx={{
                                    mt: "auto",
                                    mb: "auto",
                                }}
                            >
                                <Typography
                                    fontSize={{
                                        md: 48,
                                        lg: 54,
                                    }}
                                    fontWeight={900}
                                    lineHeight={
                                        1.02
                                    }
                                    letterSpacing={
                                        "-0.04em"
                                    }
                                >
                                    Welcome
                                    <br />
                                    back.
                                </Typography>

                                <Typography
                                    mt={3}
                                    maxWidth={410}
                                    color="rgba(255,255,255,.68)"
                                    lineHeight={
                                        1.85
                                    }
                                    fontSize={15}
                                >
                                    Sign in to manage
                                    appointments,
                                    healthcare records,
                                    emergency assistance
                                    and your SmartCare
                                    account from one
                                    connected platform.
                                </Typography>

                                <Stack
                                    spacing={
                                        1.5
                                    }
                                    mt={4}
                                >
                                    <Stack
                                        direction="row"
                                        spacing={
                                            1
                                        }
                                        alignItems="center"
                                    >
                                        <VerifiedUserOutlined
                                            sx={{
                                                color:
                                                    "#71E9DF",
                                                fontSize: 21,
                                            }}
                                        />

                                        <Typography
                                            fontSize={
                                                13
                                            }
                                            color="rgba(255,255,255,.72)"
                                        >
                                            Secure
                                            role-based
                                            access
                                        </Typography>
                                    </Stack>

                                    <Stack
                                        direction="row"
                                        spacing={
                                            1
                                        }
                                        alignItems="center"
                                    >
                                        <VerifiedUserOutlined
                                            sx={{
                                                color:
                                                    "#71E9DF",
                                                fontSize: 21,
                                            }}
                                        />

                                        <Typography
                                            fontSize={
                                                13
                                            }
                                            color="rgba(255,255,255,.72)"
                                        >
                                            Patient,
                                            hospital and
                                            admin accounts
                                        </Typography>
                                    </Stack>

                                    <Stack
                                        direction="row"
                                        spacing={
                                            1
                                        }
                                        alignItems="center"
                                    >
                                        <VerifiedUserOutlined
                                            sx={{
                                                color:
                                                    "#71E9DF",
                                                fontSize: 21,
                                            }}
                                        />

                                        <Typography
                                            fontSize={
                                                13
                                            }
                                            color="rgba(255,255,255,.72)"
                                        >
                                            Connected
                                            healthcare
                                            services
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Box>

                            <Typography
                                fontSize={11}
                                color="rgba(255,255,255,.35)"
                            >
                                SmartCare AI · Healthcare
                                Management Platform
                            </Typography>
                        </CardContent>
                    </Card>

                    {/* LOGIN PANEL */}
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 5,

                            bgcolor: "#fff",

                            border:
                                "1px solid #E0ECEF",

                            overflow:
                                "hidden",
                        }}
                    >
                        <CardContent
                            sx={{
                                p: {
                                    xs: 2.5,
                                    sm: 3.5,
                                    md: 4.5,
                                },
                            }}
                        >
                            <Button
                                startIcon={
                                    <ArrowBack />
                                }
                                onClick={() =>
                                    navigate(
                                        "/"
                                    )
                                }
                                sx={{
                                    px: 0,
                                    color:
                                        "text.secondary",
                                    fontWeight: 700,
                                }}
                            >
                                Back to Home
                            </Button>

                            <Box
                                sx={{
                                    mt: 4,
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: {
                                            xs: 34,
                                            sm: 40,
                                            md: 45,
                                        },

                                        lineHeight:
                                            1.05,

                                        fontWeight:
                                            900,

                                        letterSpacing:
                                            "-0.04em",

                                        color:
                                            "#102F42",
                                    }}
                                >
                                    Sign in
                                </Typography>

                                <Typography
                                    color="text.secondary"
                                    mt={1}
                                    fontSize={14.5}
                                >
                                    Access your
                                    SmartCare
                                    account and
                                    continue your
                                    healthcare
                                    journey.
                                </Typography>
                            </Box>

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

                            <Box
                                component="form"
                                onSubmit={
                                    handleSubmit
                                }
                                noValidate
                                sx={{
                                    mt: 3,
                                }}
                            >
                                <TextField
                                    fullWidth
                                    label="Email address"
                                    name="email"
                                    type="email"
                                    value={
                                        form.email
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    error={
                                        Boolean(
                                            fieldErrors.email
                                        )
                                    }
                                    helperText={
                                        fieldErrors.email
                                    }
                                    autoComplete="email"
                                    autoFocus
                                    disabled={
                                        loading
                                    }
                                    InputProps={{
                                        startAdornment:
                                            (
                                                <InputAdornment position="start">
                                                    <EmailOutlined
                                                        sx={{
                                                            color:
                                                                "#0B8793",
                                                        }}
                                                    />
                                                </InputAdornment>
                                            ),
                                    }}
                                    sx={{
                                        mb: 2.2,

                                        "& .MuiOutlinedInput-root":
                                            {
                                                borderRadius: 3,

                                                "&.Mui-focused fieldset":
                                                    {
                                                        borderColor:
                                                            "#0B8793",
                                                        borderWidth:
                                                            2,
                                                    },
                                            },
                                    }}
                                />

                                <TextField
                                    fullWidth
                                    label="Password"
                                    name="password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={
                                        form.password
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    error={
                                        Boolean(
                                            fieldErrors.password
                                        )
                                    }
                                    helperText={
                                        fieldErrors.password
                                    }
                                    autoComplete="current-password"
                                    disabled={
                                        loading
                                    }
                                    InputProps={{
                                        startAdornment:
                                            (
                                                <InputAdornment position="start">
                                                    <LockOutlined
                                                        sx={{
                                                            color:
                                                                "#0B8793",
                                                        }}
                                                    />
                                                </InputAdornment>
                                            ),

                                        endAdornment:
                                            (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        type="button"
                                                        edge="end"
                                                        onClick={() =>
                                                            setShowPassword(
                                                                (
                                                                    previous
                                                                ) =>
                                                                    !previous
                                                            )
                                                        }
                                                        disabled={
                                                            loading
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
                                    sx={{
                                        mb: 1,

                                        "& .MuiOutlinedInput-root":
                                            {
                                                borderRadius: 3,

                                                "&.Mui-focused fieldset":
                                                    {
                                                        borderColor:
                                                            "#0B8793",
                                                        borderWidth:
                                                            2,
                                                    },
                                            },
                                    }}
                                />

                                <Button
                                    fullWidth
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    disabled={
                                        loading
                                    }
                                    endIcon={
                                        !loading ? (
                                            <ArrowForward />
                                        ) : null
                                    }
                                    sx={{
                                        mt: 2,

                                        py: 1.65,

                                        borderRadius: 3,

                                        bgcolor:
                                            "#0B8793",

                                        fontWeight:
                                            800,

                                        fontSize:
                                            15,

                                        textTransform:
                                            "none",

                                        boxShadow:
                                            "none",

                                        "&:hover":
                                            {
                                                bgcolor:
                                                    "#086F79",
                                                boxShadow:
                                                    "0 10px 25px rgba(11,135,147,.22)",
                                            },
                                    }}
                                >
                                    {loading
                                        ? "Signing in..."
                                        : "Sign In"}
                                </Button>
                            </Box>

                            <Divider
                                sx={{
                                    my: 3.5,
                                }}
                            />

                            <Box
                                sx={{
                                    textAlign:
                                        "center",
                                }}
                            >
                                <Typography
                                    color="text.secondary"
                                    fontSize={14}
                                >
                                    Don't have an
                                    account?
                                </Typography>

                                <Button
                                    onClick={() =>
                                        navigate(
                                            "/register"
                                        )
                                    }
                                    endIcon={
                                        <ArrowForward />
                                    }
                                    sx={{
                                        mt: 0.5,
                                        fontWeight: 800,
                                        textTransform:
                                            "none",
                                    }}
                                >
                                    Create an
                                    account
                                </Button>
                            </Box>

                            <Box
                                sx={{
                                    mt: 3,
                                    p: 2,
                                    borderRadius: 3,
                                    bgcolor:
                                        "#F5FAFB",
                                    border:
                                        "1px solid #E5EFF1",
                                }}
                            >
                                <Typography
                                    fontSize={12}
                                    color="text.secondary"
                                    lineHeight={
                                        1.7
                                    }
                                >
                                    Your dashboard is
                                    selected automatically
                                    according to your
                                    registered account
                                    role.
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Container>

            <Footer />
        </Box>
    );
}

export default Login;