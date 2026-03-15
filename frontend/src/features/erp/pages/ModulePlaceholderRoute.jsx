import PropTypes from "prop-types";
import {Link} from "react-router-dom";
import {PageContainer} from "../../../shared/ui/templates/PageContainer";
import {SectionHeading} from "../../../shared/ui/atoms/SectionHeading";
import {Surface} from "../../../shared/ui/atoms/Surface";
import {Button} from "../../../shared/ui/atoms/Button";
import {StatusBadge} from "../../../shared/ui/atoms/StatusBadge";
import {useLocalization} from "../../../hooks/useLocalization";

export function ModulePlaceholderRoute({eyebrowKey, titleKey, descriptionKey, highlights, ctaTo, ctaLabelKey}) {
    const {t} = useLocalization();

    return (
        <PageContainer className="space-y-6">
            <SectionHeading
                eyebrow={t(eyebrowKey)}
                title={t(titleKey)}
                description={t(descriptionKey)}
            />

            <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
                <Surface className="p-6">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-lg font-semibold text-[var(--text-primary)]">
                                {t("erp.placeholderSectionTitle")}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                                {t("erp.placeholderSectionDescription")}
                            </p>
                        </div>
                        <StatusBadge tone="sky">{t("erp.mockMode")}</StatusBadge>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        {highlights.map((item) => (
                            <div
                                key={item.titleKey}
                                className="rounded-3xl bg-white/60 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)] dark:bg-white/6 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                            >
                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                    {t(item.titleKey)}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                                    {t(item.descriptionKey)}
                                </p>
                            </div>
                        ))}
                    </div>
                </Surface>

                <Surface className="p-6">
                    <p className="eyebrow">{t("erp.nextSliceEyebrow")}</p>
                    <p className="mt-4 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                        {t("erp.nextSliceTitle")}
                    </p>
                    <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
                        {t("erp.nextSliceDescription")}
                    </p>
                    {ctaTo && ctaLabelKey ? (
                        <Button as={Link} to={ctaTo} className="mt-6">
                            {t(ctaLabelKey)}
                        </Button>
                    ) : null}
                </Surface>
            </div>
        </PageContainer>
    );
}

ModulePlaceholderRoute.propTypes = {
    ctaLabelKey: PropTypes.string,
    ctaTo: PropTypes.string,
    descriptionKey: PropTypes.string.isRequired,
    eyebrowKey: PropTypes.string.isRequired,
    highlights: PropTypes.arrayOf(PropTypes.shape({
        descriptionKey: PropTypes.string.isRequired,
        titleKey: PropTypes.string.isRequired,
    })).isRequired,
    titleKey: PropTypes.string.isRequired,
};
