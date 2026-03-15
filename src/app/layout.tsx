import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import CommandPalette from "@/components/layout/CommandPalette";
import Providers from "@/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AdapticaCRM — Modern Sales CRM",
  description: "A full-featured modern CRM for managing contacts, deals, tasks, and team collaboration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased min-h-screen bg-background`}>
        <Providers>
          <Sidebar />
          <div className="pl-64 flex flex-col min-h-screen w-full">
            <TopBar />
            <main className="flex-1 p-8">
              {children}
            </main>
          </div>
          <CommandPalette />
        </Providers>
      </body>
    </html>
  );
}
