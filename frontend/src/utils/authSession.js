const LOGOUT_IN_PROGRESS_KEY = "auth:logout_in_progress_at";
const LOGOUT_TTL_MS = 45_000;

function appReturnTo() {
    const raw = import.meta.env.VITE_APP_ROOT_PATH;
    const basePath = raw && raw !== "/" ? (raw.startsWith("/") ? raw : `/${raw}`) : "";
    return `${window.location.origin}${basePath}`;
}

export function markLogoutInProgress() {
    try {
        sessionStorage.setItem(LOGOUT_IN_PROGRESS_KEY, String(Date.now()));
    } catch {
        // ignore storage write errors
    }
}

export function clearLogoutInProgress() {
    try {
        sessionStorage.removeItem(LOGOUT_IN_PROGRESS_KEY);
    } catch {
        // ignore storage write errors
    }
}

export function isLogoutInProgress() {
    try {
        const raw = sessionStorage.getItem(LOGOUT_IN_PROGRESS_KEY);
        if (!raw) return false;
        const at = Number(raw);
        if (!Number.isFinite(at)) {
            sessionStorage.removeItem(LOGOUT_IN_PROGRESS_KEY);
            return false;
        }
        const active = Date.now() - at < LOGOUT_TTL_MS;
        if (!active) {
            sessionStorage.removeItem(LOGOUT_IN_PROGRESS_KEY);
        }
        return active;
    } catch {
        return false;
    }
}

export function logoutUser(logout) {
    markLogoutInProgress();
    localStorage.removeItem("access_token");
    localStorage.removeItem("email_verified");
    sessionStorage.removeItem("redirect");

    return logout({
        logoutParams: {
            returnTo: appReturnTo(),
        },
        openUrl(url) {
            // Use a hard navigation to fully reset SPA state/caches after logout.
            window.location.replace(url);
        },
    });
}
