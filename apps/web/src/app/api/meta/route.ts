import { NextRequest, NextResponse } from "next/server";
import { clinicalEngine } from "@/lib/clinical-engine";

export async function GET(request: NextRequest) {
    try {
        const apiBaseUrl = process.env.NEST_API_URL;
        
        if (!apiBaseUrl) {
            const meta = await clinicalEngine.getMeta();
            return NextResponse.json(meta);
        }

        const response = await fetch(`${apiBaseUrl}/recommendations/meta`, {
            cache: "no-store"
        });
        
        if (!response.ok) throw new Error("API failed");
        
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Meta fetch error, falling back to local engine:", error);
        try {
            const meta = await clinicalEngine.getMeta();
            return NextResponse.json(meta);
        } catch (localError) {
            return NextResponse.json({ version: "2026.01", source: "local-csv" });
        }
    }
}
