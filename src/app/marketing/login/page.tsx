"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QrCode, Lock, Mail, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession, signIn } from "next-auth/react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (password.length < 8 || password.length > 128) {
      setError("Password must be between 8 and 128 characters.");
      setLoading(false);
      return;
    }

    try {
      const res = await signIn("credentials", {
        email: trimmedEmail,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password. Please verify your credentials.");
        toast.error("Login failed");
      } else {
        const session = await getSession();
        const role = (session?.user as any)?.role;

        toast.success("Login successful!");

        if (role === "admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }

        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border border-slate-200/80 rounded-3xl bg-white">
        <CardHeader className="space-y-3 items-center text-center pb-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-md shadow-primary/20">
            <QrCode className="h-7 w-7" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900">Welcome to ReviewTap</CardTitle>
            <CardDescription className="text-sm mt-1 text-slate-500">
              Sign in to manage your reviews, staff, and QR codes
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium leading-relaxed">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                Email Address / Login ID
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <Input
                  id="email"
                  type="email"
                  placeholder="owner@yourbusiness.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-slate-50/50 border-slate-200"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 h-11 rounded-xl bg-slate-50/50 border-slate-200"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl mt-2 font-bold shadow-md shadow-primary/20 text-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing In...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Demo Credentials helper */}
          <div className="mt-6 p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-slate-600 space-y-1">
            <p className="font-bold text-blue-900">Demo Accounts (from Seed):</p>
            <p><strong>Owner:</strong> rahul@cafedelight.com / owner123</p>
            <p><strong>Admin:</strong> admin@reviewtap.in / admin123</p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center text-xs text-slate-500 border-t border-slate-100 pt-4">
          <p>
            Need a ReviewTap account?{" "}
            <Link href="/contact" className="text-primary font-bold hover:underline">
              Contact Sales
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
