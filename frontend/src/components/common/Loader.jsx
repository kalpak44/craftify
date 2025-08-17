import PropTypes from "prop-types";
import Loading from "../../assets/loader.svg?react";

export const Loader = ({text = "Loading ..."}) => (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center text-center p-4">
            <Loading className="w-8 h-8 mb-2 animate-spin text-gray-400"/>
            <span className="text-gray-400 text-lg">{text}</span>
        </div>
    </div>
);

Loader.propTypes = {
    text: PropTypes.string,
};
