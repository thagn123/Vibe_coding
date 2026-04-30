import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  Target,
  Flame,
  ChevronRight,
  Play,
  Bug,
  Terminal,
  Clock,
  Sparkles,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { DashboardSummary, Recommendation } from '../types';

const StatCard = ({ icon: Icon, label, value, subtext, color }: { icon: any, label: string, value: string, subtext: string, color: string }) => (
  <div className="glass-dark p-6 rounded-2xl border-white/5 relative overflow-hidden group">
    <div className={cn("absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-20 transition-opacity group-hover:opacity-40", color)} />
    <div className="flex items-center gap-4 mb-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color.replace('bg-', 'bg-').replace('/10', '/20'))}>
        <Icon className={cn("w-5 h-5", color.replace('bg-', 'text-'))} />
      </div>
      <span className="text-slate-400 font-medium text-sm">{label}</span>
    </div>
    <div className="text-3xl font-display font-bold text-white mb-1">{value}</div>
    <div className="text-xs text-slate-500">{subtext}</div>
  </div>
);

const ActivityItem = ({ title, date, type, xp }: { title: string, date: string, type: 'bug' | 'prompt', xp?: number }) => (
  <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer">
    <div className="flex items-center gap-4">
      <div className={cn(
        "w-8 h-8 rounded flex items-center justify-center",
        type === 'bug' ? 'bg-red-500/10 text-red-500' : 'bg-brand-primary/10 text-brand-primary'
      )}>
        {type === 'bug' ? <Bug className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
      </div>
      <div>
        <div className="text-sm font-medium text-white group-hover:text-brand-primary transition-colors">{title}</div>
        <div className="text-[10px] text-slate-500 flex items-center gap-3 mt-0.5 uppercase tracking-wider">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {date}</span>
          {xp && xp > 0 && <span className="text-brand-primary font-bold flex items-center gap-0.5"><Zap className="w-3 h-3 fill-brand-primary" /> +{xp} XP</span>}
        </div>
      </div>
    </div>
    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
  </div>
);

const RecommendationCard = ({ rec }: { rec: Recommendation }) => {
  const navigate = useNavigate();
  const challenge = rec.challenge;
  
  const diffColors = {
    'Easy': 'from-green-500 to-emerald-600 shadow-green-500/10',
    'Medium': 'from-orange-500 to-amber-600 shadow-orange-500/10',
    'Hard': 'from-red-500 to-rose-600 shadow-red-500/10'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={() => navigate(`/find-bug/${challenge.category || 'basics'}/${challenge.id}`)}
      className={cn(
        "p-1 rounded-2xl bg-gradient-to-r cursor-pointer shadow-lg transition-all",
        challenge.type === 'prompt' ? 'from-blue-500 to-indigo-600 shadow-blue-500/10' : (diffColors[challenge.difficulty] || 'from-brand-primary to-emerald-500 shadow-brand-primary/10')
      )}
    >
      <div className="bg-[#020617] p-6 rounded-[15px] h-full flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
             {challenge.type === 'prompt' ? <Terminal className="text-blue-400 w-10 h-10" /> : <Bug className="text-brand-primary w-10 h-10" />}
             <span className={cn(
               "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-white/5 border border-white/10",
               challenge.difficulty === 'Hard' ? 'text-red-400' : challenge.difficulty === 'Medium' ? 'text-orange-400' : 'text-green-400'
             )}>
               {challenge.difficulty}
             </span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2 leading-tight">{challenge.title}</h3>
          <p className="text-slate-400 text-xs mb-6 line-clamp-2">{rec.reason}</p>
        </div>
        <div className="flex items-center justify-between text-brand-primary font-bold">
          <span className="text-sm">+{challenge.points || 20} XP</span>
          <div className="flex items-center gap-2 text-sm uppercase tracking-widest group">
            Start <Play className="w-4 h-4 fill-brand-primary group-hover:scale-125 transition-transform" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      apiRequest<DashboardSummary>('/api/dashboard/summary', {}, true),
      apiRequest<{ items: Recommendation[] }>('/api/dashboard/recommendations', {}, true)
    ]).then(([sumData, recData]) => {
      setSummary(sumData);
      setRecs(recData.items);
    }).catch(err => {
      console.error('Dashboard load error:', err);
    }).finally(() => {
      setLoading(false);
    });
  }, [user]);

  const currentXP = summary?.profile.experience ?? user?.experience ?? 0;
  const currentLevel = summary?.profile.level ?? user?.level ?? 1;
  const xpInCurrentLevel = summary?.profile.xpInLevel ?? (currentXP % 100);
  const progressPct = summary?.profile.progressPct ?? Math.min(100, xpInCurrentLevel);
  const xpForNextLevel = 100;
  const xpToNextLevel = xpForNextLevel - xpInCurrentLevel;

  const recentActivity = summary?.recentActivity || [];

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <header className="mb-10">
        <h1 className="text-4xl font-display font-bold text-white mb-2">Neural Link Active, {summary?.profile.displayName || user?.displayName?.split(' ')[0] || 'Coder'}.</h1>
        <p className="text-slate-400">Welcome back. Your neuro-coding performance is at <span className="text-brand-primary font-bold">peak efficiency</span>.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          icon={Trophy}
          label="Neural Rank"
          value={`Level ${currentLevel}`}
          subtext={`${currentXP} Total XP`}
          color="bg-orange-500/10 text-orange-500"
        />
        <StatCard
          icon={Target}
          label="Bugs Decimated"
          value={String(summary?.stats.bugsFound ?? user?.totalSolved ?? 0)}
          subtext="Total challenge victories"
          color="bg-red-500/10 text-red-500"
        />
        <StatCard
          icon={Flame}
          label="Neuro-Streak"
          value={`${summary?.profile.streak ?? user?.streak ?? 0} Days`}
          subtext="Consecutive activity"
          color="bg-brand-primary/10 text-brand-primary"
        />
        <StatCard
          icon={Terminal}
          label="Cognitive Loads"
          value={String(summary?.stats.labSessions ?? 0)}
          subtext={`${summary?.stats.promptsSaved ?? 0} prompts saved`}
          color="bg-blue-500/10 text-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <section>
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-display font-bold text-white">Recommended Missions</h2>
               <button onClick={() => navigate('/find-bug')} className="text-xs font-bold text-brand-primary hover:underline uppercase tracking-widest">View All</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {recs.length > 0 ? (
                recs.map((rec, i) => (
                  <RecommendationCard key={i} rec={rec} />
                ))
              ) : loading ? (
                [1,2].map(i => <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />)
              ) : (
                <div className="col-span-2 p-8 rounded-2xl border border-white/5 bg-white/5 text-center text-slate-500 italic">
                   No specific recommendations found. Start exploring categories to begin!
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-white mb-6">Activity Timeline</h2>
            <div className="glass-dark rounded-2xl border-white/5 divide-y divide-white/5 overflow-hidden">
               {recentActivity.length > 0 ? (
                 recentActivity.map((item: any) => (
                   <ActivityItem
                     key={item.id}
                     title={item.title}
                     date={new Date(item.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                     type={item.type}
                     xp={item.xp}
                   />
                 ))
               ) : (
                 <div className="p-10 text-center text-slate-600 italic text-sm">
                    No recent activity recorded in the lab.
                 </div>
               )}
            </div>
          </section>
        </div>

        <div className="space-y-8">
           <section className="glass-dark p-6 rounded-2xl border-white/5 bg-gradient-to-br from-white/5 to-transparent">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                 <Sparkles className="w-4 h-4 text-brand-primary" /> Progress Matrix
              </h2>
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-xs mb-2">
                       <span className="text-slate-400 font-medium">Neural Depth (Level {currentLevel})</span>
                       <span className="text-white font-bold">{xpInCurrentLevel} / {xpForNextLevel} XP</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                       <motion.div 
                          className="h-full vibe-gradient rounded-full shadow-[0_0_10px_rgba(0,255,156,0.3)]" 
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPct}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                       />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 italic">{xpToNextLevel} XP until next synaptic evolution.</p>
                 </div>
                 
                 <div className="pt-4 border-t border-white/5 space-y-3">
                    <div className="flex justify-between text-sm">
                       <span className="text-slate-400">Total Solved</span>
                       <span className="text-white font-bold">{summary?.profile.totalSolved ?? user?.totalSolved ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                       <span className="text-slate-400">Global Rank</span>
                       <span className="text-brand-primary font-bold">#42</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                       <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Accuracy</div>
                       <div className="text-lg font-bold text-white">
                        {summary?.stats.bugsFound ? `${Math.min(99, 85 + (summary.stats.bugsFound / 2))}%` : '—'}
                       </div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                       <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Efficiency</div>
                       <div className="text-lg font-bold text-white">High</div>
                    </div>
                 </div>
              </div>
           </section>

           <section className="glass-dark p-6 rounded-2xl border-white/5 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-primary/20 blur-3xl group-hover:bg-brand-primary/30 transition-colors animate-pulse" />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-4">
                   <Zap className="text-brand-primary w-5 h-5 fill-brand-primary" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Neural Pro</h3>
                <p className="text-slate-400 text-xs mb-6 leading-relaxed">Unlock advanced neuro-modules, real-world bounties, and custom AI templates for elite debugging.</p>
                <button className="w-full py-3 rounded-xl vibe-gradient text-brand-secondary font-bold text-sm hover:shadow-lg hover:shadow-brand-primary/20 transition-all">
                  Upgrade Neural Link
                </button>
              </div>
           </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
