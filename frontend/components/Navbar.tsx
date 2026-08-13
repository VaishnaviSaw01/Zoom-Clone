"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import {
  Video,
  CalendarDays,
  Users,
  Settings,
  Menu,
} from "lucide-react";
import { useUser, getInitials } from "@/lib/user-context";
import NewMeetingModal from "./NewMeetingModal";

interface NavbarProps {
  onMobileMenuToggle: () => void;
}

/**
 * Navbar — sticky top bar.
 * Left: hamburger (mobile) + logo.
 * Right: Schedule / Join / New Meeting quick-action buttons + avatar dropdown.
 */
export default function Navbar({ onMobileMenuToggle }: NavbarProps) {
  const { user } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = user ? getInitials(user.name) : "V";
  const avatarColor = user?.avatar_color ?? "#0E71EB";

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 shadow-sm flex-shrink-0">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Left: hamburger (mobile) + logo */}
            <div className="flex items-center gap-3">
              <button
                id="navbar-mobile-menu-btn"
                onClick={onMobileMenuToggle}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100
                           dark:hover:bg-zinc-800 transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <Link href="/" className="flex items-center gap-2 group">
                <div
                  className="w-7 h-7 bg-zoom-blue rounded-md flex items-center justify-center
                              group-hover:bg-zoom-blue-dark transition-colors"
                >
                  <Video className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-lg font-bold text-zoom-dark dark:text-gray-100 tracking-tight">
                  Zoom<span className="text-zoom-blue">Clone</span>
                </span>
              </Link>
            </div>

            {/* Right: quick-action buttons + avatar */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Schedule */}
              <Link
                href="/schedule"
                id="navbar-schedule-btn"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                           text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800
                           transition-colors hidden sm:flex"
              >
                <CalendarDays className="w-4 h-4" />
                <span>Schedule</span>
              </Link>

              {/* Join */}
              <Link
                href="/join"
                id="navbar-join-btn"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                           text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800
                           transition-colors hidden sm:flex"
              >
                <Users className="w-4 h-4" />
                <span>Join</span>
              </Link>

              {/* New Meeting */}
              <button
                id="navbar-new-meeting-btn"
                onClick={() => setShowNewMeetingModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold
                           bg-zoom-blue text-white hover:bg-zoom-blue-dark
                           transition-colors"
              >
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">New Meeting</span>
              </button>

              {/* Avatar + dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  id="navbar-avatar"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="w-8 h-8 rounded-full flex items-center justify-center
                             text-white text-xs font-bold ring-2 ring-offset-1
                             ring-zoom-blue/40 hover:ring-zoom-blue/70
                             transition-all duration-150 ml-1"
                  style={{ backgroundColor: avatarColor }}
                  title={user?.name ?? "Profile"}
                  aria-expanded={dropdownOpen}
                >
                  {initials}
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div
                    className="absolute right-0 top-10 w-48 bg-white dark:bg-zinc-800
                               border border-gray-200 dark:border-zinc-700
                               rounded-xl shadow-lg py-1 animate-fade-in z-50"
                  >
                    {/* User info */}
                    <div className="px-4 py-2.5 border-b border-gray-100 dark:border-zinc-700">
                      <p className="text-sm font-semibold text-zoom-dark dark:text-gray-100 truncate">
                        {user?.name ?? "Vaishnavi"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>

                    <Link
                      href="/settings"
                      id="avatar-dropdown-settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700
                                 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700
                                 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>

                    <button
                      id="avatar-dropdown-signout"
                      disabled
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm
                                 text-gray-300 dark:text-gray-500 cursor-not-allowed"
                      title="Sign out is disabled (no auth in this demo)"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {showNewMeetingModal && (
        <NewMeetingModal onClose={() => setShowNewMeetingModal(false)} />
      )}
    </>
  );
}
