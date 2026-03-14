import {useLocalization} from "../hooks/useLocalization";

export const PrivacyPage = () => {
    const {t} = useLocalization();

    return (
        <div className="mx-auto max-w-3xl px-4 py-10">
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{t("legal.privacyTitle")}</h1>
            <p className="mt-4 text-slate-700 dark:text-gray-300">{t("legal.privacyDescription")}</p>
            <p className="mt-2 text-slate-500 dark:text-gray-400">{t("legal.privacyDetails")}</p>
        </div>
    );
};
