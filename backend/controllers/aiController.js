const {
    generateGeminiResponse,
} = require("../services/geminiService");

const buildMedicalSystemPrompt = () => {
    return `
You are SmartCare AI, an AI healthcare assistant
inside a hospital management platform.

Your job is to provide general healthcare information,
help users understand symptoms, suggest relevant medical
departments, explain medical terminology, and guide users
toward appropriate professional care.

IMPORTANT SAFETY RULES:

1. Do not claim to provide a definitive diagnosis.
2. Do not prescribe medication or dosage.
3. Do not tell the user to stop or start prescription
   medication.
4. Do not replace a doctor or emergency service.
5. If the user describes potentially life-threatening
   symptoms, clearly advise immediate emergency medical
   attention.
6. Be calm, clear and easy to understand.
7. Do not unnecessarily frighten the user.
8. Ask relevant follow-up questions when useful.
9. Keep responses suitable for a healthcare application.
10. When discussing symptoms, explain possible categories
    rather than claiming certainty.

SmartCare healthcare routing departments include:

- Cardiology
- Neurology
- Dermatology
- Orthopedics
- Pediatrics
- ENT
- Ophthalmology
- General Medicine
- Gynecology
- Gastroenterology
- Pulmonology
- Endocrinology
- Psychiatry
- Urology

When appropriate, recommend one or more departments
that the user can explore.

Always include this reminder when discussing symptoms:

"This information is for general guidance and healthcare
routing only. It is not a medical diagnosis."
`;
};

const buildChatAssistantPrompt = () => {
    return `You are SmartCare AI, an empathetic, highly skilled, and compassionate Clinical Health Assistant.
You converse directly with patients to help them understand medical conditions, symptoms, wellness strategies, test procedures, and health guidance.

CRITICAL INSTRUCTIONS FOR EXCELLENT MEDICAL CONVERSATION:
1. Thoroughness & Depth: Provide clear, well-structured, insightful, and comprehensive answers. Do not give shallow or robotic one-liner answers. Explain the "why" and "how" behind medical phenomena (pathophysiology, common causes, physiological mechanisms) in accessible, patient-friendly language.
2. Structure & Readability: Use clear paragraphs, bold highlights for key concepts, and neat bullet points where appropriate (e.g. causes, red flags, practical self-care steps, questions for their clinician).
3. Empathetic & Natural Tone: Speak warmly like a trusted medical practitioner who genuinely listens to the patient. Acknowledge the user's specific concern, validate how they might be feeling, and address their exact question directly before providing broader context.
4. Comprehensive Coverage:
   - Direct explanation/answer to the user's question.
   - Primary and secondary clinical factors or causes.
   - Practical, safe home comfort measures or first aid (where appropriate).
   - "Red Flags" or warning symptoms that require urgent medical attention.
   - Typical diagnostic tests or clinical evaluations physicians perform (e.g., blood tests, imaging, physical exams) and what they evaluate.
5. Conversational Continuity: Pay close attention to previous messages in the conversation to provide relevant, context-aware answers without unnecessarily repeating previous information.
6. Safety & Boundaries: Provide educational and clinical insights without claiming to give a definitive binding diagnosis or prescribing prescription drugs/dosages. If symptoms sound life-threatening (e.g. crushing chest pain, signs of stroke, acute anaphylaxis), firmly advise emergency services.

Never refer to yourself as Gemini or a generic language model. You are SmartCare AI Clinical Health Assistant.`;
};

exports.chatWithGemini =
    async (req, res) => {
        try {
            const {
                message,
                history = [],
            } = req.body;

            if (
                !message ||
                !message.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Please enter a message.",
                });
            }

            /*
             * Keep history small enough for
             * normal project usage.
             */
            const safeHistory =
                Array.isArray(history)
                    ? history
                          .slice(-10)
                          .filter(
                              (item) =>
                                  item &&
                                  typeof item.content ===
                                      "string" &&
                                  [
                                      "user",
                                      "assistant",
                                  ].includes(
                                      item.role
                                  )
                          )
                    : [];

            let conversation =
                "";

            for (
                const item of safeHistory
            ) {
                conversation +=
                    `\n${item.role.toUpperCase()}: ${item.content}\n`;
            }

            const prompt = `
${buildChatAssistantPrompt()}

CONVERSATION HISTORY:
${conversation || "No previous history."}

PATIENT INQUIRY:
${message.trim()}

Provide a comprehensive, empathetic, and beautifully structured clinical response:
`;

            const answer =
                await generateGeminiResponse(
                    prompt
                );

            res.status(200).json({
                success: true,
                answer,
                model: "SmartCare AI",
            });
        } catch (error) {
            console.error(
                "SmartCare chat error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to connect to SmartCare AI right now.",
            });
        }
    };

exports.analyzeSymptoms =
    async (req, res) => {
        try {
            const {
                symptoms,
            } = req.body;

            if (
                !symptoms ||
                !symptoms.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Please describe your symptoms.",
                });
            }

            const prompt = `
${buildMedicalSystemPrompt()}

Analyze the following symptoms only for
healthcare routing and general guidance:

"${symptoms.trim()}"

Return the response in exactly this structure:

Summary:
[short summary]

Possible Departments:
[list relevant departments]

Urgency:
[Routine / Prompt medical assessment / Emergency attention]

Why:
[brief explanation]

Next Step:
[practical healthcare action]

Important:
This information is for general guidance and healthcare
routing only. It is not a medical diagnosis.
`;

            const answer = await generateGeminiResponse(prompt);

            // Parse structured fields for frontend consumption
            const deptsList = [
                "Cardiology", "Neurology", "Dermatology", "Orthopedics", "Pediatrics",
                "ENT", "Ophthalmology", "General Medicine", "Gynecology", "Gastroenterology",
                "Pulmonology", "Endocrinology", "Psychiatry", "Urology"
            ];

            const matchedDepts = deptsList.filter(d => 
                new RegExp(`\\b${d}\\b`, "i").test(answer)
            );

            const departments = matchedDepts.length > 0 ? matchedDepts : ["General Medicine"];

            const lower = answer.toLowerCase();
            let urgency = "Routine consultation";
            if (lower.includes("emergency attention") || lower.includes("immediate emergency") || lower.includes("life-threatening")) {
                urgency = "Emergency attention - Seek immediate emergency medical care";
            } else if (lower.includes("prompt") || lower.includes("urgent") || lower.includes("soon")) {
                urgency = "Prompt medical assessment recommended";
            }

            const sumMatch = answer.match(/Summary:\s*([^\n]+(?:\n[^\n]+)?)/i);
            const whyMatch = answer.match(/Why:\s*([^\n]+(?:\n[^\n]+)?)/i);
            const nextMatch = answer.match(/Next Step:\s*([^\n]+(?:\n[^\n]+)?)/i);

            const recommendation = {
                summary: sumMatch ? sumMatch[1].trim() : "Healthcare symptom assessment completed.",
                departments,
                urgency,
                why: whyMatch ? whyMatch[1].trim() : "Based on clinical symptom routing patterns.",
                nextStep: nextMatch ? nextMatch[1].trim() : "Book a consultation with a qualified doctor in the recommended department.",
                message: answer,
            };

            res.status(200).json({
                success: true,
                answer,
                recommendation,
                model: "SmartCare AI",
            });
        } catch (error) {
            console.error(
                "SmartCare symptom analysis error:",
                error
            );

            res.status(500).json({
                success: false,
                message: error.message || "Unable to analyze symptoms with SmartCare AI.",
            });
        }
    };

const parseReportJson = (answer) => {
    const candidate = String(answer || "")
        .replace(/^\s*```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();
    const parsed = JSON.parse(candidate);
    const statuses = ["Normal", "High", "Low", "Unable to Determine"];
    const list = (value) => Array.isArray(value)
        ? value.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim()).slice(0, 8)
        : [];
    const tests = Array.isArray(parsed.tests) ? parsed.tests.map((test) => ({
        testName: typeof test?.testName === "string" ? test.testName.trim() : "",
        result: typeof test?.result === "string" ? test.result.trim() : "Not stated",
        unit: typeof test?.unit === "string" ? test.unit.trim() : "",
        referenceRange: typeof test?.referenceRange === "string" ? test.referenceRange.trim() : "Not stated",
        status: statuses.includes(test?.status) ? test.status : "Unable to Determine",
        interpretation: typeof test?.interpretation === "string" ? test.interpretation.trim() : "The report does not provide enough information for an AI comparison.",
    })).filter((test) => test.testName) : [];

    return {
        reportDate: typeof parsed.reportDate === "string" && parsed.reportDate.trim() ? parsed.reportDate.trim() : "Not stated",
        reportType: typeof parsed.reportType === "string" && parsed.reportType.trim() ? parsed.reportType.trim() : "Medical report",
        overview: typeof parsed.overview === "string" && parsed.overview.trim() ? parsed.overview.trim() : "No reliable overview could be extracted.",
        tests,
        keyFindings: list(parsed.keyFindings),
        clinicianDiscussion: list(parsed.clinicianDiscussion),
        reviewPriority: ["Routine review", "Prompt clinical review", "Emergency attention", "Unable to determine"].includes(parsed.reviewPriority)
            ? parsed.reviewPriority : "Unable to determine",
        priorityExplanation: typeof parsed.priorityExplanation === "string" && parsed.priorityExplanation.trim()
            ? parsed.priorityExplanation.trim() : "The available report information does not establish a review priority.",
        nextSteps: list(parsed.nextSteps),
        extractionStatus: parsed.extractionStatus === "complete" ? "complete" : "unclear",
    };
};

// Reports are read in memory for this request only. They are not added to the
// patient's medical-records store by this endpoint.
exports.analyzeMedicalReport = async (req, res) => {
    try {
        if (!req.file?.buffer) {
            return res.status(400).json({ success: false, message: "Choose a PDF, JPG, or PNG medical report to analyse." });
        }

        const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({ success: false, message: "Only PDF, JPG, and PNG reports are supported." });
        }

        const prompt = `${buildMedicalSystemPrompt()}

Review the attached patient-provided laboratory or medical report. Return ONLY valid JSON, with no markdown or explanatory text, matching this schema:
{
  "reportDate": "date shown in report, or Not stated",
  "reportType": "type of document",
  "overview": "one concise evidence-based overview",
  "tests": [{"testName":"", "result":"", "unit":"", "referenceRange":"", "status":"Normal|High|Low|Unable to Determine", "interpretation":"plain-language, non-diagnostic explanation"}],
  "keyFindings": ["only findings visible in the report"],
  "clinicianDiscussion": ["questions or flagged items to discuss"],
  "reviewPriority": "Routine review|Prompt clinical review|Emergency attention|Unable to determine",
  "priorityExplanation": "brief explanation based only on the visible report",
  "nextSteps": ["safe next steps"],
  "extractionStatus": "complete|unclear"
}

Rules: extract only values, units, ranges, date, and patient-independent findings visible in the file. Never invent missing values or reference ranges. Compare a result only against the reference range stated beside it. If a range, result, unit, or comparison is unclear, use "Not stated" and status "Unable to Determine". Do not diagnose, prescribe medicine, or call the patient healthy. If the document is unreadable or has no reliably readable test entries, use extractionStatus "unclear" and empty tests.`;

        const answer = await generateGeminiResponse(prompt, {
            mime_type: req.file.mimetype === "image/jpg" ? "image/jpeg" : req.file.mimetype,
            data: req.file.buffer.toString("base64"),
        });

        let analysis;
        try {
            analysis = parseReportJson(answer);
        } catch {
            return res.status(422).json({
                success: false,
                message: "We could not reliably read the report. Please upload a clearer PDF or image with visible test values and reference ranges.",
            });
        }

        if (analysis.extractionStatus === "unclear" || analysis.tests.length === 0) {
            return res.status(422).json({
                success: false,
                message: "We could not reliably extract test results from this report. Please upload a clearer report that includes values and reference ranges.",
            });
        }

        return res.status(200).json({
            success: true,
            analysis,
            fileName: req.file.originalname,
        });
    } catch (error) {
        console.error("Medical report analysis failed:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message || "Unable to analyse this report right now.",
        });
    }
};
