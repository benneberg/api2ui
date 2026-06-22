
import React from 'react';
import { motion } from 'motion/react';
import { History, RotateCcw, Check, Clock } from 'lucide-react';
import { type JDCard } from '../types';
import { cn } from '../lib/utils';

interface VersionHistoryProps {
  currentVersion: string;
  history: JDCard[];
  onRevert: (versionIndex: number) => void;
}

export const VersionHistory = ({ currentVersion, history, onRevert }: VersionHistoryProps) => {
  if (!history || history.length === 0) {
    return (
      <div className="bg-white border-2 border-brand-ink p-12 text-center shadow-[8px_8px_0_0_#D1D1D1]">
        <Clock className="mx-auto mb-4 text-gray-300" size={48} />
        <h2 className="font-serif italic text-2xl mb-2">No Version History</h2>
        <p className="text-gray-400 font-mono text-xs uppercase">Modify the artifact to trigger semantic versioning.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="font-serif italic text-4xl mb-1">Version Control</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-tight">Artifact Lineage // Semantic Snapshots</p>
        </div>
      </div>

      <div className="grid gap-4">
        {/* Current Version */}
        <div className="bg-brand-ink text-white p-6 border-2 border-brand-ink shadow-[8px_8px_0_0_#2563EB]">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-brand-accent text-white font-mono text-[10px] font-bold">ACTIVE</span>
                <span className="font-mono text-lg font-bold">v{currentVersion}</span>
              </div>
              <p className="text-gray-400 text-xs italic">Current active state of the JDCard</p>
            </div>
            <Check size={24} className="text-brand-accent" />
          </div>
        </div>

        {/* Previous Versions */}
        {history.map((version, idx) => (
          <motion.div
            key={`${version.version}-${idx}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group bg-white border-2 border-brand-ink p-6 hover:shadow-[8px_8px_0_0_#121212] transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-lg font-bold">v{version.version}</span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {new Date(version.metadata.compiledAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-500 text-xs truncate max-w-md">
                  Intent: {version.contracts.inboundIntent}
                </p>
              </div>
              
              <button
                onClick={() => onRevert(idx)}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-brand-ink font-mono text-[10px] font-bold uppercase hover:bg-brand-ink hover:text-white transition-all shadow-[4px_4px_0_0_#121212]"
              >
                <RotateCcw size={14} />
                Revert
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
