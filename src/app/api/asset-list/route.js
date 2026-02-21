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

    const body = await req.json();

    const res = await fetch(`${API_BASE_URL}/asset-list`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body)
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