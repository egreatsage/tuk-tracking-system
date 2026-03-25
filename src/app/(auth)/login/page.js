"use client";

import { useState, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const rawCallbackUrl = searchParams.get("callbackUrl");
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
    const session = await getSession();
    const role = session?.user?.role?.toLowerCase() || "student";
    const destination = safeCallbackUrl || `/${role}`;
    router.push(destination);
    router.refresh();
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          padding: 1.5rem;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 2.5rem 2rem;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
        }

        .card-eyebrow {
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #6366f1;
          margin-bottom: 0.5rem;
        }

        .card-title {
          font-size: 1.65rem;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.01em;
          margin-bottom: 0.35rem;
          line-height: 1.2;
        }

        .card-sub {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 2rem;
          line-height: 1.5;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
          margin-bottom: 1.5rem;
        }

        .field-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #374151;
          margin-bottom: 0.4rem;
        }

        .input-wrap {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          display: flex;
          align-items: center;
        }

        .field-input {
          width: 100%;
          padding: 0.8rem 1rem 0.8rem 2.6rem;
          background: #f9fafb;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-size: 0.9rem;
          color: #111827;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }

        .field-input::placeholder { color: #c4c9d4; }

        .field-input:focus {
          border-color: #6366f1;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }

        .field-input.has-toggle {
          padding-right: 3rem;
        }

        .field-error {
          display: block;
          font-size: 0.75rem;
          color: #ef4444;
          font-weight: 500;
          margin-top: 0.3rem;
          padding-left: 0.2rem;
        }

        .toggle-btn {
          position: absolute;
          right: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          display: flex;
          align-items: center;
          padding: 0.2rem;
          border-radius: 6px;
          transition: color 0.15s;
        }

        .toggle-btn:hover { color: #6366f1; }

        .submit-btn {
          width: 100%;
          padding: 0.85rem 1.5rem;
          background: #111827;
          color: #fff;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 2px 10px rgba(17,24,39,0.18);
        }

        .submit-btn:hover:not(:disabled) {
          background: #1e1b4b;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(99,102,241,0.25);
        }

        .submit-btn:active:not(:disabled) { transform: translateY(0); }

        .submit-btn:disabled {
          background: #d1d5db;
          cursor: not-allowed;
          box-shadow: none;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.5rem 0;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }

        .divider-text {
          font-size: 0.7rem;
          color: #9ca3af;
          font-weight: 500;
          letter-spacing: 0.08em;
        }

        .help-text {
          text-align: center;
          font-size: 0.8rem;
          color: #9ca3af;
        }

        .help-text a {
          color: #6366f1;
          font-weight: 600;
          text-decoration: none;
        }

        .help-text a:hover { text-decoration: underline; }
      `}</style>

      <div className="login-root">
        <div className="login-card">
          
          <h2 className="card-title">Sign in to your account</h2>
         

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="field-group">
              {/* EMAIL */}
              <div>
                <label className="field-label">Email Address</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                  </span>
                  <input
                    type="email"
                    className="field-input"
                    placeholder="user@tuk.ac.ke"
                    {...register("email", { required: "Email is required" })}
                  />
                </div>
                {errors.email && <span className="field-error">{errors.email.message}</span>}
              </div>

              {/* PASSWORD */}
              <div>
                <label className="field-label">Password</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="field-input has-toggle"
                    placeholder="••••••••"
                    {...register("password", { required: "Password is required" })}
                  />
                  <button
                    type="button"
                    className="toggle-btn"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                        <line x1="2" y1="2" x2="22" y2="22"/>
                      </svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <span className="field-error">{errors.password.message}</span>}
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? (
                <span className="spinner" />
              ) : (
                <>
                  Sign In
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">TUK PORTAL</span>
            <div className="divider-line" />
          </div>

          <p className="help-text">
            Having trouble? <a href="mailto:support@tuk.ac.ke">Contact support</a>
          </p>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6" }}>
          <span style={{ width: 32, height: 32, border: "3px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "block" }} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}