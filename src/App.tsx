/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  Target, 
  Settings2, 
  Play, 
  Eye, 
  Shield, 
  ShieldAlert, 
  ArrowRight,
  RefreshCw,
  Search,
  Code2,
  Table as TableIcon,
  ChevronRight,
  Info,
  Download,
  CheckCircle,
  FileJson,
  Undo2,
  Redo2,
  AlertCircle,
  Library,
  Plus,
  Trash2,
  X,
  ExternalLink,
  Save,
  Activity,
  Cpu,
  Globe,
  Zap,
  Layout,
  Edit3
} from 'lucide-react';
import { openApiService } from './services/openapiService';
import { inferenceService } from './services/geminiService';
import { compilerService } from './services/compilerService';
import { projectService } from './services/projectService';
import { exportService } from './services/exportService';
import { validateJdCard } from './services/validationService';
import { type Capability, type Intent, type jdCard, type ViewType, type Project, type AIProvider } from './types';
import { cn } from './lib/utils';
import { Toasts, type Toast } from './components/Toasts';
import { useHistory } from './hooks/useHistory';
import { ProjectionRenderer, SchemaForm } from './components/ProjectionRenderer';
import { FlowVisualizer } from './components/FlowVisualizer';
import { TestStage } from './components/TestStage';
import { mockDataService } from './services/mockDataService';
import { executionService } from './services/executionService';

const INTENT_TEMPLATES = [
  { label: 'Resource Discovery', value: "Find all 'available' items and list their core attributes." },
  { label: 'Status Audit', value: "Execute a health sweep across all endpoints and report non-200 statuses." },
  { label: 'Data Aggregate', value: "Fetch all entities, group them by category, and calculate summary statistics." },
  { label: 'Security Audit', value: "Identify all endpoints that mark sensitive fields as required." },
];

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>('spec');
  const [specUrl, setSpecUrl] = useState('https://petstore3.swagger.io/api/v3/openapi.json');
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [isIngesting, setIsIngesting] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [intent, setIntent] = useState<Intent | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  
  // Project Management
  const [projectName, setProjectName] = useState('Untitled Project');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isRealExecution, setIsRealExecution] = useState(false);
  
  // History controlled jdCard
  const { 
    current: jdCard, 
    push: pushToHistory, 
    undo, 
    redo, 
    canUndo, 
    canRedo,
    history,
    index
  } = useHistory<jdCard | null>(null);

  useEffect(() => {
    setProjects(projectService.getAllProjects());
  }, []);

  const handleNewProject = () => {
    setProjectName('Untitled Project');
    setJobDescription('');
    setIntent(null);
    setCapabilities([]);
    pushToHistory(null);
    setActiveView('spec');
    addToast("New Project Workspace Initialized", "info");
  };

  const handleSaveProject = () => {
    const saved = projectService.saveProject(projectName, jdCard);
    setProjects(projectService.getAllProjects());
    addToast(`Project "${projectName}" Persisted`, "success");
  };

  const loadProject = (p: Project) => {
    setProjectName(p.name);
    if (p.jdCard) {
      setIntent(p.jdCard.intent);
      setSpecUrl(p.jdCard.metadata.specUrl);
      pushToHistory(p.jdCard);
    }
    setLibraryOpen(false);
    setActiveView('preview');
    addToast(`Loaded ${p.name}`, "info");
  };

  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((message: string, type: Toast['type'] = 'info', details?: string[]) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type, details }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const [writeEnabled, setWriteEnabled] = useState(false);
  const [showWriteConfirm, setShowWriteConfirm] = useState(false);
  const [specValidationErrors, setSpecValidationErrors] = useState<string[]>([]);
  const [repairReport, setRepairReport] = useState<any>(null);
  const [autoFixEnabled, setAutoFixEnabled] = useState(true);
  const [nodeInputs, setNodeInputs] = useState<Record<string, any>>({});
  const [configuringNode, setConfiguringNode] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<any[]>([]);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [llmModel, setLlmModel] = useState('gemini-3.5-flash');
  const [aiProvider, setAiProvider] = useState<AIProvider>('gemini');
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleIngest = async () => {
    setIsIngesting(true);
    setError(null);
    setSpecValidationErrors([]);
    setRepairReport(null);
    try {
      const { capabilities: caps, validationErrors, repairReport: report } = await openApiService.fetchAndNormalize(specUrl, autoFixEnabled);
      setCapabilities(caps);
      setRepairReport(report);
      
      if (validationErrors && validationErrors.length > 0) {
        setSpecValidationErrors(validationErrors);
      }

      if (report.issues.length > 0) {
        addToast(`Repair Report Generated: ${report.issues.length} issues identified`, "info");
      } else {
        addToast("Capability Graph Synchronized", "success");
        setActiveView('intent');
      }
    } catch (err) {
      setError("Failed to ingest spec. Check the URL or CORS settings.");
      addToast("Spec Ingestion Failed", "error");
    } finally {
      setIsIngesting(false);
    }
  };

  const toggleWriteMode = () => {
    if (!writeEnabled) {
      setShowWriteConfirm(true);
    } else {
      setWriteEnabled(false);
    }
  };

  const confirmWriteMode = () => {
    setWriteEnabled(true);
    setShowWriteConfirm(false);
  };

  useEffect(() => {
    const fetchModels = async () => {
      setIsLoadingModels(true);
      try {
        const models = await inferenceService.fetchModels(aiProvider);
        setAvailableModels(models);
        if (models.length > 0) {
          // Keep current model if it exists in new list, else pick first
          if (!models.find(m => m.id === llmModel)) {
            setLlmModel(models[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch models", err);
      } finally {
        setIsLoadingModels(false);
      }
    };
    fetchModels();
  }, [aiProvider]);

  const handleExtractIntent = async () => {
    if (!jobDescription) return;
    setIsExtracting(true);
    setError(null);
    try {
      const extractedIntent = await inferenceService.extractIntent(jobDescription, capabilities, aiProvider, llmModel, customApiKey);
      setIntent(extractedIntent);
      addToast("Intent Decoded Successfully", "success");
      setActiveView('plan');
    } catch (err: any) {
      setError(err.message || "Failed to extract intent.");
      addToast("AI Generation Failed", "error");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCompile = () => {
    if (!intent) return;
    const compiled = compilerService.compile(intent, capabilities, writeEnabled, nodeInputs);
    compiled.metadata.specUrl = specUrl;
    
    // Validate artifact against formal schema
    const { valid, errors } = validateJdCard(compiled);
    if (!valid) {
      console.error("jdCard Validation Errors:", errors);
      const errorDetails = errors?.map(e => `${e.instancePath || 'root'} ${e.message}`);
      addToast("Schema Validation Failed", "error", errorDetails);
      return;
    }

    pushToHistory(compiled);
    addToast("jdCard Artifact Compiled & Validated", "success");
    setActiveView('test');
  };

  const runExecution = async () => {
    if (!jdCard) return;
    setIsExecuting(true);
    setExecutionLogs([]);
    setExecutionResult([]);
    
    const results = [];
    for (const node of jdCard.execution.nodes) {
      const typeLabel = node.capability.isRead ? "READ" : "MUTATION";
      const safetyStatus = node.capability.isRead || writeEnabled ? "SAFE" : "BLOCKED";
      
      setExecutionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] INITIATING_NODE: ${node.id} (${typeLabel})`]);
      await new Promise(resolve => setTimeout(resolve, isRealExecution ? 200 : 800));
      
      if (safetyStatus === "BLOCKED") {
        setExecutionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] FAULT: Node ${node.id} is a MUTATION and Write Session is DISABLED. Skipping.`]);
        continue;
      }
      
      try {
        let data;
        if (isRealExecution) {
          data = await executionService.executeNode(node, writeEnabled);
        } else {
          data = mockDataService.generateFromSchema(node.capability.outputSchema);
        }

        const res = {
          step: node.id,
          endpoint: node.capability.path,
          data
        };
        
        results.push(res);
        setExecutionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ NODE_RESOLVED: ${node.id}`]);
      } catch (err: any) {
        setExecutionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ❌ NODE_FAULT: ${node.id}`]);
        setExecutionLogs(prev => [...prev, `    > CAUSE: ${err.message}`]);
        if (isRealExecution) {
          setExecutionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ⏹ HALTING_EXECUTION: Real-world fault detected.`]);
          break; 
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    setExecutionResult(results);
    setIsExecuting(false);
    setExecutionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] SEQUENCE_TERMINATED: READY_FOR_PROJECTION`]);
    
    setTimeout(() => {
      setActiveView('preview');
    }, 1000);
  };

  const navItems: { id: ViewType; label: string; icon: any }[] = [
    { id: 'spec', label: 'Ingest', icon: Database },
    { id: 'intent', label: 'Intent', icon: Target },
    { id: 'plan', label: 'Compile', icon: Settings2 },
    { id: 'test', label: 'Test', icon: Activity },
    { id: 'lab', label: 'Lab', icon: Play },
    { id: 'preview', label: 'Preview', icon: Eye },
  ];

  return (
    <div className="min-h-screen bg-brand-bg text-brand-ink font-sans selection:bg-brand-accent selection:text-white overflow-x-hidden">
      {/* Header */}
      <header className="border-b-2 border-brand-ink bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setLibraryOpen(true)}
              className="p-2.5 border-2 border-brand-ink bg-gray-50 hover:bg-brand-ink hover:text-white transition-all shadow-[4px_4px_0_0_#121212]"
            >
              <Library size={20} />
            </button>
            <div className="w-12 h-12 border-2 border-brand-ink flex items-center justify-center bg-brand-ink text-white shadow-[4px_4px_0_0_#D1D1D1] rounded-lg">
              <Cpu size={26} />
            </div>
            <div className="hidden sm:block">
              <input 
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="text-2xl font-serif italic tracking-tighter text-brand-ink focus:outline-none bg-transparent w-full md:w-auto"
              />
              <div className="flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", jdCard ? "bg-green-500" : "bg-orange-400")} />
                <span className="mono-label text-[9px]">ENGINE_STATUS: {jdCard ? 'ARTIFACT_COMPILED' : 'DRAFT_SPEC'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleSaveProject}
              className="px-3 py-2 border-2 border-brand-ink bg-white font-mono text-[10px] font-bold tracking-widest uppercase transition-all shadow-[2px_2px_0_0_#121212] flex items-center gap-2"
            >
              <Save size={14} />
              Save
            </button>
            <div className="hidden md:flex items-center border-2 border-brand-ink bg-gray-50 h-10 shadow-[4px_4px_0_0_#D1D1D1]">
              <button 
                onClick={undo}
                disabled={!canUndo}
                className="px-3 border-r border-brand-ink hover:bg-brand-accent hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit transition-colors"
                title="Undo (Prev State)"
              >
                <Undo2 size={16} />
              </button>
              <button 
                onClick={redo}
                disabled={!canRedo}
                className="px-3 hover:bg-brand-accent hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit transition-colors"
                title="Redo (Next State)"
              >
                <Redo2 size={16} />
              </button>
            </div>

            <button 
              onClick={toggleWriteMode}
              className={cn(
                "px-4 py-2 border-2 border-brand-ink font-mono text-[11px] font-bold tracking-widest uppercase transition-all shadow-[4px_4px_0_0_#121212] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#121212]",
                writeEnabled ? "bg-red-500 text-white" : "bg-white text-brand-ink"
              )}
            >
              {writeEnabled ? 'MUTATION_WRITE_ENABLED' : 'MODE_READ_ONLY'}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Library */}
      <AnimatePresence>
        {libraryOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLibraryOpen(false)}
              className="fixed inset-0 bg-brand-ink/60 backdrop-blur-sm z-[60]"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-full max-w-sm bg-white border-r-4 border-brand-ink z-[70] p-8 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-12">
                <h2 className="font-serif italic text-3xl">Library</h2>
                <button onClick={() => setLibraryOpen(false)} className="p-2 hover:bg-gray-100"><X size={24} /></button>
              </div>

              <button 
                onClick={handleNewProject}
                className="w-full border-2 border-brand-ink py-4 mb-8 font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-accent hover:text-white transition-all shadow-[4px_4px_0_0_#121212]"
              >
                <Plus size={18} />
                New Project
              </button>

              <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
                <span className="mono-label">Local Snapshots</span>
                {projects.map(p => (
                  <div key={p.id} className="group relative border-2 border-brand-line p-4 hover:border-brand-ink transition-all">
                    <button 
                      onClick={() => loadProject(p)}
                      className="w-full text-left"
                    >
                      <h4 className="font-bold uppercase tracking-tight text-sm mb-1">{p.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="mono-label text-[9px]">{new Date(p.updatedAt).toLocaleDateString()}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="mono-label text-[9px]">{p.jdCard?.execution.nodes.length || 0} Nodes</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => {
                        projectService.deleteProject(p.id);
                        setProjects(projectService.getAllProjects());
                      }}
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Navigation Stepper - Vertical Rule Style */}
        <nav className="flex items-center gap-8 mb-16 border-b border-brand-line pb-4 overflow-x-auto no-scrollbar">
          {navItems.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "group relative flex flex-col items-start gap-1 pb-4 transition-all min-w-[80px]",
                activeView === item.id ? "opacity-100" : "opacity-40 hover:opacity-100"
              )}
            >
              <span className="font-mono text-[10px] font-bold text-brand-line group-hover:text-brand-ink transition-colors">0{idx + 1}</span>
              <span className={cn(
                "text-sm font-bold uppercase tracking-tight",
                activeView === item.id ? "text-brand-accent" : "text-brand-ink"
              )}>
                {item.label}
              </span>
              {activeView === item.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-[-1px] left-0 right-0 h-1 bg-brand-accent"
                />
              )}
            </button>
          ))}
        </nav>

        {/* Global Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white border-2 border-red-500 p-6 mb-8 text-sm flex items-start gap-4 shadow-[4px_4px_0_0_#ef4444]"
            >
              <ShieldAlert className="text-red-500 flex-shrink-0" size={24} />
              <div>
                <div className="font-bold uppercase tracking-widest text-red-500 mb-1">Critical Fault</div>
                <p className="font-mono">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="ml-auto mono-label hover:underline">Dismiss</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-12 gap-8">
          {/* Main Stage */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <AnimatePresence mode="wait">
              {activeView === 'spec' && (
                <motion.div
                  key="spec"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white border-2 border-brand-ink p-8 shadow-[8px_8px_0_0_#D1D1D1]"
                >
                  <div className="mb-8">
                    <h2 className="font-serif italic text-4xl mb-4">Capability Discovery</h2>
                    <p className="text-gray-500 font-mono text-xs uppercase tracking-tight">Stage 01 // Normalize & Map OpenAPI Surface</p>
                  </div>

                  <div className="space-y-6">
                    {specValidationErrors.length > 0 && (
                      <div className="border-2 border-amber-500 p-4 bg-amber-50">
                        <div className="flex items-center gap-2 text-amber-700 font-bold uppercase text-[10px] mb-2">
                          <Settings2 size={12} />
                          Spec Validation Warnings
                        </div>
                        <ul className="space-y-1">
                          {specValidationErrors.map((err, i) => (
                            <li key={i} className="font-mono text-[10px] text-amber-600 flex items-start gap-2">
                              <span>→</span>
                              <span>{err}</span>
                            </li>
                          ))}
                        </ul>
                        <button 
                          onClick={() => setActiveView('intent')}
                          className="mt-4 px-4 py-1.5 bg-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider hover:bg-amber-300 transition-all border border-amber-400"
                        >
                          Ignore & Continue
                        </button>
                      </div>
                    )}

                    <div className="technical-grid">
                      <div className="p-4 bg-gray-50 flex items-center gap-3 border-b border-brand-line">
                        <Database size={16} />
                        <span className="mono-label">Schema Source Endpoint</span>
                      </div>
                      <input 
                        type="url" 
                        value={specUrl}
                        onChange={(e) => setSpecUrl(e.target.value)}
                        className="w-full p-4 bg-white font-mono text-sm focus:outline-none placeholder:text-gray-300"
                        placeholder="SOURCE_URL"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="autofix" 
                        checked={autoFixEnabled} 
                        onChange={(e) => setAutoFixEnabled(e.target.checked)}
                        className="accent-brand-accent"
                      />
                      <label htmlFor="autofix" className="mono-label cursor-pointer select-none">Enable Heuristic Auto-Fix Engine</label>
                    </div>
                    
                    <button 
                      onClick={handleIngest}
                      disabled={isIngesting}
                      className="w-full bg-brand-ink text-white font-bold py-6 uppercase tracking-[0.2em] hover:bg-brand-accent transition-all active:translate-y-1"
                    >
                      {isIngesting ? <RefreshCw className="animate-spin mx-auto" /> : "Build Capability Graph"}
                    </button>

                    {repairReport && (
                      <div className="mt-8 border-2 border-brand-ink p-6 bg-gray-50 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between border-b border-brand-line pb-4">
                          <div className="flex items-center gap-2 text-brand-ink font-bold uppercase text-xs">
                            <RefreshCw size={14} className={cn(autoFixEnabled && "text-brand-accent animate-[spin_3s_linear_infinite]")} />
                            Ingestion Repair Report
                          </div>
                          <div className="mono-label text-[9px] bg-white border px-2 py-0.5">
                            FOUND: {repairReport.issues.length} // REPAIRED: {repairReport.fixedIssues}
                          </div>
                        </div>
                        
                        {repairReport.issues.length > 0 ? (
                          <div className="max-h-[300px] overflow-y-auto space-y-3 no-scrollbar">
                            {repairReport.issues.map((issue: any, i: number) => (
                              <div key={i} className="bg-white border border-brand-line p-3 text-[10px] shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded-sm font-bold uppercase text-[8px]",
                                    issue.severity === 'HIGH' ? "bg-red-100 text-red-700" :
                                    issue.severity === 'MEDIUM' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                                  )}>
                                    {issue.severity}_{issue.type}
                                  </span>
                                  <span className="text-gray-400 font-mono text-[8px] italic truncate ml-4">@{issue.location}</span>
                                </div>
                                <p className="text-gray-700 mb-2 leading-relaxed">{issue.message}</p>
                                {issue.heuristic && (
                                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dashed border-gray-100">
                                    <Zap size={10} className="text-brand-accent" />
                                    <span className="font-mono text-gray-400 uppercase text-[8px]">Heuristic: {issue.heuristic}</span>
                                    <div className="ml-auto flex items-center gap-1 font-mono text-brand-accent text-[8px]">
                                      <ChevronRight size={10} />
                                      <span className="font-bold">Suggestion: {typeof issue.suggestion === 'object' ? 'JSON_BODY' : issue.suggestion}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-8 text-center bg-white border border-brand-line border-dashed">
                            <CheckCircle size={24} className="mx-auto text-green-500 mb-2" />
                            <p className="font-mono text-[10px] text-gray-400 uppercase">Spec Integrity Verified // No issues detected</p>
                          </div>
                        )}
                        
                        <button 
                          onClick={() => setActiveView('intent')}
                          className="w-full bg-brand-ink text-white font-bold py-3 uppercase tracking-widest text-[10px] hover:bg-brand-accent transition-all shadow-[4px_4px_0_0_#D1D1D1]"
                        >
                          Acknowledge & Proceed
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeView === 'intent' && (
                <motion.div
                  key="intent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white border-2 border-brand-ink p-8 shadow-[8px_8px_0_0_#D1D1D1]"
                >
                  <div className="mb-8">
                    <h2 className="font-serif italic text-4xl mb-4">Intent Definition</h2>
                    <p className="text-gray-500 font-mono text-xs uppercase tracking-tight">Stage 02 // Semantic Intent Analysis</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="mono-label">Intention Blueprints</span>
                      <div className="flex flex-wrap gap-2">
                        {INTENT_TEMPLATES.map((tmpl, i) => (
                          <button
                            key={i}
                            onClick={() => setJobDescription(tmpl.value)}
                            className="px-3 py-1.5 border border-brand-line font-mono text-[10px] uppercase hover:bg-brand-accent hover:border-brand-accent hover:text-white transition-all bg-gray-50/50"
                          >
                            {tmpl.label}
                          </button>
                        ))}
                      </div>
                    </div>                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="technical-grid">
                        <div className="p-3 bg-gray-50 flex items-center justify-between border-b border-brand-line">
                          <div className="flex items-center gap-2">
                            <Cpu size={14} />
                            <span className="mono-label">AI Engine Provider</span>
                          </div>
                        </div>
                        <div className="flex p-1 bg-white">
                          {(['gemini', 'openrouter', 'groq'] as AIProvider[]).map(p => (
                            <button
                              key={p}
                              onClick={() => setAiProvider(p)}
                              className={cn(
                                "flex-1 py-2 font-mono text-[10px] uppercase tracking-tighter transition-all",
                                aiProvider === p ? "bg-brand-ink text-white font-bold" : "text-gray-400 hover:text-brand-ink hover:bg-gray-100"
                              )}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="technical-grid">
                        <div className="p-3 bg-gray-50 flex items-center gap-2 border-b border-brand-line">
                          <Zap size={14} />
                          <span className="mono-label">Preferred Model</span>
                        </div>
                        <div className="relative">
                          <select 
                            value={llmModel}
                            onChange={(e) => setLlmModel(e.target.value)}
                            disabled={isLoadingModels}
                            className="w-full p-3 font-mono text-xs focus:outline-none bg-white appearance-none cursor-pointer"
                          >
                            {availableModels.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                          {isLoadingModels && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <RefreshCw size={12} className="animate-spin text-brand-accent" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="technical-grid">
                      <div className="p-3 bg-gray-50 flex items-center gap-2 border-b border-brand-line">
                        <Shield size={14} />
                        <span className="mono-label">{aiProvider.toUpperCase()}_API_KEY (PERSISTED_SECURELY)</span>
                      </div>
                      <input 
                        type="password"
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        placeholder={`INPUT_${aiProvider.toUpperCase()}_AUTHORIZATION_TOKEN`}
                        className="w-full p-3 font-mono text-xs focus:outline-none bg-white"
                      />
                    </div>

                    <div className="technical-grid">
                      <div className="p-4 bg-gray-50 flex items-center gap-3 border-b border-brand-line">
                        <Target size={16} />
                        <span className="mono-label">Natural Language Request</span>
                      </div>
                      <textarea 
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        className="w-full p-6 bg-white font-mono text-sm focus:outline-none min-h-[160px] leading-relaxed"
                        placeholder="INPUT_INTENT_DESCRIPTION"
                      />
                    </div>
                    
                    <button 
                      onClick={handleExtractIntent}
                      disabled={isExtracting || capabilities.length === 0}
                      className="w-full bg-brand-ink text-white font-bold py-6 uppercase tracking-[0.2em] hover:bg-brand-accent transition-all active:translate-y-1"
                    >
                      {isExtracting ? <RefreshCw className="animate-spin mx-auto" /> : "Extract & Rank"}
                    </button>
                  </div>
                </motion.div>
              )}

              {activeView === 'plan' && (
                <motion.div
                  key="plan"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white border-2 border-brand-ink p-8 shadow-[8px_8px_0_0_#D1D1D1]"
                >
                  <div className="mb-8">
                    <h2 className="font-serif italic text-4xl mb-4">Compiler Verification</h2>
                    <p className="text-gray-500 font-mono text-xs uppercase tracking-tight">Stage 03 // Deterministic Graph Assembly</p>
                  </div>

                  <div className="space-y-6">
                    {intent?.selectedCapabilities.map((capId, idx) => {
                      const capability = capabilities.find(c => c.id === capId);
                      const hasProperties = capability?.inputSchema?.properties && Object.keys(capability.inputSchema.properties).length > 0;
                      const hasPathParams = capability?.path.includes('{');
                      const isParameterized = capability && (hasProperties || hasPathParams);
                      const isConfiguring = configuringNode === capId;
                      
                      return (
                        <div key={idx} className="space-y-4">
                          <div className={cn(
                            "flex items-center border-2 border-brand-ink transition-all",
                            isConfiguring ? "bg-gray-50 shadow-[4px_4px_0_0_#121212]" : "hover:bg-gray-50 border-brand-line"
                          )}>
                            <div className="w-12 h-12 bg-gray-50 flex items-center justify-center font-mono text-xs border-r-2 border-brand-ink font-bold">
                              {idx + 1}
                            </div>
                            <div className="flex-1 px-4 py-3">
                              <code className="text-xs font-bold text-brand-accent block truncate">{capId}</code>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="mono-label text-[9px]">
                                  STATE: {nodeInputs[capId] ? 'BINDING_RESOLVED' : (isParameterized ? 'AWAITING_AUTHORIZATION_PARAMS' : 'UNBOUND_NODE')}
                                </span>
                                {isParameterized && !nodeInputs[capId] && <Zap size={10} className="text-brand-accent animate-pulse" />}
                                {nodeInputs[capId] && <CheckCircle size={10} className="text-green-500" />}
                              </div>
                            </div>
                            
                            {isParameterized ? (
                              <button 
                                onClick={() => setConfiguringNode(isConfiguring ? null : capId)}
                                className={cn(
                                  "px-6 h-12 border-l-2 border-brand-ink font-mono text-[10px] font-bold uppercase transition-all flex items-center gap-2",
                                  isConfiguring ? "bg-brand-ink text-white" : "hover:bg-brand-accent hover:text-white"
                                )}
                              >
                                <Edit3 size={14} />
                                {isConfiguring ? 'CANCEL' : 'CONFIGURE'}
                              </button>
                            ) : (
                              <div className="px-6 h-12 border-l border-brand-line flex items-center bg-gray-50">
                                <Activity size={14} className="text-gray-300" />
                              </div>
                            )}
                          </div>

                          <AnimatePresence>
                            {isConfiguring && capability && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-x-2 border-b-2 border-brand-ink"
                              >
                                <div className="p-8 bg-white space-y-6">
                                  <div className="flex items-center gap-3 border-b-2 border-brand-ink pb-4 mb-2">
                                    <div className="w-8 h-8 bg-brand-ink text-white flex items-center justify-center font-mono text-xs">
                                      CFG
                                    </div>
                                    <h3 className="font-serif italic text-xl">Parameter Mapping</h3>
                                  </div>
                                  <SchemaForm 
                                    title={`Parameters: ${capability.summary}`}
                                    schema={capability.inputSchema || { type: 'object', properties: {} }}
                                    onSubmit={(data) => {
                                      setNodeInputs(prev => ({ ...prev, [capId]: data }));
                                      setConfiguringNode(null);
                                      addToast(`Parameters mapped to ${capId}`, "success");
                                    }}
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}

                    <button 
                      onClick={handleCompile}
                      className="w-full bg-brand-accent text-white font-bold py-6 uppercase tracking-[0.2em] mt-8 shadow-[4px_4px_0_0_#121212] active:shadow-none active:translate-y-1 transition-all"
                    >
                      Assemble jdCard Artifact
                    </button>
                  </div>
                </motion.div>
              )}

              {activeView === 'test' && (
                <motion.div
                  key="test"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <TestStage 
                    capabilities={capabilities} 
                    onComplete={() => setActiveView('lab')} 
                  />
                </motion.div>
              )}

              {activeView === 'lab' && (
                <motion.div
                  key="lab"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  <div className="bg-white border-2 border-brand-ink p-8 shadow-[8px_8px_0_0_#D1D1D1]">
                    <div className="mb-8">
                      <h2 className="font-serif italic text-4xl mb-4">Execution Runtime</h2>
                      <div className="flex items-center justify-between mb-8">
                        <p className="text-gray-500 font-mono text-xs uppercase tracking-tight">Stage 04 // Graph Traversal Lab</p>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <span className={cn("mono-label transition-colors", !isRealExecution ? "text-brand-accent font-bold" : "text-gray-400 group-hover:text-brand-ink")}>Simulation</span>
                            <div 
                              onClick={() => setIsRealExecution(!isRealExecution)}
                              className="w-10 h-5 bg-gray-200 border-2 border-brand-ink relative shadow-[1px_1px_0_0_#121212]"
                            >
                              <div className={cn(
                                "absolute top-0 bottom-0 w-4 bg-brand-ink transition-all",
                                isRealExecution ? "right-0" : "left-0"
                              )} />
                            </div>
                            <span className={cn("mono-label transition-colors", isRealExecution ? "text-brand-accent font-bold" : "text-gray-400 group-hover:text-brand-ink")}>Live Host</span>
                          </label>
                        </div>
                      </div>
                      
                      {jdCard && (
                        <div className="mb-8">
                          <FlowVisualizer jdCard={jdCard} />
                        </div>
                      )}
                    </div>

                    <div className="bg-[#121212] p-6 text-white font-mono text-[11px] leading-relaxed relative overflow-hidden min-h-[300px]">
                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Code2 size={120} />
                      </div>
                      <div className="flex items-center gap-2 mb-4 text-[#00FF00]">
                        <div className={cn("w-2 h-2 bg-[#00FF00] rounded-full", isExecuting && "animate-pulse")} />
                        <span className="tracking-widest uppercase">system.log</span>
                      </div>
                      <div className="space-y-1">
                        {executionLogs.map((log, i) => (
                          <div key={i} className={cn(
                            "opacity-0 animate-in fade-in slide-in-from-left-2 duration-300 fill-mode-forwards",
                            log.includes('COMPLETE') ? "text-blue-400" :
                            log.includes('TERMINATED') ? "text-yellow-400" : "text-gray-400"
                          )}>
                            {log}
                          </div>
                        ))}
                        {isExecuting && (
                          <div className="text-[#00FF00] mt-2 animate-pulse">_ EXECUTION_IN_PROGRESS ...</div>
                        )}
                        {!isExecuting && executionLogs.length === 0 && (
                          <div className="text-gray-600 italic">SYSTEM_READY // AWAIT_INITIALIZATION</div>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={runExecution}
                      disabled={isExecuting}
                      className={cn(
                        "w-full font-bold py-6 mt-8 uppercase tracking-[0.2em] transition-all",
                        isExecuting ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-brand-ink text-white hover:bg-brand-accent shadow-[4px_4px_0_0_#121212] active:translate-y-1 active:shadow-none"
                      )}
                    >
                      {isExecuting ? "Sequence Active ..." : isRealExecution ? "Initialize Live Sequence" : "Initialize Simulation"}
                    </button>
                  </div>
                </motion.div>
              )}

              {activeView === 'preview' && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  <div className="bg-white border-2 border-brand-ink p-8 shadow-[8px_8px_0_0_#D1D1D1]">
                    <div className="mb-8 flex justify-between items-end">
                      <div>
                        <h2 className="font-serif italic text-4xl mb-2">UI Projection</h2>
                        <p className="text-gray-500 font-mono text-xs uppercase tracking-tight">Stage 05 // Schema Surface Interface</p>
                      </div>
                      <div className="mono-label bg-gray-100 px-2 py-1">Active_Projectors: {executionResult.length}</div>
                    </div>

                    <div className="space-y-12">
                      {executionResult.length > 0 ? (
                        <div className="space-y-12">
                          {executionResult.map((res, i) => (
                            <ProjectionRenderer key={i} result={res} />
                          ))}
                        </div>
                      ) : (
                        <div className="py-20 border-2 border-dashed border-brand-line flex flex-col items-center justify-center text-gray-300 italic font-serif">
                          No experimental data collected yet.
                        </div>
                      )}

                      {/* Input Mutations (Forms) inferred from jdCard */}
                      {jdCard && jdCard.execution.nodes.filter(n => !n.capability.isRead).length > 0 && (
                        <div className="space-y-8 pt-12 border-t-2 border-brand-line border-dashed">
                          <div className="flex items-center gap-2">
                            <Shield className="text-red-500" size={16} />
                            <span className="mono-label text-red-500">Inferred Input Mutations</span>
                          </div>
                          {jdCard.execution.nodes.filter(n => !n.capability.isRead).map((node, i) => (
                            <SchemaForm 
                              key={i}
                              title={node.capability.summary || `Update ${node.capability.path}`}
                              schema={node.capability.inputSchema || { type: 'object', properties: {} }}
                              onSubmit={async (formData) => {
                                if (isRealExecution) {
                                  addToast(`Executing Live Mutation: ${node.id}`, "info");
                                  try {
                                    await executionService.executeNode({...node, input: formData}, writeEnabled);
                                    addToast("Mutation Success", "success");
                                  } catch (err: any) {
                                    addToast("Mutation Failed", "error", [err.message]);
                                  }
                                } else {
                                  addToast(`Simulation: Transaction Queued`, "info");
                                }
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {jdCard && (
                    <div className="bg-[#121212] border-2 border-brand-ink p-8 shadow-[8px_8px_0_0_#121212] mt-8">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
                        <div className="flex items-center gap-3">
                          <FileJson className="text-brand-accent" size={24} />
                          <div>
                            <h3 className="text-white font-bold uppercase tracking-widest text-sm">Portable Artifact Bundle</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-green-400 font-mono text-[9px] border border-green-400 px-1 py-0.5 rounded-sm">VALIDATED_SCHEMA_V1</span>
                              <span className="text-gray-500 font-mono text-[9px]">SIZE: {(JSON.stringify(jdCard).length / 1024).toFixed(2)} KB</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                          <button 
                            onClick={() => exportService.downloadAsJson(jdCard)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-transparent border border-white/20 text-white font-bold text-[10px] px-4 py-2 uppercase tracking-widest hover:bg-white hover:text-brand-ink transition-all active:translate-y-0.5"
                          >
                            <FileJson size={14} />
                            Raw JSON
                          </button>
                          <button 
                            onClick={() => exportService.downloadAsHtml(jdCard)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-brand-accent text-white font-bold text-[10px] px-4 py-2 uppercase tracking-widest hover:bg-white hover:text-brand-ink transition-all active:translate-y-0.5"
                          >
                            <ExternalLink size={14} />
                            HTML Bundle
                          </button>
                        </div>
                      </div>
                      <div className="bg-white/5 p-4 overflow-auto max-h-[300px] no-scrollbar">
                        <pre className="text-[10px] font-mono text-gray-400">
                          {JSON.stringify(jdCard, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Side Info Rail */}
          <aside className="col-span-12 lg:col-span-4 space-y-6">
            <div className="border-2 border-brand-ink p-6 bg-white">
              <h3 className="mono-label mb-4 opacity-100 flex items-center gap-2 text-brand-ink">
                <Info size={12} />
                Capability Graph State
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-brand-line border-dashed">
                  <span className="font-mono text-[10px] text-gray-500 uppercase">Available Nodes</span>
                  <span className="font-mono text-xs font-bold">{capabilities.length || "0x0"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-brand-line border-dashed">
                  <span className="font-mono text-[10px] text-gray-500 uppercase">Safe Vertices</span>
                  <span className="font-mono text-xs font-bold">{capabilities.filter(c => c.isRead).length || "0x0"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-brand-line border-dashed">
                  <span className="font-mono text-[10px] text-gray-500 uppercase">Engine Status</span>
                  <span className={cn(
                    "font-mono text-[10px] font-bold px-2 py-0.5 rounded-sm",
                    capabilities.length > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                  )}>
                    {capabilities.length > 0 ? "STABLE_IDLE" : "AWAITING_INPUT"}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-2 border-brand-accent p-6 bg-brand-accent/5">
              <h3 className="mono-label mb-4 text-brand-accent opacity-100">Project Context</h3>
              <p className="text-[11px] font-serif italic text-gray-600 leading-relaxed">
                API2UI uses a layered orchestration compiler to map semantic intent to normalized capability graphs. All executions are auditable and schema-constrained by default.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-brand-line mt-20 flex justify-between items-center">
        <div className="mono-label">© 2026 INTERNAL_ENGINE_SYSTEMS</div>
        <div className="flex gap-8 mono-label lowercase">
          <a href="#" className="hover:text-brand-accent transition-colors">audits</a>
          <a href="#" className="hover:text-brand-accent transition-colors">contracts</a>
          <a href="#" className="hover:text-brand-accent transition-colors">safety.protocol</a>
        </div>
      </footer>
      <AnimatePresence>
        {showWriteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-ink/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white border-2 border-brand-ink max-w-md w-full p-8 shadow-[12px_12px_0_0_#ef4444]"
            >
              <div className="flex items-center gap-4 text-red-500 mb-6">
                <ShieldAlert size={48} />
                <h3 className="text-2xl font-bold tracking-tighter uppercase leading-none">Security Elevation Required</h3>
              </div>
              <p className="font-mono text-sm text-gray-600 mb-8 leading-relaxed">
                You are attempting to enable <span className="font-bold text-brand-ink">MUTATION_WRITE_ENABLED</span>. This mode allows the execution of state-changing operations (POST, PUT, DELETE).
                <br /><br />
                Ensure you have the necessary authorization and are aware of potential data impacts on the target environment.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmWriteMode}
                  className="w-full bg-red-500 text-white font-bold py-4 uppercase tracking-[0.2em] shadow-[4px_4px_0_0_#121212] active:translate-y-1 active:shadow-none transition-all"
                >
                  Confirm Elevation
                </button>
                <button 
                  onClick={() => setShowWriteConfirm(false)}
                  className="w-full bg-white text-brand-ink border-2 border-brand-ink font-bold py-4 uppercase tracking-[0.2em]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <Toasts toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
