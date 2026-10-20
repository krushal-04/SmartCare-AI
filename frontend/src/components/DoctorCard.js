import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Stack,
    Typography,
    Avatar,
} from "@mui/material";
import {
    CalendarMonth,
    LocalHospital,
    MedicalServicesOutlined,
    WorkspacePremiumOutlined,
    VerifiedUserRounded,
} from "@mui/icons-material";

export default function DoctorCard({ doctor }) {
    const navigate = useNavigate();
    const [imgError, setImgError] = useState(false);

    if (!doctor) return null;

    const initials = doctor.doctorName
        ? doctor.doctorName
              .replace(/^Dr\.\s*/i, "")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()
        : "DR";

    const defaultMaleDoctor = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80";
    const defaultFemaleDoctor = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80";
    const fallbackDoctorImg = (doctor.gender === "Female" || (doctor.doctorName && /priya|anita|pooja|neha|sunita|dr\.\s*(priya|anita|pooja|neha)/i.test(doctor.doctorName)))
        ? defaultFemaleDoctor
        : defaultMaleDoctor;

    const displayDoctorImg = (!imgError && doctor.doctorImage && doctor.doctorImage.startsWith("http"))
        ? doctor.doctorImage
        : fallbackDoctorImg;
    const hospitalName = doctor.hospitalId?.hospitalName || (typeof doctor.hospitalId === "string" ? "" : "");
    const departmentName = doctor.departmentId?.departmentName || "";

    const handleBook = () => {
        const hospId = doctor.hospitalId?._id || doctor.hospitalId || "";
        const deptId = doctor.departmentId?._id || doctor.departmentId || "";
        const targetUrl = `/book-appointment?doctorId=${doctor._id}${hospId ? `&hospitalId=${hospId}` : ""}${deptId ? `&departmentId=${deptId}` : ""}`;
        navigate(targetUrl);
    };

    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                borderRadius: 4,
                border: "1.5px solid #E2E8F0",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                bgcolor: "#FFFFFF",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 14px 28px rgba(15, 23, 42, 0.08)",
                    borderColor: "#CBD5E1",
                },
            }}
        >
            {/* CARD TOP IMAGE OR AVATAR BANNER */}
            <Box
                sx={{
                    position: "relative",
                    height: 180,
                    bgcolor: "#F1F5F9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                }}
            >
                {displayDoctorImg ? (
                    <Box
                        component="img"
                        src={displayDoctorImg}
                        alt={doctor.doctorName}
                        onError={() => setImgError(true)}
                        sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "top center",
                        }}
                    />
                ) : (
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                            background: "linear-gradient(135deg, #0F524B 0%, #0D9488 100%)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                        }}
                    >
                        <Avatar
                            sx={{
                                width: 72,
                                height: 72,
                                bgcolor: "rgba(255, 255, 255, 0.2)",
                                color: "#FFFFFF",
                                fontSize: 24,
                                fontWeight: 800,
                                border: "2px solid rgba(255, 255, 255, 0.5)",
                                mb: 1,
                            }}
                        >
                            {initials}
                        </Avatar>
                        <Typography fontSize={11.5} fontWeight={700} sx={{ opacity: 0.9, letterSpacing: 0.5 }}>
                            SMARTCARE SPECIALIST
                        </Typography>
                    </Box>
                )}

                {/* Verified Badge */}
                <Box
                    sx={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        bgcolor: "rgba(255, 255, 255, 0.95)",
                        backdropFilter: "blur(6px)",
                        borderRadius: 2,
                        px: 1,
                        py: 0.4,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                    }}
                >
                    <VerifiedUserRounded sx={{ fontSize: 14, color: "#0D9488" }} />
                    <Typography fontSize={11} fontWeight={800} color="#0F172A">
                        Verified
                    </Typography>
                </Box>

                {/* Experience Chip */}
                {doctor.experience > 0 && (
                    <Box
                        sx={{
                            position: "absolute",
                            bottom: 10,
                            left: 10,
                            bgcolor: "rgba(15, 23, 42, 0.8)",
                            backdropFilter: "blur(4px)",
                            color: "white",
                            borderRadius: 1.5,
                            px: 1,
                            py: 0.3,
                            display: "flex",
                            alignItems: "center",
                            gap: 0.4,
                        }}
                    >
                        <WorkspacePremiumOutlined sx={{ fontSize: 13, color: "#FBBF24" }} />
                        <Typography fontSize={11} fontWeight={700}>
                            {doctor.experience}+ Yrs Exp
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* CARD CONTENT */}
            <CardContent sx={{ p: 2.5, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                <Typography
                    fontWeight={800}
                    fontSize={17}
                    color="#0F172A"
                    noWrap
                    sx={{
                        lineHeight: 1.3,
                        mb: 0.5,
                        minHeight: 24,
                    }}
                >
                    {doctor.doctorName.startsWith("Dr.") ? doctor.doctorName : `Dr. ${doctor.doctorName}`}
                </Typography>

                <Typography
                    fontSize={13}
                    fontWeight={700}
                    color="#0D9488"
                    sx={{
                        mb: 0.5,
                        minHeight: 38,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: 1.35,
                    }}
                >
                    {doctor.specialization || departmentName || "Medical Practitioner"}
                </Typography>

                <Typography fontSize={12} color="text.secondary" noWrap sx={{ mb: 1.5, minHeight: 18 }}>
                    {doctor.qualification || "MBBS"}
                </Typography>

                {/* Department & Hospital Chips */}
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2, minHeight: 52, alignItems: "flex-start" }}>
                    {departmentName && (
                        <Chip
                            size="small"
                            label={departmentName}
                            icon={<MedicalServicesOutlined sx={{ fontSize: "14px !important" }} />}
                            sx={{
                                fontWeight: 600,
                                fontSize: 11.5,
                                bgcolor: "#F0FDFA",
                                color: "#0F766E",
                                border: "1px solid #CCFBF1",
                                borderRadius: 1.5,
                            }}
                        />
                    )}
                    {hospitalName && (
                        <Chip
                            size="small"
                            variant="outlined"
                            icon={<LocalHospital sx={{ fontSize: "14px !important", color: "#0284C7" }} />}
                            label={hospitalName}
                            sx={{
                                fontWeight: 600,
                                fontSize: 11.5,
                                borderColor: "#E2E8F0",
                                color: "#334155",
                                borderRadius: 1.5,
                            }}
                        />
                    )}
                </Stack>

                {/* Consultation Fee */}
                <Box sx={{ mt: "auto", mb: 2, minHeight: 24, display: "flex", alignItems: "baseline", gap: 0.5 }}>
                    <Typography fontSize={12} color="text.secondary">
                        Consultation:
                    </Typography>
                    <Typography fontSize={15} fontWeight={800} color="#0F172A">
                        {doctor.consultationFee > 0 ? `₹${doctor.consultationFee}` : "Standard OPD"}
                    </Typography>
                </Box>

                {/* ACTIONS */}
                <Stack direction="row" spacing={1}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => navigate(`/doctor/${doctor._id}`)}
                        sx={{
                            borderColor: "#CBD5E1",
                            color: "#334155",
                            fontWeight: 700,
                            fontSize: 12.5,
                            py: 0.9,
                            borderRadius: 2.5,
                            textTransform: "none",
                            "&:hover": {
                                borderColor: "#94A3B8",
                                bgcolor: "#F8FAFC",
                            },
                        }}
                    >
                        Profile
                    </Button>

                    <Button
                        fullWidth
                        variant="contained"
                        startIcon={<CalendarMonth fontSize="small" />}
                        onClick={handleBook}
                        sx={{
                            bgcolor: "#0F524B",
                            color: "#FFFFFF",
                            fontWeight: 800,
                            fontSize: 12.5,
                            py: 0.9,
                            borderRadius: 2.5,
                            textTransform: "none",
                            boxShadow: "0 4px 12px rgba(15, 82, 75, 0.2)",
                            "&:hover": {
                                bgcolor: "#0B3C37",
                                boxShadow: "0 6px 16px rgba(15, 82, 75, 0.3)",
                            },
                        }}
                    >
                        Book
                    </Button>
                </Stack>
            </CardContent>
        </Card>
    );
}
