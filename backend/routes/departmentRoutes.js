const express = require("express");

const router = express.Router();

const {
    addDepartment,
    getDepartments,
    getHospitalDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment
} = require("../controllers/departmentController");

const {
    protect,
    hospitalOnly
} = require("../middleware/authMiddleware");

router.post(
    "/add",
    protect,
    hospitalOnly,
    addDepartment
);

router.get("/all", getDepartments);

router.get(
    "/hospital",
    protect,
    hospitalOnly,
    getHospitalDepartments
);

router.get("/:id", getDepartmentById);

router.put(
    "/:id",
    protect,
    hospitalOnly,
    updateDepartment
);

router.delete(
    "/:id",
    protect,
    hospitalOnly,
    deleteDepartment
);

module.exports = router;