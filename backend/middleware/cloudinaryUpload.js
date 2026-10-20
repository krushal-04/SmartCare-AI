const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Storage for hospital facility images
const hospitalStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "smartcare/hospitals",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ quality: "auto" }],
    },
});

// Storage for doctor avatars/photos
const doctorStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "smartcare/doctors",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 600, height: 600, crop: "limit", quality: "auto" }],
    },
});

// Storage for department badges/images
const departmentStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "smartcare/departments",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 800, height: 600, crop: "limit", quality: "auto" }],
    },
});

// General uploads (with dynamic folder selection)
const generalStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        const folder = req.body?.folder || "smartcare/uploads";
        return {
            folder,
            allowed_formats: ["jpg", "jpeg", "png", "webp"],
            transformation: [{ quality: "auto" }],
        };
    },
});

const uploadHospitalImages = multer({
    storage: hospitalStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadDoctorImage = multer({
    storage: doctorStorage,
    limits: { fileSize: 8 * 1024 * 1024 },
});

const uploadDepartmentImage = multer({
    storage: departmentStorage,
    limits: { fileSize: 8 * 1024 * 1024 },
});

const uploadGeneralImage = multer({
    storage: generalStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
});

// Attach properties to default export for dual compatibility
uploadHospitalImages.uploadDoctorImage = uploadDoctorImage;
uploadHospitalImages.uploadHospitalImages = uploadHospitalImages;
uploadHospitalImages.uploadDepartmentImage = uploadDepartmentImage;
uploadHospitalImages.uploadGeneralImage = uploadGeneralImage;

module.exports = uploadHospitalImages;
module.exports.uploadHospitalImages = uploadHospitalImages;
module.exports.uploadDoctorImage = uploadDoctorImage;
module.exports.uploadDepartmentImage = uploadDepartmentImage;
module.exports.uploadGeneralImage = uploadGeneralImage;