import { createTheme } from "@material-ui/core/styles";

const GCTheme = createTheme({
    palette: {
        primary: {
            main: "#0090de",
            contrastText: "#ffffff"
        },
        secondary: {
            main: "#e53333"
        }
    }
});

export default GCTheme;