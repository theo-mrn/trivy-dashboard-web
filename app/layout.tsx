import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trivy Dashboard",
  description: "Centralized vulnerability dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
