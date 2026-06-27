import { NextRequest } from "next/server";

const BMKG_API = process.env.BMKG_API_URL ?? "https://api.bmkg.go.id/publik/prakiraan-cuaca";
const CACHE_SECONDS = Number(process.env.WEATHER_CACHE_SECONDS ?? 1800);
const TIMEOUT_MS = Number(process.env.API_TIMEOUT_MS ?? 15000);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const adm4 = searchParams.get("adm4");

  if (!adm4) {
    return Response.json(
      { error: "Parameter adm4 (kode wilayah) diperlukan" },
      { status: 400 }
    );
  }

  // Validate format: e.g. 31.71.03.1001
  const adm4Pattern = /^\d{2}\.\d{2}\.\d{2}\.\d{4}$/;
  if (!adm4Pattern.test(adm4)) {
    return Response.json(
      {
        error:
          "Format kode wilayah tidak valid. Gunakan format: XX.XX.XX.XXXX (contoh: 31.71.03.1001)",
      },
      { status: 400 }
    );
  }

  try {
    const apiUrl = `${BMKG_API}?adm4=${encodeURIComponent(adm4)}`;
    const response = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      return Response.json(
        { error: `Gagal mengambil data dari BMKG (${response.status})` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return Response.json(data, {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`,
      },
    });
  } catch (error) {
    console.error("BMKG API error:", error);

    if (error instanceof DOMException && error.name === "TimeoutError") {
      return Response.json(
        { error: "Waktu permintaan ke server BMKG habis. Silakan coba lagi." },
        { status: 504 }
      );
    }

    return Response.json(
      { error: "Terjadi kesalahan saat mengambil data cuaca." },
      { status: 500 }
    );
  }
}
