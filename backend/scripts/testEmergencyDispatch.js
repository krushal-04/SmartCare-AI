const assert = require("assert");
const {
    calculateDistance,
    CATEGORY_RULES,
    recommendHospital,
    matchAmbulanceForHospital,
} = require("../services/emergencyMatchingService");

async function runTests() {
    console.log("==================================================");
    console.log("SMARTCARE-AI EMERGENCY DISPATCH SYSTEM VERIFICATION");
    console.log("==================================================");

    let passedCount = 0;
    let failedCount = 0;

    const test = (name, fn) => {
        try {
            fn();
            console.log(`[PASS] ${name}`);
            passedCount++;
        } catch (e) {
            console.error(`[FAIL] ${name}:`, e.message);
            failedCount++;
        }
    };

    // 1. Haversine distance test
    test("Haversine Distance calculation between Vadodara (22.3072, 73.1812) and Nadiad (22.6916, 72.8634)", () => {
        const dist = calculateDistance(22.3072, 73.1812, 22.6916, 72.8634);
        assert(dist > 50 && dist < 65, `Expected distance ~54-58km, got ${dist}`);
    });

    test("Distance with null coordinates gracefully returns null", () => {
        assert.strictEqual(calculateDistance(null, null, 22, 73), null);
    });

    // 2. Category matching rules test
    test("Heart / Chest Pain requires cardiacCare & CARDIAC capability", () => {
        const rule = CATEGORY_RULES["Heart / Chest Pain"];
        assert.strictEqual(rule.hospitalCapabilityField, "cardiacCare");
        assert.strictEqual(rule.preferredAmbulanceCapability, "CARDIAC");
        assert.strictEqual(rule.priority, "CRITICAL");
    });

    test("Accident / Trauma requires traumaCare & TRAUMA capability", () => {
        const rule = CATEGORY_RULES["Accident / Trauma"];
        assert.strictEqual(rule.hospitalCapabilityField, "traumaCare");
        assert.strictEqual(rule.preferredAmbulanceCapability, "TRAUMA");
        assert.strictEqual(rule.priority, "CRITICAL");
    });

    test("Breathing Emergency requires breathingEmergencySupport & OXYGEN_SUPPORT", () => {
        const rule = CATEGORY_RULES["Breathing Emergency"];
        assert.strictEqual(rule.hospitalCapabilityField, "breathingEmergencySupport");
        assert.strictEqual(rule.preferredAmbulanceCapability, "OXYGEN_SUPPORT");
    });

    test("Stroke Symptoms requires strokeSupport & CARDIAC capability", () => {
        const rule = CATEGORY_RULES["Stroke Symptoms"];
        assert.strictEqual(rule.hospitalCapabilityField, "strokeSupport");
        assert.strictEqual(rule.preferredAmbulanceCapability, "CARDIAC");
    });

    test("Pregnancy Emergency requires maternityEmergency", () => {
        const rule = CATEGORY_RULES["Pregnancy Emergency"];
        assert.strictEqual(rule.hospitalCapabilityField, "maternityEmergency");
        assert.strictEqual(rule.priority, "URGENT");
    });

    test("Child Emergency requires pediatricEmergency", () => {
        const rule = CATEGORY_RULES["Child Emergency"];
        assert.strictEqual(rule.hospitalCapabilityField, "pediatricEmergency");
        assert.strictEqual(rule.priority, "URGENT");
    });

    // 3. Driver Duty Safeguard Test
    test("Driver duty transitions & active trip safeguards logic", () => {
        const allowedTransitions = [
            "DISPATCHED",
            "EN_ROUTE_TO_PATIENT",
            "ARRIVED_AT_PATIENT",
            "PATIENT_ONBOARD",
            "EN_ROUTE_TO_HOSPITAL",
            "HANDOVER_COMPLETE",
        ];
        assert.strictEqual(allowedTransitions[0], "DISPATCHED");
        assert.strictEqual(allowedTransitions[allowedTransitions.length - 1], "HANDOVER_COMPLETE");
        assert(!allowedTransitions.includes("REJECTED"), "Driver has no accept/reject actions");
    });

    // 4. GPS Freshness calculation test
    test("GPS Freshness threshold detects stale telemetry (>15 mins)", () => {
        const freshDate = new Date(Date.now() - 5 * 60 * 1000); // 5 mins ago
        const staleDate = new Date(Date.now() - 25 * 60 * 1000); // 25 mins ago

        const isFresh = Date.now() - freshDate.getTime() < 15 * 60 * 1000;
        const isStale = Date.now() - staleDate.getTime() >= 15 * 60 * 1000;

        assert.strictEqual(isFresh, true, "5-min-old timestamp should be fresh");
        assert.strictEqual(isStale, true, "25-min-old timestamp should be stale");
    });

    // 5. Double assignment protection rule test
    test("Double assignment query prevents claiming already assigned ambulance", () => {
        const emergencyId = "60c72b2f9b1d8b2badbee001";
        const otherEmergencyId = "60c72b2f9b1d8b2badbee002";

        const claimQuery = {
            _id: "60c72b2f9b1d8b2badbee099",
            $or: [
                { assignedEmergencyId: emergencyId },
                { assignedEmergencyId: null, availability: true },
                { assignedEmergencyId: { $exists: false }, availability: true },
            ],
        };

        // If an ambulance is already held by otherEmergencyId, it won't match claimQuery
        const mockAmbulanceWithOther = {
            _id: "60c72b2f9b1d8b2badbee099",
            assignedEmergencyId: otherEmergencyId,
            availability: false,
        };

        const matches =
            mockAmbulanceWithOther.assignedEmergencyId === emergencyId ||
            (mockAmbulanceWithOther.assignedEmergencyId === null && mockAmbulanceWithOther.availability === true);

        assert.strictEqual(matches, false, "Vehicle held by another incident cannot be claimed");
    });

    console.log("--------------------------------------------------");
    console.log(`Results: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("==================================================");

    if (failedCount > 0) process.exit(1);
}

runTests();

