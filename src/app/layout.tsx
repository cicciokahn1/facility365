import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { ServiceWorker } from "@/components/layout/service-worker";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth/provider";
import { DataProvider } from "@/lib/data/store";
import { SettingsProvider } from "@/lib/settings/provider";
import { TrialProvider } from "@/lib/trial/provider";

import "./globals.css";

const sans = Inter({
  variable: "--font-sans-app",
  subsets: ["latin"],
  display: "swap",
});
const mono = JetBrains_Mono({
  variable: "--font-mono-app",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Facility365",
  description:
    "Schweizer Facility-Management-Software für Hauswarte, Gemeinden und KMU.",
  manifest: "/manifest.webmanifest",
  applicationName: "Facility365",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Facility365",
  },
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f6f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0e3255" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body
        className={`${sans.variable} ${mono.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <TrialProvider>
            <SettingsProvider>
              <DataProvider>{children}</DataProvider>
            </SettingsProvider>
          </TrialProvider>
        </AuthProvider>
        <Toaster position="top-center" richColors />
        <ServiceWorker />
      </body>
    </html>
  );
}
