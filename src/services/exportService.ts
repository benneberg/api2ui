import { type jdCard } from "../types";

class ExportService {
  downloadAsJson(jdCard: jdCard) {
    const blob = new Blob([JSON.stringify(jdCard, null, 2)], { type: 'application/json' });
    this.triggerDownload(blob, `jdcard-${new Date().getTime()}.json`);
  }

  downloadAsHtml(jdCard: jdCard) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API2UI Projection: ${jdCard.intent.goal}</title>
    <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono&family=Inter:wght@400;700&family=Cormorant+Garamond:ital,wght@1,400&display=swap');
        body { background: #F5F5F3; color: #121212; font-family: "Inter", sans-serif; }
        .mono { font-family: "JetBrains Mono", monospace; }
        .serif { font-family: "Cormorant Garamond", serif; }
    </style>
</head>
<body class="p-8 max-w-4xl mx-auto">
    <header class="mb-12 border-b-2 border-black pb-4">
        <h1 class="serif italic text-4xl mb-2">${jdCard.intent.goal}</h1>
        <div class="mono text-[10px] uppercase tracking-widest text-gray-500">Standalone Projection // Generated via API2UI Studio</div>
    </header>

    <main id="app" class="space-y-12">
        <div class="p-12 border-2 border-dashed border-gray-300 text-center italic text-gray-400">
            This is a standalone projection bundle.
            To enable real execution, connect this bundle to your local proxy or API gateway.
        </div>
        
        <div class="bg-white border-2 border-black p-8 shadow-[8px_8px_0_0_#D1D1D1]">
            <h3 class="mono text-xs font-bold uppercase mb-4 text-blue-600">Artifact_Metadata</h3>
            <pre class="mono text-[10px] bg-gray-50 p-4 overflow-auto">${JSON.stringify(jdCard, null, 2)}</pre>
        </div>
    </main>

    <footer class="mt-20 border-t border-gray-200 pt-8 mono text-[10px] uppercase tracking-widest text-gray-400 text-center">
        PROJECTION_VERSION: ${jdCard.version} // EXPORT_DATE: ${new Date().toLocaleDateString()}
    </footer>
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
