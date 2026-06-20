import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Search,
  RefreshCw,
  Zap
} from 'lucide-react';
import { type Capability, type TestResult } from '../types';
import { cn } from '../lib/utils';
import { executionService } from '../services/executionService';
import { mockDataService } from '../services/mockDataService';

interface TestStageProps {
  capabilities: Capability[];
  onComplete: () => void;
}

export const TestStage = ({ capabilities, onComplete }: TestStageProps) => {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const runSweep = async () => {
    for (const cap of capabilities) {
      if (!cap.isRead) continue; // Only test read operations for safety auto-sweep
      await runTest(cap);
    }
  };

  const runTest = async (cap: Capability) => {
    setTesting(cap.id);
    const start = performance.now();
    
    try {
      // Resolve path parameters for the health check
      let testInput: any = {};
      const pathParams = cap.path.match(/\{([^}]+)\}/g);
      if (pathParams) {
        pathParams.forEach(param => {
          const key = param.replace(/[{}]/g, '');
          // Identify the schema for this parameter if possible (usually in inputSchema)
          const paramSchema = cap.inputSchema?.properties?.[key] || { type: 'string' };
          testInput[key] = mockDataService.generateObject(paramSchema);
        });
      }

      // Create a mock node for execution service
      const node: any = {
        id: `test-${cap.id}`,
        capability: cap,
        verb: cap.method,
        path: cap.path,
        type: cap.isRead ? 'READ' : 'MUTATION',
        parameters: testInput
      };
      
      const data = await executionService.executeRequest(node, testInput, false);
      const latency = Math.round(performance.now() - start);
      
      setResults(prev => ({
        ...prev,
        [cap.id]: {
          capabilityId: cap.id,
          status: 'SUCCESS',
          latency,
          statusCode: 200 // Assumed if data comes back from proxy
        }
      }));
    } catch (err: any) {
      const latency = Math.round(performance.now() - start);
      setResults(prev => ({
        ...prev,
        [cap.id]: {
          capabilityId: cap.id,
          status: 'FAILURE',
          latency,
          error: err.message
        }
      }));
    } finally {
      setTesting(null);
    }
  };

  const filtered = capabilities.filter(c => 
    c.id.toLowerCase().includes(filter.toLowerCase()) || 
    c.summary.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="bg-white border-2 border-brand-ink p-8 shadow-[8px_8px_0_0_#D1D1D1]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="font-serif italic text-4xl mb-4">Diagnostics Lab</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-tight">Stage 04 // Endpoint Health & Latency Monitoring</p>
        </div>
        <button 
          onClick={runSweep}
          disabled={!!testing}
          className="px-6 py-3 bg-brand-accent text-white font-bold uppercase tracking-widest text-[10px] shadow-[4px_4px_0_0_#121212] hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2"
        >
          {testing ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
          Perform Auto Sweep
        </button>
      </div>

      <div className="mb-6 relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <Search size={16} />
        </div>
        <input 
          placeholder="FILTER_CAPABILITY_GRAPH..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-brand-line focus:border-brand-ink focus:outline-none font-mono text-xs"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
        {filtered.map((cap) => {
          const res = results[cap.id];
          return (
            <div 
              key={cap.id}
              className={cn(
                "border-2 p-4 transition-all group relative",
                testing === cap.id ? "border-brand-accent bg-brand-accent/5" : 
                res?.status === 'SUCCESS' ? "border-green-500 bg-green-50/30" :
                res?.status === 'FAILURE' ? "border-red-500 bg-red-50/30" : "border-brand-line hover:border-brand-ink"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="max-w-[80%]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "font-mono text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase",
                      cap.isRead ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                    )}>
                      {cap.method}
                    </span>
                    <code className="text-[10px] font-bold text-gray-400 truncate">{cap.id}</code>
                  </div>
                  <h4 className="font-bold text-sm truncate uppercase tracking-tight">{cap.summary}</h4>
                </div>
                <button 
                  onClick={() => runTest(cap)}
                  disabled={testing === cap.id}
                  className="p-2 border border-brand-line hover:bg-brand-ink hover:text-white transition-all disabled:opacity-30"
                >
                  <Activity size={14} />
                </button>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-gray-400" />
                  <span className="font-mono text-[10px] text-gray-500">
                    {res ? `${res.latency}ms` : '---'}
                  </span>
                </div>
                {res && (
                  <div className="flex items-center gap-2">
                    {res.status === 'SUCCESS' ? (
                      <CheckCircle2 size={12} className="text-green-600" />
                    ) : (
                      <AlertTriangle size={12} className="text-red-500" />
                    )}
                    <span className={cn(
                      "font-mono text-[10px] font-bold",
                      res.status === 'SUCCESS' ? "text-green-600" : "text-red-500"
                    )}>
                      {res.status === 'SUCCESS' ? 'HEALTHY' : 'FAULT'}
                    </span>
                  </div>
                )}
              </div>

              {res?.error && (
                <div className="mt-3 p-2 bg-red-100/50 border border-red-200 text-[9px] font-mono text-red-600 break-all">
                  ERROR: {res.error}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-8 border-t-2 border-brand-line border-dashed flex justify-end">
        <button 
          onClick={onComplete}
          className="px-8 py-4 bg-brand-ink text-white font-bold uppercase tracking-widest text-xs hover:bg-brand-accent transition-all flex items-center gap-3"
        >
          Confirm Diagnostics & Proceed
          <RefreshCw size={16} />
        </button>
      </div>
    </div>
  );
};
