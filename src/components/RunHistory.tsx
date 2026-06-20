
import React from 'react';
import { motion } from 'motion/react';
import { Clock, Play, Trash2, ArrowRight, Zap, Target, Database } from 'lucide-react';
import { runHistoryService, type RunHistoryEntry } from '../services/runHistoryService';
import { cn } from '../lib/utils';

interface RunHistoryProps {
  onReRun: (entry: RunHistoryEntry) => void;
}

export const RunHistory = ({ onReRun }: RunHistoryProps) => {
  const [history, setHistory] = React.useState<RunHistoryEntry[]>([]);

  React.useEffect(() => {
    setHistory(runHistoryService.getHistory());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    runHistoryService.deleteEntry(id);
    setHistory(runHistoryService.getHistory());
  };

  const handleClear = () => {
    if (confirm('Clear all run history?')) {
      runHistoryService.clearHistory();
      setHistory([]);
    }
  };

  if (history.length === 0) {
    return (
      <div className="bg-white border-2 border-brand-ink p-12 text-center shadow-[8px_8px_0_0_#D1D1D1]">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gray-50 border-2 border-brand-ink flex items-center justify-center text-gray-300">
            <Clock size={32} />
          </div>
        </div>
        <h2 className="font-serif italic text-2xl mb-2">No Runs Recorded</h2>
        <p className="text-gray-400 font-mono text-xs uppercase">Complete a graph traversal to see history here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="font-serif italic text-4xl mb-1">Run History</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-tight">Audit Trail // Previous Executions</p>
        </div>
        <button 
          onClick={handleClear}
          className="px-4 py-2 border-2 border-brand-ink bg-white font-mono text-[10px] font-bold uppercase hover:bg-red-50 transition-all shadow-[4px_4px_0_0_#121212]"
        >
          Clear All
        </button>
      </div>

      <div className="grid gap-4">
        {history.map((entry, idx) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative bg-white border-2 border-brand-ink p-6 hover:shadow-[8px_8px_0_0_#2563EB] transition-all cursor-pointer overflow-hidden"
            onClick={() => onReRun(entry)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-brand-ink text-white font-mono text-[9px] uppercase">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                  <span className="mono-label text-[9px] text-gray-400">
                    PROJECT: {entry.projectName}
                  </span>
                </div>
                
                <h3 className="font-bold text-lg mb-2 truncate group-hover:text-brand-accent transition-colors">
                  {entry.intent}
                </h3>

                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Database size={14} />
                    <span className="mono-label text-[10px] uppercase font-bold">
                      {Object.keys(entry.jdCard.executionGraph.nodes).length} Nodes
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <HistorySummary results={entry.executionResults} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={(e) => handleDelete(entry.id, e)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
                <div className="mt-auto opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                  <Play size={20} className="text-brand-accent" />
                </div>
              </div>
            </div>

            {/* Visual breakdown of nodes */}
            <div className="mt-4 pt-4 border-t border-brand-line border-dashed flex gap-1">
              {Object.keys(entry.executionResults).map(nodeId => (
                <div key={nodeId} className="w-2 h-2 bg-brand-accent/20 rounded-full" />
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const HistorySummary = ({ results }: { results: Record<string, any> }) => {
  const nodeCount = Object.keys(results).length;
  return (
    <div className="flex items-center gap-1.5">
      <Zap size={14} className="text-amber-500" />
      <span className="mono-label text-[10px] uppercase font-bold text-amber-600">
        Results Collected: {nodeCount}
      </span>
    </div>
  );
};
