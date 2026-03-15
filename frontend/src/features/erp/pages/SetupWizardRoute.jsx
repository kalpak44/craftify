import {useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {PageContainer} from "../../../shared/ui/templates/PageContainer";
import {SectionHeading} from "../../../shared/ui/atoms/SectionHeading";
import {Surface} from "../../../shared/ui/atoms/Surface";
import {Button} from "../../../shared/ui/atoms/Button";
import {StatusBadge} from "../../../shared/ui/atoms/StatusBadge";
import {useLocalization} from "../../../hooks/useLocalization";
import {useTheme} from "../../../hooks/useTheme";

const STEP_KEYS = ["company", "locale", "operations", "review"];

export function SetupWizardRoute() {
    const navigate = useNavigate();
    const {locale, setLocale, supportedLocales, t} = useLocalization();
    const {theme, setTheme} = useTheme();
    const [stepIndex, setStepIndex] = useState(0);
    const [form, setForm] = useState({
        companyName: "Craftify Central Kitchen",
        currency: "EUR",
        unitSystem: "metric",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Sofia",
        dateFormat: "dd/MM/yyyy",
    });

    const currentStep = STEP_KEYS[stepIndex];
    const canGoBack = stepIndex > 0;
    const isLastStep = stepIndex === STEP_KEYS.length - 1;

    const summaryRows = useMemo(() => [
        {label: t("wizard.companyName"), value: form.companyName},
        {label: t("wizard.language"), value: locale},
        {label: t("wizard.currency"), value: form.currency},
        {label: t("wizard.units"), value: form.unitSystem},
        {label: t("wizard.timezone"), value: form.timezone},
        {label: t("wizard.dateFormat"), value: form.dateFormat},
        {label: t("wizard.theme"), value: theme},
    ], [form.companyName, form.currency, form.dateFormat, form.timezone, form.unitSystem, locale, t, theme]);

    const next = () => {
        if (isLastStep) {
            navigate("/dashboard");
            return;
        }
        setStepIndex((index) => Math.min(index + 1, STEP_KEYS.length - 1));
    };

    return (
        <PageContainer className="space-y-6">
            <SectionHeading
                eyebrow={t("wizard.eyebrow")}
                title={t("wizard.title")}
                description={t("wizard.description")}
            />

            <div className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
                <Surface className="p-6">
                    <p className="eyebrow">{t("wizard.progressEyebrow")}</p>
                    <div className="mt-5 space-y-3">
                        {STEP_KEYS.map((stepKey, index) => (
                            <div key={stepKey} className="flex items-center gap-3 rounded-3xl bg-white/60 p-4 dark:bg-white/6">
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-black/5 text-sm font-semibold text-[var(--text-primary)] dark:bg-white/8 dark:text-white">
                                    {index + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                                        {t(`wizard.step.${stepKey}.title`)}
                                    </p>
                                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                        {t(`wizard.step.${stepKey}.description`)}
                                    </p>
                                </div>
                                {index === stepIndex ? <StatusBadge tone="teal">{t("wizard.activeStep")}</StatusBadge> : null}
                            </div>
                        ))}
                    </div>
                </Surface>

                <Surface className="p-6 md:p-7">
                    {currentStep === "company" ? (
                        <div className="space-y-5">
                            <div>
                                <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                                    {t("wizard.step.company.title")}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                                    {t("wizard.step.company.help")}
                                </p>
                            </div>
                            <label className="block">
                                <span className="text-sm font-semibold text-[var(--text-primary)]">{t("wizard.companyName")}</span>
                                <input
                                    type="text"
                                    value={form.companyName}
                                    onChange={(event) => setForm((current) => ({...current, companyName: event.target.value}))}
                                    className="mt-2 h-12 w-full rounded-3xl bg-white/70 px-4 text-sm text-[var(--text-primary)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)] outline-none dark:bg-white/10 dark:text-white dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
                                />
                            </label>
                        </div>
                    ) : null}

                    {currentStep === "locale" ? (
                        <div className="space-y-5">
                            <div>
                                <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                                    {t("wizard.step.locale.title")}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                                    {t("wizard.step.locale.help")}
                                </p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="block">
                                    <span className="text-sm font-semibold text-[var(--text-primary)]">{t("wizard.language")}</span>
                                    <select
                                        value={locale}
                                        onChange={(event) => setLocale(event.target.value)}
                                        className="mt-2 h-12 w-full rounded-3xl bg-white/70 px-4 text-sm text-[var(--text-primary)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)] outline-none dark:bg-white/10 dark:text-white dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
                                    >
                                        {supportedLocales.map((entry) => (
                                            <option key={entry.code} value={entry.code}>{entry.label}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="block">
                                    <span className="text-sm font-semibold text-[var(--text-primary)]">{t("wizard.currency")}</span>
                                    <select
                                        value={form.currency}
                                        onChange={(event) => setForm((current) => ({...current, currency: event.target.value}))}
                                        className="mt-2 h-12 w-full rounded-3xl bg-white/70 px-4 text-sm text-[var(--text-primary)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)] outline-none dark:bg-white/10 dark:text-white dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
                                    >
                                        <option value="EUR">EUR</option>
                                        <option value="USD">USD</option>
                                        <option value="BGN">BGN</option>
                                    </select>
                                </label>
                            </div>
                        </div>
                    ) : null}

                    {currentStep === "operations" ? (
                        <div className="space-y-5">
                            <div>
                                <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                                    {t("wizard.step.operations.title")}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                                    {t("wizard.step.operations.help")}
                                </p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="block">
                                    <span className="text-sm font-semibold text-[var(--text-primary)]">{t("wizard.units")}</span>
                                    <select
                                        value={form.unitSystem}
                                        onChange={(event) => setForm((current) => ({...current, unitSystem: event.target.value}))}
                                        className="mt-2 h-12 w-full rounded-3xl bg-white/70 px-4 text-sm text-[var(--text-primary)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)] outline-none dark:bg-white/10 dark:text-white dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
                                    >
                                        <option value="metric">{t("wizard.metricUnits")}</option>
                                        <option value="imperial">{t("wizard.imperialUnits")}</option>
                                    </select>
                                </label>
                                <label className="block">
                                    <span className="text-sm font-semibold text-[var(--text-primary)]">{t("wizard.theme")}</span>
                                    <select
                                        value={theme}
                                        onChange={(event) => setTheme(event.target.value)}
                                        className="mt-2 h-12 w-full rounded-3xl bg-white/70 px-4 text-sm text-[var(--text-primary)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)] outline-none dark:bg-white/10 dark:text-white dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
                                    >
                                        <option value="light">{t("wizard.lightTheme")}</option>
                                        <option value="dark">{t("wizard.darkTheme")}</option>
                                    </select>
                                </label>
                                <label className="block">
                                    <span className="text-sm font-semibold text-[var(--text-primary)]">{t("wizard.timezone")}</span>
                                    <input
                                        type="text"
                                        value={form.timezone}
                                        onChange={(event) => setForm((current) => ({...current, timezone: event.target.value}))}
                                        className="mt-2 h-12 w-full rounded-3xl bg-white/70 px-4 text-sm text-[var(--text-primary)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)] outline-none dark:bg-white/10 dark:text-white dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-semibold text-[var(--text-primary)]">{t("wizard.dateFormat")}</span>
                                    <input
                                        type="text"
                                        value={form.dateFormat}
                                        onChange={(event) => setForm((current) => ({...current, dateFormat: event.target.value}))}
                                        className="mt-2 h-12 w-full rounded-3xl bg-white/70 px-4 text-sm text-[var(--text-primary)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)] outline-none dark:bg-white/10 dark:text-white dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
                                    />
                                </label>
                            </div>
                        </div>
                    ) : null}

                    {currentStep === "review" ? (
                        <div className="space-y-5">
                            <div>
                                <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                                    {t("wizard.step.review.title")}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                                    {t("wizard.step.review.help")}
                                </p>
                            </div>
                            <div className="grid gap-3">
                                {summaryRows.map((row) => (
                                    <div key={row.label} className="flex items-center justify-between gap-3 rounded-3xl bg-white/60 p-4 dark:bg-white/6">
                                        <span className="text-sm text-[var(--text-secondary)]">{row.label}</span>
                                        <span className="text-sm font-semibold text-[var(--text-primary)]">{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    <div className="mt-8 flex flex-wrap justify-between gap-3">
                        <Button variant="ghost" onClick={() => setStepIndex((index) => Math.max(index - 1, 0))} disabled={stepIndex === 0}>
                            {t("wizard.back")}
                        </Button>
                        <Button onClick={next}>
                            {isLastStep ? t("wizard.finish") : t("wizard.next")}
                        </Button>
                    </div>
                </Surface>
            </div>
        </PageContainer>
    );
}
