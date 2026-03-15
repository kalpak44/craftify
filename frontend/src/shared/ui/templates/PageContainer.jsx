import PropTypes from "prop-types";

export function PageContainer({children, className = ""}) {
    return (
        <div className={`mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 ${className}`}>
            {children}
        </div>
    );
}

PageContainer.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};
