import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Bug, ChevronRight, Terminal, Star, Loader2, ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { SAMPLE_CHALLENGES } from '../data';
import { cn } from '../lib/utils';
import { Difficulty, Challenge, UserChallengeProgress } from '../types';
import { bugService } from '../services/bug.service';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const DifficultyBadge = ({ difficulty }: { difficulty: Difficulty }) => {
  const colors = {
    Easy: 'text-green-400 bg-green-500/10 border-green-500/20',
    Medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    Hard: 'text-red-400 bg-red-500/10 border-red-500/20'
  };
  return (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase border", colors[difficulty] || colors.Easy)}>
      {difficulty}
    </span>
  );
};

const ChallengeList = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<Difficulty | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [progressMap, setProgressMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchChallenges = async () => {
      setLoading(true);
      try {
        const challengeList = await bugService.getChallenges(category);
        setChallenges(challengeList);
      } catch (error) {
        console.error('Backend fetch failed:', error);
        setChallenges([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchChallenges();

    // Fetch user progress for badges
    if (user) {
      apiRequest<{ items: UserChallengeProgress[] }>('/api/users/progress', {}, true)
        .then(data => {
          const map: Record<string, string> = {};
          for (const item of data.items) {
            if (item.itemId) map[item.itemId] = item.status;
          }
          setProgressMap(map);
        })
        .catch(() => {});
    }
  }, [category, user]);

  const filteredChallenges = challenges.filter(c => {
    const matchesFilter = activeFilter === 'All' || c.difficulty === activeFilter;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-brand-primary">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-display font-medium">Syncing challenges for {category}...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button
            onClick={() => navigate('/find-bug')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Categories
          </button>
          <h1 className="text-4xl font-display font-bold text-white mb-2 capitalize">{category} Challenges</h1>
          <p className="text-slate-400">Hunt down subtle bugs in {category}. Sharpen your debugging instincts.</p>
        </div>

        <div className="flex items-center gap-4 bg-white/5 p-1 rounded-xl border border-white/10">
           {['All', 'Easy', 'Medium', 'Hard'].map((f) => (
             <button
               key={f}
               onClick={() => setActiveFilter(f as any)}
               className={cn(
                 "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                 activeFilter === f ? "bg-brand-primary text-brand-secondary shadow-lg shadow-brand-primary/20" : "text-slate-400 hover:text-white"
               )}
             >
               {f}
             </button>
           ))}
        </div>
      </header>

      <div className="relative mb-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Search challenges by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-14 pl-12 pr-4 rounded-2xl glass-dark border-white/5 focus:border-brand-primary outline-none text-white transition-all shadow-xl"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredChallenges.map((challenge, index) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => navigate(`/find-bug/${category}/${challenge.id}`)}
            className={cn(
              "group p-6 glass-dark rounded-2xl border-white/5 hover:border-brand-primary/30 transition-all cursor-pointer relative overflow-hidden",
              progressMap[challenge.id] === 'completed' && 'border-green-500/20 bg-green-500/5'
            )}
          >
            {progressMap[challenge.id] === 'completed' && (
              <div className="absolute top-3 right-3">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 text-[10px] font-bold uppercase border border-green-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Done
                </span>
              </div>
            )}
            {progressMap[challenge.id] === 'in_progress' && (
              <div className="absolute top-3 right-3">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 text-[10px] font-bold uppercase border border-yellow-500/20">
                  <Clock className="w-3 h-3" /> In Progress
                </span>
              </div>
            )}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-brand-primary transition-colors">
                  <Bug className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-brand-primary transition-colors">{challenge.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <DifficultyBadge difficulty={challenge.difficulty} />
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{challenge.language}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-brand-primary">
                 <Star className="w-3.5 h-3.5 fill-brand-primary" />
                 {challenge.points} XP
              </div>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-2">
              {challenge.description}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
               <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-[#020617] bg-slate-800 overflow-hidden">
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=User${i+index}`} alt="User" />
                    </div>
                  ))}
                  <div className="w-6 h-6 rounded-full border-2 border-[#020617] bg-slate-900 flex items-center justify-center text-[8px] text-slate-400 font-bold">
                    +12
                  </div>
               </div>
               <span className="text-slate-500 text-xs font-medium group-hover:text-white transition-colors flex items-center gap-1">
                 Analyze Code <ChevronRight className="w-3 h-3" />
               </span>
            </div>
          </motion.div>
        ))}

        {filteredChallenges.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500 bg-white/5 rounded-3xl border border-dashed border-white/10">
             <Terminal className="w-12 h-12 mx-auto mb-4 opacity-20" />
             <p className="text-xl">Chưa có bài trong category này.</p>
             <button
               onClick={() => { setActiveFilter('All'); setSearchQuery(''); navigate('/find-bug'); }}
               className="mt-4 text-brand-primary hover:underline font-bold"
             >
               Back to Categories
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengeList;
