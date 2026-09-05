"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Lock, CheckCircle2, Loader2 } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token || !email) {
    return (
      <Card className="w-full max-w-md shadow-xl border border-slate-200/80 rounded-3xl bg-white">
        <CardHeader className="space-y-3 items-center text-center pb-2">
          <CardTitle className="text-2xl font-bold text-slate-900">Invalid reset link</CardTitle>
          <CardDescription className="text-sm mt-1 text-slate-500">
            This password reset link is incomplete. Please request a new one.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Button asChild className="w-full h-11 rounded-xl font-bold">
            <Link href="/forgot-password">Request new link</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8 || password.length > 128) {
      setError("Password must be between 8 and 128 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({ token, email, password });
      if (!res.success) {
        setError(res.error || "Failed to reset password.");
        return;
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Card className="w-full max-w-md shadow-xl border border-slate-200/80 rounded-3xl bg-white">
        <CardHeader className="space-y-3 items-center text-center pb-2">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <CardTitle className="text-2xl font-bold text-slate-900">Password updated</CardTitle>
          <CardDescription className="text-sm mt-1 text-slate-500">
            You can now sign in with your new password.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Button asChild className="w-full h-11 rounded-xl font-bold">
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xl border border-slate-200/80 rounded-3xl bg-white">
      <CardHeader className="space-y-3 items-center text-center pb-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-md shadow-primary/20">
          <QrCode className="h-7 w-7" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-slate-900">Set a new password</CardTitle>
          <CardDescription className="text-sm mt-1 text-slate-500">
            For {email}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200/80 p-3 text-xs text-red-700 space-y-2">
              <p>{error}</p>
              <Link href="/forgot-password" className="font-semibold underline">
                Request a new link
              </Link>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
              New password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="rounded-xl pl-9"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm" className="text-xs font-semibold text-slate-700">
              Confirm new password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your new password"
                className="rounded-xl pl-9"
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl font-bold">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Saving…" : "Reset Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[85vh] bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-center text-sm text-slate-500">Loading…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
