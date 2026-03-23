// src/app/(auth)/login/page.js
"use client";

import { useState, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

/**
 * FIX 2: Lost QR URL after login
 *
 * Problem: When an unauthenticated student scans the QR code, the middleware
 * redirects them to /login?callbackUrl=/student/attendance/mark?lectureId=X&code=Y
 *
 * The old onSubmit ignored callbackUrl entirely — it always pushed to /${role}.
 * So the lectureId and code were thrown away after login.
 *
 * Fix: Read callbackUrl from the search params and redirect to it after a
 * successful login instead of the generic dashboard URL.
 *
 * IMPORTANT: We validate the callbackUrl to only allow relative paths,
 * preventing open-redirect attacks.
 */
function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Grab the callbackUrl the middleware stored (e.g. /student/attendance/mark?lectureId=...&code=...)
  const rawCallbackUrl = searchParams.get("callbackUrl");

  /**
   * Security: only honour relative paths — never redirect to an external domain.
   * If it's absent or looks external, fall back to null and we'll use the role.
   */
  const safeCallbackUrl =
    rawCallbackUrl && rawCallbackUrl.startsWith("/") ? rawCallbackUrl : null;

  const onSubmit = async (data) => {
    setIsLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
    });

    if (result?.error) {
      toast.error("Invalid email or password!");
      setIsLoading(false);
      return;
    }

    toast.success("Login successful!");

    // Fetch the session to get the user's role
    const session = await getSession();
    const role = session?.user?.role?.toLowerCase() || "student";

    // ✅ KEY FIX: if there's a safe callbackUrl (e.g. the QR scan URL), go there.
    // Otherwise fall back to the role dashboard.
    const destination = safeCallbackUrl || `/${role}`;
    router.push(destination);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div>
          <h2 className="mt-2 text-center text-3xl font-black text-slate-900 tracking-tight">
            TUK Tracking System
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500 font-medium">
            Sign in to your account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                {...register("email", { required: "Email is required" })}
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition"
                placeholder="user@tuk.ac.ke"
              />
              {errors.email && (
                <span className="text-rose-500 text-xs mt-1 font-medium">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                {...register("password", { required: "Password is required" })}
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition"
                placeholder="••••••••"
              />
              {errors.password && (
                <span className="text-rose-500 text-xs mt-1 font-medium">
                  {errors.password.message}
                </span>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 transition shadow-md"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Sign in"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// useSearchParams requires Suspense in the App Router
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}