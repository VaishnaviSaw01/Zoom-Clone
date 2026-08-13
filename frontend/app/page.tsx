"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Users, CalendarDays, Clock, Copy, Check } from "lucide-react";
import AppShell from "@/components/AppShell";
import MeetingCard from "@/components/MeetingCard";
import {
  getUpcomingMeetings,
  getRecentMeetings,
  startPmiMeeting,
} from "@/lib/api";
import { useUser } from "@/lib/user-context";
import type { Meeting } from "@/lib/types";
import Link from "next/link";

/**
 * Dashboard (/) — the home page.
 *
 * Layout (real Zoom reference):
 *  • AppShell (Sidebar + Navbar)
 *  • Left column: greeting, PMI card, quick-action buttons
 *  • Right column: Upcoming Meetings + Recent Meetings (both visible on desktop)
 *  • Stacked on mobile
 */
export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();

  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [recent, setRecent] = useState<Meeting[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [pmiCopied, setPmiCopied] = useState(false);
  const [startingPmi, setStartingPmi] = useState(false);

  // Fetch on mount AND whenever the tab becomes visible again.
  // The visibility listener covers the case where Next.js soft-navigates
  // back to "/" and useEffect([]) doesn't re-run.
  useEffect(() => {
    function fetchAll() {
      setLoadingRecent(true);
      setLoadingUpcoming(true);

      getUpcomingMeetings()
        .then(setUpcoming)
        .catch(console.error)
        .finally(() => setLoadingUpcoming(false));

      getRecentMeetings()
        .then((meetings) => {
          // Ensure newest first (belt-and-suspenders sort on the client too)
          const sorted = [...meetings].sort((a, b) => {
            const timeA = new Date(a.ended_at || a.created_at).getTime();
            const timeB = new Date(b.ended_at || b.created_at).getTime();
            return timeB - timeA;
          });
          setRecent(sorted);
        })
        .catch(console.error)
        .finally(() => setLoadingRecent(false));
    }

    fetchAll(); // initial load

    // Re-fetch whenever the page becomes visible (covers tab-switch + soft-nav return)
    function onVisible() {
      if (document.visibilityState === "visible") fetchAll();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  /** Copy the PMI invite link to clipboard. */
  async function handleCopyPmi() {
    if (!user?.personal_meeting_id) return;
    const link = `${window.location.origin}/join?code=${user.personal_meeting_id}`;
    await navigator.clipboard.writeText(link);
    setPmiCopied(true);
    setTimeout(() => setPmiCopied(false), 2000);
  }

  /** Start a PMI meeting (creates/fetches the room, then navigates). */
  async function handleStartPmi() {
    setStartingPmi(true);
    try {
      const meeting = await startPmiMeeting();
      router.push(`/meeting/${meeting.meeting_code}`);
    } catch (err) {
      console.error(err);
    } finally {
      setStartingPmi(false);
    }
  }

  const name = user?.name ?? "…";

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* ---- Desktop two-column layout ---- */}
        <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
          {/* ---- Left column ---- */}
          <div className="flex-1 space-y-6 min-w-0">
            {/* Greeting */}
            <div>
              <h1 className="text-2xl font-bold text-zoom-dark dark:text-gray-100">
                Welcome back, {name}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Quick-action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* New Meeting */}
              <Link
                href="#"
                id="dashboard-new-meeting-btn"
                onClick={(e) => {
                  e.preventDefault();
                  // Trigger the navbar's New Meeting modal via custom event
                  document.getElementById("navbar-new-meeting-btn")?.click();
                }}
                className="group flex items-center gap-3 bg-zoom-blue hover:bg-zoom-blue-dark
                           text-white rounded-2xl p-5 transition-all duration-150
                           active:scale-95 shadow-md shadow-zoom-blue/20"
              >
                <div
                  className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center
                              group-hover:bg-white/30 transition-colors"
                >
                  <Video className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">New Meeting</p>
                  <p className="text-xs text-blue-100">Start instantly</p>
                </div>
              </Link>

              {/* Join Meeting */}
              <Link
                href="/join"
                id="dashboard-join-btn"
                className="group flex items-center gap-3 bg-white dark:bg-zinc-800
                           hover:bg-zoom-blue-light dark:hover:bg-zinc-700
                           border border-gray-200 dark:border-zinc-700
                           text-zoom-dark dark:text-gray-100 rounded-2xl p-5
                           transition-all duration-150 active:scale-95 shadow-sm"
              >
                <div
                  className="w-10 h-10 bg-zoom-light-gray dark:bg-zinc-700 rounded-xl
                              flex items-center justify-center group-hover:bg-zoom-blue/10
                              transition-colors"
                >
                  <Users className="w-5 h-5 text-zoom-blue" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Join Meeting</p>
                  <p className="text-xs text-gray-400">Enter an ID or link</p>
                </div>
              </Link>

              {/* Schedule */}
              <Link
                href="/schedule"
                id="dashboard-schedule-btn"
                className="group flex items-center gap-3 bg-white dark:bg-zinc-800
                           hover:bg-zoom-blue-light dark:hover:bg-zinc-700
                           border border-gray-200 dark:border-zinc-700
                           text-zoom-dark dark:text-gray-100 rounded-2xl p-5
                           transition-all duration-150 active:scale-95 shadow-sm"
              >
                <div
                  className="w-10 h-10 bg-zoom-light-gray dark:bg-zinc-700 rounded-xl
                              flex items-center justify-center group-hover:bg-zoom-blue/10
                              transition-colors"
                >
                  <CalendarDays className="w-5 h-5 text-zoom-blue" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Schedule</p>
                  <p className="text-xs text-gray-400">Plan ahead</p>
                </div>
              </Link>
            </div>

            {/* Personal Meeting ID card */}
            {user?.personal_meeting_id && (
              <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 p-5 shadow-sm">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Personal Meeting ID
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <p
                    id="personal-meeting-id"
                    className="font-mono text-xl font-bold text-zoom-dark dark:text-gray-100 tracking-widest"
                  >
                    {user.personal_meeting_id}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      id="copy-pmi-btn"
                      onClick={handleCopyPmi}
                      className="flex items-center gap-1.5 text-sm font-medium text-zoom-blue
                                 hover:text-zoom-blue-dark transition-colors"
                    >
                      {pmiCopied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      {pmiCopied ? "Copied!" : "Copy Link"}
                    </button>
                    <button
                      id="start-pmi-btn"
                      onClick={handleStartPmi}
                      disabled={startingPmi}
                      className="btn-primary text-sm px-4 py-1.5 disabled:opacity-60"
                    >
                      {startingPmi ? "Starting…" : "Start"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ---- Right column — Meetings panels ---- */}
          <div className="lg:w-[360px] space-y-6 flex-shrink-0">
            {/* Upcoming Meetings */}
            <section>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-zoom-blue" />
                Upcoming
              </h2>
              {loadingUpcoming ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-20 bg-gray-200 dark:bg-zinc-800 rounded-2xl animate-pulse"
                    />
                  ))}
                </div>
              ) : upcoming.length === 0 ? (
                <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 text-center border border-gray-100 dark:border-zinc-700">
                  <CalendarDays className="w-8 h-8 text-gray-200 dark:text-zinc-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No upcoming meetings.</p>
                  <Link
                    href="/schedule"
                    className="inline-block mt-2 text-sm font-semibold text-zoom-blue hover:underline"
                  >
                    Schedule one
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((m) => (
                    <MeetingCard key={m.id} meeting={m} variant="upcoming" />
                  ))}
                </div>
              )}
            </section>

            {/* Recent Meetings */}
            <section>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-zoom-blue" />
                Recent
              </h2>
              {loadingRecent ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-20 bg-gray-200 dark:bg-zinc-800 rounded-2xl animate-pulse"
                    />
                  ))}
                </div>
              ) : recent.length === 0 ? (
                <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 text-center border border-gray-100 dark:border-zinc-700">
                  <Clock className="w-8 h-8 text-gray-200 dark:text-zinc-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No recent meetings yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recent.map((m) => (
                    <MeetingCard key={m.id} meeting={m} variant="recent" />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
