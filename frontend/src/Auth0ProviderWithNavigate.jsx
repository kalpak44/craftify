import PropTypes from 'prop-types';
import {Auth0Provider} from '@auth0/auth0-react';
import {useNavigate} from 'react-router-dom';

/**
 * Wraps Auth0Provider and synchronizes navigation on callback
 *
 * Reads configuration from environment variables:
 *  - VITE_AUTH0_DOMAIN
 *  - VITE_AUTH0_CLIENT_ID
 *  - VITE_AUTH0_REDIRECT_URL
 *  - VITE_AUTH0_AUDIENCE
 */
export const Auth0ProviderWithNavigate = ({children}) => {
    const navigate = useNavigate();

    const domain = import.meta.env.VITE_AUTH0_DOMAIN;
    const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_AUTH0_REDIRECT_URL;
    const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

    const onRedirectCallback = (appState) => {
        //navigate(appState?.returnTo || window.location.pathname);
    };

    if (!(domain && clientId && redirectUri && audience)) {
        console.warn('Auth0 configuration is missing');
        return null;
    }

    return (
        <Auth0Provider
            domain={domain}
            clientId={clientId}
            authorizationParams={{
                audience,
                redirect_uri: redirectUri
            }}
            onRedirectCallback={onRedirectCallback}
        >
            {children}
        </Auth0Provider>
    );
};

Auth0ProviderWithNavigate.propTypes = {
    children: PropTypes.node.isRequired,
};