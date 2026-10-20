import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import {
    EmergencyOutlined,
    LocationOnOutlined,
    MyLocationRounded,
    PhoneOutlined,
    CheckCircleRounded,
    WarningAmberRounded,
    LocalHospitalOutlined,
    RefreshRounded,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import MedicalMap from "../../components/MedicalMap";
import api from "../../services/api";
import { colors } from "../../theme/colors";

export default function PatientEmergency() {
    const routerLocation = useLocation();
    const [description, setDescription] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [location, setLocation] = useState(null);
    const [locLoading, setLocLoading] = useState(false);
    const [requests, setRequests] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const isPhoneValid = phone.length === 10 && /^[6-9]\d{9}$/.test(phone);

    const getRequests = async () => {
        try {
            const response = await api.get("/emergency/my");
            setRequests(response.data.requests || []);
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load emergency requests.");
        } finally {
            setPageLoading(false);
        }
    };

    const getHospitals = async () => {
        try {
            const response = await api.get("/hospitals/all");
            setHospitals(response.data.hospitals || []);
        } catch (err) {
            // Ignore hospital map background errors
        }
    };

    // Auto-fetch profile to pre-fill phone number
    const getPatientProfile = async () => {
        try {
            const res = await api.get("/patient/profile");
            if (res.data?.patient?.phone) {
                let p = res.data.patient.phone.replace(/\D/g, "");
                if (p.length === 12 && p.startsWith("91")) p = p.slice(2);
                else if (p.length === 11 && p.startsWith("0")) p = p.slice(1);
                setPhone((prev) => prev || p.slice(0, 10));
            }
        } catch (e) {
            // Ignore if profile cannot be fetched
        }
    };

    // Auto-attempt geolocation capture
    const captureLocation = useCallback((isExplicit = false) => {
        if (!navigator.geolocation) {
            if (isExplicit) {
                setError("Geolocation is not supported by your browser. You can enter your address below.");
            }
            return;
        }

        if (isExplicit) setLocLoading(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                if (isExplicit) {
                    setMessage("Current GPS location captured successfully.");
                    setError("");
                }
                setLocLoading(false);
            },
            (geoErr) => {
                if (isExplicit) {
                    setError("Location permission was not granted. No problem — our dispatch team will use your contact number & address.");
                }
                setLocLoading(false);
            },
            { timeout: 8000, enableHighAccuracy: true }
        );
    }, []);

    useEffect(() => {
        getRequests();
        getPatientProfile();
        getHospitals();
        // Silently attempt geolocation on mount
        captureLocation(false);

        // Pre-fill state if navigated from public emergency page
        if (routerLocation.state?.emergencyData) {
            const data = routerLocation.state.emergencyData;
            if (data.description) setDescription(data.description);
            if (data.phone) {
                let p = data.phone.replace(/\D/g, "");
                if (p.length === 12 && p.startsWith("91")) p = p.slice(2);
                else if (p.length === 11 && p.startsWith("0")) p = p.slice(1);
                setPhone(p.slice(0, 10));
            }
            if (data.address) setAddress(data.address);
            if (data.location) setLocation(data.location);
        }
    }, [captureLocation, routerLocation.state]);

    const submitEmergency = async () => {
        try {
            setLoading(true);
            setError("");
            setMessage("");

            if (!description.trim()) {
                setError("Please describe the emergency situation.");
                return;
            }

            const cleanPhone = phone.replace(/\D/g, "");
            if (cleanPhone.length !== 10) {
                setError("Please enter a valid 10-digit mobile number.");
                return;
            }

            if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
                setError("Contact number must be a valid 10-digit mobile number starting with 6, 7, 8, or 9.");
                return;
            }

            const payload = {
                description: description.trim(),
                contactNumber: cleanPhone,
                address: address.trim(),
            };

            if (location && location.latitude != null && location.longitude != null) {
                payload.latitude = location.latitude;
                payload.longitude = location.longitude;
            }

            await api.post("/emergency/request", payload);

            setDescription("");
            setPhone("");
            setAddress("");
            setLocation(null);
            setMessage(
                "Emergency request dispatched! The nearest emergency-enabled hospital has been notified and assistance is being mobilized."
            );

            getRequests();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to send emergency request. Please call local emergency services immediately."
            );
        } finally {
            setLoading(false);
        }
    };

    const cancelRequest = async (id) => {
        try {
            await api.put(`/emergency/${id}/cancel`);
            getRequests();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to cancel request.");
        }
    };

    return (
        <DashboardLayout
            role="patient"
            title="Emergency Assistance"
            subtitle="Request immediate ambulance assistance and track dispatch status"
        >
            <Card
                elevation={0}
                sx={{
                    mb: 3,
                    maxWidth: 850,
                    border: "1.5px solid #F2D3D3",
                    borderRadius: 4,
                    overflow: "hidden",
                    boxShadow: "0 8px 24px rgba(201,77,77,0.06)",
                }}
            >
                <Box
                    sx={{
                        p: 3,
                        bgcolor: "rgba(201,77,77,0.06)",
                        borderBottom: "1px solid #F2D3D3",
                    }}
                >
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                            sx={{
                                width: 52,
                                height: 52,
                                borderRadius: 3,
                                display: "grid",
                                placeItems: "center",
                                bgcolor: "#C94D4D",
                                color: colors.white,
                                flexShrink: 0,
                            }}
                        >
                            <EmergencyOutlined sx={{ fontSize: 32 }} />
                        </Box>
                        <Box>
                            <Typography fontSize={22} fontWeight={900} color={colors.ink}>
                                Emergency Assistance & Ambulance Dispatch
                            </Typography>
                            <Typography fontSize={13.5} color="text.secondary">
                                Immediate dispatch to the nearest emergency-enabled hospital in the network
                            </Typography>
                        </Box>
                    </Stack>
                </Box>

                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <Alert
                        severity="warning"
                        icon={<WarningAmberRounded />}
                        sx={{ mb: 2.5, borderRadius: 2.5 }}
                    >
                        <strong>Critical Notice:</strong> For immediately life-threatening trauma, unconsciousness, or critical chest pain, dial emergency hotline (108 / 911) right away.
                    </Alert>

                    {error && (
                        <Alert
                            severity="error"
                            onClose={() => setError("")}
                            sx={{ mb: 2.5, borderRadius: 2.5 }}
                        >
                            {error}
                        </Alert>
                    )}

                    {message && (
                        <Alert
                            severity="success"
                            icon={<CheckCircleRounded />}
                            onClose={() => setMessage("")}
                            sx={{ mb: 2.5, borderRadius: 2.5 }}
                        >
                            {message}
                        </Alert>
                    )}

                    <Stack spacing={2.2}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            maxRows={6}
                            label="Describe the emergency"
                            placeholder="e.g. Traffic accident, severe fall, sudden acute chest tightness, high fever with breathlessness..."
                            value={description}
                            onChange={(e) => {
                                setDescription(e.target.value);
                                if (error) setError("");
                            }}
                            required
                        />

                        <TextField
                            fullWidth
                            label="Contact Mobile Number (10 Digits)"
                            placeholder="Enter 10-digit mobile number"
                            value={phone}
                            onChange={(e) => {
                                const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                                setPhone(digitsOnly);
                                if (error) setError("");
                            }}
                            required
                            inputProps={{
                                maxLength: 10,
                                inputMode: "numeric",
                                pattern: "[0-9]*",
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PhoneOutlined sx={{ color: "text.secondary", fontSize: 20 }} />
                                        <Typography variant="body2" sx={{ ml: 0.5, mr: 0.5, fontWeight: 700, color: "text.secondary" }}>
                                            +91
                                        </Typography>
                                    </InputAdornment>
                                ),
                            }}
                            error={Boolean(phone && (!isPhoneValid || phone.length !== 10))}
                            helperText={
                                !phone
                                    ? "10-digit Indian mobile number for emergency response team"
                                    : phone.length < 10
                                    ? `${phone.length}/10 digits entered (${10 - phone.length} more needed)`
                                    : !/^[6-9]/.test(phone)
                                    ? "Mobile number must start with 6, 7, 8, or 9"
                                    : "Valid 10-digit mobile number"
                            }
                            FormHelperTextProps={{
                                sx: {
                                    fontWeight: 600,
                                    color: isPhoneValid ? "#059669" : undefined,
                                },
                            }}
                        />

                        <TextField
                            fullWidth
                            label="Pickup Landmark or Street Address (Optional)"
                            placeholder="e.g. Near Apollo Pharmacy, Ring Road, Sector 4, Flat 302"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            helperText="Helpful if GPS signal is weak or for apartment/floor details"
                        />

                        {/* LOCATION CAPTURE STATUS BAR */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                borderRadius: 3,
                                bgcolor: location ? "rgba(16,185,129,0.06)" : colors.canvas,
                                border: `1px solid ${location ? "rgba(16,185,129,0.3)" : colors.hairline}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: 1.5,
                            }}
                        >
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <LocationOnOutlined sx={{ color: location ? "#10B981" : colors.slate }} />
                                <Box>
                                    <Typography fontSize={13.5} fontWeight={800} color={colors.ink}>
                                        {location
                                            ? `GPS Coordinates: ${location.latitude.toFixed(4)}° N, ${location.longitude.toFixed(4)}° E`
                                            : "GPS Location (Optional)"}
                                    </Typography>
                                    <Typography fontSize={12} color="text.secondary">
                                        {location
                                            ? "Accurate GPS captured for direct ambulance navigation."
                                            : "Automatic hospital routing will dispatch to the nearest emergency hospital."}
                                    </Typography>
                                </Box>
                            </Stack>

                            <Button
                                size="small"
                                variant={location ? "outlined" : "contained"}
                                startIcon={
                                    locLoading ? (
                                        <CircularProgress size={16} color="inherit" />
                                    ) : location ? (
                                        <RefreshRounded />
                                    ) : (
                                        <MyLocationRounded />
                                    )
                                }
                                onClick={() => captureLocation(true)}
                                disabled={locLoading}
                                sx={{
                                    borderRadius: 2.5,
                                    textTransform: "none",
                                    fontWeight: 700,
                                    fontSize: 13,
                                    bgcolor: location ? "transparent" : colors.pine,
                                    color: location ? colors.pine : colors.white,
                                    "&:hover": {
                                        bgcolor: location ? "rgba(43,92,82,0.08)" : colors.pineDeep,
                                    },
                                }}
                            >
                                {locLoading
                                    ? "Detecting..."
                                    : location
                                    ? "Update GPS"
                                    : "Use My Current Location"}
                            </Button>
                        </Paper>

                        {/* INTERACTIVE EMERGENCY GPS RADAR MAP */}
                        <Box sx={{ mt: 1, mb: 1 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                <Typography fontSize={13.5} fontWeight={700} color={colors.ink}>
                                    Live Location & Nearest Hospital Locator
                                </Typography>
                                <Typography fontSize={11.5} color="text.secondary">
                                    Tap map to adjust pickup pin
                                </Typography>
                            </Box>
                            <MedicalMap
                                hospitals={hospitals}
                                patientLocation={location}
                                selectable={true}
                                onLocationSelect={(coords) => {
                                    setLocation(coords);
                                    setMessage("Pickup coordinates adjusted from map.");
                                }}
                                onLocateMe={(coords) => setLocation(coords)}
                                height={280}
                            />
                        </Box>

                        {/* SUBMIT BUTTON - NEVER HARD-BLOCKED ON LOCATION */}
                        <Button
                            fullWidth
                            variant="contained"
                            color="error"
                            size="large"
                            startIcon={
                                loading ? (
                                    <CircularProgress size={20} color="inherit" />
                                ) : (
                                    <EmergencyOutlined />
                                )
                            }
                            onClick={submitEmergency}
                            disabled={loading || !description.trim() || !isPhoneValid}
                            sx={{
                                py: 1.6,
                                borderRadius: 3,
                                fontWeight: 900,
                                fontSize: 16,
                                bgcolor: "#C94D4D",
                                boxShadow: "0 6px 18px rgba(201,77,77,0.3)",
                                "&:hover": {
                                    bgcolor: "#A83838",
                                },
                            }}
                        >
                            {loading ? "Dispatching Emergency Request..." : "Request Ambulance Now"}
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            <Typography fontSize={20} fontWeight={900} mb={2} color={colors.ink}>
                Emergency Request History
            </Typography>

            {pageLoading ? (
                <Box textAlign="center" py={7}>
                    <CircularProgress />
                </Box>
            ) : requests.length === 0 ? (
                <Card
                    elevation={0}
                    sx={{
                        border: "1px solid #E3EBEE",
                        borderRadius: 4,
                        bgcolor: colors.white,
                    }}
                >
                    <CardContent sx={{ py: 6, textAlign: "center" }}>
                        <LocalHospitalOutlined sx={{ fontSize: 44, color: "text.secondary", mb: 1, opacity: 0.5 }} />
                        <Typography fontWeight={800} color={colors.ink}>
                            No past emergency requests
                        </Typography>
                        <Typography fontSize={13} color="text.secondary" mt={0.5}>
                            When you submit an emergency ambulance dispatch, real-time status and hospital assignment will appear here.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                requests.map((request) => (
                    <Card
                        key={request._id}
                        elevation={0}
                        sx={{
                            mb: 2,
                            border: "1px solid #E3EBEE",
                            borderRadius: 4,
                            bgcolor: colors.white,
                        }}
                    >
                        <CardContent>
                            <Stack
                                direction={{ xs: "column", md: "row" }}
                                justifyContent="space-between"
                                alignItems={{ xs: "flex-start", md: "center" }}
                                gap={2}
                            >
                                <Box>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Typography fontWeight={900} fontSize={16} color={colors.ink}>
                                            {request.hospitalId?.hospitalName || "Emergency Hospital Assigned"}
                                        </Typography>
                                        <Chip
                                            label={request.status}
                                            size="small"
                                            color={
                                                request.status === "Completed"
                                                    ? "success"
                                                    : request.status === "Cancelled"
                                                    ? "default"
                                                    : "error"
                                            }
                                            sx={{ fontWeight: 800 }}
                                        />
                                    </Stack>

                                    <Typography color="text.secondary" fontSize={13.5} mt={0.8}>
                                        <strong>Emergency:</strong> {request.description}
                                    </Typography>

                                    {request.contactNumber && (
                                        <Typography color="text.secondary" fontSize={13} mt={0.3}>
                                            <strong>Contact Number:</strong> {request.contactNumber.length === 10 ? `+91 ${request.contactNumber}` : request.contactNumber}
                                        </Typography>
                                    )}

                                    {request.address && (
                                        <Typography color="text.secondary" fontSize={13} mt={0.3}>
                                            <strong>Address:</strong> {request.address}
                                        </Typography>
                                    )}

                                    {request.latitude != null && request.longitude != null && (
                                        <Typography color="text.secondary" fontSize={12} mt={0.3}>
                                            Coordinates: {request.latitude.toFixed(4)}, {request.longitude.toFixed(4)}
                                        </Typography>
                                    )}

                                    <Typography fontSize={12} color="text.secondary" mt={0.8}>
                                        Requested on: {request.createdAt ? new Date(request.createdAt).toLocaleString() : "—"}
                                    </Typography>
                                </Box>

                                {["Requested", "Assigned"].includes(request.status) && (
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="error"
                                        onClick={() => cancelRequest(request._id)}
                                        sx={{ borderRadius: 2.5, fontWeight: 700 }}
                                    >
                                        Cancel Request
                                    </Button>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                ))
            )}
        </DashboardLayout>
    );
}