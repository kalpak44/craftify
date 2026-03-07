const API_HOST = import.meta.env.VITE_API_HOST || "https://api.pavel-usanli.online/craftify/v1";
const CALENDAR_EVENTS_API_URL = `${API_HOST}/calendar/events`;

export async function listCalendarEvents(authFetch, params = {}) {
  const url = new URL(CALENDAR_EVENTS_API_URL);
  const { from, to } = params;
  if (from) url.searchParams.set("from", from);
  if (to) url.searchParams.set("to", to);

  const res = await authFetch(url, { method: "GET" });
  if (!res?.ok) {
    const err = res ? await res.text() : "auth failed";
    throw new Error(err || "Failed to fetch calendar events");
  }
  return res.json();
}

export async function createCalendarEvent(authFetch, payload) {
  const url = new URL(CALENDAR_EVENTS_API_URL);
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res?.ok) {
    const err = res ? await res.text() : "auth failed";
    throw new Error(err || "Failed to create calendar event");
  }
  return res.json();
}

export async function updateCalendarEvent(authFetch, id, payload) {
  const url = new URL(`${CALENDAR_EVENTS_API_URL}/${encodeURIComponent(id)}`);
  const res = await authFetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res?.ok) {
    const err = res ? await res.text() : "auth failed";
    throw new Error(err || "Failed to update calendar event");
  }
  return res.json();
}

export async function deleteCalendarEvent(authFetch, id) {
  const url = new URL(`${CALENDAR_EVENTS_API_URL}/${encodeURIComponent(id)}`);
  const res = await authFetch(url, { method: "DELETE" });
  if (!res?.ok) {
    const err = res ? await res.text() : "auth failed";
    throw new Error(err || "Failed to delete calendar event");
  }
}
