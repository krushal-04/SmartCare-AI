const Hospital = require("../models/Hospital");
const Ambulance = require("../models/Ambulance");
const User = require("../models/User");

// Haversine distance in kilometers
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
};

// Map emergency category to required hospital capabilities & ambulance capabilities
const CATEGORY_RULES = {
    "Heart / Chest Pain": {
        hospitalCapabilityField: "cardiacCare",
        label: "Cardiac Care",
        priority: "CRITICAL",
        preferredAmbulanceCapability: "CARDIAC",
        fallbackAmbulanceCapabilities: ["OXYGEN_SUPPORT", "BASIC"],
    },
    "Accident / Trauma": {
        hospitalCapabilityField: "traumaCare",
        label: "Trauma Care",
        priority: "CRITICAL",
        preferredAmbulanceCapability: "TRAUMA",
        fallbackAmbulanceCapabilities: ["BASIC", "OXYGEN_SUPPORT"],
    },
    "Breathing Emergency": {
        hospitalCapabilityField: "breathingEmergencySupport",
        label: "Breathing Support",
        priority: "CRITICAL",
        preferredAmbulanceCapability: "OXYGEN_SUPPORT",
        fallbackAmbulanceCapabilities: ["CARDIAC", "BASIC"],
    },
    "Stroke Symptoms": {
        hospitalCapabilityField: "strokeSupport",
        label: "Stroke Support",
        priority: "CRITICAL",
        preferredAmbulanceCapability: "CARDIAC",
        fallbackAmbulanceCapabilities: ["BASIC", "OXYGEN_SUPPORT"],
    },
    "Severe Bleeding": {
        hospitalCapabilityField: "traumaCare",
        label: "Trauma & Hemorrhage Care",
        priority: "CRITICAL",
        preferredAmbulanceCapability: "TRAUMA",
        fallbackAmbulanceCapabilities: ["BASIC", "OXYGEN_SUPPORT"],
    },
    "Pregnancy Emergency": {
        hospitalCapabilityField: "maternityEmergency",
        label: "Maternity Emergency",
        priority: "URGENT",
        preferredAmbulanceCapability: "BASIC",
        fallbackAmbulanceCapabilities: ["OXYGEN_SUPPORT"],
    },
    "Child Emergency": {
        hospitalCapabilityField: "pediatricEmergency",
        label: "Pediatric Emergency",
        priority: "URGENT",
        preferredAmbulanceCapability: "BASIC",
        fallbackAmbulanceCapabilities: ["OXYGEN_SUPPORT"],
    },
    "Unconscious Person": {
        hospitalCapabilityField: null,
        label: "Emergency Intensive Care",
        priority: "CRITICAL",
        preferredAmbulanceCapability: "CARDIAC",
        fallbackAmbulanceCapabilities: ["OXYGEN_SUPPORT", "BASIC"],
    },
    "Other Emergency": {
        hospitalCapabilityField: null,
        label: "Emergency Care",
        priority: "HIGH",
        preferredAmbulanceCapability: "BASIC",
        fallbackAmbulanceCapabilities: ["OXYGEN_SUPPORT", "CARDIAC", "TRAUMA"],
    },
};

/**
 * Recommends the best capable hospital for an emergency request
 */
const recommendHospital = async ({ emergencyCategory, latitude, longitude }) => {
    const rule = CATEGORY_RULES[emergencyCategory] || CATEGORY_RULES["Other Emergency"];
    const requiredField = rule.hospitalCapabilityField;

    // Query active emergency hospitals
    const hospitals = await Hospital.find({
        $or: [
            { "emergencyCapabilities.emergencyOpen": true },
            { emergencyAvailable: true },
        ],
    }).lean();

    if (!hospitals || hospitals.length === 0) {
        return {
            recommendedHospital: null,
            alternativeHospitals: [],
            rule,
        };
    }

    // Score each hospital:
    // 1. Capability match (+1000 points)
    // 2. Proximity: higher points for closer distance
    const scoredHospitals = hospitals.map((hosp) => {
        let score = 0;
        const capabilities = hosp.emergencyCapabilities || {};
        const isEmergencyOpen = capabilities.emergencyOpen !== false && hosp.emergencyAvailable !== false;

        if (isEmergencyOpen) score += 500;

        let hasExactCapability = false;
        if (requiredField && capabilities[requiredField] === true) {
            score += 1000;
            hasExactCapability = true;
        }

        let distanceKm = null;
        if (latitude != null && longitude != null && hosp.latitude != null && hosp.longitude != null) {
            distanceKm = calculateDistance(
                Number(latitude),
                Number(longitude),
                Number(hosp.latitude),
                Number(hosp.longitude)
            );
            if (distanceKm != null) {
                // Deduct 10 points per km to prioritize closer facilities
                score -= distanceKm * 10;
            }
        }

        return {
            ...hosp,
            score,
            hasExactCapability,
            distanceKm,
        };
    });

    // Sort descending by score
    scoredHospitals.sort((a, b) => b.score - a.score);

    const recommendedHospital = scoredHospitals[0] || null;
    const alternativeHospitals = scoredHospitals.slice(1, 5);

    return {
        recommendedHospital,
        alternativeHospitals,
        rule,
    };
};

/**
 * Recommends the best available ambulance from a specific hospital's fleet
 */
const matchAmbulanceForHospital = async (hospitalId, emergencyCategory, patientLat, patientLon) => {
    const rule = CATEGORY_RULES[emergencyCategory] || CATEGORY_RULES["Other Emergency"];

    // Find all verified/available ambulances owned by this hospital
    const ambulances = await Ambulance.find({
        hospitalId,
        verificationStatus: { $ne: "SUSPENDED" },
        $or: [
            { availabilityStatus: "AVAILABLE" },
            { status: "Available", availability: true },
        ],
    })
        .populate("driverId", "fullName phone dutyStatus currentLocation lastDutyStartAt")
        .lean();

    if (!ambulances || ambulances.length === 0) {
        return {
            recommendedAmbulance: null,
            alternativeAmbulances: [],
            rule,
        };
    }

    const scored = ambulances.map((amb) => {
        let score = 0;
        const capabilities = Array.isArray(amb.capability) ? amb.capability : [amb.capability || "BASIC"];

        // Capability match
        if (rule.preferredAmbulanceCapability && capabilities.includes(rule.preferredAmbulanceCapability)) {
            score += 100;
        } else if (
            rule.fallbackAmbulanceCapabilities &&
            rule.fallbackAmbulanceCapabilities.some((c) => capabilities.includes(c))
        ) {
            score += 50;
        }

        // Driver on-duty bonus
        const isDriverOnDuty = amb.driverId?.dutyStatus === "ON_DUTY";
        if (isDriverOnDuty) {
            score += 50;
        }

        // GPS freshness
        const lastUpdated = amb.currentLocation?.updatedAt ? new Date(amb.currentLocation.updatedAt) : null;
        const isGpsFresh = lastUpdated && Date.now() - lastUpdated.getTime() < 15 * 60 * 1000;
        if (isGpsFresh) {
            score += 30;
        }

        // Distance from patient
        let distanceKm = null;
        const ambLat = amb.currentLocation?.latitude;
        const ambLon = amb.currentLocation?.longitude;
        if (patientLat != null && patientLon != null && ambLat != null && ambLon != null) {
            distanceKm = calculateDistance(patientLat, patientLon, ambLat, ambLon);
            if (distanceKm != null) {
                score -= distanceKm * 5;
            }
        }

        return {
            ...amb,
            score,
            distanceKm,
            isGpsFresh,
            isDriverOnDuty,
            isRecommended: false,
        };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
        scored[0].isRecommended = true;
    }

    return {
        recommendedAmbulance: scored[0] || null,
        alternativeAmbulances: scored.slice(1),
        rule,
    };
};

module.exports = {
    calculateDistance,
    CATEGORY_RULES,
    recommendHospital,
    matchAmbulanceForHospital,
};

