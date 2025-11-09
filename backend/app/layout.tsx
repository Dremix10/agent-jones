import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Front Desk",
  description: "AI-powered front desk for local businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
