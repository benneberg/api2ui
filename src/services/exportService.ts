import { type JDCard } from "../types";

class ExportService {
  downloadAsJson(jdCard: JDCard) {
    const blob = new Blob([JSON.stringify(jdCard, null, 2)], { type: 'application/json' });
    this.triggerDownload(blob, `jdcard-${new Date().getTime()}.json`);
  }

  downloadAsHtml(jdCard: JDCard) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API2UI Bundle: ${jdCard.metadata.title}</title>
    <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono&family=Inter:wght@400;500;700&family=Cormorant+Garamond:ital,wght@1,400&display=swap');
        :root { --brand-bg: #F5F5F3; --brand-ink: #121212; --brand-accent: #2563EB; --brand-line: #E5E7EB; }
        body { background: var(--brand-bg); color: var(--brand-ink); font-family: "Inter", sans-serif; }
        .mono { font-family: "JetBrains Mono", monospace; }
        .serif { font-family: "Cormorant Garamond", serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
    </style>
</head>
<body class="selection:bg-brand-accent selection:text-white pb-24">
    <header class="h-20 border-b-2 border-brand-ink bg-white sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 border-2 border-brand-ink flex items-center justify-center bg-brand-accent text-white shadow-[4px_4px_0_0_#121212]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                </div>
                <div>
                    <h1 class="text-xl font-bold tracking-tighter uppercase leading-none">${jdCard.metadata.title.toUpperCase()}</h1>
                    <span class="mono text-[10px] uppercase text-gray-500 tracking-widest">jdCard Artifact v1.0</span>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <button id="runBtn" class="bg-brand-ink text-white font-bold px-6 py-2 uppercase text-[11px] tracking-widest hover:bg-brand-accent transition-all shadow-[4px_4px_0_0_#121212] active:translate-y-1 active:shadow-none">
                    Execute Graph
                </button>
            </div>
        </div>
    </header>

    <main class="max-w-5xl mx-auto px-6 py-12">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
            <!-- Sidebar: Artifact Data -->
            <aside class="space-y-8">
                <section>
                    <h2 class="serif italic text-3xl mb-4">Intention</h2>
                    <p class="text-sm font-medium leading-relaxed text-gray-600">${jdCard.contracts.inboundIntent}</p>
                </section>

                <section class="space-y-4">
                    <span class="block px-2 py-1 bg-brand-ink text-white font-mono text-[9px] uppercase tracking-widest w-fit">Execution_DAG</span>
                    <div id="graphNodes" class="space-y-2">
                        ${Object.values(jdCard.executionGraph.nodes).map(node => `
                            <div class="p-3 border-2 border-brand-line bg-white text-[11px] font-mono flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full ${node.type === 'READ' ? 'bg-blue-500' : 'bg-red-500'}"></span>
                                <span class="flex-1 truncate">${node.id}</span>
                                <span class="text-[8px] opacity-40 uppercase">${node.verb}</span>
                            </div>
                        `).join('')}
                    </div>
                </section>

                <section class="bg-white border-2 border-brand-ink p-4 shadow-[4px_4px_0_0_#D1D1D1]">
                    <h3 class="mono text-[10px] font-bold uppercase mb-2">Capabilities_Policy</h3>
                    <div class="space-y-1">
                        <div class="flex items-center justify-between text-[9px] mono">
                            <span>MODE</span>
                            <span class="text-brand-accent">${jdCard.capabilitiesMode}</span>
                        </div>
                        <div class="flex items-center justify-between text-[9px] mono">
                            <span>COMPILED</span>
                            <span class="truncate ml-4 opacity-50">${jdCard.metadata.compiledAt}</span>
                        </div>
                    </div>
                </section>
            </aside>

            <!-- Main Control: Simulation & Projection -->
            <div class="md:col-span-2 space-y-12">
                <!-- Sandbox Status -->
                <div id="sandboxStatus" class="border-2 border-dashed border-brand-line p-8 text-center bg-white/50">
                    <p class="font-serif italic text-gray-400">Execution graph idle. Awaiting user initialization.</p>
                </div>

                <!-- Projection Surface -->
                <div id="projectionSurface" class="space-y-12 hidden">
                    <!-- Dynamic Content Injected Here -->
                </div>

                <!-- Simulation Logs -->
                <div class="bg-brand-ink p-6 shadow-[8px_8px_0_0_#121212] flex flex-col h-[200px]">
                    <div class="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                        <span class="text-white mono text-[10px] uppercase tracking-widest">Saga_Runtime_View</span>
                        <span class="text-green-400 mono text-[9px] animate-pulse">● VIRTUAL_RUNTIME_READY</span>
                    </div>
                    <div id="logs" class="flex-1 overflow-y-auto no-scrollbar font-mono text-[10px] text-gray-400 space-y-1">
                        <div class="text-gray-600">[SYSTEM] Saga core initialized.</div>
                        <div class="text-gray-600">[RESOURCES] Graph nodes mapped to projection surface.</div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script>
        const jdCard = ${JSON.stringify(jdCard)};
        
        const logsContainer = document.getElementById('logs');
        const projectionSurface = document.getElementById('projectionSurface');
        const sandboxStatus = document.getElementById('sandboxStatus');
        const runBtn = document.getElementById('runBtn');

        function addLog(msg, color = 'text-gray-400') {
            const div = document.createElement('div');
            div.className = color;
            div.textContent = \`[\${new Date().toLocaleTimeString()}] \${msg}\`;
            logsContainer.appendChild(div);
            logsContainer.scrollTop = logsContainer.scrollHeight;
        }

        function renderProjection(results) {
            projectionSurface.innerHTML = '';
            // Simplified UI Engine for Standalone
            jdCard.uiProjection.components.forEach(comp => {
                const section = document.createElement('div');
                section.className = 'space-y-4';
                
                const header = document.createElement('div');
                header.className = 'flex items-center gap-3 border-b-2 border-brand-ink pb-2';
                header.innerHTML = \`
                    <span class="font-mono text-xs font-bold uppercase italic">\${comp.title || comp.id}</span>
                    <span class="ml-auto px-2 py-0.5 bg-brand-ink text-white font-mono text-[9px] rounded">SIM_PROJECTION</span>
                \`;
                section.appendChild(header);

                const mockData = Array.from({length: 5}, (_, i) => ({
                    id: 1000 + i,
                    label: "Mock Row " + (i + 1),
                    status: i % 2 === 0 ? "STABLE" : "PENDING",
                    value: Math.floor(Math.random() * 1000)
                }));

                const tableContainer = document.createElement('div');
                tableContainer.className = 'overflow-x-auto';
                const columns = Object.keys(mockData[0]);
                
                let tableHtml = \`
                    <table class="w-full border-2 border-brand-ink text-[11px] font-mono">
                        <thead>
                            <tr class="bg-brand-ink text-white uppercase tracking-wider italic">
                                \${columns.map(h => \`<th class="p-3 text-left border-r border-white/20 last:border-0">\${h}</th>\`).join('')}
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-brand-ink/10">
                \`;
                
                mockData.forEach(row => {
                    tableHtml += \`<tr class="hover:bg-blue-50 transition-colors">\`;
                    columns.forEach(col => {
                        const val = row[col];
                        tableHtml += \`<td class="p-3 border-r border-brand-line last:border-0 truncate font-medium">\${val}</td>\`;
                    });
                    tableHtml += \`</tr>\`;
                });
                
                tableHtml += '</tbody></table>';
                tableContainer.innerHTML = tableHtml;
                section.appendChild(tableContainer);
                projectionSurface.appendChild(section);
            });
        }

        async function runSimulation() {
            runBtn.disabled = true;
            runBtn.classList.add('opacity-50', 'cursor-not-allowed');
            sandboxStatus.innerHTML = '<div class="flex items-center justify-center gap-4 font-mono text-xs"><div class="w-4 h-4 border-2 border-brand-ink border-t-transparent rounded-full animate-spin"></div> TRAVERSING_EXECUTION_GRAPH...</div>';
            sandboxStatus.classList.remove('hidden');
            projectionSurface.classList.add('hidden');
            
            let currentNodeId = jdCard.executionGraph.rootNode;
            while(currentNodeId && currentNodeId !== 'END') {
                const node = jdCard.executionGraph.nodes[currentNodeId];
                addLog(\`PROCESSING_NODE: \${currentNodeId} [\${node.verb}]\`, 'text-blue-400');
                await new Promise(r => setTimeout(r, 600));
                addLog(\`RESOLVED: \${currentNodeId} -> SUCCESS\`, 'text-green-500');
                currentNodeId = node.onSuccess === 'END' ? null : node.onSuccess;
            }

            addLog("FLOW_HALTED: RECONCILING_UI_PROJECTION", "text-brand-accent font-bold");
            renderProjection();
            
            setTimeout(() => {
                sandboxStatus.classList.add('hidden');
                projectionSurface.classList.remove('hidden');
                runBtn.disabled = false;
                runBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }, 500);
        }

        runBtn.addEventListener('click', runSimulation);

        addLog("SYSTEM_READY: Initialized virtual saga engine.");
    <\/script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    this.triggerDownload(blob, `api2ui-bundle-${new Date().getTime()}.html`);
  }

  downloadAsReact(jdCard: JDCard) {
    const componentCode = `import React, { useState, useEffect } from 'react';
import { Play, Check, AlertTriangle, Database, Terminal, CheckCircle2, RotateCcw } from 'lucide-react';

interface UIComponent {
  id: string;
  type: string;
  title?: string;
  bindings: Record<string, any>;
  properties?: Record<string, any>;
  events?: Record<string, string>;
}

export default function WorkflowUI() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [runningStep, setRunningStep] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [writeEnabled, setWriteEnabled] = useState(false);

  const title = "${jdCard.metadata.title}";
  const intent = "${jdCard.contracts.inboundIntent.replace(/"/g, '\\"')}";
  const capabilitiesMode = "${jdCard.capabilitiesMode}";
  
  const nodes = ${JSON.stringify(Object.values(jdCard.executionGraph.nodes), null, 2)};
  const components = ${JSON.stringify(jdCard.uiProjection.components, null, 2)};

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, \`[\${new Date().toLocaleTimeString()}] \${msg}\`]);
  };

  const handleExecute = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setCompletedSteps([]);
    setResults({});
    setLogs([]);
    addLog("INITIATING STANDALONE WORKFLOW EXECUTION...");

    for (const node of nodes) {
      setRunningStep(node.id);
      addLog(\`RUNNING STEP: \${node.capability?.summary || node.id} [\${node.verb} \${node.path || ''}]\`);
      
      // Simulate network latency
      await new Promise(r => setTimeout(r, 800));

      if (node.type === 'MUTATION' && !writeEnabled) {
        addLog(\`❌ MUTATION_BLOCKED: Read-only mode active. Please toggle 'Write Session' to allow writes.\`);
        setIsExecuting(false);
        setRunningStep(null);
        return;
      }

      // Generate schema-aware mock response
      const mockResult = generateMockDataForNode(node);
      setResults(prev => ({ ...prev, [node.id]: mockResult }));
      setCompletedSteps(prev => [...prev, node.id]);
      addLog(\`✓ STEP COMPLETED: \${node.id}\`);
    }

    setRunningStep(null);
    setIsExecuting(false);
    addLog("✨ WORKFLOW EXECUTION COMPLETE. ALL NODES RESOLVED.");
  };

  const generateMockDataForNode = (node: any) => {
    if (node.verb === 'GET') {
      return {
        items: Array.from({ length: 4 }, (_, i) => ({
          id: \`id_\${Math.floor(Math.random() * 1000)}\`,
          name: \`Sample Item \${i + 1}\`,
          status: i % 2 === 0 ? 'ACTIVE' : 'PENDING',
          updatedAt: new Date().toISOString(),
        }))
      };
    }
    return { success: true, message: "Operation committed successfully", id: Math.floor(Math.random() * 1000000) };
  };

  return (
    <div className="min-h-screen bg-gray-50 text-[#121212] font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="bg-white border-2 border-black p-8 shadow-[8px_8px_0_0_#121212] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase text-blue-600 font-bold tracking-widest">Standalone React component</span>
            <h1 className="font-serif italic text-4xl">{title}</h1>
            <p className="text-gray-500 text-sm max-w-2xl font-medium">{intent}</p>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            {capabilitiesMode !== 'READ_ONLY' && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className={\`text-[10px] font-mono transition-colors font-bold uppercase \${!writeEnabled ? 'text-blue-600' : 'text-gray-400'}\`}>Simulate</span>
                <div 
                  onClick={() => setWriteEnabled(!writeEnabled)}
                  className="w-10 h-5 bg-gray-200 border-2 border-black relative shadow-[1px_1px_0_0_#121212]"
                >
                  <div className={\`absolute top-0 bottom-0 w-4 bg-black transition-all \${writeEnabled ? 'right-0' : 'left-0'}\`} />
                </div>
                <span className={\`text-[10px] font-mono transition-colors font-bold uppercase \${writeEnabled ? 'text-blue-600' : 'text-gray-400'}\`}>Write Session</span>
              </label>
            )}
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className={\`px-6 py-3 font-bold uppercase font-mono text-xs tracking-wider transition-all border-2 border-black \${isExecuting ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-black text-white hover:bg-blue-600 hover:text-white shadow-[4px_4px_0_0_#121212] active:translate-y-1 active:shadow-none'}\`}
            >
              {isExecuting ? 'Running...' : 'Execute Flow'}
            </button>
          </div>
        </header>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: DAG Stepper Status */}
          <div className="space-y-6">
            <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0_0_#121212]">
              <h3 className="font-serif italic text-lg mb-4">Workflow Nodes</h3>
              <div className="space-y-3">
                {nodes.map((node: any) => {
                  const isCompleted = completedSteps.includes(node.id);
                  const isRunning = runningStep === node.id;
                  
                  return (
                    <div 
                      key={node.id} 
                      className={\`p-4 border-2 transition-all flex items-center justify-between \${isCompleted ? 'border-green-400 bg-green-50/20' : isRunning ? 'border-blue-500 bg-blue-50/20 animate-pulse' : 'border-gray-200 bg-gray-50'}\`}
                    >
                      <div>
                        <p className="font-semibold text-xs">{node.capability?.summary || node.id}</p>
                        <p className="font-mono text-[9px] text-gray-500 uppercase mt-0.5">{node.verb} {node.path || ''}</p>
                      </div>
                      <span className={\`font-mono text-[8px] font-bold px-1.5 py-0.5 rounded uppercase \${isCompleted ? 'bg-green-100 text-green-700' : isRunning ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}\`}>
                        {isCompleted ? 'Done' : isRunning ? 'Active' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Runtime Log Terminal */}
            <div className="bg-black text-white p-6 shadow-[6px_6px_0_0_#121212] font-mono text-[10px] min-h-[180px] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3 text-green-400 border-b border-white/10 pb-2">
                  <Terminal size={12} />
                  <span className="font-bold tracking-wider uppercase">Runtime Monitor</span>
                </div>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                  {logs.map((log, i) => (
                    <div key={i} className={log.includes('❌') ? 'text-red-400' : log.includes('✓') ? 'text-green-400' : 'text-gray-300'}>
                      {log}
                    </div>
                  ))}
                  {logs.length === 0 && <span className="text-gray-500">System idle. Ready for activation.</span>}
                </div>
              </div>
              {isExecuting && <div className="text-green-400 mt-2 animate-pulse font-bold">_ PROCESSING...</div>}
            </div>
          </div>

          {/* Right Column: Dynamic UI Projections */}
          <div className="lg:col-span-2 space-y-6">
            {components.map((comp: UIComponent) => {
              const nodeRef = nodes.find((n: any) => comp.bindings.dataSource?.includes(n.id));
              const nodeData = nodeRef ? results[nodeRef.id] : null;
              
              return (
                <div key={comp.id} className="bg-white border-2 border-black p-6 shadow-[4px_4px_0_0_#121212] space-y-4">
                  <div className="flex justify-between items-center border-b-2 border-black pb-2">
                    <h3 className="font-serif italic text-xl">{comp.title || 'Dynamic Panel'}</h3>
                    <span className="px-2 py-0.5 bg-black text-white font-mono text-[9px] rounded font-bold uppercase">{comp.type}</span>
                  </div>

                  {comp.type === 'Data-Table' || comp.type === 'TABLE' ? (
                    <div>
                      {nodeData && nodeData.items ? (
                        <div className="overflow-x-auto">
                          <table className="w-full border-2 border-black font-mono text-xs text-left">
                            <thead>
                              <tr className="bg-black text-white uppercase italic">
                                <th className="p-3 border-r border-white/20">ID</th>
                                <th className="p-3 border-r border-white/20">Name</th>
                                <th className="p-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {nodeData.items.map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-blue-50/40">
                                  <td className="p-3 border-r border-gray-200 font-bold text-blue-600">{item.id}</td>
                                  <td className="p-3 border-r border-gray-200 font-medium">{item.name}</td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full font-bold text-[9px]">
                                      {item.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="py-12 border-2 border-dashed border-gray-200 text-center font-mono text-xs text-gray-400">
                          Data stream offline. Run workflow to populate.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-gray-50 border border-gray-200">
                      <div>
                        <p className="font-bold text-xs">{comp.properties?.label || 'Action Trigger'}</p>
                        <p className="text-[10px] text-gray-500">Triggers a persistent mutation workflow</p>
                      </div>
                      <button
                        onClick={handleExecute}
                        disabled={isExecuting}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase px-4 py-2 shadow-[2px_2px_0_0_#121212]"
                      >
                        Commit Action
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
`;
    const blob = new Blob([componentCode], { type: 'text/typescript' });
    this.triggerDownload(blob, `WorkflowUI-${new Date().getTime()}.tsx`);
  }

  private triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const exportService = new ExportService();
