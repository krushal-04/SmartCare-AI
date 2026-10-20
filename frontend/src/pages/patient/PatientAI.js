import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    IconButton,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    CalendarMonth,
    ChatBubbleOutlineRounded,
    CheckCircleOutlineRounded,
    ChevronRightRounded,
    ContentCopyRounded,
    EmergencyOutlined,
    HealthAndSafetyOutlined,
    InfoOutlined,
    LocalHospitalOutlined,
    MedicalServicesOutlined,
    PsychologyOutlined,
    RefreshRounded,
    SendRounded,
    VerifiedUserOutlined,
    WarningAmberRounded,
    DoneRounded,
    MonitorHeartOutlined,
    AirOutlined,
    DirectionsWalkOutlined,
    HealingOutlined,
    AssessmentOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../services/api";
import { colors, fonts } from "../../theme/colors";

const QUICK_SYMPTOMS = [
    {
        category: "Cardiovascular",
        label: "Chest tightness & breathlessness",
        iconType: "cardio",
        severity: "emergency",
        text: "I have sudden chest tightness, shortness of breath, and discomfort radiating toward my left shoulder.",
    },
    {
        category: "Neurological",
        label: "Throbbing migraine & nausea",
        iconType: "neuro",
        severity: "prompt",
        text: "Severe throbbing migraine on one side of my head with nausea and extreme sensitivity to bright light for 2 days.",
    },
    {
        category: "Respiratory",
        label: "Persistent cough & fever",
        iconType: "respiratory",
        severity: "prompt",
        text: "High fever of 102°F for 3 days with a deep, persistent cough, chills, and fatigue.",
    },
    {
        category: "Abdominal",
        label: "Sharp lower abdominal pain",
        iconType: "abdominal",
        severity: "prompt",
        text: "Sudden sharp lower right abdominal pain with nausea, low appetite, and discomfort when walking.",
    },
    {
        category: "Orthopedic",
        label: "Swollen knee joint & stiffness",
        iconType: "ortho",
        severity: "routine",
        text: "Swollen right knee joint, tenderness when bending, and morning stiffness lasting over an hour.",
    },
    {
        category: "Dermatological",
        label: "Itchy spreading rash & hives",
        iconType: "derma",
        severity: "routine",
        text: "Red, itchy skin rash with raised welts spreading across both arms and torso after eating.",
    },
];

const renderCategoryIcon = (type) => {
    switch (type) {
        case "cardio":
            return <MonitorHeartOutlined sx={{ fontSize: 22, color: colors.brick }} />;
        case "neuro":
            return <PsychologyOutlined sx={{ fontSize: 22, color: "#7C3AED" }} />;
        case "respiratory":
            return <AirOutlined sx={{ fontSize: 22, color: colors.secondary }} />;
        case "abdominal":
            return <LocalHospitalOutlined sx={{ fontSize: 22, color: colors.amberDeep }} />;
        case "ortho":
            return <DirectionsWalkOutlined sx={{ fontSize: 22, color: colors.emerald }} />;
        case "derma":
            return <HealingOutlined sx={{ fontSize: 22, color: "#DB2777" }} />;
        default:
            return <MedicalServicesOutlined sx={{ fontSize: 22, color: colors.pine }} />;
    }
};

const CHAT_STARTERS = [
    "When does a persistent cough require medical tests?",
    "How do I distinguish between a migraine and a tension headache?",
    "What should I do first for a sprained ankle?",
    "What are early warning signs of high blood pressure?",
    "Why does acid reflux sometimes trigger chronic throat clearing or cough?",
    "What questions should I ask my doctor during a routine checkup?",
];

// Helper to format AI markdown into clean, beautiful React elements
function FormattedMessageText({ text }) {
    if (!text) return null;

    const lines = text.split("\n");

    return (
        <Stack spacing={1} sx={{ color: "inherit", fontSize: "inherit" }}>
            {lines.map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) {
                    return <Box key={idx} sx={{ height: 4 }} />;
                }

                // Headings (### or ##)
                if (trimmed.startsWith("###") || trimmed.startsWith("##")) {
                    const headingText = trimmed.replace(/^#+\s*/, "");
                    return (
                        <Typography
                            key={idx}
                            variant="subtitle2"
                            fontWeight={800}
                            color={colors.ink}
                            sx={{ mt: 1, mb: 0.2, fontSize: 14.5 }}
                        >
                            {headingText}
                        </Typography>
                    );
                }

                // Bullet points (* or -)
                if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
                    const bulletContent = trimmed.slice(2);
                    return (
                        <Stack
                            key={idx}
                            direction="row"
                            spacing={1.2}
                            alignItems="flex-start"
                            sx={{ pl: 0.5 }}
                        >
                            <Box
                                sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    bgcolor: colors.pine,
                                    mt: "7px",
                                    flexShrink: 0,
                                }}
                            />
                            <Typography
                                component="div"
                                fontSize={14}
                                lineHeight={1.65}
                                sx={{ color: "inherit" }}
                            >
                                <RenderBoldText text={bulletContent} />
                            </Typography>
                        </Stack>
                    );
                }

                // Numbered lists (1. or 2.)
                if (/^\d+\.\s/.test(trimmed)) {
                    const numMatch = trimmed.match(/^(\d+\.)\s*(.*)$/);
                    if (numMatch) {
                        return (
                            <Stack
                                key={idx}
                                direction="row"
                                spacing={1}
                                alignItems="flex-start"
                                sx={{ pl: 0.5 }}
                            >
                                <Typography
                                    fontWeight={800}
                                    fontSize={13.5}
                                    color={colors.pine}
                                    sx={{ minWidth: 20 }}
                                >
                                    {numMatch[1]}
                                </Typography>
                                <Typography
                                    component="div"
                                    fontSize={14}
                                    lineHeight={1.65}
                                    sx={{ color: "inherit" }}
                                >
                                    <RenderBoldText text={numMatch[2]} />
                                </Typography>
                            </Stack>
                        );
                    }
                }

                // Standard paragraph
                return (
                    <Typography
                        key={idx}
                        component="div"
                        fontSize={14}
                        lineHeight={1.7}
                        sx={{ color: "inherit" }}
                    >
                        <RenderBoldText text={line} />
                    </Typography>
                );
            })}
        </Stack>
    );
}

// Sub-helper to parse **bold** markers
function RenderBoldText({ text }) {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                        <Box
                            component="span"
                            key={i}
                            sx={{ fontWeight: 800, color: colors.ink }}
                        >
                            {part.slice(2, -2)}
                        </Box>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
}

export default function PatientAI() {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState(0);

    // Symptom Analysis State
    const [symptoms, setSymptoms] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Chat State
    const [chatMessages, setChatMessages] = useState([
        {
            role: "assistant",
            content:
                "Hello! I am SmartCare AI, your clinical health assistant.\n\nHow can I help you today? Feel free to ask any health questions, discuss symptoms or how you are feeling, understand medical concepts and diagnostic tests, or receive practical self-care guidance.",
            time: "Just now",
        },
    ]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [chatError, setChatError] = useState("");
    const [copiedIndex, setCopiedIndex] = useState(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (activeTab === 1) {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages, activeTab, chatLoading]);

    const handleAnalyze = async (textToAnalyze) => {
        const query = typeof textToAnalyze === "string" ? textToAnalyze : symptoms;
        if (!query || !query.trim()) {
            setError("Please describe your health concerns or symptoms.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setResult(null);

            const response = await api.post("/ai/symptoms", {
                symptoms: query.trim(),
            });

            const rec = response.data?.recommendation || {};
            const rawAnswer = response.data?.answer || "";

            const departments =
                Array.isArray(rec.departments) && rec.departments.length > 0
                    ? rec.departments
                    : ["General Medicine"];

            const urgency = rec.urgency || "Routine healthcare consultation";
            const summary =
                rec.summary ||
                (rawAnswer ? rawAnswer.slice(0, 180) + "..." : "Symptom routing evaluation completed.");
            const why = rec.why || "Based on matched clinical symptom patterns.";
            const nextStep =
                rec.nextStep ||
                "Book a consultation with a qualified doctor in the recommended department.";

            setResult({
                departments,
                urgency,
                summary,
                why,
                nextStep,
                message: rawAnswer || rec.message || "Analysis complete.",
                model: "SmartCare AI",
            });
        } catch (err) {
            console.error("AI Analysis error:", err);
            setError(
                err.response?.data?.message ||
                    "SmartCare AI is temporarily busy. Please retry in a few moments."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSendChat = async (presetText) => {
        const textToSend = presetText || chatInput;
        if (!textToSend || !textToSend.trim() || chatLoading) return;

        const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const userMsg = { role: "user", content: textToSend.trim(), time: timeNow };
        const updated = [...chatMessages, userMsg];
        setChatMessages(updated);
        setChatInput("");
        setChatError("");
        setChatLoading(true);

        try {
            const history = updated.slice(-6).map((m) => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: m.content,
            }));

            const res = await api.post("/ai/chat", {
                message: textToSend.trim(),
                history,
            });

            if (res.data?.answer) {
                const replyTime = new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                });
                setChatMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: res.data.answer,
                        time: replyTime,
                        model: "SmartCare AI",
                    },
                ]);
            } else {
                throw new Error("No response received from SmartCare AI.");
            }
        } catch (err) {
            console.error("Chat error:", err);
            setChatError(
                err.response?.data?.message ||
                    "Unable to connect to SmartCare AI right now. Please try again."
            );
        } finally {
            setChatLoading(false);
        }
    };

    const handleCopy = (content, index) => {
        navigator.clipboard.writeText(content);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleClearChat = () => {
        setChatMessages([
            {
                role: "assistant",
                content:
                    "Conversation refreshed. How may I assist your healthcare inquiry today?",
                time: "Just now",
            },
        ]);
        setChatError("");
    };

    const isEmergency =
        result?.urgency?.toLowerCase().includes("emergency") ||
        result?.urgency?.toLowerCase().includes("immediate");
    const isUrgent =
        result?.urgency?.toLowerCase().includes("prompt") ||
        result?.urgency?.toLowerCase().includes("urgent");

    return (
        <DashboardLayout
            role="patient"
            title="Clinical Care Navigator"
            subtitle="Clinical health triage, specialty matching, and health inquiry consultation"
        >
            {/* HERO CLINICAL STATUS BANNER */}
            <Paper
                elevation={0}
                sx={{
                    mb: 3,
                    p: { xs: 2.5, sm: 3.5 },
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${colors.pineDeep} 0%, #153831 60%, #0c2420 100%)`,
                    color: colors.white,
                    position: "relative",
                    overflow: "hidden",
                    border: `1px solid rgba(255,255,255,0.08)`,
                    boxShadow: "0 12px 32px rgba(15,82,75,0.12)",
                }}
            >
                {/* Background decorative medical motif */}
                <Box
                    sx={{
                        position: "absolute",
                        right: -20,
                        bottom: -30,
                        opacity: 0.05,
                        userSelect: "none",
                        pointerEvents: "none",
                    }}
                >
                    <LocalHospitalOutlined sx={{ fontSize: 240 }} />
                </Box>

                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={3}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", md: "center" }}
                    position="relative"
                    zIndex={1}
                >
                    <Box>
                        <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                            <Box
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 1,
                                    bgcolor: "rgba(228, 238, 233, 0.15)",
                                    border: "1px solid rgba(228, 238, 233, 0.3)",
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 9999,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        bgcolor: "#10B981",
                                        boxShadow: "0 0 10px #10B981",
                                    }}
                                />
                                <Typography
                                    fontSize={12}
                                    fontWeight={800}
                                    letterSpacing={0.8}
                                    textTransform="uppercase"
                                    sx={{ color: "#A7F3D0" }}
                                >
                                    Clinical Triage Protocol
                                </Typography>
                            </Box>

                            <Chip
                                icon={<VerifiedUserOutlined sx={{ fontSize: 14, color: "#99F6E4 !important" }} />}
                                label="Clinical Triage Protocols"
                                size="small"
                                sx={{
                                    bgcolor: "rgba(13, 148, 136, 0.2)",
                                    color: "#CCFBF1",
                                    fontWeight: 700,
                                    fontSize: 11.5,
                                    border: "1px solid rgba(13, 148, 136, 0.4)",
                                }}
                            />
                        </Stack>

                        <Typography
                            fontSize={{ xs: 22, sm: 26 }}
                            fontWeight={900}
                            fontFamily={fonts.display}
                            letterSpacing="-0.5px"
                            lineHeight={1.2}
                        >
                            Clinical Care & Triage Navigator
                        </Typography>

                        <Typography
                            fontSize={13.5}
                            sx={{ color: "rgba(255,255,255,0.78)", mt: 0.8, maxWidth: 640 }}
                            lineHeight={1.6}
                        >
                            Describe health symptoms for instant severity scoring and specialty matching,
                            or consult in-depth with our conversational clinical assistant for thorough medical
                            understanding, recovery advice, and guidance.
                        </Typography>
                    </Box>

                    {/* KPI Badges */}
                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{
                            bgcolor: "rgba(0,0,0,0.22)",
                            p: 1.8,
                            borderRadius: 3.5,
                            border: "1px solid rgba(255,255,255,0.1)",
                            backdropFilter: "blur(12px)",
                        }}
                    >
                        <Box sx={{ textAlign: "center", px: 1.5 }}>
                            <Typography fontSize={18} fontWeight={900} color="#5EEAD4">
                                14+
                            </Typography>
                            <Typography fontSize={11} sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                                Clinical Specialties
                            </Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.15)" }} />
                        <Box sx={{ textAlign: "center", px: 1.5 }}>
                            <Typography fontSize={18} fontWeight={900} color="#5EEAD4">
                                3-Tier
                            </Typography>
                            <Typography fontSize={11} sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                                Severity Triage
                            </Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.15)" }} />
                        <Box sx={{ textAlign: "center", px: 1.5 }}>
                            <Typography fontSize={18} fontWeight={900} color="#FDE047">
                                24/7
                            </Typography>
                            <Typography fontSize={11} sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                                Health Inquiry
                            </Typography>
                        </Box>
                    </Stack>
                </Stack>
            </Paper>

            {/* MODERN SEGMENTED PILL TAB SELECTOR */}
            <Box
                sx={{
                    mb: 3.5,
                    p: 0.8,
                    bgcolor: colors.canvas,
                    borderRadius: 4,
                    border: `1px solid ${colors.hairline}`,
                    display: "inline-flex",
                    width: "100%",
                }}
            >
                <Grid container spacing={1}>
                    <Grid item xs={12} sm={6}>
                        <Button
                            fullWidth
                            onClick={() => setActiveTab(0)}
                            startIcon={<PsychologyOutlined sx={{ fontSize: 22 }} />}
                            sx={{
                                py: 1.4,
                                px: 2.5,
                                borderRadius: 3.5,
                                textTransform: "none",
                                fontWeight: 800,
                                fontSize: 14.5,
                                transition: "all 0.2s ease-in-out",
                                bgcolor: activeTab === 0 ? colors.white : "transparent",
                                color: activeTab === 0 ? colors.pineDeep : colors.slate,
                                boxShadow:
                                    activeTab === 0
                                        ? "0 4px 14px rgba(15,82,75,0.08), 0 1px 3px rgba(0,0,0,0.04)"
                                        : "none",
                                border: activeTab === 0 ? `1px solid ${colors.hairline}` : "1px solid transparent",
                                "&:hover": {
                                    bgcolor: activeTab === 0 ? colors.white : "rgba(43,92,82,0.04)",
                                },
                            }}
                        >
                            Symptom Assessment & Routing
                        </Button>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Button
                            fullWidth
                            onClick={() => setActiveTab(1)}
                            startIcon={<ChatBubbleOutlineRounded sx={{ fontSize: 21 }} />}
                            sx={{
                                py: 1.4,
                                px: 2.5,
                                borderRadius: 3.5,
                                textTransform: "none",
                                fontWeight: 800,
                                fontSize: 14.5,
                                transition: "all 0.2s ease-in-out",
                                bgcolor: activeTab === 1 ? colors.white : "transparent",
                                color: activeTab === 1 ? colors.pineDeep : colors.slate,
                                boxShadow:
                                    activeTab === 1
                                        ? "0 4px 14px rgba(15,82,75,0.08), 0 1px 3px rgba(0,0,0,0.04)"
                                        : "none",
                                border: activeTab === 1 ? `1px solid ${colors.hairline}` : "1px solid transparent",
                                "&:hover": {
                                    bgcolor: activeTab === 1 ? colors.white : "rgba(43,92,82,0.04)",
                                },
                            }}
                        >
                            Interactive Health Consult Chat
                        </Button>
                    </Grid>
                </Grid>
            </Box>

            {/* TAB 0: SYMPTOM ASSESSMENT & ROUTING */}
            {activeTab === 0 && (
                <Grid container spacing={3}>
                    {/* LEFT COLUMN: INPUT CONSOLE & PRESETS */}
                    <Grid item xs={12} lg={7}>
                        <Card
                            elevation={0}
                            sx={{
                                border: `1px solid ${colors.hairline}`,
                                borderRadius: 4,
                                bgcolor: colors.white,
                                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                            }}
                        >
                            <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                                <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                                    <Avatar
                                        sx={{
                                            bgcolor: colors.pineSoft,
                                            color: colors.pine,
                                            width: 44,
                                            height: 44,
                                            borderRadius: 3,
                                        }}
                                    >
                                        <AssessmentOutlined />
                                    </Avatar>
                                    <Box>
                                        <Typography fontSize={18} fontWeight={900} color={colors.ink}>
                                            Clinical Symptom Triage
                                        </Typography>
                                        <Typography fontSize={12.5} color="text.secondary">
                                            Type or select a clinical concern to match urgency and medical departments
                                        </Typography>
                                    </Box>
                                </Stack>

                                {/* QUICK PRESETS */}
                                <Box sx={{ mt: 2.5, mb: 3 }}>
                                    <Typography
                                        fontSize={12.5}
                                        fontWeight={800}
                                        color={colors.slate}
                                        textTransform="uppercase"
                                        letterSpacing={0.6}
                                        mb={1.5}
                                    >
                                        Quick Clinical Scenarios (Click to auto-populate):
                                    </Typography>

                                    <Grid container spacing={1.2}>
                                        {QUICK_SYMPTOMS.map((q) => (
                                            <Grid item xs={12} sm={6} key={q.label}>
                                                <Box
                                                    onClick={() => {
                                                        setSymptoms(q.text);
                                                        handleAnalyze(q.text);
                                                    }}
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: 3,
                                                        border: `1px solid ${colors.hairline}`,
                                                        bgcolor: colors.canvas,
                                                        cursor: "pointer",
                                                        transition: "all 0.18s ease-in-out",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 1.2,
                                                        "&:hover": {
                                                            borderColor: colors.pine,
                                                            bgcolor: colors.pineSoft,
                                                            transform: "translateY(-1px)",
                                                            boxShadow: "0 4px 10px rgba(15,82,75,0.06)",
                                                        },
                                                    }}
                                                >
                                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28 }}>
                                                        {renderCategoryIcon(q.iconType)}
                                                    </Box>
                                                    <Box sx={{ overflow: "hidden" }}>
                                                        <Typography
                                                            fontSize={13}
                                                            fontWeight={700}
                                                            color={colors.ink}
                                                            noWrap
                                                        >
                                                            {q.label}
                                                        </Typography>
                                                        <Typography
                                                            fontSize={11.5}
                                                            color="text.secondary"
                                                            noWrap
                                                        >
                                                            {q.category}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>

                                {/* SYMPTOM INPUT FIELD */}
                                <Box sx={{ mb: 2 }}>
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        mb={0.8}
                                    >
                                        <Typography fontSize={13.5} fontWeight={800} color={colors.ink}>
                                            Describe your specific health symptoms:
                                        </Typography>
                                        <Typography fontSize={12} color="text.secondary">
                                            {symptoms.length} characters
                                        </Typography>
                                    </Stack>

                                    <TextField
                                        fullWidth
                                        multiline
                                        minRows={4}
                                        maxRows={8}
                                        placeholder="e.g., I've had a persistent dull headache and dizziness for the past 2 days, especially when standing up, along with mild nausea..."
                                        value={symptoms}
                                        onChange={(e) => {
                                            setSymptoms(e.target.value);
                                            if (error) setError("");
                                        }}
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                borderRadius: 3.5,
                                                fontSize: 14.5,
                                                lineHeight: 1.6,
                                                bgcolor: "#FBFCFB",
                                                border: `1px solid ${colors.hairline}`,
                                                "&:hover": {
                                                    borderColor: colors.pine,
                                                },
                                                "&.Mui-focused": {
                                                    borderColor: colors.pine,
                                                    boxShadow: `0 0 0 3px rgba(43,92,82,0.12)`,
                                                },
                                            },
                                        }}
                                    />
                                </Box>

                                {error && (
                                    <Alert
                                        severity="error"
                                        sx={{ mb: 2, borderRadius: 3, fontSize: 13.5 }}
                                    >
                                        {error}
                                    </Alert>
                                )}

                                {/* ACTION BUTTONS */}
                                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                                    <Button
                                        variant="contained"
                                        size="large"
                                        startIcon={
                                            loading ? (
                                                <CircularProgress size={18} color="inherit" />
                                            ) : (
                                                <AssessmentOutlined />
                                            )
                                        }
                                        onClick={() => handleAnalyze()}
                                        disabled={loading || !symptoms.trim()}
                                        sx={{
                                            borderRadius: 3,
                                            background: `linear-gradient(135deg, ${colors.pine} 0%, ${colors.pineDeep} 100%)`,
                                            color: colors.white,
                                            px: 3.5,
                                            py: 1.3,
                                            fontWeight: 800,
                                            fontSize: 14.5,
                                            boxShadow: "0 4px 14px rgba(43,92,82,0.25)",
                                            "&:hover": {
                                                background: `linear-gradient(135deg, ${colors.pineDeep} 0%, #102d26 100%)`,
                                            },
                                        }}
                                    >
                                        {loading ? "Evaluating Symptoms..." : "Evaluate Symptoms & Match Specialty"}
                                    </Button>

                                    {symptoms && (
                                        <Button
                                            variant="text"
                                            onClick={() => {
                                                setSymptoms("");
                                                setResult(null);
                                                setError("");
                                            }}
                                            sx={{
                                                color: colors.slate,
                                                fontWeight: 700,
                                                borderRadius: 3,
                                                px: 2,
                                            }}
                                        >
                                            Clear
                                        </Button>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* RIGHT COLUMN: CLINICAL PROCESS & GUIDANCE */}
                    <Grid item xs={12} lg={5}>
                        <Card
                            elevation={0}
                            sx={{
                                border: `1px solid ${colors.hairline}`,
                                borderRadius: 4,
                                bgcolor: colors.canvas,
                                height: "100%",
                            }}
                        >
                            <CardContent sx={{ p: 3.5 }}>
                                <Stack direction="row" spacing={1.2} alignItems="center" mb={1.5}>
                                    <HealthAndSafetyOutlined sx={{ color: colors.pine, fontSize: 28 }} />
                                    <Typography fontWeight={900} fontSize={17} color={colors.ink}>
                                        Clinical Triage Framework
                                    </Typography>
                                </Stack>

                                <Typography fontSize={13.5} color={colors.slate} lineHeight={1.65} mb={2.5}>
                                    SmartCare AI uses medical symptom pattern matching to classify clinical urgency,
                                    pinpoint specialized hospital departments, and provide direct doctor booking options.
                                </Typography>

                                <Stack spacing={1.8}>
                                    <Box
                                        sx={{
                                            p: 2,
                                            bgcolor: colors.white,
                                            borderRadius: 3,
                                            border: `1px solid ${colors.hairline}`,
                                        }}
                                    >
                                        <Stack direction="row" spacing={1.2} alignItems="center">
                                            <Box
                                                sx={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: "50%",
                                                    bgcolor: "#EF4444",
                                                }}
                                            />
                                            <Typography fontSize={13.5} fontWeight={800} color={colors.ink}>
                                                Tier 1: Emergency Attention
                                            </Typography>
                                        </Stack>
                                        <Typography fontSize={12.5} color="text.secondary" mt={0.5} pl={2.2}>
                                            Immediate ambulance dispatch & ER routing for critical cardiopulmonary or acute symptoms.
                                        </Typography>
                                    </Box>

                                    <Box
                                        sx={{
                                            p: 2,
                                            bgcolor: colors.white,
                                            borderRadius: 3,
                                            border: `1px solid ${colors.hairline}`,
                                        }}
                                    >
                                        <Stack direction="row" spacing={1.2} alignItems="center">
                                            <Box
                                                sx={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: "50%",
                                                    bgcolor: "#F59E0B",
                                                }}
                                            />
                                            <Typography fontSize={13.5} fontWeight={800} color={colors.ink}>
                                                Tier 2: Prompt Medical Care
                                            </Typography>
                                        </Stack>
                                        <Typography fontSize={12.5} color="text.secondary" mt={0.5} pl={2.2}>
                                            Evaluation within 24 to 48 hours for severe migraines, persistent fever, or acute discomfort.
                                        </Typography>
                                    </Box>

                                    <Box
                                        sx={{
                                            p: 2,
                                            bgcolor: colors.white,
                                            borderRadius: 3,
                                            border: `1px solid ${colors.hairline}`,
                                        }}
                                    >
                                        <Stack direction="row" spacing={1.2} alignItems="center">
                                            <Box
                                                sx={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: "50%",
                                                    bgcolor: "#10B981",
                                                }}
                                            />
                                            <Typography fontSize={13.5} fontWeight={800} color={colors.ink}>
                                                Tier 3: Routine Consultation
                                            </Typography>
                                        </Stack>
                                        <Typography fontSize={12.5} color="text.secondary" mt={0.5} pl={2.2}>
                                            Outpatient appointments with specialists in Dermatology, Orthopedics, or General Medicine.
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* RESULTS SECTION: ULTRA-PREMIUM MEDICAL DIAGNOSTIC CARD */}
                    {result && (
                        <Grid item xs={12}>
                            <Card
                                elevation={0}
                                sx={{
                                    border: `1.5px solid ${
                                        isEmergency
                                            ? "#EF4444"
                                            : isUrgent
                                            ? "#F59E0B"
                                            : colors.hairline
                                    }`,
                                    borderRadius: 4,
                                    bgcolor: colors.white,
                                    boxShadow: isEmergency
                                        ? "0 12px 30px rgba(239,68,68,0.12)"
                                        : "0 12px 30px rgba(15,82,75,0.06)",
                                    overflow: "hidden",
                                }}
                            >
                                {/* RESULT HEADER BAR */}
                                <Box
                                    sx={{
                                        px: { xs: 2.5, sm: 4 },
                                        py: 2.5,
                                        bgcolor: isEmergency
                                            ? "rgba(239, 68, 68, 0.08)"
                                            : isUrgent
                                            ? "rgba(245, 158, 11, 0.08)"
                                            : colors.pineSoft,
                                        borderBottom: `1px solid ${colors.hairline}`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        flexWrap: "wrap",
                                        gap: 2,
                                    }}
                                >
                                    <Stack direction="row" spacing={1.8} alignItems="center">
                                        <Avatar
                                            sx={{
                                                bgcolor: isEmergency
                                                    ? "#EF4444"
                                                    : isUrgent
                                                    ? "#F59E0B"
                                                    : colors.pine,
                                                color: colors.white,
                                                width: 44,
                                                height: 44,
                                            }}
                                        >
                                            {isEmergency ? (
                                                <EmergencyOutlined />
                                            ) : isUrgent ? (
                                                <WarningAmberRounded />
                                            ) : (
                                                <CheckCircleOutlineRounded />
                                            )}
                                        </Avatar>
                                        <Box>
                                            <Typography fontWeight={900} fontSize={18} color={colors.ink}>
                                                Clinical Assessment & Routing Result
                                            </Typography>
                                            <Typography fontSize={12.5} color="text.secondary">
                                                Generated via SmartCare clinical reasoning engine
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Chip
                                        label={result.urgency}
                                        sx={{
                                            fontWeight: 800,
                                            fontSize: 13,
                                            px: 1.5,
                                            py: 2.2,
                                            borderRadius: 9999,
                                            bgcolor: isEmergency
                                                ? "#EF4444"
                                                : isUrgent
                                                ? "#F59E0B"
                                                : colors.pine,
                                            color: colors.white,
                                        }}
                                    />
                                </Box>

                                <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                                    {/* 3 KPI HIGHLIGHT CARDS */}
                                    <Grid container spacing={2.5} mb={3.5}>
                                        <Grid item xs={12} sm={4}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 2.5,
                                                    borderRadius: 3.5,
                                                    bgcolor: colors.canvas,
                                                    border: `1px solid ${colors.hairline}`,
                                                }}
                                            >
                                                <Typography
                                                    fontSize={12}
                                                    fontWeight={800}
                                                    color="text.secondary"
                                                    textTransform="uppercase"
                                                >
                                                    Triage Urgency
                                                </Typography>
                                                <Typography
                                                    fontSize={16}
                                                    fontWeight={900}
                                                    mt={0.5}
                                                    color={
                                                        isEmergency
                                                            ? "#DC2626"
                                                            : isUrgent
                                                            ? "#D97706"
                                                            : colors.pine
                                                    }
                                                >
                                                    {isEmergency
                                                        ? "Emergency Attention"
                                                        : isUrgent
                                                        ? "Prompt Assessment"
                                                        : "Routine Consultation"}
                                                </Typography>
                                            </Paper>
                                        </Grid>

                                        <Grid item xs={12} sm={4}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 2.5,
                                                    borderRadius: 3.5,
                                                    bgcolor: colors.canvas,
                                                    border: `1px solid ${colors.hairline}`,
                                                }}
                                            >
                                                <Typography
                                                    fontSize={12}
                                                    fontWeight={800}
                                                    color="text.secondary"
                                                    textTransform="uppercase"
                                                >
                                                    Primary Specialty
                                                </Typography>
                                                <Typography
                                                    fontSize={16}
                                                    fontWeight={900}
                                                    mt={0.5}
                                                    color={colors.ink}
                                                >
                                                    {result.departments[0] || "General Medicine"}
                                                </Typography>
                                            </Paper>
                                        </Grid>

                                        <Grid item xs={12} sm={4}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 2.5,
                                                    borderRadius: 3.5,
                                                    bgcolor: colors.canvas,
                                                    border: `1px solid ${colors.hairline}`,
                                                }}
                                            >
                                                <Typography
                                                    fontSize={12}
                                                    fontWeight={800}
                                                    color="text.secondary"
                                                    textTransform="uppercase"
                                                >
                                                    Action Protocol
                                                </Typography>
                                                <Typography
                                                    fontSize={16}
                                                    fontWeight={900}
                                                    mt={0.5}
                                                    color={colors.ink}
                                                >
                                                    {isEmergency
                                                        ? "Immediate ER / Ambulance"
                                                        : "Book Specialist Visit"}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>

                                    <Grid container spacing={4}>
                                        {/* SUMMARY & SPECIALTY MAPPINGS */}
                                        <Grid item xs={12} md={7}>
                                            <Typography
                                                fontSize={13}
                                                fontWeight={800}
                                                color={colors.slate}
                                                textTransform="uppercase"
                                                letterSpacing={0.8}
                                            >
                                                Clinical Summary:
                                            </Typography>
                                            <Typography
                                                fontSize={15.5}
                                                fontWeight={600}
                                                color={colors.ink}
                                                mt={0.8}
                                                lineHeight={1.7}
                                            >
                                                {result.summary}
                                            </Typography>

                                            <Divider sx={{ my: 2.5 }} />

                                            <Typography
                                                fontSize={13}
                                                fontWeight={800}
                                                color={colors.slate}
                                                textTransform="uppercase"
                                                letterSpacing={0.8}
                                                mb={1.5}
                                            >
                                                Recommended Hospital Specialties:
                                            </Typography>
                                            <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap>
                                                {result.departments.map((dept) => (
                                                    <Chip
                                                        key={dept}
                                                        icon={<MedicalServicesOutlined sx={{ fontSize: 16 }} />}
                                                        label={dept}
                                                        clickable
                                                        onClick={() => navigate(`/doctors`)}
                                                        sx={{
                                                            bgcolor: colors.pineSoft,
                                                            color: colors.pineDeep,
                                                            fontWeight: 800,
                                                            fontSize: 14,
                                                            px: 1.5,
                                                            py: 2.2,
                                                            borderRadius: 3,
                                                            "&:hover": {
                                                                bgcolor: "rgba(43,92,82,0.18)",
                                                            },
                                                        }}
                                                    />
                                                ))}
                                            </Stack>

                                            <Box
                                                sx={{
                                                    mt: 3,
                                                    p: 2.5,
                                                    bgcolor: colors.canvas,
                                                    borderRadius: 3.5,
                                                    border: `1px solid ${colors.hairline}`,
                                                }}
                                            >
                                                <Typography fontSize={13.5} fontWeight={800} color={colors.ink}>
                                                    Next Practical Step:
                                                </Typography>
                                                <Typography
                                                    fontSize={14}
                                                    color={colors.slate}
                                                    mt={0.5}
                                                    lineHeight={1.6}
                                                >
                                                    {result.nextStep}
                                                </Typography>
                                            </Box>
                                        </Grid>

                                        {/* DIRECT ACTION BUTTONS (FOR TAB 0 ROUTING) */}
                                        <Grid item xs={12} md={5}>
                                            <Box
                                                sx={{
                                                    p: 3,
                                                    borderRadius: 3.5,
                                                    bgcolor: colors.canvas,
                                                    border: `1px solid ${colors.hairline}`,
                                                }}
                                            >
                                                <Typography
                                                    fontSize={15.5}
                                                    fontWeight={900}
                                                    color={colors.ink}
                                                    mb={2}
                                                >
                                                    Take Immediate Clinical Action
                                                </Typography>

                                                <Stack spacing={1.5}>
                                                    <Button
                                                        variant="contained"
                                                        fullWidth
                                                        startIcon={<CalendarMonth />}
                                                        endIcon={<ChevronRightRounded />}
                                                        onClick={() => navigate("/book-appointment")}
                                                        sx={{
                                                            bgcolor: colors.amber,
                                                            color: colors.ink,
                                                            fontWeight: 800,
                                                            py: 1.3,
                                                            borderRadius: 2.8,
                                                            justifyContent: "space-between",
                                                            "&:hover": { bgcolor: colors.amberDeep },
                                                        }}
                                                    >
                                                        Book Doctor Appointment
                                                    </Button>

                                                    <Button
                                                        variant="outlined"
                                                        fullWidth
                                                        startIcon={<MedicalServicesOutlined />}
                                                        endIcon={<ChevronRightRounded />}
                                                        onClick={() => navigate("/doctors")}
                                                        sx={{
                                                            borderColor: colors.hairline,
                                                            color: colors.ink,
                                                            fontWeight: 700,
                                                            py: 1.3,
                                                            borderRadius: 2.8,
                                                            justifyContent: "space-between",
                                                            "&:hover": {
                                                                borderColor: colors.pine,
                                                                bgcolor: colors.white,
                                                            },
                                                        }}
                                                    >
                                                        Browse Network Doctors
                                                    </Button>

                                                    <Button
                                                        variant="outlined"
                                                        fullWidth
                                                        startIcon={<LocalHospitalOutlined />}
                                                        endIcon={<ChevronRightRounded />}
                                                        onClick={() => navigate("/hospitals")}
                                                        sx={{
                                                            borderColor: colors.hairline,
                                                            color: colors.ink,
                                                            fontWeight: 700,
                                                            py: 1.3,
                                                            borderRadius: 2.8,
                                                            justifyContent: "space-between",
                                                            "&:hover": {
                                                                borderColor: colors.pine,
                                                                bgcolor: colors.white,
                                                            },
                                                        }}
                                                    >
                                                        Explore Hospital Network
                                                    </Button>

                                                    {isEmergency && (
                                                        <Button
                                                            variant="contained"
                                                            color="error"
                                                            fullWidth
                                                            startIcon={<EmergencyOutlined />}
                                                            onClick={() => navigate("/patient/emergency")}
                                                            sx={{
                                                                fontWeight: 900,
                                                                py: 1.4,
                                                                borderRadius: 2.8,
                                                                boxShadow: "0 4px 14px rgba(239,68,68,0.3)",
                                                            }}
                                                        >
                                                            Dispatch Emergency Ambulance
                                                        </Button>
                                                    )}
                                                </Stack>
                                            </Box>
                                        </Grid>
                                    </Grid>

                                    {/* CLINICAL EXPLANATION EXPANDER */}
                                    <Box
                                        sx={{
                                            mt: 3.5,
                                            p: 3,
                                            bgcolor: "#FAFDFD",
                                            borderRadius: 3.5,
                                            border: `1px solid ${colors.hairline}`,
                                        }}
                                    >
                                        <Typography
                                            fontSize={13.5}
                                            fontWeight={800}
                                            color={colors.ink}
                                            mb={1}
                                        >
                                            Detailed Clinical Guidance:
                                        </Typography>
                                        <FormattedMessageText text={result.message} />
                                    </Box>

                                    <Alert
                                        severity="info"
                                        icon={<InfoOutlined />}
                                        sx={{ mt: 3, borderRadius: 3 }}
                                    >
                                        <Typography fontSize={12.5}>
                                            <strong>Medical Disclaimer:</strong> This symptom triage assessment is
                                            generated by SmartCare AI for educational guidance and clinical care routing
                                            only. It is not a formal diagnosis or medical prescription. If you experience
                                            severe warning symptoms, please dial emergency services immediately.
                                        </Typography>
                                    </Alert>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* TAB 1: INTERACTIVE AI HEALTH CONSULT CHAT (Pure Conversational Care Assistant) */}
            {activeTab === 1 && (
                <Card
                    elevation={0}
                    sx={{
                        border: `1px solid ${colors.hairline}`,
                        borderRadius: 4,
                        bgcolor: colors.white,
                        display: "flex",
                        flexDirection: "column",
                        height: "76vh",
                        boxShadow: "0 6px 24px rgba(0,0,0,0.03)",
                        overflow: "hidden",
                    }}
                >
                    {/* CHAT HEADER */}
                    <Box
                        sx={{
                            px: 3,
                            py: 2,
                            borderBottom: `1px solid ${colors.hairline}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            bgcolor: colors.canvas,
                            flexWrap: "wrap",
                            gap: 1.5,
                        }}
                    >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ position: "relative" }}>
                                <Avatar
                                    sx={{
                                        background: `linear-gradient(135deg, ${colors.pine} 0%, ${colors.pineDeep} 100%)`,
                                        width: 44,
                                        height: 44,
                                        color: colors.white,
                                    }}
                                >
                                    <PsychologyOutlined />
                                </Avatar>
                                <Box
                                    sx={{
                                        position: "absolute",
                                        bottom: 0,
                                        right: 0,
                                        width: 12,
                                        height: 12,
                                        borderRadius: "50%",
                                        bgcolor: "#10B981",
                                        border: `2px solid ${colors.white}`,
                                    }}
                                />
                            </Box>
                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography fontWeight={900} fontSize={16} color={colors.ink}>
                                        SmartCare Clinical Assistant
                                    </Typography>
                                    <Chip
                                        label="Active Assistant"
                                        size="small"
                                        sx={{
                                            bgcolor: "#ECFDF5",
                                            color: "#059669",
                                            fontWeight: 800,
                                            fontSize: 10.5,
                                            height: 20,
                                        }}
                                    />
                                </Stack>
                                <Typography fontSize={12} color="text.secondary">
                                    Private clinical health consultation • Evidence-based guidance
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack direction="row" spacing={1}>
                            <Tooltip title="Reset & start fresh consultation">
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<RefreshRounded sx={{ fontSize: 16 }} />}
                                    onClick={handleClearChat}
                                    sx={{
                                        borderColor: colors.hairline,
                                        color: colors.slate,
                                        borderRadius: 2.5,
                                        fontSize: 12,
                                        textTransform: "none",
                                        fontWeight: 700,
                                        "&:hover": {
                                            borderColor: colors.pine,
                                            color: colors.pine,
                                            bgcolor: colors.white,
                                        },
                                    }}
                                >
                                    New Consultation
                                </Button>
                            </Tooltip>
                        </Stack>
                    </Box>

                    {/* CHAT MESSAGES STREAM */}
                    <Box
                        sx={{
                            flexGrow: 1,
                            overflowY: "auto",
                            p: { xs: 2, sm: 3 },
                            display: "flex",
                            flexDirection: "column",
                            gap: 2.5,
                            bgcolor: "#FBFCFB",
                        }}
                    >
                        {chatMessages.map((msg, idx) => {
                            const isUser = msg.role === "user";
                            return (
                                <Box
                                    key={idx}
                                    sx={{
                                        display: "flex",
                                        justifyContent: isUser ? "flex-end" : "flex-start",
                                        gap: 1.2,
                                    }}
                                >
                                    {!isUser && (
                                        <Avatar
                                            sx={{
                                                bgcolor: colors.pineSoft,
                                                color: colors.pine,
                                                width: 34,
                                                height: 34,
                                                mt: 0.5,
                                            }}
                                        >
                                            <PsychologyOutlined sx={{ fontSize: 19 }} />
                                        </Avatar>
                                    )}

                                    <Box
                                        sx={{
                                            maxWidth: { xs: "90%", md: "80%" },
                                            p: 2.5,
                                            borderRadius: 4,
                                            borderTopRightRadius: isUser ? 1 : 4,
                                            borderTopLeftRadius: !isUser ? 1 : 4,
                                            bgcolor: isUser ? colors.pineDeep : colors.white,
                                            color: isUser ? colors.white : colors.ink,
                                            boxShadow: isUser
                                                ? "0 4px 14px rgba(29,69,61,0.2)"
                                                : "0 2px 10px rgba(0,0,0,0.04)",
                                            border: isUser ? "none" : `1px solid ${colors.hairline}`,
                                            position: "relative",
                                        }}
                                    >
                                        {!isUser && (
                                            <Stack
                                                direction="row"
                                                justifyContent="space-between"
                                                alignItems="center"
                                                mb={1}
                                            >
                                                <Typography
                                                    fontSize={11.5}
                                                    fontWeight={800}
                                                    color={colors.pine}
                                                    letterSpacing={0.5}
                                                    textTransform="uppercase"
                                                >
                                                    SmartCare Clinical Assistant
                                                </Typography>

                                                <Tooltip title={copiedIndex === idx ? "Copied!" : "Copy response"}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleCopy(msg.content, idx)}
                                                        sx={{ p: 0.4, color: colors.slate }}
                                                    >
                                                        {copiedIndex === idx ? (
                                                            <DoneRounded sx={{ fontSize: 14, color: "#10B981" }} />
                                                        ) : (
                                                            <ContentCopyRounded sx={{ fontSize: 14 }} />
                                                        )}
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        )}

                                        {isUser ? (
                                            <Typography
                                                fontSize={14.5}
                                                lineHeight={1.65}
                                                sx={{ whiteSpace: "pre-line", fontWeight: 500 }}
                                            >
                                                {msg.content}
                                            </Typography>
                                        ) : (
                                            <FormattedMessageText text={msg.content} />
                                        )}

                                        {msg.time && (
                                            <Typography
                                                fontSize={10.5}
                                                sx={{
                                                    mt: 1.2,
                                                    textAlign: "right",
                                                    opacity: 0.6,
                                                    color: isUser ? "rgba(255,255,255,0.7)" : colors.slate,
                                                }}
                                            >
                                                {msg.time}
                                            </Typography>
                                        )}
                                    </Box>

                                    {isUser && (
                                        <Avatar
                                            sx={{
                                                bgcolor: colors.canvasDeep,
                                                color: colors.ink,
                                                width: 34,
                                                height: 34,
                                                mt: 0.5,
                                                fontWeight: 800,
                                                fontSize: 13,
                                            }}
                                        >
                                            You
                                        </Avatar>
                                    )}
                                </Box>
                            );
                        })}

                        {chatLoading && (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "flex-start",
                                    alignItems: "center",
                                    gap: 1.5,
                                    p: 1.5,
                                    borderRadius: 3.5,
                                    bgcolor: colors.white,
                                    border: `1px solid ${colors.hairline}`,
                                    width: "fit-content",
                                }}
                            >
                                <Avatar
                                    sx={{
                                        bgcolor: colors.pineSoft,
                                        color: colors.pine,
                                        width: 28,
                                        height: 28,
                                    }}
                                >
                                    <PsychologyOutlined sx={{ fontSize: 16 }} />
                                </Avatar>
                                <Typography fontSize={13} color={colors.slate} fontWeight={600}>
                                    SmartCare Clinical Assistant is analyzing your medical question...
                                </Typography>
                                <CircularProgress size={16} sx={{ color: colors.pine, ml: 0.5 }} />
                            </Box>
                        )}

                        <div ref={chatEndRef} />
                    </Box>

                    {/* PROMPTS & INPUT CONSOLE */}
                    <Box
                        sx={{
                            p: 2.2,
                            borderTop: `1px solid ${colors.hairline}`,
                            bgcolor: colors.white,
                        }}
                    >
                        {/* SUGGESTION CHIPS */}
                        {chatMessages.length <= 4 && (
                            <Box sx={{ mb: 1.8, overflowX: "auto", pb: 0.5 }}>
                                <Stack direction="row" spacing={1} sx={{ width: "max-content" }}>
                                    {CHAT_STARTERS.map((s, i) => (
                                        <Chip
                                            key={i}
                                            label={s}
                                            onClick={() => handleSendChat(s)}
                                            size="small"
                                            sx={{
                                                fontSize: 12.5,
                                                cursor: "pointer",
                                                bgcolor: colors.canvas,
                                                borderColor: colors.hairline,
                                                color: colors.ink,
                                                fontWeight: 600,
                                                py: 1.8,
                                                px: 0.5,
                                                borderRadius: 2.5,
                                                "&:hover": {
                                                    borderColor: colors.pine,
                                                    bgcolor: colors.pineSoft,
                                                    color: colors.pineDeep,
                                                },
                                            }}
                                            variant="outlined"
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        )}

                        {chatError && (
                            <Alert severity="error" sx={{ mb: 1.5, py: 0.5, borderRadius: 2.5 }}>
                                {chatError}
                            </Alert>
                        )}

                        <Paper
                            elevation={0}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                p: "4px 8px 4px 16px",
                                borderRadius: 3.5,
                                border: `1px solid ${colors.hairline}`,
                                bgcolor: colors.canvas,
                                "&:focus-within": {
                                    borderColor: colors.pine,
                                    boxShadow: `0 0 0 3px rgba(43,92,82,0.12)`,
                                    bgcolor: colors.white,
                                },
                            }}
                        >
                            <TextField
                                fullWidth
                                placeholder="Ask any clinical question or discuss health symptoms with your AI health assistant..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendChat();
                                    }
                                }}
                                disabled={chatLoading}
                                multiline
                                maxRows={3}
                                variant="standard"
                                InputProps={{
                                    disableUnderline: true,
                                    sx: {
                                        fontSize: 14.5,
                                        py: 0.8,
                                    },
                                }}
                            />

                            <IconButton
                                onClick={() => handleSendChat()}
                                disabled={chatLoading || !chatInput.trim()}
                                sx={{
                                    bgcolor: colors.pine,
                                    color: colors.white,
                                    p: 1.2,
                                    ml: 1,
                                    borderRadius: 3,
                                    "&:hover": {
                                        bgcolor: colors.pineDeep,
                                    },
                                    "&.Mui-disabled": {
                                        bgcolor: "rgba(0,0,0,0.08)",
                                        color: "rgba(0,0,0,0.25)",
                                    },
                                }}
                            >
                                <SendRounded fontSize="small" />
                            </IconButton>
                        </Paper>

                        <Typography
                            fontSize={11.5}
                            color="text.secondary"
                            sx={{ mt: 1, textAlign: "center" }}
                        >
                            Press <strong>Enter ↵</strong> to send • <strong>Shift + Enter</strong> for a new line • SmartCare AI provides guidance, not diagnosis.
                        </Typography>
                    </Box>
                </Card>
            )}
        </DashboardLayout>
    );
}