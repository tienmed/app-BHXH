import { NextRequest, NextResponse } from "next/server";

const remoteUrl = process.env.GOOGLE_APPS_SCRIPT_URL || process.env.NEXT_PUBLIC_RECOMMENDATION_API_URL;

export async function GET(request: NextRequest) {
    if (!remoteUrl) {
        return NextResponse.json(
            {
                error: "missing_remote_url",
                message: "GOOGLE_APPS_SCRIPT_URL is not configured."
            },
            { status: 503 }
        );
    }

    const status = request.nextUrl.searchParams.get("status") ?? "";
    const icd = request.nextUrl.searchParams.get("icd") ?? "";
    const limit = request.nextUrl.searchParams.get("limit") ?? "30";

    try {
        const params = new URLSearchParams({ action: "doctor-feedback", limit });
        if (status) params.set("status", status);
        if (icd) params.set("icd", icd);

        const response = await fetch(`${remoteUrl}?${params.toString()}`, {
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

        const data = await response.json();
        return NextResponse.json(data);
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

    const payload = await request.json();

    try {
        const response = await fetch(remoteUrl, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify({
                action: "resolve-doctor-feedback",
                ...payload
            }),
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

        const data = await response.json();
        return NextResponse.json(data);
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
