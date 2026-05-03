"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  sendPasswordReset,
} from "@/lib/firebase/auth";
import { setAuthCookie } from "@/lib/firebase/session";
import { useStoredTheme } from "@/hooks/useStoredTheme";
import { cn } from "@/lib/utils";

type Mode = "signin" | "register" | "reset";

const AUTH_ERRORS: Record<string, string> = {
  "auth/invalid-credential":      "Incorrect email or password.",
  "auth/wrong-password":          "Incorrect password.",
  "auth/user-not-found":          "No account found with this email.",
  "auth/email-already-in-use":    "An account with this email already exists.",
  "auth/weak-password":           "Password must be at least 6 characters.",
  "auth/invalid-email":           "Please enter a valid email address.",
  "auth/too-many-requests":       "Too many attempts — try again later.",
  "auth/popup-closed-by-user":    "Sign-in popup was closed.",
  "auth/network-request-failed":  "Network error — check your connection.",
};

function friendlyError(code: string): string {
  return AUTH_ERRORS[code] ?? "Something went wrong. Please try again.";
}

function LoginForm() {
  const { theme, toggleTheme } = useStoredTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setError(null);
    setInfo(null);
  }

  function switchMode(next: Mode) {
    reset();
    setMode(next);
  }

  async function handleGoogleSignIn() {
    reset();
    setLoading(true);
    try {
      await signInWithGoogle();
      setAuthCookie();
      router.replace(redirectTo);
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? "";
      setError(friendlyError(code));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      if (mode === "reset") {
        await sendPasswordReset(email.trim());
        setInfo("Password reset email sent — check your inbox.");
        setMode("signin");
        return;
      }
      if (mode === "register") {
        await registerWithEmail(email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
      setAuthCookie();
      router.replace(redirectTo);
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? "";
      setError(friendlyError(code));
    } finally {
      setLoading(false);
    }
  }

  const title   = mode === "signin" ? "Sign in" : mode === "register" ? "Create account" : "Reset password";
  const submit  = mode === "signin" ? "Sign in" : mode === "register" ? "Create account" : "Send reset email";

  return (
    <div
      className={cn(
        theme === "dark" && "dark",
        "min-h-svh text-foreground",
      )}
    >
      <div className="min-h-svh w-full bg-background font-sans text-sm leading-normal flex items-center justify-center p-4">
        <button
          type="button"
          className="fixed top-4 right-4 z-10 flex size-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-card-foreground shadow-sm hover:bg-muted"
          title={theme === "dark" ? "Light mode" : "Dark mode"}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          onClick={toggleTheme}
        >
          {theme === "dark" ? (
            <Moon className="size-4" strokeWidth={2} />
          ) : (
            <Sun className="size-4" strokeWidth={2} />
          )}
        </button>
        <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="size-8 shrink-0 rounded-lg bg-primary flex items-center justify-center">
            <Activity className="size-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-base font-bold text-foreground">HealthTrack SG</span>
        </div>

        <div className="rounded-xl bg-card ring-1 ring-foreground/10 p-6 flex flex-col gap-5">
          <h1 className="text-base font-semibold text-foreground">{title}</h1>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {info && (
            <Alert>
              <AlertDescription>{info}</AlertDescription>
            </Alert>
          )}

          {/* Google button — only on signin / register */}
          {mode !== "reset" && (
            <>
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          {/* Email / password form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {mode !== "reset" && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => switchMode("reset")}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}

            <Button type="submit" size="lg" className="w-full mt-1" disabled={loading}>
              {loading ? "Please wait…" : submit}
            </Button>
          </form>

          {/* Mode toggles */}
          <div className="text-center text-xs text-muted-foreground">
            {mode === "signin" && (
              <>
                No account?{" "}
                <button
                  type="button"
                  className="text-foreground hover:underline underline-offset-3"
                  onClick={() => switchMode("register")}
                >
                  Create one
                </button>
              </>
            )}
            {mode === "register" && (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-foreground hover:underline underline-offset-3"
                  onClick={() => switchMode("signin")}
                >
                  Sign in
                </button>
              </>
            )}
            {mode === "reset" && (
              <button
                type="button"
                className="text-foreground hover:underline underline-offset-3"
                onClick={() => switchMode("signin")}
              >
                Back to sign in
              </button>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
