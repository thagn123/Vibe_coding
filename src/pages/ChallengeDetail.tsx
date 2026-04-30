import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Play,
  Lightbulb,
  Terminal as TerminalIcon,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Send,
  Loader2,
  RefreshCcw,
  Save,
  Check,
  ChevronRight,
  Bug,
  Tag,
  Trophy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { getBugHint } from '../services/gemini';
import { Challenge } from '../types';
import { bugService } from '../services/bug.service';
import { useToast } from '../components/Toast';

const ChallengeDetail = () => {
  const { category, challengeId } = useParams();
  const id = challengeId;
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState<{ status: 'idle' | 'running' | 'success' | 'fail', message: string, details?: string, testResults?: {input: string, expected: string, actual: string, status: string}[] }>({ status: 'idle', message: '' });
  const [hints, setHints] = useState<{ level: number; hintText: string }[]>([]);
  const [unlockedHints, setUnlockedHints] = useState<number[]>([]);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const [showFeedback, setShowFeedback] = useState(false);
  const [sessionAttempts, setSessionAttempts] = useState(0);
  const [feedbackData, setFeedbackData] = useState<{
    earnedXP: number,
    baseXP: number,
    bonusXP: number,
    levelUp: boolean,
    newLevel: number,
    bonusBreakdown?: { firstTryBonus: number; noHintBonus: number },
    badgesEarned?: Array<{ id: string; name: string; icon: string; desc: string }>
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchContent = async () => {
      const normalizedId = challengeId?.trim().toLowerCase() || '';
      if (!normalizedId) return;
      
      setLoading(true);
      try {
        const [challengeData, hintData] = await Promise.all([
          bugService.getChallengeById(normalizedId, Boolean(user)),
          bugService.getHints(normalizedId),
        ]);
        
        setChallenge(challengeData);
        setCode(challengeData.savedCode || challengeData.starterCode || challengeData.buggyCode || '');
        setHints(hintData);
        if (challengeData.status === 'completed') {
           setIsCompleted(true);
        }
      } catch (error) {
        console.error('Failed to fetch challenge content:', error);
      } finally {
        setLoading(false);
      }
    };
    void fetchContent();
  }, [challengeId, category, user]);

  const runFakeTests = async (userCode: string, challengeId: string, starterCode: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const isUnchanged = userCode.trim() === starterCode.trim();
    if (userCode.includes('SyntaxError') || userCode.match(/^[a-zA-Z]+$/)) {
      throw new Error("SyntaxError: invalid syntax on line 1");
    }
    const results = [
      { input: "test_case_1(10, 20)", expected: "30", actual: isUnchanged ? "None" : "30", status: isUnchanged ? "fail" : "pass" },
      { input: "test_case_2(-5, 5)", expected: "0", actual: isUnchanged ? "None" : "0", status: isUnchanged ? "fail" : "pass" },
      { input: "test_case_3(0, 0)", expected: "0", actual: isUnchanged ? "None" : "0", status: isUnchanged ? "fail" : "pass" }
    ];
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.length - passed;
    return { passed, failed, results, error: null };
  };

  const handleRunClick = async () => {
    if (!challenge) return;
    setOutput({ status: 'running', message: 'Đang kiểm thử...', details: undefined, testResults: [] });

    try {
      const result = await runFakeTests(code, challenge.id, challenge.starterCode || challenge.buggyCode || '');
      if (result.failed === 0) {
        setOutput({ 
          status: 'success', 
          message: `All tests passed ✅ (${result.passed}/${result.passed + result.failed})`,
          testResults: result.results
        });
      } else {
        setSessionAttempts(prev => prev + 1);
        setOutput({
          status: 'fail',
          message: `Tests failed ❌ Passed ${result.passed}, failed ${result.failed}.`,
          testResults: result.results
        });
      }
    } catch (error) {
      setOutput({ 
        status: 'fail', 
        message: 'Runtime Error!', 
        details: error instanceof Error ? error.message : 'Unknown execution error.' 
      });
    }
  };

  const submitSolution = async () => {
    if (!challenge || !user) return;
    if (output.status !== 'success') {
      setOutput(prev => ({ ...prev, message: '⚠️ Run tests first and ensure all tests pass before submitting.' }));
      return;
    }
    setIsSaving(true);
    try {
      const res = await bugService.submitSolution(challenge.id, code, unlockedHints.length, sessionAttempts + 1);
      
      // If backend ran real tests and they failed, show failure
      if (res && (res as any).status === 'failed') {
        setOutput({ status: 'fail', message: `❌ Submission failed – keep debugging!` });
        return;
      }

      setIsCompleted(true);
      // Refresh user XP/level in the global state (updates sidebar header)
      void refreshUser();

      // Trigger Badge Toasts
      if (res.badgesEarned && res.badgesEarned.length > 0) {
        res.badgesEarned.forEach(badge => {
          addToast('badge', `Badge Unlocked: ${badge.name}`, 0, badge.desc);
        });
      }

      // Trigger Level Up Toast
      if (res.levelUp) {
        addToast('levelup', `Level Up! You're now Level ${res.newLevel}`, 0, 'Keep climbing the ranks!');
      }

      // Open Feedback Modal
      if (res && res.earnedXP !== undefined) {
        setFeedbackData({
          earnedXP: res.earnedXP,
          baseXP: res.baseXP || 0,
          bonusXP: res.bonusXP || 0,
          levelUp: !!res.levelUp,
          newLevel: res.newLevel || 1,
          bonusBreakdown: res.bonusBreakdown,
          badgesEarned: res.badgesEarned
        });
        addToast('xp', 'Challenge completed!', res.earnedXP);
        setShowFeedback(true);
      } else {
        // Fallback for demo if backend response doesn't match
        setFeedbackData({
          earnedXP: challenge.points || 15,
          baseXP: challenge.points || 15,
          bonusXP: 5,
          levelUp: false,
          newLevel: 2
        });
        setShowFeedback(true);
      }
    } catch (error) {
      setOutput({ status: 'fail', message: 'Failed to submit solution. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const saveDraft = async () => {
    if (!challenge || !user) return;
    setIsSaving(true);
    try {
      await bugService.saveProgress(challenge.id, code);
      addToast('success', 'Draft saved successfully.');
    } catch (error) {
      addToast('error', 'Failed to save draft.');
    } finally {
      setTimeout(() => setIsSaving(false), 1000);
    }
  };

  const resetCode = () => {
    if (!challenge) return;
    if (confirm("Are you sure you want to reset to the starter code? All changes will be lost.")) {
      setCode(challenge.starterCode || challenge.buggyCode || '');
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping || !challenge || !user) return;
    const userMsg = inputMessage;
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const response = await getBugHint(challenge.id, challenge.title, code, userMsg, conversationId);
      setConversationId(response.conversationId);
      setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: error instanceof Error ? error.message : 'Assistant unavailable.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNextChallenge = async () => {
    try {
      setShowFeedback(false);
      const challenges = await bugService.getChallenges(category);
      const currentIndex = challenges.findIndex(c => c.id === challenge?.id);
      if (currentIndex !== -1 && currentIndex < challenges.length - 1) {
        const nextId = challenges[currentIndex + 1].id;
        navigate(`/find-bug/${category}/${nextId}`);
      } else {
        navigate(`/find-bug/${category}`);
      }
    } catch (error) {
      navigate(`/find-bug/${category}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] text-brand-primary">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-display font-medium text-lg">Initializing Bug Workbench...</p>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)]">
        <h2 className="text-2xl font-bold mb-4 text-white">Challenge not found or corrupted</h2>
        <button onClick={() => navigate(`/find-bug/${category}`)} className="text-brand-primary hover:underline font-bold flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to category
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col -mx-4 -mb-4 lg:-mx-8 lg:-mb-8 bg-[#020617] relative">
      <AnimatePresence>
        {showFeedback && feedbackData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass p-8 rounded-3xl max-w-md w-full border-brand-primary/30 shadow-2xl shadow-brand-primary/20 flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 w-full h-1 bg-brand-primary left-0" />
              <div className="w-20 h-20 rounded-full vibe-gradient flex items-center justify-center mb-6 shadow-xl shadow-brand-primary/20">
                <Trophy className="w-10 h-10 text-brand-secondary" />
              </div>
              <h2 className="text-3xl font-display font-bold text-white mb-2">Challenge Conquered!</h2>
              <p className="text-slate-400 mb-8">You successfully resolved the bugs in <span className="text-brand-primary font-bold">{challenge.title}</span>.</p>
              
              <div className="w-full space-y-3 mb-8">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-slate-400 font-bold">Base XP</span>
                  <span className="text-white font-bold">+{feedbackData.baseXP}</span>
                </div>
                {feedbackData.bonusBreakdown && (
                  <>
                    {feedbackData.bonusBreakdown.firstTryBonus > 0 && (
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-slate-400 font-bold">First Try Bonus</span>
                        <span className="text-brand-primary font-bold">+{feedbackData.bonusBreakdown.firstTryBonus}</span>
                      </div>
                    )}
                    {feedbackData.bonusBreakdown.noHintBonus > 0 && (
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-slate-400 font-bold">No Hint Bonus</span>
                        <span className="text-brand-primary font-bold">+{feedbackData.bonusBreakdown.noHintBonus}</span>
                      </div>
                    )}
                  </>
                )}
                {!feedbackData.bonusBreakdown && feedbackData.bonusXP > 0 && (
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-slate-400 font-bold">Bonus XP</span>
                    <span className="text-brand-primary font-bold">+{feedbackData.bonusXP}</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-4 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
                  <span className="text-brand-primary font-bold text-lg">Total Earned</span>
                  <span className="text-brand-primary font-bold text-2xl">+{feedbackData.earnedXP}</span>
                </div>
              </div>

              {feedbackData.levelUp && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full p-4 mb-8 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400 font-bold flex flex-col items-center gap-2"
                >
                  <Sparkles className="w-6 h-6" />
                  LEVEL UP! You are now Level {feedbackData.newLevel}
                </motion.div>
              )}

              <div className="flex gap-4 w-full">
                <button onClick={() => setShowFeedback(false)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10">
                  Review Code
                </button>
                <button onClick={handleNextChallenge} className="flex-1 py-3 rounded-xl vibe-gradient text-brand-secondary font-bold transition-all hover:scale-105 shadow-lg shadow-brand-primary/20">
                  Next Mission
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between shrink-0 bg-black/20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/find-bug/${category}`)}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-white/10 hidden sm:block"></div>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
                <Bug className="w-4 h-4 text-brand-primary" />
             </div>
             <div>
               <h1 className="text-lg font-bold text-white leading-tight">{challenge.title}</h1>
               <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{category}</div>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="hidden md:flex items-center gap-4 mr-4 text-xs font-bold uppercase tracking-wider">
              <span className={
                challenge.difficulty === 'Easy' ? 'text-green-400' :
                challenge.difficulty === 'Medium' ? 'text-yellow-400' : 'text-red-400'
              }>{challenge.difficulty}</span>
              <span className="text-brand-primary">{challenge.points} XP</span>
              {isCompleted && <span className="text-brand-secondary flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Completed</span>}
           </div>
           <button onClick={saveDraft} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors group relative" title="Save Draft">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
           </button>
           <button onClick={resetCode} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors group" title="Reset Code">
              <RefreshCcw className="w-5 h-5 group-hover:-rotate-180 transition-transform duration-500" />
           </button>
           <button
             onClick={handleRunClick}
             disabled={output.status === 'running'}
             className="ml-2 flex items-center gap-2 px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all border border-white/10 disabled:opacity-50"
           >
             {output.status === 'running' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Run
           </button>
           <button
             onClick={submitSolution}
             disabled={output.status !== 'success' || isSaving || isCompleted}
             className="flex items-center gap-2 px-6 py-2 rounded-xl vibe-gradient text-brand-secondary font-bold text-sm hover:shadow-[0_0_20px_rgba(0,255,156,0.3)] transition-all disabled:opacity-50 disabled:grayscale"
           >
             <Check className="w-4 h-4" /> {isCompleted ? 'Completed' : 'Submit'}
           </button>
           {isCompleted && (
             <button
               onClick={handleNextChallenge}
               className="ml-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-bold text-sm hover:bg-slate-200 transition-all"
             >
               Next <ChevronRight className="w-4 h-4" />
             </button>
           )}
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL: INFO */}
        <aside className="w-80 border-r border-white/5 flex flex-col bg-black/20 overflow-y-auto hidden lg:flex shrink-0">
           <div className="p-6">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <TerminalIcon className="w-4 h-4" /> Mission Intel
              </h2>
              <div className="prose prose-invert prose-sm mb-6 text-slate-300 leading-relaxed">
                 {challenge.description}
              </div>
              
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 mb-6">
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Expected Behavior</h3>
                 <p className="text-sm text-slate-300 leading-relaxed">
                   {challenge.expectedBehavior || 'Fix the logic to pass all test cases.'}
                 </p>
              </div>

              <div className="mb-6">
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Tags</h3>
                 <div className="flex flex-wrap gap-2">
                    {challenge.tags?.map(t => (
                      <span key={t} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-slate-400 flex items-center gap-1">
                         <Tag className="w-3 h-3" /> {t}
                      </span>
                    ))}
                 </div>
              </div>
           </div>
        </aside>

        {/* CENTER PANEL: EDITOR */}
        <main className="flex-1 flex flex-col relative min-w-0">
           <div className="flex-1 relative bg-[#020617] flex">
              {/* Line numbers fake gutter */}
              <div className="w-12 border-r border-white/5 bg-black/40 text-right pr-2 py-4 font-mono text-sm text-slate-600 select-none hidden sm:block">
                 {code.split('\n').map((_, i) => (
                    <div key={i}>{i + 1}</div>
                 ))}
              </div>
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="flex-1 p-4 bg-transparent font-mono text-sm leading-relaxed text-slate-300 outline-none resize-none selection:bg-brand-primary/20 whitespace-pre"
                style={{ tabSize: 4 }}
              />
           </div>

           {/* BOTTOM PANEL: TERMINAL */}
           <div className="h-64 border-t border-white/5 bg-black/40 flex flex-col shrink-0">
              <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between bg-black/20">
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <TerminalIcon className="w-4 h-4" /> Terminal / Test Results
                 </div>
                 {output.status === 'success' && <span className="text-brand-primary text-xs font-bold">ALL TESTS PASSED</span>}
                 {output.status === 'fail' && <span className="text-red-400 text-xs font-bold">TESTS FAILED</span>}
              </div>
              <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-300 space-y-2">
                 {output.status === 'idle' && (
                    <div className="text-slate-600">No output. Click "Run" to execute tests.</div>
                 )}
                 {output.status === 'running' && (
                    <div className="text-blue-400 animate-pulse flex items-center gap-2">
                       <Loader2 className="w-3 h-3 animate-spin" /> {output.message}
                    </div>
                 )}
                 {(output.status === 'success' || output.status === 'fail') && (
                    <>
                       <div className={output.status === 'success' ? "text-brand-primary font-bold" : "text-red-400 font-bold"}>
                          {output.status === 'success' ? <CheckCircle2 className="w-4 h-4 inline mr-1" /> : <XCircle className="w-4 h-4 inline mr-1" />}
                          {output.message}
                       </div>
                       {output.details && (
                         <pre className="mt-2 text-slate-400 whitespace-pre-wrap font-mono leading-relaxed">
                           {output.details}
                         </pre>
                       )}
                       {output.testResults && output.testResults.length > 0 && (
                         <div className="mt-4 space-y-2">
                           {output.testResults.map((r, i) => (
                              <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-lg flex flex-col gap-2">
                                 <div className="flex items-center gap-2">
                                    {r.status === 'pass' ? <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                                    <span className="font-bold text-slate-300">Test Case {i + 1}</span>
                                    <span className={cn("px-2 py-0.5 rounded text-[10px] uppercase font-bold", r.status === 'pass' ? "bg-brand-primary/20 text-brand-primary" : "bg-red-500/20 text-red-400")}>{r.status}</span>
                                 </div>
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mt-1">
                                    <div className="flex flex-col">
                                       <span className="text-slate-500 mb-1">Input</span>
                                       <code className="text-slate-300 font-mono bg-black/40 px-2 py-1 rounded">{r.input}</code>
                                    </div>
                                    <div className="flex flex-col">
                                       <span className="text-slate-500 mb-1">Expected</span>
                                       <code className="text-slate-300 font-mono bg-black/40 px-2 py-1 rounded">{r.expected}</code>
                                    </div>
                                    <div className="flex flex-col">
                                       <span className="text-slate-500 mb-1">Actual</span>
                                       <code className={cn("font-mono bg-black/40 px-2 py-1 rounded", r.status === 'pass' ? "text-brand-primary" : "text-red-400")}>{r.actual}</code>
                                    </div>
                                 </div>
                              </div>
                           ))}
                         </div>
                       )}
                    </>
                 )}
              </div>
           </div>
        </main>

        {/* RIGHT PANEL: HINTS & AI */}
        <aside className="w-80 border-l border-white/5 flex flex-col bg-black/20 shrink-0 hidden md:flex">
           {/* Hints Section */}
           <div className="p-4 border-b border-white/5 max-h-64 overflow-y-auto">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <Lightbulb className="w-4 h-4 text-yellow-500" /> Unlockable Hints
              </h2>
              <div className="space-y-2">
                 {hints.map((hint, idx) => {
                    const isUnlocked = unlockedHints.includes(idx);
                    return (
                       <div key={idx} className="rounded-lg border border-white/5 bg-white/5 overflow-hidden">
                          <button 
                            onClick={() => !isUnlocked && setUnlockedHints(prev => [...prev, idx])}
                            disabled={isUnlocked}
                            className="w-full px-3 py-2 text-left text-xs font-bold text-slate-400 hover:text-white flex justify-between items-center transition-colors disabled:cursor-default"
                          >
                             <span>Hint Level {hint.level}</span>
                             {!isUnlocked ? <ChevronRight className="w-3 h-3" /> : <Check className="w-3 h-3 text-yellow-500" />}
                          </button>
                          {isUnlocked && (
                             <div className="px-3 pb-3 text-xs text-yellow-500/80 italic leading-relaxed border-t border-white/5 pt-2">
                                {hint.hintText}
                             </div>
                          )}
                       </div>
                    );
                 })}
                 {hints.length === 0 && (
                    <div className="text-xs text-slate-600 italic">No hints available for this challenge.</div>
                 )}
              </div>
           </div>

           {/* AI Assistant Section */}
           <div className="flex-1 flex flex-col min-h-0">
              <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2 bg-black/20">
                 <Sparkles className="w-4 h-4 text-brand-primary" />
                 <h2 className="text-xs font-bold text-brand-primary uppercase tracking-widest">Forge AI Link</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 <div className="flex gap-2">
                    <div className="w-6 h-6 rounded vibe-gradient flex-shrink-0 flex items-center justify-center">
                       <Sparkles className="w-3 h-3 text-brand-secondary" />
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-xs text-slate-300 leading-relaxed border border-white/5">
                       I'm here to help you debug. I won't give you the exact answer, but I can guide you. Ask me anything!
                    </div>
                 </div>
                 {messages.map((msg, i) => (
                    <div key={i} className={cn("flex gap-2", msg.role === 'user' ? "flex-row-reverse" : "")}>
                       <div className={cn(
                         "w-6 h-6 rounded flex-shrink-0 flex items-center justify-center",
                         msg.role === 'user' ? "bg-slate-800" : "vibe-gradient text-brand-secondary"
                       )}>
                          {msg.role === 'user' ? <HelpCircle className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                       </div>
                       <div className={cn(
                         "rounded-lg p-3 text-xs leading-relaxed border max-w-[85%]",
                         msg.role === 'user' ? "bg-brand-primary/10 border-brand-primary/20 text-white" : "bg-white/5 border-white/5 text-slate-300"
                       )}>
                          {msg.content}
                       </div>
                    </div>
                 ))}
                 {isTyping && (
                    <div className="flex gap-2">
                       <div className="w-6 h-6 rounded vibe-gradient flex-shrink-0 flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-brand-secondary" />
                       </div>
                       <div className="bg-white/5 rounded-lg p-3 flex gap-1 items-center border border-white/5">
                          <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" />
                          <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                       </div>
                    </div>
                 )}
              </div>
              <form
                 onSubmit={(e) => { e.preventDefault(); void handleSendMessage(); }}
                 className="p-3 border-t border-white/5 bg-black/40"
              >
                 <div className="relative">
                    <input
                       type="text"
                       value={inputMessage}
                       onChange={(e) => setInputMessage(e.target.value)}
                       placeholder={user ? "Ask a question..." : "Login to use AI"}
                       disabled={!user}
                       className="w-full bg-black border border-white/10 rounded-lg py-2 pl-3 pr-10 outline-none focus:border-brand-primary transition-all text-xs text-white disabled:opacity-50"
                    />
                    <button
                       type="submit"
                       disabled={!user || !inputMessage.trim() || isTyping}
                       className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-brand-primary rounded text-brand-secondary hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
                    >
                       <Send className="w-3 h-3" />
                    </button>
                 </div>
              </form>
           </div>
        </aside>
      </div>
    </div>
  );
};

export default ChallengeDetail;
