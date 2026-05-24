import React from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { type jdCard } from '../types';

interface FlowVisualizerProps {
  jdCard: jdCard;
}

export const FlowVisualizer = ({ jdCard }: FlowVisualizerProps) => {
  const nodes = jdCard.execution.nodes;
  
  // Map nodes to scatter points
  const data = nodes.map((node, index) => ({
    x: index * 10,
    y: 50,
    name: node.id,
    method: node.capability.method,
    safety: node.capability.safetyClassification,
    isRead: node.capability.isRead
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-brand-ink p-3 border border-white/20 shadow-xl font-mono text-[10px]">
          <p className="text-brand-accent font-bold mb-1">{item.name}</p>
          <p className="text-white opacity-60">{item.method} {item.safety}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[120px] bg-white border-2 border-brand-ink p-4 relative overflow-hidden">
      <div className="absolute top-2 left-4 mono-label opacity-30">EXECUTION_SEQUENCE_DAG</div>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
          <XAxis type="number" dataKey="x" hide domain={['dataMin - 5', 'dataMax + 5']} />
          <YAxis type="number" dataKey="y" hide domain={[0, 100]} />
          <ZAxis type="number" range={[100, 100]} />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Edges */}
          {data.slice(0, -1).map((point, i) => (
            <ReferenceLine
              key={`edge-${i}`}
              segment={[
                { x: point.x, y: point.y },
                { x: data[i + 1].x, y: data[i + 1].y }
              ]}
              stroke="#E5E7EB"
              strokeWidth={2}
            />
          ))}

          <Scatter data={data} fill="#8884d8">
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.isRead ? '#2563EB' : '#EF4444'} 
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
