import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useNavigate } from "react-router-dom";

export default function PageHeader({
    title,
    subtitle,
    action,
    backTo,
    backLabel = "Back to Dashboard",
}) {
    const navigate = useNavigate();

    return (
        <Box sx={{ mb: 3 }}>
            {backTo && (
                <Box sx={{ mb: 1.5 }}>
                    <Button
                        size="small"
                        startIcon={<ArrowBackRoundedIcon />}
                        onClick={() => navigate(backTo)}
                        sx={{
                            textTransform: "none",
                            fontWeight: 700,
                            color: "text.secondary",
                            px: 1,
                            "&:hover": { color: "primary.main", bgcolor: "rgba(15,82,75,0.06)" },
                        }}
                    >
                        {backLabel}
                    </Button>
                </Box>
            )}

            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                gap={2}
            >
                <Box>
                    <Typography fontSize={{ xs: 24, md: 30 }} fontWeight={900}>
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography mt={0.5} color="text.secondary">
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                {action && <Box>{action}</Box>}
            </Stack>
        </Box>
    );
}
