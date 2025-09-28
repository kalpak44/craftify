const API_HOST = import.meta.env.VITE_API_HOST || "http://localhost:8080";
const ITEMS_API_URL = `${API_HOST}/items`;

/**
 * List items (paginated, filterable, sortable)
 * @param {Function} authFetch
 * @param {Object} params
 *  - page (number)
 *  - size (number)
 *  - sort (string) e.g. "name,asc" or "code,desc"
 *  - q (string) search by code or name
 *  - status (string) one of Draft|Active|Hold|Discontinued (backend enum TitleCase)
 *  - categoryId (string, UUID)
 *  - uom (string)
 *  - includeDeleted (boolean)
 */
export async function listItems(authFetch, params = {}) {
  const url = new URL(ITEMS_API_URL);
  const {
    page = 0,
    size = 8,
    sort,
    q,
    status,
    categoryId,
    uom,
    includeDeleted,
  } = params;

  url.searchParams.set("page", page);
  url.searchParams.set("size", size);
  if (sort) url.searchParams.set("sort", sort);
  if (q) url.searchParams.set("q", q);
  if (status) url.searchParams.set("status", status);
  if (categoryId) url.searchParams.set("categoryId", categoryId);
  if (uom) url.searchParams.set("uom", uom);
  if (includeDeleted != null) url.searchParams.set("includeDeleted", includeDeleted);

  const res = await authFetch(url, { method: "GET" });
  if (!res?.ok) {
    const err = res ? await res.text() : "auth failed";
    throw new Error(err || "Failed to fetch items");
  }
  return res.json();
}

/**
 * Get single item by id (code)
 * @param {Function} authFetch
 * @param {string} id
 */
export async function getItem(authFetch, id) {
  const url = new URL(`${ITEMS_API_URL}/${encodeURIComponent(id)}`);
  const res = await authFetch(url, { method: "GET" });
  if (!res?.ok) {
    const err = res ? await res.text() : "auth failed";
    throw new Error(err || "Failed to fetch item");
  }
  return res.json();
}

/**
 * Create an item
 * @param {Function} authFetch
 * @param {Object} payload - CreateItemRequest shape
 */
export async function createItem(authFetch, payload) {
  const url = new URL(ITEMS_API_URL);
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res?.ok) {
    const txt = res ? await res.text() : "auth failed";
    if (res && res.status === 409) throw new Error("Item with same code already exists");
    throw new Error(txt || "Failed to create item");
  }
  return res.json();
}

/**
 * Update an item
 * @param {Function} authFetch
 * @param {string} id
 * @param {Object} payload - UpdateItemRequest shape
 * @param {number} version - current version for If-Match header (W/"<version>")
 */
export async function updateItem(authFetch, id, payload, version) {
  const url = new URL(`${ITEMS_API_URL}/${encodeURIComponent(id)}`);
  const res = await authFetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "If-Match": `W"${version}"`,
    },
    body: JSON.stringify(payload),
  });
  if (!res?.ok) {
    const txt = res ? await res.text() : "auth failed";
    if (res && res.status === 412) throw new Error("Item was updated by someone else. Refresh and try again.");
    throw new Error(txt || "Failed to update item");
  }
  return res.json();
}

/**
 * Delete an item
 * @param {Function} authFetch
 * @param {string} id
 * @param {number} version
 */
export async function deleteItem(authFetch, id, version) {
  const url = new URL(`${ITEMS_API_URL}/${encodeURIComponent(id)}`);
  const res = await authFetch(url, {
    method: "DELETE",
    headers: { "If-Match": `W"${version}"` },
  });
  if (!res?.ok) {
    const txt = res ? await res.text() : "auth failed";
    if (res && res.status === 412) throw new Error("Item was updated by someone else. Refresh and try again.");
    throw new Error(txt || "Failed to delete item");
  }
}
