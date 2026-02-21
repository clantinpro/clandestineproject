export const dynamic = 'force-dynamic';
import { API_BASE_URL } from "@/lib/api";

export async function GET(req) {
    // Parse all params dari URL
    const { searchParams } = new URL(req.url);

    // Build backend query string
    let backendUrl = `${API_BASE_URL}/search?`;
    let paramsArr = [];
    for (const [key, value] of searchParams.entries()) {
        if (value && value !== "undefined" && value !== "null") {
            paramsArr.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        }
    }
    backendUrl += paramsArr.join('&');

    // Ambil token JWT dari cookie
    const token = req.cookies.get("token")?.value;
    if (!token) {
        return new Response(
            JSON.stringify({ message: "Unauthorized: Token missing" }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Proxy request ke backend dengan JWT token dari cookie
    const res = await fetch(backendUrl, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // <-- pakai token asli!
        }
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' }
    });
}