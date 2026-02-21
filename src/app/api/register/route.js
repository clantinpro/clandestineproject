import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function POST(req) {
    try {
        const { referral, captcha } = await req.json();

        // Forward ke API backend-mu
        const res = await fetch(`${API_BASE_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({

            }),
        });

        const data = await res.json();

        if (res.ok) {
            return NextResponse.json(data, { status: 200 });
        } else {
            return NextResponse.json(
                { message: data.message || "Registration failed" },
                { status: res.status }
            );
        }
    } catch (error) {
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}