"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, AlertCircle, Loader2, LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyEmailExists } from "@/actions/auth";

export default function LoginPage() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

    setError("");
    setLoading(true);

    try {
      // Step 1: Check if email exists in our database
      const { exists } = await verifyEmailExists(email);
      if (!exists) {
        setError("Invalid email address or password.");
        setLoading(false);
        return;
      }

      // Step 2: Authenticate via Clerk
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        // Step 3: Show preloader, set temp cookie, set session, redirect
        setRedirecting(true);
        document.cookie = `_temp_bp=${encodeURIComponent(password)};path=/;max-age=60;SameSite=Lax`;
        await setActive({ session: result.createdSessionId });
        router.push("/api/auth/redirect");
      } else {
        // Handle other statuses (e.g. 2FA) if needed
        setError("Authentication failed. Please try again.");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ message?: string; longMessage?: string }> };
      const message = clerkErr.errors?.[0]?.longMessage || clerkErr.errors?.[0]?.message;

      // Don't reveal whether the email exists — generic error
      if (message?.includes("password") || message?.includes("credentials") || message?.includes("identifier")) {
        setError("Invalid email address or password.");
      } else {
        setError("Invalid email address or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fullscreen preloader after successful auth
  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex flex-col items-center gap-6"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <motion.div
              className="absolute -inset-3 rounded-2xl border-2 border-blue-400/30"
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            <p className="text-white font-medium text-lg">Preparing your dashboard...</p>
            <p className="text-gray-400 text-sm">Please wait a moment</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">System Portal</h1>
          <p className="text-gray-400">Sign in to access your dashboard</p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <form
            onSubmit={handleSubmit}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5"
          >
            <div className="text-center mb-2">
              <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
              <p className="text-sm text-gray-500 mt-1">Enter your credentials to continue</p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full" size="lg" disabled={loading || !isLoaded}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="text-center text-gray-500 text-sm mt-8"
        >
          Secure enterprise access portal
        </motion.p>
      </motion.div>
    </div>
  );
}
