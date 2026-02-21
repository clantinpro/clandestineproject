import { cookies } from "next/headers";
import { API_BASE_URL } from "@/lib/api";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || 1;
    const size = searchParams.get("size") || 10;
    const search = searchParams.get("search") || "";

    // FIX: cookies() harus di-await!
    const cookiesStore = await cookies();
    const token = cookiesStore.get("token")?.value;

    const backendUrl = `${API_BASE_URL}/admin/users?page=${page}&size=${size}&search=${encodeURIComponent(search)}`;

    const resp = await fetch(backendUrl, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
    });

    const data = await resp.json();

    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}