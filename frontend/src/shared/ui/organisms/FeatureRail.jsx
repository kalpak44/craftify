import {SectionHeading} from "../atoms/SectionHeading";
import {Surface} from "../atoms/Surface";

const FEATURES = [
    {
        title: "Inventory intelligence",
        description: "Drive stock visibility through one extendable pattern for filters, actions, imports, and detail forms.",
        accent: "from-cyan-400/40 to-sky-300/30",
    },
    {
        title: "BOM workflows",
        description: "Keep product structure editing, revision context, and downstream work requests close to the domain instead of scattering logic across pages.",
        accent: "from-emerald-400/40 to-lime-300/30",
    },
    {
        title: "Work orchestration",
        description: "Expose operational status, calendar actions, and completion flows through reusable feature modules, not route-level conditionals.",
        accent: "from-amber-300/40 to-orange-300/30",
    },
];

export function FeatureRail() {
    return (
        <section className="px-4 py-10 md:px-6 md:py-16">
            <div className="mx-auto max-w-7xl">
                <SectionHeading
                    eyebrow="Why this structure holds up"
                    title="A frontend shape that scales by feature, not by page sprawl."
                    description="Atomic UI primitives handle consistency. Feature modules own behavior. Route layouts just compose the experience."
                />
                <div className="mt-8 grid gap-4 lg:grid-cols-3">
                    {FEATURES.map((feature) => (
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
