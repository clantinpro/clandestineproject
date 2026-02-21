export const dynamic = 'force-dynamic';
import { API_BASE_URL } from "@/lib/api";

export async function PUT(req, context) {
    const params = await context.params;
    const { id } = params;
    const token = req.cookies.get("token")?.value;

    if (!token) {
        return new Response(
            JSON.stringify({ message: "Unauthorized: Token missing" }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }

    let reqBody;
    try {
        reqBody = await req.json();
    } catch {
        reqBody = {};
    }

    // Forward the request to backend, pakai token JWT asli!
    const res = await fetch(`${API_BASE_URL}/mark-as-valid/${id}`, {
        method: "PUT",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ valid: reqBody.valid }),
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
    });
}