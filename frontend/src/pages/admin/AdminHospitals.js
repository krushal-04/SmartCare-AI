import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Tooltip,
    Typography,
    Alert,
} from "@mui/material";
import {
    CheckCircleOutlineRounded,
    CancelOutlined,
    SearchRounded,
    LocalHospitalOutlined,
    LocationOnOutlined,
    PhoneOutlined,
    EmailOutlined,
    InfoOutlined,
    EditOutlined,
    EmergencyOutlined,
    VerifiedOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PageHeader from "../../components/dashboard/PageHeader";
import api from "../../services/api";

const STATUS_COLOR_MAP = {
    Approved: "success",
    Pending: "warning",
    Rejected: "error",
};

export default function AdminHospitals() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialFilter = queryParams.get("filter") || "all";

    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ type: "", message: "" });
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState(initialFilter);

    // Dialogs
    const [detailHospital, setDetailHospital] = useState(null);

    // Approval action
    const [approvingId, setApprovingId] = useState(null);

    // Reject / Cancel Modal
    const [rejectId, setRejectId] = useState(null);
    const [rejectTargetHospital, setRejectTargetHospital] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [rejecting, setRejecting] = useState(false);

    // Edit Modal
    const [editHospital, setEditHospital] = useState(null);
    const [editForm, setEditForm] = useState({
        hospitalName: "",
        city: "",
        address: "",
        phone: "",
        emergencyAvailable: true,
        isActive: true,
    });
    const [updating, setUpdating] = useState(false);

    const fetchHospitals = async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/all-hospitals");
            if (res.data.success) {
                setHospitals(res.data.hospitals || []);
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to load hospitals.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHospitals();
    }, []);

    const handleApprove = async (id) => {
        setApprovingId(id);
        setAlert({ type: "", message: "" });
        try {
            const res = await api.put(`/admin/approve/${id}`);
            if (res.data.success) {
                setAlert({
                    type: "success",
                    message: "Hospital verified and approved! Approval notification and email sent to hospital.",
                });
                fetchHospitals();
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to approve hospital.",
            });
        } finally {
            setApprovingId(null);
        }
    };

    const handleReject = async () => {
        if (!rejectId) return;
        setRejecting(true);
        setAlert({ type: "", message: "" });
        const isCancellingApproved = rejectTargetHospital?.status === "Approved";
        try {
            const res = await api.put(`/admin/reject/${rejectId}`, { rejectionReason });
            if (res.data.success) {
                setAlert({
                    type: isCancellingApproved ? "warning" : "info",
                    message: isCancellingApproved
                        ? "Hospital approval has been cancelled. Cancellation notice and email dispatched to hospital."
                        : "Hospital application rejected. Rejection notice and email dispatched.",
                });
                setRejectId(null);
                setRejectTargetHospital(null);
                setRejectionReason("");
                fetchHospitals();
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || (isCancellingApproved ? "Failed to cancel hospital approval." : "Failed to reject hospital."),
            });
        } finally {
            setRejecting(false);
        }
    };

    const handleOpenEdit = (h) => {
        setEditHospital(h);
        const p = h.hospitalProfile || {};
        setEditForm({
            hospitalName: p.hospitalName || h.fullName || "",
            city: p.city || "",
            address: p.address || "",
            phone: p.hospitalPhone || h.phone || "",
            emergencyAvailable: Boolean(p.emergencyAvailable),
            isActive: h.isActive !== false,
        });
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        if (!editHospital) return;
        setUpdating(true);
        try {
            const res = await api.put(`/admin/hospital/${editHospital._id}`, editForm);
            if (res.data.success) {
                setAlert({ type: "success", message: "Hospital profile updated successfully." });
                setEditHospital(null);
                fetchHospitals();
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to update hospital.",
            });
        } finally {
            setUpdating(false);
        }
    };

    const filtered = hospitals.filter((h) => {
        const name = (h.fullName || h.hospitalProfile?.hospitalName || "").toLowerCase();
        const city = (h.hospitalProfile?.city || "").toLowerCase();
        const email = (h.email || "").toLowerCase();
        const q = search.toLowerCase();

        const matchesSearch = name.includes(q) || city.includes(q) || email.includes(q);
        const matchesStatus = statusFilter === "all" || h.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const pendingCount = hospitals.filter((h) => h.status === "Pending").length;

    return (
        <DashboardLayout
            role="admin"
            title="Hospital Network & Verifications"
            subtitle="Review hospital registration dossiers, verify accreditations, and manage operational permissions"
        >
            <PageHeader
                title="Hospitals Governance"
                subtitle="Review, approve, reject, or manage hospital centers across the network"
                backTo="/admin"
                backLabel="← Back to Dashboard"
            />

            {alert.message && (
                <Alert severity={alert.type} sx={{ mb: 3, borderRadius: 3 }}>
                    {alert.message}
                </Alert>
            )}

            {/* Status Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                <Tabs
                    value={statusFilter}
                    onChange={(e, val) => setStatusFilter(val)}
                    textColor="primary"
                    indicatorColor="primary"
                >
                    <Tab label={`All Hospitals (${hospitals.length})`} value="all" sx={{ fontWeight: 700 }} />
                    <Tab
                        label={
                            <Stack direction="row" spacing={1} alignItems="center">
                                <span>Pending Approvals</span>
                                {pendingCount > 0 && (
                                    <Chip label={pendingCount} size="small" color="warning" sx={{ height: 20, fontWeight: 800 }} />
                                )}
                            </Stack>
                        }
                        value="Pending"
                        sx={{ fontWeight: 700 }}
                    />
                    <Tab label="Approved" value="Approved" sx={{ fontWeight: 700 }} />
                    <Tab label="Rejected" value="Rejected" sx={{ fontWeight: 700 }} />
                </Tabs>
            </Box>

            <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #E3EBEE" }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    {/* Search Bar */}
                    <Box sx={{ mb: 3 }}>
                        <TextField
                            size="small"
                            placeholder="Search by hospital name, city, email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sx={{ width: { xs: "100%", sm: 340 } }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchRounded fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>

                    {loading ? (
                        <Box py={8} textAlign="center">
                            <CircularProgress />
                        </Box>
                    ) : filtered.length === 0 ? (
                        <Box py={8} textAlign="center">
                            <LocalHospitalOutlined sx={{ fontSize: 52, color: "text.secondary", mb: 1.5 }} />
                            <Typography fontWeight={800} variant="h6">
                                No Hospitals Found
                            </Typography>
                            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                                {search
                                    ? "No hospitals match your search term."
                                    : "No hospital registrations under this status category."}
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#F8FAFB" }}>
                                        <TableCell sx={{ fontWeight: 800 }}>Hospital Information</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Location & Contact</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Facilities / Emergency</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Doctors & Units</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Approval Status</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filtered.map((h) => {
                                        const p = h.hospitalProfile || {};
                                        const isPending = h.status === "Pending";
                                        return (
                                            <TableRow key={h._id} hover>
                                                <TableCell>
                                                    <Stack direction="row" spacing={2} alignItems="center">
                                                        <Avatar
                                                            sx={{
                                                                width: 44,
                                                                height: 44,
                                                                bgcolor: "primary.main",
                                                                fontWeight: 800,
                                                            }}
                                                        >
                                                            {(p.hospitalName || h.fullName)?.charAt(0)}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography fontWeight={800} fontSize={15}>
                                                                {p.hospitalName || h.fullName}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Registered {new Date(h.createdAt).toLocaleDateString()}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography fontSize={13} fontWeight={600}>
                                                        {p.city ? `${p.city}, ${p.state || ""}` : "Location Pending"}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" fontSize={12}>
                                                        {h.email} • {h.phone}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Stack spacing={0.5}>
                                                        <Chip
                                                            icon={<EmergencyOutlined sx={{ fontSize: "14px !important" }} />}
                                                            label={p.emergencyAvailable ? "24/7 Emergency" : "Standard Care"}
                                                            size="small"
                                                            color={p.emergencyAvailable ? "error" : "default"}
                                                            variant="outlined"
                                                            sx={{ fontWeight: 700 }}
                                                        />
                                                        {p.facilities?.length > 0 && (
                                                            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 180 }}>
                                                                {p.facilities.slice(0, 3).join(", ")}
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography fontSize={13} fontWeight={700}>
                                                        {h.doctorCount || 0} Doctors
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {h.departmentCount || 0} Departments • {h.appointmentCount || 0} Appts
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Chip
                                                        label={h.status}
                                                        color={STATUS_COLOR_MAP[h.status] || "default"}
                                                        size="small"
                                                        sx={{ fontWeight: 800 }}
                                                    />
                                                </TableCell>

                                                <TableCell align="right">
                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                        {/* ACTION BUTTONS BASED ON STATUS */}
                                                        {h.status === "Approved" && (
                                                            <Tooltip title="Cancel Hospital Approval & Send Notice">
                                                                <IconButton
                                                                    size="small"
                                                                    sx={{ color: "error.main" }}
                                                                    onClick={() => {
                                                                        setRejectId(h._id);
                                                                        setRejectTargetHospital(h);
                                                                        setRejectionReason("Hospital approval cancelled by administration after compliance review.");
                                                                    }}
                                                                >
                                                                    <CancelOutlined fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}

                                                        {isPending && (
                                                            <>
                                                                <Tooltip title="Approve Hospital Registration">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="success"
                                                                        disabled={approvingId === h._id}
                                                                        onClick={() => handleApprove(h._id)}
                                                                    >
                                                                        <CheckCircleOutlineRounded fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Reject Application with Reason">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="error"
                                                                        onClick={() => {
                                                                            setRejectId(h._id);
                                                                            setRejectTargetHospital(h);
                                                                            setRejectionReason("");
                                                                        }}
                                                                    >
                                                                        <CancelOutlined fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </>
                                                        )}

                                                        {h.status === "Rejected" && (
                                                            <Tooltip title="Re-approve Hospital">
                                                                <IconButton
                                                                    size="small"
                                                                    color="success"
                                                                    disabled={approvingId === h._id}
                                                                    onClick={() => handleApprove(h._id)}
                                                                >
                                                                    <CheckCircleOutlineRounded fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}

                                                        <Tooltip title="View Detailed Dossier">
                                                            <IconButton
                                                                size="small"
                                                                color="info"
                                                                onClick={() => setDetailHospital(h)}
                                                            >
                                                                <InfoOutlined fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title="Edit Profile & Status">
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => handleOpenEdit(h)}
                                                            >
                                                                <EditOutlined fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            {/* View Full Hospital Dossier Dialog */}
            <Dialog open={Boolean(detailHospital)} onClose={() => setDetailHospital(null)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>
                    Hospital Application & Operational Dossier
                </DialogTitle>
                <DialogContent dividers>
                    {detailHospital && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">
                                    Hospital Name
                                </Typography>
                                <Typography variant="h6" fontWeight={800}>
                                    {detailHospital.hospitalProfile?.hospitalName || detailHospital.fullName}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">
                                    Current Status
                                </Typography>
                                <Box sx={{ mt: 0.5 }}>
                                    <Chip
                                        label={detailHospital.status}
                                        color={STATUS_COLOR_MAP[detailHospital.status] || "default"}
                                        sx={{ fontWeight: 800 }}
                                    />
                                </Box>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">
                                    Contact Email & Phone
                                </Typography>
                                <Typography fontWeight={600}>
                                    {detailHospital.email} • {detailHospital.phone}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">
                                    Street Address & Pincode
                                </Typography>
                                <Typography fontWeight={600}>
                                    {detailHospital.hospitalProfile?.address || "—"}, {detailHospital.hospitalProfile?.city || ""}{" "}
                                    ({detailHospital.hospitalProfile?.pincode || ""})
                                </Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary">
                                    Overview & Description
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    {detailHospital.hospitalProfile?.description || "No overview provided."}
                                </Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary">
                                    Clinical Facilities
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                                    {detailHospital.hospitalProfile?.facilities?.map((f) => (
                                        <Chip key={f} label={f} size="small" variant="outlined" color="primary" />
                                    ))}
                                    {(!detailHospital.hospitalProfile?.facilities ||
                                        detailHospital.hospitalProfile?.facilities.length === 0) && (
                                        <Typography color="text.secondary" variant="body2">
                                            No facilities submitted.
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>

                            {detailHospital.status === "Rejected" && detailHospital.rejectionReason && (
                                <Grid item xs={12}>
                                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                                        <strong>Rejection Reason:</strong> {detailHospital.rejectionReason}
                                    </Alert>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDetailHospital(null)} color="inherit" sx={{ fontWeight: 600 }}>
                        Close Dossier
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Rejection / Cancellation Reason Modal */}
            <Dialog
                open={Boolean(rejectId)}
                onClose={() => {
                    setRejectId(null);
                    setRejectTargetHospital(null);
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 800, color: "error.main" }}>
                    {rejectTargetHospital?.status === "Approved"
                        ? "Cancel Hospital Approval"
                        : "Reject Hospital Application"}
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {rejectTargetHospital?.status === "Approved"
                            ? "Please enter the reason for cancelling this hospital's approval. Their operations console access will be revoked immediately and an official cancellation notice email will be sent to the facility."
                            : "Please enter a clear explanation for why this hospital registration is being rejected. This reason will be stored in database compliance logs and sent via email directly to the applicant."}
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        required
                        label={
                            rejectTargetHospital?.status === "Approved"
                                ? "Reason for Cancellation"
                                : "Reason for Rejection"
                        }
                        placeholder={
                            rejectTargetHospital?.status === "Approved"
                                ? "e.g. Failure to maintain mandatory medical compliance, licensing expiry, or facility suspension."
                                : "e.g. Invalid medical license registration number, incomplete facility address, or unverified contact person."
                        }
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => {
                            setRejectId(null);
                            setRejectTargetHospital(null);
                        }}
                        color="inherit"
                        sx={{ fontWeight: 600 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        disabled={rejecting || !rejectionReason.trim()}
                        onClick={handleReject}
                        sx={{ fontWeight: 800, textTransform: "none" }}
                    >
                        {rejecting
                            ? "Processing..."
                            : rejectTargetHospital?.status === "Approved"
                            ? "Confirm Cancel Approval & Dispatch Email"
                            : "Confirm Rejection & Send Notice"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Hospital Modal */}
            <Dialog open={Boolean(editHospital)} onClose={() => setEditHospital(null)} maxWidth="sm" fullWidth>
                <form onSubmit={handleUpdateSubmit}>
                    <DialogTitle sx={{ fontWeight: 800 }}>
                        Edit Hospital Settings
                    </DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            <TextField
                                fullWidth
                                label="Hospital Name"
                                value={editForm.hospitalName}
                                onChange={(e) => setEditForm({ ...editForm, hospitalName: e.target.value })}
                            />
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="City"
                                        value={editForm.city}
                                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Phone"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    />
                                </Grid>
                            </Grid>
                            <TextField
                                fullWidth
                                label="Address"
                                value={editForm.address}
                                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setEditHospital(null)} color="inherit" sx={{ fontWeight: 600 }}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={updating}
                            sx={{ fontWeight: 800, textTransform: "none" }}
                        >
                            {updating ? "Saving..." : "Save Hospital Details"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </DashboardLayout>
    );
}
