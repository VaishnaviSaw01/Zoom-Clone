import type { Metadata } from "next";
import { UserSquare2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import JoinMeetingForm from "@/components/JoinMeetingForm";

export const metadata: Metadata = {
  title: "Join Meeting — ZoomClone",
  description: "Enter a meeting ID or invite link to join an ongoing call.",
};

/**
 * Join page (/join)
 *
 * A server component — reads the optional ?code= query param from the URL
 * and passes it as a prop to the client-side JoinMeetingForm.
 */
export default function JoinPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const initialCode = searchParams.code ?? "";

  return (
    <AppShell>
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-zinc-800 rounded-3xl shadow-md border border-gray-100 dark:border-zinc-700 p-8">
            {/* Icon + heading */}
            <div className="text-center mb-7">
              <div
                className="w-14 h-14 mx-auto bg-zoom-blue-light dark:bg-zoom-blue/20 rounded-2xl
                            flex items-center justify-center mb-4"
              >
                <UserSquare2 className="w-7 h-7 text-zoom-blue" />
              </div>
              <h1 className="text-2xl font-bold text-zoom-dark dark:text-gray-100">
                Join a Meeting
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Enter the meeting ID or paste an invite link
              </p>
            </div>

            <JoinMeetingForm initialCode={initialCode} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
