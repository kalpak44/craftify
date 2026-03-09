import PropTypes from "prop-types";
import {AppHeader} from "../organisms/AppHeader";

export function AppShell({children}) {
    return (
        <div className="app-shell min-h-screen">
            <div className="mesh-bg"/>
            <div className="ambient-orb ambient-orb-a"/>
            <div className="ambient-orb ambient-orb-b"/>
            <AppHeader/>
            <main className="relative z-10 pb-16">
                {children}
            </main>
        </div>
    );
}

AppShell.propTypes = {
    children: PropTypes.node.isRequired,
};
