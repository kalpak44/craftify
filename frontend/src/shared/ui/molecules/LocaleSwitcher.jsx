import {useId} from "react";
import {useLocalization} from "../../../hooks/useLocalization";

export function LocaleSwitcher() {
    const {locale, setLocale, supportedLocales, t} = useLocalization();
    const selectId = useId();

    return (
        <div className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)] dark:bg-white/10 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]" htmlFor={selectId}>
                {t("common.language")}
            </label>
            <select
                id={selectId}
                value={locale}
                onChange={(event) => setLocale(event.target.value)}
                className="bg-transparent text-sm font-medium text-[var(--text-primary)] outline-none"
                aria-label={t("common.languageSwitcher")}
            >
                {supportedLocales.map((entry) => (
                    <option key={entry.code} value={entry.code}>
                        {entry.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
