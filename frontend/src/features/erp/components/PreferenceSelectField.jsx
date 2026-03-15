import PropTypes from "prop-types";

export function PreferenceSelectField({label, helper, value, onChange, options}) {
    return (
        <label className="block">
            <span className="text-sm font-semibold text-[var(--text-primary)]">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="glass-panel mt-2 h-12 w-full rounded-3xl px-4 text-sm text-[var(--text-primary)] outline-none"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {helper ? (
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    {helper}
                </p>
            ) : null}
        </label>
    );
}

PreferenceSelectField.propTypes = {
    helper: PropTypes.string,
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
    })).isRequired,
    value: PropTypes.string.isRequired,
};
