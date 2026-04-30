import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Sparkles,
  Zap,
  History,
  Save,
  Copy,
  ChevronRight,
  Database,
  Cpu,
  Loader2,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { refinePrompt } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import { apiRequest } from '../lib/api';
import { useToast } from '../components/Toast';

interface PromptEntry {
  id: string;
  title: string;
  originalPrompt?: string;
  basePrompt?: string;
  refinedPrompt?: string;
  improvedPrompt?: string;
  output?: string;
  createdAt: string;
}

const PromptLab = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [basePrompt, setBasePrompt] = useState('');
  const [output, setOutput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
  const [history, setHistory] = useState<PromptEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleRefine = async () => {
    if (!basePrompt || !user) return;
    setIsRefining(true);
    try {
      const result = await refinePrompt(basePrompt);
      setOutput(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefining(false);
    }
  };

  const savePrompt = async () => {
    if (!user || !basePrompt || !output) return;
    setIsSaving(true);
    try {
      await apiRequest('/api/prompts/save', {
        method: 'POST',
        body: JSON.stringify({
          title: basePrompt.slice(0, 40) + (basePrompt.length > 40 ? '...' : ''),
          category: 'prompt-lab',
          originalPrompt: basePrompt,
          improvedPrompt: output,
          role: 'prompt engineer',
          detailLevel: 'high',
        }),
      }, true);
      addToast('success', 'Prompt saved to history!');
    } catch (error) {
      addToast('error', 'Failed to save prompt. Please try again.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const fetchHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const entries = await apiRequest<PromptEntry[]>('/api/prompts/history', {}, true);
      setHistory(entries);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      void fetchHistory();
    }
  }, [activeTab, user]);

  const deletePrompt = async (id: string) => {
    if (!user) return;
    try {
      await apiRequest(`/api/prompts/${id}`, { method: 'DELETE' }, true);
      setHistory(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const loadFromHistory = (entry: PromptEntry) => {
    setBasePrompt(entry.originalPrompt || entry.basePrompt || '');
    setOutput(entry.improvedPrompt || entry.refinedPrompt || entry.output || '');
    setActiveTab('editor');
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Prompt Lab</h1>
          <p className="text-slate-400">Iterate, optimize, and engineer the perfect AI conversation.</p>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
           <button
             onClick={() => setActiveTab('editor')}
             className={cn(
               "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
               activeTab === 'editor' ? "bg-brand-primary text-brand-secondary" : "text-slate-400 hover:text-white"
             )}
           >
             <Terminal className="w-4 h-4" /> Lab Workspace
           </button>
           <button
             onClick={() => setActiveTab('history')}
             className={cn(
               "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
               activeTab === 'history' ? "bg-brand-primary text-brand-secondary" : "text-slate-400 hover:text-white"
             )}
           >
             <History className="w-4 h-4" /> Lab History
           </button>
        </div>
      </header>

      {activeTab === 'editor' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
          <div className="flex flex-col gap-6 h-full">
             <div className="flex-1 glass-dark rounded-3xl border-white/5 flex flex-col overflow-hidden relative">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Base Input</span>
                   </div>
                   <div className="flex items-center gap-4 text-[10px] text-slate-600 font-mono">
                      <span>CHARS: {basePrompt.length}</span>
                      <span>MODEL: GEMINI API</span>
                   </div>
                </div>
                <textarea
                  value={basePrompt}
                  onChange={(e) => setBasePrompt(e.target.value)}
                  placeholder={user ? "Enter your initial prompt idea or raw instruction here..." : "Login to use Prompt Lab..."}
                  className="flex-1 w-full bg-transparent p-6 outline-none text-slate-300 resize-none font-sans text-lg leading-relaxed placeholder:text-slate-700"
                  disabled={!user}
                />
                <div className="p-4 border-t border-white/5 bg-black/20 flex justify-between items-center">
                   <div className="flex items-center gap-4 opacity-50 px-2 cursor-not-allowed">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 border-r border-white/10 pr-4">
                         <Database className="w-3.5 h-3.5" /> Grounds
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
                         <Cpu className="w-3.5 h-3.5" /> High-Think
                      </div>
                   </div>
                   <button
                     onClick={() => void handleRefine()}
                     disabled={!basePrompt || isRefining || !user}
                     className="px-6 py-2.5 rounded-xl vibe-gradient text-brand-secondary font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 shadow-xl shadow-brand-primary/10"
                   >
                     {isRefining ? 'Synthesizing...' : 'Refine with AI'} <Sparkles className="w-4 h-4" />
                   </button>
                </div>
             </div>
          </div>

          <div className="flex flex-col gap-6 h-full">
            <div className="flex-1 glass p-1 rounded-3xl border-brand-primary/10 relative">
               <div className="absolute inset-0 bg-brand-primary/5 blur-3xl pointer-events-none rounded-3xl" />
               <div className="h-full w-full bg-slate-950 rounded-[22px] flex flex-col overflow-hidden relative z-10">
                  <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                     <div className="flex items-center gap-2">
                        <Zap className="text-brand-primary w-4 h-4" />
                        <span className="text-xs font-bold text-white uppercase tracking-widest">Optimized Output</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <button
                          onClick={() => void savePrompt()}
                          disabled={!output || isSaving || !user}
                          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-all disabled:opacity-30"
                        >
                           {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(output);
                            addToast('info', 'Copied to clipboard!');
                          }}
                          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-all"
                        >
                           <Copy className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
                  <div className="flex-1 p-8 overflow-y-auto text-slate-300 font-sans leading-relaxed">
                     {output ? (
                        <div className="markdown-body prose prose-invert max-w-none">
                           <ReactMarkdown>{output}</ReactMarkdown>
                        </div>
                     ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center px-10 opacity-30 select-none">
                           <Sparkles className="w-12 h-12 mb-6" />
                           <p className="text-lg font-medium italic">Refined prompt variations will appear here once synthesized.</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-dark rounded-3xl border-white/5 overflow-hidden divide-y divide-white/5">
           {loadingHistory ? (
              <div className="p-20 text-center text-slate-500">
                 <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" />
                 <p>Retrieving your refined outputs...</p>
              </div>
           ) : history.length > 0 ? (
             history.map((entry) => (
              <div
                key={entry.id}
                className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer"
                onClick={() => loadFromHistory(entry)}
              >
                 <div className="flex-1">
                   <h3 className="text-lg font-bold text-white group-hover:text-brand-primary transition-colors">{entry.title || 'Untitled Prompt'}</h3>
                   <div className="flex items-center gap-4 mt-2">
                     <span className="text-xs text-slate-500">
                       {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : 'Just now'}
                     </span>
                     <span className="text-[10px] font-bold text-brand-primary py-0.5 px-2 rounded-full bg-brand-primary/10 uppercase tracking-tighter">
                       Refined
                     </span>
                   </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); void deletePrompt(entry.id); }}
                      className="p-3 text-slate-700 hover:text-red-500 transition-colors"
                    >
                       <Trash2 className="w-5 h-5" />
                    </button>
                    <button className="p-3 text-slate-600 group-hover:text-white transition-colors">
                       <ChevronRight className="w-6 h-6" />
                    </button>
                 </div>
              </div>
             ))
           ) : (
             <div className="p-20 text-center text-slate-500">
                <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-xl">No history found. Start refining to build your lab!</p>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default PromptLab;
