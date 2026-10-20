import React, { useEffect, useRef, useState } from "react";
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Paper,
    Stack,
    Typography,
    Alert,
} from "@mui/material";
import {
    MyLocation,
    CheckCircle,
} from "@mui/icons-material";

/**
 * Creates SVG-based Leaflet DivIcons to prevent broken image assets
 */
const createMarkerIcon = (type = "hospital", isEmergency = false) => {
    if (typeof window === "undefined" || !window.L) return null;

    let bgColor = "#0D9488"; // Teal primary
    let iconSvg = `<path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z" fill="#ffffff"/>`;
    let pulseHtml = "";

    if (type === "patient") {
        bgColor = "#10B981"; // Emerald
        pulseHtml = `<div class="patient-pulse-ring"></div>`;
        iconSvg = `<circle cx="12" cy="8" r="4" fill="#ffffff"/><path d="M12 14c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z" fill="#ffffff"/>`;
    } else if (type === "ambulance") {
        bgColor = "#F59E0B"; // Amber
        iconSvg = `<path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" fill="#ffffff"/>`;
    } else if (isEmergency) {
        bgColor = "#EF4444"; // Red for emergency hospital
    }

    const html = `
        <div class="custom-map-marker-container">
            ${pulseHtml}
            <div class="marker-pin" style="background: ${bgColor};">
                <svg viewBox="0 0 24 24" class="marker-icon">${iconSvg}</svg>
            </div>
            <div class="marker-shadow"></div>
        </div>
    `;

    return window.L.divIcon({
        className: "custom-leaflet-marker",
        html: html,
        iconSize: [42, 50],
        iconAnchor: [21, 48],
        popupAnchor: [0, -46],
    });
};

export default function MedicalMap({
    hospitals = [],
    patientLocation = null,
    onLocationSelect = null,
    onLocateMe = null,
    selectable = false,
    selectedHospitalId = null,
    height = 420,
    zoom = 12,
    center = null,
    showLocateButton = true,
}) {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersLayerRef = useRef(null);
    const patientMarkerRef = useRef(null);
    const boundsRef = useRef([]);

    const [isLoaded, setIsLoaded] = useState(false);
    const [geoLoading, setGeoLoading] = useState(false);
    const [geoError, setGeoError] = useState("");

    // Calculate default center if not provided
    const defaultLat = patientLocation?.latitude || (hospitals[0]?.latitude) || 20.5937;
    const defaultLng = patientLocation?.longitude || (hospitals[0]?.longitude) || 78.9629;

    // Load leaflet if dynamically needed or verify window.L
    useEffect(() => {
        const checkLeaflet = () => {
            if (window.L) {
                setIsLoaded(true);
            } else {
                const timer = setTimeout(checkLeaflet, 200);
                return () => clearTimeout(timer);
            }
        };
        checkLeaflet();
    }, []);

    // Initialize map
    useEffect(() => {
        if (!isLoaded || !mapContainerRef.current) return;

        // Clean up previous instance if exists
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const L = window.L;
        const initialCenter = center
            ? [center.latitude || center.lat, center.longitude || center.lng]
            : [defaultLat, defaultLng];

        const map = L.map(mapContainerRef.current, {
            center: initialCenter,
            zoom: zoom,
            zoomControl: false,
        });

        // Use standard OpenStreetMap tile layer without API key requirements
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(map);

        // Add zoom control to top-right
        L.control.zoom({ position: "topright" }).addTo(map);

        // Layer group for dynamic markers
        const markersLayer = L.layerGroup().addTo(map);
        markersLayerRef.current = markersLayer;
        mapInstanceRef.current = map;

        // Map click handler for selecting coordinates
        if (selectable && onLocationSelect) {
            map.on("click", (e) => {
                const { lat, lng } = e.latlng;
                onLocationSelect({ latitude: lat, longitude: lng });
            });
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [isLoaded]);

    // Update hospital markers
    useEffect(() => {
        if (!mapInstanceRef.current || !markersLayerRef.current || !window.L) return;

        const L = window.L;
        const markersLayer = markersLayerRef.current;
        markersLayer.clearLayers();

        const validBounds = [];

        hospitals.forEach((hosp) => {
            const lat = Number(hosp.latitude);
            const lng = Number(hosp.longitude);

            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                validBounds.push([lat, lng]);

                const isSelected = selectedHospitalId && String(hosp._id) === String(selectedHospitalId);
                const isEmergency = Boolean(hosp.emergencyAvailable);
                const markerIcon = createMarkerIcon("hospital", isEmergency);

                const marker = L.marker([lat, lng], {
                    icon: markerIcon,
                    title: hosp.hospitalName,
                });

                const popupHtml = `
                    <div class="medical-map-popup">
                        <div class="popup-header">
                            <span class="popup-badge ${isEmergency ? "badge-emergency" : "badge-normal"}">
                                ${isEmergency ? "Emergency Ready" : "Hospital Center"}
                            </span>
                            <h4 class="popup-title">${hosp.hospitalName || "Medical Center"}</h4>
                        </div>
                        <p class="popup-address">${hosp.address || ""}, ${hosp.city || ""}</p>
                        ${hosp.hospitalPhone ? `<p class="popup-contact">Phone: ${hosp.hospitalPhone}</p>` : ""}
                        ${hosp.distanceKm != null ? `<p class="popup-distance">Distance: <strong>${hosp.distanceKm.toFixed(1)} km</strong> from your location</p>` : ""}
                        <div class="popup-actions">
                            <a href="/hospitals/${hosp._id}" class="popup-btn popup-btn-details">Details</a>
                            <a href="/doctors?hospitalId=${hosp._id}" class="popup-btn popup-btn-book">Book Appt</a>
                            <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" rel="noopener noreferrer" class="popup-btn popup-btn-dir">Directions</a>
                        </div>
                    </div>
                `;

                marker.bindPopup(popupHtml, { maxWidth: 320 });
                marker.addTo(markersLayer);

                if (isSelected) {
                    marker.openPopup();
                }
            }
        });

        // Add or update Patient location marker
        if (patientLocation && patientLocation.latitude != null && patientLocation.longitude != null) {
            const pLat = Number(patientLocation.latitude);
            const pLng = Number(patientLocation.longitude);

            if (!isNaN(pLat) && !isNaN(pLng)) {
                validBounds.push([pLat, pLng]);
                const patientIcon = createMarkerIcon("patient");

                const pMarker = L.marker([pLat, pLng], {
                    icon: patientIcon,
                    zIndexOffset: 1000,
                });

                pMarker.bindPopup(`
                    <div class="medical-map-popup">
                        <div class="popup-header">
                            <span class="popup-badge badge-patient">Patient Location</span>
                            <h4 class="popup-title">Your Current GPS</h4>
                        </div>
                        <p class="popup-address">Coordinates: ${pLat.toFixed(5)}° N, ${pLng.toFixed(5)}° E</p>
                        <p class="popup-subtitle">Ambulance routing calculates distance directly to this position.</p>
                    </div>
                `);

                pMarker.addTo(markersLayer);
                patientMarkerRef.current = pMarker;

                // Add soft radar accuracy circle around patient GPS
                L.circle([pLat, pLng], {
                    color: "#10B981",
                    fillColor: "#10B981",
                    fillOpacity: 0.12,
                    weight: 1.5,
                    radius: 1200,
                }).addTo(markersLayer);
            }
        }

        // View centering logic:
        if (selectedHospitalId) {
            const selHosp = hospitals.find((h) => String(h._id) === String(selectedHospitalId));
            if (selHosp && selHosp.latitude != null && selHosp.longitude != null) {
                mapInstanceRef.current.setView([Number(selHosp.latitude), Number(selHosp.longitude)], 15, { animate: true });
                return;
            }
        }

        boundsRef.current = validBounds;

        if (validBounds.length > 1 && !center) {
            try {
                // Fits both the user's GPS marker AND all hospitals in the camera frame
                mapInstanceRef.current.fitBounds(validBounds, { padding: [55, 55], maxZoom: 14 });
            } catch (err) {
                // Ignore bounds calculation errors
            }
        } else if (patientLocation && patientLocation.latitude != null && patientLocation.longitude != null) {
            const pLat = Number(patientLocation.latitude);
            const pLng = Number(patientLocation.longitude);
            if (!isNaN(pLat) && !isNaN(pLng)) {
                mapInstanceRef.current.setView([pLat, pLng], 14, { animate: true });
            }
        } else if (validBounds.length === 1 && !center) {
            mapInstanceRef.current.setView(validBounds[0], 14);
        }
    }, [hospitals, patientLocation, selectedHospitalId, center]);

    // Handle Current Location GPS capture
    const handleGetGPS = () => {
        if (!navigator.geolocation) {
            setGeoError("Geolocation is not supported by your browser.");
            return;
        }

        setGeoLoading(true);
        setGeoError("");

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const coords = { latitude: lat, longitude: lng };

                setGeoLoading(false);

                if (mapInstanceRef.current) {
                    mapInstanceRef.current.setView([lat, lng], 14);
                }

                if (onLocateMe) {
                    onLocateMe(coords);
                }
                if (onLocationSelect) {
                    onLocationSelect(coords);
                }
            },
            (err) => {
                setGeoLoading(false);
                let msg = "Could not obtain GPS location.";
                if (err.code === 1) msg = "Location permission denied. Please allow location access in your browser settings.";
                else if (err.code === 2) msg = "GPS position unavailable. Please check your network or GPS connection.";
                else if (err.code === 3) msg = "Location request timed out. Retrying with network location...";
                setGeoError(msg);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000,
            }
        );
    };

    return (
        <Paper
            elevation={0}
            sx={{
                position: "relative",
                borderRadius: 3.5,
                overflow: "hidden",
                border: "1.5px solid #E2E8F0",
                boxShadow: "0 10px 25px -5px rgba(15,23,42,0.06)",
                bgcolor: "#F8FAFC",
            }}
        >
            {/* Quick Actions Overlay Bar */}
            <Box
                sx={{
                    position: "absolute",
                    top: 14,
                    left: 14,
                    zIndex: 1000,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                }}
            >
                {showLocateButton && (
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleGetGPS}
                        disabled={geoLoading}
                        startIcon={geoLoading ? <CircularProgress size={16} color="inherit" /> : <MyLocation />}
                        sx={{
                            bgcolor: "#0D9488",
                            color: "#FFFFFF",
                            fontWeight: 700,
                            fontSize: 12.5,
                            borderRadius: 2,
                            px: 1.8,
                            py: 0.8,
                            boxShadow: "0 4px 12px rgba(13,148,136,0.3)",
                            "&:hover": { bgcolor: "#0F766E" },
                        }}
                    >
                        {geoLoading ? "Detecting GPS..." : "Find My Location"}
                    </Button>
                )}

                {patientLocation && (
                    <>
                        <Chip
                            icon={<CheckCircle sx={{ fontSize: "16px !important", color: "#10B981" }} />}
                            label={`GPS Active: ${patientLocation.latitude?.toFixed(3)}°, ${patientLocation.longitude?.toFixed(3)}°`}
                            size="small"
                            sx={{
                                bgcolor: "rgba(255,255,255,0.95)",
                                backdropFilter: "blur(6px)",
                                border: "1px solid #10B981",
                                fontWeight: 700,
                                color: "#065F46",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                            }}
                        />

                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                                if (mapInstanceRef.current && patientLocation) {
                                    mapInstanceRef.current.setView(
                                        [Number(patientLocation.latitude), Number(patientLocation.longitude)],
                                        16,
                                        { animate: true }
                                    );
                                }
                            }}
                            sx={{
                                bgcolor: "rgba(255,255,255,0.95)",
                                backdropFilter: "blur(4px)",
                                borderColor: "#CBD5E1",
                                color: "#0F172A",
                                fontSize: 12,
                                fontWeight: 700,
                                textTransform: "none",
                                py: 0.5,
                                px: 1.2,
                                borderRadius: 2,
                                "&:hover": { bgcolor: "#FFFFFF", borderColor: "#0D9488" },
                            }}
                        >
                            My Location
                        </Button>

                        {boundsRef.current.length > 1 && (
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                    if (mapInstanceRef.current && boundsRef.current.length > 1) {
                                        mapInstanceRef.current.fitBounds(boundsRef.current, { padding: [55, 55] });
                                    }
                                }}
                                sx={{
                                    bgcolor: "rgba(255,255,255,0.95)",
                                    backdropFilter: "blur(4px)",
                                    borderColor: "#CBD5E1",
                                    color: "#0F172A",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    textTransform: "none",
                                    py: 0.5,
                                    px: 1.2,
                                    borderRadius: 2,
                                    "&:hover": { bgcolor: "#FFFFFF", borderColor: "#0D9488" },
                                }}
                            >
                                View All
                            </Button>
                        )}
                    </>
                )}
            </Box>

            {/* Notification alert floating if error */}
            {geoError && (
                <Alert
                    severity="warning"
                    onClose={() => setGeoError("")}
                    sx={{
                        position: "absolute",
                        bottom: 14,
                        left: 14,
                        right: 14,
                        zIndex: 1000,
                        borderRadius: 2,
                        boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                    }}
                >
                    {geoError}
                </Alert>
            )}

            {/* Map Container */}
            <Box
                ref={mapContainerRef}
                sx={{
                    width: "100%",
                    height: height,
                    bgcolor: "#EDF2F7",
                }}
            />

            {!isLoaded && (
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "rgba(248,250,252,0.85)",
                        zIndex: 500,
                    }}
                >
                    <Stack spacing={1.5} alignItems="center">
                        <CircularProgress sx={{ color: "#0D9488" }} />
                        <Typography fontSize={13} fontWeight={600} color="text.secondary">
                            Loading SmartCare Geospatial Engine...
                        </Typography>
                    </Stack>
                </Box>
            )}
        </Paper>
    );
}
