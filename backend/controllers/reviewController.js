const Appointment = require("../models/Appointment");
const Review = require("../models/Review");
const Hospital = require("../models/Hospital");
const Notification = require("../models/Notification");

exports.getEligibleAppointments =
    async (req, res) => {
        try {
            const reviewedAppointments =
                await Review.find({
                    patientId:
                        req.user._id,
                }).select(
                    "appointmentId"
                );

            const reviewedIds =
                reviewedAppointments.map(
                    (item) =>
                        item.appointmentId
                );

            const appointments =
                await Appointment.find({
                    patientId:
                        req.user._id,

                    status: "Completed",

                    _id: {
                        $nin:
                            reviewedIds,
                    },
                })
                    .sort({
                        appointmentDate:
                            -1,
                    })
                    .populate(
                        "hospitalId",
                        "hospitalName city"
                    )
                    .populate(
                        "doctorId",
                        "doctorName specialization"
                    )
                    .lean();

            res.status(200).json({
                success: true,
                appointments,
            });
        } catch (error) {
            console.error(
                "getEligibleAppointments:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load eligible reviews.",
            });
        }
    };

exports.createReview =
    async (req, res) => {
        try {
            const {
                appointmentId,
                rating,
                comment,
            } = req.body;

            const numericRating =
                Number(rating);

            if (
                !appointmentId ||
                !numericRating ||
                numericRating < 1 ||
                numericRating > 5
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Valid appointment and rating are required.",
                });
            }

            const appointment =
                await Appointment.findOne(
                    {
                        _id:
                            appointmentId,
                        patientId:
                            req.user._id,
                        status:
                            "Completed",
                    }
                ).populate(
                    "hospitalId",
                    "hospitalName userId"
                );

            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Only completed appointments can be reviewed.",
                });
            }

            const existing =
                await Review.findOne({
                    appointmentId,
                    patientId:
                        req.user._id,
                });

            if (existing) {
                return res.status(409).json({
                    success: false,
                    message:
                        "You have already reviewed this appointment.",
                });
            }

            const review =
                await Review.create({
                    patientId:
                        req.user._id,
                    hospitalId:
                        appointment.hospitalId
                            ._id,
                    doctorId:
                        appointment.doctorId,
                    appointmentId,
                    rating:
                        numericRating,
                    comment:
                        comment?.trim() ||
                        "",
                });

            const ratings =
                await Review.find({
                    hospitalId:
                        appointment
                            .hospitalId
                            ._id,
                }).select(
                    "rating"
                );

            const average =
                ratings.length
                    ? ratings.reduce(
                          (
                              total,
                              item
                          ) =>
                              total +
                              item.rating,
                          0
                      ) /
                      ratings.length
                    : 0;

            await Hospital.findByIdAndUpdate(
                appointment
                    .hospitalId
                    ._id,
                {
                    rating:
                        Number(
                            average.toFixed(
                                1
                            )
                        ),
                }
            );

            if (
                appointment.hospitalId
                    .userId
            ) {
                await Notification.create(
                    {
                        userId:
                            appointment
                                .hospitalId
                                .userId,
                        title:
                            "New Patient Review",
                        message:
                            "A patient has submitted a new hospital review.",
                        type: "Review",
                        relatedId:
                            review._id,
                    }
                );
            }

            res.status(201).json({
                success: true,
                message:
                    "Review submitted successfully.",
                review,
            });
        } catch (error) {
            console.error(
                "createReview:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to submit review.",
            });
        }
    };

exports.getMyReviews =
    async (req, res) => {
        try {
            const reviews =
                await Review.find({
                    patientId:
                        req.user._id,
                })
                    .sort({
                        createdAt: -1,
                    })
                    .populate(
                        "hospitalId",
                        "hospitalName city"
                    )
                    .populate(
                        "doctorId",
                        "doctorName specialization"
                    )
                    .lean();

            res.status(200).json({
                success: true,
                reviews,
            });
        } catch (error) {
            console.error(
                "getMyReviews:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load reviews.",
            });
        }
    };