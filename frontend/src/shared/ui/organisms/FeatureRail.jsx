import {useLocalization} from "../../../hooks/useLocalization";
import {SectionHeading} from "../atoms/SectionHeading";
import {Surface} from "../atoms/Surface";

export function FeatureRail() {
    const {t} = useLocalization();
    const features = [
        {
            title: t("home.featureInventoryTitle"),
            description: t("home.featureInventoryDescription"),
            accent: "from-cyan-400/40 to-sky-300/30",
        },
        {
            title: t("home.featureBomTitle"),
            description: t("home.featureBomDescription"),
            accent: "from-emerald-400/40 to-lime-300/30",
        },
        {
            title: t("home.featureWorkTitle"),
            description: t("home.featureWorkDescription"),
            accent: "from-amber-300/40 to-orange-300/30",
        },
    ];

    return (
        <section className="px-4 py-10 md:px-6 md:py-16">
            <div className="mx-auto max-w-7xl">
                <SectionHeading
                    eyebrow={t("home.featuresEyebrow")}
                    title={t("home.featuresTitle")}
                    description={t("home.featuresDescription")}
                />
                <div className="mt-8 grid gap-4 lg:grid-cols-3">
                    {features.map((feature) => (
                        <Surface key={feature.title} className="relative overflow-hidden p-6">
                            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${feature.accent}`}/>
                            <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                                {feature.title}
                            </p>
                            <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                                {feature.description}
                            </p>
                        </Surface>
                    ))}
                </div>
            </div>
        </section>
    );
}
