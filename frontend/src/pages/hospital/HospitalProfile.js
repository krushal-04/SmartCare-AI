import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    FormControlLabel,
    Grid,
    IconButton,
    InputAdornment,
    Stack,
    Switch,
    TextField,
    Typography,
    Alert,
    Paper,
} from "@mui/material";
import {
    SaveRounded,
    AddRounded,
    CloseRounded,
    LocalHospitalOutlined,
    LocationOnOutlined,
    PhoneOutlined,
    EmailOutlined,
    EmergencyOutlined,
    CloudUploadOutlined,
    ImageOutlined,
    MyLocation,
    Search,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PageHeader from "../../components/dashboard/PageHeader";
import MedicalMap from "../../components/MedicalMap";
import api from "../../services/api";

export default function HospitalProfile() {
    const fileInputRef = React.useRef(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const [photoError, setPhotoError] = useState("");
    const [alert, setAlert] = useState({ type: "", message: "" });
    const [newFacility, setNewFacility] = useState("");
    const [geoDetecting, setGeoDetecting] = useState(false);
    const [geocoding, setGeocoding] = useState(false);

    const [form, setForm] = useState({
        hospitalName: "",
        hospitalEmail: "",
        hospitalPhone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        description: "",
        facilities: [],
        emergencyAvailable: false,
        latitude: "",
        longitude: "",
        hospitalImages: [],
    });

    const [imageUrlInput, setImageUrlInput] = useState("");

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await api.get("/hospitals/profile");
            if (res.data.success && res.data.hospital) {
                const h = res.data.hospital;
                setForm({
                    hospitalName: h.hospitalName || "",
                    hospitalEmail: h.hospitalEmail || "",
                    hospitalPhone: h.hospitalPhone || "",
                    address: h.address || "",
                    city: h.city || "",
                    state: h.state || "",
                    pincode: h.pincode || "",
                    description: h.description || "",
                    facilities: Array.isArray(h.facilities) ? h.facilities : [],
                    emergencyAvailable: Boolean(h.emergencyAvailable),
                    latitude: h.latitude !== undefined && h.latitude !== null ? String(h.latitude) : "",
                    longitude: h.longitude !== undefined && h.longitude !== null ? String(h.longitude) : "",
                    hospitalImages: Array.isArray(h.hospitalImages) ? h.hospitalImages : [],
                });
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to load hospital profile.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleAddFacility = () => {
        if (!newFacility.trim()) return;
        if (!form.facilities.includes(newFacility.trim())) {
            setForm((prev) => ({
                ...prev,
                facilities: [...prev.facilities, newFacility.trim()],
            }));
        }
        setNewFacility("");
    };

    const handleRemoveFacility = (facToRemove) => {
        setForm((prev) => ({
            ...prev,
            facilities: prev.facilities.filter((f) => f !== facToRemove),
        }));
    };

    // 1. Live GPS Detection (1-click for hospital staff on site)
    const handleDetectLiveGPS = () => {
        if (!navigator.geolocation) {
            setAlert({ type: "error", message: "Geolocation is not supported by your browser." });
            return;
        }
        setGeoDetecting(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude.toFixed(6);
                const lng = pos.coords.longitude.toFixed(6);
                setForm((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                }));
                setAlert({
                    type: "success",
                    message: `Live hospital GPS detected successfully (${lat}° N, ${lng}° E). Coordinates updated.`,
                });
                setGeoDetecting(false);
            },
            (err) => {
                setGeoDetecting(false);
                setAlert({
                    type: "error",
                    message: "Location permission denied or unavailable. You can click on the map or enter coordinates manually.",
                });
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // 2. Auto-Detect from Typed Address (Geocoding via OpenStreetMap Nominatim)
    const handleGeocodeAddress = async () => {
        const fullQuery = [form.address, form.city, form.state, form.pincode, "India"]
            .filter(Boolean)
            .join(", ");

        if (!form.city && !form.address) {
            setAlert({ type: "warning", message: "Please fill in your street address and city first." });
            return;
        }

        setGeocoding(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(fullQuery)}`
            );
            const data = await res.json();
            if (data && data.length > 0) {
                const lat = Number(data[0].lat).toFixed(6);
                const lng = Number(data[0].lon).toFixed(6);
                setForm((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                }));
                setAlert({
                    type: "success",
                    message: `Found coordinates for "${data[0].display_name.slice(0, 75)}...": (${lat}° N, ${lng}° E)`,
                });
            } else {
                // Fallback search with city and state
                const fallbackQuery = [form.city, form.state, "India"].filter(Boolean).join(", ");
                const res2 = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(fallbackQuery)}`
                );
                const data2 = await res2.json();
                if (data2 && data2.length > 0) {
                    const lat = Number(data2[0].lat).toFixed(6);
                    const lng = Number(data2[0].lon).toFixed(6);
                    setForm((prev) => ({
                        ...prev,
                        latitude: lat,
                        longitude: lng,
                    }));
                    setAlert({
                        type: "info",
                        message: `Located ${form.city}, ${form.state}. Click on the interactive map below to pinpoint the exact hospital building.`,
                    });
                } else {
                    setAlert({
                        type: "warning",
                        message: "Could not find exact coordinates for this address. Please click on the map or enter manually.",
                    });
                }
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: "Unable to reach geocoding service. Please click on the map or enter coordinates manually.",
            });
        } finally {
            setGeocoding(false);
        }
    };

    const handlePhotosUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setPhotoError("");
        setUploadingPhotos(true);

        const newUrls = [];
        for (const file of files) {
            if (!file.type.startsWith("image/")) {
                setPhotoError("Please select image files only (JPG, PNG, WEBP).");
                continue;
            }
            if (file.size > 10 * 1024 * 1024) {
                setPhotoError("One or more files exceed the 10MB limit.");
                continue;
            }

            const formData = new FormData();
            formData.append("image", file);
            formData.append("folder", "smartcare/hospitals");

            try {
                const res = await api.post("/upload/image", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                if (res.data?.success && res.data.url) {
                    newUrls.push(res.data.url);
                }
            } catch (err) {
                console.error("Facility upload error:", err);
                setPhotoError("Failed to upload some images to Cloudinary.");
            }
        }

        if (newUrls.length > 0) {
            setForm((prev) => ({
                ...prev,
                hospitalImages: [...prev.hospitalImages, ...newUrls],
            }));
        }
        setUploadingPhotos(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleAddImage = () => {
        if (!imageUrlInput.trim()) return;
        setForm((prev) => ({
            ...prev,
            hospitalImages: [...prev.hospitalImages, imageUrlInput.trim()],
        }));
        setImageUrlInput("");
    };

    const handleRemoveImage = (index) => {
        setForm((prev) => ({
            ...prev,
            hospitalImages: prev.hospitalImages.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlert({ type: "", message: "" });

        // Frontend Validations
        if (!form.hospitalName.trim()) {
            return setAlert({ type: "error", message: "Hospital name is required." });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.hospitalEmail)) {
            return setAlert({ type: "error", message: "Please enter a valid hospital email address." });
        }
        if (!form.hospitalPhone.trim() || form.hospitalPhone.trim().length < 7) {
            return setAlert({ type: "error", message: "Please enter a valid phone number." });
        }
        if (!form.address.trim() || !form.city.trim() || !form.state.trim() || !form.pincode.trim()) {
            return setAlert({ type: "error", message: "Address, City, State, and Pincode are required." });
        }

        if (form.latitude !== "") {
            const lat = Number(form.latitude);
            if (isNaN(lat) || lat < -90 || lat > 90) {
                return setAlert({ type: "error", message: "Latitude must be a valid number between -90 and 90." });
            }
        }
        if (form.longitude !== "") {
            const lng = Number(form.longitude);
            if (isNaN(lng) || lng < -180 || lng > 180) {
                return setAlert({ type: "error", message: "Longitude must be a valid number between -180 and 180." });
            }
        }

        setSaving(true);
        try {
            const payload = {
                ...form,
                latitude: form.latitude !== "" ? Number(form.latitude) : undefined,
                longitude: form.longitude !== "" ? Number(form.longitude) : undefined,
            };

            const res = await api.put("/hospitals/profile", payload);
            if (res.data.success) {
                setAlert({ type: "success", message: "Hospital profile updated successfully!" });
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to update hospital profile.",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout
            role="hospital"
            title="Hospital Profile"
            subtitle="Manage facility credentials, contact information, and emergency capabilities"
        >
            <PageHeader
                title="Hospital Profile"
                subtitle="Keep your operational and public hospital profile up to date"
                backTo="/hospital"
                backLabel="← Back to Dashboard"
            />

            {alert.message && (
                <Alert severity={alert.type} sx={{ mb: 3, borderRadius: 3 }}>
                    {alert.message}
                </Alert>
            )}

            {loading ? (
                <Box py={8} textAlign="center">
                    <CircularProgress />
                </Box>
            ) : (
                <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #E3EBEE" }}>
                    <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                        <form onSubmit={handleSubmit}>
                            <Typography variant="h6" fontWeight={800} gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <LocalHospitalOutlined color="primary" /> Basic Information
                            </Typography>
                            <Divider sx={{ mb: 3 }} />

                            <Grid container spacing={2.5} sx={{ mb: 4 }}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="Hospital Name"
                                        name="hospitalName"
                                        value={form.hospitalName}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="Hospital Email"
                                        name="hospitalEmail"
                                        type="email"
                                        value={form.hospitalEmail}
                                        onChange={handleChange}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <EmailOutlined fontSize="small" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="Contact Phone"
                                        name="hospitalPhone"
                                        value={form.hospitalPhone}
                                        onChange={handleChange}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PhoneOutlined fontSize="small" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label="Hospital Overview & Description"
                                        name="description"
                                        value={form.description}
                                        onChange={handleChange}
                                        placeholder="Describe your medical center, specialties, accreditations, and patient amenities..."
                                    />
                                </Grid>
                            </Grid>

                            <Typography variant="h6" fontWeight={800} gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <LocationOnOutlined color="primary" /> Location & Coordinates
                            </Typography>
                            <Divider sx={{ mb: 3 }} />

                            <Grid container spacing={2.5} sx={{ mb: 4 }}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="Street Address"
                                        name="address"
                                        value={form.address}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4} md={2}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="City"
                                        name="city"
                                        value={form.city}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4} md={2}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="State"
                                        name="state"
                                        value={form.state}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4} md={2}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="Pincode"
                                        name="pincode"
                                        value={form.pincode}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                {/* QUICK GPS DETECTION ACTION BAR */}
                                <Grid item xs={12}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2.2,
                                            borderRadius: 3,
                                            bgcolor: "#F0FDFA",
                                            border: "1px solid #CCFBF1",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            flexWrap: "wrap",
                                            gap: 2,
                                        }}
                                    >
                                        <Box>
                                            <Typography fontWeight={800} fontSize={14.5} color="#0F766E">
                                                Hospital GPS Geolocation
                                            </Typography>
                                            <Typography variant="body2" color="#115E59" fontSize={12.5}>
                                                Hospital staff can auto-detect coordinates live on site, fetch them from your street address, or tap on the map.
                                            </Typography>
                                        </Box>

                                        <Stack direction="row" spacing={1.5} flexWrap="wrap">
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={handleDetectLiveGPS}
                                                disabled={geoDetecting}
                                                startIcon={geoDetecting ? <CircularProgress size={16} color="inherit" /> : <MyLocation />}
                                                sx={{
                                                    bgcolor: "#0D9488",
                                                    fontWeight: 700,
                                                    borderRadius: 2.5,
                                                    textTransform: "none",
                                                    boxShadow: "0 2px 8px rgba(13,148,136,0.3)",
                                                    "&:hover": { bgcolor: "#0F766E" },
                                                }}
                                            >
                                                {geoDetecting ? "Detecting GPS..." : "Detect Live Hospital GPS"}
                                            </Button>

                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={handleGeocodeAddress}
                                                disabled={geocoding}
                                                startIcon={geocoding ? <CircularProgress size={16} color="inherit" /> : <Search />}
                                                sx={{
                                                    borderColor: "#0D9488",
                                                    color: "#0D9488",
                                                    fontWeight: 700,
                                                    borderRadius: 2.5,
                                                    textTransform: "none",
                                                    "&:hover": { bgcolor: "rgba(13,148,136,0.06)", borderColor: "#0F766E" },
                                                }}
                                            >
                                                {geocoding ? "Locating..." : "Auto-Detect from Address"}
                                            </Button>
                                        </Stack>
                                    </Paper>
                                </Grid>

                                {/* INTERACTIVE MAP PIN-PICKER */}
                                <Grid item xs={12}>
                                    <Box sx={{ mb: 1 }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                            <Typography fontSize={13.5} fontWeight={700} color="#0F172A">
                                                Hospital Entrance Map Pin (Tap to adjust)
                                            </Typography>
                                            {form.latitude && form.longitude && (
                                                <Chip
                                                    size="small"
                                                    label={`Current Pin: ${Number(form.latitude).toFixed(4)}° N, ${Number(form.longitude).toFixed(4)}° E`}
                                                    sx={{ bgcolor: "#CCFBF1", color: "#0F766E", fontWeight: 700 }}
                                                />
                                            )}
                                        </Stack>
                                        <MedicalMap
                                            hospitals={
                                                form.latitude && form.longitude
                                                    ? [
                                                          {
                                                              _id: "hospital-pin",
                                                              hospitalName: form.hospitalName || "Hospital Location",
                                                              latitude: Number(form.latitude),
                                                              longitude: Number(form.longitude),
                                                              emergencyAvailable: form.emergencyAvailable,
                                                              address: form.address,
                                                              city: form.city,
                                                          },
                                                      ]
                                                    : []
                                            }
                                            selectable={true}
                                            onLocationSelect={(coords) => {
                                                const lat = coords.latitude.toFixed(6);
                                                const lng = coords.longitude.toFixed(6);
                                                setForm((prev) => ({
                                                    ...prev,
                                                    latitude: lat,
                                                    longitude: lng,
                                                }));
                                                setAlert({
                                                    type: "info",
                                                    message: `Hospital entrance pin updated to (${lat}° N, ${lng}° E)`,
                                                });
                                            }}
                                            center={
                                                form.latitude && form.longitude
                                                    ? { latitude: Number(form.latitude), longitude: Number(form.longitude) }
                                                    : null
                                            }
                                            height={260}
                                        />
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Latitude (GPS)"
                                        name="latitude"
                                        value={form.latitude}
                                        onChange={handleChange}
                                        placeholder="e.g. 23.0225"
                                        helperText="Auto-populated by GPS/Map, or enter manually"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Longitude (GPS)"
                                        name="longitude"
                                        value={form.longitude}
                                        onChange={handleChange}
                                        placeholder="e.g. 72.5714"
                                        helperText="Auto-populated by GPS/Map, or enter manually"
                                    />
                                </Grid>
                            </Grid>

                            <Typography variant="h6" fontWeight={800} gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <EmergencyOutlined color="error" /> Clinical Facilities & Emergency Status
                            </Typography>
                            <Divider sx={{ mb: 3 }} />

                            <Box sx={{ mb: 4 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={form.emergencyAvailable}
                                            onChange={handleChange}
                                            name="emergencyAvailable"
                                            color="error"
                                        />
                                    }
                                    label={
                                        <Typography fontWeight={700}>
                                            24/7 Emergency Care Active (Accept Incoming Emergency Dispatch)
                                        </Typography>
                                    }
                                />
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 0.5 }}>
                                    When enabled, patients in your geographic radius can request immediate ambulance and emergency intake at your facility.
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 4 }}>
                                <Typography fontWeight={700} fontSize={14} gutterBottom>
                                    Specialty Facilities
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                    <TextField
                                        size="small"
                                        placeholder="e.g. ICU, NICU, Dialysis, 24x7 Pharmacy"
                                        value={newFacility}
                                        onChange={(e) => setNewFacility(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddFacility();
                                            }
                                        }}
                                        sx={{ width: 320 }}
                                    />
                                    <Button
                                        variant="outlined"
                                        startIcon={<AddRounded />}
                                        onClick={handleAddFacility}
                                        sx={{ textTransform: "none", fontWeight: 700 }}
                                    >
                                        Add Facility
                                    </Button>
                                </Stack>

                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                    {form.facilities.map((fac) => (
                                        <Chip
                                            key={fac}
                                            label={fac}
                                            onDelete={() => handleRemoveFacility(fac)}
                                            color="primary"
                                            variant="outlined"
                                            sx={{ fontWeight: 600, borderRadius: 2 }}
                                        />
                                    ))}
                                    {form.facilities.length === 0 && (
                                        <Typography color="text.secondary" fontSize={13}>
                                            No facilities added yet.
                                        </Typography>
                                    )}
                                </Box>
                            </Box>

                            <Typography variant="h6" fontWeight={800} gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <ImageOutlined color="primary" /> Hospital Photos & Facility Gallery
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Upload exterior and interior photos of your hospital. Stored securely on Cloudinary and displayed to patients.
                            </Typography>
                            <Divider sx={{ mb: 3 }} />

                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/jpeg, image/png, image/webp, image/jpg"
                                style={{ display: "none" }}
                                onChange={handlePhotosUpload}
                            />

                            {photoError && (
                                <Alert severity="error" onClose={() => setPhotoError("")} sx={{ mb: 2, borderRadius: 2 }}>
                                    {photoError}
                                </Alert>
                            )}

                            <Box sx={{ mb: 4 }}>
                                {/* Upload / Browse Banner */}
                                <Box
                                    onClick={() => !uploadingPhotos && fileInputRef.current?.click()}
                                    sx={{
                                        border: "2px dashed #0D9488",
                                        borderRadius: 3.5,
                                        p: 3,
                                        textAlign: "center",
                                        bgcolor: "rgba(13, 148, 136, 0.02)",
                                        cursor: uploadingPhotos ? "wait" : "pointer",
                                        mb: 3,
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                            bgcolor: "rgba(13, 148, 136, 0.06)",
                                            borderColor: "#0F766E",
                                        },
                                    }}
                                >
                                    {uploadingPhotos ? (
                                        <Box py={2}>
                                            <CircularProgress size={32} sx={{ color: "#0D9488", mb: 1.5 }} />
                                            <Typography fontWeight={700} color="#0D9488">
                                                Uploading photos to Cloudinary...
                                            </Typography>
                                            <Typography fontSize={12} color="text.secondary">
                                                Please wait while your files are being saved
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Box>
                                            <CloudUploadOutlined sx={{ fontSize: 44, color: "#0D9488", mb: 1 }} />
                                            <Typography fontWeight={800} fontSize={15} color="#0F172A">
                                                Click to Browse Hospital Photos
                                            </Typography>
                                            <Typography fontSize={12.5} color="text.secondary" sx={{ mt: 0.5 }}>
                                                Select multiple photos from your device (JPG, PNG, WEBP up to 10MB each)
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<CloudUploadOutlined />}
                                                sx={{
                                                    mt: 1.5,
                                                    bgcolor: "#0D9488",
                                                    borderRadius: 2.5,
                                                    textTransform: "none",
                                                    fontWeight: 700,
                                                    px: 2.5,
                                                    "&:hover": { bgcolor: "#0F766E" },
                                                }}
                                            >
                                                Select Images from Computer
                                            </Button>
                                        </Box>
                                    )}
                                </Box>

                                {/* Or Paste URL Option */}
                                <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        placeholder="Or paste external image URL (https://...)"
                                        value={imageUrlInput}
                                        onChange={(e) => setImageUrlInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddImage();
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="outlined"
                                        startIcon={<AddRounded />}
                                        onClick={handleAddImage}
                                        sx={{ textTransform: "none", fontWeight: 700, minWidth: 120, borderRadius: 2 }}
                                    >
                                        Add Link
                                    </Button>
                                </Stack>

                                {/* Gallery Grid */}
                                {form.hospitalImages.length === 0 ? (
                                    <Box
                                        sx={{
                                            p: 4,
                                            textAlign: "center",
                                            bgcolor: "#F8FAFC",
                                            borderRadius: 3,
                                            border: "1px solid #E2E8F0",
                                        }}
                                    >
                                        <ImageOutlined sx={{ fontSize: 36, color: "text.secondary", mb: 1 }} />
                                        <Typography fontSize={13.5} color="text.secondary">
                                            No photos uploaded yet. Click above to add photos of reception, wards, ICU, or building exterior.
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Grid container spacing={2}>
                                        {form.hospitalImages.map((img, idx) => (
                                            <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
                                                <Box
                                                    sx={{
                                                        position: "relative",
                                                        borderRadius: 3,
                                                        overflow: "hidden",
                                                        border: "1.5px solid #E2E8F0",
                                                        height: 160,
                                                        boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
                                                        bgcolor: "#000",
                                                    }}
                                                >
                                                    <Box
                                                        component="img"
                                                        src={img}
                                                        alt={`Hospital photo ${idx + 1}`}
                                                        onError={(e) => {
                                                            e.currentTarget.onerror = null;
                                                            e.currentTarget.src = "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80";
                                                        }}
                                                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                    />

                                                    {idx === 0 && (
                                                        <Chip
                                                            label="Cover Photo"
                                                            size="small"
                                                            color="primary"
                                                            sx={{
                                                                position: "absolute",
                                                                bottom: 8,
                                                                left: 8,
                                                                fontWeight: 800,
                                                                fontSize: 10.5,
                                                                borderRadius: 1.5,
                                                            }}
                                                        />
                                                    )}

                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleRemoveImage(idx)}
                                                        sx={{
                                                            position: "absolute",
                                                            top: 8,
                                                            right: 8,
                                                            bgcolor: "rgba(0,0,0,0.65)",
                                                            color: "white",
                                                            "&:hover": { bgcolor: "error.main" },
                                                        }}
                                                    >
                                                        <CloseRounded fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                )}
                            </Box>

                            <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ pt: 2 }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    disabled={saving}
                                    startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveRounded />}
                                    sx={{ px: 4, py: 1.2, borderRadius: 3, fontWeight: 800, textTransform: "none" }}
                                >
                                    {saving ? "Saving Changes..." : "Save Hospital Profile"}
                                </Button>
                            </Stack>
                        </form>
                    </CardContent>
                </Card>
            )}
        </DashboardLayout>
    );
}
