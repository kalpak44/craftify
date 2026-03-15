import {useAuth0} from "@auth0/auth0-react";
import PropTypes from "prop-types";
import {useCallback, useEffect, useMemo, useState} from "react";
import {getUserPreferences, saveUserPreferences} from "../api/userPreferences";
import {useAuthFetch} from "../hooks/useAuthFetch";
import {useLocalization} from "../hooks/useLocalization";
import {useTheme} from "../hooks/useTheme";
import {UserPreferencesContext} from "./userPreferencesContext";

const DEFAULT_PREFERENCES = {
    locale: "en",
    theme: "dark",
    onboardingCompleted: false,
};

function normalizePreferences(data, fallbackLocale, fallbackTheme) {
    return {
        locale: data?.locale || fallbackLocale || DEFAULT_PREFERENCES.locale,
        theme: data?.theme || fallbackTheme || DEFAULT_PREFERENCES.theme,
        onboardingCompleted: Boolean(data?.onboardingCompleted),
    };
}

export function UserPreferencesProvider({children}) {
    const {getAccessTokenSilently, isAuthenticated, isLoading} = useAuth0();
    const authFetch = useAuthFetch();
    const {locale, setLocale} = useLocalization();
    const {theme, setTheme} = useTheme();
    const [preferences, setPreferences] = useState(() => ({
        ...DEFAULT_PREFERENCES,
        locale,
        theme,
    }));
    const [status, setStatus] = useState("idle");

    const applyPreferences = useCallback((nextPreferences) => {
        setPreferences(nextPreferences);
        setLocale(nextPreferences.locale);
        setTheme(nextPreferences.theme);
    }, [setLocale, setTheme]);

    const loadPreferences = useCallback(async () => {
        setStatus("loading");

        try {
            const token = await getAccessTokenSilently();
            localStorage.setItem("access_token", token);

            const response = await getUserPreferences(authFetch);
            applyPreferences(normalizePreferences(response, locale, theme));
            setStatus("ready");
        } catch (error) {
            console.error("Failed to load user preferences", error);
            applyPreferences(normalizePreferences(null, locale, theme));
            setStatus("error");
        }
    }, [applyPreferences, authFetch, getAccessTokenSilently, locale, theme]);

    useEffect(() => {
        if (isLoading) {
            return;
        }

        if (!isAuthenticated) {
            setPreferences((current) => ({
                ...current,
                locale,
                theme,
                onboardingCompleted: false,
            }));
            setStatus("idle");
            return;
        }

        loadPreferences().catch(console.error);
    }, [isAuthenticated, isLoading, loadPreferences, locale, theme]);

    const updatePreferences = useCallback(async (values) => {
        setStatus("saving");

        try {
            const saved = await saveUserPreferences(authFetch, values);
            const normalized = normalizePreferences(saved, locale, theme);
            applyPreferences(normalized);
            setStatus("ready");
            return normalized;
        } catch (error) {
            setStatus("error");
            throw error;
        }
    }, [applyPreferences, authFetch, locale, theme]);

    const value = useMemo(() => ({
        preferences,
        status,
        isReady: !isAuthenticated || status === "ready" || status === "error",
        reloadPreferences: loadPreferences,
        savePreferences: updatePreferences,
    }), [isAuthenticated, loadPreferences, preferences, status, updatePreferences]);

    return (
        <UserPreferencesContext.Provider value={value}>
            {children}
        </UserPreferencesContext.Provider>
    );
}

UserPreferencesProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
