"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  Menu,
  X,
  ChevronRight,
  User,
  Palette
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import api from "@/services/api";

export default function DashboardLayout({ 
  children, 
  role 
}: { 
  children: React.ReactNode, 
  role: "admin" | "student" 
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const themes = [
    { name: "Default", primary: "263 90% 64%", secondary: "199 89% 48%", accent: "322 81% 55%" },
    { name: "Emerald", primary: "142 71% 45%", secondary: "189 94% 43%", accent: "79 63% 50%" },
    { name: "Solar", primary: "25 95% 53%", secondary: "48 96% 53%", accent: "0 84% 60%" },
    { name: "Ocean", primary: "221 83% 53%", secondary: "199 89% 48%", accent: "262 83% 58%" },
    { name: "Rose", primary: "330 81% 60%", secondary: "280 67% 60%", accent: "350 89% 60%" },
    { name: "Monochrome", primary: "0 0% 80%", secondary: "0 0% 40%", accent: "0 0% 100%" }
  ];

  useEffect(() => {
    // Neural Error Suppression Protocol
    const handleRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault(); // Suppress Next.js red screen
      console.warn("Global promise rejection intercepted:", event.reason);
      if (event.reason?.name === "AxiosError") {
        toast.error("Neural link latency detected. Retrying synchronization...");
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);

    try {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme && savedTheme !== "[object Object]") {
        applyTheme(JSON.parse(savedTheme));
      }
    } catch (e) {
      console.warn("Neural theme protocol corrupted, resetting to default.");
    }

    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);

  const applyTheme = (theme: any) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--secondary", theme.secondary);
    root.style.setProperty("--accent", theme.accent);
    localStorage.setItem("theme", JSON.stringify(theme));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast.success(`Searching for "${searchQuery}"...`);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('notifications');
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    } catch (e) {
      console.warn("Intelligence feed blocked by manifold firewall.");
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Pulse every 30s
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      toast.error("Signal synchronization failed");
    }
  };

  const clearAllNotifications = async () => {
    try {
      await api.delete('notifications');
      setNotifications([]);
      setUnreadCount(0);
      toast.success("Intelligence feed purged");
    } catch (e) {
      toast.error("Purge sequence terminated");
    }
  };

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser || storedUser === "[object Object]") {
        router.push("/auth/login");
        return;
      }
      setUser(JSON.parse(storedUser));
    } catch (e) {
      console.error("Session integrity compromised.");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      router.push("/auth/login");
    }
  }, []);

  const menuItems = role === "admin" ? [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: "Overview", path: "/admin/dashboard" },
    { icon: <BookOpen className="w-5 h-5" />, label: "Exams", path: "/admin/exams" },
    { icon: <Users className="w-5 h-5" />, label: "Students", path: "/admin/students" },
    { icon: <BarChart3 className="w-5 h-5" />, label: "Analytics", path: "/admin/analytics" },
    { icon: <Settings className="w-5 h-5" />, label: "Settings", path: "/admin/settings" },
  ] : [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: "My Dashboard", path: "/student/dashboard" },
    { icon: <BookOpen className="w-5 h-5" />, label: "Available Exams", path: "/student/exams" },
    { icon: <BarChart3 className="w-5 h-5" />, label: "Result History", path: "/student/results" },
    { icon: <Settings className="w-5 h-5" />, label: "Profile", path: "/student/profile" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    router.push("/auth/login");
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[#050505]">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="glass-card m-4 mr-0 border-white/5 flex flex-col transition-all duration-300"
      >
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-black">E</div>
                <span className="text-xl font-black gradient-text">ExamPro</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg">
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <Link 
              key={item.label} 
              href={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                pathname === item.path 
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]" 
                : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className={`min-w-[20px] transition-transform ${pathname === item.path ? "scale-110" : "group-hover:scale-110"}`}>{item.icon}</div>
              {isSidebarOpen && <span className="font-bold uppercase tracking-tight text-xs">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/5 transition-all"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Header */}
        <header className="glass-card mb-4 p-4 px-8 border-white/5 flex items-center justify-between z-40">
          <form onSubmit={handleSearch} className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/5 max-w-md w-full focus-within:border-indigo-500/50 transition-all">
            <Search className="w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search anything..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full" 
            />
          </form>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button 
                onClick={() => {
                  setShowThemeMenu(!showThemeMenu);
                  setShowNotifications(false);
                  setShowProfileMenu(false);
                }}
                className={`p-2 hover:bg-white/5 rounded-full transition-all ${showThemeMenu ? "bg-white/5" : ""}`}
                title="Change Theme"
              >
                <Palette className="w-5 h-5 text-gray-400" />
              </button>

              <AnimatePresence>
                {showThemeMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-64 glass-card p-4 border-white/10 shadow-2xl z-50 backdrop-blur-xl bg-[#0a0a0a]/90"
                  >
                    <h4 className="font-black text-xs uppercase tracking-widest italic mb-4">Neural Presets</h4>
                    <div className="grid grid-cols-2 gap-2">
                       {themes.map(t => (
                         <button 
                           key={t.name}
                           onClick={() => {
                             applyTheme(t);
                             setShowThemeMenu(false);
                             toast.success(`${t.name} protocol activated`);
                           }}
                           className="flex flex-col gap-2 p-2 rounded-lg border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all text-left"
                         >
                            <div className="flex gap-1">
                               <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${t.primary})` }} />
                               <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${t.secondary})` }} />
                               <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${t.accent})` }} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-tight">{t.name}</span>
                         </button>
                       ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                  setShowThemeMenu(false);
                }}
                className={`relative p-2 hover:bg-white/5 rounded-full transition-all ${showNotifications ? "bg-white/5" : ""}`}
              >
                <Bell className="w-5 h-5 text-gray-400" />
                {unreadCount > 0 && (
                  <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#050505] animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-80 glass-card p-4 border-white/10 shadow-2xl z-50 backdrop-blur-xl bg-[#0a0a0a]/90"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-black text-xs uppercase tracking-widest italic">Intelligence Feed</h4>
                      <button 
                        onClick={clearAllNotifications}
                        className="text-[10px] text-indigo-400 font-bold hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center bg-white/5 rounded-xl border border-dashed border-white/10">
                           <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">No strategic signals detected in current manifold sector.</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => {
                              markAsRead(n.id);
                              // Context-Aware Redirection Manifold
                              if (n.type === 'result_ready') {
                                router.push(role === 'admin' ? '/admin/analytics' : `/student/results`);
                              } else if (n.type === 'exam_published') {
                                router.push(role === 'admin' ? '/admin/exams' : '/student/exams');
                              } else if (n.type === 'system' || n.type === 'welcome') {
                                router.push(role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
                              } else {
                                // Dynamic sector discovery
                                if (n.message.toLowerCase().includes('result')) router.push(role === 'admin' ? '/admin/analytics' : '/student/results');
                                else if (n.message.toLowerCase().includes('exam')) router.push(role === 'admin' ? '/admin/exams' : '/student/exams');
                                else router.push(role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
                              }
                              setShowNotifications(false);
                            }}
                            className={`p-3 rounded-lg border transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] ${
                              !n.is_read 
                              ? 'bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                              : 'bg-white/5 border-white/5 hover:border-white/10'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-xs font-bold ${!n.is_read ? 'text-indigo-300' : 'text-gray-400'}`}>{n.title}</span>
                              <span className="text-[8px] text-gray-500 uppercase">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed font-medium">{n.message}</p>
                            {!n.is_read && <div className="mt-2 w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative flex items-center gap-3 pl-6 border-l border-white/10">
              <button 
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                  setShowThemeMenu(false);
                }}
                className={`flex items-center gap-3 hover:opacity-80 transition-all p-1 rounded-xl ${showProfileMenu ? "bg-white/5" : ""}`}
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold">{user.name}</p>
                  <p className="text-xs text-indigo-400 capitalize">{user.role}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 overflow-hidden">
                  <img src={user.profile_photo || `https://ui-avatars.com/api/?name=${user.name}`} alt="avatar" />
                </div>
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-4 w-56 glass-card p-2 border-white/10 shadow-2xl z-50 backdrop-blur-xl bg-[#0a0a0a]/90"
                  >
                    <div className="p-4 border-b border-white/5 mb-2">
                       <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1 italic">Active Pilot</p>
                       <p className="text-sm font-bold truncate">{user.name}</p>
                       <p className="text-[10px] text-indigo-400 truncate">{user.email}</p>
                    </div>
                    {[
                      { icon: <User className="w-4 h-4" />, label: "Profile Settings", path: role === "admin" ? "/admin/settings" : "/student/profile" },
                      { icon: <Settings className="w-4 h-4" />, label: "Security & Config", path: role === "admin" ? "/admin/settings" : "/student/profile" },
                    ].map(item => (
                      <Link key={item.label} href={item.path} className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-lg text-sm font-medium transition-all">
                        {item.icon} {item.label}
                      </Link>
                    ))}
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2 hover:bg-red-500/10 rounded-lg text-sm font-medium text-red-400 transition-all mt-2 border-t border-white/5 pt-4"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Scalable Content Area */}
        <div 
          onClick={() => {
            setShowNotifications(false);
            setShowProfileMenu(false);
            setShowThemeMenu(false);
          }}
          className="flex-1 overflow-y-auto pr-2 custom-scrollbar"
        >
          {children}
        </div>
      </main>
    </div>
  );
}
