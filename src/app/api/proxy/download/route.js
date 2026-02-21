import { API_BASE_URL } from "@/lib/api";
export async function GET(request) {
    const { search } = new URL(request.url);
    const url = `${API_BASE_URL}/search/download${search}`;
    const response = await fetch(url, { method: "GET" });
    const html = await response.text();
    return new Response(html, {
        status: response.status,
        headers: { "Content-Type": "text/html" },
    });
}