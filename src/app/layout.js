import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "../components/navbar";
import { AuthProvider } from "../context/AuthContext";
import LoaderWrapper from "../components/ui/loader-wrapper";

const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata = {
    title: "Clandestine Project",
    description: "Clandestine Project.",
    icons: { icon: "image/favicon.ico" }
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={poppins.variable}>
            <body className="antialiased">
                <AuthProvider>
                    <div className="w-full bg-[#f33d74] text-white text-center py-2 px-3 sm:px-4 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 z-[60] shadow-md relative">
                        <span>
                            Clandestine Project has been acquired by <strong>Redac7d</strong>. Please visit <a href="https://redac7d.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-black transition-colors">redac7d.com</a> for the newest updates!
                        </span>
                    </div>
                    <Navbar />
                    <LoaderWrapper>
                        {children}
                    </LoaderWrapper>
                </AuthProvider>
            </body>
        </html>
    );
}