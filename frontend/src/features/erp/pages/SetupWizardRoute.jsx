import {useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {Toast} from "../../../components/common/Toast";
import {useUserPreferences} from "../../../hooks/useUserPreferences";
import {PreferenceSelectField} from "../components/PreferenceSelectField";
import {PageContainer} from "../../../shared/ui/templates/PageContainer";
import {SectionHeading} from "../../../shared/ui/atoms/SectionHeading";
import {Surface} from "../../../shared/ui/atoms/Surface";
import {Button} from "../../../shared/ui/atoms/Button";
import {StatusBadge} from "../../../shared/ui/atoms/StatusBadge";
import {useLocalization} from "../../../hooks/useLocalization";
import {useTheme} from "../../../hooks/useTheme";

const STEP_KEYS = ["locale", "theme", "review"];

export function SetupWizardRoute() {
    const navigate = useNavigate();
    const {locale, setLocale, supportedLocales, t} = useLocalization();
    const {theme, setTheme} = useTheme();
    const {preferences, savePreferences, status} = useUserPreferences();
    const [stepIndex, setStepIndex] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [form, setForm] = useState(() => ({
        locale: preferences.locale || locale,
        theme: preferences.theme || theme,
    }));

    useEffect(() => {
        setForm({
            locale: preferences.locale || locale,
            theme: preferences.theme || theme,
        });
    }, [locale, preferences.locale, preferences.theme, theme]);

    const currentStep = STEP_KEYS[stepIndex];
    const isLastStep = stepIndex === STEP_KEYS.length - 1;

    const summaryRows = useMemo(() => [
        {
            label: t("wizard.language"),
            value: supportedLocales.find((entry) => entry.code === form.locale)?.label ?? form.locale,
        },
        {
            label: t("wizard.theme"),
            value: form.theme === "light" ? t("wizard.lightTheme") : t("wizard.darkTheme"),
        },
    ], [form.locale, form.theme, supportedLocales, t]);

    const languageOptions = supportedLocales.map((entry) => ({value: entry.code, label: entry.label}));
    const themeOptions = [
        {value: "light", label: t("wizard.lightTheme")},
        {value: "dark", label: t("wizard.darkTheme")},
    ];

    const next = async () => {
        if (isLastStep) {
            try {
                const saved = await savePreferences({
                    locale: form.locale,
                    theme: form.theme,
                    onboardingCompleted: true,
                });
                setLocale(saved.locale);
                setTheme(saved.theme);
            } catch (error) {
                console.error("Failed to save onboarding preferences", error);
                setFeedback(t("wizard.saveError"));
                return;
            }
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
                            <div key={stepKey} className="glass-panel flex items-center gap-3 rounded-3xl p-4">
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/40 bg-white/35 text-sm font-semibold text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:border-white/10 dark:bg-white/10 dark:text-white">
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
                            <PreferenceSelectField
                                label={t("wizard.language")}
                                helper={t("wizard.step.locale.fieldHelp")}
                                value={form.locale}
                                onChange={(value) => {
                                    setForm((current) => ({...current, locale: value}));
                                    setLocale(value);
                                }}
                                options={languageOptions}
                            />
                        </div>
                    ) : null}

                    {currentStep === "theme" ? (
                        <div className="space-y-5">
                            <div>
                                <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                                    {t("wizard.step.theme.title")}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                                    {t("wizard.step.theme.help")}
                                </p>
                            </div>
                            <PreferenceSelectField
                                label={t("wizard.theme")}
                                helper={t("wizard.step.theme.fieldHelp")}
                                value={form.theme}
                                onChange={(value) => {
                                    setForm((current) => ({...current, theme: value}));
                                    setTheme(value);
                                }}
                                options={themeOptions}
                            />
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
                                    <div key={row.label} className="glass-panel flex items-center justify-between gap-3 rounded-3xl p-4">
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
                        <Button onClick={next} disabled={status === "saving"}>
                            {isLastStep ? (status === "saving" ? t("wizard.saving") : t("wizard.finish")) : t("wizard.next")}
                        </Button>
                    </div>
                </Surface>
            </div>

            {feedback ? <Toast message={feedback} onClose={() => setFeedback("")}/> : null}
        </PageContainer>
    );
}
