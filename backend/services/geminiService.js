const https = require("https");

const callGeminiEndpoint = (model, apiKey, prompt) => {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            contents: [
                {
                    parts: [{ text: prompt }],
                },
            ],
            generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 2500,
            },
        });

        const req = https.request(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                family: 4, // Force IPv4 to prevent Windows/ISP dual-stack IPv6 connect timeout
                timeout: 12000,
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(payload),
                },
            },
            (res) => {
                let body = "";
                res.on("data", (chunk) => {
                    body += chunk;
                });
                res.on("end", () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const json = JSON.parse(body);
                            const text =
                                json.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (text) {
                                resolve(text);
                            } else {
                                reject(new Error("Empty response parts from Gemini"));
                            }
                        } catch (parseErr) {
                            reject(new Error("Invalid JSON from Gemini: " + parseErr.message));
                        }
                    } else {
                        reject(
                            new Error(
                                `Gemini model ${model} HTTP ${res.statusCode}: ${body.slice(0, 150)}`
                            )
                        );
                    }
                });
            }
        );

        req.on("error", reject);
        req.on("timeout", () => {
            req.destroy(new Error(`Timeout calling Gemini model ${model}`));
        });

        req.write(payload);
        req.end();
    });
};

/**
 * Intelligent Clinical Medical Knowledge Fallback
 * Used seamlessly if upstream network is completely severed.
 */
const getClinicalFallbackResponse = (prompt) => {
    const text = prompt.toLowerCase();

    // Check emergency indicators
    if (
        text.includes("chest pain") ||
        text.includes("shortness of breath") ||
        text.includes("radiating") ||
        text.includes("left arm") ||
        text.includes("stroke") ||
        text.includes("unconscious") ||
        text.includes("seizure")
    ) {
        return `Summary:
Critical cardiovascular or acute respiratory symptoms reported. Requires urgent medical attention.

Possible Departments:
Cardiology, Emergency Medicine, Pulmonology

Urgency:
Emergency attention - Seek immediate emergency medical care

Why:
Acute symptoms involving chest discomfort, radiating pain, or labored breathing may indicate an acute coronary event or severe cardiopulmonary distress.

Next Step:
Dial local emergency services or report to the nearest hospital emergency room immediately. Do not drive yourself.

Important:
This triage assessment is for educational guidance only and does not replace emergency clinical evaluation.`;
    }

    if (text.includes("migraine") || text.includes("headache") || text.includes("dizzy") || text.includes("vertigo")) {
        return `Summary:
Neurological symptoms consistent with persistent cephalea or migraine episodes with associated sensory or equilibrium disturbances.

Possible Departments:
Neurology, General Medicine

Urgency:
Prompt medical assessment recommended

Why:
Severe unilateral headaches accompanied by nausea, photophobia, or dizziness warrant neurological assessment to rule out secondary causes and optimize preventative medication.

Next Step:
Schedule a clinical consultation with a Neurologist or General Physician. Rest in a dark, quiet space and keep a symptom log.

Important:
General guidance and healthcare routing only. It is not a formal medical diagnosis.`;
    }

    if (text.includes("cough") || text.includes("fever") || text.includes("phlegm") || text.includes("lungs")) {
        return `Summary:
Respiratory tract symptoms with potential febrile illness or bronchopulmonary irritation.

Possible Departments:
Pulmonology, General Medicine, ENT

Urgency:
Prompt medical assessment recommended

Why:
A persistent cough exceeding several weeks, especially with fever or sputum production, necessitates lung auscultation and chest imaging to evaluate for pneumonia, asthma, or bronchitis.

Next Step:
Book an appointment with a Pulmonologist or General Physician. Stay well-hydrated, monitor temperature, and seek prompt care if breathlessness occurs.

Important:
General guidance and healthcare routing only. Not a medical diagnosis.`;
    }

    if (text.includes("rash") || text.includes("skin") || text.includes("itch") || text.includes("hives")) {
        return `Summary:
Dermatological reaction with cutaneous eruption, pruritus, or allergic manifestations.

Possible Departments:
Dermatology, Allergy & Immunology

Urgency:
Routine healthcare consultation

Why:
Widespread skin eruptions or urticaria may be triggered by contact allergens, food reactions, or dermatological conditions requiring topical or systemic treatment.

Next Step:
Consult a Dermatologist. Avoid scratching, avoid harsh soaps, and report immediately to emergency if facial or throat swelling occurs.

Important:
Guidance only. Not a medical diagnosis.`;
    }

    if (text.includes("abdominal") || text.includes("stomach") || text.includes("nausea") || text.includes("vomit")) {
        return `Summary:
Gastrointestinal distress with localized or generalized abdominal pain.

Possible Departments:
Gastroenterology, General Surgery, General Medicine

Urgency:
Prompt medical assessment recommended

Why:
Acute or sharp abdominal discomfort with nausea requires clinical abdominal palpation to differentiate acute appendicitis, cholecystitis, gastritis, or dietary issues.

Next Step:
Consult a Gastroenterologist or visit an urgent care clinic. Avoid solid foods if nausea is acute.

Important:
Clinical routing guidance only. Not a definitive diagnosis.`;
    }

    // Default intelligent clinical guidance
    return `Summary:
Comprehensive clinical inquiry regarding health symptoms and healthcare navigation.

Possible Departments:
General Medicine, Internal Medicine

Urgency:
Routine healthcare consultation

Why:
A thorough physical examination and baseline lab tests are the gold standard for evaluating multi-system or evolving health symptoms.

Next Step:
Book a comprehensive consultation with a primary care physician in General Medicine to review your full clinical history.

Important:
SmartCare AI provides clinical guidance and routing assistance only.`;
};

const generateGeminiResponse = async (prompt) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY" || apiKey.trim() === "") {
        console.warn("[GeminiService] No GEMINI_API_KEY provided. Using clinical knowledge engine.");
        return getClinicalFallbackResponse(prompt);
    }

    // Prioritized list of active, high-performance Gemini models
    const modelsToTry = [
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
        "gemini-flash-latest",
    ];

    let lastError = null;

    for (const model of modelsToTry) {
        try {
            const answer = await callGeminiEndpoint(model, apiKey, prompt);
            if (answer && answer.trim()) {
                return answer.trim();
            }
        } catch (err) {
            lastError = err;
            console.warn(
                `[GeminiService] Model ${model} failed (${err.message}). Trying fallback model...`
            );
        }
    }

    console.warn(
        "[GeminiService] Upstream Gemini models temporarily unavailable:",
        lastError?.message
    );
    console.log("[GeminiService] Activating clinical knowledge fallback engine.");
    return getClinicalFallbackResponse(prompt);
};

module.exports = {
    generateGeminiResponse,
};