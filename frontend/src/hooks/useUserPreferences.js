import {useContext} from "react";
import {UserPreferencesContext} from "../providers/userPreferencesContext";

export function useUserPreferences() {
    const context = useContext(UserPreferencesContext);

    if (!context) {
        throw new Error("useUserPreferences must be used within UserPreferencesProvider");
    }

    return context;
}
