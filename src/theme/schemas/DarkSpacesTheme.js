import { createTheme } from "@mui/material/styles";
// import poppins from "@/utils/fontConfig";

export const DarkSpacesTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#03dac6",
    },
    error:{
      main:"#ff0000",
    },
    background: {
      default: "#121212",
    },
  },
  typography: {
    // fontFamily: poppins.style.fontFamily,
    htmlFontSize: 16, //16px
    h1: {
      fontSize: "3rem", // 48px
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "2.5rem", // 40px
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: "2rem", // 32px
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: "1.75rem", // 28px
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1.5rem", // 24px
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: "1.25rem", // 20px
      fontWeight: 500,
      lineHeight: 1.6,
    },
    subtitle1: {
      fontSize: "1rem", // 16px
      fontWeight: 400,
      lineHeight: 1.75,
    },
    subtitle2: {
      fontSize: "0.875rem", // 14px
      fontWeight: 400,
      lineHeight: 1.75,
    },
    body1: {
      fontSize: "1rem", // 16px
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "0.875rem", // 14px
      fontWeight: 400,
      lineHeight: 1.5,
    },
    button: {
      fontSize: "0.875rem", // 14px
      fontWeight: 600,
      textTransform: "uppercase",
    },
    caption: {
      fontSize: "0.75rem", // 12px
      fontWeight: 400,
      lineHeight: 1.4,
    },
    overline: {
      fontSize: "0.625rem", // 10px
      fontWeight: 600,
      textTransform: "uppercase",
      lineHeight: 1.4,
    },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          height: "3.2rem",
          backgroundColor: "#121212",
          color: "#ffffff",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#ffffff",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#ffffff ",
          },
          "&::placeholder": {
            color: "#888888",
          },
          input: {
            padding: "8px 12px",
          },
        },
        notchedOutline: {
          borderColor: "#888888",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#1e1e1e",
          color: "#ffffff",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          "&:hover": {
            boxShadow: "0 6px 12px rgba(0, 0, 0, 0.2)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#1e1e1e",
          color: "#ffffff",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          "&:hover": {
            boxShadow: "0 6px 12px rgba(0, 0, 0, 0.2)",
          },
        },
      },
    },
  },
});
