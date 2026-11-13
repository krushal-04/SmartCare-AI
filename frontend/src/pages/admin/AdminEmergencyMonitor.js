import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { EmergencyOutlined, RefreshRounded, SwapHorizRounded, TimeToLeaveOutlined, WarningAmberRounded } from "@mui/icons-material";
import { io } from "socket.io-client";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PageHeader from "../../components/dashboard/PageHeader";
import api from "../../services/api";
import { colors } from "../../theme/colors";

const SOCKET_URL = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace(/\/api\/?$/, "") : "http://localhost:5000";
const exceptionColor = (severity) => severity === "error" ? "#B91C1C" : "#B45309";

export default function AdminEmergencyMonitor() {
    const [data, setData] = useState({ metrics: {}, exceptionAlerts: [], activeEmergencies: [], activeAmbulances: [], hospitals: [] });
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ type: "", message: "" });
    const [selectedEmergency, setSelectedEmergency] = useState(null);
    const [overrideType, setOverrideType] = useState("");
    const [targetId, setTargetId] = useState("");
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/admin/emergency-monitor");
            if (response.data?.success) setData({ metrics: response.data.metrics || {}, exceptionAlerts: response.data.exceptionAlerts || [], activeEmergencies: response.data.activeEmergencies || [], activeAmbulances: response.data.activeAmbulances || [], hospitals: response.data.hospitals || [] });
        } catch (error) {
            setAlert({ type: "error", message: error.response?.data?.message || "Unable to load the emergency exception center." });
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        refresh();
        const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
        socket.on("connect", () => socket.emit("join_role", "admin"));
        ["emergency:created", "emergency:hospital-rejected", "ambulance:not-responding", "ambulance:journey-status-updated"].forEach((event) => socket.on(event, refresh));
        return () => socket.disconnect();
    }, [refresh]);

    const exceptionCases = useMemo(() => data.exceptionAlerts.map((item) => ({ ...item, emergency: data.activeEmergencies.find((emergency) => String(emergency._id) === String(item.emergencyId)) })), [data]);
    const availableAmbulances = useMemo(() => data.activeAmbulances.filter((ambulance) => ambulance.status === "Available" && ambulance.availability && ambulance.driverId?.dutyStatus === "ON_DUTY" && !ambulance.isRestricted), [data.activeAmbulances]);
    const openAction = (emergency, type) => { setSelectedEmergency(emergency); setOverrideType(type); setTargetId(""); setReason(""); };

    const submitOverride = async () => {
        if (!selectedEmergency || !targetId || !reason.trim()) return;
        setSubmitting(true);
        try {
            const endpoint = overrideType === "hospital" ? "override-hospital" : "override-ambulance";
            const body = overrideType === "hospital" ? { hospitalId: targetId, reason: reason.trim() } : { ambulanceId: targetId, reason: reason.trim() };
            const response = await api.post(`/admin/emergencies/${selectedEmergency._id}/${endpoint}`, body);
            if (response.data?.success) { setAlert({ type: "success", message: response.data.message || "Emergency override saved." }); setOverrideType(""); refresh(); }
        } catch (error) { setAlert({ type: "error", message: error.response?.data?.message || "Unable to complete the emergency override." }); }
        finally { setSubmitting(false); }
    };

    const metrics = data.metrics || {};
    const targetOptions = overrideType === "hospital" ? data.hospitals : availableAmbulances;
    return (
        <DashboardLayout role="admin" title="Emergency Exception Center" subtitle="Monitor emergencies and intervene only when an exception needs escalation">
            <PageHeader title="Emergency Exception Center" subtitle="Hospital teams manage normal dispatch. Use this space only for rejected, unmatched, delayed, or failed incidents." action={<Button variant="outlined" startIcon={<RefreshRounded />} onClick={refresh} sx={{ borderRadius: 2.2, textTransform: "none", fontWeight: 750 }}>Refresh</Button>} />
            {alert.message && <Alert severity={alert.type || "info"} sx={{ mb: 3, borderRadius: 3 }} onClose={() => setAlert({ type: "", message: "" })}>{alert.message}</Alert>}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: 2, mb: 3 }}>
                {[["Active emergencies", metrics.activeCount || 0, colors.ink], ["Critical cases", metrics.criticalCount || 0, "#B91C1C"], ["Open exceptions", metrics.exceptionCount || 0, metrics.exceptionCount ? "#B45309" : "#15803D"], ["Available response units", availableAmbulances.length, "#0369A1"]].map(([label, value, color]) => <Card key={label} elevation={0} sx={{ border: `1px solid ${colors.hairline}`, borderRadius: 3 }}><CardContent sx={{ p: { xs: 2, sm: 2.5 } }}><Typography variant="caption" fontWeight={800} color="text.secondary">{label.toUpperCase()}</Typography><Typography fontSize={{ xs: 25, sm: 31 }} fontWeight={850} color={color}>{value}</Typography></CardContent></Card>)}
            </Box>
            {loading ? <Box py={9} textAlign="center"><CircularProgress /><Typography mt={2} color="text.secondary">Loading emergency exceptions...</Typography></Box> : exceptionCases.length === 0 ? <Card elevation={0} sx={{ p: { xs: 4, sm: 7 }, textAlign: "center", border: `1px solid ${colors.hairline}`, borderRadius: 3.5 }}><EmergencyOutlined sx={{ fontSize: 40, color: colors.pine, mb: 1 }} /><Typography fontSize={18} fontWeight={850}>No intervention required</Typography><Typography color="text.secondary" mt={0.7}>Normal emergencies are being handled by their assigned hospitals and drivers.</Typography></Card> : <Stack spacing={2}>{exceptionCases.map((item, index) => {
                const emergency = item.emergency;
                return <Card key={`${item.type}-${item.emergencyId}-${index}`} elevation={0} sx={{ border: `1px solid ${item.severity === "error" ? "#FECACA" : "#FDE68A"}`, borderRadius: 3.5, overflow: "hidden" }}><Box sx={{ height: 4, bgcolor: exceptionColor(item.severity) }} /><CardContent sx={{ p: { xs: 2.25, sm: 3 } }}><Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}><Box><Stack direction="row" spacing={1} alignItems="center" mb={0.8}><WarningAmberRounded sx={{ color: exceptionColor(item.severity) }} /><Typography fontWeight={850} color={exceptionColor(item.severity)}>{item.title}</Typography></Stack><Typography fontSize={15} fontWeight={800}>{emergency?.emergencyCategory || "Emergency incident"}</Typography><Typography fontSize={13.5} color="text.secondary" mt={0.4}>{item.message}</Typography><Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mt={1.4}><Chip label={`Hospital: ${emergency?.hospitalId?.hospitalName || "Unassigned"}`} size="small" /><Chip label={`Ambulance: ${emergency?.ambulanceId?.ambulanceNumber || "Not assigned"}`} size="small" /><Chip label={`Status: ${emergency?.journeyStatus || emergency?.status || "Review needed"}`} size="small" /></Stack></Box>{emergency && <Stack direction={{ xs: "column", sm: "row" }} spacing={1}><Button variant="outlined" startIcon={<SwapHorizRounded />} onClick={() => openAction(emergency, "hospital")} sx={{ textTransform: "none", fontWeight: 750, borderRadius: 2 }}>Reassign Hospital</Button><Button variant="contained" color="error" startIcon={<TimeToLeaveOutlined />} onClick={() => openAction(emergency, "ambulance")} sx={{ textTransform: "none", fontWeight: 750, borderRadius: 2 }}>Replace Ambulance</Button></Stack>}</Stack></CardContent></Card>;
            })}</Stack>}
            <Dialog open={Boolean(overrideType)} onClose={() => setOverrideType("")} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}><DialogTitle>{overrideType === "hospital" ? "Reassign Hospital" : "Replace Ambulance"}</DialogTitle><DialogContent dividers><Stack spacing={2.3}><Typography color="text.secondary" fontSize={14}>Use only for an exception. A written reason is saved in the emergency audit trail.</Typography><FormControl fullWidth><InputLabel>{overrideType === "hospital" ? "Open hospital" : "Available ambulance"}</InputLabel><Select value={targetId} label={overrideType === "hospital" ? "Open hospital" : "Available ambulance"} onChange={(event) => setTargetId(event.target.value)}>{targetOptions.map((item) => <MenuItem key={item._id} value={item._id}>{overrideType === "hospital" ? `${item.hospitalName} — ${item.city}` : `${item.ambulanceNumber} — ${item.hospitalId?.hospitalName || "Hospital fleet"}`}</MenuItem>)}</Select></FormControl><TextField required multiline minRows={3} label="Override reason" value={reason} onChange={(event) => setReason(event.target.value)} /></Stack></DialogContent><DialogActions sx={{ p: 2 }}><Button onClick={() => setOverrideType("")}>Cancel</Button><Button variant="contained" color={overrideType === "hospital" ? "primary" : "error"} disabled={submitting || !targetId || !reason.trim()} onClick={submitOverride}>{submitting ? "Saving..." : "Confirm override"}</Button></DialogActions></Dialog>
        </DashboardLayout>
    );
}
