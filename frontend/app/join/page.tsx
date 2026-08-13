import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, UserSquare2 } from "lucide-react";
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
    <div className="min-h-screen bg-zoom-light-gray flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500
                     hover:text-zoom-dark mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-3xl shadow-md p-8">
          {/* Icon + heading */}
          <div className="text-center mb-7">
            <div className="w-14 h-14 mx-auto bg-zoom-blue-light rounded-2xl
                            flex items-center justify-center mb-4">
              <UserSquare2 className="w-7 h-7 text-zoom-blue" />
            </div>
            <h1 className="text-2xl font-bold text-zoom-dark">Join a Meeting</h1>
            <p className="text-sm text-gray-500 mt-1">
              Enter the meeting ID or paste an invite link
            </p>
          </div>

          <JoinMeetingForm initialCode={initialCode} />
        </div>
      </div>
    </div>
  );
}
