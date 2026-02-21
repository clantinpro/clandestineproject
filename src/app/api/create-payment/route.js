export const dynamic = 'force-dynamic';
import { API_BASE_URL } from "@/lib/api";

export async function POST(req) {
    const token = req.cookies.get("token")?.value;
    if (!token) {
        return new Response(
            JSON.stringify({ message: "Unauthorized: Token missing" }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }

    let body;
    try {
        body = await req.json();
    } catch {
        return new Response(
            JSON.stringify({ message: "Invalid JSON in request body" }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Validasi field wajib
    const { invoiceId, assetCode, blockchainCode, isEvm } = body;
    if (
        !invoiceId || typeof invoiceId !== "string" ||
        !assetCode || typeof assetCode !== "string" ||
        !blockchainCode || typeof blockchainCode !== "string" ||
        typeof isEvm !== "boolean"
    ) {
        return new Response(
            JSON.stringify({
                message: "Missing or invalid fields. Required: invoiceId (string), assetCode (string), blockchainCode (string), isEvm (boolean)"
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Hanya kirim field yang dibutuhkan ke backend
    const payload = { invoiceId, assetCode, blockchainCode, isEvm };

    const res = await fetch(`${API_BASE_URL}/create-payment`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload)
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        const text = await res.text();
        return new Response(
            JSON.stringify({
                message: "Invalid response from backend",
                backend: text.slice(0, 500)
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const data = await res.json();

    return new Response(JSON.stringify(data), {
        status: res.status,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}