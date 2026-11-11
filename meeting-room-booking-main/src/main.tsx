import React from "react";
import ReactDOM from "react-dom/client";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import App from "./pages/App";
import "./styles.css";
const theme = createTheme({
  palette: {
    primary: { main: "#b83270" },
    secondary: { main: "#a45680" },
    background: { default: "#fff8fb", paper: "#ffffff" },
    text: { primary: "#49323f", secondary: "#796773" },
  },
  typography: {
    fontFamily: 'Tahoma, "Noto Sans Thai", sans-serif',
    button: { textTransform: "none", fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTextField: { defaultProps: { fullWidth: true, size: "small" } },
    MuiFormLabel: { styleOverrides: { asterisk: { color: "#d32f2f" } } },
  },
});
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
