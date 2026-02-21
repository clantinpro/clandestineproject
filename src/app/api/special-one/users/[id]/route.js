// app/api/special-one/users/[id]/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/lib/api";

export async function GET(request, { params }) {
    const { id } = params;
    const cookiesStore = await cookies();
    const token = cookiesStore.get("token")?.value;

    try {
        const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(
                { message: data.message || "Failed to fetch user" },
                { status: res.status }
            );
        }

        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const { id } = params;
    const cookiesStore = await cookies();
    const token = cookiesStore.get("token")?.value;

    try {
        const body = await request.json();

        const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(
                { message: data.message || "Failed to update user" },
                { status: res.status }
            );
        }

        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const { id } = params;
    const cookiesStore = await cookies();
    const token = cookiesStore.get("token")?.value;

    try {
        const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(
                { message: data.message || "Failed to delete user" },
                { status: res.status }
            );
        }

        return NextResponse.json({ message: "User deleted successfully", data });
    } catch (err) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}