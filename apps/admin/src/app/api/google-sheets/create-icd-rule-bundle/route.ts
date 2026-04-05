import { NextRequest, NextResponse } from "next/server";

const remoteUrl = process.env.GOOGLE_APPS_SCRIPT_URL || process.env.NEXT_PUBLIC_RECOMMENDATION_API_URL;

export async function POST(request: NextRequest) {
  if (!remoteUrl) {
    return NextResponse.json(
      {
        error: "missing_remote_url",
        message: "GOOGLE_APPS_SCRIPT_URL is not configured."
      },
      { status: 503 }
    );
  }

  const body = await request.json();

  try {
    const response = await fetch(remoteUrl, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...body,
        action: "create-icd-rule-bundle"
      })
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

    const data = await response.json();

    if (data?.ok === false || data?.error) {
      const message =
        data?.error === "Unsupported action"
          ? "Apps Script chưa được deploy bản mới có action create-icd-rule-bundle."
          : data?.message || data?.error || "Apps Script returned an application error.";

      return NextResponse.json(
        {
          ...data,
          message
        },
        { status: 400 }
      );
    }

    return NextResponse.json(data, { status: 200 });
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
