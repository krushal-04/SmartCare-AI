import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { WarningAmberRounded } from "@mui/icons-material";

/** A consistent, accessible confirmation step for destructive patient actions. */
export default function ConfirmDialog({
    open,
    title = "Please confirm",
    description,
    confirmLabel = "Confirm",
    confirmText,
    cancelText = "Keep",
    loading = false,
    severity = "error",
    onClose,
    onConfirm,
}) {
    const isDanger = severity === "error";
    const finalConfirmLabel = confirmText || confirmLabel;

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
            </DialogContent>
            <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2.5 }, gap: 1 }}>
                <Button onClick={onClose} disabled={loading} variant="outlined">{cancelText}</Button>
                <Button onClick={onConfirm} disabled={loading} color={severity} variant="contained">
                    {loading ? "Please wait…" : finalConfirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
