import React, { useState, useRef } from "react";
import {
    Box,
    Button,
    CircularProgress,
    IconButton,
    Stack,
    Typography,
    Alert,
    TextField,
    Collapse,
} from "@mui/material";
import {
    CloudUploadOutlined,
    DeleteOutlineRounded,
    LinkRounded,
    CheckCircleRounded,
    RefreshRounded,
} from "@mui/icons-material";
import api from "../../services/api";

export default function ImageUpload({
    value = "",
    onChange,
    label = "Upload Image",
    folder = "smartcare/uploads",
    circle = false,
    height = 160,
    helperText = "Supports PNG, JPG, WEBP up to 8MB. Stored securely on Cloudinary.",
}) {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlText, setUrlText] = useState("");
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = async (file) => {
        if (!file) return;

        // Validation
        const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
        if (!validTypes.includes(file.type)) {
            return setError("Please select a valid image file (JPG, PNG, or WEBP).");
        }
        if (file.size > 8 * 1024 * 1024) {
            return setError("Image size exceeds 8MB limit. Please choose a smaller image.");
        }

        setError("");
        setUploading(true);

        const formData = new FormData();
        formData.append("image", file);
        formData.append("folder", folder);

        try {
            const res = await api.post("/upload/image", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data?.success && res.data.url) {
                onChange(res.data.url);
            } else {
                setError(res.data?.message || "Failed to upload image.");
            }
        } catch (err) {
            console.error("Upload error:", err);
            setError(err.response?.data?.message || "Failed to upload image to Cloudinary. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleApplyUrl = () => {
        if (!urlText.trim()) return;
        onChange(urlText.trim());
        setUrlText("");
        setShowUrlInput(false);
    };

    const handleClear = () => {
        onChange("");
        setError("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <Box sx={{ width: "100%" }}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/jpg"
                style={{ display: "none" }}
                onChange={handleFileInputChange}
            />

            <Typography fontSize={13.5} fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
                {label}
            </Typography>

            {error && (
                <Alert severity="error" onClose={() => setError("")} sx={{ mb: 1.5, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            {value ? (
                // PREVIEW CONTAINER
                <Box
                    sx={{
                        p: 1.5,
                        borderRadius: circle ? "50%" : 3,
                        border: "1.5px solid #E2E8F0",
                        bgcolor: "#F8FAFC",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <Box
                        component="img"
                        src={value}
                        alt="Uploaded preview"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80";
                        }}
                        sx={{
                            width: circle ? 100 : 130,
                            height: circle ? 100 : height * 0.75,
                            borderRadius: circle ? "50%" : 2.5,
                            objectFit: "cover",
                            border: "1px solid #CBD5E1",
                        }}
                    />

                    <Box sx={{ flexGrow: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 0.5 }}>
                            <CheckCircleRounded color="success" sx={{ fontSize: 18 }} />
                            <Typography fontSize={13} fontWeight={700} color="success.main">
                                Image Stored on Cloudinary
                            </Typography>
                        </Stack>
                        <Typography
                            fontSize={11.5}
                            color="text.secondary"
                            sx={{
                                maxWidth: 280,
                                textOverflow: "ellipsis",
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                mb: 1.5,
                            }}
                        >
                            {value}
                        </Typography>

                        <Stack direction="row" spacing={1}>
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={uploading ? <CircularProgress size={14} /> : <RefreshRounded />}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, fontSize: 12 }}
                            >
                                Change File
                            </Button>
                            <Button
                                size="small"
                                color="error"
                                variant="text"
                                startIcon={<DeleteOutlineRounded />}
                                onClick={handleClear}
                                disabled={uploading}
                                sx={{ textTransform: "none", fontWeight: 700, fontSize: 12 }}
                            >
                                Remove
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            ) : (
                // DROPZONE CONTAINER
                <Box
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    sx={{
                        border: isDragging ? "2px dashed #0D9488" : "2px dashed #CBD5E1",
                        borderRadius: 3,
                        p: 3,
                        textAlign: "center",
                        bgcolor: isDragging ? "rgba(13, 148, 136, 0.04)" : "#FAFAFA",
                        cursor: uploading ? "wait" : "pointer",
                        transition: "all 0.2s ease",
                        "&:hover": {
                            borderColor: "#0D9488",
                            bgcolor: "rgba(13, 148, 136, 0.02)",
                        },
                    }}
                >
                    {uploading ? (
                        <Box py={2}>
                            <CircularProgress size={32} sx={{ color: "#0D9488", mb: 1.5 }} />
                            <Typography fontSize={13} fontWeight={700} color="#0D9488">
                                Uploading to Cloudinary...
                            </Typography>
                            <Typography fontSize={11.5} color="text.secondary">
                                Please wait while your image is being processed
                            </Typography>
                        </Box>
                    ) : (
                        <Box>
                            <CloudUploadOutlined sx={{ fontSize: 40, color: "#64748B", mb: 1 }} />
                            <Typography fontSize={14} fontWeight={700} color="text.primary">
                                Click to browse or drag & drop image
                            </Typography>
                            <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.5 }}>
                                {helperText}
                            </Typography>
                            <Button
                                size="small"
                                variant="contained"
                                sx={{
                                    mt: 1.5,
                                    bgcolor: "#0D9488",
                                    borderRadius: 2,
                                    textTransform: "none",
                                    fontWeight: 700,
                                    "&:hover": { bgcolor: "#0F766E" },
                                }}
                            >
                                Browse Image File
                            </Button>
                        </Box>
                    )}
                </Box>
            )}

            {/* Optional URL input fallback toggle */}
            <Box sx={{ mt: 1 }}>
                <Button
                    size="small"
                    variant="text"
                    startIcon={<LinkRounded />}
                    onClick={() => setShowUrlInput((prev) => !prev)}
                    sx={{ fontSize: 11.5, textTransform: "none", color: "text.secondary", p: 0 }}
                >
                    {showUrlInput ? "Hide paste URL" : "Or paste image web link"}
                </Button>

                <Collapse in={showUrlInput}>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <TextField
                            size="small"
                            fullWidth
                            placeholder="https://..."
                            value={urlText}
                            onChange={(e) => setUrlText(e.target.value)}
                        />
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={handleApplyUrl}
                            sx={{ fontWeight: 700, textTransform: "none", minWidth: 80 }}
                        >
                            Apply
                        </Button>
                    </Stack>
                </Collapse>
            </Box>
        </Box>
    );
}
