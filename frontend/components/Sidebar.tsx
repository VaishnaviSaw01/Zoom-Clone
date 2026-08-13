"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Settings, X, Menu } from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: <Home className="w-5 h-5" /> },
  {
    label: "Meetings",
    href: "/",
    icon: <CalendarDays className="w-5 h-5" />,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

/**
 * Sidebar — fixed 220px left navigation rail.
 * Collapses to a slide-in drawer on mobile (toggled via a hamburger in the Navbar).
 */
export default function Sidebar({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <nav className="flex flex-col gap-1 p-4 h-full">
      {/* Logo area (mobile only — desktop logo is in Navbar) */}
      <div className="lg:hidden flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-zinc-700">
        <span className="text-lg font-bold text-zoom-dark dark:text-gray-100">
          Zoom<span className="text-zoom-blue">Clone</span>
        </span>
        <button
          onClick={onMobileClose}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {NAV_ITEMS.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          onClick={onMobileClose}
          className={`sidebar-item ${isActive(item.href) && !(item.label === "Meetings" && pathname !== "/") ? "active" : ""}`}
          id={`sidebar-nav-${item.label.toLowerCase()}`}
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar — always visible ≥lg */}
      <aside
        className="hidden lg:flex flex-col w-[220px] min-h-full
                   bg-zoom-sidebar dark:bg-zinc-800 border-r border-gray-200
                   dark:border-zinc-700 flex-shrink-0"
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay + slide-in drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <aside
            className="relative w-[220px] bg-zoom-sidebar dark:bg-zinc-800
                       border-r border-gray-200 dark:border-zinc-700
                       animate-slide-in-left"
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
