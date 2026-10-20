import React, { useEffect, useState } from "react";
import {
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
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    Alert,
} from "@mui/material";
import {
    AddRounded,
    EditOutlined,
    DeleteOutlineRounded,
    SearchRounded,
    LocalPharmacyOutlined,
    InfoOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PageHeader from "../../components/dashboard/PageHeader";
import api from "../../services/api";

const CATEGORIES = [
    "Antibiotic",
    "Analgesic",
    "Antipyretic",
    "Cardiovascular",
    "Antidiabetic",
    "Antihistamine",
    "Respiratory",
    "Gastrointestinal",
    "Neurological",
    "Dermatological",
    "Other",
];

const DOSAGE_FORMS = [
    "Tablet",
    "Capsule",
    "Syrup",
    "Injection",
    "Ointment",
    "Drops",
    "Inhaler",
    "Other",
];

export default function AdminMedicines() {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [alert, setAlert] = useState({ type: "", message: "" });

    // Modals
    const [openDialog, setOpenDialog] = useState(false);
    const [editingMed, setEditingMed] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [detailMed, setDetailMed] = useState(null);

    const [form, setForm] = useState({
        medicineName: "",
        genericName: "",
        category: "Analgesic",
        manufacturer: "",
        dosageForm: "Tablet",
        strength: "",
        description: "",
        generalInfo: "",
        usageInfo: "",
        precautions: "",
        sideEffects: "",
    });

    // Delete Modal
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchMedicines = async () => {
        setLoading(true);
        try {
            const res = await api.get("/medicines/all");
            if (res.data.success) {
                setMedicines(res.data.medicines || []);
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to load medicine directory.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedicines();
    }, []);

    const handleOpenAdd = () => {
        setEditingMed(null);
        setForm({
            medicineName: "",
            genericName: "",
            category: "Analgesic",
            manufacturer: "",
            dosageForm: "Tablet",
            strength: "",
            description: "",
            generalInfo: "",
            usageInfo: "",
            precautions: "",
            sideEffects: "",
        });
        setOpenDialog(true);
    };

    const handleOpenEdit = (med) => {
        setEditingMed(med);
        setForm({
            medicineName: med.medicineName || "",
            genericName: med.genericName || "",
            category: med.category || "Other",
            manufacturer: med.manufacturer || "",
            dosageForm: med.dosageForm || "Tablet",
            strength: med.strength || "",
            description: med.description || "",
            generalInfo: med.generalInfo || "",
            usageInfo: med.usageInfo || "",
            precautions: med.precautions || "",
            sideEffects: med.sideEffects || "",
        });
        setOpenDialog(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlert({ type: "", message: "" });

        if (!form.medicineName.trim() || !form.genericName.trim() || !form.manufacturer.trim()) {
            return setAlert({ type: "error", message: "Medicine name, generic name, and manufacturer are required." });
        }

        setSubmitting(true);
        try {
            if (editingMed) {
                await api.put(`/medicines/${editingMed._id}`, form);
                setAlert({ type: "success", message: "Medicine catalog entry updated successfully!" });
            } else {
                await api.post("/medicines/create", form);
                setAlert({ type: "success", message: "New medicine added to catalog successfully!" });
            }
            setOpenDialog(false);
            fetchMedicines();
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to save medicine.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await api.delete(`/medicines/${deleteId}`);
            setAlert({ type: "success", message: "Medicine deleted from directory." });
            setDeleteId(null);
            fetchMedicines();
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to delete medicine.",
            });
            setDeleteId(null);
        } finally {
            setDeleting(false);
        }
    };

    const filtered = medicines.filter((m) => {
        const name = m.medicineName?.toLowerCase() || "";
        const generic = m.genericName?.toLowerCase() || "";
        const mfg = m.manufacturer?.toLowerCase() || "";
        const q = search.toLowerCase();

        const matchesSearch = name.includes(q) || generic.includes(q) || mfg.includes(q);
        const matchesCategory = categoryFilter === "all" || m.category === categoryFilter;

        return matchesSearch && matchesCategory;
    });

    return (
        <DashboardLayout
            role="admin"
            title="Pharmacy & Medicine Catalog"
            subtitle="Verified drug directory, indications, dosages, safety precautions, and active formulations"
        >
            <PageHeader
                title="Medicines Directory"
                subtitle="Manage pharmaceutical catalog, generic classifications, and clinical usage guidelines"
                backTo="/admin"
                backLabel="← Back to Dashboard"
                action={
                    <Button
                        variant="contained"
                        startIcon={<AddRounded />}
                        onClick={handleOpenAdd}
                        sx={{ borderRadius: 3, textTransform: "none", fontWeight: 800, px: 3 }}
                    >
                        Add Medicine
                    </Button>
                }
            />

            {alert.message && (
                <Alert severity={alert.type} sx={{ mb: 3, borderRadius: 3 }}>
                    {alert.message}
                </Alert>
            )}

            <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #E3EBEE" }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    {/* Filters Toolbar */}
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        justifyContent="space-between"
                        alignItems={{ xs: "stretch", sm: "center" }}
                        sx={{ mb: 3 }}
                    >
                        <TextField
                            size="small"
                            placeholder="Search by brand name, generic name, manufacturer..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sx={{ width: { xs: "100%", sm: 360 } }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchRounded fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Filter by Category</InputLabel>
                            <Select
                                value={categoryFilter}
                                label="Filter by Category"
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <MenuItem value="all">All Categories</MenuItem>
                                {CATEGORIES.map((c) => (
                                    <MenuItem key={c} value={c}>
                                        {c}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>

                    {loading ? (
                        <Box py={8} textAlign="center">
                            <CircularProgress />
                        </Box>
                    ) : filtered.length === 0 ? (
                        <Box py={8} textAlign="center">
                            <LocalPharmacyOutlined sx={{ fontSize: 52, color: "text.secondary", mb: 1.5 }} />
                            <Typography fontWeight={800} variant="h6">
                                No Medicines Found
                            </Typography>
                            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5, mb: 2 }}>
                                {search || categoryFilter !== "all"
                                    ? "No medicines matched the selected filter."
                                    : "Get started by adding pharmaceutical items to the catalog."}
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<AddRounded />}
                                onClick={handleOpenAdd}
                                sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700 }}
                            >
                                Add Medicine
                            </Button>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#F8FAFB" }}>
                                        <TableCell sx={{ fontWeight: 800 }}>Medicine & Generic</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Dosage & Strength</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Manufacturer</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filtered.map((med) => (
                                        <TableRow key={med._id} hover>
                                            <TableCell>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <Box
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: 2.5,
                                                            bgcolor: "rgba(15,82,75,0.08)",
                                                            color: "primary.main",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }}
                                                    >
                                                        <LocalPharmacyOutlined />
                                                    </Box>
                                                    <Box>
                                                        <Typography fontWeight={800} fontSize={14}>
                                                            {med.medicineName}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {med.genericName}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>

                                            <TableCell>
                                                <Chip
                                                    label={med.category}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 700 }}
                                                />
                                            </TableCell>

                                            <TableCell>
                                                <Typography fontSize={13} fontWeight={600}>
                                                    {med.dosageForm}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {med.strength || "Standard"}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Typography fontSize={13}>
                                                    {med.manufacturer}
                                                </Typography>
                                            </TableCell>

                                            <TableCell align="right">
                                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                    <Tooltip title="View Clinical Guidelines">
                                                        <IconButton
                                                            size="small"
                                                            color="info"
                                                            onClick={() => setDetailMed(med)}
                                                        >
                                                            <InfoOutlined fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Edit Medicine">
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => handleOpenEdit(med)}
                                                        >
                                                            <EditOutlined fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Medicine">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => setDeleteId(med._id)}
                                                        >
                                                            <DeleteOutlineRounded fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            {/* Add / Edit Medicine Modal */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle sx={{ fontWeight: 800 }}>
                        {editingMed ? "Edit Medicine" : "Register Pharmaceutical Product"}
                    </DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Brand / Commercial Name"
                                    placeholder="e.g. Paracetamol 500mg"
                                    value={form.medicineName}
                                    onChange={(e) => setForm({ ...form, medicineName: e.target.value })}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Generic / Salt Composition"
                                    placeholder="e.g. Acetaminophen"
                                    value={form.genericName}
                                    onChange={(e) => setForm({ ...form, genericName: e.target.value })}
                                />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth required>
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={form.category}
                                        label="Category"
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    >
                                        {CATEGORIES.map((c) => (
                                            <MenuItem key={c} value={c}>
                                                {c}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth required>
                                    <InputLabel>Dosage Form</InputLabel>
                                    <Select
                                        value={form.dosageForm}
                                        label="Dosage Form"
                                        onChange={(e) => setForm({ ...form, dosageForm: e.target.value })}
                                    >
                                        {DOSAGE_FORMS.map((d) => (
                                            <MenuItem key={d} value={d}>
                                                {d}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Strength / Dosage"
                                    placeholder="e.g. 500 mg, 10 mg/ml"
                                    value={form.strength}
                                    onChange={(e) => setForm({ ...form, strength: e.target.value })}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Manufacturer"
                                    placeholder="e.g. Sun Pharma, Cipla"
                                    value={form.manufacturer}
                                    onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="General Description"
                                    placeholder="Primary medical indications..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Dosage & Usage Information"
                                    placeholder="e.g. Take 1 tablet every 6 hours with food..."
                                    value={form.usageInfo}
                                    onChange={(e) => setForm({ ...form, usageInfo: e.target.value })}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Contraindications & Precautions"
                                    placeholder="Warnings, liver risk, allergy information..."
                                    value={form.precautions}
                                    onChange={(e) => setForm({ ...form, precautions: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 2.5 }}>
                        <Button onClick={() => setOpenDialog(false)} color="inherit" sx={{ fontWeight: 600 }}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={submitting}
                            sx={{ fontWeight: 800, textTransform: "none", px: 3 }}
                        >
                            {submitting ? "Saving..." : editingMed ? "Save Changes" : "Register Medicine"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Medicine Detail Modal */}
            <Dialog open={Boolean(detailMed)} onClose={() => setDetailMed(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>
                    Clinical Information & Safety Guidelines
                </DialogTitle>
                <DialogContent dividers>
                    {detailMed && (
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">Brand Name</Typography>
                                <Typography fontWeight={800}>{detailMed.medicineName}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">Generic Name</Typography>
                                <Typography fontWeight={700}>{detailMed.genericName}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">Category & Form</Typography>
                                <Typography fontWeight={600}>{detailMed.category} • {detailMed.dosageForm} ({detailMed.strength || "Standard"})</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">Manufacturer</Typography>
                                <Typography fontWeight={600}>{detailMed.manufacturer}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary">Usage & Dosage Instructions</Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>{detailMed.usageInfo || "Follow physician advice."}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary">Precautions & Warnings</Typography>
                                <Typography variant="body2" sx={{ mt: 0.5, color: "warning.dark" }}>{detailMed.precautions || "Standard clinical precautions apply."}</Typography>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDetailMed(null)} color="inherit" sx={{ fontWeight: 600 }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Modal */}
            <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, color: "error.main" }}>
                    Confirm Delete Medicine
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to remove this medicine formulation from the catalog?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteId(null)} color="inherit" sx={{ fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        disabled={deleting}
                        onClick={handleDelete}
                        sx={{ fontWeight: 800, textTransform: "none" }}
                    >
                        {deleting ? "Deleting..." : "Delete Medicine"}
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
}
