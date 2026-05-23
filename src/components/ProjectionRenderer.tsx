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

export const ProjectionRenderer = ({ result }: ProjectionRendererProps) => {
  const data = result.data;
  const endpoint = result.endpoint;
  
  // 1. CHART INFERENCE
  // If data is an array of objects and has numeric fields, try to suggest a chart
  const isChartable = Array.isArray(data) && data.length > 0;
  const numericKeys = isChartable ? Object.keys(data[0]).filter(k => typeof data[0][k] === 'number') : [];
  const stringKeys = isChartable ? Object.keys(data[0]).filter(k => typeof data[0][k] === 'string') : [];

  const renderTable = () => {
    if (!Array.isArray(data) || data.length === 0) return null;
    const columns = Object.keys(data[0]);
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-2 border-brand-ink text-[11px] font-mono">
          <thead>
            <tr className="bg-brand-ink text-white uppercase tracking-wider italic">
              {columns.map((h) => (
                <th key={h} className="p-3 text-left border-r border-white/20 last:border-0">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-ink">
            {data.map((row: any, idx: number) => (
              <tr key={idx} className="hover:bg-brand-accent/5 transition-colors">
                {columns.map((col, j) => (
                  <td key={j} className="p-3 border-r border-brand-line last:border-0 truncate font-medium">
                    {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
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
      <div className="h-[300px] border-2 border-brand-ink bg-white p-4">
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
      <div className="h-[300px] border-2 border-brand-ink bg-white p-4">
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
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b-2 border-brand-ink pb-2">
          <TableIcon size={18} />
          <span className="font-mono text-xs font-bold uppercase">{endpoint}</span>
          <span className="ml-auto mono-label text-brand-accent">COMPOSITE_VIEW</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <span className="mono-label flex items-center gap-2"><BarChart size={12} /> Temporal / Distribution Bar</span>
            {renderBarChart()}
          </div>
          <div className="space-y-2">
            <span className="mono-label flex items-center gap-2"><LineChart size={12} /> Trend Analysis</span>
            {renderLineChart()}
          </div>
        </div>
        
        <div className="space-y-2">
          <span className="mono-label flex items-center gap-2"><TableIcon size={12} /> Raw Schema Surface</span>
          {renderTable()}
        </div>
      </div>
    );
  }

  // Fallback / Single Object
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b-2 border-brand-ink pb-2">
        <Play size={18} />
        <span className="font-mono text-xs font-bold uppercase">{endpoint}</span>
        <span className="ml-auto mono-label text-brand-accent">SINGLE_OBJECT_PROJECTION</span>
      </div>
      <div className="bg-white border-2 border-brand-ink p-6 font-mono text-xs shadow-[4px_4px_0_0_#D1D1D1]">
        <pre className="overflow-auto">{JSON.stringify(data, null, 2)}</pre>
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

export const SchemaForm = ({ schema, onSubmit, title }: SchemaFormProps) => {
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
      <div className="space-y-1">
        <label className="mono-label text-[10px] flex items-center gap-1">
          {name} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <input 
          type={fieldSchema.type === 'number' ? 'number' : 'text'}
          value={formData[name] || ''}
          onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
          className="w-full border-2 border-brand-ink p-2 font-mono text-xs bg-white focus:outline-none placeholder:text-gray-300"
          placeholder={`Enter ${name}`}
        />
        {fieldSchema.description && (
          <p className="text-[9px] text-gray-400 font-serif italic">{fieldSchema.description}</p>
        )}
      </div>
    );
  };

  const properties = schema.properties || {};

  return (
    <div className="bg-white border-2 border-brand-ink p-6 shadow-[8px_8px_0_0_#D1D1D1] space-y-6">
      <div className="flex items-center gap-3 border-b-2 border-brand-line pb-2">
        <FileText size={18} />
        <h3 className="font-serif italic text-xl">{title}</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(properties).map(([name, fSchema]) => (
          <div key={name}>
            {renderField(name, fSchema)}
          </div>
        ))}
      </div>

      <button 
        onClick={() => onSubmit(formData)}
        className="w-full bg-brand-ink text-white font-bold py-3 uppercase tracking-widest hover:bg-brand-accent transition-all active:translate-y-1 active:shadow-none shadow-[4px_4px_0_0_#121212]"
      >
        Execute Data Transaction
      </button>
    </div>
  );
};
