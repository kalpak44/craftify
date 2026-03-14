import {useLocalization} from "../hooks/useLocalization";

const path = import.meta.env.VITE_APP_ROOT_PATH;

export const NotFoundPage = () => {
    const {t} = useLocalization();

    return (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">{t("system.notFoundTitle")}</h1>
            <p className="mt-2 text-slate-500 dark:text-gray-400">{t("system.notFoundDescription")}</p>
            <a href={path} className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">
                {t("system.goHome")}
            </a>
        </div>
    );
};
