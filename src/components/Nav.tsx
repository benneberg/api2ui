import React from 'react';
import { motion } from 'motion/react';
import { 
  Database, 
  Target, 
  Settings2, 
  Play, 
  Eye, 
  Clock, 
  Undo2, 
  Activity 
} from 'lucide-react';
import { type ViewType } from '../types';
import { cn } from '../lib/utils';

interface NavProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

export const navItems = [
  { id: 'spec' as ViewType, label: 'Ingest', icon: Database },
  { id: 'intent' as ViewType, label: 'Intent', icon: Target },
  { id: 'plan' as ViewType, label: 'Compile', icon: Settings2 },
  { id: 'test' as ViewType, label: 'Test', icon: Activity },
  { id: 'lab' as ViewType, label: 'Lab', icon: Play },
  { id: 'preview' as ViewType, label: 'Preview', icon: Eye },
  { id: 'history' as ViewType, label: 'Runs', icon: Clock },
  { id: 'versions' as ViewType, label: 'Versions', icon: Undo2 },
];

export const Nav = ({ activeView, setActiveView }: NavProps) => {
  return (
    <nav className="flex items-center gap-8 mb-16 border-b border-brand-line pb-4 overflow-x-auto no-scrollbar" id="nav-stepper">
      {navItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            id={`nav-item-${item.id}`}
            onClick={() => setActiveView(item.id)}
            className={cn(
              "group relative flex flex-col items-start gap-1 pb-4 transition-all min-w-[80px]",
              activeView === item.id ? "opacity-100" : "opacity-40 hover:opacity-100"
            )}
          >
            <span className="font-mono text-[10px] font-bold text-brand-line group-hover:text-brand-ink transition-colors">0{idx + 1}</span>
            <span className={cn(
              "text-sm font-bold uppercase tracking-tight flex items-center gap-1.5",
              activeView === item.id ? "text-brand-accent" : "text-brand-ink"
            )}>
              <Icon size={12} className="opacity-70" />
              {item.label}
            </span>
            {activeView === item.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-[-1px] left-0 right-0 h-1 bg-brand-accent"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
