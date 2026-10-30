import React from 'react';
import { SentimentType } from '../types';

interface AspectBadgeProps {
  sentiment: SentimentType;
  confidence?: number;
  showConfidence?: boolean;
}

export const AspectBadge: React.FC<AspectBadgeProps> = ({
  sentiment,
  confidence,
  showConfidence = false
}) => {
  let style = 'bg-slate-50 text-slate-500 border-slate-200';
  let dot = 'bg-slate-400';
  let label: string = sentiment;

  if (sentiment === 'Positive') {
    style = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    dot = 'bg-emerald-600';
  } else if (sentiment === 'Negative') {
    style = 'bg-rose-50 text-rose-800 border-rose-300';
    dot = 'bg-rose-600';
  } else if (sentiment === 'Neutral') {
    style = 'bg-slate-100 text-slate-700 border-slate-300';
    dot = 'bg-slate-500';
  } else if (sentiment === 'Not Mentioned') {
    style = 'bg-slate-50/80 text-slate-400 border-slate-200';
    dot = 'bg-slate-300';
    label = 'ABSENT';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold uppercase tracking-wider border ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />
      <span>{label}</span>
      {showConfidence && confidence !== undefined && confidence > 0 && (
        <span className="text-[9px] opacity-75 font-normal ml-0.5">
          {(confidence * 100).toFixed(0)}%
        </span>
      )}
    </span>
  );
};
