"use client";

import Link from "next/link";
import { Settings, Video } from "lucide-react";

/**
 * Navbar — present on all dashboard-like pages.
 * Shows logo, page title, and a right-side avatar + settings icon.
 * No real auth — always shows "Vaishnavi".
 */
export default function Navbar() {
  const initials = "V"; // Vaishnavi
  const avatarColor = "#0E71EB";

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-zoom-blue rounded-lg flex items-center justify-center
                            group-hover:bg-zoom-blue-dark transition-colors duration-150">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-zoom-dark tracking-tight">
              Zoom<span className="text-zoom-blue">Clone</span>
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Settings placeholder */}
            <button
              id="navbar-settings-btn"
              aria-label="Settings"
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800
                         transition-colors duration-150"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Avatar */}
            <div
              id="navbar-avatar"
              className="w-9 h-9 rounded-full flex items-center justify-center
                         text-white text-sm font-bold cursor-pointer
                         ring-2 ring-offset-2 ring-zoom-blue/30
                         hover:ring-zoom-blue/60 transition-all duration-150"
              style={{ backgroundColor: avatarColor }}
              title="Vaishnavi"
            >
              {initials}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
