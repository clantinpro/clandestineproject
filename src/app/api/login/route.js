import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function POST(req) {
    const { access_id, totp } = await req.json();

    // Proxy ke backend authentication
    const res = await fetch(`${API_BASE_URL}/new-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_id, totp }),
    });

    const data = await res.json();

    if (res.ok && data.token) {
        const token = data.token;

        const response = NextResponse.json({ message: "Login successful" });

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24,
            path: "/",
        });

        return response;
    } else {
        return NextResponse.json(
            { message: data.message || "Invalid credentials" },
            { status: 401 }
        );
    }
}