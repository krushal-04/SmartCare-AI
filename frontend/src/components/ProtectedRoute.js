import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    Stack,
    Container,
    Alert,
} from "@mui/material";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";

export default function ProtectedRoute({ children, role }) {
    const location = useLocation();
    const { token, user, isAuthenticated, logout } = useAuth();

    if (!isAuthenticated || !token || !user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location.pathname + location.search,
                }}
            />
        );
    }

    // Role verification
    if (role && user.role !== role) {
        const dashboard =
            user.role === "admin"
                ? "/admin"
                : user.role === "hospital"
                ? "/hospital"
                : "/patient";

        return <Navigate to={dashboard} replace />;
    }

    // Hospital Approval Gate: Only Approved hospitals can enter
    if (user.role === "hospital") {
        const isApproved = user.isApproved === true && user.status === "Approved";
        const isRejected = user.status === "Rejected";

        if (!isApproved) {
            return (
                <Box
                    sx={{
                        minHeight: "100vh",
                        bgcolor: "#F4F7F8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 3,
                    }}
                >
                    <Container maxWidth="sm">
                        <Card
                            elevation={0}
                            sx={{
                                borderRadius: 4,
                                border: "1px solid",
                                borderColor: isRejected ? "error.light" : "warning.light",
                                p: { xs: 2, sm: 4 },
                                textAlign: "center",
                                bgcolor: "background.paper",
                                boxShadow: "0 20px 40px rgba(15,82,75,0.06)",
                            }}
                        >
                            <CardContent>
                                <Box
                                    sx={{
                                        width: 72,
                                        height: 72,
                                        borderRadius: "50%",
                                        bgcolor: isRejected ? "rgba(211,47,47,0.1)" : "rgba(237,108,2,0.1)",
                                        color: isRejected ? "error.main" : "warning.main",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        mx: "auto",
                                        mb: 3,
                                    }}
                                >
                                    {isRejected ? (
                                        <BlockRoundedIcon sx={{ fontSize: 38 }} />
                                    ) : (
                                        <HourglassEmptyRoundedIcon sx={{ fontSize: 38 }} />
                                    )}
                                </Box>

                                <Chip
                                    label={isRejected ? "Registration Rejected" : "Pending Administrative Review"}
                                    color={isRejected ? "error" : "warning"}
                                    sx={{ fontWeight: 800, mb: 2, px: 1 }}
                                />

                                <Typography variant="h5" fontWeight={900} gutterBottom>
                                    {isRejected
                                        ? "Hospital Account Not Approved"
                                        : "Approval in Progress"}
                                </Typography>

                                <Typography color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                                    {isRejected
                                        ? "Your hospital registration has been reviewed and declined by the SmartCare AI administration."
                                        : `Welcome, ${user.fullName}. Your hospital registration was received and is currently being verified by our administration team. Protected operational features will unlock once your account is verified.`}
                                </Typography>

                                {isRejected && user.rejectionReason && (
                                    <Alert severity="error" sx={{ mb: 3, textAlign: "left", borderRadius: 3 }}>
                                        <Typography fontWeight={700} fontSize={13}>
                                            Reason provided by Administrator:
                                        </Typography>
                                        <Typography fontSize={14} mt={0.5}>
                                            {user.rejectionReason}
                                        </Typography>
                                    </Alert>
                                )}

                                {!isRejected && (
                                    <Alert severity="info" sx={{ mb: 3, textAlign: "left", borderRadius: 3 }}>
                                        <Typography fontSize={13}>
                                            You will receive an email confirmation at <strong>{user.email}</strong> once your account is approved.
                                        </Typography>
                                    </Alert>
                                )}

                                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
                                    <Button
                                        variant="outlined"
                                        color="inherit"
                                        startIcon={<LogoutRoundedIcon />}
                                        onClick={logout}
                                        sx={{ borderRadius: 3, textTransform: "none", fontWeight: 700 }}
                                    >
                                        Log Out
                                    </Button>

                                    <Button
                                        variant="contained"
                                        startIcon={<EmailOutlinedIcon />}
                                        href="mailto:support@smartcare.ai"
                                        sx={{ borderRadius: 3, textTransform: "none", fontWeight: 700 }}
                                    >
                                        Contact Administration
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Container>
                </Box>
            );
        }
    }

    return children;
}