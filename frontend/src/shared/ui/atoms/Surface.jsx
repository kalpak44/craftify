import PropTypes from "prop-types";

export function Surface({children, className = ""}) {
    return (
        <div className={`glass-panel ${className}`}>
            {children}
        </div>
    );
}

Surface.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};
