const API_HOST = import.meta.env.VITE_API_HOST || "https://api.pavel-usanli.online/craftify/v1";
const USER_PREFERENCES_API_URL = `${API_HOST}/me/preferences`;

export async function getUserPreferences(authFetch) {
    const res = await authFetch(USER_PREFERENCES_API_URL, {method: "GET"});

    if (!res?.ok) {
        const txt = res ? await res.text() : "auth failed";
        throw new Error(txt || "Failed to fetch user preferences");
    }

    return res.json();
}

export async function saveUserPreferences(authFetch, payload) {
    const res = await authFetch(USER_PREFERENCES_API_URL, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload),
    });

    if (!res?.ok) {
        const txt = res ? await res.text() : "auth failed";
        throw new Error(txt || "Failed to save user preferences");
    }

    return res.json();
}
