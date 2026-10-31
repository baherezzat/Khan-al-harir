import sharp from "sharp";

const ALLOWED_IMAGE_HOSTS = new Set(["dashboard.iconapp.site"]);
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const source = new URL(String(request.query?.src || ""));
    if (source.protocol !== "https:" || !ALLOWED_IMAGE_HOSTS.has(source.hostname)) {
      response.status(400).json({ error: "Unsupported image source" });
      return;
    }

    const upstream = await fetch(source, {
      redirect: "error",
      signal: AbortSignal.timeout(10000),
      headers: { Accept: "image/webp,image/jpeg,image/png" }
    });
    if (!upstream.ok) throw new Error(`Image source failed (${upstream.status})`);
    const declaredLength = Number(upstream.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_SOURCE_BYTES) {
      response.status(413).json({ error: "Image is too large" });
      return;
    }

    const sourceBuffer = Buffer.from(await upstream.arrayBuffer());
    if (sourceBuffer.length > MAX_SOURCE_BYTES) {
      response.status(413).json({ error: "Image is too large" });
      return;
    }

    const jpeg = await sharp(sourceBuffer)
      .rotate()
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#f5f3ed" })
      .jpeg({ quality: 86, progressive: true })
      .toBuffer();

    response.setHeader("Content-Type", "image/jpeg");
    response.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
    response.status(200).send(jpeg);
  } catch (error) {
    console.error("Offer image conversion failed", error);
    response.status(502).json({ error: "Could not prepare offer image" });
  }
}

