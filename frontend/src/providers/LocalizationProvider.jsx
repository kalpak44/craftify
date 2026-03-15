import {useEffect, useMemo, useState} from "react";
import PropTypes from "prop-types";
import {LocalizationContext} from "./localizationContext";
import {DEFAULT_LOCALE, MESSAGES, SUPPORTED_LOCALES} from "../shared/i18n/messages";

const LOCALE_STORAGE_KEY = "craftify-locale";
const supportedLocaleCodes = new Set(SUPPORTED_LOCALES.map(({code}) => code));

const getInitialLocale = () => {
    if (typeof window === "undefined") {
        return DEFAULT_LOCALE;
    }

    const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (savedLocale && supportedLocaleCodes.has(savedLocale)) {
        return savedLocale;
    }

    const browserLocale = window.navigator.language.toLowerCase().split("-")[0];
    if (supportedLocaleCodes.has(browserLocale)) {
        return browserLocale;
    }

    return DEFAULT_LOCALE;
};

const formatMessage = (message, values) => {
    if (!values) {
        return message;
    }

    return Object.entries(values).reduce(
        (formatted, [key, value]) => formatted.replaceAll(`{${key}}`, value ?? ""),
        message,
    );
};

const getNestedMessage = (messages, key) => key
    .split(".")
    .reduce((value, segment) => (value && typeof value === "object" ? value[segment] : undefined), messages);

const getMessage = (locale, key, fallback) => getNestedMessage(MESSAGES[locale], key)
    ?? getNestedMessage(MESSAGES[DEFAULT_LOCALE], key)
    ?? fallback
    ?? key;

export function LocalizationProvider({children}) {
    const [locale, setLocale] = useState(getInitialLocale);

    useEffect(() => {
        document.documentElement.lang = locale;
        window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }, [locale]);

    const value = useMemo(() => ({
        locale,
        setLocale,
        supportedLocales: SUPPORTED_LOCALES,
        t: (key, values, fallback) => formatMessage(getMessage(locale, key, fallback), values),
    }), [locale]);

    return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

LocalizationProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
