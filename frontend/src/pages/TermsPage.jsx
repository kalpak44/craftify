import {useLocalization} from "../hooks/useLocalization";

export const TermsPage = () => {
    const {t} = useLocalization();

    return (
        <div className="mx-auto max-w-3xl px-4 py-10">
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{t("legal.termsTitle")}</h1>
            <p className="mt-4 text-slate-700 dark:text-gray-300">{t("legal.termsDescription")}</p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-500 dark:text-gray-400">
                <li>{t("legal.termsItem1")}</li>
                <li>{t("legal.termsItem2")}</li>
                <li>{t("legal.termsItem3")}</li>
                <li>{t("legal.termsItem4")}</li>
            </ul>
        </div>
    );
};
