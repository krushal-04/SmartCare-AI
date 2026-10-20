import React, { useEffect, useState } from "react";
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
    SearchRounded,
    PersonOutlineOutlined,
    CheckCircleOutlineRounded,
    BlockRounded,
    InfoOutlined,
    AdminPanelSettingsOutlined,
    LocalHospitalOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import PageHeader from "../../components/dashboard/PageHeader";
import api from "../../services/api";

const ROLE_COLORS = {
    admin: "error",
    hospital: "primary",
    patient: "info",
};

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ type: "", message: "" });

    // Filters
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [activeFilter, setActiveFilter] = useState("all");

    // Action dialog
    const [toggleUser, setToggleUser] = useState(null);
    const [toggling, setToggling] = useState(false);
    const [detailUser, setDetailUser] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = {};
            if (roleFilter !== "all") params.role = roleFilter;
            if (activeFilter !== "all") params.isActive = activeFilter === "active";

            const res = await api.get("/admin/users", { params });
            if (res.data.success) {
                setUsers(res.data.users || []);
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to load user accounts.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [roleFilter, activeFilter]);

    const handleToggleStatus = async () => {
        if (!toggleUser) return;
        setToggling(true);
        setAlert({ type: "", message: "" });
        try {
            const newActive = !toggleUser.isActive;
            const res = await api.put(`/admin/user/${toggleUser._id}/status`, {
                isActive: newActive,
            });

            if (res.data.success) {
                setAlert({
                    type: "success",
                    message: `User ${toggleUser.email} has been ${newActive ? "activated" : "deactivated"}.`,
                });
                setToggleUser(null);
                fetchUsers();
            }
        } catch (err) {
            setAlert({
                type: "error",
                message: err.response?.data?.message || "Failed to update user status.",
            });
        } finally {
            setToggling(false);
        }
    };

    const filtered = users.filter((u) => {
        const q = search.toLowerCase();
        const name = u.fullName?.toLowerCase() || "";
        const email = u.email?.toLowerCase() || "";
        const phone = u.phone?.toLowerCase() || "";
        return name.includes(q) || email.includes(q) || phone.includes(q);
    });

    return (
        <DashboardLayout
            role="admin"
            title="User Account Management"
            subtitle="Platform-wide identity, authorization roles, and account security status"
        >
            <PageHeader
                title="User Accounts & Security"
                subtitle="Inspect patients, healthcare providers, and administrative credentials"
                backTo="/admin"
                backLabel="← Back to Dashboard"
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
                            placeholder="Search by name, email, or phone..."
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

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Role</InputLabel>
                                <Select
                                    value={roleFilter}
                                    label="Role"
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                >
                                    <MenuItem value="all">All Roles</MenuItem>
                                    <MenuItem value="patient">Patients</MenuItem>
                                    <MenuItem value="hospital">Hospitals</MenuItem>
                                    <MenuItem value="admin">Administrators</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Account Status</InputLabel>
                                <Select
                                    value={activeFilter}
                                    label="Account Status"
                                    onChange={(e) => setActiveFilter(e.target.value)}
                                >
                                    <MenuItem value="all">All Statuses</MenuItem>
                                    <MenuItem value="active">Active Only</MenuItem>
                                    <MenuItem value="deactivated">Deactivated</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </Stack>

                    {loading ? (
                        <Box py={8} textAlign="center">
                            <CircularProgress />
                        </Box>
                    ) : filtered.length === 0 ? (
                        <Box py={8} textAlign="center">
                            <PersonOutlineOutlined sx={{ fontSize: 52, color: "text.secondary", mb: 1.5 }} />
                            <Typography fontWeight={800} variant="h6">
                                No Users Found
                            </Typography>
                            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                                {search || roleFilter !== "all" || activeFilter !== "all"
                                    ? "No users match your filter criteria."
                                    : "No user accounts registered on this system."}
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#F8FAFB" }}>
                                        <TableCell sx={{ fontWeight: 800 }}>User Profile</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Contact Details</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Role</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Approval Status</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Active Status</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filtered.map((u) => {
                                        const isActive = u.isActive !== false;
                                        return (
                                            <TableRow key={u._id} hover>
                                                <TableCell>
                                                    <Stack direction="row" spacing={2} alignItems="center">
                                                        <Avatar
                                                            sx={{
                                                                width: 42,
                                                                height: 42,
                                                                bgcolor:
                                                                    u.role === "admin"
                                                                        ? "error.main"
                                                                        : u.role === "hospital"
                                                                        ? "primary.main"
                                                                        : "info.main",
                                                                fontWeight: 800,
                                                            }}
                                                        >
                                                            {u.fullName?.charAt(0)}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography fontWeight={800} fontSize={14}>
                                                                {u.fullName}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Joined {new Date(u.createdAt).toLocaleDateString()}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography fontSize={13} fontWeight={600}>
                                                        {u.email}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" fontSize={12}>
                                                        {u.phone}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Chip
                                                        label={u.role.toUpperCase()}
                                                        size="small"
                                                        color={ROLE_COLORS[u.role] || "default"}
                                                        sx={{ fontWeight: 800, fontSize: 11 }}
                                                    />
                                                </TableCell>

                                                <TableCell>
                                                    <Chip
                                                        label={u.status || "Approved"}
                                                        size="small"
                                                        variant="outlined"
                                                        color={
                                                            u.status === "Approved"
                                                                ? "success"
                                                                : u.status === "Pending"
                                                                ? "warning"
                                                                : "error"
                                                        }
                                                        sx={{ fontWeight: 700 }}
                                                    />
                                                </TableCell>

                                                <TableCell>
                                                    <Chip
                                                        label={isActive ? "Active" : "Deactivated"}
                                                        size="small"
                                                        color={isActive ? "success" : "default"}
                                                        sx={{ fontWeight: 700 }}
                                                    />
                                                </TableCell>

                                                <TableCell align="right">
                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                        <Tooltip title="View User Dossier">
                                                            <IconButton
                                                                size="small"
                                                                color="info"
                                                                onClick={() => setDetailUser(u)}
                                                            >
                                                                <InfoOutlined fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>

                                                        {u.role !== "admin" && (
                                                            <Tooltip title={isActive ? "Deactivate User" : "Activate User"}>
                                                                <IconButton
                                                                    size="small"
                                                                    color={isActive ? "error" : "success"}
                                                                    onClick={() => setToggleUser(u)}
                                                                >
                                                                    {isActive ? (
                                                                        <BlockRounded fontSize="small" />
                                                                    ) : (
                                                                        <CheckCircleOutlineRounded fontSize="small" />
                                                                    )}
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
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

            {/* Toggle Status Confirmation Dialog */}
            <Dialog open={Boolean(toggleUser)} onClose={() => setToggleUser(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>
                    {toggleUser?.isActive !== false ? "Deactivate Account" : "Activate Account"}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to {toggleUser?.isActive !== false ? "deactivate" : "activate"} user{" "}
                        <strong>{toggleUser?.fullName}</strong> ({toggleUser?.email})?
                        {toggleUser?.isActive !== false &&
                            " When deactivated, this user will be blocked from logging into the platform."}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setToggleUser(null)} color="inherit" sx={{ fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color={toggleUser?.isActive !== false ? "error" : "success"}
                        disabled={toggling}
                        onClick={handleToggleStatus}
                        sx={{ fontWeight: 800, textTransform: "none" }}
                    >
                        {toggling
                            ? "Updating..."
                            : toggleUser?.isActive !== false
                            ? "Confirm Deactivation"
                            : "Confirm Activation"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* User Detail Dialog */}
            <Dialog open={Boolean(detailUser)} onClose={() => setDetailUser(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>
                    User Account Record
                </DialogTitle>
                <DialogContent dividers>
                    {detailUser && (
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">
                                    Full Name
                                </Typography>
                                <Typography fontWeight={700}>
                                    {detailUser.fullName}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">
                                    Role
                                </Typography>
                                <Typography fontWeight={700}>
                                    {detailUser.role.toUpperCase()}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">
                                    Email
                                </Typography>
                                <Typography fontWeight={600}>
                                    {detailUser.email}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">
                                    Phone Number
                                </Typography>
                                <Typography fontWeight={600}>
                                    {detailUser.phone}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">
                                    Account Status
                                </Typography>
                                <Typography fontWeight={600}>
                                    {detailUser.isActive !== false ? "Active" : "Deactivated"}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">
                                    Registration Date
                                </Typography>
                                <Typography fontWeight={600}>
                                    {new Date(detailUser.createdAt).toLocaleString()}
                                </Typography>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDetailUser(null)} color="inherit" sx={{ fontWeight: 600 }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
}
