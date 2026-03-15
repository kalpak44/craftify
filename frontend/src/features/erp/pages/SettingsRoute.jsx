import {Link} from "react-router-dom";
import {settingsSections} from "../data/demoData";
import {PageContainer} from "../../../shared/ui/templates/PageContainer";
import {SectionHeading} from "../../../shared/ui/atoms/SectionHeading";
import {Surface} from "../../../shared/ui/atoms/Surface";
import {Button} from "../../../shared/ui/atoms/Button";
import {useLocalization} from "../../../hooks/useLocalization";
import {useTheme} from "../../../hooks/useTheme";

export function SettingsRoute() {
    const {locale, t} = useLocalization();
    const {theme} = useTheme();

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
                    <div className="mt-4 space-y-4">
                        <div className="rounded-3xl bg-white/60 p-4 dark:bg-white/6">
                            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                                {t("settings.languageLabel")}
                            </p>
                            <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{locale}</p>
                        </div>
                        <div className="rounded-3xl bg-white/60 p-4 dark:bg-white/6">
                            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                                {t("settings.themeLabel")}
                            </p>
                            <p className="mt-2 text-lg font-semibold capitalize text-[var(--text-primary)]">{theme}</p>
                        </div>
                    </div>
                    <Button as={Link} to="/settings/setup" className="mt-6">
                        {t("settings.openWizard")}
                    </Button>
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
        </PageContainer>
    );
}
