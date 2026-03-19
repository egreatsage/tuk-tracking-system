"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { UserPlus, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

function InviteForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({ name: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center p-6">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Invalid Invite Link</h2>
        <p className="text-sm text-slate-500 mb-6">This link is missing a secure token or has been formatted incorrectly.</p>
        <Link href="/login" className="text-sky-600 hover:underline font-medium text-sm">
          Return to Login
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/users/parent/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: formData.name,
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      setIsSuccess(true);
      toast.success("Account created successfully!");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center p-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Registration Complete!</h2>
        <p className="text-sm text-slate-500 mb-6">Your parent account has been created and securely linked to your child's profile.</p>
        <button
          onClick={() => router.push('/login')}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl transition"
        >
          Proceed to Login <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-sky-200">
          <UserPlus size={24} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Parent Registration</h2>
        <p className="text-sm text-slate-500 mt-1">Create your account to view your child's academic progress.</p>
      </div>

      <div className="bg-sky-50 border border-sky-200 p-3 rounded-lg flex items-start gap-3 mb-4">
        <ShieldCheck size={18} className="text-sky-600 shrink-0 mt-0.5" />
        <p className="text-xs text-sky-800 leading-relaxed">
          Your email address is securely attached to this invite. If you already have an account, setting a new password here will simply link this student to your existing dashboard.
        </p>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
        <input
          type="text"
          placeholder="e.g. John Doe"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-300 outline-none transition"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Create Password</label>
        <input
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          minLength={6}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-300 outline-none transition"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-semibold py-2.5 rounded-xl transition mt-2 flex justify-center items-center h-[44px]"
      >
        {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Complete Registration"}
      </button>
    </form>
  );
}

// Wrap the component in Suspense as required by Next.js when using useSearchParams
export default function InvitePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <Suspense fallback={
          <div className="h-64 flex items-center justify-center">
            <span className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
          </div>
        }>
          <InviteForm />
        </Suspense>
      </div>
    </div>
  );
}