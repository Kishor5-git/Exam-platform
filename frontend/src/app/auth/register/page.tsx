"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, UserPlus, Briefcase, GraduationCap, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { toast } from "react-hot-toast";

export default function RegisterPage() {
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    role: "student" 
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("auth/register", formData);
      toast.success("Account created! Please log in.");
      router.push("/auth/login");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(at_top_right,hsla(322,81%,55%,0.05),transparent_50%)]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel w-full max-w-lg p-10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#d946ef] via-[#8b5cf6] to-[#0ea5e9]" />
        
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black gradient-text mb-3">Join the Future</h2>
          <p className="text-gray-500 font-medium">Create your credentials for the next-gen assessment suite</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button 
              type="button"
              onClick={() => setFormData({ ...formData, role: "student" })}
              className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all ${
                formData.role === "student" 
                ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]" 
                : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/10"
              }`}
            >
              <GraduationCap className={`w-8 h-8 ${formData.role === "student" ? "animate-bounce" : ""}`} />
              <span className="text-xs font-black uppercase tracking-widest">Student</span>
            </button>
            <button 
              type="button"
              onClick={() => setFormData({ ...formData, role: "admin" })}
              className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all ${
                formData.role === "admin" 
                ? "bg-purple-500/10 border-purple-500/50 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]" 
                : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/10"
              }`}
            >
              <Briefcase className={`w-8 h-8 ${formData.role === "admin" ? "animate-bounce" : ""}`} />
              <span className="text-xs font-black uppercase tracking-widest">Admin</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 ml-1 uppercase tracking-widest">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="text" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-gray-700 font-medium"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 ml-1 uppercase tracking-widest">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="email" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-gray-700 font-medium"
                  placeholder="you@pioneer.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 ml-1 uppercase tracking-widest">Security Password</label>
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
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-5 mt-6 flex items-center justify-center gap-3 text-lg font-black uppercase tracking-widest shadow-[0_0_30px_rgba(139,92,246,0.3)]"
          >
            {loading ? "Initializing..." : (
              <>
                Create Account <UserPlus className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="mt-10 text-center text-gray-500 text-sm font-medium">
          Already part of the network?{" "}
          <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-black transition-colors underline-offset-4 hover:underline">
            Identity Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
