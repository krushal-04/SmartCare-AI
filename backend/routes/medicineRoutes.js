const express = require("express");
const router = express.Router();

const {
    protect,
    adminOnly,
} = require("../middleware/protect");

const {
    getMedicines,
    getMedicineById,
    createMedicine,
    updateMedicine,
    deleteMedicine,
} = require("../controllers/medicineController");

// Public list & view
router.get("/", getMedicines);
router.get("/all", getMedicines);
router.get("/:id", getMedicineById);

// Admin-only management
router.post("/create", protect, adminOnly, createMedicine);
router.put("/:id", protect, adminOnly, updateMedicine);
router.delete("/:id", protect, adminOnly, deleteMedicine);

module.exports = router;
