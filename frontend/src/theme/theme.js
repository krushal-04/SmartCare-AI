import { createTheme } from "@mui/material/styles";
import { colors, fonts } from "./colors";

const theme = createTheme({
    palette: {
        primary: {
            main: colors.primary,
            dark: colors.primaryDark,
            light: colors.primaryLight,
            contrastText: colors.white,
        },
        secondary: {
            main: colors.secondary,
            dark: colors.secondaryDark,
            light: colors.secondarySoft,
            contrastText: colors.white,
        },
        error: {
            main: colors.brick,
            dark: colors.brickDeep,
            light: colors.brickSoft,
        },
        success: {
            main: colors.emerald,
            light: colors.emeraldSoft,
        },
        warning: {
            main: colors.warning,
            light: colors.amberSoft,
        },
        info: { main: colors.info },
        background: {
            default: colors.canvas,
            paper: colors.white,
        },
        text: {
            primary: colors.ink,
            secondary: colors.slate,
        },
        divider: colors.hairline,
    },

    typography: {
        fontFamily: fonts.body,
        h1: { fontFamily: fonts.display, fontWeight: 750, fontSize: "clamp(1.5rem, 2vw, 1.75rem)", lineHeight: 1.25 },
        h2: { fontFamily: fonts.display, fontWeight: 750, fontSize: "1.25rem", lineHeight: 1.3 },
        h3: { fontFamily: fonts.display, fontWeight: 700, fontSize: "1.125rem", lineHeight: 1.35 },
        h4: { fontFamily: fonts.display, fontWeight: 700, fontSize: "1.0625rem" },
        h5: { fontFamily: fonts.display, fontWeight: 700, fontSize: "1rem" },
        h6: { fontFamily: fonts.display, fontWeight: 700, fontSize: "0.9375rem" },
        body1: { fontSize: "0.9375rem", lineHeight: 1.55 },
        body2: { fontSize: "0.875rem", lineHeight: 1.5 },
        caption: { fontSize: "0.8125rem", lineHeight: 1.45 },
        subtitle1: { fontFamily: fonts.body, fontWeight: 500, fontSize: "0.9375rem" },
        button: { textTransform: "none", fontWeight: 700, fontSize: "0.875rem" },
    },

    shape: {
        borderRadius: 12,
    },

    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: 10,
                    boxShadow: "none",
                    minHeight: 40,
                    padding: "8px 16px",
                    transition: "all 0.2s ease-in-out",
                },
                containedPrimary: {
                    background: colors.primary,
                    boxShadow: "0 2px 6px rgba(16, 42, 67, 0.18)",
                    "&:hover": {
                        background: colors.primaryDark,
                        boxShadow: "0 4px 10px rgba(16, 42, 67, 0.22)",
                    },
                },
                containedSecondary: {
                    background: colors.secondary,
                    boxShadow: "0 2px 6px rgba(13, 148, 136, 0.18)",
                    "&:hover": {
                        background: colors.secondaryDark,
                        boxShadow: "0 4px 10px rgba(13, 148, 136, 0.22)",
                    },
                },
                sizeLarge: {
                    minHeight: 48,
                    paddingTop: 10,
                    paddingBottom: 10,
                    paddingLeft: 24,
                    paddingRight: 24,
                    fontSize: "1rem",
                },
            },
        },
        MuiContainer: {
            styleOverrides: {
                root: {
                    "@media (max-width:599.95px)": {
                        paddingLeft: 16,
                        paddingRight: 16,
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: "0 2px 8px rgba(16, 42, 67, 0.06)",
                    border: `1px solid ${colors.hairline}`,
                    borderRadius: 16,
                    transition: "box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out",
                },
            },
        },
        MuiCardContent: {
            styleOverrides: {
                root: { padding: 20, "&:last-child": { paddingBottom: 20 } },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    margin: 16,
                    borderRadius: 16,
                    width: "calc(100% - 32px)",
                    maxHeight: "calc(100dvh - 32px)",
                    display: "flex",
                    flexDirection: "column",
                },
            },
        },
        MuiDialogTitle: { styleOverrides: { root: { padding: "20px 24px 12px", fontWeight: 700, fontSize: "1.125rem", "@media (max-width:599.95px)": { padding: "16px 18px 10px", fontSize: "1rem" } } } },
        MuiDialogContent: { styleOverrides: { root: { padding: "12px 24px 20px", overflowY: "auto", "@media (max-width:599.95px)": { padding: "10px 18px 16px" } } } },
        MuiDialogActions: { styleOverrides: { root: { padding: "12px 24px 20px", gap: 8, flexWrap: "wrap", "@media (max-width:599.95px)": { padding: "10px 18px 16px", "& .MuiButton-root": { flex: "1 1 auto" } } } } },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    "@media (max-width:599.95px)": {
                        maxWidth: "calc(100vw - 24px)",
                    },
                },
            },
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    "@media (max-width:599.95px)": {
                        maxWidth: "calc(100vw - 24px)",
                    },
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                root: {
                    maxWidth: "100%",
                    "@media (max-width:599.95px)": { minHeight: 42 },
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    "@media (max-width:599.95px)": {
                        minHeight: 42,
                        minWidth: "auto",
                        padding: "8px 12px",
                        fontSize: "0.75rem",
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 700,
                    borderRadius: 8,
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    backgroundColor: colors.white,
                    "& fieldset": {
                        borderColor: colors.hairline,
                    },
                    "&:hover fieldset": {
                        borderColor: colors.primary,
                    },
                    "&.Mui-focused fieldset": {
                        borderColor: colors.primary,
                        borderWidth: 2,
                    },
                },
            },
        },
        MuiInputLabel: { styleOverrides: { root: { fontSize: "0.875rem", fontWeight: 600, color: colors.inkSoft } } },
        MuiTableContainer: { styleOverrides: { root: { border: `1px solid ${colors.hairline}`, borderRadius: 12, maxWidth: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" } } },
        MuiTableHead: { styleOverrides: { root: { backgroundColor: "#F1F5F9" } } },
        MuiTableCell: {
            styleOverrides: {
                root: { borderColor: colors.hairline, padding: "12px 16px", fontSize: "0.875rem", color: colors.ink, whiteSpace: "normal", "@media (max-width:599.95px)": { padding: "10px 12px", fontSize: "0.8125rem" } },
                head: { fontWeight: 700, color: colors.ink, fontSize: "0.75rem", letterSpacing: "0.03em", textTransform: "uppercase" },
            },
        },
        MuiTableRow: { styleOverrides: { root: { "&:last-child td, &:last-child th": { borderBottom: 0 }, "&:hover": { backgroundColor: "#F8FAFC" } } } },
        MuiAlert: { styleOverrides: { root: { borderRadius: 10, alignItems: "center" } } },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: "none",
                },
            },
        },
    },
});

export default theme;
