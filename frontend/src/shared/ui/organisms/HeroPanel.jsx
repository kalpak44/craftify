import PropTypes from "prop-types";
import {useLocalization} from "../../../hooks/useLocalization";
import {Button} from "../atoms/Button";
import {SectionHeading} from "../atoms/SectionHeading";
import {Surface} from "../atoms/Surface";

export function HeroPanel({isAuthenticated, onPrimaryAction, onSecondaryAction, userName}) {
    const {t} = useLocalization();
    const metrics = [
        {label: t("home.metricModules"), value: "06"},
        {label: t("home.metricImportSpeed"), value: "<2m"},
        {label: t("home.metricSetupBurden"), value: "Low"},
    ];
    const nameSuffix = userName ? `, ${userName}` : "";

    return (
        <section className="relative overflow-hidden px-4 pb-10 pt-8 md:px-6 md:pb-16 md:pt-12">
            <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
                <div>
                    <SectionHeading
                        eyebrow={isAuthenticated ? t("home.eyebrowAuth") : t("home.eyebrowGuest")}
                        title={isAuthenticated ? t("home.titleAuth", {userName: nameSuffix}) : t("home.titleGuest")}
                        description={isAuthenticated
                            ? t("home.descriptionAuth")
                            : t("home.descriptionGuest")}
                    />
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Button size="lg" onClick={onPrimaryAction}>
                            {isAuthenticated ? t("home.primaryAuth") : t("home.primaryGuest")}
                        </Button>
                        <Button size="lg" variant="secondary" onClick={onSecondaryAction}>
                            {isAuthenticated ? t("home.secondaryAuth") : t("home.secondaryGuest")}
                        </Button>
                    </div>
                </div>

                <Surface className="relative overflow-hidden p-6 md:p-7">
                    <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[radial-gradient(circle,var(--accent-soft),transparent_65%)] opacity-80"/>
                    <p className="eyebrow">{t("home.snapshotEyebrow")}</p>
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                        {metrics.map((metric) => (
                            <div key={metric.label} className="rounded-3xl bg-white/60 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)] dark:bg-white/6 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                                <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                                    {metric.value}
                                </p>
                                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                                    {metric.label}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 rounded-[2rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(240,253,250,0.75))] p-5 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(8,47,73,0.42))]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">{t("home.focusEyebrow")}</p>
                                <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                                    {t("home.focusTitle")}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-soft))]"/>
                        </div>
                        <p className="mt-4 max-w-md text-sm leading-7 text-[var(--text-secondary)]">
                            {t("home.focusDescription")}
                        </p>
                    </div>
                </Surface>
            </div>
        </section>
    );
}

HeroPanel.propTypes = {
    isAuthenticated: PropTypes.bool.isRequired,
    onPrimaryAction: PropTypes.func.isRequired,
    onSecondaryAction: PropTypes.func.isRequired,
    userName: PropTypes.string,
};
