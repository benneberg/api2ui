import React from 'react';
import { 
  Table as TableIcon, 
  Play, 
  BarChart, 
  LineChart, 
  FileText,
  Calendar,
  CheckSquare,
  ChevronDown
} from 'lucide-react';
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { cn } from '../lib/utils';

interface ProjectionRendererProps {
  result: any;
}

export const ProjectionRenderer = ({ result }: { result: any, key?: any }) => {
  const data = result.data;
  const endpoint = result.endpoint;
  
  // 1. CHART INFERENCE
  const isChartable = Array.isArray(data) && data.length > 0;
  const numericKeys = isChartable ? Object.keys(data[0]).filter(k => typeof data[0][k] === 'number') : [];
  const stringKeys = isChartable ? Object.keys(data[0]).filter(k => typeof data[0][k] === 'string') : [];

  const renderTable = () => {
    if (!Array.isArray(data) || data.length === 0) return null;
    const columns = Object.keys(data[0]);
    return (
      <div className="overflow-x-auto rounded-lg border-2 border-brand-ink bg-white shadow-[4px_4px_0_0_#121212]">
        <table className="w-full text-[11px] font-mono border-collapse">
          <thead>
            <tr className="bg-brand-ink text-white uppercase tracking-wider italic">
              {columns.map((h) => (
                <th key={h} className="p-3 text-left border-r border-white/10 last:border-0">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-brand-ink/10">
            {data.map((row: any, idx: number) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                {columns.map((col, j) => (
                  <td key={j} className="p-3 border-r border-brand-ink/10 last:border-0 truncate font-medium">
                    {typeof row[col] === 'object' ? 
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1">MODAL_DATA</span> : 
                      String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderBarChart = () => {
    if (numericKeys.length === 0 || stringKeys.length === 0) return null;
    const xAxis = stringKeys[0];
    const yAxis = numericKeys[0];
    return (
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ReBarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D1D1D1" />
            <XAxis 
              dataKey={xAxis} 
              axisLine={{ stroke: '#121212', strokeWidth: 2 }}
              tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#121212' }}
            />
            <YAxis 
              axisLine={{ stroke: '#121212', strokeWidth: 2 }}
              tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#121212' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#121212', 
                border: 'none', 
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: '11px'
              }}
            />
            <Bar dataKey={yAxis} fill="#2563EB" />
          </ReBarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderLineChart = () => {
    if (numericKeys.length === 0 || stringKeys.length === 0) return null;
    const xAxis = stringKeys[0];
    const yAxis = numericKeys[0];
    return (
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ReLineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D1D1D1" />
            <XAxis 
              dataKey={xAxis} 
              axisLine={{ stroke: '#121212', strokeWidth: 2 }}
              tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#121212' }}
            />
            <YAxis 
              axisLine={{ stroke: '#121212', strokeWidth: 2 }}
              tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#121212' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#121212', 
                border: 'none', 
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: '11px'
              }}
            />
            <Line type="monotone" dataKey={yAxis} stroke="#2563EB" strokeWidth={3} dot={{ fill: '#121212' }} />
          </ReLineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  if (isChartable) {
    return (
      <div className="space-y-8 bg-gray-50 border-2 border-brand-ink p-8 rounded-xl shadow-[8px_8px_0_0_#D1D1D1]">
        <div className="flex items-center justify-between border-b-2 border-brand-ink pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-ink text-white rounded-md">
              <TableIcon size={20} />
            </div>
            <div>
              <span className="font-mono text-[10px] text-gray-400 block uppercase tracking-widest">Active Projection Source</span>
              <span className="font-bold text-lg tracking-tighter uppercase">{endpoint}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="mono-label text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded-sm">COMPOSITE_GRAPH_VIEW</span>
            <span className="text-[9px] font-mono text-gray-400 mt-1 uppercase">Sample Size: {data.length}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-2">
              <BarChart size={14} className="text-brand-accent" />
              <span className="mono-label text-xs">Distribution_Analysis</span>
            </div>
            <div className="bg-white rounded-lg border-2 border-brand-ink p-4 shadow-[4px_4px_0_0_#121212]">
              {renderBarChart()}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-2">
              <LineChart size={14} className="text-brand-accent" />
              <span className="mono-label text-xs">Chronological_Trend</span>
            </div>
            <div className="bg-white rounded-lg border-2 border-brand-ink p-4 shadow-[4px_4px_0_0_#121212]">
              {renderLineChart()}
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-2">
            <TableIcon size={14} className="text-brand-accent" />
            <span className="mono-label text-xs">Full_Relational_Surface</span>
          </div>
          {renderTable()}
        </div>
      </div>
    );
  }

  // Fallback / Single Object
  return (
    <div className="space-y-6 bg-white border-2 border-brand-ink p-8 rounded-xl shadow-[8px_8px_0_0_#D1D1D1]">
      <div className="flex items-center justify-between border-b-2 border-brand-ink pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-ink text-white rounded-md">
            <Play size={20} />
          </div>
          <div>
            <span className="font-mono text-[10px] text-gray-400 block uppercase tracking-widest">Discrete Projection</span>
            <span className="font-bold text-lg tracking-tighter uppercase">{endpoint}</span>
          </div>
        </div>
        <span className="mono-label text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded-sm">OBJECT_SCHEMA_MAP</span>
      </div>
      <div className="bg-gray-50 border-2 border-brand-ink p-6 font-mono text-[11px] rounded-lg shadow-inner overflow-x-auto">
        <pre className="text-gray-700">{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
};

// Form Implementation based on Schema
interface SchemaFormProps {
  schema: any;
  onSubmit: (data: any) => void;
  title: string;
}

export const SchemaForm = ({ schema, onSubmit, title }: { schema: any, onSubmit: (data: any) => void, title: string, key?: any }) => {
  const [formData, setFormData] = React.useState<any>({});

  const renderField = (name: string, fieldSchema: any) => {
    const isRequired = schema.required?.includes(name);
    
    // Dropdown for Enum
    if (fieldSchema.enum) {
      return (
        <div className="space-y-1">
          <label className="mono-label text-[10px] flex items-center gap-1">
            {name} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <select 
              value={formData[name] || ''} 
              onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
              className="w-full border-2 border-brand-ink p-2 pr-10 font-mono text-xs bg-white appearance-none focus:outline-none focus:ring-0"
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

    // Date Picker for date-time
    if (fieldSchema.format === 'date-time' || fieldSchema.format === 'date') {
      return (
        <div className="space-y-1">
          <label className="mono-label text-[10px] flex items-center gap-1">
            {name} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <input 
              type={fieldSchema.format === 'date' ? 'date' : 'datetime-local'}
              value={formData[name] || ''}
              onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
              className="w-full border-2 border-brand-ink p-2 font-mono text-xs bg-white focus:outline-none"
            />
            <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>
        </div>
      );
    }

    // Checkbox for Boolean
    if (fieldSchema.type === 'boolean') {
      return (
        <div className="flex items-center gap-3 py-2 cursor-pointer" onClick={() => setFormData({ ...formData, [name]: !formData[name] })}>
          <div className={cn(
            "w-5 h-5 border-2 border-brand-ink flex items-center justify-center transition-colors",
            formData[name] ? "bg-brand-accent border-brand-accent" : "bg-white"
          )}>
            {formData[name] && <CheckSquare size={12} className="text-white" />}
          </div>
          <label className="mono-label text-[10px] cursor-pointer">
            {name}
          </label>
        </div>
      );
    }

    // Default Text/Number Input
    return (
      <div className="space-y-1.5">
        <label className="mono-label text-[10px] flex items-center gap-2">
          <div className="w-1 h-3 bg-brand-accent rounded-full" />
          {name} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <input 
          type={fieldSchema.type === 'number' ? 'number' : 'text'}
          value={formData[name] || ''}
          onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
          className="w-full border-2 border-brand-ink p-3 font-mono text-xs bg-gray-50/50 focus:bg-white focus:outline-none placeholder:text-gray-300 rounded-md transition-all focus:shadow-[4px_4px_0_0_#121212]"
          placeholder={`INPUT_${name.toUpperCase()}`}
        />
        {fieldSchema.description && (
          <p className="text-[9px] text-gray-400 font-serif italic pl-3">{fieldSchema.description}</p>
        )}
      </div>
    );
  };

  const properties = schema.properties || {};

  return (
    <div className="bg-white border-2 border-brand-ink p-8 rounded-2xl shadow-[12px_12px_0_0_#D1D1D1] space-y-8">
      <div className="flex items-center justify-between border-b-2 border-brand-ink pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-accent text-white flex items-center justify-center rounded-xl shadow-[4px_4px_0_0_#121212]">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="font-serif italic text-3xl text-brand-ink">{title}</h3>
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Dynamic_State_Mutation_Panel</p>
          </div>
        </div>
        <div className="hidden sm:block px-3 py-1 bg-gray-100 border border-gray-200 rounded-full font-mono text-[8px] text-gray-400">
          PROJECTION_ID: {Math.random().toString(36).substring(7).toUpperCase()}
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
          className="w-full bg-brand-ink text-white font-bold py-5 uppercase tracking-[0.2em] text-xs hover:bg-brand-accent transition-all active:translate-y-1 active:shadow-none shadow-[6px_6px_0_0_#121212] flex items-center justify-center gap-3 rounded-lg"
        >
          <Zap size={16} />
          Commit Execution Payload
        </button>
        <p className="text-center mt-4 font-mono text-[9px] text-gray-400 italic">Caution: Live mutations will modify persistent state on the target host.</p>
      </div>
    </div>
  );
};
