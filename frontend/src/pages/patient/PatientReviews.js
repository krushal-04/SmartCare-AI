import { useEffect, useState } from "react";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Rating,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import {
    RateReviewOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../services/api";

export default function PatientReviews() {
    const [
        appointments,
        setAppointments,
    ] = useState([]);

    const [
        reviews,
        setReviews,
    ] = useState([]);

    const [selectedId, setSelectedId] =
        useState("");

    const [rating, setRating] =
        useState(0);

    const [comment, setComment] =
        useState("");

    const [error, setError] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [
        submitting,
        setSubmitting,
    ] = useState(false);

    const loadData =
        async () => {
            try {
                const [
                    eligibleResponse,
                    reviewResponse,
                ] =
                    await Promise.all([
                        api.get(
                            "/reviews/eligible"
                        ),
                        api.get(
                            "/reviews/my"
                        ),
                    ]);

                setAppointments(
                    eligibleResponse
                        .data
                        .appointments ||
                        []
                );

                setReviews(
                    reviewResponse
                        .data
                        .reviews ||
                        []
                );
            } catch (err) {
                setError(
                    err.response?.data
                        ?.message ||
                        "Unable to load reviews."
                );
            }
        };

    useEffect(() => {
        loadData();
    }, []);

    const submitReview =
        async () => {
            try {
                setSubmitting(true);
                setError("");
                setMessage("");

                if (!selectedId) {
                    setError(
                        "Select a completed appointment."
                    );
                    return;
                }

                if (!rating) {
                    setError(
                        "Please select a rating."
                    );
                    return;
                }

                await api.post(
                    "/reviews",
                    {
                        appointmentId:
                            selectedId,
                        rating,
                        comment,
                    }
                );

                setMessage(
                    "Review submitted successfully."
                );

                setSelectedId("");
                setRating(0);
                setComment("");

                loadData();
            } catch (err) {
                setError(
                    err.response?.data
                        ?.message ||
                        "Unable to submit review."
                );
            } finally {
                setSubmitting(
                    false
                );
            }
        };

    return (
        <DashboardLayout
            role="patient"
            title="Reviews & Ratings"
            subtitle="Share your healthcare experience"
        >
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                >
                    {error}
                </Alert>
            )}

            {message && (
                <Alert
                    severity="success"
                    sx={{ mb: 2 }}
                >
                    {message}
                </Alert>
            )}

            <Card
                elevation={0}
                sx={{
                    mb: 3,
                    border:
                        "1px solid #E3EBEE",
                    borderRadius: 4,
                }}
            >
                <CardContent sx={{ p: 3 }}>
                    <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                    >
                        <RateReviewOutlined
                            sx={{
                                color:
                                    "#0B8793",
                                fontSize:
                                    40,
                            }}
                        />

                        <Typography
                            fontSize={23}
                            fontWeight={900}
                        >
                            Leave a Review
                        </Typography>
                    </Stack>

                    {appointments.length ===
                    0 ? (
                        <Typography
                            color="text.secondary"
                            mt={2}
                        >
                            Reviews become
                            available after a
                            completed appointment.
                        </Typography>
                    ) : (
                        <>
                            <Typography
                                fontWeight={700}
                                mt={3}
                                mb={1}
                            >
                                Select completed
                                appointment
                            </Typography>

                            <Stack
                                spacing={1}
                            >
                                {appointments.map(
                                    (
                                        appointment
                                    ) => (
                                        <Button
                                            key={
                                                appointment._id
                                            }
                                            variant={
                                                selectedId ===
                                                appointment._id
                                                    ? "contained"
                                                    : "outlined"
                                            }
                                            onClick={() =>
                                                setSelectedId(
                                                    appointment._id
                                                )
                                            }
                                            sx={{
                                                justifyContent:
                                                    "flex-start",
                                                textTransform:
                                                    "none",
                                            }}
                                        >
                                            {
                                                appointment
                                                    .doctorId
                                                    ?.doctorName
                                            }{" "}
                                            —{" "}
                                            {
                                                appointment
                                                    .hospitalId
                                                    ?.hospitalName
                                            }
                                        </Button>
                                    )
                                )}
                            </Stack>

                            <Box mt={3}>
                                <Typography
                                    fontWeight={
                                        700
                                    }
                                    mb={1}
                                >
                                    Rating
                                </Typography>

                                <Rating
                                    value={
                                        rating
                                    }
                                    onChange={(
                                        _,
                                        value
                                    ) =>
                                        setRating(
                                            value ||
                                                0
                                        )
                                    }
                                    size="large"
                                />
                            </Box>

                            <TextField
                                fullWidth
                                multiline
                                minRows={4}
                                label="Your comments"
                                value={
                                    comment
                                }
                                onChange={(e) =>
                                    setComment(
                                        e
                                            .target
                                            .value
                                    )
                                }
                                sx={{ mt: 2 }}
                            />

                            <Button
                                variant="contained"
                                onClick={
                                    submitReview
                                }
                                disabled={
                                    submitting ||
                                    !selectedId ||
                                    !rating
                                }
                                sx={{
                                    mt: 2,
                                }}
                            >
                                {submitting
                                    ? "Submitting..."
                                    : "Submit Review"}
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>

            <Typography
                fontSize={23}
                fontWeight={900}
                mb={2}
            >
                My Reviews
            </Typography>

            {reviews.length === 0 ? (
                <Card
                    elevation={0}
                    sx={{
                        border:
                            "1px solid #E3EBEE",
                        borderRadius: 4,
                    }}
                >
                    <CardContent>
                        <Typography color="text.secondary">
                            You have not submitted
                            any reviews yet.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                reviews.map(
                    (review) => (
                        <Card
                            key={
                                review._id
                            }
                            elevation={0}
                            sx={{
                                mb: 2,
                                border:
                                    "1px solid #E3EBEE",
                                borderRadius: 4,
                            }}
                        >
                            <CardContent>
                                <Typography
                                    fontWeight={
                                        900
                                    }
                                >
                                    {
                                        review
                                            .hospitalId
                                            ?.hospitalName
                                    }
                                </Typography>

                                <Rating
                                    value={
                                        review.rating
                                    }
                                    readOnly
                                />

                                <Typography
                                    color="text.secondary"
                                    mt={1}
                                >
                                    {
                                        review.comment
                                    }
                                </Typography>
                            </CardContent>
                        </Card>
                    )
                )
            )}
        </DashboardLayout>
    );
}