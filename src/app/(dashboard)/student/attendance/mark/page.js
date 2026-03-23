// src/app/(dashboard)/student/attendance/mark/page.js
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { CheckCircle2, KeyRound } from "lucide-react";

function CheckInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);

  const urlCode = searchParams.get("code");
  const lectureId = searchParams.get("lectureId");

  // Auto-submit ONCE if coming from a QR code scan
  useEffect(() => {
    if (urlCode && lectureId && !success && !isSubmitting && !hasAutoSubmitted) {
      setHasAutoSubmitted(true);
      setCode(urlCode);
      handleCheckIn(urlCode, lectureId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCode, lectureId]);

  const getLocationWithPermissionCheck = () => {
    return new Promise(async (resolve, reject) => {
      if (navigator.permissions) {
        try {
          const permResult = await navigator.permissions.query({ name: "geolocation" });
          if (permResult.state === "denied") {
            reject(new Error(
              "Location is blocked. Tap the 🔒 lock icon in the address bar → Site Settings → set Location to 'Allow', then retry."
            ));
            return;
          }
        } catch {
          // Permissions API not supported — fall through
        }
      }

      if (!navigator.geolocation) {
        reject(new Error("Your browser does not support location. Please use Chrome or Safari."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            reject(new Error(
              "Location denied. Tap the  lock icon → Site Settings → set Location to 'Allow'."
            ));
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            reject(new Error("Location unavailable. Try moving closer to a window."));
          } else if (error.code === error.TIMEOUT) {
            reject(new Error("Location timed out. Please try again."));
          } else {
            reject(new Error("Could not get your location. Ensure GPS is on."));
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  };

  const handleCheckIn = async (otpCode, id = null) => {
    const trimmedCode = (otpCode || "").trim();

    if (!trimmedCode || trimmedCode.length < 4) {
      toast.error("Please enter a valid 4-digit code");
      return;
    }

    setIsSubmitting(true);
    const locationToastId = toast.loading("Getting your location…");

    try {
      const position = await getLocationWithPermissionCheck();
      const { latitude, longitude } = position.coords;
      toast.dismiss(locationToastId);

      const res = await fetch("/api/student/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: trimmedCode,
          lectureId: id ?? lectureId,
          latitude,
          longitude,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark attendance");

      setSuccess(true);
      toast.success(data.message || "Attendance marked!");
      setTimeout(() => router.push("/student"), 3000);

    } catch (error) {
      toast.dismiss(locationToastId);
      // Long duration so user can read it — do NOT clear the code so they can retry
      toast.error(error.message, { duration: 7000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleCheckIn(code, lectureId);
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-emerald-50 rounded-2xl border border-emerald-100 animate-in zoom-in duration-300">
        <CheckCircle2 size={64} className="text-emerald-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">You're checked in!</h2>
        <p className="text-slate-500 mt-2">Your attendance has been recorded.</p>
        <p className="text-sm text-slate-400 mt-6">Redirecting to dashboard…</p>
      </div>
    );
  }

  // ── Main form — ALWAYS rendered after success check ─────────────────────────
  // No more dead-end "No Code Found" screen. Whether the student arrived via
  // QR or manually, they always see the form and can retry after any error.
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <KeyRound size={24} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Class Check-in</h2>
        <p className="text-slate-500 mt-2 text-sm">
          {urlCode
            ? "Verifying your QR code and location…"
            : "Scan the QR code on the board or enter the 4-digit code below."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 text-center uppercase tracking-wider">
            4-Digit Code
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="0000"
            className="w-full text-center text-4xl tracking-[0.3em] font-mono py-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none disabled:opacity-50"
            disabled={isSubmitting}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || code.length < 4}
          className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-300 text-white font-semibold py-4 rounded-xl transition flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Checking in…
            </>
          ) : (
            "Mark Attendance"
          )}
        </button>
      </form>
    </div>
  );
}

export default function StudentAttendanceMarkPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="animate-pulse flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-indigo-400 animate-bounce" />
            Loading…
          </div>
        }
      >
        <CheckInForm />
      </Suspense>
    </div>
  );
}