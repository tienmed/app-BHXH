import { NextResponse } from "next/server";

const remoteUrl = process.env.GOOGLE_APPS_SCRIPT_URL || process.env.NEXT_PUBLIC_RECOMMENDATION_API_URL;

export async function GET() {
  if (!remoteUrl) {
    return NextResponse.json(
      {
        error: "missing_remote_url",
        message: "GOOGLE_APPS_SCRIPT_URL is not configured."
      },
      { status: 503 }
    );
  }

  try {
    const url = new URL(remoteUrl);
    url.searchParams.set("action", "workbook-preview");
    url.searchParams.set("tabs", "catalog_icd");

    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "remote_request_failed",
          status: response.status,
          message: `Apps Script returned HTTP ${response.status}`
        },
        { status: 502 }
      );
    }

    const payload = await response.json();
    const tab = Array.isArray(payload?.tabs)
      ? payload.tabs.find((item: { name?: string }) => item?.name === "catalog_icd")
      : null;
    const rows = Array.isArray(tab?.rows) ? tab.rows : [];

    const options = rows
      .filter((row: Record<string, unknown>) => {
        const code = String(row.icd_code ?? "").trim();
        const name = String(row.icd_name ?? "").trim();
        const isActive = String(row.is_active ?? "true").toLowerCase() !== "false";

        return code && name && isActive;
      })
      .map((row: Record<string, unknown>) => ({
        code: String(row.icd_code ?? ""),
        label: String(row.icd_name ?? "")
      }))
      .sort((left: { code: string }, right: { code: string }) => left.code.localeCompare(right.code));

    return NextResponse.json({
      source: "Google Apps Script",
      options
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "remote_request_exception",
        message: error instanceof Error ? error.message : "Unknown remote error"
      },
      { status: 502 }
    );
  }
}
