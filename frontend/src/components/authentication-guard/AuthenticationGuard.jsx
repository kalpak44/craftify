import PropTypes from 'prop-types';
import {useAuth0} from '@auth0/auth0-react';
import {Loader} from '../common/Loader';
import {useEffect} from "react";
import {isLogoutInProgress} from "../../utils/authSession";

/**
 * A wrapper that ensures only authenticated users can view its children.
 * If not authenticated, triggers login redirect.
 * While Auth0 is initializing, shows a spinner.
 *
 * Props:
 * - children: ReactNode
 */
export const AuthenticationGuard = ({children}) => {
    const {isAuthenticated, loginWithRedirect, isLoading} = useAuth0();
    const logoutInProgress = isLogoutInProgress();

    useEffect(() => {
        if (!isLoading && !isAuthenticated && !logoutInProgress) {
            loginWithRedirect();
        }
    }, [isLoading, isAuthenticated, loginWithRedirect, logoutInProgress]);

    if (isLoading || logoutInProgress) {
        return <Loader/>;
    }

    if (isAuthenticated === undefined) {
        return null; // Login in progress
    }

    return <>{children}</>;
};

AuthenticationGuard.propTypes = {
    children: PropTypes.node.isRequired,
};
