import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/lib/user-context";

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
        {/*
          Inline script that reads localStorage BEFORE React hydrates to avoid
          a flash of unstyled content on dark-mode pages.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('zoom-theme') || 'system';
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (t === 'dark' || (t === 'system' && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen font-sans antialiased bg-white dark:bg-zinc-900">
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
