"use client";

import { useState } from "react";
import Link from "next/link";
import { QrCode, ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { requestPasswordReset } from "@/actions/auth";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSuccess(true);
      toast.success("Password reset instructions sent");
    } catch (err) {
      toast.error("Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border border-slate-200/80 rounded-3xl bg-white">
        <CardHeader className="space-y-3 items-center text-center pb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-md shadow-primary/20">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900">Reset Password</CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Enter your registered email address and we&apos;ll send you a password recovery link.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {success ? (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <div>
                <p className="font-bold text-emerald-900 text-sm">Check your inbox</p>
                <p className="text-xs text-emerald-700 mt-1">
                  We have sent a secure password reset link to <span className="font-semibold">{email}</span>.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                  Account Email
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 rounded-xl bg-slate-50/50"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-11 rounded-xl font-bold mt-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending Link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex justify-center text-xs text-slate-500 border-t border-slate-100 pt-4">
          <Link href="/login" className="flex items-center gap-1.5 font-semibold text-primary hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
