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
