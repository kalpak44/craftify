function appReturnTo() {
    const raw = import.meta.env.VITE_APP_ROOT_PATH;
    const basePath = raw && raw !== "/" ? (raw.startsWith("/") ? raw : `/${raw}`) : "";
    return `${window.location.origin}${basePath}`;
}

export function logoutUser(logout) {
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
