const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { protect } = require("../middleware/protect");
const cloudinary = require("../config/cloudinary");

const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Memory storage to safely allow Cloudinary upload with local disk fallback
const memoryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});

// Helper to save buffer to local disk
const saveBufferToDisk = (buffer, originalname) => {
    const ext = path.extname(originalname) || ".jpg";
    const uniqueName = `img-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = path.join(uploadsDir, uniqueName);
    fs.writeFileSync(filePath, buffer);
    return uniqueName;
};

// Helper to upload buffer to Cloudinary stream
const uploadBufferToCloudinary = (buffer, folder = "smartcare/uploads") => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
                quality: "auto",
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        stream.end(buffer);
    });
};

// Single image upload with Cloudinary + Local Storage Fallback
router.post("/image", protect, memoryUpload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image file provided for upload.",
            });
        }

        const folder = req.body?.folder || "smartcare/uploads";

        // 1. Try Cloudinary first
        try {
            const cloudRes = await uploadBufferToCloudinary(req.file.buffer, folder);
            if (cloudRes && cloudRes.secure_url) {
                return res.status(200).json({
                    success: true,
                    url: cloudRes.secure_url,
                    secure_url: cloudRes.secure_url,
                    public_id: cloudRes.public_id,
                    provider: "cloudinary",
                    message: "Image uploaded to Cloudinary successfully.",
                });
            }
        } catch (cloudErr) {
            console.warn("Cloudinary upload failed (fallback to local storage):", cloudErr.message || cloudErr);
        }

        // 2. Fallback to local server storage
        const filename = saveBufferToDisk(req.file.buffer, req.file.originalname);
        const host = req.get("host") || "localhost:5000";
        const protocol = req.protocol || "http";
        const localUrl = `${protocol}://${host}/uploads/${filename}`;

        return res.status(200).json({
            success: true,
            url: localUrl,
            secure_url: localUrl,
            filename,
            provider: "local",
            message: "Image saved successfully.",
        });
    } catch (err) {
        console.error("Upload error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to process image upload.",
        });
    }
});

// Multiple image upload with Cloudinary + Local Storage Fallback
router.post("/images", protect, memoryUpload.array("images", 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No image files provided for upload.",
            });
        }

        const urls = [];
        const host = req.get("host") || "localhost:5000";
        const protocol = req.protocol || "http";

        for (const file of req.files) {
            let fileUrl = null;
            try {
                const cloudRes = await uploadBufferToCloudinary(file.buffer, "smartcare/hospitals");
                if (cloudRes && cloudRes.secure_url) {
                    fileUrl = cloudRes.secure_url;
                }
            } catch (cloudErr) {
                console.warn("Cloudinary multi-upload item failed (fallback to local):", cloudErr.message || cloudErr);
            }

            if (!fileUrl) {
                const filename = saveBufferToDisk(file.buffer, file.originalname);
                fileUrl = `${protocol}://${host}/uploads/${filename}`;
            }

            urls.push(fileUrl);
        }

        return res.status(200).json({
            success: true,
            urls,
            message: `${urls.length} image(s) processed successfully.`,
        });
    } catch (err) {
        console.error("Multi-image upload error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to process image uploads.",
        });
    }
});

module.exports = router;
