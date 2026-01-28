"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useAuth } from "../../../context/AuthContext";
import VAScannerLoader from "../../../components/va/va_scanner_loader";
import LoadingSpinner from "../../../components/ui/loading-spinner";
import { useRouter } from "next/navigation";
import ExposedData from "../../../components/stealer/exposed_data";
import CyberParticles from "../../../components/stealer/stealer_particles";
import StealerDetailModal from "../../../components/stealer/stealer_detail_modal";
import { StealerExportButton } from "../../../components/stealer/stealer_button_export";
import StealerStatisticsWithChart from "../../../components/stealer/stealer_statistic_chart";
import ErrorModal from "../../../components/stealer/error_modal";

export default function StealerPageContent() {
    const router = useRouter();
    const { authState } = useAuth();

    // Plan & domain
    const [plan, setPlan] = useState(null);
    const [userDomains, setUserDomains] = useState([]);
    const [domainLoaded, setDomainLoaded] = useState(false);

    const [downloadLoading, setDownloadLoading] = useState(false);
    const [downloadStep, setDownloadStep] = useState("");

    // Data & Fetching
    const [stealerData, setStealerData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [scanStep, setScanStep] = useState("");
    const [hasSubscription, setHasSubscription] = useState(true);
    const [errorModal, setErrorModal] = useState({ show: false, message: "" });

    // Pagination
    const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0 });
    const [pageInput, setPageInput] = useState(1);
    const [sizeInput, setSizeInput] = useState(10);

    // Local filter (search in table data, not API)
    const [localSearch, setLocalSearch] = useState("");

    // Marking
    const [markingId, setMarkingId] = useState(null);
    const [updatedIds, setUpdatedIds] = useState({});

    // Modal detail
    const [detailModal, setDetailModal] = useState({ show: false, id: null });

    const resultsRef = useRef(null);
    const tableRef = useRef(null);

    // Pencarian (domain/keyword)
    const [searchValue, setSearchValue] = useState("");

    // Untuk empty alert
    const [showEmptyAlert, setShowEmptyAlert] = useState(false);

    // Query state for consistent export
    const [lastQuery, setLastQuery] = useState({ domain: "", q: "", type: "stealer" });
    const [loadingAll, setLoadingAll] = useState(false);

    const fetchAllStealerData = async (lastQueryParam) => {
        let allData = [];
        let page = 1;
        let size = 1000;
        let total = 1;
        let fetched = 0;

        let params = new URLSearchParams(lastQueryParam);
        params.delete("page");
        params.delete("size");

        while (fetched < total) {
            let url = `/api/proxy?${params.toString()}&page=${page}&size=${size}`;
            const res = await fetch(url, { credentials: "include" });
            if (!res.ok) break;
            const data = await res.json();
            const arr = Array.isArray(data.current_page_data) ? data.current_page_data : [];
            allData.push(...arr);
            total = data.total || allData.length;
            fetched = allData.length;
            if (!arr.length) break;
            page++;
        }
        return allData;
    };

    // Fetch plan & domain
    useEffect(() => {
        if (authState !== "authenticated") {
            setDomainLoaded(true);
            return;
        }
        let ignore = false;
        (async () => {
            try {
                const planRes = await fetch("/api/my-plan", { credentials: "include" });
                if (planRes.ok) {
                    const planData = await planRes.json();
                    setPlan(planData.data);
                    setHasSubscription(!!planData.data);
                    if (planData.data?.domain !== "unlimited") {
                        const domains = Array.isArray(planData.data?.registered_domain) ? planData.data.registered_domain : [];
                        setUserDomains(domains);
                        if (!searchValue && domains.length > 0) setSearchValue(domains[0]);
                    }
                } else {
                    setHasSubscription(false);
                }
            } finally {
                if (!ignore) setDomainLoaded(true);
            }
        })();
        return () => {
            ignore = true;
        };
    }, [authState]);

    // Handler: Fetch stealer data from API
    const fetchStealerData = async ({ searchValueParam, page = 1, size = 10 }) => {
        setIsLoading(true);
        setScanStep("Fetching threat data...");
        setShowEmptyAlert(false);

        let query = "";
        if (plan?.domain === "unlimited") {
            if (!searchValueParam?.trim()) {
                setShowEmptyAlert(true);
                setStealerData([]);
                setIsLoading(false);
                setScanStep("");
                return;
            }
            query = `q=${encodeURIComponent(searchValueParam)}&type=stealer&page=${page}&size=${size}`;
        } else {
            let searchDomain = (searchValueParam && searchValueParam.trim());
            if (!searchDomain) {
                if (userDomains.length > 0) {
                    searchDomain = userDomains[0];
                }
            }
            if (!searchDomain || !userDomains.includes(searchDomain)) {
                setShowEmptyAlert(true);
                setStealerData([]);
                setIsLoading(false);
                setScanStep("");
                setErrorModal({
                    show: true,
                    message: "Domain not allowed or not registered.",
                });
                return;
            }
            query = `domain=*${encodeURIComponent(searchDomain)}*&type=stealer&page=${page}&size=${size}`;
        }

        // Simpan query terakhir untuk export
        setLastQuery(Object.fromEntries(new URLSearchParams(query)));

        let errorHappened = false;
        try {
            setScanStep("Scanning...");
            const res = await fetch(`/api/proxy?${query}`);
            if (res.status === 403) {
                const data = await res.json();
                setErrorModal({
                    show: true,
                    message: data.error || "Domain is not allowed for search.",
                });
                setStealerData([]);
                setShowEmptyAlert(true);
                setIsLoading(false);
                setScanStep("");
                errorHappened = true;
                return;
            }
            if (!res.ok) throw new Error("API not OK");
            setScanStep("Processing result...");
            const data = await res.json();

            if (!data.current_page_data || data.current_page_data.length === 0) {
                setStealerData([]);
                setShowEmptyAlert(true);
            } else {
                setStealerData(
                    data.current_page_data.map((item) => ({
                        id: item._id,
                        password: item._source?.password || "N/A",
                        origin: item._source?.domain || "N/A",
                        email: item._source?.username || "N/A",
                        source: item._source?.threatintel || "Unknown",
                        lastBreach: "N/A",
                        checksum: item._source?.Checksum || "N/A",
                        valid: item._source?.valid ?? null,
                    }))
                );
                setShowEmptyAlert(false);
            }
            setPagination((prev) => ({
                ...prev,
                page,
                size,
                total: data.total || 0,
            }));
            setPageInput(page);
            setSizeInput(size);
        } catch (err) {
            setShowEmptyAlert(true);
            setStealerData([]);
            setErrorModal({
                show: true,
                message: err.message || "Failed to fetch data.",
            });
            errorHappened = true;
        } finally {
            setScanStep("");
            setIsLoading(false);
            if (!errorHappened) {
                setTimeout(() => {
                    if (resultsRef.current) {
                        resultsRef.current.scrollIntoView({ behavior: "smooth" });
                    }
                }, 100);
            }
        }
    };

    // Handler: Search domain/keyword (API)
    const handleSearch = async () => {
        if (authState === "loading") return;
        if (authState !== "authenticated") {
            router.push("/login");
            return;
        }
        if (!searchValue.trim()) return;

        // Validasi expired
        const isPlanExpired = plan?.expired && new Date(plan.expired) < new Date();
        if (isPlanExpired) {
            setErrorModal({
                show: true,
                message: "Your subscription plan has expired. Please renew or purchase a new plan to continue accessing this feature.",
            });
            return;
        }
        if (!plan) {
            setErrorModal({
                show: true,
                message: "Please purchase or renew a new plan to continue accessing this feature.",
            });
            return;
        }
        if (plan.domain !== "unlimited") {
            if (!userDomains.includes(searchValue.trim())) {
                setErrorModal({
                    show: true,
                    message: "Domain not allowed or not registered.",
                });
                return;
            }
        }

        await callUpdateEndpoint();

        setPagination((prev) => ({ ...prev, page: 1 }));
        await fetchStealerData({ searchValueParam: searchValue, page: 1, size: pagination.size });
    };

    const callUpdateEndpoint = async () => {
        try {
            const response = await fetch(
                `/api/update?q=${encodeURIComponent(searchValue)}&type=all`,
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

    // Handler: Export Excel, PASTI sama hasil filter search
    const handleDownloadExcel = async () => {
        setDownloadLoading(true);
        setDownloadStep("Preparing download...");
        try {
            // lastQuery pasti sama dengan search terakhir
            const params = new URLSearchParams(lastQuery);
            const res = await fetch(`/api/stealer-export?${params.toString()}`, {
                method: "GET",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to download logs.");
            setDownloadStep("Building Excel...");
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `stealer-logs-export.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setDownloadStep("Download completed.");
        } catch (err) {
            setErrorModal({ show: true, message: err.message || "Failed to download logs." });
        } finally {
            setTimeout(() => {
                setDownloadLoading(false);
                setDownloadStep("");
            }, 1200);
        }
    };

    // Handler: Pagination (API)
    const handlePagination = async (direction) => {
        let newPage = pagination.page;
        if (direction === "prev" && newPage > 1) newPage--;
        else if (direction === "next" && newPage * pagination.size < pagination.total) newPage++;
        setPagination((prev) => ({ ...prev, page: newPage }));
        await fetchStealerData({
            searchValueParam: searchValue,
            page: newPage,
            size: pagination.size,
        });
    };
    // Handler: Page input (API)
    const handlePageInputChange = (e) => setPageInput(e.target.value);
    const handlePageInputBlur = async () => {
        let value = parseInt(pageInput, 10);
        if (isNaN(value) || value < 1) value = 1;
        const maxPage = Math.ceil(pagination.total / pagination.size) || 1;
        if (value > maxPage) value = maxPage;
        setPageInput(value);
        setPagination((prev) => ({ ...prev, page: value }));
        await fetchStealerData({
            searchValueParam: searchValue,
            page: value,
            size: pagination.size,
        });
    };
    // Handler: Size input (API)
    const handleSizeInputChange = (e) => setSizeInput(e.target.value);
    const handleSizeInputBlur = async () => {
        let value = parseInt(sizeInput, 10);
        if (isNaN(value) || value < 1) value = 10;
        if (value > 1000) value = 1000;
        setSizeInput(value);
        setPagination((prev) => ({ ...prev, size: value, page: 1 }));
        await fetchStealerData({
            searchValueParam: searchValue,
            page: 1,
            size: value,
        });
    };
    // Handler: Mark valid/not valid (API)
    const markAsValid = async (id, isValid = true) => {
        setMarkingId(id);
        try {
            const res = await fetch(`/api/mark-as-valid/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ valid: isValid }),
            });
            if (res.ok) {
                setUpdatedIds((prev) => ({ ...prev, [id]: isValid }));
            }
        } finally {
            setMarkingId(null);
        }
    };

    // Local filter untuk table
    const filteredStealerData = localSearch
        ? stealerData.filter(item =>
            Object.values(item)
                .join(" ")
                .toLowerCase()
                .includes(localSearch.toLowerCase())
        )
        : stealerData;

    // Statistik modern + trend chart
    const totalEntries = pagination.total;
    const filteredCount = filteredStealerData.length;
    const validCount = filteredStealerData.filter(d =>
        updatedIds[d.id] !== undefined ? updatedIds[d.id] === true : d.valid === true
    ).length;
    const notValidCount = filteredStealerData.filter(d =>
        updatedIds[d.id] !== undefined ? updatedIds[d.id] === false : d.valid === false
    ).length;

    // --- Area Chart per Source (atau ganti ke "origin" atau tanggal kalau mau) ---
    const groupByField = "source";
    const trendCategories = Array.from(
        new Set(filteredStealerData.map(d => d[groupByField] || "Unknown"))
    );
    const trendData = {
        valid: trendCategories.map(cat =>
            filteredStealerData.filter(d => (d[groupByField] || "Unknown") === cat && d.valid === true).length
        ),
        notValid: trendCategories.map(cat =>
            filteredStealerData.filter(d => (d[groupByField] || "Unknown") === cat && d.valid === false).length
        ),
    };

    // Entry untuk modal
    const currentEntry = filteredStealerData.find(e => e.id === detailModal.id);
    const effectiveValid =
        currentEntry && updatedIds[currentEntry.id] !== undefined
            ? updatedIds[currentEntry.id]
            : currentEntry?.valid;
    const entryForModal = currentEntry
        ? { ...currentEntry, valid: effectiveValid }
        : null;

    return (
        <div>
            {(loadingAll || downloadLoading || isLoading || scanStep) && (
                <VAScannerLoader status={
                    loadingAll
                        ? "Exporting all logs..."
                        : (downloadStep || scanStep || "Scanning...")
                } domain={searchValue} message={""} />
            )}
            {!(downloadLoading || isLoading || scanStep) && (
                <ErrorModal
                    show={errorModal.show}
                    message={errorModal.message}
                    onClose={() => setErrorModal({ show: false, message: "" })}
                    userDomains={userDomains}
                    plan={plan}
                />
            )}
            <StealerDetailModal
                show={detailModal.show}
                entry={entryForModal}
                onClose={() => setDetailModal({ show: false, id: null })}
            />
            <div className="relative h-screen w-full">
                <CyberParticles />
                <section className="absolute inset-0 flex items-center justify-center px-4 sm:px-6 lg:px-8 text-white z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-4xl font-bold mb-4">Uncover Hidden Credentials</h2>
                        <p className="text-xl mb-8 text-gray-300">
                            {hasSubscription
                                ? "Full access to all compromised credentials"
                                : "Subscribe to unlock full access to breach data"}
                        </p>
                        <div className="flex flex-row gap-2 max-w-xl mx-auto shadow-lg rounded-lg overflow-hidden w-full">
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                placeholder={
                                    plan?.domain === "unlimited"
                                        ? "Search by keyword (email, domain, password, etc)"
                                        : `Search by Domain (${userDomains[0] || "your domain"})`
                                }
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && authState === "authenticated") {
                                        handleSearch();
                                    }
                                }}
                                className="input-glass bg-black text-white placeholder-gray-500 border border-gray-700 flex-1 px-4 py-2 rounded-lg transition-all duration-300 focus:ring-2 focus:ring-[#f03262] focus:border-transparent"
                            />
                            <button
                                onClick={handleSearch}
                                disabled={isLoading || !searchValue.trim()}
                                className={`${
                                    isLoading || !searchValue.trim()
                                        ? "bg-gray-600 cursor-not-allowed"
                                        : "bg-[#f03262] hover:bg-[#c91d4e]"
                                } text-white px-6 py-2 rounded-lg transition-all duration-300 font-semibold whitespace-nowrap flex items-center justify-center min-w-[120px] hover:cursor-pointer`}
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
                                        Scanning
                                    </>
                                ) : (
                                    "Search"
                                )}
                            </button>
                        </div>
                        {plan?.domain === "unlimited" ? null : (
                            <div className="mt-2 text-sm text-gray-400">
                                {userDomains.length > 0
                                    ? `Allowed domains: ${userDomains.join(", ")}`
                                    : "No domain available in your account. Please select a plan and register your domain to enable this feature."}
                            </div>
                        )}
                    </div>
                </section>
            </div>
            {(stealerData.length > 0 || showEmptyAlert) && (
                <section className="py-16 px-4 sm:px-6 lg:px-8 " ref={resultsRef}>
                    <div className="w-10/12 mx-auto">
                        <p className="text-sm uppercase text-green-500 mb-2 tracking-widest text-center">
                            🧠 Threat Intel Extract
                        </p>
                        <h2 className="text-4xl font-light text-white mb-4 text-center">
                            {hasSubscription
                                ? "Compromised Credentials"
                                : "🔒 Subscription Required"}
                        </h2>

                        {/* ==== Statistik dan Area Chart Modern ==== */}
                        <StealerStatisticsWithChart
                            total={totalEntries}
                            filtered={filteredCount}
                            valid={validCount}
                            notValid={notValidCount}
                            trendData={trendData}
                            trendCategories={trendCategories}
                        />

                        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
                            <input
                                type="text"
                                value={localSearch}
                                onChange={e => setLocalSearch(e.target.value)}
                                placeholder="Filter data in current results (e.g. email, password, etc)"
                                className="px-4 py-2 rounded-lg bg-black/30 border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#f03262] focus:border-transparent"
                                style={{ minWidth: 170 }}
                            />
                            <StealerExportButton
                                lastQuery={lastQuery}
                                fetchAllStealerData={fetchAllStealerData}
                                loading={loadingAll}
                                onStart={() => setLoadingAll(true)}
                                onFinish={() => setLoadingAll(false)}
                            />
                        </div>
                        <div className="overflow-x-auto" ref={tableRef}>
                            {filteredStealerData.length > 0 ? (
                                <table
                                    className="w-full font-mono text-sm bg-gradient-to-br from-[#18181c] via-[#232339] to-[#18181c] border border-[#2e2e2e] rounded-xl shadow-2xl overflow-hidden">
                                    <thead>
                                    <tr className="text-left border-b border-[#2e2e2e] text-[#f03262] bg-gradient-to-r from-[#26263a] to-[#1e1e24]">
                                        <th className="py-4 px-4" width="600">Exposed Data</th>
                                        <th className="py-4 px-4">Intel Source</th>
                                        <th className="py-4 px-4">Last Seen in Dump</th>
                                        <th className="py-4 px-4 text-center">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filteredStealerData.map((entry, index) => {
                                        const effectiveValid = updatedIds[entry.id] !== undefined
                                            ? updatedIds[entry.id]
                                            : entry.valid;
                                        return (
                                            <tr
                                                key={entry.id}
                                                className="border-b border-[#29293a] group transition-all duration-150 hover:bg-gradient-to-r from-[#232339] to-[#f03262]/10"
                                            >
                                                <ExposedData entry={entry} />
                                                <td className="py-4 px-4">
                                                    <span
                                                        className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 text-sm">
                                                        {entry.source}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span
                                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gradient-to-r from-gray-700 to-gray-800 text-gray-400">
                                                        {entry.lastBreach}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                                                        <button
                                                            onClick={() => setDetailModal({ show: true, id: entry.id })}
                                                            className="bg-gradient-to-r from-[#18181c] to-[#f03262]/60 hover:from-[#232339] hover:to-[#f03262] text-pink-300 border border-[#f03262] px-4 py-2 rounded-lg text-sm transition-all hover:scale-105 font-bold shadow-lg mr-2"
                                                        >
                                                            More Detail
                                                        </button>
                                                        {(() => {
                                                            if (effectiveValid === true) {
                                                                return (
                                                                    <button
                                                                        onClick={() => markAsValid(entry.id, false)}
                                                                        disabled={markingId === entry.id}
                                                                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-4 py-2 rounded-lg text-sm transition-all transform hover:scale-105 shadow-lg hover:shadow-red-500/20 flex items-center justify-center gap-1"
                                                                    >
                                                                        Mark as Not Valid
                                                                    </button>
                                                                );
                                                            }
                                                            if (effectiveValid === false) {
                                                                return (
                                                                    <button
                                                                        onClick={() => markAsValid(entry.id, true)}
                                                                        disabled={markingId === entry.id}
                                                                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-4 py-2 rounded-lg text-sm transition-all transform hover:scale-105 shadow-lg hover:shadow-green-500/20 flex items-center justify-center gap-1"
                                                                    >
                                                                        Mark as Valid
                                                                    </button>
                                                                );
                                                            }
                                                            return (
                                                                <>
                                                                    <button
                                                                        onClick={() => markAsValid(entry.id, true)}
                                                                        disabled={markingId === entry.id}
                                                                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-4 py-2 rounded-lg text-sm transition-all transform hover:scale-105 shadow-lg hover:shadow-green-500/20 flex items-center justify-center gap-1"
                                                                    >
                                                                        Mark as Valid
                                                                    </button>
                                                                    <button
                                                                        onClick={() => markAsValid(entry.id, false)}
                                                                        disabled={markingId === entry.id}
                                                                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-4 py-2 rounded-lg text-sm transition-all transform hover:scale-105 shadow-lg hover:shadow-red-500/20 flex items-center justify-center gap-1"
                                                                    >
                                                                        Mark as Not Valid
                                                                    </button>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            ) : (
                                showEmptyAlert && (
                                    <table
                                        className="min-w-full bg-gradient-to-br from-[#111215]/90 via-[#1a1b20]/90 to-[#111215]/90 backdrop-blur-lg text-white rounded-xl shadow-2xl font-mono border border-[#2e2e2e] overflow-hidden">
                                        <thead>
                                        <tr className="text-left border-b border-gray-700 text-gray-400 bg-gradient-to-r from-[#1e1e24] to-[#2a2a32]">
                                            <th className="py-4 px-6">Exposed Data</th>
                                            <th className="py-4 px-6">Intel Source</th>
                                            <th className="py-4 px-6">Last Seen in Dump</th>
                                            <th className="py-4 px-6  text-center">Actions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        <tr className="border-b border-gray-800">
                                            <td colSpan="4" className="py-8 px-6 text-center text-gray-400">
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
                                                        No compromised credentials found
                                                    </p>
                                                    <p className="text-sm mt-1">
                                                        Try searching with different domain
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                                )
                            )}
                            {hasSubscription && (
                                <div className="mt-6 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <p className="text-gray-500 text-sm">
                                            Showing {filteredStealerData.length} of {pagination.total} entries
                                            (Page {pagination.page})
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <button
                                            onClick={() => handlePagination("prev")}
                                            disabled={pagination.page === 1}
                                            className={`px-4 py-2 text-sm ${
                                                pagination.page === 1
                                                    ? "bg-gray-800 cursor-not-allowed"
                                                    : "bg-gray-800 hover:bg-gray-700"
                                            } rounded-lg transition-colors`}
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => handlePagination("next")}
                                            disabled={pagination.page * pagination.size >= pagination.total}
                                            className={`px-4 py-2 text-sm ${
                                                pagination.page * pagination.size >= pagination.total
                                                    ? "bg-[#f03262]/50 cursor-not-allowed"
                                                    : "bg-[#f03262] hover:bg-[#c91d4e]"
                                            } rounded-lg transition-colors`}
                                        >
                                            Next
                                        </button>
                                        <label className="ml-2 text-sm text-gray-300">Limit/Per Page:</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={1000}
                                            value={sizeInput}
                                            onChange={handleSizeInputChange}
                                            onBlur={handleSizeInputBlur}
                                            className="w-20 px-2 py-2 rounded-md border border-gray-700 bg-black/30 text-white text-center focus:ring-2 focus:ring-[#f03262] focus:border-transparent"
                                            title="Entries per page (max 1000)"
                                        />
                                        <label className="ml-2 text-sm text-gray-300">Page:</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={Math.max(1, Math.ceil(pagination.total / pagination.size))}
                                            value={pageInput}
                                            onChange={handlePageInputChange}
                                            onBlur={handlePageInputBlur}
                                            className="w-16 px-2 py-2 rounded-md border border-gray-700 bg-black/30 text-white text-center focus:ring-2 focus:ring-[#f03262] focus:border-transparent"
                                            title="Go to page"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}