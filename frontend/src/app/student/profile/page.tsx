"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  User, 
  Mail, 
  Lock, 
  ShieldCheck, 
  Trophy, 
  Star,
  CheckCircle,
  Save,
  Camera
} from "lucide-react";
import api from "@/services/api";
import { toast } from "react-hot-toast";

export default function StudentProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "student",
    profile_photo: "",
    created_at: ""
  });
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          api.get("auth/me"),
          api.get("stats/student")
        ]);
        setProfile(profileRes.data.user);
        setStats(statsRes.data);
      } catch (error) {
        toast.error("Failed to recover profile manifest.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("users/profile", { name: profile.name });
      
      // Synchronize local storage identity
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...storedUser, name: profile.name }));
      
      toast.success("Identity manifestation synchronized.");
    } catch (error) {
      toast.error("Profile synchronization failed.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpdate = () => {
    document.getElementById("profile-upload")?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Identity vector too large. Limit: 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        await api.put("users/profile", { profile_photo: base64 });
        setProfile(p => ({ ...p, profile_photo: base64 }));
        
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...storedUser, profile_photo: base64 }));
        
        toast.success("Identity manifestation synchronized.");
        window.location.reload();
      } catch (error) {
        toast.error("Identity synchronization failed.");
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="p-20 text-center animate-pulse font-black uppercase text-xs">Recovering Identity...</div>;

  return (
    <DashboardLayout role="student">
      <div className="max-w-6xl mx-auto space-y-10 pb-20">
        <div className="flex flex-col md:flex-row gap-10">
          <input 
            type="file" 
            id="profile-upload" 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
          />
          {/* Identity & Stats Sidebar */}
          <div className="w-full md:w-80 space-y-6">
            <div className="glass-panel p-8 text-center border-white/5 relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 p-1 mb-6 relative">
                     <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                        {profile.profile_photo ? (
                          <img src={profile.profile_photo} alt="Identity" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-12 h-12 text-gray-500" />
                        )}
                     </div>
                     <button 
                        onClick={handlePhotoUpdate}
                        className="absolute bottom-0 right-0 p-2 bg-indigo-500 rounded-lg shadow-lg hover:scale-110 transition-transform hover:shadow-indigo-500/50"
                     >
                        <Camera className="w-3 h-3 text-white" />
                     </button>
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tight">{profile.name}</h2>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Class Alpha Member</p>
                  <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase text-indigo-400">
                     <ShieldCheck className="w-3 h-3" /> Identity Verified
                  </div>
               </div>
            </div>

            <div className="glass-panel p-6 space-y-6">
               <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Mastery Overview</h3>
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="flex items-center gap-2 text-xs font-bold text-gray-400"><Trophy className="w-4 h-4 text-amber-500" /> Global Rank</span>
                     <span className="font-black text-white">{stats?.global_rank || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="flex items-center gap-2 text-xs font-bold text-gray-400"><Star className="w-4 h-4 text-indigo-400" /> Avg. Precision</span>
                     <span className="font-black text-white">{stats?.average_score || "0%"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="flex items-center gap-2 text-xs font-bold text-gray-400"><CheckCircle className="w-4 h-4 text-emerald-500" /> Compl. Ratio</span>
                     <span className="font-black text-white">{stats?.exams_completed || 0} Missions</span>
                  </div>
               </div>
            </div>
          </div>

          {/* Configuration Manifold */}
          <div className="flex-1 space-y-10">
            <section className="glass-panel p-8 border-white/5">
               <h2 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-tighter">
                  <User className="w-6 h-6 text-indigo-400" /> Personal Details
               </h2>
               <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Legal Name</label>
                     <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input 
                           type="text" 
                           value={profile.name}
                           onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                           className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3.5 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                           placeholder="Enter your full name"
                        />
                     </div>
                  </div>
                  <div className="space-y-3 opacity-60 cursor-not-allowed">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Identity Vector (Email)</label>
                     <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input 
                           type="email" 
                           value={profile.email}
                           readOnly
                           className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3.5 outline-none font-bold text-sm"
                        />
                     </div>
                  </div>
                  <div className="col-span-full pt-4 border-t border-white/5 flex justify-end">
                     <button 
                        disabled={saving}
                        className="btn-primary px-8 py-3 flex items-center gap-3"
                     >
                        {saving ? "Synchronizing..." : <><Save className="w-4 h-4" /> Save Configuration</>}
                     </button>
                  </div>
               </form>
            </section>

            <section className="glass-panel p-8 border-white/5">
               <h2 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-tighter">
                  <Lock className="w-6 h-6 text-amber-400" /> Security Protocol
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">New Access Key</label>
                     <input 
                        type="password" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 focus:border-amber-500 outline-none transition-all font-bold text-sm"
                        placeholder="••••••••"
                     />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Confirm Access Key</label>
                     <input 
                        type="password" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 focus:border-amber-500 outline-none transition-all font-bold text-sm"
                        placeholder="••••••••"
                     />
                  </div>
                  <div className="col-span-full pt-4">
                     <button className="w-full py-4 rounded-xl border-2 border-dashed border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/5 transition-all text-amber-500 font-black uppercase text-xs tracking-widest">
                        Initiate Key Rotation Protocol
                     </button>
                  </div>
               </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
