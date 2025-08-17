import {useCallback} from 'react';
import {useAuth0} from '@auth0/auth0-react';

export const useAuthFetch = () => {
    const {logout} = useAuth0();

    return useCallback(async (url, options = {}) => {
        const token = localStorage.getItem('access_token');

        const defaultHeaders = {
            Authorization: `Bearer ${token}`,
            ...(options.body && !(options.body instanceof FormData) && {
                'Content-Type': 'application/json',
            }),
        };

        const res = await fetch(url, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...(options.headers || {}),
            },
        });

        if (res.status === 401) {
            localStorage.removeItem('access_token');
            logout({returnTo: window.location.origin});
            return;
        }

        return res;
    }, [logout]);
};
