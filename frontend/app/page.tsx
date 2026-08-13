"use client";

import { useEffect, useState } from "react";
import { Video, Users, CalendarDays, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import MeetingCard from "@/components/MeetingCard";
import NewMeetingModal from "@/components/NewMeetingModal";
import { getUpcomingMeetings, getRecentMeetings } from "@/lib/api";
import type { Meeting } from "@/lib/types";
import Link from "next/link";

/** Greeting based on current hour. */
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Dashboard (/) — the home page.
 *
 * Layout:
 *  • Navbar
 *  • Hero greeting with three action buttons
 *  • "Upcoming Meetings" list
 *  • "Recent Meetings" list
 */
export default function DashboardPage() {
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [recent, setRecent] = useState<Meeting[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    getUpcomingMeetings()
      .then(setUpcoming)
      .catch(console.error)
      .finally(() => setLoadingUpcoming(false));

    getRecentMeetings()
      .then(setRecent)
      .catch(console.error)
      .finally(() => setLoadingRecent(false));
  }, []);

  return (
    <div className="min-h-screen bg-zoom-light-gray">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* ---- Hero ---- */}
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          {/* Time */}
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
            <Clock className="w-4 h-4" />
            <span suppressHydrationWarning>
              {new Date().toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" — "}
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-zoom-dark mb-1">
            {greeting()}, Vaishnavi 👋
          </h1>
          <p className="text-gray-500 mb-8">
            What would you like to do today?
          </p>

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* New Meeting */}
            <button
              id="dashboard-new-meeting-btn"
              onClick={() => setShowNewMeetingModal(true)}
              className="group flex items-center gap-3 bg-zoom-blue hover:bg-zoom-blue-dark
                         text-white rounded-2xl p-5 transition-all duration-150
                         active:scale-95 shadow-md shadow-zoom-blue/20"
            >
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center
                              group-hover:bg-white/30 transition-colors">
                <Video className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold">New Meeting</p>
                <p className="text-xs text-blue-100">Start instantly</p>
              </div>
            </button>

            {/* Join Meeting */}
            <Link
              href="/join"
              id="dashboard-join-btn"
              className="group flex items-center gap-3 bg-white hover:bg-zoom-blue-light
                         border border-gray-200 hover:border-zoom-blue/30
                         text-zoom-dark rounded-2xl p-5 transition-all duration-150
                         active:scale-95 shadow-sm"
            >
              <div className="w-10 h-10 bg-zoom-light-gray rounded-xl flex items-center justify-center
                              group-hover:bg-zoom-blue/10 transition-colors">
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
              className="group flex items-center gap-3 bg-white hover:bg-zoom-blue-light
                         border border-gray-200 hover:border-zoom-blue/30
                         text-zoom-dark rounded-2xl p-5 transition-all duration-150
                         active:scale-95 shadow-sm"
            >
              <div className="w-10 h-10 bg-zoom-light-gray rounded-xl flex items-center justify-center
                              group-hover:bg-zoom-blue/10 transition-colors">
                <CalendarDays className="w-5 h-5 text-zoom-blue" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Schedule</p>
                <p className="text-xs text-gray-400">Plan ahead</p>
              </div>
            </Link>
          </div>
        </section>

        {/* ---- Upcoming Meetings ---- */}
        <section>
          <h2 className="text-lg font-bold text-zoom-dark mb-4 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-zoom-blue" />
            Upcoming Meetings
          </h2>
          {loadingUpcoming ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
              <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No upcoming meetings. Schedule one!</p>
              <Link
                href="/schedule"
                className="inline-block mt-3 text-sm font-semibold text-zoom-blue hover:underline"
              >
                Schedule a Meeting →
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

        {/* ---- Recent Meetings ---- */}
        <section>
          <h2 className="text-lg font-bold text-zoom-dark mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-zoom-blue" />
            Recent Meetings
          </h2>
          {loadingRecent ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
              <Clock className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">
                No recent meetings yet. Start your first one!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((m) => (
                <MeetingCard key={m.id} meeting={m} variant="recent" />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* New Meeting Modal */}
      {showNewMeetingModal && (
        <NewMeetingModal onClose={() => setShowNewMeetingModal(false)} />
      )}
    </div>
  );
}
