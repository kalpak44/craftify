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
  const pageSize = Number(params.size) > 0 ? Number(params.size) : 8;
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
    const errorCode = res?.headers?.get("x-error-code");
    if (res && res.status === 404) throw new Error("BOM not found.");
    if (res && res.status === 400 && errorCode === "invalid_requested_qty") {
      throw new Error("Requested quantity must be a whole number greater than 0.");
    }
    if (res && res.status === 409 && errorCode === "output_item_not_found") {
      throw new Error("Output item does not exist. Create the Item before requesting a Work Item.");
    }
    if (res && res.status === 409 && errorCode === "component_item_not_found") {
      throw new Error("A BOM component item does not exist. Fix BOM components first.");
    }
    if (res && res.status === 409) throw new Error("Insufficient inventory for requested quantity.");
    throw new Error(txt || "Failed to request work item");
  }
  return res.json();
}

export async function cancelWorkItem(authFetch, id) {
  const url = new URL(`${API_HOST}/work-items/${encodeURIComponent(id)}:cancel`);
  const res = await authFetch(url, { method: "POST" });
  if (!res?.ok) {
    const txt = res ? await res.text() : "auth failed";
    const errorCode = res?.headers?.get("x-error-code");
    if (res && res.status === 404) throw new Error("Work item not found.");
    if (res && res.status === 409 && errorCode === "invalid_work_item_snapshot") {
      throw new Error("This work item is missing allocation snapshot data and cannot be canceled safely.");
    }
    if (res && res.status === 409) throw new Error("Work item cannot be canceled.");
    throw new Error(txt || "Failed to cancel work item");
  }
  return res.json();
}

export async function completeWorkItem(authFetch, id) {
  const url = new URL(`${API_HOST}/work-items/${encodeURIComponent(id)}:complete`);
  const res = await authFetch(url, { method: "POST" });
  if (!res?.ok) {
    const txt = res ? await res.text() : "auth failed";
    const errorCode = res?.headers?.get("x-error-code");
    if (res && res.status === 404) throw new Error("Work item not found.");
    if (res && res.status === 409 && errorCode === "invalid_work_item_snapshot") {
      throw new Error("This work item is missing snapshot data and cannot be completed safely.");
    }
    if (res && res.status === 409 && errorCode === "work_item_not_completable") {
      throw new Error("Work item is already Completed or Canceled.");
    }
    if (res && res.status === 409) throw new Error("Work item cannot be completed.");
    throw new Error(txt || "Failed to complete work item");
  }
  return res.json();
}
