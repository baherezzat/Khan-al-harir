import sharp from "sharp";

const ALLOWED_IMAGE_HOSTS = new Set(["dashboard.iconapp.site"]);
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const OUTPUT_WIDTH = 1000;
const OUTPUT_HEIGHT = 750;

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
      signal: AbortSignal.timeout(12000),
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

    const image = await sharp(sourceBuffer)
      .rotate()
      .resize({
        width: OUTPUT_WIDTH,
        height: OUTPUT_HEIGHT,
        fit: "contain",
        position: "centre",
        background: "#fbfaf5",
        kernel: sharp.kernel.lanczos3,
        withoutEnlargement: false
      })
      .sharpen({ sigma: 0.7, m1: 0.6, m2: 0.25 })
      .webp({ quality: 91, effort: 4, smartSubsample: true })
      .toBuffer();

    response.setHeader("Content-Type", "image/webp");
    response.setHeader("Cache-Control", "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800");
    response.status(200).send(image);
  } catch (error) {
    console.error("Menu image enhancement failed", error);
    response.status(502).json({ error: "Could not prepare menu image" });
  }
}

