import React, { useEffect, useState } from 'react';
import {
  User,
  Settings,
  Trophy,
  Award,
  Activity,
  Edit3,
  ShieldCheck,
  Zap,
  Globe,
  Flame,
  Loader2,
  CheckCircle2,
  Star,
  Target,
  Clock,
  BookOpen,
  BarChart2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Achievement } from '../types';
import { apiRequest } from '../lib/api';
import { cn } from '../lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────
interface ProgressItem {
  id?: string;
  itemId?: string;
  challengeId?: string;
  challengeTitle?: string;
  status: string;
  attempts?: number;
  completedAt?: string;
  updatedAt?: string;
}

interface HistoryItem {
  id: string;
  type: 'submission' | 'prompt';
  title: string;
  xp?: number;
  passed?: boolean;
  createdAt: string;
}

// ── Helper Components ─────────────────────────────────────────────────────────
const BadgeCard = ({
  icon: Icon,
  title,
  date,
}: {
  icon: React.ElementType;
  title: string;
  date: string;
}) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="flex flex-col items-center p-4 rounded-2xl glass-dark border border-white/5 text-center group transition-all hover:border-brand-primary/30"
  >
    <div className="w-16 h-16 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-4 group-hover:bg-brand-primary/20 transition-colors">
      <Icon className="w-8 h-8 text-brand-primary" />
    </div>
    <div className="text-sm font-bold text-white mb-1">{title}</div>
    <div className="text-[10px] text-slate-500 uppercase tracking-widest">{date}</div>
  </motion.div>
);

const StatCard = ({
  icon: Icon,
  label,
  value,
  color = 'text-brand-primary',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: string;
}) => (
  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
    <div className="flex items-center gap-3">
      <Icon className={cn('w-4 h-4', color)} />
      <span className="text-xs font-medium text-slate-300">{label}</span>
    </div>
    <span className="text-sm font-bold text-white">{value}</span>
  </div>
);

const EmptyState = ({ icon: Icon, message }: { icon: React.ElementType; message: string }) => (
  <div className="p-10 text-center text-slate-600 italic text-sm flex flex-col items-center gap-3">
    <Icon className="w-10 h-10 opacity-20" />
    <p>{message}</p>
  </div>
);

// ── Icon map for achievements ──────────────────────────────────────────────────
const ACHIEVEMENT_ICONS: Record<string, React.ElementType> = {
  award: Award,
  trophy: Trophy,
  zap: Zap,
  target: Target,
  star: Star,
  check: CheckCircle2,
  book: BookOpen,
};

// ── Main Component ────────────────────────────────────────────────────────────
const Profile = () => {
  const { user } = useAuth();
  const [wins, setWins] = useState<ProgressItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'wins' | 'history' | 'badges'>('wins');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [profileData, progressData, achievementData, historyData] = await Promise.all([
          apiRequest<any>('/api/users/profile', {}, true),
          apiRequest<{ items: ProgressItem[]; stats: any }>('/api/users/progress', {}, true),
          apiRequest<Achievement[]>('/api/users/achievements', {}, true),
          apiRequest<HistoryItem[]>('/api/users/history', {}, true),
        ]);
        setProfile(profileData);
        setWins(progressData.items.filter((item) => item.status === 'completed').slice(0, 8));
        setAchievements(Array.isArray(achievementData) ? achievementData : []);
        setHistory(Array.isArray(historyData) ? historyData.slice(0, 15) : []);
      } catch (error) {
        console.error('Profile fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
        <User className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-xl">Authentication required to view neural profile.</p>
      </div>
    );
  }

  // XP Calculations
  const currentXP = profile?.user?.experience ?? user.experience ?? 0;
  const currentLevel = profile?.profile?.level ?? user.level ?? 1;
  const xpInLevel = currentXP % 100;
  const xpToNext = 100 - xpInLevel;
  const progressPct = xpInLevel;

  const streak = profile?.profile?.streak ?? user.streak ?? 0;
  const totalSolved = profile?.profile?.totalSolved ?? user.totalSolved ?? wins.length;
  const standing = currentLevel >= 10 ? 'Elite Coder' : currentLevel >= 5 ? 'Senior Dev' : 'Neural Initiate';

  // Fallback achievements for demo
  const badgeSource =
    achievements.length > 0
      ? achievements
      : [
          { id: 'f1', name: 'First Blood', icon: 'zap', earnedAt: new Date().toISOString() },
          { id: 'f2', name: 'Bug Hunter', icon: 'target', earnedAt: new Date().toISOString() },
          { id: 'f3', name: 'Streak Master', icon: 'star', earnedAt: new Date().toISOString() },
          { id: 'f4', name: 'Lab Regular', icon: 'book', earnedAt: new Date().toISOString() },
        ];

  const tabs = [
    { id: 'wins' as const, label: 'Recent Wins', icon: Trophy, count: wins.length },
    { id: 'history' as const, label: 'History', icon: Activity, count: history.length },
    { id: 'badges' as const, label: 'Badges', icon: Award, count: badgeSource.length },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Banner */}
      <div className="relative mb-12 h-48 sm:h-56 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 vibe-gradient opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-indigo-900/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] to-transparent" />
        {/* Decorative circles */}
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl" />
        <div className="absolute right-32 bottom-0 w-32 h-32 bg-brand-accent/10 rounded-full blur-2xl" />
        <button className="absolute top-6 right-6 p-2 bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 text-white hover:bg-black/60 transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-10 -mt-28 px-6 md:px-10 relative z-10">
        {/* ── Left sidebar ─────────────────────────────────────── */}
        <div className="md:w-72 flex flex-col items-center md:items-start">
          {/* Avatar */}
          <div className="w-36 h-36 rounded-3xl p-1 vibe-gradient mb-5 shadow-2xl shrink-0">
            <div className="w-full h-full rounded-[20px] overflow-hidden bg-slate-900 border-4 border-[#020617]">
              <img
                src={
                  user.photoURL ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName || 'Coder'}`
                }
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <h1 className="text-2xl font-display font-bold text-white mb-1">
            {profile?.user?.displayName || user.displayName}
          </h1>
          <p className="text-slate-400 text-sm mb-1 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" />
            {profile?.profile?.location || 'Silicon Valley, CA'}
          </p>
          {(profile?.profile?.bio || user.bio) && (
            <p className="text-slate-500 text-xs mb-4 leading-relaxed">
              {profile?.profile?.bio || user.bio}
            </p>
          )}

          <button className="w-full mb-6 py-2.5 rounded-xl border border-white/10 text-white font-bold text-sm bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2">
            <Edit3 className="w-4 h-4" /> Edit Profile
          </button>

          {/* Stats */}
          <div className="w-full space-y-3">
            {/* XP Progress */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400">Level {currentLevel} · {xpInLevel} XP</span>
                <span className="text-slate-500">{xpToNext} to next</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full vibe-gradient rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <div className="text-right text-xs text-brand-primary font-bold mt-1">{currentXP} XP total</div>
            </div>

            <StatCard icon={Flame} label="Streak" value={`${streak} days`} color="text-orange-400" />
            <StatCard icon={CheckCircle2} label="Challenges Solved" value={totalSolved} color="text-green-400" />
            <StatCard icon={BarChart2} label="Level" value={currentLevel} color="text-blue-400" />
            <StatCard icon={ShieldCheck} label="Standing" value={standing} color="text-brand-primary" />
          </div>
        </div>

        {/* ── Right content ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 rounded-2xl bg-white/5 border border-white/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Wins Tab ─────────────────────────────────────────── */}
          {activeTab === 'wins' && (
            <div className="glass-dark rounded-2xl border border-white/5 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-xs">Loading victories...</p>
                </div>
              ) : wins.length > 0 ? (
                wins.map((win, idx) => (
                  <motion.div
                    key={win.id || win.itemId || idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                        <Trophy className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">
                          {win.challengeTitle || `Challenge: ${win.itemId || win.challengeId || win.id}`}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {win.completedAt
                              ? new Date(win.completedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'Recently'}
                          </span>
                          {(win.attempts ?? 0) > 0 && (
                            <span>{win.attempts} attempt{(win.attempts ?? 0) > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-brand-primary">
                      <Star className="w-3.5 h-3.5 fill-brand-primary" />
                      XP
                    </div>
                  </motion.div>
                ))
              ) : (
                <EmptyState
                  icon={Trophy}
                  message="No challenges conquered yet. The Forge awaits your arrival."
                />
              )}
            </div>
          )}

          {/* ── History Tab ──────────────────────────────────────── */}
          {activeTab === 'history' && (
            <div className="glass-dark rounded-2xl border border-white/5 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-xs">Loading history...</p>
                </div>
              ) : history.length > 0 ? (
                history.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  >
                    <div
                      className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                        item.type === 'submission'
                          ? item.passed === false
                            ? 'bg-red-500/10 border border-red-500/20'
                            : 'bg-green-500/10 border border-green-500/20'
                          : 'bg-brand-primary/10 border border-brand-primary/20'
                      )}
                    >
                      {item.type === 'submission' ? (
                        <CheckCircle2
                          className={cn(
                            'w-4 h-4',
                            item.passed === false ? 'text-red-400' : 'text-green-400'
                          )}
                        />
                      ) : (
                        <BookOpen className="w-4 h-4 text-brand-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">{item.title}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                        {item.type === 'submission' ? 'Challenge' : 'Prompt'} •{' '}
                        {new Date(item.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    {item.xp && item.xp > 0 && (
                      <div className="text-xs font-bold text-brand-primary shrink-0">
                        +{item.xp} XP
                      </div>
                    )}
                  </motion.div>
                ))
              ) : (
                <EmptyState icon={Activity} message="No activity recorded yet. Start solving challenges!" />
              )}
            </div>
          )}

          {/* ── Badges Tab ───────────────────────────────────────── */}
          {activeTab === 'badges' && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {badgeSource.slice(0, 8).map((achievement) => (
                  <BadgeCard
                    key={achievement.id}
                    icon={ACHIEVEMENT_ICONS[achievement.icon] ?? Zap}
                    title={achievement.name}
                    date={new Date(achievement.earnedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  />
                ))}
              </div>
              {badgeSource.length === 0 && (
                <EmptyState icon={Award} message="Complete challenges to unlock honorary badges." />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
