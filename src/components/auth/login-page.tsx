"use client";

import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/components/auth/auth-provider";

export function LoginPage() {
  const { error, isLoggingIn, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!email.trim() || !password) {
      setFormError("Email and password are required.");
      return;
    }

    try {
      await login({
        email_id: email.trim().toLowerCase(),
        password,
      });
      router.replace("/");
    } catch (loginError) {
      setFormError(loginError instanceof Error ? loginError.message : "Unable to log in");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F5F7] px-4 py-10 text-[#171717]">
      <section className="w-full max-w-[420px]">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-md bg-black text-white">
            <ShieldCheck size={19} aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg leading-none font-bold">Cost Optimizer Admin</p>
            <p className="mt-1 text-xs font-semibold text-[#86868B]">
              Enterprise Cost Optimizer console
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-black/[0.08] bg-white p-8 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
          <h1 className="text-2xl leading-tight font-bold">Login</h1>
          <p className="mt-3 text-sm leading-6 font-semibold text-[#555555]">
            Nice seeing you again, please log in to access your account.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label className="block">
              <span className="mb-2 block text-[11px] font-bold tracking-[0.12em] text-[#86868B] uppercase">
                Email
              </span>
              <input
                autoComplete="email"
                className="h-10 w-full rounded-md border border-black/[0.1] bg-white px-3 text-sm font-semibold outline-none placeholder:text-[#A1A1AA] focus:border-[#007AFF]"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter Your Email ID"
                type="email"
                value={email}
              />
            </label>

            <div>
              <label
                className="mb-2 block text-[11px] font-bold tracking-[0.12em] text-[#86868B] uppercase"
                htmlFor="admin-password"
              >
                Password
              </label>
              <div className="relative">
                <input
                  autoComplete="current-password"
                  className="h-10 w-full rounded-md border border-black/[0.1] bg-white px-3 pr-10 text-sm font-semibold outline-none placeholder:text-[#A1A1AA] focus:border-[#007AFF]"
                  id="admin-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter Your Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-[#86868B] transition hover:bg-black/[0.04] hover:text-[#171717]"
                  onClick={() => setShowPassword((currentValue) => !currentValue)}
                >
                  {showPassword ? (
                    <EyeOff size={16} aria-hidden="true" />
                  ) : (
                    <Eye size={16} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {formError || error ? (
              <p className="rounded-md bg-[#FEF2F2] px-3 py-2 text-xs font-semibold text-[#EF4444]">
                {formError || error}
              </p>
            ) : null}

            <button
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[#007AFF] px-4 text-sm font-bold text-white transition hover:bg-[#0069D9] disabled:cursor-not-allowed disabled:bg-[#A1A1AA]"
              disabled={isLoggingIn}
              type="submit"
            >
              {isLoggingIn ? "Logging in..." : "Log In"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
