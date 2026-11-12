import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { WarningAmberRounded } from "@mui/icons-material";

/** A consistent, accessible confirmation step for destructive patient actions. */
export default function ConfirmDialog({
    open,
    title = "Please confirm",
    description,
    confirmLabel = "Confirm",
    loading = false,
    severity = "error",
    onClose,
    onConfirm,
}) {
    const isDanger = severity === "error";

    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs">
            <DialogTitle sx={{ pb: 1 }}>
                <Stack direction="row" spacing={1.25} alignItems="flex-start">
                    <WarningAmberRounded color={isDanger ? "error" : "warning"} />
                    <Typography component="span" variant="h6">{title}</Typography>
                </Stack>
            </DialogTitle>
            <DialogContent>
                <Typography color="text.secondary">{description}</Typography>
                {isDanger && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        This action cannot be undone.
                    </Alert>
                )}
            </DialogContent>
            <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2.5 }, gap: 1 }}>
                <Button onClick={onClose} disabled={loading} variant="outlined">Keep</Button>
                <Button onClick={onConfirm} disabled={loading} color={severity} variant="contained">
                    {loading ? "Please wait…" : confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
