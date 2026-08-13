"use client";

import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

/**
 * AppShell — wraps all non-meeting pages with the persistent sidebar and navbar.
 * The meeting room page renders its own full-screen layout and does NOT use AppShell.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-900">
      <Navbar
        onMobileMenuToggle={() => setMobileMenuOpen((v) => !v)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
        <main className="flex-1 overflow-y-auto bg-zoom-light-gray dark:bg-zinc-900">
          {children}
        </main>
      </div>
    </div>
  );
}
