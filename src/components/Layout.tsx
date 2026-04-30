import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Bug,
  Terminal,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const SidebarItem = ({ to, icon: Icon, label, collapsed }: { to: string, icon: any, label: string, collapsed: boolean }) => (
  <NavLink
    to={to}
    className={({ isActive }) => cn(
      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative",
      isActive
        ? "bg-brand-primary/10 text-brand-primary"
        : "text-slate-400 hover:text-white hover:bg-white/5"
    )}
  >
    <Icon className="w-5 h-5 shrink-0" />
    <AnimatePresence>
      {!collapsed && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="font-medium whitespace-nowrap"
        >
          {label}
        </motion.span>
      )}
    </AnimatePresence>
    {collapsed && (
      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
        {label}
      </div>
    )}
  </NavLink>
);

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-[#020617] overflow-hidden">
      <motion.aside
        animate={{ width: collapsed ? 80 : 260 }}
        className="hidden md:flex flex-col border-r border-white/5 bg-[#020617] relative z-40 transition-all duration-300"
      >
        <div className="p-6 flex items-center justify-between">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg vibe-gradient flex items-center justify-center">
                <Terminal className="text-brand-secondary w-5 h-5" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-white">VibeCode</span>
            </motion.div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg vibe-gradient flex items-center justify-center mx-auto">
              <Terminal className="text-brand-secondary w-5 h-5" />
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} />
          <SidebarItem to="/find-bug" icon={Bug} label="Find Bug" collapsed={collapsed} />
          <SidebarItem to="/prompt-lab" icon={Terminal} label="Prompt Lab" collapsed={collapsed} />
          <SidebarItem to="/profile" icon={User} label="Profile" collapsed={collapsed} />
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
          >
            <ChevronRight className={cn("w-5 h-5 transition-transform duration-300", collapsed ? "" : "rotate-180")} />
            {!collapsed && <span className="font-medium">Collapse</span>}
          </button>
          <button
            onClick={() => void logout().then(() => navigate('/auth'))}
            className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed inset-0 z-50 bg-[#020617] md:hidden flex flex-col"
          >
            <div className="p-6 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <Terminal className="text-brand-primary w-6 h-6" />
                <span className="font-display font-bold text-xl text-white">VibeCode</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            <nav className="flex-1 p-6 space-y-4">
              <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" collapsed={false} />
              <SidebarItem to="/find-bug" icon={Bug} label="Find Bug" collapsed={false} />
              <SidebarItem to="/prompt-lab" icon={Terminal} label="Prompt Lab" collapsed={false} />
              <SidebarItem to="/profile" icon={User} label="Profile" collapsed={false} />
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#020617]/50 backdrop-blur-md sticky top-0 z-30">
          <button
            className="md:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 flex justify-end items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Level {user?.level ?? 1} • {user?.experience ?? 0} XP</span>
            </div>

            <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 overflow-hidden cursor-pointer hover:border-brand-primary transition-colors">
              <img src={user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Coder'} alt="Avatar" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
