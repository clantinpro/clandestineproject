import { cookies } from "next/headers";
import { API_BASE_URL } from "@/lib/api";

export async function POST(request) {
    try {
        const body = await request.json();

        // Ambil token dari cookies
        const cookiesStore = await cookies();
        const token = cookiesStore.get("token")?.value;

        const backendUrl = `${API_BASE_URL}/admin/users`;

        const resp = await fetch(backendUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(body),
        });

        const data = await resp.json();

        return new Response(JSON.stringify(data), {
            status: resp.status,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
