import {useEffect, useMemo, useState} from "react";
import PropTypes from "prop-types";
import {ThemeContext} from "./themeContext";

const THEME_STORAGE_KEY = "craftify-theme";
const getInitialTheme = () => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
    return "dark";
};

export const ThemeProvider = ({children}) => {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        document.documentElement.classList.toggle("dark", theme === "dark");
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    const value = useMemo(() => ({
        theme,
        isDark: theme === "dark",
        setTheme,
        toggleTheme: () => setTheme((prev) => (prev === "dark" ? "light" : "dark")),
    }), [theme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

ThemeProvider.propTypes = {children: PropTypes.node.isRequired};
