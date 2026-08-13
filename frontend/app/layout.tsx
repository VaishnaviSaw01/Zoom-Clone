import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZoomClone — Video Meetings Made Simple",
  description:
    "A full-stack Zoom clone built with Next.js 14 and FastAPI. Start instant meetings, schedule calls, and collaborate in real-time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
