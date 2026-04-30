import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Loader2, Code, Repeat, GitBranch, Box, List, Type, Book, AlertTriangle, Clock, Cpu } from 'lucide-react';
import { bugService } from '../services/bug.service';

interface Category {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const iconMap: Record<string, React.ElementType> = {
  Code,
  Repeat,
  GitBranch,
  Box,
  List,
  Type,
  Book,
  AlertTriangle,
  Clock,
  Cpu
};

const CategoryList = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const data = await bugService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };
    void fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-brand-primary">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-display font-medium">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">The Bug Forge</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Choose a category below to start hunting down subtle bugs and sharpening your debugging instincts.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category, index) => {
          const Icon = iconMap[category.icon] || Code;
          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/find-bug/${category.id}`)}
              className="group p-6 glass-dark rounded-2xl border-white/5 hover:border-brand-primary/30 transition-all cursor-pointer relative overflow-hidden shadow-lg hover:shadow-brand-primary/10"
            >
              <div className="w-12 h-12 rounded-xl vibe-gradient p-[1px] mb-4">
                 <div className="w-full h-full bg-[#020617] rounded-xl flex items-center justify-center group-hover:bg-transparent transition-colors">
                    <Icon className="w-6 h-6 text-brand-primary group-hover:text-[#020617]" />
                 </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-primary transition-colors">{category.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {category.description}
              </p>
            </motion.div>
          );
        })}
        {categories.length === 0 && (
          <div className="col-span-full text-center py-20 text-slate-500">
            No categories available.
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryList;
