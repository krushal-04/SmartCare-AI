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
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
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
    UploadFileOutlined,
    DescriptionOutlined,
    FactCheckOutlined,
    QuestionAnswerOutlined,
    ArrowForwardRounded,
    DeleteOutlineOutlined,
    BiotechOutlined,
    CheckCircleOutlined,
    ScienceOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../services/api";
import { colors, fonts } from "../../theme/colors";

const SAMPLE_BLOOD_REPORT = {
    reportType: "Comprehensive Blood Count (CBC) & Metabolic Panel",
    fileName: "fictional_high_values_blood_report_for_testing.pdf",
    reportDate: "03-Nov-2026",
    overview:
        "Complete Blood Count (CBC) and Basic Metabolic Panel (BMP). Analysis detects elevated Hemoglobin, Hematocrit, and Red Blood Cell (RBC) count, indicating mild hemoconcentration. White blood cell count, platelets, fasting glucose, and renal function parameters are in normal ranges.",
    reviewPriority: "Prompt clinical review",
    priorityExplanation:
        "Three red blood cell parameters exceed standard physiological reference limits. While non-emergent, a clinical review is recommended to evaluate hydration status, secondary erythrocytosis, or respiratory factors.",
    tests: [
        {
            testName: "Hemoglobin (Hb)",
            result: "18.2",
            unit: "g/dL",
            referenceRange: "12.0 – 17.5",
            status: "High",
            interpretation: "Elevated hemoglobin level indicating potential hemoconcentration, mild dehydration, or polycythemia.",
        },
        {
            testName: "Red Blood Cells (RBC)",
            result: "6.2",
            unit: "×10¹²/L",
            referenceRange: "4.0 – 5.9",
            status: "High",
            interpretation: "Erythrocyte count is above the upper physiological boundary. Clinical correlation recommended.",
        },
        {
            testName: "Hematocrit (Hct)",
            result: "54.8",
            unit: "%",
            referenceRange: "36.0 – 50.0",
            status: "High",
            interpretation: "Proportion of red blood cells in whole blood is increased, consistent with elevated hemoglobin.",
        },
        {
            testName: "White Blood Cells (WBC)",
            result: "7.2",
            unit: "×10⁹/L",
            referenceRange: "4.0 – 11.0",
            status: "Normal",
            interpretation: "Leukocyte count is within normal limits. No evidence of systemic infection or leukocytosis.",
        },
        {
            testName: "Platelets (Plt)",
            result: "245",
            unit: "×10⁹/L",
            referenceRange: "150 – 450",
            status: "Normal",
            interpretation: "Thrombocyte count is optimal for normal blood clotting and vascular integrity.",
        },
        {
            testName: "Fasting Blood Glucose",
            result: "92",
            unit: "mg/dL",
            referenceRange: "70 – 99",
            status: "Normal",
            interpretation: "Glycemic level is balanced within normal fasting reference parameters.",
        },
        {
            testName: "Serum Creatinine",
            result: "1.0",
            unit: "mg/dL",
            referenceRange: "0.6 – 1.3",
            status: "Normal",
            interpretation: "Kidney biomarker is well-regulated, demonstrating normal renal filtration capacity.",
        },
        {
            testName: "Serum Potassium",
            result: "4.4",
            unit: "mmol/L",
            referenceRange: "3.5 – 5.1",
            status: "Normal",
            interpretation: "Electrolyte level is well-balanced within safe cardioprotective range.",
        },
    ],
    keyFindings: [
        "Elevated Hemoglobin (18.2 g/dL), Hematocrit (54.8%), and RBC (6.2 ×10¹²/L) flagged above standard adult thresholds.",
        "Platelet count (245 ×10⁹/L) and White Blood Cell count (7.2 ×10⁹/L) are completely normal with no acute inflammation.",
        "Metabolic markers (Creatinine 1.0 mg/dL, Fasting Glucose 92 mg/dL) verify preserved renal and glycemic balance.",
        "No acute critical cellular abnormalities detected.",
    ],
    clinicianDiscussion: [
        "Could inadequate hydration, high altitude, smoking, or mild sleep apnea explain the elevated red cell indices?",
        "Is a repeat Complete Blood Count recommended in 2–4 weeks to monitor value stability?",
        "Would evaluation of serum ferritin, iron saturation, or erythropoietin (EPO) be beneficial if levels remain high?",
    ],
    nextSteps: [
        "Schedule an outpatient consultation with an Internal Medicine or Hematology physician within 5–7 days.",
        "Ensure healthy oral fluid intake prior to follow-up testing.",
        "Share this digital analysis and original lab report with your clinician for comprehensive correlation.",
    ],
    extractionStatus: "complete",
};

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

    // Medical report review state. The selected file is sent only when the
    // patient explicitly starts analysis and is not saved by this feature.
    const [reportFile, setReportFile] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportError, setReportError] = useState("");
    const [reportResult, setReportResult] = useState(null);
    const [reportFilter, setReportFilter] = useState("all");

    const handleLoadSampleReport = () => {
        setReportFile({ name: SAMPLE_BLOOD_REPORT.fileName, size: 245000 });
        setReportError("");
        setReportResult(SAMPLE_BLOOD_REPORT);
        setReportFilter("all");
    };

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

    const handleReportAnalysis = async () => {
        if (!reportFile) {
            setReportError("Choose a PDF, JPG, or PNG medical report first.");
            return;
        }
        const supportedTypes = ["application/pdf", "image/jpeg", "image/png"];
        if (!supportedTypes.includes(reportFile.type)) {
            setReportError("Only PDF, JPG, and PNG files are supported.");
            return;
        }
        if (reportFile.size > 10 * 1024 * 1024) {
            setReportError("This file is larger than 10 MB. Please choose a smaller report.");
            return;
        }
        try {
            setReportLoading(true);
            setReportError("");
            setReportResult(null);
            const formData = new FormData();
            formData.append("report", reportFile);
            const response = await api.post("/ai/report-analysis", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setReportResult({ ...response.data.analysis, fileName: response.data.fileName });
        } catch (err) {
            setReportError(err.response?.data?.message || "We could not analyse this report. Please try again.");
        } finally {
            setReportLoading(false);
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
                        <Stack direction="row" spacing={1.5} alignItems="center" mb={1} flexWrap="wrap">
                            <Box
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 1,
                                    bgcolor: "rgba(228, 238, 233, 0.15)",
                                    border: "1px solid rgba(228, 238, 233, 0.3)",
                                    px: 1.6,
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
                                    SmartCare Clinical Intelligence
                                </Typography>
                            </Box>

                            <Chip
                                icon={<VerifiedUserOutlined sx={{ fontSize: 14, color: "#99F6E4 !important" }} />}
                                label="Clinical Triage Protocol"
                                size="small"
                                sx={{
                                    bgcolor: "rgba(13, 148, 136, 0.2)",
                                    color: "#CCFBF1",
                                    fontWeight: 750,
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

                    <Box
                        sx={{
                            bgcolor: "rgba(0,0,0,0.22)",
                            px: 2,
                            py: 1.5,
                            borderRadius: 2.5,
                            border: "1px solid rgba(255,255,255,0.1)",
                            maxWidth: 245,
                        }}
                    >
                        <Typography fontSize={12} fontWeight={800} color="#CCFBF1">Safe care guidance</Typography>
                        <Typography fontSize={11.5} sx={{ color: "rgba(255,255,255,0.72)", mt: 0.4, lineHeight: 1.5 }}>
                            Review symptoms, understand reports, and choose an appropriate next step.
                        </Typography>
                    </Box>
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
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: 1, width: "100%" }}>
                    <Box>
                        <Button
                            fullWidth
                            onClick={() => setActiveTab(0)}
                            startIcon={<PsychologyOutlined sx={{ fontSize: 22 }} />}
                            sx={{
                                py: 1.4,
                                px: 2,
                                borderRadius: 3.5,
                                textTransform: "none",
                                fontWeight: 800,
                                fontSize: { xs: 13, md: 14 },
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
                            Symptom Triage & Matching
                        </Button>
                    </Box>

                    <Box>
                        <Button
                            fullWidth
                            onClick={() => setActiveTab(1)}
                            startIcon={<ChatBubbleOutlineRounded sx={{ fontSize: 21 }} />}
                            sx={{
                                py: 1.4,
                                px: 2,
                                borderRadius: 3.5,
                                textTransform: "none",
                                fontWeight: 800,
                                fontSize: { xs: 13, md: 14 },
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
                            Clinical Health Assistant Chat
                        </Button>
                    </Box>

                    <Box>
                        <Button
                            fullWidth
                            onClick={() => setActiveTab(2)}
                            startIcon={<DescriptionOutlined sx={{ fontSize: 21 }} />}
                            sx={{
                                py: 1.4,
                                px: 2,
                                borderRadius: 3.5,
                                textTransform: "none",
                                fontWeight: 800,
                                fontSize: { xs: 13, md: 14 },
                                transition: "all 0.2s ease-in-out",
                                bgcolor: activeTab === 2 ? colors.white : "transparent",
                                color: activeTab === 2 ? colors.pineDeep : colors.slate,
                                boxShadow:
                                    activeTab === 2
                                        ? "0 4px 14px rgba(15,82,75,0.08), 0 1px 3px rgba(0,0,0,0.04)"
                                        : "none",
                                border: activeTab === 2 ? `1px solid ${colors.hairline}` : "1px solid transparent",
                                "&:hover": {
                                    bgcolor: activeTab === 2 ? colors.white : "rgba(43,92,82,0.04)",
                                },
                            }}
                        >
                            Medical Lab & Report Review
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* TAB 0: SYMPTOM ASSESSMENT & ROUTING */}
            {activeTab === 0 && (
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "7fr 5fr" }, gap: 3, alignItems: "start" }}>
                    {/* LEFT COLUMN: INPUT CONSOLE & PRESETS */}
                    <Box sx={{ minWidth: 0, width: "100%" }}>
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

                                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.2 }}>
                                        {QUICK_SYMPTOMS.map((q) => (
                                            <Box
                                                key={q.label}
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
                                        ))}
                                    </Box>
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
                    </Box>

                    {/* RIGHT COLUMN: CLINICAL PROCESS & GUIDANCE */}
                    <Box sx={{ minWidth: 0, width: "100%" }}>
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
                    </Box>

                    {/* RESULTS SECTION: ULTRA-PREMIUM MEDICAL DIAGNOSTIC CARD */}
                    {result && (
                        <Box sx={{ gridColumn: { lg: "1 / -1" }, width: "100%" }}>
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
                                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: 2.5, mb: 3.5 }}>
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
                                    </Box>

                                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "7fr 5fr" }, gap: 4 }}>
                                        {/* SUMMARY & SPECIALTY MAPPINGS */}
                                        <Box sx={{ minWidth: 0 }}>
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
                                        </Box>

                                        {/* DIRECT ACTION BUTTONS (FOR TAB 0 ROUTING) */}
                                        <Box sx={{ minWidth: 0 }}>
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
                                        </Box>
                                    </Box>

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
                        </Box>
                    )}
                </Box>
            )}

            {/* TAB 2: MEDICAL REPORT REVIEW */}
            {activeTab === 2 && (
                <Card
                    elevation={0}
                    sx={{
                        border: `1px solid ${colors.hairline}`,
                        borderRadius: 4,
                        width: "100%",
                        bgcolor: colors.white,
                        boxShadow: "0 6px 24px rgba(0,0,0,0.03)",
                    }}
                >
                    <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                        {/* HEADER */}
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            spacing={2}
                            mb={2.5}
                        >
                            <Box>
                                <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
                                    <Avatar
                                        sx={{
                                            bgcolor: colors.pineSoft,
                                            color: colors.pine,
                                            width: 40,
                                            height: 40,
                                            borderRadius: 2.5,
                                        }}
                                    >
                                        <DescriptionOutlined />
                                    </Avatar>
                                    <Typography variant="h5" fontWeight={900} color={colors.ink}>
                                        Medical Lab & Blood Report Review
                                    </Typography>
                                </Stack>
                                <Typography color={colors.slate} fontSize={13.5} mt={0.5}>
                                    Upload blood tests, complete blood counts (CBC), or metabolic panels to extract verified biomarkers, reference anomalies, and doctor questions.
                                </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                <Chip
                                    label="Private In-Session Analysis"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ fontWeight: 800, fontSize: 11.5 }}
                                />
                                <Chip
                                    label="HIPAA Encrypted"
                                    sx={{
                                        fontWeight: 800,
                                        fontSize: 11.5,
                                        bgcolor: "#F0FDF4",
                                        color: "#16A34A",
                                        border: "1px solid #BBF7D0",
                                    }}
                                />
                            </Stack>
                        </Stack>

                        <Alert
                            severity="info"
                            icon={<InfoOutlined />}
                            sx={{ mb: 3, borderRadius: 2.5, fontSize: 13 }}
                        >
                            Files are processed securely in temporary session memory and are never saved to public electronic health records. AI insights assist patient comprehension and do not replace formal physician consultation.
                        </Alert>

                        {/* UPLOAD & TEST CONSOLE */}
                        <Box
                            sx={{
                                p: { xs: 2.5, sm: 3.5 },
                                border: `1.5px dashed ${reportFile ? colors.pine : colors.slateSoft}`,
                                borderRadius: 3.5,
                                bgcolor: reportFile ? "rgba(13, 148, 136, 0.03)" : colors.canvas,
                                transition: "all 0.2s ease",
                            }}
                        >
                            <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} alignItems={{ md: "center" }} justifyContent="space-between">
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0 }}>
                                    <Box
                                        sx={{
                                            width: 52,
                                            height: 52,
                                            borderRadius: 3,
                                            bgcolor: colors.white,
                                            border: `1px solid ${colors.hairline}`,
                                            display: "grid",
                                            placeItems: "center",
                                            color: colors.pine,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <UploadFileOutlined sx={{ fontSize: 28 }} />
                                    </Box>

                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography fontWeight={850} fontSize={15} color={colors.ink} noWrap>
                                            {reportFile?.name || "Choose or Drag & Drop a Medical Report"}
                                        </Typography>
                                        <Typography variant="body2" color={colors.slate} mt={0.3}>
                                            Supports PDF, JPG, PNG · Maximum file size 10 MB
                                        </Typography>
                                    </Box>
                                </Box>

                                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                                    <Button
                                        component="label"
                                        variant="outlined"
                                        startIcon={<UploadFileOutlined />}
                                        sx={{
                                            minHeight: 44,
                                            borderRadius: 2.5,
                                            textTransform: "none",
                                            fontWeight: 750,
                                            borderColor: colors.hairline,
                                            bgcolor: colors.white,
                                            color: colors.ink,
                                            "&:hover": { borderColor: colors.pine, bgcolor: colors.white },
                                        }}
                                    >
                                        {reportFile ? "Change File" : "Choose File"}
                                        <input
                                            hidden
                                            type="file"
                                            accept="application/pdf,image/jpeg,image/png,image/jpg"
                                            onChange={(event) => {
                                                const selected = event.target.files?.[0] || null;
                                                setReportFile(selected);
                                                setReportError("");
                                                setReportResult(null);
                                                setReportFilter("all");
                                            }}
                                        />
                                    </Button>

                                    <Button
                                        variant="contained"
                                        onClick={handleReportAnalysis}
                                        disabled={!reportFile || reportLoading}
                                        startIcon={
                                            reportLoading ? (
                                                <CircularProgress size={18} color="inherit" />
                                            ) : (
                                                <AssessmentOutlined />
                                            )
                                        }
                                        sx={{
                                            minHeight: 44,
                                            borderRadius: 2.5,
                                            textTransform: "none",
                                            fontWeight: 800,
                                            background: `linear-gradient(135deg, ${colors.pine} 0%, ${colors.pineDeep} 100%)`,
                                            boxShadow: "0 4px 12px rgba(13,148,136,0.25)",
                                        }}
                                    >
                                        {reportLoading ? "Analyzing Laboratory Data…" : "Review Report"}
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        onClick={handleLoadSampleReport}
                                        startIcon={<ScienceOutlined />}
                                        sx={{
                                            minHeight: 44,
                                            borderRadius: 2.5,
                                            textTransform: "none",
                                            fontWeight: 750,
                                            borderColor: "#CBD5E1",
                                            color: colors.inkSoft,
                                            bgcolor: colors.white,
                                            "&:hover": { borderColor: colors.pine, bgcolor: "#F0FDFA" },
                                        }}
                                    >
                                        Try Sample Blood Report
                                    </Button>

                                    {reportResult && (
                                        <Button
                                            variant="text"
                                            onClick={() => {
                                                setReportFile(null);
                                                setReportResult(null);
                                                setReportError("");
                                                setReportFilter("all");
                                            }}
                                            startIcon={<DeleteOutlineOutlined />}
                                            sx={{
                                                minHeight: 44,
                                                borderRadius: 2.5,
                                                textTransform: "none",
                                                fontWeight: 700,
                                                color: colors.slate,
                                            }}
                                        >
                                            Reset
                                        </Button>
                                    )}
                                </Stack>
                            </Stack>
                        </Box>

                        {reportError && (
                            <Alert severity="error" sx={{ mt: 2.5, borderRadius: 2.5 }} onClose={() => setReportError("")}>
                                {reportError}
                            </Alert>
                        )}

                        {/* EXTRACTED REPORT DASHBOARD */}
                        {reportResult && (() => {
                            const totalTests = (reportResult.tests || []).length;
                            const abnormalTests = (reportResult.tests || []).filter(
                                (t) => (t.status || "").toLowerCase().includes("high") || (t.status || "").toLowerCase().includes("low")
                            ).length;
                            const normalTests = (reportResult.tests || []).filter(
                                (t) => (t.status || "").toLowerCase().includes("normal")
                            ).length;

                            const filteredTests = (reportResult.tests || []).filter((test) => {
                                if (reportFilter === "abnormal") {
                                    const s = (test.status || "").toLowerCase();
                                    return s.includes("high") || s.includes("low");
                                }
                                if (reportFilter === "normal") {
                                    return (test.status || "").toLowerCase().includes("normal");
                                }
                                return true;
                            });

                            const isEmergencyUrgency = (reportResult.reviewPriority || "").toLowerCase().includes("emergency");
                            const isPromptUrgency = (reportResult.reviewPriority || "").toLowerCase().includes("prompt");

                            const priorityColor = isEmergencyUrgency
                                ? "#DC2626"
                                : isPromptUrgency
                                ? "#D97706"
                                : "#16A34A";
                            const priorityBg = isEmergencyUrgency
                                ? "#FEF2F2"
                                : isPromptUrgency
                                ? "#FFFBEB"
                                : "#F0FDF4";
                            const priorityBorder = isEmergencyUrgency
                                ? "#FECACA"
                                : isPromptUrgency
                                ? "#FDE68A"
                                : "#BBF7D0";

                            return (
                                <Box sx={{ mt: 3.5 }}>
                                    {/* 1. REPORT HERO OVERVIEW BANNER */}
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: { xs: 2.5, sm: 3.5 },
                                            borderRadius: 3.5,
                                            border: `1px solid ${priorityBorder}`,
                                            bgcolor: priorityBg,
                                            mb: 3,
                                            borderLeft: `6px solid ${priorityColor}`,
                                        }}
                                    >
                                        <Stack
                                            direction={{ xs: "column", md: "row" }}
                                            justifyContent="space-between"
                                            alignItems={{ xs: "flex-start", md: "center" }}
                                            spacing={2}
                                            mb={2}
                                        >
                                            <Box>
                                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" mb={0.5}>
                                                    <Typography fontSize={20} fontWeight={900} color={colors.ink}>
                                                        {reportResult.reportType}
                                                    </Typography>
                                                    <Chip
                                                        label={reportResult.reviewPriority}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: priorityColor,
                                                            color: colors.white,
                                                            fontWeight: 850,
                                                            fontSize: 11.5,
                                                            height: 24,
                                                        }}
                                                    />
                                                </Stack>
                                                <Typography fontSize={13} color={colors.slate} fontWeight={600}>
                                                    File: <strong>{reportResult.fileName}</strong> • Report Date: <strong>{reportResult.reportDate || "Not Stated"}</strong>
                                                </Typography>
                                            </Box>

                                            <Button
                                                variant="contained"
                                                onClick={() => navigate("/doctors")}
                                                endIcon={<ArrowForwardRounded />}
                                                sx={{
                                                    borderRadius: 2.5,
                                                    bgcolor: colors.ink,
                                                    color: colors.white,
                                                    fontWeight: 750,
                                                    textTransform: "none",
                                                    fontSize: 13,
                                                    px: 2.2,
                                                    py: 1,
                                                    whiteSpace: "nowrap",
                                                    "&:hover": { bgcolor: colors.navy },
                                                }}
                                            >
                                                Consult Specialist
                                            </Button>
                                        </Stack>

                                        <Typography fontSize={14} color={colors.ink} lineHeight={1.65}>
                                            {reportResult.overview}
                                        </Typography>

                                        {reportResult.priorityExplanation && (
                                            <Typography fontSize={13} color={colors.slate} mt={1} fontStyle="italic">
                                                <strong>Clinical Evaluation:</strong> {reportResult.priorityExplanation}
                                            </Typography>
                                        )}
                                    </Paper>

                                    {/* 2. 4 HIGH-IMPACT METRIC CARDS */}
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                                            gap: 2,
                                            mb: 3,
                                        }}
                                    >
                                        <Card
                                            elevation={0}
                                            sx={{
                                                p: 2.2,
                                                borderRadius: 3,
                                                border: `1px solid ${colors.hairline}`,
                                                bgcolor: colors.white,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 2,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 46,
                                                    height: 46,
                                                    borderRadius: 2.5,
                                                    bgcolor: "#EFF6FF",
                                                    border: "1px solid #BFDBFE",
                                                    display: "grid",
                                                    placeItems: "center",
                                                    color: "#2563EB",
                                                }}
                                            >
                                                <BiotechOutlined sx={{ fontSize: 24 }} />
                                            </Box>
                                            <Box>
                                                <Typography fontSize={22} fontWeight={850} color={colors.ink} lineHeight={1}>
                                                    {totalTests}
                                                </Typography>
                                                <Typography fontSize={12} color={colors.slate} fontWeight={600} mt={0.4}>
                                                    Biomarkers Tested
                                                </Typography>
                                            </Box>
                                        </Card>

                                        <Card
                                            elevation={0}
                                            sx={{
                                                p: 2.2,
                                                borderRadius: 3,
                                                border: `1px solid ${abnormalTests > 0 ? "#FED7AA" : colors.hairline}`,
                                                bgcolor: abnormalTests > 0 ? "#FFF7ED" : colors.white,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 2,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 46,
                                                    height: 46,
                                                    borderRadius: 2.5,
                                                    bgcolor: abnormalTests > 0 ? "#FFEDD5" : "#F8FAFC",
                                                    border: `1px solid ${abnormalTests > 0 ? "#FDBA74" : "#E2E8F0"}`,
                                                    display: "grid",
                                                    placeItems: "center",
                                                    color: abnormalTests > 0 ? "#EA580C" : colors.slate,
                                                }}
                                            >
                                                <WarningAmberRounded sx={{ fontSize: 24 }} />
                                            </Box>
                                            <Box>
                                                <Typography fontSize={22} fontWeight={850} color={abnormalTests > 0 ? "#C2410C" : colors.ink} lineHeight={1}>
                                                    {abnormalTests}
                                                </Typography>
                                                <Typography fontSize={12} color={abnormalTests > 0 ? "#9A3412" : colors.slate} fontWeight={600} mt={0.4}>
                                                    Out of Normal Range
                                                </Typography>
                                            </Box>
                                        </Card>

                                        <Card
                                            elevation={0}
                                            sx={{
                                                p: 2.2,
                                                borderRadius: 3,
                                                border: `1px solid ${colors.hairline}`,
                                                bgcolor: colors.white,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 2,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 46,
                                                    height: 46,
                                                    borderRadius: 2.5,
                                                    bgcolor: "#F0FDF4",
                                                    border: "1px solid #BBF7D0",
                                                    display: "grid",
                                                    placeItems: "center",
                                                    color: "#16A34A",
                                                }}
                                            >
                                                <CheckCircleOutlined sx={{ fontSize: 24 }} />
                                            </Box>
                                            <Box>
                                                <Typography fontSize={22} fontWeight={850} color={colors.ink} lineHeight={1}>
                                                    {normalTests}
                                                </Typography>
                                                <Typography fontSize={12} color={colors.slate} fontWeight={600} mt={0.4}>
                                                    Normal & Balanced
                                                </Typography>
                                            </Box>
                                        </Card>

                                        <Card
                                            elevation={0}
                                            sx={{
                                                p: 2.2,
                                                borderRadius: 3,
                                                border: `1px solid ${colors.hairline}`,
                                                bgcolor: colors.white,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 2,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 46,
                                                    height: 46,
                                                    borderRadius: 2.5,
                                                    bgcolor: priorityBg,
                                                    border: `1px solid ${priorityBorder}`,
                                                    display: "grid",
                                                    placeItems: "center",
                                                    color: priorityColor,
                                                }}
                                            >
                                                <HealthAndSafetyOutlined sx={{ fontSize: 24 }} />
                                            </Box>
                                            <Box>
                                                <Typography fontSize={14.5} fontWeight={850} color={priorityColor} lineHeight={1.2}>
                                                    {reportResult.reviewPriority}
                                                </Typography>
                                                <Typography fontSize={12} color={colors.slate} fontWeight={600} mt={0.4}>
                                                    Triage Recommendation
                                                </Typography>
                                            </Box>
                                        </Card>
                                    </Box>

                                    {/* 3. TABLE FILTER CONTROLS */}
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            mb: 1.5,
                                            flexWrap: "wrap",
                                            gap: 1.5,
                                        }}
                                    >
                                        <Stack direction="row" spacing={1}>
                                            <Chip
                                                label={`All Tests (${totalTests})`}
                                                clickable
                                                onClick={() => setReportFilter("all")}
                                                sx={{
                                                    fontWeight: 800,
                                                    fontSize: 12.5,
                                                    bgcolor: reportFilter === "all" ? colors.ink : "#F1F5F9",
                                                    color: reportFilter === "all" ? colors.white : colors.slate,
                                                    "&:hover": { bgcolor: reportFilter === "all" ? colors.ink : "#E2E8F0" },
                                                }}
                                            />
                                            <Chip
                                                label={`Flagged Abnormal (${abnormalTests})`}
                                                clickable
                                                onClick={() => setReportFilter("abnormal")}
                                                sx={{
                                                    fontWeight: 800,
                                                    fontSize: 12.5,
                                                    bgcolor: reportFilter === "abnormal" ? "#EA580C" : "#FFF7ED",
                                                    color: reportFilter === "abnormal" ? colors.white : "#C2410C",
                                                    border: "1px solid #FED7AA",
                                                    "&:hover": { bgcolor: reportFilter === "abnormal" ? "#C2410C" : "#FFEDD5" },
                                                }}
                                            />
                                            <Chip
                                                label={`Normal Range (${normalTests})`}
                                                clickable
                                                onClick={() => setReportFilter("normal")}
                                                sx={{
                                                    fontWeight: 800,
                                                    fontSize: 12.5,
                                                    bgcolor: reportFilter === "normal" ? "#16A34A" : "#F0FDF4",
                                                    color: reportFilter === "normal" ? colors.white : "#15803D",
                                                    border: "1px solid #BBF7D0",
                                                    "&:hover": { bgcolor: reportFilter === "normal" ? "#15803D" : "#DCFCE7" },
                                                }}
                                            />
                                        </Stack>

                                        <Typography fontSize={12.5} color={colors.slate} fontWeight={600}>
                                            Displaying {filteredTests.length} of {totalTests} parameters
                                        </Typography>
                                    </Box>

                                    {/* 4. FULL-WIDTH LAB RESULTS TABLE */}
                                    <TableContainer
                                        sx={{
                                            border: `1px solid ${colors.hairline}`,
                                            borderRadius: 3.5,
                                            width: "100%",
                                            overflowX: "auto",
                                            bgcolor: colors.white,
                                            mb: 3.5,
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                                        }}
                                    >
                                        <Table sx={{ minWidth: "100%" }} aria-label="Extracted clinical report results">
                                            <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 850, fontSize: 12.5, color: colors.ink, py: 1.8, minWidth: 200 }}>
                                                        BIOMARKER / TEST PARAMETER
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 850, fontSize: 12.5, color: colors.ink, py: 1.8, minWidth: 140 }}>
                                                        MEASURED RESULT
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 850, fontSize: 12.5, color: colors.ink, py: 1.8, minWidth: 150 }}>
                                                        STANDARD REFERENCE
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 850, fontSize: 12.5, color: colors.ink, py: 1.8, minWidth: 120 }}>
                                                        CLINICAL STATUS
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 850, fontSize: 12.5, color: colors.ink, py: 1.8 }}>
                                                        CLINICAL INTERPRETATION & NOTES
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {filteredTests.map((test, index) => {
                                                    const isHigh = (test.status || "").toLowerCase().includes("high");
                                                    const isLow = (test.status || "").toLowerCase().includes("low");
                                                    const isNormal = (test.status || "").toLowerCase().includes("normal");

                                                    const statusBadgeColor = isHigh
                                                        ? "#DC2626"
                                                        : isLow
                                                        ? "#D97706"
                                                        : isNormal
                                                        ? "#16A34A"
                                                        : colors.slate;

                                                    const statusBadgeBg = isHigh
                                                        ? "#FEF2F2"
                                                        : isLow
                                                        ? "#FFFBEB"
                                                        : isNormal
                                                        ? "#F0FDF4"
                                                        : "#F1F5F9";

                                                    const statusBadgeBorder = isHigh
                                                        ? "#FECACA"
                                                        : isLow
                                                        ? "#FDE68A"
                                                        : isNormal
                                                        ? "#BBF7D0"
                                                        : "#E2E8F0";

                                                    return (
                                                        <TableRow
                                                            key={`${test.testName}-${index}`}
                                                            hover
                                                            sx={{
                                                                bgcolor: isHigh || isLow ? "rgba(254, 242, 242, 0.25)" : "inherit",
                                                                "&:last-child td, &:last-child th": { border: 0 },
                                                            }}
                                                        >
                                                            <TableCell sx={{ fontWeight: 800, fontSize: 14, color: colors.ink }}>
                                                                {test.testName}
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: 850, fontSize: 14.5, color: isHigh || isLow ? statusBadgeColor : colors.ink }}>
                                                                {test.result}{test.unit ? ` ${test.unit}` : ""}
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: 13, color: colors.slate, fontWeight: 600 }}>
                                                                {test.referenceRange || "Standard reference"}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    size="small"
                                                                    label={test.status || "Evaluated"}
                                                                    sx={{
                                                                        fontWeight: 850,
                                                                        fontSize: 11,
                                                                        color: statusBadgeColor,
                                                                        bgcolor: statusBadgeBg,
                                                                        border: `1px solid ${statusBadgeBorder}`,
                                                                        height: 24,
                                                                        minWidth: 64,
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: 13, color: colors.slate, lineHeight: 1.55 }}>
                                                                {test.interpretation}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    {/* 5. SIDE-BY-SIDE CLINICAL INSIGHTS */}
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                                            gap: 2.5,
                                            mb: 3,
                                        }}
                                    >
                                        {/* KEY FINDINGS */}
                                        <Card
                                            elevation={0}
                                            sx={{
                                                p: 3,
                                                borderRadius: 3.5,
                                                border: `1px solid ${colors.hairline}`,
                                                bgcolor: colors.canvas,
                                            }}
                                        >
                                            <Stack direction="row" spacing={1.2} alignItems="center" mb={2}>
                                                <FactCheckOutlined sx={{ color: colors.pine, fontSize: 24 }} />
                                                <Typography fontSize={16} fontWeight={850} color={colors.ink}>
                                                    Key Clinical Findings
                                                </Typography>
                                            </Stack>

                                            {(reportResult.keyFindings || []).length > 0 ? (
                                                <Stack spacing={1.2}>
                                                    {reportResult.keyFindings.map((item, idx) => (
                                                        <Box
                                                            key={idx}
                                                            sx={{
                                                                p: 1.5,
                                                                borderRadius: 2.5,
                                                                bgcolor: colors.white,
                                                                border: `1px solid ${colors.hairline}`,
                                                                display: "flex",
                                                                alignItems: "flex-start",
                                                                gap: 1.2,
                                                            }}
                                                        >
                                                            <CheckCircleOutlineRounded sx={{ fontSize: 18, color: colors.pine, mt: "2px", flexShrink: 0 }} />
                                                            <Typography fontSize={13} color={colors.ink} lineHeight={1.5}>
                                                                {item}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            ) : (
                                                <Typography fontSize={13} color={colors.slate}>
                                                    No specific clinical abnormalities were highlighted.
                                                </Typography>
                                            )}
                                        </Card>

                                        {/* CLINICIAN DISCUSSION */}
                                        <Card
                                            elevation={0}
                                            sx={{
                                                p: 3,
                                                borderRadius: 3.5,
                                                border: `1px solid ${colors.hairline}`,
                                                bgcolor: colors.canvas,
                                            }}
                                        >
                                            <Stack direction="row" spacing={1.2} alignItems="center" mb={2}>
                                                <QuestionAnswerOutlined sx={{ color: "#2563EB", fontSize: 24 }} />
                                                <Typography fontSize={16} fontWeight={850} color={colors.ink}>
                                                    Questions to Discuss with Your Doctor
                                                </Typography>
                                            </Stack>

                                            {(reportResult.clinicianDiscussion || []).length > 0 ? (
                                                <Stack spacing={1.2}>
                                                    {reportResult.clinicianDiscussion.map((q, idx) => (
                                                        <Box
                                                            key={idx}
                                                            sx={{
                                                                p: 1.5,
                                                                borderRadius: 2.5,
                                                                bgcolor: colors.white,
                                                                border: `1px solid ${colors.hairline}`,
                                                                display: "flex",
                                                                alignItems: "flex-start",
                                                                gap: 1.2,
                                                            }}
                                                        >
                                                            <Typography
                                                                fontSize={12}
                                                                fontWeight={850}
                                                                color="#2563EB"
                                                                sx={{
                                                                    width: 22,
                                                                    height: 22,
                                                                    borderRadius: "50%",
                                                                    bgcolor: "#EFF6FF",
                                                                    display: "grid",
                                                                    placeItems: "center",
                                                                    flexShrink: 0,
                                                                    mt: "1px",
                                                                }}
                                                            >
                                                                {idx + 1}
                                                            </Typography>
                                                            <Typography fontSize={13} color={colors.ink} lineHeight={1.5}>
                                                                {q}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            ) : (
                                                <Typography fontSize={13} color={colors.slate}>
                                                    Share this laboratory result during your regular consultation.
                                                </Typography>
                                            )}
                                        </Card>
                                    </Box>

                                    {/* 6. RECOMMENDED NEXT STEPS & ACTIONS */}
                                    <Box
                                        sx={{
                                            p: 3,
                                            borderRadius: 3.5,
                                            bgcolor: colors.pineSoft,
                                            border: `1px solid rgba(13,148,136,0.25)`,
                                            mb: 2.5,
                                        }}
                                    >
                                        <Stack
                                            direction={{ xs: "column", md: "row" }}
                                            justifyContent="space-between"
                                            alignItems={{ xs: "flex-start", md: "center" }}
                                            spacing={2}
                                        >
                                            <Box sx={{ flex: 1 }}>
                                                <Typography fontSize={14.5} fontWeight={850} color={colors.pineDeep} mb={0.5}>
                                                    Recommended Next Steps & Clinical Navigation:
                                                </Typography>
                                                {(reportResult.nextSteps || []).length > 0 ? (
                                                    <Typography fontSize={13} color={colors.ink} lineHeight={1.6}>
                                                        {reportResult.nextSteps.join(" ")}
                                                    </Typography>
                                                ) : (
                                                    <Typography fontSize={13} color={colors.ink}>
                                                        Consult with your attending physician to interpret these findings alongside your complete medical history.
                                                    </Typography>
                                                )}
                                            </Box>

                                            <Stack direction="row" spacing={1.5} flexWrap="wrap">
                                                <Button
                                                    variant="contained"
                                                    onClick={() => navigate("/doctors")}
                                                    startIcon={<MedicalServicesOutlined />}
                                                    sx={{
                                                        borderRadius: 2.5,
                                                        background: `linear-gradient(135deg, ${colors.pine} 0%, ${colors.pineDeep} 100%)`,
                                                        fontWeight: 800,
                                                        fontSize: 13,
                                                        textTransform: "none",
                                                        px: 2.5,
                                                        py: 1.1,
                                                        boxShadow: "0 4px 12px rgba(13,148,136,0.25)",
                                                    }}
                                                >
                                                    Book Specialist
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    onClick={() => {
                                                        setActiveTab(1);
                                                        setChatInput(`Could you explain my ${reportResult.reportType} findings in detail, specifically the elevated markers?`);
                                                    }}
                                                    startIcon={<ChatBubbleOutlineRounded />}
                                                    sx={{
                                                        borderRadius: 2.5,
                                                        borderColor: colors.pine,
                                                        color: colors.pineDeep,
                                                        bgcolor: colors.white,
                                                        fontWeight: 750,
                                                        fontSize: 13,
                                                        textTransform: "none",
                                                        px: 2.2,
                                                        py: 1.1,
                                                        "&:hover": { bgcolor: colors.white, borderColor: colors.pineDeep },
                                                    }}
                                                >
                                                    Discuss in AI Chat
                                                </Button>
                                            </Stack>
                                        </Stack>
                                    </Box>

                                    {/* 7. MEDICAL DISCLAIMER */}
                                    <Alert severity="warning" sx={{ borderRadius: 2.5, fontSize: 12.5 }}>
                                        <strong>Clinical Safety Notice:</strong> This AI laboratory extraction is generated for informational support only. It does not replace a formal medical diagnosis or confirm health. Please share the original medical laboratory record with a licensed physician for clinical confirmation.
                                    </Alert>
                                </Box>
                            );
                        })()}
                    </CardContent>
                </Card>
            )}
            )}

            {/* TAB 1: INTERACTIVE AI HEALTH CONSULT CHAT */}
            {activeTab === 1 && (
                <Card
                    elevation={0}
                    sx={{
                        border: `1px solid ${colors.hairline}`,
                        borderRadius: 4,
                        bgcolor: colors.white,
                        display: "flex",
                        flexDirection: "column",
                        height: { xs: "calc(100dvh - 180px)", sm: "76vh" },
                        minHeight: { xs: 440, sm: 520 },
                        maxHeight: { xs: "calc(100dvh - 120px)", sm: "none" },
                        boxShadow: "0 6px 24px rgba(0,0,0,0.03)",
                        overflow: "hidden",
                    }}
                >
                    {/* CHAT HEADER */}
                    <Box
                        sx={{
                            px: { xs: 2, sm: 3 },
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
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
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
                            <Box sx={{ minWidth: 0 }}>
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.25, sm: 1 }} alignItems={{ xs: "flex-start", sm: "center" }}>
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
                                            maxWidth: { xs: "calc(100% - 42px)", md: "80%" },
                                            minWidth: 0,
                                            p: { xs: 1.75, sm: 2.5 },
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
