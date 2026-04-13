/**
 * Shared API utilities for fetch operations across all apps.
 * Centralized error handling and response normalization.
 */

export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly code?: string
    ) {
        super(message);
        this.name = "ApiError";
    }
}

interface FetchJsonOptions extends Omit<RequestInit, "body"> {
    body?: unknown;
}

/**
 * Type-safe fetch wrapper with standardized error handling.
 * Automatically serializes body as JSON and parses the response.
 */
export async function fetchJson<T = unknown>(
    url: string,
    options: FetchJsonOptions = {}
): Promise<T> {
    const { body, headers, ...rest } = options;

    const response = await fetch(url, {
        ...rest,
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok || data?.ok === false) {
        throw new ApiError(
            data?.message ?? `HTTP ${response.status}`,
            response.status,
            data?.error
        );
    }

    return data as T;
}

/**
 * Safely parse a JSON string, returning an empty object on failure.
 */
export function parseJsonSafe(value: unknown): Record<string, unknown> {
    if (!value) return {};
    try {
        return JSON.parse(String(value)) as Record<string, unknown>;
    } catch {
        return {};
    }
}

/**
 * Normalize a row value to a string — useful for Google Sheets data.
 */
export function stringifyCell(value: unknown): string {
    if (value === null || value === undefined) return "";
    return String(value);
}

/**
 * Normalize all values in a row record to strings.
 */
export function normalizeRowToStrings(
    row: Record<string, unknown>
): Record<string, string> {
    return Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, stringifyCell(value)])
    );
}
