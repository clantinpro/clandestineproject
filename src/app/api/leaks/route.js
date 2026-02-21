export const dynamic = 'force-dynamic';
import { API_BASE_URL } from "@/lib/api";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const type = searchParams.get('type');
    const page = searchParams.get('page');
    const size = searchParams.get('size');

    const token = req.cookies.get("token")?.value;
    if (!token) {
        return new Response(
            JSON.stringify({ message: "Unauthorized: Token missing" }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const res = await fetch(
        `${API_BASE_URL}/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}&page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}`,
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        }
    );

    const data = await res.json();

    return new Response(JSON.stringify(data), {
        status: res.status,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}