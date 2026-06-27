import { NextRequest } from "next/server";

const WILAYAH_API = process.env.WILAYAH_API_URL ?? "https://wilayah.id/api";
const CACHE_SECONDS = Number(process.env.WILAYAH_CACHE_SECONDS ?? 86400);
const TIMEOUT_MS = Number(process.env.API_TIMEOUT_MS ?? 15000);

type WilayahLevel = "provinces" | "regencies" | "districts" | "villages";

const VALID_LEVELS: WilayahLevel[] = ["provinces", "regencies", "districts", "villages"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level") as WilayahLevel | null;
  const code = searchParams.get("code");

  // Validate level
  if (!level || !VALID_LEVELS.includes(level)) {
    return Response.json(
      {
        error: `Parameter 'level' tidak valid. Gunakan salah satu: ${VALID_LEVELS.join(", ")}`,
      },
      { status: 400 }
    );
  }

  // provinces doesn't need a code, others do
  if (level !== "provinces" && !code) {
    return Response.json(
      { error: `Parameter 'code' diperlukan untuk level '${level}'` },
      { status: 400 }
    );
  }

  // Build URL
  let apiUrl: string;
  if (level === "provinces") {
    apiUrl = `${WILAYAH_API}/provinces.json`;
  } else {
    apiUrl = `${WILAYAH_API}/${level}/${encodeURIComponent(code!)}.json`;
  }

  try {
    const res = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      return Response.json(
        { error: `Gagal mengambil data wilayah (${res.status})` },
        { status: res.status }
      );
    }

    const data = await res.json();

    return Response.json(data, {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`,
      },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return Response.json(
        { error: "Waktu permintaan habis. Silakan coba lagi." },
        { status: 504 }
      );
    }
    console.error("Wilayah API error:", err);
    return Response.json(
      { error: "Terjadi kesalahan saat mengambil data wilayah." },
      { status: 500 }
    );
  }
}
