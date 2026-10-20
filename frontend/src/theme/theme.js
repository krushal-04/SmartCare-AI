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
            main: colors.amber,
            light: colors.amberSoft,
        },
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
        h1: { fontFamily: fonts.display, fontWeight: 800 },
        h2: { fontFamily: fonts.display, fontWeight: 800 },
        h3: { fontFamily: fonts.display, fontWeight: 700 },
        h4: { fontFamily: fonts.display, fontWeight: 700 },
        h5: { fontFamily: fonts.display, fontWeight: 700 },
        h6: { fontFamily: fonts.display, fontWeight: 600 },
        subtitle1: { fontFamily: fonts.body, fontWeight: 500 },
        button: { textTransform: "none", fontWeight: 700 },
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
                    padding: "8px 18px",
                    transition: "all 0.2s ease-in-out",
                },
                containedPrimary: {
                    background: "linear-gradient(135deg, #0D9488 0%, #0F766E 100%)",
                    boxShadow: "0 4px 12px rgba(13, 148, 136, 0.25)",
                    "&:hover": {
                        background: "linear-gradient(135deg, #0F766E 0%, #115E59 100%)",
                        boxShadow: "0 6px 16px rgba(13, 148, 136, 0.35)",
                    },
                },
                containedSecondary: {
                    background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
                    boxShadow: "0 4px 12px rgba(2, 132, 199, 0.25)",
                    "&:hover": {
                        background: "linear-gradient(135deg, #0369A1 0%, #075985 100%)",
                        boxShadow: "0 6px 16px rgba(2, 132, 199, 0.35)",
                    },
                },
                sizeLarge: {
                    paddingTop: 12,
                    paddingBottom: 12,
                    paddingLeft: 24,
                    paddingRight: 24,
                    fontSize: "1rem",
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
                    border: `1px solid ${colors.hairline}`,
                    borderRadius: 16,
                    transition: "box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out",
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