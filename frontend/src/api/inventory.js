const API_HOST = import.meta.env.VITE_API_HOST || "https://api.pavel-usanli.online/craftify/v1";
const INVENTORY_API_URL = `${API_HOST}/inventory`;

export async function listInventory(authFetch, params = {}) {
  const url = new URL(INVENTORY_API_URL);
  const { page = 0, size = 8, sort, q, categoryName, uom } = params;

  url.searchParams.set("page", page);
  url.searchParams.set("size", size);
  if (sort) url.searchParams.set("sort", sort);
  if (q) url.searchParams.set("q", q);
  if (categoryName) url.searchParams.set("categoryName", categoryName);
  if (uom) url.searchParams.set("uom", uom);

  const res = await authFetch(url, { method: "GET" });
  if (!res?.ok) {
    const err = res ? await res.text() : "auth failed";
    throw new Error(err || "Failed to fetch inventory");
  }
  return res.json();
}

export async function listAllInventory(authFetch, params = {}) {
  const pageSize = Number(params.size) > 0 ? Number(params.size) : 200;
  const first = await listInventory(authFetch, { ...params, page: 0, size: pageSize });
  const totalPages = Math.max(1, Number(first?.totalPages || 1));
  const firstContent = Array.isArray(first?.content) ? first.content : [];

  if (totalPages === 1) {
    return firstContent;
  }

  const pageRequests = [];
  for (let p = 1; p < totalPages; p += 1) {
    pageRequests.push(listInventory(authFetch, { ...params, page: p, size: pageSize }));
  }
  const rest = await Promise.all(pageRequests);
  return [
    ...firstContent,
    ...rest.flatMap((r) => (Array.isArray(r?.content) ? r.content : [])),
  ];
}

export async function getInventory(authFetch, code) {
  const url = new URL(`${INVENTORY_API_URL}/${encodeURIComponent(code)}`);
  const res = await authFetch(url, { method: "GET" });
  if (!res?.ok) {
    const err = res ? await res.text() : "auth failed";
    throw new Error(err || "Failed to fetch inventory item");
  }
  return res.json();
}

export async function getNextInventoryCode(authFetch) {
  const url = new URL(`${API_HOST}/inventory:next-code`);
  const res = await authFetch(url, { method: "GET" });
  if (!res?.ok) {
    const err = res ? await res.text() : "auth failed";
    throw new Error(err || "Failed to generate inventory code");
  }
  const body = await res.json();
  return String(body?.code || "");
}

export async function createInventory(authFetch, payload) {
  const url = new URL(INVENTORY_API_URL);
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res?.ok) {
    const txt = res ? await res.text() : "auth failed";
    if (res && res.status === 409) throw new Error("Inventory code already exists");
    throw new Error(txt || "Failed to create inventory item");
  }
  return res.json();
}

export async function updateInventory(authFetch, id, payload) {
  const url = new URL(`${INVENTORY_API_URL}/${encodeURIComponent(id)}`);
  const res = await authFetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res?.ok) {
    const txt = res ? await res.text() : "auth failed";
    throw new Error(txt || "Failed to update inventory item");
  }
  return res.json();
}

export async function deleteInventory(authFetch, code) {
  const url = new URL(`${INVENTORY_API_URL}/${encodeURIComponent(code)}`);
  const res = await authFetch(url, { method: "DELETE" });
  if (!res?.ok) {
    const txt = res ? await res.text() : "auth failed";
    throw new Error(txt || "Failed to delete inventory item");
  }
}

export async function createInventoryFromItem(authFetch, itemId, available, mode) {
  const url = new URL(`${API_HOST}/inventory:create-from-item`);
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId, available, mode }),
  });
  if (!res?.ok) {
    const txt = res ? await res.text() : "auth failed";
    if (res && res.status === 409) {
      throw new Error("Item must be Active and not already linked to inventory.");
    }
    if (res && res.status === 404) {
      throw new Error("Item not found.");
    }
    throw new Error(txt || "Failed to create inventory item");
  }
  return res.json();
}

export async function importInventoryCsv(authFetch, file, mode = "upsert") {
  const url = new URL(`${API_HOST}/inventory:import`);
  url.searchParams.set("mode", mode);
  const form = new FormData();
  form.append("file", file);
  const res = await authFetch(url, { method: "POST", body: form });
  if (!res?.ok) {
    const txt = res ? await res.text() : "auth failed";
    throw new Error(txt || "Failed to import inventory CSV");
  }
  return res.json();
}
