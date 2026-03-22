// src/app/(auth)/login/page.js
"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

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
    } else {
      toast.success("Login successful!");
      
      // Fetch the session to determine the user's role
      const session = await getSession();
      const role = session?.user?.role?.toLowerCase() || "student";
      
      // Redirect to their specific dashboard
      router.push(`/${role}`);
      router.refresh(); 
    }
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
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                {...register("email", { required: "Email is required" })}
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition"
                placeholder="user@tuk.ac.ke"
              />
              {errors.email && <span className="text-rose-500 text-xs mt-1 font-medium">{errors.email.message}</span>}
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                {...register("password", { required: "Password is required" })}
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition"
                placeholder="••••••••"
              />
              {errors.password && <span className="text-rose-500 text-xs mt-1 font-medium">{errors.password.message}</span>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 transition shadow-md"
            >
              {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}