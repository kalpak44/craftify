import PropTypes from "prop-types";

export function SectionHeading({eyebrow, title, description}) {
    return (
        <div className="max-w-2xl">
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] md:text-4xl">
                {title}
            </h2>
            {description ? (
                <p className="mt-4 text-base leading-7 text-[var(--text-secondary)]">
                    {description}
                </p>
            ) : null}
        </div>
    );
}

SectionHeading.propTypes = {
    description: PropTypes.string,
    eyebrow: PropTypes.string,
    title: PropTypes.string.isRequired,
};
