const API_HOST = import.meta.env.VITE_API_HOST || "http://localhost:8080";
const DATA_STORE_API_URL = `${API_HOST}/data-stores`;

/**
 * List all data stores (paginated)
 * @param {Function} authFetch
 * @param {number} page
 * @param {number} size
 */
export async function listDataStores(authFetch, page = 0, size = 10) {
    const url = new URL(DATA_STORE_API_URL);
    url.searchParams.append("page", page);
    url.searchParams.append("size", size);

    const res = await authFetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        throw new Error("Failed to fetch data stores");
    }

    return res.json();
}

/**
 * Create a new data store
 * @param {Function} authFetch
 * @param {Object} dataStore
 */
export async function createDataStores(authFetch, dataStore) {
    const url = new URL(DATA_STORE_API_URL);
    const res = await authFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataStore),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to create data store");
    }

    return res.json();
}

/**
 * List records in a data store (paginated)
 * @param {Function} authFetch
 * @param {string} dataStoreId
 * @param {number} page
 * @param {number} size
 */
export async function listDataStoresRecords(authFetch, dataStoreId, page = 0, size = 10) {
    const url = new URL(`${DATA_STORE_API_URL}/${dataStoreId}/records`);
    url.searchParams.append("page", page);
    url.searchParams.append("size", size);

    const res = await authFetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        throw new Error("Failed to fetch data store records");
    }

    return res.json();
}

/**
 * Get a single data record by ID
 * @param {Function} authFetch
 * @param {string} dataStoreId
 * @param {string} recordId
 */
export async function getDataRecordById(authFetch, dataStoreId, recordId) {
    const url = new URL(`${DATA_STORE_API_URL}/${dataStoreId}/records/${recordId}`);

    const res = await authFetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        throw new Error("Failed to fetch data record");
    }

    return res.json();
}

/**
 * Update an existing data record
 * @param {Function} authFetch
 * @param {string} dataStoreId
 * @param {string} recordId
 * @param {Object} updatedData
 */
export async function updateDataRecord(authFetch, dataStoreId, recordId, updatedData) {
    const url = new URL(`${DATA_STORE_API_URL}/${dataStoreId}/records/${recordId}`);

    const res = await authFetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordData: updatedData }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to update data record");
    }

    return res.json();
}

/**
 * Create a new data record in a data store
 * @param {Function} authFetch
 * @param {string} dataStoreId
 * @param {string} name
 * @param {Object} record
 */
export async function createDataRecord(authFetch, dataStoreId, name, record) {
    const url = new URL(`${DATA_STORE_API_URL}/${dataStoreId}/records`);

    const res = await authFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, record }),
    });

    if (!res.ok) {
        const err = await res.text();
        if (res.status === 409) {
            throw new Error("Record with the same name already exists.");
        }
        throw new Error(err || "Failed to create data record");
    }

    return res.json();
}

/**
 * Delete a data record by ID
 * @param {Function} authFetch
 * @param {string} dataStoreId
 * @param {string} recordId
 */
export async function deleteDataRecord(authFetch, dataStoreId, recordId) {
    const url = new URL(`${DATA_STORE_API_URL}/${dataStoreId}/records/${recordId}`);

    const res = await authFetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to delete data record");
    }
}
