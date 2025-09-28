const API_HOST = import.meta.env.VITE_API_HOST || "http://localhost:8080";
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
export async function deleteCategory(authFetch, id, force = true) {
  const url = new URL(`${CATEGORIES_API_URL}/${encodeURIComponent(id)}`);
  if (force != null) url.searchParams.set("force", String(force));
  const res = await authFetch(url, { method: "DELETE" });
  if (!res?.ok) {
    const txt = res ? await res.text() : "auth failed";
    throw new Error(txt || "Failed to delete category");
  }
}
