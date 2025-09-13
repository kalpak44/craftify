import {useAuth0} from "@auth0/auth0-react";
import {useEffect} from "react";
import {useNavigate} from "react-router-dom";

export const CallbackPage = () => {
    const {error, isAuthenticated, isLoading, user, getAccessTokenSilently} = useAuth0();
    const navigate = useNavigate();

    useEffect(() => {
        const storeTokenAndRedirect = async () => {
            try {
                const token = await getAccessTokenSilently();
                localStorage.setItem("access_token", token);

                const emailVerified = !!user?.email_verified;
                localStorage.setItem("email_verified", emailVerified.toString());

                navigate("/");
            } catch (err) {
                console.error("Error fetching access token:", err);
            }
        };

        if (!isLoading && isAuthenticated) {
            storeTokenAndRedirect().catch(console.error);
        }
    }, [isAuthenticated, isLoading, getAccessTokenSilently, user]);

    if (error) {
        return (
            <div className="content-layout">
                <h1 id="page-title" className="content__title">Error</h1>
                <div className="content__body">
                    <p id="page-description">
                        <span>{error.message}</span>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-layout">
            <div className="page-layout__content"/>
        </div>
    );
};
