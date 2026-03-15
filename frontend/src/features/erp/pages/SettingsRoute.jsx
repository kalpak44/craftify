import {useEffect, useState} from "react";
import {useAuth0} from "@auth0/auth0-react";
import {Toast} from "../../../components/common/Toast";
import {useUserPreferences} from "../../../hooks/useUserPreferences";
import {settingsSections} from "../data/demoData";
import {PreferenceSelectField} from "../components/PreferenceSelectField";
import {PageContainer} from "../../../shared/ui/templates/PageContainer";
import {SectionHeading} from "../../../shared/ui/atoms/SectionHeading";
import {Surface} from "../../../shared/ui/atoms/Surface";
import {Button} from "../../../shared/ui/atoms/Button";
import {useLocalization} from "../../../hooks/useLocalization";
import {useTheme} from "../../../hooks/useTheme";
import {logoutUser} from "../../../utils/authSession";

export function SettingsRoute() {
    const {logout} = useAuth0();
    const {locale, supportedLocales, t} = useLocalization();
    const {theme} = useTheme();
    const {preferences, savePreferences, status} = useUserPreferences();
    const [form, setForm] = useState({
        locale: preferences.locale || locale,
        theme: preferences.theme || theme,
    });
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        setForm({
            locale: preferences.locale || locale,
            theme: preferences.theme || theme,
        });
    }, [locale, preferences.locale, preferences.theme, theme]);

    const languageOptions = supportedLocales.map((entry) => ({value: entry.code, label: entry.label}));
    const themeOptions = [
        {value: "light", label: t("wizard.lightTheme")},
        {value: "dark", label: t("wizard.darkTheme")},
    ];

    const handleSave = async () => {
        try {
            const saved = await savePreferences({
                locale: form.locale,
                theme: form.theme,
                onboardingCompleted: preferences.onboardingCompleted,
            });

            setForm({
                locale: saved.locale,
                theme: saved.theme,
            });
            setFeedback(t("settings.saved"));
        } catch (error) {
            console.error("Failed to save settings", error);
            setFeedback(t("settings.saveError"));
        }
    };

    return (
        <PageContainer className="space-y-6">
            <SectionHeading
                eyebrow={t("settings.eyebrow")}
                title={t("settings.title")}
                description={t("settings.description")}
            />

            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <Surface className="p-6">
                    <p className="eyebrow">{t("settings.workspaceEyebrow")}</p>
                    <div className="mt-4 space-y-5">
                        <PreferenceSelectField
                            label={t("settings.languageLabel")}
                            helper={t("settings.languageHelp")}
                            value={form.locale}
                            onChange={(value) => setForm((current) => ({...current, locale: value}))}
                            options={languageOptions}
                        />
                        <PreferenceSelectField
                            label={t("settings.themeLabel")}
                            helper={t("settings.themeHelp")}
                            value={form.theme}
                            onChange={(value) => setForm((current) => ({...current, theme: value}))}
                            options={themeOptions}
                        />
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Button onClick={handleSave} disabled={status === "saving"}>
                            {status === "saving" ? t("settings.saving") : t("settings.save")}
                        </Button>
                        <Button variant="ghost" onClick={() => logoutUser(logout)}>
                            {t("auth.logOut")}
                        </Button>
                    </div>
                </Surface>

                <div className="grid gap-4 sm:grid-cols-2">
                    {settingsSections.map((section) => (
                        <Surface key={section.titleKey} className="p-6">
                            <p className="text-lg font-semibold text-[var(--text-primary)]">
                                {t(section.titleKey)}
                            </p>
                            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                                {t(section.descriptionKey)}
                            </p>
                        </Surface>
                    ))}
                </div>
            </div>

            {feedback ? <Toast message={feedback} onClose={() => setFeedback("")}/> : null}
        </PageContainer>
    );
}
