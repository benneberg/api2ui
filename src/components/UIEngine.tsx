import React from 'react';
import { 
  BarChart as LucideBarChart, 
  Search,
  ChevronDown,
  Zap,
  CheckCircle2,
  Table as TableIcon,
  Activity,
  ArrowRight,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from '../lib/utils';
import { type JDCard, type UIComponentSchema } from '../types';

interface UIEngineProps {
  jdCard: JDCard;
  executionResults: Record<string, any>;
  onActionExecute?: (actionId: string, nodeId: string, payload?: any) => void;
  onSelectionChange?: (nodeId: string, selection: any[]) => void;
  selectedItems?: Record<string, any[]>;
}

export const UIEngine = ({ 
  jdCard, 
  executionResults,
  onActionExecute,
  onSelectionChange,
  selectedItems = {}
}: UIEngineProps) => {
  const [activeStep, setActiveStep] = React.useState(0);
  const layout = jdCard.uiProjection.layout;

  const resolveValue = (binding: any, context: any): any => {
    if (typeof binding !== 'string') return binding;
    if (binding.startsWith('{{') && binding.endsWith('}}')) {
      const path = binding.slice(2, -2);
      return path.split('.').reduce((obj, key) => obj?.[key], context);
    }
    return binding;
  };

  return (
    <div className={cn(
      "space-y-8 pb-32",
      layout === 'vertical-stack' ? "max-w-4xl mx-auto" : ""
    )}>
      {jdCard.uiProjection.components.map((comp, i) => {
        const isHidden = layout === 'STEPPER' && activeStep !== i;
        if (isHidden) return null;

        return (
          <div key={comp.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SemanticComponent 
              comp={comp} 
              context={executionResults}
              resolve={resolveValue}
              onAction={(payload?: any) => onActionExecute?.(comp.id, comp.bindsTo || '', payload)}
              onSelection={(items) => onSelectionChange?.(comp.bindsTo || '', items)}
              selection={selectedItems[comp.bindsTo || ''] || []}
            />
            
            {layout === 'STEPPER' && i < jdCard.uiProjection.components.length - 1 && (
              <div className="flex justify-end mt-6">
                <button 
                  onClick={() => setActiveStep(i + 1)}
                  className="flex items-center gap-2 px-8 py-3 bg-brand-ink text-white font-bold uppercase text-[10px] rounded-lg shadow-neubrutalism hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                >
                  Next Step
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const SemanticComponent = ({ comp, context, resolve, onAction, onSelection, selection }: any) => {
  switch (comp.type) {
    case 'Metric-Card':
      return (
        <div className="bg-white border-2 border-brand-ink p-6 rounded-2xl shadow-neubrutalism flex items-center justify-between">
          <div>
            <div className="mono-label text-[10px] text-gray-400 uppercase tracking-widest mb-1">{comp.title || resolve(comp.bindings.label, context)}</div>
            <div className="font-serif italic text-4xl text-brand-ink">{resolve(comp.bindings.value, context) ?? '—'}</div>
          </div>
          <div className="w-12 h-12 bg-brand-accent/10 text-brand-accent flex items-center justify-center rounded-xl">
            <Activity size={24} />
          </div>
        </div>
      );

    case 'Data-Table':
      const data = resolve(comp.bindings.dataSource, context);
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TableIcon size={16} className="text-brand-ink" />
              <h3 className="mono-label font-bold text-brand-ink text-sm uppercase italic">{comp.title || 'Inferred Dataset'}</h3>
            </div>
            {selection.length > 0 && (
              <div className="px-3 py-1 bg-brand-ink text-white font-mono text-[9px] rounded-full animate-in zoom-in">
                {selection.length} SELECTED
              </div>
            )}
          </div>
          <DataTable data={data} onSelectionChange={onSelection} selectedItems={selection} />
        </div>
      );

    case 'Action-Trigger-Button':
      return (
        <div className="p-8 bg-brand-ink text-white shadow-[12px_12px_0_0_#FF3366] flex flex-col md:flex-row items-center justify-between gap-8 rounded-3xl border-4 border-white transition-all hover:scale-[1.01]">
          <div className="max-w-md">
            <div className="font-serif italic text-3xl leading-tight">{comp.title || comp.properties?.label || 'Execute Operation'}</div>
            <p className="font-mono text-[10px] text-gray-400 mt-2">
              Requires confirmation: {comp.properties?.requiresConfirmation ? 'YES' : 'NO'} | Context scope: {selection.length} items
            </p>
          </div>
          <button 
            onClick={() => onAction()}
            className="px-10 py-4 bg-brand-accent text-white font-bold uppercase text-[10px] hover:bg-white hover:text-brand-ink transition-all flex items-center gap-3 rounded-full shadow-lg"
          >
            {comp.properties?.label || 'Execute'}
            <Zap size={16} />
          </button>
        </div>
      );

    case 'CHART':
      return <DataChart data={resolve(comp.bindings.dataSource, context)} title={comp.title} />;

    case 'FORM':
      return <SchemaForm schema={comp.properties?.schema || {}} onSubmit={onAction} title={comp.title || 'Submission Form'} submitLabel={comp.properties?.submitLabel} />;

    default:
      return <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-mono text-[10px] text-gray-400">UNSUPPORTED_COMPONENT: {comp.type}</div>;
  }
};

const DataTable = ({ data, onSelectionChange, selectedItems }: any) => {
  const [filterText, setFilterText] = React.useState('');
  const [sortConfig, setSortConfig] = React.useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) {
    return (
      <div className="p-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl text-center">
        <div className="font-mono text-[10px] text-gray-400 uppercase italic">Awaiting_Data_Ingestion_Or_Empty_Set</div>
      </div>
    );
  }

  const columns = Object.keys(items[0]);
  
  // Filtering Logic
  const filteredData = React.useMemo(() => {
    if (!filterText) return items;
    const lowerFilter = filterText.toLowerCase();
    return items.filter((row: any) => 
      Object.values(row).some(val => 
        String(val).toLowerCase().includes(lowerFilter)
      )
    );
  }, [items, filterText]);

  // Sorting Logic
  const sortedData = React.useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === bVal) return 0;
      const res = aVal > bVal ? 1 : -1;
      return sortConfig.direction === 'asc' ? res : -res;
    });
  }, [filteredData, sortConfig]);

  const toggleAll = (checked: boolean) => onSelectionChange?.(checked ? sortedData : []);
  const toggleOne = (row: any) => {
    const isSelected = selectedItems.some((s: any) => JSON.stringify(s) === JSON.stringify(row));
    onSelectionChange?.(isSelected ? selectedItems.filter((s: any) => JSON.stringify(s) !== JSON.stringify(row)) : [...selectedItems, row]);
  };

  const toggleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-white p-3 border-2 border-brand-ink rounded-xl shadow-sm">
        <Search size={14} className="text-gray-400" />
        <input 
          className="flex-1 bg-transparent border-none font-mono text-[10px] focus:outline-none"
          placeholder="Filter results..."
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
        />
      </div>
      <div className="overflow-hidden rounded-2xl border-2 border-brand-ink bg-white shadow-neubrutalism">
        <table className="w-full text-left font-mono text-[10px]">
          <thead className="bg-brand-ink text-white uppercase italic">
            <tr>
              <th className="p-3 w-10 border-r border-white/10">
                <input type="checkbox" onChange={e => toggleAll(e.target.checked)} />
              </th>
              {columns.slice(0, 6).map(c => (
                <th key={c} onClick={() => toggleSort(c)} className="p-3 border-r border-white/10 last:border-0 cursor-pointer hover:bg-white/10">
                  <div className="flex items-center justify-between">
                    {c}
                    {sortConfig?.key === c && (
                      <ChevronDown size={10} className={cn(sortConfig.direction === 'asc' ? "rotate-180" : "")} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedData.map((row, i) => {
              const isSelected = selectedItems.some((s: any) => JSON.stringify(s) === JSON.stringify(row));
              return (
                <tr key={i} className={cn("hover:bg-gray-50 transition-colors", isSelected && "bg-brand-accent/5")}>
                  <td className="p-3 border-r border-gray-100 text-center">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleOne(row)} />
                  </td>
                  {columns.slice(0, 6).map(c => (
                    <td key={c} className="p-3 border-r border-gray-100 last:border-0 max-w-[150px] truncate">
                      {typeof row[c] === 'object' ? '...' : String(row[c])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DataChart = ({ data, title }: any) => {
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) return null;
  
  const numericKeys = Object.keys(items[0]).filter(k => typeof items[0][k] === 'number');
  const stringKeys = Object.keys(items[0]).filter(k => typeof items[0][k] === 'string');
  
  if (numericKeys.length === 0 || stringKeys.length === 0) return null;
  const xAxisKey = stringKeys[0];
  const yAxisKey = numericKeys[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <LucideBarChart size={14} className="text-brand-accent" />
           <span className="mono-label text-xs uppercase font-bold">{title || 'Data_Distribution'}</span>
        </div>
        <span className="text-[9px] font-mono text-gray-400">Y: {yAxisKey} / X: {xAxisKey}</span>
      </div>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={items}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF' }} />
            <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }} />
            <Bar dataKey={yAxisKey} fill="#000" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Form Implementation
export const SchemaForm = ({ schema, onSubmit, title, submitLabel }: any) => {
  const [formData, setFormData] = React.useState<any>({});

  const renderField = (name: string, fieldSchema: any) => {
    const isRequired = schema.required?.includes(name);
    
    if (fieldSchema.type === 'boolean') {
      return (
        <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-md border-2 border-transparent hover:border-brand-ink transition-all cursor-pointer select-none" onClick={() => setFormData({ ...formData, [name]: !formData[name] })}>
          <div className={cn(
            "w-5 h-5 border-2 border-brand-ink flex items-center justify-center transition-all",
            formData[name] ? "bg-brand-ink text-white" : "bg-white"
          )}>
            {formData[name] && <CheckCircle2 size={12} />}
          </div>
          <span className="mono-label text-[10px] font-bold">
            {name} {isRequired && <span className="text-red-500">*</span>}
          </span>
        </div>
      );
    }

    if (fieldSchema.enum) {
      return (
        <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
          <label className="mono-label text-[10px] flex items-center gap-1 font-bold">
            {name} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <select 
              value={formData[name] || ''} 
              onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
              className="w-full border-2 border-brand-ink p-3 pr-10 font-mono text-xs bg-white appearance-none focus:outline-none focus:ring-0 rounded-md shadow-neubrutalism hover:shadow-none"
            >
              <option value="">SELECT_{name.toUpperCase()}</option>
              {fieldSchema.enum.map((opt: string) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
        <label className="mono-label text-[10px] flex items-center gap-2 font-bold">
          <div className="w-1 h-3 bg-brand-accent rounded-full" />
          {name} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <input 
          type={fieldSchema.type === 'number' ? 'number' : 'text'}
          value={formData[name] || ''}
          onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
          className="w-full border-2 border-brand-ink p-3 font-mono text-xs bg-gray-50/50 focus:bg-white focus:outline-none placeholder:text-gray-300 rounded-md transition-all focus:shadow-neubrutalism"
          placeholder={`INPUT_${name.toUpperCase()}`}
        />
        {fieldSchema.description && <p className="text-[9px] font-mono text-gray-400 leading-tight italic ml-3">/ {fieldSchema.description}</p>}
      </div>
    );
  };

  const properties = schema.properties || {};

  return (
    <div className="bg-white border-2 border-brand-ink p-8 rounded-2xl shadow-neubrutalism space-y-8">
      <div className="flex items-center justify-between border-b-2 border-brand-ink pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-accent text-white flex items-center justify-center rounded-xl shadow-neubrutalism">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="font-serif italic text-3xl text-brand-ink">{title}</h3>
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">State_Mutation_Panel</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Object.entries(properties).map(([name, fSchema]) => (
          <div key={name} className="group transition-all">
            {renderField(name, fSchema)}
          </div>
        ))}
      </div>

      <div className="pt-6 border-t-2 border-brand-line border-dashed">
        <button 
          onClick={() => onSubmit(formData)}
          className="w-full bg-brand-ink text-white font-bold py-5 uppercase tracking-[0.2em] text-xs hover:bg-brand-accent transition-all active:translate-y-1 active:shadow-none shadow-neubrutalism flex items-center justify-center gap-3 rounded-lg"
        >
          <Zap size={16} />
          {submitLabel || 'Commit Execution Payload'}
        </button>
      </div>
    </div>
  );
};
