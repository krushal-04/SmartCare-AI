const express = require("express");

const router = express.Router();

const {
    addDepartment,
    getDepartments,
    getHospitalDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment,
} = require("../controllers/departmentController");

const {
    protect,
    hospitalOrAdmin,
} = require("../middleware/authMiddleware");

const { uploadDepartmentImage } = require("../middleware/cloudinaryUpload");

router.post(
    "/add",
    protect,
    hospitalOrAdmin,
    uploadDepartmentImage.single("departmentImage"),
    addDepartment
);

router.get("/", getDepartments);
router.get("/all", getDepartments);

router.get(
    "/hospital",
    protect,
    hospitalOrAdmin,
    getHospitalDepartments
);

router.get("/:id", getDepartmentById);

router.put(
    "/:id",
    protect,
    hospitalOrAdmin,
    uploadDepartmentImage.single("departmentImage"),
    updateDepartment
);

router.delete(
    "/:id",
    protect,
    hospitalOrAdmin,
    deleteDepartment
);

module.exports = router;