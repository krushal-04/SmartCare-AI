import { useEffect, useState } from "react";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import {
    CloseOutlined,
    DescriptionOutlined,
    DownloadOutlined,
    UploadFileOutlined,
} from "@mui/icons-material";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../services/api";

export default function PatientReports() {
    const [reports, setReports] =
        useState([]);

    const [reportType, setReportType] =
        useState("Other");

    const [notes, setNotes] =
        useState("");

    const [file, setFile] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [uploading, setUploading] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    const loadReports =
        async () => {
            try {
                setLoading(true);

                const response =
                    await api.get(
                        "/reports/my"
                    );

                setReports(
                    response.data
                        .reports || []
                );
            } catch (err) {
                setError(
                    err.response?.data
                        ?.message ||
                        "Unable to load reports."
                );
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        loadReports();
    }, []);

    const uploadReport =
        async () => {
            if (!file) {
                setError(
                    "Please select a report."
                );
                return;
            }

            try {
                setUploading(true);
                setError("");
                setMessage("");

                const formData = new FormData();
                formData.append("reportFile", file);
                formData.append("report", file);
                formData.append("reportType", reportType);
                formData.append("notes", notes);

                await api.post("/reports/upload", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });

                setFile(null);
                setNotes("");

                setMessage(
                    "Medical report uploaded successfully."
                );

                loadReports();
            } catch (err) {
                setError(
                    err.response?.data
                        ?.message ||
                        "Unable to upload report."
                );
            } finally {
                setUploading(false);
            }
        };

    const downloadReport =
        async (report) => {
            try {
                const response =
                    await api.get(
                        `/reports/${report._id}/download`,
                        {
                            responseType:
                                "blob",
                        }
                    );

                const blob =
                    new Blob([
                        response.data,
                    ], {
                        type:
                            response.headers[
                                "content-type"
                            ],
                    });

                const url =
                    window.URL.createObjectURL(
                        blob
                    );

                const link =
                    document.createElement(
                        "a"
                    );

                link.href = url;
                link.download =
                    report.originalName;

                document.body.appendChild(
                    link
                );

                link.click();
                link.remove();

                window.URL.revokeObjectURL(
                    url
                );
            } catch (err) {
                setError(
                    "Unable to download report."
                );
            }
        };

    const deleteReport =
        async (id) => {
            if (
                !window.confirm(
                    "Delete this medical report?"
                )
            ) {
                return;
            }

            try {
                await api.delete(
                    `/reports/${id}`
                );

                loadReports();
            } catch (err) {
                setError(
                    err.response?.data
                        ?.message ||
                        "Unable to delete report."
                );
            }
        };

    return (
        <DashboardLayout
            role="patient"
            title="Medical Reports"
            subtitle="Securely manage your medical documents"
        >
            {message && (
                <Alert
                    severity="success"
                    sx={{ mb: 2 }}
                >
                    {message}
                </Alert>
            )}

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                >
                    {error}
                </Alert>
            )}

            <Card
                elevation={0}
                sx={{
                    mb: 3,
                    border:
                        "1px solid #E3EBEE",
                    borderRadius: 4,
                }}
            >
                <CardContent sx={{ p: 3 }}>
                    <Typography
                        fontSize={23}
                        fontWeight={900}
                    >
                        Upload Medical Report
                    </Typography>

                    <Grid
                        container
                        spacing={2}
                        mt={0.5}
                    >
                        <Grid
                            item
                            xs={12}
                            md={4}
                        >
                            <FormControl
                                fullWidth
                            >
                                <InputLabel>
                                    Report Type
                                </InputLabel>

                                <Select
                                    value={
                                        reportType
                                    }
                                    label="Report Type"
                                    onChange={(
                                        e
                                    ) =>
                                        setReportType(
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                >
                                    <MenuItem value="Blood Test">
                                        Blood Test
                                    </MenuItem>

                                    <MenuItem value="X-Ray">
                                        X-Ray
                                    </MenuItem>

                                    <MenuItem value="MRI">
                                        MRI
                                    </MenuItem>

                                    <MenuItem value="CT Scan">
                                        CT Scan
                                    </MenuItem>

                                    <MenuItem value="Prescription">
                                        Prescription
                                    </MenuItem>

                                    <MenuItem value="Discharge Summary">
                                        Discharge Summary
                                    </MenuItem>

                                    <MenuItem value="Other">
                                        Other
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid
                            item
                            xs={12}
                            md={8}
                        >
                            <Button
                                component="label"
                                variant="outlined"
                                startIcon={
                                    <UploadFileOutlined />
                                }
                                sx={{
                                    height:
                                        "56px",
                                }}
                            >
                                {file
                                    ? file.name
                                    : "Choose Report File"}

                                <input
                                    hidden
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) =>
                                        setFile(
                                            e
                                                .target
                                                .files?.[0] ||
                                                null
                                        )
                                    }
                                />
                            </Button>
                        </Grid>

                        <Grid
                            item
                            xs={12}
                        >
                            <TextField
                                fullWidth
                                multiline
                                minRows={3}
                                label="Notes"
                                value={notes}
                                onChange={(e) =>
                                    setNotes(
                                        e
                                            .target
                                            .value
                                    )
                                }
                            />
                        </Grid>
                    </Grid>

                    <Button
                        variant="contained"
                        onClick={
                            uploadReport
                        }
                        disabled={
                            uploading ||
                            !file
                        }
                        sx={{ mt: 2 }}
                    >
                        {uploading
                            ? "Uploading..."
                            : "Upload Report"}
                    </Button>
                </CardContent>
            </Card>

            <Typography
                fontSize={23}
                fontWeight={900}
                mb={2}
            >
                My Reports
            </Typography>

            {loading ? (
                <Box
                    textAlign="center"
                    py={7}
                >
                    <CircularProgress />
                </Box>
            ) : reports.length ===
              0 ? (
                <Card
                    elevation={0}
                    sx={{
                        border:
                            "1px solid #E3EBEE",
                        borderRadius: 4,
                    }}
                >
                    <CardContent
                        sx={{
                            py: 7,
                            textAlign:
                                "center",
                        }}
                    >
                        <DescriptionOutlined
                            sx={{
                                fontSize: 52,
                                color:
                                    "#0B8793",
                            }}
                        />

                        <Typography
                            fontWeight={900}
                            mt={1}
                        >
                            No medical reports
                        </Typography>

                        <Typography
                            color="text.secondary"
                        >
                            Upload your reports
                            to keep your
                            healthcare records
                            organized.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                reports.map(
                    (report) => (
                        <Card
                            key={
                                report._id
                            }
                            elevation={0}
                            sx={{
                                mb: 2,
                                border:
                                    "1px solid #E3EBEE",
                                borderRadius: 4,
                            }}
                        >
                            <CardContent>
                                <Stack
                                    direction={{
                                        xs: "column",
                                        md: "row",
                                    }}
                                    justifyContent="space-between"
                                    gap={2}
                                >
                                    <Box>
                                        <Stack
                                            direction="row"
                                            spacing={
                                                1
                                            }
                                            alignItems="center"
                                        >
                                            <DescriptionOutlined
                                                sx={{
                                                    color:
                                                        "#0B8793",
                                                }}
                                            />

                                            <Typography
                                                fontWeight={
                                                    900
                                                }
                                            >
                                                {
                                                    report.originalName
                                                }
                                            </Typography>
                                        </Stack>

                                        <Stack
                                            direction="row"
                                            spacing={
                                                1
                                            }
                                            mt={
                                                1
                                            }
                                        >
                                            <Chip
                                                size="small"
                                                label={
                                                    report.reportType
                                                }
                                            />

                                            <Chip
                                                size="small"
                                                variant="outlined"
                                                label={
                                                    report.createdAt
                                                        ? new Date(
                                                              report.createdAt
                                                          ).toLocaleDateString()
                                                        : "—"
                                                }
                                            />
                                        </Stack>

                                        {report.notes && (
                                            <Typography
                                                color="text.secondary"
                                                fontSize={
                                                    13
                                                }
                                                mt={
                                                    1
                                                }
                                            >
                                                {
                                                    report.notes
                                                }
                                            </Typography>
                                        )}
                                    </Box>

                                    <Stack
                                        direction="row"
                                        spacing={
                                            1
                                        }
                                    >
                                        <Button
                                            startIcon={
                                                <DownloadOutlined />
                                            }
                                            onClick={() =>
                                                downloadReport(
                                                    report
                                                )
                                            }
                                        >
                                            Download
                                        </Button>

                                        <Button
                                            color="error"
                                            startIcon={
                                                <CloseOutlined />
                                            }
                                            onClick={() =>
                                                deleteReport(
                                                    report._id
                                                )
                                            }
                                        >
                                            Delete
                                        </Button>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    )
                )
            )}
        </DashboardLayout>
    );
}