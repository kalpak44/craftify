const API_HOST = import.meta.env.VITE_API_HOST || "https://api.pavel-usanli.online/craftify/v1";
const CATEGORIES_API_URL = `${API_HOST}/categories`;

/**
 * List categories (paginated)
 * @param {Function} authFetch
 * @param {Object} params
 *  - page (number)
 *  - size (number)
 *  - sort (string) e.g. "name,asc"
 *  - q (string) search term
 */
export async function listCategories(authFetch, params = {}) {
  const url = new URL(CATEGORIES_API_URL);
  const { page = 0, size = 50, sort = "name,asc", q } = params;
  url.searchParams.set("page", page);
  url.searchParams.set("size", size);
  if (sort) url.searchParams.set("sort", sort);
  if (q) url.searchParams.set("q", q);
  const res = await authFetch(url, { method: "GET" });
  if (!res?.ok) {
    const err = res ? await res.text() : "auth failed";
    throw new Error(err || "Failed to fetch categories");
  }
  return res.json();
}

/**
 * List all categories by traversing backend pages.
 * @param {Function} authFetch
 * @param {Object} params
 *  - same filters/sort as listCategories
 *  - size (optional, defaults to 8 per page)
 */
export async function listAllCategories(authFetch, params = {}) {
  const pageSize = Number(params.size) > 0 ? Number(params.size) : 8;
  const first = await listCategories(authFetch, {...params, page: 0, size: pageSize});
  const totalPages = Math.max(1, Number(first?.totalPages || 1));
  const firstContent = Array.isArray(first?.content) ? first.content : [];

  if (totalPages === 1) {
    return firstContent;
  }

  const pageRequests = [];
  for (let p = 1; p < totalPages; p += 1) {
    pageRequests.push(listCategories(authFetch, {...params, page: p, size: pageSize}));
  }
  const rest = await Promise.all(pageRequests);
  return [
    ...firstContent,
    ...rest.flatMap((r) => (Array.isArray(r?.content) ? r.content : [])),
  ];
}

/**
 * Create category
 * @param {Function} authFetch
 * @param {string} name
 */
export async function createCategory(authFetch, name) {
  const url = new URL(CATEGORIES_API_URL);
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res?.ok) {
    const txt = res ? await res.text() : "auth failed";
    if (res && res.status === 409) throw new Error("Category with same name already exists");
    throw new Error(txt || "Failed to create category");
  }
  return res.json();
}

/**
 * Rename category
 * @param {Function} authFetch
 * @param {string} id UUID
 * @param {string} name new name
 */
export async function renameCategory(authFetch, id, name) {
  const url = new URL(`${CATEGORIES_API_URL}/${encodeURIComponent(id)}`);
  const res = await authFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res?.ok) {
    const txt = res ? await res.text() : "auth failed";
    if (res && res.status === 409) throw new Error("Another category with this name already exists");
    throw new Error(txt || "Failed to rename category");
  }
  return res.json();
}

/**
 * Delete category
 * @param {Function} authFetch
 * @param {string} id
 * @param {boolean} force
 */
export async function deleteCategory(authFetch, id, force = false) {
  const url = new URL(`${CATEGORIES_API_URL}/${encodeURIComponent(id)}`);
  if (force != null) url.searchParams.set("force", String(force));
  const res = await authFetch(url, { method: "DELETE" });
  if (!res?.ok) {
    const txt = res ? await res.text() : "auth failed";
    throw new Error(txt || "Failed to delete category");
  }
}
