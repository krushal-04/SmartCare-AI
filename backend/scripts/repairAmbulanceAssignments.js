require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Ambulance = require("../models/Ambulance");
const EmergencyRequest = require("../models/EmergencyRequest");

const ACTIVE_STATUSES = new Set(["Requested", "Assigned", "On The Way", "Arrived"]);

async function repairAmbulanceAssignments() {
    await connectDB();

    const candidates = await Ambulance.find({
        assignedEmergencyId: { $exists: true, $ne: null },
        $or: [{ availability: true }, { status: "Available" }],
    });

    let restored = 0;
    let released = 0;

    for (const ambulance of candidates) {
        const emergency = await EmergencyRequest.findById(ambulance.assignedEmergencyId);
        const emergencyUsesThisAmbulance = emergency?.ambulanceId &&
            String(emergency.ambulanceId) === String(ambulance._id);

        if (!emergency || !ACTIVE_STATUSES.has(emergency.status) ||
            (emergency.ambulanceId && !emergencyUsesThisAmbulance)) {
            ambulance.assignedEmergencyId = null;
            ambulance.status = "Available";
            ambulance.availability = true;
            await ambulance.save();
            released += 1;
            continue;
        }

        // If the active emergency has no vehicle reference, restore the missing
        // half of the relationship before locking the ambulance.
        if (!emergency.ambulanceId) {
            emergency.ambulanceId = ambulance._id;
            await emergency.save();
        }

        ambulance.status = ["On The Way", "Arrived"].includes(emergency.status)
            ? "Busy"
            : "Assigned";
        ambulance.availability = false;
        await ambulance.save();
        restored += 1;
    }

    console.log(`Ambulance repair complete: ${restored} active assignment(s) restored, ${released} stale assignment(s) released.`);
    await mongoose.disconnect();
}

repairAmbulanceAssignments().catch(async (error) => {
    console.error("Ambulance assignment repair failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
});
