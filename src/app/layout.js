import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeBackdrop } from "@/components/ThemeBackdrop";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Enterprise PPM - Project Portfolio & Resource Planner",
  description: "Unified Delivery, Maintenance, Financials & Resource Workload Hub",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col finstack-theme-body relative">
        <ThemeBackdrop />
        <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}

