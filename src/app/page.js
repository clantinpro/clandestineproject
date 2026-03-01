"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import Globe from "../components/globe";
import Footer from "../components/footer";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
    ShieldCheckIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    BugAntIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

/* ---------------------------
  New: stats to show on Home
  same data as your dashboard
----------------------------*/
const homeStats = [
    { label: "Email", value: 26102688785 },
    { label: "Password", value: 13342389831 },
    { label: "Full name", value: 12801652751 },
    { label: "Telephone", value: 11694818802 },
    { label: "Nick", value: 10456573331 },
    { label: "Document number", value: 3657038761 },
];

function StatsCards({ stats, duration = 900 }) {
    // animate counters from 0 to target for nicer UX on homepage
    const [counts, setCounts] = useState(stats.map(() => 0));

    useEffect(() => {
        let raf = null;
        let start = null;
        const targets = stats.map((s) => s.value);

        function step(timestamp) {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);

            setCounts(
                targets.map((t) => {
                    // ease out
                    const eased = 1 - Math.pow(1 - progress, 3);
                    return Math.floor(t * eased);
                })
            );

            if (progress < 1) {
                raf = requestAnimationFrame(step);
            }
        }

        raf = requestAnimationFrame(step);
        return () => {
            if (raf) cancelAnimationFrame(raf);
        };
    }, [stats, duration]);

    return (
        <section className="py-14 bg-gradient-to-b from-transparent to-black/20">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-8">
                    <span className="text-[#f03262] font-mono text-sm tracking-widest">
                        DATA SNAPSHOT
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mt-2">
                        Live leak & exposure overview
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto mt-3">
                        Quick glance at the current counts we’re tracking across sources —
                        updated in near real-time on the dashboard.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stats.map((s, i) => (
                        <div
                            key={s.label}
                            className="bg-gradient-to-tr from-[#1b1b21] to-[#131317] border border-[#23232b] rounded-xl p-6 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-sm text-gray-400 font-semibold">{s.label}</div>
                                <div className="text-xs text-gray-500 bg-[#111115] px-2 py-1 rounded">
                                    {i === 0 ? "primary" : "metric"}
                                </div>
                            </div>

                            <div className="flex items-end justify-between">
                                <div className="text-2xl md:text-3xl font-bold text-white">
                                    {counts[i].toLocaleString("en-US")}
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-400"></div>
                                </div>
                            </div>

                            <div className="mt-4 text-sm text-gray-400">
                                <span
                                    className="inline-block bg-[#f03262]/10 text-[#f03262] px-2 py-1 rounded mr-2 text-xs font-medium">
                                    Live
                                </span>
                                Aggregated from deep/dark web sources and stealer logs.
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ---------------------------
  Existing Home component
  (only change: insert StatsCards after hero/banner)
----------------------------*/
export default function Home() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("law");

    const handleDiscover = () => {
        router.push(`/dark_web/stealer?q=${encodeURIComponent(searchQuery)}`);
    };

    const useCases = [
        {
            id: "stealer",
            title: "Stealer Monitoring",
            description:
                "Protect your organization from stealer malware threats by identifying credential and cookie theft targeting your digital assets. Stay ahead with real-time alerts and forensic insights.",
            icon: <BugAntIcon className="w-10 h-10 text-[#f03262]" />,
            features: [
                "Stealer log monitoring",
                "Credential & cookie alerts",
                "Incident response integration",
            ],
        },
        {
            id: "leaks",
            title: "Dark Web Leaks Monitoring",
            description:
                "Detect compromised credentials, databases, and assets exposed on the dark web. Receive instant alerts to secure your business before attackers exploit your data.",
            icon: <MagnifyingGlassIcon className="w-10 h-10 text-[#f03262]" />,
            features: ["Deep/dark web search", "Leak & dump detection", "Exposure alerting"],
        },
        {
            id: "vuln",
            title: "Vulnerability Scanning",
            description:
                "Continuously scan your digital infrastructure for new vulnerabilities and exposures. Get notified to patch risks before they are exploited.",
            icon: <ShieldCheckIcon className="w-10 h-10 text-[#f03262]" />,
            features: ["Automated asset scanning", "Zero-day & CVE alerts", "Continuous risk assessment"],
        },
    ];

    return (
        <div className="relative overflow-x-hidden">
            {/* Hero Section */}
            <div className="relative h-screen w-full">
                <Globe />

                <section
                    className="absolute inset-0 flex items-center justify-center px-4 sm:px-6 lg:px-8 text-white z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-2xl md:text-3xl font-bold mb-4 animate-fade-in">Instantly Detect Stolen
                            Credentials</h2>
                        <p className="text-md md:text-xl mb-8 animate-fade-in">
                            Search our real-time stealer malware database for
                            <br className="hidden md:block" />
                            exposed credentials, cookies, and sensitive data targeting your domain.
                        </p>

                        <div
                            className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto shadow-lg rounded-lg overflow-hidden animate-fade-in">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Enter your domain or email"
                                className="input-glass flex-grow px-4 py-3 bg-black/20 backdrop-blur-md border border-white/10 focus:border-[#f03262]/50 focus:outline-none transition-all duration-300 text-white placeholder-white/70"
                                onKeyDown={(e) => e.key === "Enter" && handleDiscover()}
                            />
                            <button
                                onClick={handleDiscover}
                                className="bg-[#f03262] hover:bg-[#d82a56] text-white px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 transform"
                            >
                                Search
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {/* NEW: Stats cards section (placed right after the hero/banner) */}
            <StatsCards stats={homeStats} />

            {/* Products Section - Dark Theme */}
            <section className="py-20 bg-gray-900 bg-opacity-50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-[#f03262] font-mono text-sm tracking-widest">OUR SOLUTIONS</span>
                        <h2 className="text-3xl md:text-5xl font-bold text-white mt-4">Unified Threat Intelligence</h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-[#f03262] to-[#d82a56] mx-auto mt-6"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <BugAntIcon className="w-8 h-8 text-[#f03262]" />,
                                title: "Dark Web Stealer Monitoring",
                                description:
                                    "Automated monitoring of stealer malware logs (Redline, Raccoon, Vidar, etc.) to detect stolen credentials, cookies, and sensitive assets targeting your organization.",
                                features: ["Stealer log detection", "Credential & cookie alerts", "Brand and domain protection"],
                                href: "/dark_web/stealer",
                            },
                            {
                                icon: <MagnifyingGlassIcon className="w-8 h-8 text-[#f03262]" />,
                                title: "Dark Web Leaks Monitoring",
                                description:
                                    "Continuous surveillance of underground markets, leak sites, and forums to identify exposed credentials, databases, and sensitive data before attackers exploit them.",
                                features: ["Real-time leak discovery", "Data exposure alerts", "Deep & dark web coverage"],
                                href: "/dark_web/leaks",
                            },
                            {
                                icon: <ShieldCheckIcon className="w-8 h-8 text-[#f03262]" />,
                                title: "Vulnerability Scanning",
                                description:
                                    "Automated scanning and monitoring of your digital assets for new vulnerabilities and exposures—enabling fast remediation and continuous risk reduction.",
                                features: ["Continuous external scanning", "Asset discovery", "Zero-day & CVE detection"],
                                href: "/vulnerabilities",
                            },
                        ].map((product, index) => (
                            <div key={index}
                                className="bg-gray-800 border border-gray-700 rounded-xl p-8 hover:border-[#f03262] transition-all hover:shadow-lg hover:shadow-[#f03262]/10">
                                <div
                                    className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mb-6">{product.icon}</div>
                                <h3 className="text-xl font-bold text-white mb-3">{product.title}</h3>
                                <p className="text-gray-300 mb-5">{product.description}</p>

                                <ul className="space-y-2 mb-6">
                                    {product.features.map((feature, i) => (
                                        <li key={i} className="flex items-center text-gray-400">
                                            <CheckCircleIcon className="w-4 h-4 text-[#f03262] mr-2" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <a href={product.href}
                                    className="text-[#f03262] hover:text-white font-medium flex items-center group">
                                    Explore solution
                                    <ArrowRightIcon
                                        className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Intelligence Platform Section - Light/Dark Split */}
            <section className="bg-gradient-to-b from-gray-900 to-black border-t border-b border-gray-800">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2">
                    {/* Image Panel - Enhanced Dark */}
                    <div className="relative h-[500px] lg:h-auto">
                        <Image
                            src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                            alt="Dark Web Intelligence Dashboard"
                            fill
                            className="object-cover opacity-90"
                        />

                        <div
                            className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent flex items-end p-10">
                            <div
                                className="bg-gradient-to-r from-black/90 to-gray-900/90 backdrop-blur-sm p-6 rounded-xl border border-[#f03262]/20 shadow-lg shadow-[#f03262]/10">
                                <div className="flex items-center mb-2">
                                    <div className="w-3 h-3 bg-[#f03262] rounded-full mr-2 animate-pulse"></div>
                                    <h4 className="text-white font-bold">LIVE STEALER & LEAK MONITORING</h4>
                                </div>
                                <p className="text-gray-300 text-sm font-mono tracking-wider">Tracking stealer logs &
                                    leaks across 2,400+ darkweb sources</p>
                            </div>
                        </div>
                    </div>

                    {/* Content Panel - Dark Theme */}
                    <div className="bg-gray-900 p-12 border-l border-gray-800 flex flex-col justify-center">
                        <span className="text-[#f03262] font-mono text-sm tracking-widest mb-2">UNIFIED CYBER INTELLIGENCE</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-6 bg-gradient-to-r from-white to-[#f03262] bg-clip-text text-transparent">
                            Our Core Features
                        </h2>
                        <p className="text-gray-300 mb-8">
                            Integrated monitoring of stealer malware, credential leaks, and vulnerabilities with
                            automated alerts and deep/dark web coverage.
                        </p>

                        <div className="space-y-6">
                            <div
                                className="group flex items-start p-4 rounded-lg transition-all hover:bg-gray-800/50 hover:border-l-2 hover:border-[#f03262]">
                                <div
                                    className="bg-[#f03262]/20 p-2 rounded-lg mr-4 group-hover:bg-[#f03262]/30 transition-all">
                                    <BugAntIcon className="w-6 h-6 text-[#f03262]" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Stealer Malware Log Monitoring</h4>
                                    <p className="text-gray-400 text-sm mt-1">Detects and alerts on credentials,
                                        cookies, and sensitive data compromised by stealer malware in real-time.</p>
                                </div>
                            </div>

                            <div
                                className="group flex items-start p-4 rounded-lg transition-all hover:bg-gray-800/50 hover:border-l-2 hover:border-[#f03262]">
                                <div
                                    className="bg-[#f03262]/20 p-2 rounded-lg mr-4 group-hover:bg-[#f03262]/30 transition-all">
                                    <MagnifyingGlassIcon className="w-6 h-6 text-[#f03262]" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Dark Web Leaks Monitoring</h4>
                                    <p className="text-gray-400 text-sm mt-1">Continuously scans thousands of darkweb
                                        sources for credential leaks, database dumps, and exposed assets.</p>
                                </div>
                            </div>

                            <div
                                className="group flex items-start p-4 rounded-lg transition-all hover:bg-gray-800/50 hover:border-l-2 hover:border-[#f03262]">
                                <div
                                    className="bg-[#f03262]/20 p-2 rounded-lg mr-4 group-hover:bg-[#f03262]/30 transition-all">
                                    <ShieldCheckIcon className="w-6 h-6 text-[#f03262]" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Vulnerability Scanning & Alerts</h4>
                                    <p className="text-gray-400 text-sm mt-1">Automated asset discovery and
                                        vulnerability scanning for continuous risk reduction.</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex flex-col sm:flex-row gap-4">
                            <a href="/contact"
                                className="bg-gradient-to-r from-[#f03262] to-[#d82a56] hover:from-[#f03262]/90 hover:to-[#d82a56]/90 text-white px-6 py-3 rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-[#f03262]/30 flex items-center justify-center">
                                <ShieldCheckIcon className="w-5 h-5 mr-2" />
                                Request Access
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Use Cases Section */}
            <section
                className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900 to-black border-t border-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-sm font-mono text-[#f03262] tracking-widest">USE CASES</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 bg-clip-text text-transparent bg-gradient-to-r from-[#f03262] to-[#d82a56]">
                            Intelligence For Every Industry
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {useCases.map((item) => (
                            <div key={item.id}
                                className="border border-[#f03262] bg-gray-800/50 shadow-lg shadow-[#f03262]/20 rounded-xl p-8 transition-all">
                                <div className="flex items-center mb-6">
                                    <div className="p-3 rounded-lg bg-gray-800 mr-4">{item.icon}</div>
                                    <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                                </div>
                                <p className="text-gray-300 mb-6">{item.description}</p>
                                <ul className="space-y-3">
                                    {item.features.map((feature, i) => (
                                        <li key={i} className="flex items-center text-gray-400">
                                            <CheckCircleIcon className="w-5 h-5 text-[#f03262] mr-2" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer Section */}
            <Footer />
        </div>
    );
}