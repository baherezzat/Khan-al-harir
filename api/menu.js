"use strict";

const API_BASE = "https://dashboard.iconapp.site/api";
const BRANCH_ID = 33;
const REQUEST_RETRIES = 2;

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function fetchJSON(url, deadline) {
  let lastError;
  for (let attempt = 0; attempt <= REQUEST_RETRIES; attempt += 1) {
    try {
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new Error("Menu synchronization timed out");
      const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(Math.min(8000, remaining)), headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Official menu request failed (${response.status})`);
      const payload = await response.json();
      if (!payload?.status) throw new Error(payload?.msg || "Official menu response was unsuccessful");
      return payload.data;
    } catch (error) {
      lastError = error;
      if (Date.now() >= deadline) break;
      if (attempt < REQUEST_RETRIES) await wait(600 * (2 ** attempt));
    }
  }
  throw lastError || new Error("Official menu request failed");
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ status: false, message: "Method not allowed" });
  }

  try {
    const deadline = Date.now() + 50000;
    const [categories, branch] = await Promise.all([
      fetchJSON(`${API_BASE}/branches/${BRANCH_ID}/categories`, deadline),
      fetchJSON(`${API_BASE}/branches/khan-al-harir`, deadline).catch(() => null)
    ]);
    if (!Array.isArray(categories)) throw new Error("Invalid categories response");
    const completeCategories = [];
    let failedCategoryCount = 0;

    for (let offset = 0; offset < categories.length; offset += 6) {
      const batch = categories.slice(offset, offset + 6);
      const results = await Promise.allSettled(batch.map(async category => {
        const data = await fetchJSON(`${API_BASE}/branches/${BRANCH_ID}/categories/${category.id}/products`, deadline);
        if (!Array.isArray(data?.products)) throw new Error("Invalid products response");
        return { ...category, products: data.products };
      }));
      results.forEach((result, index) => {
        if (result.status === "fulfilled") completeCategories.push(result.value);
        else {
          failedCategoryCount += 1;
          completeCategories.push({ ...batch[index], products: [], productsUnavailable: true });
        }
      });
    }

    // Never cache partial results or serve an old response while revalidating.
    response.setHeader("Cache-Control", failedCategoryCount ? "no-store" : "public, max-age=0, s-maxage=60, must-revalidate");
    return response.status(200).json({ status: true, data: { categories: completeCategories, failedCategoryCount, branch, fetchedAt: new Date().toISOString() } });
  } catch (error) {
    console.error("Official menu proxy failed", error);
    response.setHeader("Cache-Control", "no-store");
    return response.status(502).json({ status: false, message: "Official menu is temporarily unavailable" });
  }
}

