// src/app/(auth)/login/page.js
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

    setIsLoading(false);

    if (result?.error) {
      toast.error("Invalid email or password", {
        style: {
          background: "#1a1a1a",
          color: "#f5f5f5",
          border: "1px solid #333",
          borderRadius: "10px",
          fontSize: "0.875rem",
          padding: "12px 16px",
        },
        iconTheme: { primary: "#ef4444", secondary: "#1a1a1a" },
      });
    } else {
      toast.success("Welcome back!", {
        style: {
          background: "#1a1a1a",
          color: "#f5f5f5",
          border: "1px solid #333",
          borderRadius: "10px",
          fontSize: "0.875rem",
          padding: "12px 16px",
        },
        iconTheme: { primary: "#22c55e", secondary: "#1a1a1a" },
      });
      router.push("/superadmin");
      router.refresh();
    }
  };

  return (
    <>
      {/* ── Toaster ── */}
      <Toaster position="top-right" reverseOrder={false} />

      <div className="login-root">
        {/* Left panel — branding */}
        <div className="login-panel-left">
          <div className="login-brand">
            <div className="login-logo">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="8" fill="white" fillOpacity="0.12" />
                <path d="M7 10l7-4 7 4v8l-7 4-7-4v-8z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                <circle cx="14" cy="14" r="2.5" fill="white" />
              </svg>
            </div>
            <span className="login-brand-name">TUK Tracker</span>
          </div>

          <div className="login-panel-content">
            <h1 className="login-panel-headline">
              Student progress,<br />
              <span className="login-panel-headline-accent">always in view.</span>
            </h1>
            <p className="login-panel-sub">
              Manage academic records, track performance,
              and generate reports — all from one place.
            </p>

            <div className="login-stats">
              {[
                { label: "Students", value: "4,200+" },
                { label: "Departments", value: "18" },
                { label: "Reports/mo", value: "650+" },
              ].map((s) => (
                <div key={s.label} className="login-stat">
                  <span className="login-stat-value">{s.value}</span>
                  <span className="login-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* decorative grid */}
          <div className="login-grid-overlay" aria-hidden="true" />
        </div>

        {/* Right panel — form */}
        <div className="login-panel-right">
          <div className="login-form-wrap">
            <div className="login-form-header">
              <h2 className="login-form-title">Sign in</h2>
              <p className="login-form-sub">Use your institutional credentials</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="login-form">
              {/* Email */}
              <div className="login-field">
                <label htmlFor="email" className="login-label">Email address</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@tuk.ac.ke"
                    className={`login-input${errors.email ? " login-input-error" : ""}`}
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email",
                      },
                    })}
                  />
                </div>
                {errors.email && (
                  <span className="login-error-msg">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    {errors.email.message}
                  </span>
                )}
              </div>

              {/* Password */}
              <div className="login-field">
                <label htmlFor="password" className="login-label">Password</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••••"
                    className={`login-input login-input-pw${errors.password ? " login-input-error" : ""}`}
                    {...register("password", { required: "Password is required" })}
                  />
                  <button
                    type="button"
                    className="login-pw-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <span className="login-error-msg">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    {errors.password.message}
                  </span>
                )}
              </div>

              {/* Forgot password */}
              <div className="login-forgot-row">
                <a href="#" className="login-forgot-link">Forgot password?</a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="login-btn"
              >
                {isLoading ? (
                  <>
                    <span className="login-spinner" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="login-footer-note">
              Technical University of Kenya &mdash; Academic Systems
            </p>
          </div>
        </div>
      </div>

      {/* ── Scoped styles ── */}
      <style jsx>{`
        /* ─── Layout ─── */
        .login-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--color-bg, #f8f9fc);
        }

        /* ─── Left panel ─── */
        .login-panel-left {
          position: relative;
          background: #111827;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 2.5rem;
          overflow: hidden;
        }

        .login-brand {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          animation: fadeUp 0.5s var(--ease-out, cubic-bezier(0.16,1,0.3,1)) both;
        }

        .login-logo {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-brand-name {
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.01em;
        }

        .login-panel-content {
          animation: fadeUp 0.55s var(--ease-out, cubic-bezier(0.16,1,0.3,1)) 0.1s both;
        }

        .login-panel-headline {
          font-size: clamp(1.75rem, 3vw, 2.5rem);
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
          letter-spacing: -0.025em;
          margin-bottom: 1rem;
        }

        .login-panel-headline-accent {
          color: #9ca3af;
        }

        .login-panel-sub {
          font-size: 0.9375rem;
          color: #6b7280;
          line-height: 1.65;
          max-width: 340px;
          margin-bottom: 2.5rem;
        }

        .login-stats {
          display: flex;
          gap: 2rem;
        }

        .login-stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .login-stat-value {
          font-size: 1.375rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
        }

        .login-stat-label {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }

        /* Subtle dot-grid overlay */
        .login-grid-overlay {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(#ffffff0a 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        /* ─── Right panel ─── */
        .login-panel-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
          background: var(--color-bg, #f8f9fc);
        }

        .login-form-wrap {
          width: 100%;
          max-width: 400px;
          animation: fadeUp 0.55s var(--ease-out, cubic-bezier(0.16,1,0.3,1)) 0.15s both;
        }

        .login-form-header {
          margin-bottom: 2rem;
        }

        .login-form-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--color-text, #0f172a);
          letter-spacing: -0.02em;
          margin-bottom: 0.375rem;
        }

        .login-form-sub {
          font-size: 0.9rem;
          color: var(--color-text-subtle, #94a3b8);
        }

        /* ─── Form elements ─── */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .login-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-text-muted, #475569);
          letter-spacing: 0.01em;
        }

        .login-input-wrap {
          position: relative;
        }

        .login-input-icon {
          position: absolute;
          left: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-subtle, #94a3b8);
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .login-input {
          width: 100%;
          padding: 0.6875rem 0.875rem 0.6875rem 2.75rem;
          background: #fff;
          border: 1.5px solid var(--color-border, #e2e8f0);
          border-radius: 10px;
          font-size: 0.9rem;
          color: var(--color-text, #0f172a);
          transition:
            border-color 150ms ease,
            box-shadow 150ms ease;
          outline: none;
        }

        .login-input::placeholder {
          color: var(--color-text-subtle, #94a3b8);
        }

        .login-input:focus {
          border-color: #374151;
          box-shadow: 0 0 0 3px rgba(55, 65, 81, 0.12);
        }

        .login-input-error {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
        }

        .login-input-pw {
          padding-right: 2.75rem;
        }

        .login-pw-toggle {
          position: absolute;
          right: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-subtle, #94a3b8);
          display: flex;
          align-items: center;
          padding: 0.25rem;
          border-radius: 4px;
          cursor: pointer;
          transition: color 150ms ease;
          background: none;
          border: none;
        }

        .login-pw-toggle:hover {
          color: var(--color-text-muted, #475569);
        }

        .login-error-msg {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.75rem;
          color: #ef4444;
          margin-top: 0.125rem;
        }

        .login-forgot-row {
          display: flex;
          justify-content: flex-end;
          margin-top: -0.5rem;
        }

        .login-forgot-link {
          font-size: 0.8125rem;
          color: var(--color-text-subtle, #94a3b8);
          text-decoration: none;
          transition: color 150ms ease;
        }

        .login-forgot-link:hover {
          color: var(--color-text-muted, #475569);
          text-decoration: none;
        }

        /* ─── Submit button ─── */
        .login-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: #111827;
          color: #fff;
          font-size: 0.9375rem;
          font-weight: 600;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          letter-spacing: -0.01em;
          margin-top: 0.25rem;
          transition:
            background 150ms ease,
            transform 150ms cubic-bezier(0.34,1.56,0.64,1),
            box-shadow 150ms ease;
        }

        .login-btn:hover:not(:disabled) {
          background: #1f2937;
          box-shadow: 0 4px 16px rgba(17, 24, 39, 0.25);
          transform: translateY(-1px);
        }

        .login-btn:active:not(:disabled) {
          transform: scale(0.98) translateY(0);
        }

        .login-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }

        .login-spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.65s linear infinite;
        }

        .login-footer-note {
          margin-top: 2rem;
          font-size: 0.75rem;
          color: var(--color-text-subtle, #94a3b8);
          text-align: center;
          letter-spacing: 0.01em;
        }

        /* ─── Keyframes ─── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ─── Responsive ─── */
        @media (max-width: 768px) {
          .login-root {
            grid-template-columns: 1fr;
          }

          .login-panel-left {
            display: none;
          }

          .login-panel-right {
            min-height: 100vh;
            padding: 2.5rem 1.25rem;
            align-items: flex-start;
            padding-top: 4rem;
          }
        }

        @media (max-width: 400px) {
          .login-input {
            font-size: 16px; /* prevents iOS zoom */
          }
        }
      `}</style>
    </>
  );
}