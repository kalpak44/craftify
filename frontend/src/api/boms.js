const API_HOST = import.meta.env.VITE_API_HOST || "https://api.pavel-usanli.online/craftify/v1";
const BOMS_API_URL = `${API_HOST}/boms`;

export async function listBoms(authFetch, params = {}) {
  const url = new URL(BOMS_API_URL);
  const { page = 0, size = 8, sort, q, status } = params;
  url.searchParams.set("page", page);
  url.searchParams.set("size", size);
  if (sort) url.searchParams.set("sort", sort);
  if (q) url.searchParams.set("q", q);
  if (status) url.searchParams.set("status", status);
  const res = await authFetch(url, { method: "GET" });
  if (!res?.ok) {
    const err = res ? await res.text() : "auth failed";
    throw new Error(err || "Failed to fetch BOMs");
  }
  return res.json();
}

export async function getBom(authFetch, id) {
  const url = new URL(`${BOMS_API_URL}/${encodeURIComponent(id)}`);
  const res = await authFetch(url, { method: "GET" });
  if (!res?.ok) {
    const err = res ? await res.text() : "auth failed";
    throw new Error(err || "Failed to fetch BOM");
  }
  return res.json();
}

export async function createBom(authFetch, payload) {
  const url = new URL(BOMS_API_URL);
  const res = await authFetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!res?.ok) {
    const txt = res ? await res.text() : "auth failed";
    if (res && res.status === 409) throw new Error("BOM with same id already exists");
    throw new Error(txt || "Failed to create BOM");
  }
  return res.json();
}

export async function updateBom(authFetch, id, payload, version) {
  const url = new URL(`${BOMS_API_URL}/${encodeURIComponent(id)}`);
  const res = await authFetch(url, { method: "PUT", headers: { "Content-Type": "application/json", "If-Match": `W"${version}"` }, body: JSON.stringify(payload) });
  if (!res?.ok) {
    const txt = res ? await res.text() : "auth failed";
    if (res && res.status === 412) throw new Error("BOM was updated by someone else. Refresh and try again.");
    throw new Error(txt || "Failed to update BOM");
  }
  return res.json();
}

export async function deleteBom(authFetch, id, version) {
  const url = new URL(`${BOMS_API_URL}/${encodeURIComponent(id)}`);
  const res = await authFetch(url, { method: "DELETE", headers: { "If-Match": `W"${version}"` } });
  if (!res?.ok) {
    const txt = res ? await res.text() : "auth failed";
    if (res && res.status === 412) throw new Error("BOM was updated by someone else. Refresh and try again.");
    throw new Error(txt || "Failed to delete BOM");
  }
}
