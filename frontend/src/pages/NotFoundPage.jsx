const path = import.meta.env.VITE_APP_ROOT_PATH;
export const NotFoundPage = () => (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-white">404</h1>
        <p className="mt-2 text-gray-400">We couldn't find that page.</p>
        <a href={path} className="inline-block mt-6 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white">Go
            Home</a>
    </div>
);