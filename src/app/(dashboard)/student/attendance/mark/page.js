// src/app/(dashboard)/student/attendance/mark/page.js
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { CheckCircle2, KeyRound, AlertCircle } from "lucide-react";

function CheckInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const urlCode = searchParams.get("code");
  const lectureId = searchParams.get("lectureId");

  // Auto-submit if coming from a QR code scan
  useEffect(() => {
    if (urlCode && !success && !isSubmitting) {
      setCode(urlCode);
      handleCheckIn(urlCode, lectureId);
    }
  }, [urlCode, lectureId]);

  const handleCheckIn = async (otpCode, id = null) => {
    if (!otpCode || otpCode.length < 4) {
      toast.error("Please enter a valid 4-digit code");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/student/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otpCode, lectureId: id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to mark attendance");
      }

      setSuccess(true);
      toast.success(data.message);
      
      // Redirect back to dashboard after 3 seconds
      setTimeout(() => {
        router.push("/student");
      }, 3000);

    } catch (error) {
      toast.error(error.message);
      setCode(""); // Clear the input so they can try again
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleCheckIn(code);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-emerald-50 rounded-2xl border border-emerald-100 animate-in zoom-in duration-300">
        <CheckCircle2 size={64} className="text-emerald-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">You're checked in!</h2>
        <p className="text-slate-500 mt-2">Your attendance has been recorded.</p>
        <p className="text-sm text-slate-400 mt-6">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <KeyRound size={24} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Class Check-in</h2>
        <p className="text-slate-500 mt-2 text-sm">
          Scan the QR code on the board or manually enter the 4-digit OTP code below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 text-center uppercase tracking-wider">
            Enter 4-Digit Code
          </label>
          <input
            type="text"
            maxLength={4}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} // Only allow numbers
            placeholder="0000"
            className="w-full text-center text-4xl tracking-[0.3em] font-mono py-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none"
            disabled={isSubmitting || urlCode} // Disable if auto-submitting from QR
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || code.length < 4}
          className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-300 text-white font-semibold py-4 rounded-xl transition flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
      {/* Suspense is required when using useSearchParams in Next.js App Router */}
      <Suspense fallback={<div className="animate-pulse flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-indigo-400 animate-bounce"/> Loading...</div>}>
        <CheckInForm />
      </Suspense>
    </div>
  );
}