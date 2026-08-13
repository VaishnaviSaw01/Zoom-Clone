import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import AppShell from "@/components/AppShell";
import ScheduleForm from "@/components/ScheduleForm";

export const metadata: Metadata = {
  title: "Schedule Meeting — ZoomClone",
  description:
    "Plan a future meeting with a title, description, date/time, and duration.",
};

/**
 * Schedule page (/schedule)
 *
 * Simple server component shell — all form logic lives in ScheduleForm.
 */
export default function SchedulePage() {
  return (
    <AppShell>
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] p-4">
        <div className="w-full max-w-lg">
          <div className="bg-white dark:bg-zinc-800 rounded-3xl shadow-md border border-gray-100 dark:border-zinc-700 p-8">
            {/* Icon + heading */}
            <div className="text-center mb-7">
              <div
                className="w-14 h-14 mx-auto bg-zoom-blue-light dark:bg-zoom-blue/20 rounded-2xl
                            flex items-center justify-center mb-4"
              >
                <CalendarDays className="w-7 h-7 text-zoom-blue" />
              </div>
              <h1 className="text-2xl font-bold text-zoom-dark dark:text-gray-100">
                Schedule a Meeting
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Set a time and share the invite link with participants
              </p>
            </div>

            <ScheduleForm />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
