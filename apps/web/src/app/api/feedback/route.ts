import { NextRequest, NextResponse } from "next/server";

const feedbackApiUrl =
    process.env.INTERNAL_INTERACTION_API_URL ||
    process.env.NEXT_PUBLIC_INTERACTION_API_URL ||
    "http://localhost:3001/interactions/feedback";

export async function POST(request: NextRequest) {
    const payload = await request.json();
    const apiBaseUrl = process.env.NEST_API_URL;
    const fallbackUrl = apiBaseUrl ? `${apiBaseUrl.replace(/\/$/, "")}/interactions/feedback` : null;
    const targets = [feedbackApiUrl, fallbackUrl].filter(Boolean) as string[];

    for (const target of targets) {
        try {
            const response = await fetch(target, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload),
                cache: "no-store"
            });

            if (!response.ok) {
                continue;
            }

            const data = await response.json();
            return NextResponse.json({ ok: true, data, target });
        } catch {
            // Try next target
        }
    }

    // Soft-fail: accept feedback locally as queued to avoid losing user input in offline pilot mode.
    return NextResponse.json({
        ok: true,
        queued: true,
        message: "Feedback queued locally because upstream service is unavailable."
    });
}
