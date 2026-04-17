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
  User
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

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

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast.success(`Searching for "${searchQuery}"...`);
    }
  };

  const notifications = [
    { id: 1, title: "New Submission", desc: "Alice completed Math 101", time: "2m ago", unread: true },
    { id: 2, title: "System Update", desc: "v2.0 deployment complete", time: "1h ago", unread: false },
    { id: 3, title: "Exam Alert", desc: "Python Quiz starts in 30m", time: "3h ago", unread: false },
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/auth/login");
      return;
    }
    setUser(JSON.parse(storedUser));
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
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className={`relative p-2 hover:bg-white/5 rounded-full transition-all ${showNotifications ? "bg-white/5" : ""}`}
              >
                <Bell className="w-5 h-5 text-gray-400" />
                <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#050505]" />
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
                      <button className="text-[10px] text-indigo-400 font-bold hover:underline">Clear All</button>
                    </div>
                    <div className="space-y-3">
                      {notifications.map(n => (
                        <div key={n.id} className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-gray-200">{n.title}</span>
                            <span className="text-[8px] text-gray-500 uppercase">{n.time}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 line-clamp-1">{n.desc}</p>
                        </div>
                      ))}
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
          }}
          className="flex-1 overflow-y-auto pr-2 custom-scrollbar"
        >
          {children}
        </div>
      </main>
    </div>
  );
}
