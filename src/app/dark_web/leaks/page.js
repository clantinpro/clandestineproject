"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useRouter } from "next/navigation";
import LeakCardDynamic from "../../../components/leaks/leaks_card";
import LeaksParticles from "../../../components/leaks/leaks_particles";
import VAScannerLoader from "../../../components/va/va_scanner_loader";
import LeaksStatisticsWithChart from "../../../components/leaks/leaks_statistic_chart";
import ErrorModal from "../../../components/leaks/error_modal";

gsap.registerPlugin(ScrollToPlugin);

async function fetchLimitFromBackend(setSearchLimit) {
    try {
        const res = await fetch("/api/leaks/get-limit", { credentials: "include" });
        if (res.ok) {
            const data = await res.json();
            let isUnlimited = false;
            let max = 0;
            let current = 0;
            if (data?.data?.breach === "unlimited") {
                isUnlimited = true;
                max = Infinity;
                current = Number(data?.data?.current_breach ?? 0);
            } else {
                max = Number(data?.data?.breach ?? 0);
                current = Number(data?.data?.current_breach ?? 0);
                isUnlimited = false;
            }
            setSearchLimit({ max, current, isUnlimited });
        }
    } catch (e) {}
}

export default function LeaksPage() {
    const router = useRouter();
    const { authState } = useAuth();
    const DEFAULT_SIZE = 20;
    const [breachData, setBreachData] = useState([]);
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [scanStep, setScanStep] = useState("");
    const [pagination, setPagination] = useState({
        page: 1,
        size: DEFAULT_SIZE,
        total: 0,
    });
    const [sizeInput, setSizeInput] = useState(DEFAULT_SIZE);
    const [pageInput, setPageInput] = useState(1);
    const resultsRef = useRef(null);
    const tableRef = useRef(null);
    const [showEmptyAlert, setShowEmptyAlert] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const [plan, setPlan] = useState(null);
    const [errorModal, setErrorModal] = useState({ show: false, message: "" });

    const [searchLimit, setSearchLimit] = useState(null);

    useEffect(() => {
        if (authState !== "authenticated") return;
        fetchLimitFromBackend(setSearchLimit);
    }, [authState]);

    // --- PLAN FETCH (for expired support, not for domain) ---
    useEffect(() => {
        if (authState !== "authenticated") return;
        let ignore = false;
        (async () => {
            try {
                const planRes = await fetch("/api/my-plan", { credentials: "include" });
                if (planRes.ok) {
                    const planData = await planRes.json();
                    setPlan(planData.data);
                }
            } finally { }
        })();
        return () => { ignore = true; };
    }, [authState]);

    const transformBreachData = (apiData) => {
        return apiData.current_page_data
            .map((item) => {
                const source = item._source;
                // Ambil array Data (bisa array atau single object)
                const dataArr = Array.isArray(source?.Data)
                    ? source.Data
                    : source?.Data
                        ? [source.Data]
                        : [];
                // Gunakan data pertama untuk field utama card (email, dsb)
                const mainData = dataArr[0] || {};
                const email = mainData?.Email || mainData?.email || "N/A";
                const fullName =
                    mainData?.FullName ||
                    (mainData?.FirstName && mainData?.LastName
                        ? `${mainData.FirstName} ${mainData.LastName}`
                        : "N/A");
                const location =
                    mainData?.Location ||
                    mainData?.Region ||
                    mainData?.Locality ||
                    (mainData?.Country ? `${mainData.Country}` : "N/A");
                const position =
                    mainData?.Title ||
                    mainData?.JobTitle ||
                    (mainData?.fields?.includes("password")
                        ? "Credentials exposed"
                        : "N/A");
                const company =
                    mainData?.CompanyName ||
                    mainData?.JobCompanyName ||
                    (mainData?.origin
                        ? `From: ${
                            Array.isArray(mainData.origin)
                                ? mainData.origin.join(", ")
                                : mainData.origin
                        }`
                        : "N/A");
                const password =
                    mainData?.password ||
                    mainData?.Password ||
                    (source?.source?.passwordless === 1
                        ? "No password exposed"
                        : "Not exposed");
                const breachDate =
                    source?.source?.breach_date ||
                    (source.Source === "LinkedIn Scraped Data"
                        ? "2021 (Scraped)"
                        : source.Source === "Stealer Logs"
                            ? "Recent"
                            : "Unknown date");
                const severity =
                    source.Source === "Stealer Logs"
                        ? "High"
                        : source.Source === "LinkedIn Scraped Data"
                            ? "Low"
                            : password !== "Not exposed"
                                ? "Critical"
                                : "Medium";

                return {
                    id: item._id,
                    email,
                    name: fullName,
                    firstName: mainData?.FirstName,
                    lastName: mainData?.LastName,
                    location,
                    position,
                    company,
                    summary: mainData?.Summary || source?.Info || "No summary available",
                    source: source?.Source || "Unknown",
                    breachDate,
                    records:
                        source.Source === "LinkedIn Scraped Data"
                            ? "400M+ records"
                            : source.Source === "Stealer Logs"
                                ? "Compilation"
                                : "N/A",
                    severity,
                    passwordExposed: password,
                    additionalFields: mainData?.fields || [],
                    rawData: dataArr, // <-- array semua data!
                };
            })
            .filter(Boolean);
    };

    const callUpdateEndpoint = async () => {
        try {
            const response = await fetch(
                `/api/update?q=${encodeURIComponent(searchQuery)}&type=all`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );
            if (!response.ok) {
                console.error("Failed to trigger update endpoint.");
            }
        } catch (error) {
            console.error("Error calling update endpoint:", error);
        }
    };

    const loadNewData = async () => {
        let errorHappened = false;
        try {
            setIsLoading(true);
            setScanStep("Querying breach data...");

            await callUpdateEndpoint();

            const { page, size } = pagination;
            const response = await fetch(
                `/api/leaks?q=${encodeURIComponent(searchQuery)}&type=breach&page=${page}&size=${size}`
            );
            if (response.status === 403) {
                const data = await response.json();
                setErrorModal({
                    show: true,
                    message: data.error || "Search forbidden.",
                });
                setBreachData([]);
                setShowEmptyAlert(true);
                setPagination((prev) => ({
                    ...prev,
                    total: 0,
                }));
                setIsLoading(false);
                setScanStep("");
                errorHappened = true;
                return;
            }
            if (!response.ok) {
                throw new Error(
                    `Network response was not ok: ${response.status} ${response.statusText}`
                );
            }
            setScanStep("Processing result...");
            const data = await response.json();
            if (!data.current_page_data || data.current_page_data.length === 0) {
                setBreachData([]);
                setShowEmptyAlert(true);

                setPagination((prev) => ({
                    ...prev,
                    total: 0,
                }));
                setIsLoading(false);
                setScanStep("");
                return;
            } else {
                setShowEmptyAlert(false);
            }
            const transformedData = transformBreachData(data);
            setBreachData(transformedData);
            setPagination((prev) => ({
                ...prev,
                total: data.total || 0,
            }));

        } catch (error) {
            setShowEmptyAlert(true);
            setBreachData([]);
            setErrorModal({
                show: true,
                message: error.message || "Failed to fetch data.",
            });
            errorHappened = true;
        } finally {
            setIsLoading(false);
            setScanStep("");
            if (!errorHappened) {
                setTimeout(() => {
                    if (resultsRef.current) {
                        import("gsap").then(({ default: gsap }) => {
                            gsap.to(window, {
                                duration: 1,
                                scrollTo: { y: resultsRef.current, offsetY: 50 },
                                ease: "power3.out",
                            });
                        });
                    }
                }, 100);
            }
        }
    };

    // POST ke endpoint update limit (hanya saat search baru)
    const updateSearchLimit = async () => {
        try {
            const res = await fetch("/api/leaks/update-limit", { method: "POST", credentials: "include" });
            return res.ok;
        } catch (e) {
            return false;
        }
    };

    const handleSearch = async () => {
        if (authState === "loading" || isLoading) return;
        if (authState !== "authenticated") {
            router.push("/login");
            return;
        }
        if (!searchInput.trim()) return;

        if (!plan) {
            setErrorModal({
                show: true,
                message: "Please purchase or renew a new plan to continue accessing this feature.",
            });
            return;
        }

        const isPlanExpired = plan.expired && new Date(plan.expired) < new Date();
        if (isPlanExpired) {
            setErrorModal({
                show: true,
                message: "Your subscription plan has expired. Please renew or purchase a new plan to continue accessing this feature.",
            });
            return;
        }

        // Validasi limit hanya jika BUKAN unlimited
        if (
            searchLimit && typeof searchLimit.max !== "undefined" && typeof searchLimit.current !== "undefined"
        ) {
            if (!searchLimit.isUnlimited && searchLimit.current >= searchLimit.max) {
                setErrorModal({
                    show: true,
                    message: "Search limit reached! You have used all available searches.",
                });
                return;
            }
        }

        setPagination((prev) => ({
            ...prev,
            page: 1,
            size: sizeInput,
        }));
        setShowEmptyAlert(false);
        setBreachData([]);
        setHasSearched(true);

        // Kalau bukan unlimited, update limit via POST
        if (searchLimit && !searchLimit.isUnlimited) {
            const limitUpdated = await updateSearchLimit();
            if (!limitUpdated) {
                setErrorModal({ show: true, message: "Failed to update search limit" });
                return;
            }
            // Optional: fetch limit terbaru biar UI sync
            await fetchLimitFromBackend(setSearchLimit);
        }

        if (searchInput === searchQuery) {
            await loadNewData();
        } else {
            setSearchQuery(searchInput);
        }
    };

    // Pagination: hanya fetch data, quota tetap
    const handlePagination = (direction) => {
        if (isLoading) return;
        if (direction === "prev" && pagination.page > 1) {
            setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
        } else if (
            direction === "next" &&
            pagination.page * pagination.size < pagination.total
        ) {
            setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
        }
    };

    const handleSizeInputChange = (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) val = 1;
        setSizeInput(val);
    };
    const handleSizeInputKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSizeInputBlur(e);
        }
    };
    const handleSizeInputBlur = (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) val = 1;
        if (val < 1) val = 1;
        if (val > 1000) val = 1000;
        setSizeInput(val);
        setPagination((prev) => ({
            ...prev,
            size: val,
            page: 1,
        }));
    };
    useEffect(() => {
        setPageInput(pagination.page);
    }, [pagination.page]);
    const handlePageInputKeyDown = (e) => {
        if (e.key === "Enter") {
            handlePageInputBlur(e);
        }
    };
    const handlePageInputChange = (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) val = 1;
        setPageInput(val);
    };
    const handlePageInputBlur = () => {
        let val = pageInput;
        const maxPage = Math.max(1, Math.ceil(pagination.total / pagination.size));
        if (val < 1) val = 1;
        if (val > maxPage) val = maxPage;
        setPageInput(val);
        setPagination((prev) => ({
            ...prev,
            page: val,
        }));
    };

    useEffect(() => {
        if (authState === "authenticated" && hasSearched) {
            loadNewData();
        }
    }, [searchQuery, pagination.page, pagination.size, hasSearched, authState]);

    // ==== Statistik Modern ala Stealer ====
    const totalEntries = pagination.total;
    const filteredCount = breachData.length;
    const exposedCount = breachData.filter(d =>
        d.passwordExposed && d.passwordExposed !== "Not exposed" && d.passwordExposed !== "No password exposed"
    ).length;
    const notExposedCount = filteredCount - exposedCount;

    return (
        <div className="relative">
            {(isLoading || scanStep) && (
                <VAScannerLoader status={scanStep || "Scanning..."} domain={searchInput} from_leaks={1} message={""} />
            )}
            {!(isLoading || scanStep) && (
                <ErrorModal
                    show={errorModal.show}
                    message={errorModal.message}
                    onClose={() => setErrorModal({ show: false, message: "" })}
                    limit={searchLimit}
                />
            )}

            <div className="relative h-screen w-full">
                <LeaksParticles />
                <section className="absolute inset-0 flex items-center justify-center px-4 sm:px-6 lg:px-8 text-white z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-4xl font-bold mb-4">
                            Discover Exposed Credentials Instantly
                        </h2>
                        <p className="text-xl mb-8 text-gray-300">
                            Monitor the dark web for compromised emails, domains, and
                            accounts.
                            <br />
                            Protect your organization by searching global breach intelligence
                            in seconds.
                        </p>
                        <div className="flex flex-row gap-2 max-w-xl mx-auto shadow-lg rounded-lg overflow-hidden w-full">
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                placeholder={"Search by keyword (email, domain, password, etc)"}
                                className="input-glass bg-black text-white placeholder-gray-500 border border-gray-700 flex-1 px-4 py-2 rounded-lg transition-all duration-300 focus:ring-2 focus:ring-[#0aafff] focus:border-transparent"
                            />
                            <button
                                onClick={handleSearch}
                                disabled={
                                    isLoading ||
                                    !searchInput.trim()
                                }
                                className={`${
                                    isLoading || !searchInput.trim()
                                        ? "bg-gray-600 cursor-not-allowed"
                                        : authState !== "authenticated"
                                            ? "bg-gradient-to-r from-red-500 to-pink-500"
                                            : "bg-[#0aafff] hover:bg-[#0088cc]"
                                } text-white px-6 py-2 rounded-lg transition-all duration-300 font-semibold whitespace-nowrap flex items-center justify-center min-w-[120px]`}
                            >
                                {authState !== "authenticated" ? (
                                    "Login to Search"
                                ) : isLoading ? (
                                    <>
                                        <svg
                                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Querying
                                    </>
                                ) : (
                                    "Search Breaches"
                                )}
                            </button>
                        </div>
                        {/* LIMIT INFO: HANYA tampil kalau TIDAK unlimited */}
                        {(searchLimit && !searchLimit.isUnlimited && typeof searchLimit.max !== "undefined" && typeof searchLimit.current !== "undefined") && (
                            <div className="mt-2 text-sm text-yellow-400">
                                {searchLimit.current >= searchLimit.max
                                    ? `Search limit reached (${searchLimit.current}/${searchLimit.max})`
                                    : `Search left: ${searchLimit.max - searchLimit.current} / ${searchLimit.max}`}
                            </div>
                        )}
                    </div>
                </section>
            </div>
            {(breachData.length > 0 || showEmptyAlert) && (
                <section className="py-16 px-4 sm:px-6 lg:px-8" ref={resultsRef}>
                    <div className="max-w-7xl mx-auto">
                        <p className="text-sm uppercase text-cyan-500 mb-2 tracking-widest text-center">
                            {breachData[0]?.isTeaser
                                ? "🔒 Restricted Access"
                                : "🔍 Professional Data Exposure"}
                        </p>
                        <h2 className="text-4xl font-light text-white mb-8 text-center">
                            {breachData[0]?.isTeaser
                                ? "Upgrade to View Results"
                                : "Scraped Professional Profiles"}
                        </h2>

                        <LeaksStatisticsWithChart
                            total={totalEntries}
                            filtered={filteredCount}
                            exposed={exposedCount}
                            notExposed={notExposedCount}
                        />

                        <div className="overflow-x-auto" ref={tableRef}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[200px]">
                                {isLoading ? (
                                    <div className="col-span-full flex justify-center items-center py-16">
                                        <VAScannerLoader status={scanStep || "Scanning..."} domain={searchInput} message={""} />
                                    </div>
                                ) : breachData.length === 0 && showEmptyAlert ? (
                                    <div className="col-span-full flex flex-col items-center justify-center py-16">
                                        <table className="min-w-full bg-gradient-to-br from-[#111215]/90 via-[#1a1b20]/90 to-[#111215]/90 backdrop-blur-lg text-white rounded-xl shadow-2xl font-mono border border-[#2e2e2e] overflow-hidden">
                                            <thead>
                                            <tr className="text-left border-b border-gray-700 text-gray-400 bg-gradient-to-r from-[#1e1e24] to-[#2a2a32]">
                                                <th className="py-4 px-6">Exposed Data</th>
                                                <th className="py-4 px-6">Breach Source</th>
                                                <th className="py-4 px-6">Breach Date</th>
                                                <th className="py-4 px-6">Severity</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            <tr className="border-b border-gray-800">
                                                <td colSpan="4" className="py-12 px-6 text-center text-gray-400">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <svg
                                                            className="w-12 h-12 mb-4 text-gray-600"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="1.5"
                                                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                        <p className="text-lg font-medium">
                                                            No results found for your search.
                                                        </p>
                                                        <p className="text-sm mt-1">
                                                            Try searching with different domain or keyword.
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    breachData.map((entry, idx) => (
                                        <LeakCardDynamic key={entry.id || idx} entry={entry} />
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="mt-6 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                            <div className="flex items-center gap-2">
                                <p className="text-gray-500 text-sm">
                                    Showing {breachData.length} of {pagination.total} entries
                                    (Page {pagination.page})
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    onClick={() => handlePagination("prev")}
                                    disabled={pagination.page === 1 || isLoading}
                                    className={`px-4 py-2 text-sm ${
                                        pagination.page === 1 || isLoading
                                            ? "bg-gray-800 cursor-not-allowed"
                                            : "bg-gray-800 hover:bg-gray-700"
                                    } rounded-lg transition-colors`}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => handlePagination("next")}
                                    disabled={
                                        pagination.page * pagination.size >= pagination.total ||
                                        isLoading
                                    }
                                    className={`px-4 py-2 text-sm ${
                                        pagination.page * pagination.size >= pagination.total ||
                                        isLoading
                                            ? "bg-[#f03262]/50 cursor-not-allowed"
                                            : "bg-[#f03262] hover:bg-[#c91d4e]"
                                    } rounded-lg transition-colors`}
                                >
                                    Next
                                </button>
                                <label className="ml-2 text-sm text-gray-300">
                                    Limit/Per Page:
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={1000}
                                    value={sizeInput}
                                    onChange={handleSizeInputChange}
                                    onBlur={handleSizeInputBlur}
                                    onKeyDown={handleSizeInputKeyDown}
                                    className="w-20 px-2 py-2 rounded-md border border-gray-700 bg-black/30 text-white text-center focus:ring-2 focus:ring-[#f03262] focus:border-transparent"
                                    title="Entries per page (max 1000)"
                                />
                                <label className="ml-2 text-sm text-gray-300">Page:</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={Math.max(
                                        1,
                                        Math.ceil(pagination.total / pagination.size)
                                    )}
                                    value={pageInput}
                                    onChange={handlePageInputChange}
                                    onBlur={handlePageInputBlur}
                                    onKeyDown={handlePageInputKeyDown}
                                    className="w-16 px-2 py-2 rounded-md border border-gray-700 bg-black/30 text-white text-center focus:ring-2 focus:ring-[#f03262] focus:border-transparent"
                                    title="Go to page"
                                />
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}