import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/lib/api";

export async function POST(request, { params }) {
    const { id } = params;
    const cookiesStore = await cookies();
    const token = cookiesStore.get("token")?.value;

    try {
        const res = await fetch(`${API_BASE_URL}/admin/users/${id}/remove-admin`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(
                { message: data.message || "Failed to remove admin role" },
                { status: res.status }
            );
        }

        return NextResponse.json({ message: "User removed from admin", data });
    } catch (err) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
