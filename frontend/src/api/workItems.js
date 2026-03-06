const API_HOST = import.meta.env.VITE_API_HOST || "https://api.pavel-usanli.online/craftify/v1";
const WORK_ITEMS_API_URL = `${API_HOST}/work-items`;

export async function listWorkItems(authFetch, params = {}) {
  const url = new URL(WORK_ITEMS_API_URL);
  const { page = 0, size = 8, sort, q, status } = params;
  url.searchParams.set("page", page);
  url.searchParams.set("size", size);
  if (sort) url.searchParams.set("sort", sort);
  if (q) url.searchParams.set("q", q);
  if (status) url.searchParams.set("status", status);

  const res = await authFetch(url, { method: "GET" });
  if (!res?.ok) {
    const err = res ? await res.text() : "auth failed";
    throw new Error(err || "Failed to fetch work items");
  }
  return res.json();
}

export async function listAllWorkItems(authFetch, params = {}) {
  const pageSize = Number(params.size) > 0 ? Number(params.size) : 200;
  const first = await listWorkItems(authFetch, { ...params, page: 0, size: pageSize });
  const totalPages = Math.max(1, Number(first?.totalPages || 1));
  const firstContent = Array.isArray(first?.content) ? first.content : [];

  if (totalPages === 1) {
    return firstContent;
  }

  const pageRequests = [];
  for (let p = 1; p < totalPages; p += 1) {
    pageRequests.push(listWorkItems(authFetch, { ...params, page: p, size: pageSize }));
  }
  const rest = await Promise.all(pageRequests);
  return [
    ...firstContent,
    ...rest.flatMap((r) => (Array.isArray(r?.content) ? r.content : [])),
  ];
}

export async function requestWorkItem(authFetch, payload) {
  const url = new URL(`${API_HOST}/work-items:request`);
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res?.ok) {
    const txt = res ? await res.text() : "auth failed";
    if (res && res.status === 404) throw new Error("BOM not found.");
    if (res && res.status === 409) throw new Error("Insufficient inventory for requested quantity.");
    throw new Error(txt || "Failed to request work item");
  }
  return res.json();
}
