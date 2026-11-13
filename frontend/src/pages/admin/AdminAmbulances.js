import React, { useEffect, useMemo, useState } from "react";
import { Alert, Box, Card, CardContent, Chip, CircularProgress, FormControl, InputAdornment, InputLabel, MenuItem, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { MyLocationOutlined, SearchRounded, TimeToLeaveOutlined } from "@mui/icons-material";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PageHeader from "../../components/dashboard/PageHeader";
import api from "../../services/api";
import { colors } from "../../theme/colors";

const STATUS_COLORS = { Available: "success", Assigned: "warning", "On The Way": "info", Busy: "info", Offline: "default" };

export default function AdminAmbulances() {
    const [ambulances, setAmbulances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        let active = true;
        api.get("/ambulance/all")
            .then((res) => active && setAmbulances(res.data?.ambulances || []))
            .catch((err) => active && setError(err.response?.data?.message || "Unable to load fleet monitoring data."))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, []);

    const filtered = useMemo(() => ambulances.filter((ambulance) => {
        const query = search.trim().toLowerCase();
        const searchable = [ambulance.ambulanceNumber, ambulance.vehicleRegNumber, ambulance.driverName, ambulance.hospitalId?.hospitalName].filter(Boolean).join(" ").toLowerCase();
        return (!query || searchable.includes(query)) && (statusFilter === "all" || ambulance.status === statusFilter);
    }), [ambulances, search, statusFilter]);

    const counts = useMemo(() => ({
        total: ambulances.length,
        available: ambulances.filter((item) => item.status === "Available").length,
        active: ambulances.filter((item) => ["Assigned", "On The Way", "Busy"].includes(item.status)).length,
        offDuty: ambulances.filter((item) => item.status === "Offline").length,
    }), [ambulances]);

    return (
        <DashboardLayout role="admin" title="Fleet Monitor" subtitle="Read-only view of hospital-owned ambulance operations">
            <PageHeader title="Ambulance Fleet Monitor" subtitle="Hospitals register and operate their vehicles. Use Emergency Live Monitor only for incident exceptions." backTo="/admin" backLabel="Back to Dashboard" />
            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: 2, mb: 3 }}>
                {[["Total fleet", counts.total, colors.ink], ["Available", counts.available, "#15803D"], ["Active trips", counts.active, "#0369A1"], ["Off duty", counts.offDuty, colors.slate]].map(([label, value, color]) => <Card key={label} elevation={0} sx={{ border: `1px solid ${colors.hairline}`, borderRadius: 3 }}><CardContent sx={{ p: { xs: 2, sm: 2.5 } }}><Typography variant="caption" color="text.secondary" fontWeight={800}>{label.toUpperCase()}</Typography><Typography mt={0.5} fontSize={{ xs: 24, sm: 30 }} fontWeight={850} color={color}>{value}</Typography></CardContent></Card>)}
            </Box>
            <Card elevation={0} sx={{ border: `1px solid ${colors.hairline}`, borderRadius: 3.5 }}><CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} justifyContent="space-between" sx={{ mb: 2.5 }}>
                    <TextField size="small" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search vehicle, hospital, or driver" sx={{ width: { xs: "100%", sm: 340 } }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> }} />
                    <FormControl size="small" sx={{ width: { xs: "100%", sm: 190 } }}><InputLabel>Status</InputLabel><Select value={statusFilter} label="Status" onChange={(event) => setStatusFilter(event.target.value)}><MenuItem value="all">All statuses</MenuItem>{Object.keys(STATUS_COLORS).map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}</Select></FormControl>
                </Stack>
                {loading ? <Box py={7} textAlign="center"><CircularProgress /></Box> : <TableContainer><Table sx={{ minWidth: 760 }} aria-label="Read-only ambulance fleet monitoring table"><TableHead><TableRow><TableCell>Vehicle</TableCell><TableCell>Hospital</TableCell><TableCell>Driver</TableCell><TableCell>Capability</TableCell><TableCell>Operational status</TableCell><TableCell>GPS</TableCell></TableRow></TableHead><TableBody>
                    {filtered.map((ambulance) => {
                        const updatedAt = ambulance.currentLocation?.updatedAt;
                        const gpsFresh = updatedAt && Date.now() - new Date(updatedAt).getTime() < 15 * 60 * 1000;
                        return <TableRow key={ambulance._id} hover><TableCell><Stack direction="row" spacing={1.2} alignItems="center"><TimeToLeaveOutlined color="primary" /><Box><Typography fontWeight={800}>{ambulance.ambulanceNumber}</Typography><Typography variant="caption" color="text.secondary">{ambulance.vehicleType}</Typography></Box></Stack></TableCell><TableCell><Typography fontWeight={700} fontSize={13}>{ambulance.hospitalId?.hospitalName || "Unassigned"}</Typography><Typography variant="caption" color="text.secondary">{ambulance.hospitalId?.city || ""}</Typography></TableCell><TableCell><Typography fontWeight={700} fontSize={13}>{ambulance.driverName || "No driver linked"}</Typography><Typography variant="caption" color="text.secondary">{ambulance.driverId?.dutyStatus === "ON_DUTY" ? "On duty" : "Off duty"}</Typography></TableCell><TableCell><Stack direction="row" gap={0.5} flexWrap="wrap">{(ambulance.capability || ["BASIC"]).map((capability) => <Chip key={capability} label={capability} size="small" />)}</Stack></TableCell><TableCell><Chip label={ambulance.status} color={STATUS_COLORS[ambulance.status] || "default"} size="small" sx={{ fontWeight: 800 }} /></TableCell><TableCell><Stack direction="row" spacing={0.5} alignItems="center"><MyLocationOutlined fontSize="small" color={gpsFresh ? "success" : "disabled"} /><Typography variant="caption">{gpsFresh ? "Live" : "No recent update"}</Typography></Stack></TableCell></TableRow>;
                    })}
                    {!filtered.length && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>No fleet records match the current filter.</TableCell></TableRow>}
                </TableBody></Table></TableContainer>}
            </CardContent></Card>
        </DashboardLayout>
    );
}
