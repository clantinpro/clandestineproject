import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { API_BASE_URL } from "@/lib/api";

function toBuffer(workbook) {
    return workbook.xlsx.writeBuffer();
}

function normalize(val) {
    return (val || "")
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/$/, "")
        .toLowerCase()
        .trim();
}

export async function GET(req) {
    const { searchParams } = new URL(req.url);

    // Build backend URL
    let backendUrl = `${API_BASE_URL}/search?`;
    let paramsArr = [];
    for (const [key, value] of searchParams.entries()) {
        if (value && value !== "undefined" && value !== "null" && key !== "page" && key !== "size" && key !== "export") {
            paramsArr.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        }
    }
    backendUrl += paramsArr.join('&');

    const token = req.cookies.get("token")?.value;
    if (!token) {
        return new NextResponse(
            JSON.stringify({ message: "Unauthorized: Token missing" }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Fetch ALL data (ignore paginasi!)
    let allData = [];
    let page = 1;
    let size = 1000;
    let fetched = 0;
    let total = 1;
    try {
        while (fetched < total) {
            const url = backendUrl + `&page=${page}&size=${size}`;
            const res = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error("Failed to fetch data from backend");
            const apiJson = await res.json();
            const arr = Array.isArray(apiJson.current_page_data) ? apiJson.current_page_data : [];
            allData.push(...arr);
            total = apiJson.total || allData.length;
            fetched = allData.length;
            if (arr.length === 0) break;
            page++;
        }
    } catch (e) {
        return new NextResponse(
            JSON.stringify({ message: "Failed to fetch all data", error: e.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // ==== FILTER MANUAL SAMA PERSIS SEPERTI FE ====
    let filteredData = allData;
    const domainParam = searchParams.get("domain");
    const qParam = searchParams.get("q");

    if (domainParam) {
        const domainNorm = normalize(domainParam);
        filteredData = filteredData.filter(item =>
            normalize(item._source?.domain).includes(domainNorm) ||
            domainNorm.includes(normalize(item._source?.domain))
        );
    }
    if (qParam) {
        const qNorm = normalize(qParam);
        filteredData = filteredData.filter(item =>
            Object.values(item._source || {}).some(val =>
                normalize(val).includes(qNorm)
            )
        );
    }

    const outputName = domainParam || qParam || "export";

    // ---- CREATE EXCEL FILE ----
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Stealer Logs");

    worksheet.columns = [
        { header: "No", key: "no", width: 6 },
        { header: "Email / Username", key: "username", width: 32 },
        { header: "Password", key: "password", width: 20 },
        { header: "Domain", key: "domain", width: 40 },
        { header: "Threat Intel", key: "threatintel", width: 18 },
        { header: "Valid", key: "valid", width: 12 },
        { header: "Checksum", key: "checksum", width: 38 },
    ];

    filteredData.forEach((item, idx) => {
        const src = item._source || {};
        worksheet.addRow({
            no: idx + 1,
            username: src.username || "",
            password: src.password || "",
            domain: src.domain || "",
            threatintel: src.threatintel || "",
            valid: typeof src.valid === "boolean" ? (src.valid ? "Valid" : "Not Valid") : "",
            checksum: src.Checksum || "",
        });
    });

    worksheet.getRow(1).font = { bold: true };

    const buffer = await toBuffer(workbook);

    return new NextResponse(buffer, {
        status: 200,
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename=stealer-logs-${encodeURIComponent(outputName)}.xlsx`,
        },
    });
}