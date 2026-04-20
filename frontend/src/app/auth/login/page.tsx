"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, Globe, AlertCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { toast } from "react-hot-toast";

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("auth/login", formData);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success(`Welcome back, ${data.user.name}!`);
      
      if (data.user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const toastId = toast.loading("Initializing Google Auth...");
    
    try {
      // In a real app, you'd use @react-oauth/google or Firebase
      // Here we simulate the popup/callback flow for a premium demo experience
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockGoogleData = {
        email: "student.demo@gmail.com",
        name: "Demo Student",
        googleId: "google_123456789"
      };

      const { data } = await api.post("auth/google-login", mockGoogleData);
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      toast.success(`Authenticated as ${data.user.name}`, { id: toastId });
      
      if (data.user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Google Auth Protocol failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(at_top_right,hsla(263,90%,64%,0.1),transparent_50%)]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel w-full max-w-md p-10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8b5cf6] via-[#d946ef] to-[#0ea5e9]" />
        
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black gradient-text mb-3">Welcome Back</h2>
          <p className="text-gray-500 font-medium">Secure portal to your digital future</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400 ml-1 uppercase tracking-widest">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="email" 
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-gray-700"
                placeholder="you@pioneer.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400 ml-1 uppercase tracking-widest">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-gray-700"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-indigo-400 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-5 flex items-center justify-center gap-3 text-lg font-black uppercase tracking-widest mt-4"
          >
            {loading ? "Decrypting..." : (
              <>
                Sign In <LogIn className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10">
          <div className="relative flex items-center justify-center mb-8">
            <div className="border-t border-white/5 w-full" />
            <span className="bg-[#050505] px-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 absolute">Or continue with</span>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full btn-secondary py-4 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest transition-all hover:bg-white/10 group disabled:opacity-50"
          >
            <Globe className="w-4 h-4 text-primary group-hover:rotate-12 transition-transform" /> 
            {loading ? "Authenticating..." : "Continue with Google"}
          </button>
        </div>

        <p className="mt-10 text-center text-gray-500 text-sm font-medium">
          New to the frontier?{" "}
          <Link href="/auth/register" className="text-indigo-400 hover:text-indigo-300 font-black transition-colors underline-offset-4 hover:underline">
            Register Account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
