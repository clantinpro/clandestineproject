export const dynamic = 'force-dynamic';
import { API_BASE_URL } from "@/lib/api";

export async function POST(req) {
    // Get token from cookies
    const token = req.cookies.get("token")?.value;
    if (!token) {
        return new Response(
            JSON.stringify({ message: "Unauthorized: Token missing" }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Parse JSON body
    let body;
    try {
        body = await req.json();
    } catch {
        return new Response(
            JSON.stringify({ message: "Invalid JSON in request body" }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const { paymentId } = body;
    if (!paymentId || typeof paymentId !== "string") {
        return new Response(
            JSON.stringify({ message: "Missing or invalid paymentId" }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Forward request to backend API
    const res = await fetch(`${API_BASE_URL}/process-payment`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentId }),
    });

    // Validate backend response
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
        const text = await res.text();
        return new Response(
            JSON.stringify({
                message: "Invalid response from backend",
                backend: text.slice(0, 500)
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { "Content-Type": "application/json" }
    });
}