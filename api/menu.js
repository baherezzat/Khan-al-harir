"use strict";

const API_BASE = "https://dashboard.iconapp.site/api";
const BRANCH_ID = 33;
const REQUEST_RETRIES = 2;

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function fetchJSON(url) {
  let lastError;
  for (let attempt = 0; attempt <= REQUEST_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Official menu request failed (${response.status})`);
      const payload = await response.json();
      if (!payload?.status) throw new Error(payload?.msg || "Official menu response was unsuccessful");
      return payload.data;
    } catch (error) {
      lastError = error;
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
    const categories = await fetchJSON(`${API_BASE}/branches/${BRANCH_ID}/categories`);
    const completeCategories = [];

    for (let offset = 0; offset < categories.length; offset += 6) {
      const batch = categories.slice(offset, offset + 6);
      const results = await Promise.all(batch.map(async category => {
        const data = await fetchJSON(`${API_BASE}/branches/${BRANCH_ID}/categories/${category.id}/products`);
        return { ...category, products: data.products || [] };
      }));
      completeCategories.push(...results);
    }

    response.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=86400");
    return response.status(200).json({ status: true, data: { categories: completeCategories } });
  } catch (error) {
    console.error("Official menu proxy failed", error);
    response.setHeader("Cache-Control", "no-store");
    return response.status(502).json({ status: false, message: "Official menu is temporarily unavailable" });
  }
}

