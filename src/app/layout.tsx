import "./globals.css";
import Providers from "@/Providers";
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AdapticaCRM — CRM Dashboard",
  description: "Modern CRM application powered by Material Design 3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <ProtectedRoute>
            <MainLayout>
              {children}
            </MainLayout>
          </ProtectedRoute>
        </Providers>
      </body>
    </html>
  );
}


