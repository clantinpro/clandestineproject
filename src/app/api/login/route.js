import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function POST(req) {
    try {
        const { access_id, totp } = await req.json();

        // Proxy ke backend authentication
        const res = await fetch(`${API_BASE_URL}/new-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_id, totp }),
        });

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            return NextResponse.json(
                { message: "Server returned an invalid non-JSON response" },
                { status: 502 }
            );
        }

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
                { status: res.status !== 200 ? res.status : 401 }
            );
        }
    } catch (error) {
        console.error("Login API Error:", error.message);
        return NextResponse.json(
            { message: "Backend is unreachable or failed to process the request" },
            { status: 503 }
        );
    }
}