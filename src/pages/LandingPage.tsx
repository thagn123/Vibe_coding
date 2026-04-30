import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Bug, Zap, ArrowRight, Github, Code2, Sparkles } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="p-8 rounded-2xl glass-dark hover:border-brand-primary/50 transition-colors"
  >
    <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-6">
      <Icon className="text-brand-primary w-6 h-6" />
    </div>
    <h3 className="text-xl font-display font-bold text-white mb-3">{title}</h3>
    <p className="text-slate-400 leading-relaxed">{description}</p>
  </motion.div>
);

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-brand-primary selection:text-brand-secondary">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-brand-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl vibe-gradient flex items-center justify-center">
            <Terminal className="text-brand-secondary w-6 h-6" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight">VibeCode</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">How it works</a>
          <button 
            onClick={() => navigate('/auth')}
            className="px-5 py-2.5 rounded-full vibe-gradient text-brand-secondary font-bold text-sm hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32 flex flex-col items-center text-center">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
           className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-brand-primary mb-10"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>JOIN THE EVOLUTION OF CODING</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-6xl md:text-8xl font-display font-bold tracking-tight mb-8 leading-[1.1]"
        >
          Code with a <br />
          <span className="text-vibe">New Kind of Vibe.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-slate-400 max-w-2xl mb-12"
        >
          Master bug finding, refine your AI prompts, and sharpen your coding instincts in a high-fidelity learning laboratory.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button 
            onClick={() => navigate('/auth')}
            className="px-8 py-4 rounded-xl vibe-gradient text-brand-secondary font-bold text-lg flex items-center gap-2 hover:scale-105 transition-transform"
          >
            Start Lab Session <ArrowRight className="w-5 h-5" />
          </button>
          <button className="px-8 py-4 rounded-xl glass hover:bg-white/10 font-bold text-lg flex items-center gap-2 transition-all">
            <Github className="w-5 h-5" /> View Project
          </button>
        </motion.div>

        {/* Floating elements teaser */}
        <div className="mt-32 w-full max-w-5xl relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary to-blue-500 rounded-3xl blur opacity-20" />
          <div className="relative rounded-3xl border border-white/10 overflow-hidden bg-slate-900 aspect-video shadow-2xl">
            <div className="p-4 border-b border-white/5 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
              <div className="ml-4 px-3 py-1 rounded-md bg-white/5 text-[10px] font-mono text-slate-500">vibelab_session_01.ts</div>
            </div>
            <div className="p-8 text-left font-mono text-sm leading-relaxed">
              <div className="flex gap-4">
                <span className="text-slate-600">01</span>
                <span><span className="text-purple-400">const</span> <span className="text-blue-400">vibe</span> = <span className="text-orange-400">'coding-evolution'</span>;</span>
              </div>
              <div className="flex gap-4">
                <span className="text-slate-600">02</span>
                <span><span className="text-purple-400">while</span> (true) &#123;</span>
              </div>
              <div className="flex gap-4">
                <span className="text-slate-600">03</span>
                <span className="pl-4">  <span className="text-blue-400">learn</span>(<span className="text-blue-400">vibe</span>);</span>
              </div>
              <div className="flex gap-4">
                <span className="text-slate-600">04</span>
                <span className="pl-4">  <span className="text-green-400">// TODO: Find the bug in your workflow</span></span>
              </div>
              <div className="flex gap-4">
                <span className="text-slate-600">05</span>
                <span>&#125;</span>
              </div>
              <div className="mt-8 flex items-center gap-2 text-brand-primary animate-pulse">
                <Zap className="w-4 h-4" />
                <span>AI Prompt Engineering Lab Active..._</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-32 border-t border-white/5">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-20 excerpt">Engineered for Excellence.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={Bug}
            title="The Bug Forge"
            description="Hunt down subtle bugs in complex codebases. Get AI-powered hints that guide you without giving away the answer."
          />
          <FeatureCard 
            icon={Code2}
            title="Prompt Lab"
            description="Master the art of AI communication. Refine and optimize your prompts to get the perfect results every time."
          />
          <FeatureCard 
            icon={Zap}
            title="Vibe Ranking"
            description="Level up your profile as you solve challenges. Earn XP, badges, and compete with other code-obsessed minds."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 text-center">
        <p className="text-slate-500 text-sm">© 2026 VibeCode Lab. Built for the modern developer.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
