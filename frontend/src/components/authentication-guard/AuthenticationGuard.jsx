import PropTypes from 'prop-types';
import {useAuth0} from '@auth0/auth0-react';
import {Loader} from '../common/Loader';
import {useEffect} from "react";

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

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            loginWithRedirect();
        }
    }, [isLoading, isAuthenticated, loginWithRedirect]);

    if (isLoading) {
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
