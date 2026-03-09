import {useTheme} from "../../../hooks/useTheme";

export function ThemeToggle() {
    const {isDark, toggleTheme} = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-[var(--text-primary)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)] transition hover:bg-white dark:bg-white/10 dark:text-white dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] dark:hover:bg-white/14"
            aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
            title={`Switch to ${isDark ? "light" : "dark"} theme`}
        >
            <span aria-hidden="true" className="text-base">
                {isDark ? "◐" : "◑"}
            </span>
        </button>
    );
}
