"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Settings, Shield, Bell, User, Database, Globe } from "lucide-react";
import { toast } from "react-hot-toast";

export default function SettingsPage() {
  const saveSettings = () => {
    toast.success("System configurations updated!");
  };

  return (
    <DashboardLayout role="admin">
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-black mb-2 uppercase tracking-tight">System <span className="gradient-text">Settings</span></h1>
          <p className="text-gray-400">Configure global parameters and security protocols.</p>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-8 border-white/5 space-y-6">
            <h3 className="font-bold flex items-center gap-2 uppercase tracking-tight">
              <Shield className="w-5 h-5 text-indigo-400" /> Security Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase">Session Timeout (min)</label>
                <input type="number" defaultValue={60} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase">Max Login Attempts</label>
                <input type="number" defaultValue={5} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors" />
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
               <div>
                  <p className="font-bold">Two-Factor Authentication</p>
                  <p className="text-xs text-gray-500">Require 2FA for all administrative accounts.</p>
               </div>
               <div className="w-12 h-6 bg-indigo-500 rounded-full relative p-1 cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full ml-auto" />
               </div>
            </div>
          </div>

          <div className="glass-card p-8 border-white/5 space-y-6">
            <h3 className="font-bold flex items-center gap-2 uppercase tracking-tight">
              <Database className="w-5 h-5 text-indigo-400" /> Data Management
            </h3>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
               <div className="flex items-center gap-4">
                  <Globe className="w-6 h-6 text-gray-500" />
                  <div>
                    <p className="font-bold text-sm">Automatic Backups</p>
                    <p className="text-[10px] text-gray-500">Every 24 hours to secure cloud storage.</p>
                  </div>
               </div>
               <button className="text-xs font-bold text-indigo-400 hover:underline">Configure</button>
            </div>
          </div>

          <div className="flex justify-end gap-4 pb-10">
             <button className="btn-secondary px-8 py-3">Discard Changes</button>
             <button onClick={saveSettings} className="btn-primary px-10 py-3">Save Protocols</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
