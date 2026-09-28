import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
    title: "Sentech — Finance workspace",
    description: "Invoices, cash flow and business finances for Sentech.",
    icons: { icon: "/logo.png" },
    robots: { index: false, follow: false },
};
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>{children}</body>
        </html>
    );
}
