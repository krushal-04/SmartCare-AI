import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

export default function StatCard({ title, value = "0", icon }) {
    return (
        <Card elevation={0} sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography fontSize={13} fontWeight={600} color="text.secondary" noWrap>{title}</Typography>
                        <Typography fontSize={30} lineHeight={1.15} fontWeight={750} mt={0.75}>{value}</Typography>
                    </Box>
                    <Box sx={{ width: 44, height: 44, flexShrink: 0, borderRadius: 2.5, bgcolor: "secondary.light", color: "secondary.dark", display: "grid", placeItems: "center" }}>{icon}</Box>
                </Stack>
            </CardContent>
        </Card>
    );
}
