import { API_BASE_URL } from "@/lib/api";

export async function POST(req) {
    const token = req.cookies.get("token")?.value;
    if (!token) {
        return new Response(
            JSON.stringify({ message: "Unauthorized: Token missing" }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const response = await fetch(`${API_BASE_URL}/use-breach`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        }
    });

    if (!response.ok) {
        return new Response(
            JSON.stringify({ message: "Failed to update breach usage" }),
            { status: response.status, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}