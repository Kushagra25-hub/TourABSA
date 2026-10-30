import React from 'react';
import { HospitalityAspect, AspectSummaryCardData } from '../types';
import { Sparkles, Users, UtensilsCrossed, CircleDollarSign, Wifi, MapPin } from 'lucide-react';

interface AspectCardProps {
  aspect: HospitalityAspect;
  data: AspectSummaryCardData;
}

export const AspectCard: React.FC<AspectCardProps> = ({ aspect, data }) => {
  const getAspectIcon = (asp: HospitalityAspect) => {
    switch (asp) {
      case 'CLEANLINESS':
        return <Sparkles className="w-3.5 h-3.5 text-blue-600" />;
      case 'STAFF':
        return <Users className="w-3.5 h-3.5 text-indigo-600" />;
      case 'FOOD':
        return <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />;
      case 'VALUE':
        return <CircleDollarSign className="w-3.5 h-3.5 text-emerald-600" />;
      case 'AMENITIES':
        return <Wifi className="w-3.5 h-3.5 text-cyan-600" />;
      case 'LOCATION':
        return <MapPin className="w-3.5 h-3.5 text-rose-600" />;
    }
  };

  const total = data.total_mentioned || 0;
  const posPct = data.positive_percentage || 0;
  const negPct = data.negative_percentage || 0;
  const neuPct = data.neutral_percentage || 0;

  return (
    <div className="panel-enterprise p-3.5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-slate-100 border border-slate-200 rounded">
              {getAspectIcon(aspect)}
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-900">{aspect}</h3>
              <p className="text-[10px] font-mono text-slate-500">{total} reviews identified</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
            {posPct}% POS
          </span>
        </div>

        {/* Precision Stacked Meter */}
        <div className="w-full h-1.5 bg-slate-100 rounded-xs flex overflow-hidden my-2.5">
          {total > 0 ? (
            <>
              <div style={{ width: `${posPct}%` }} className="bg-emerald-600" title={`Positive: ${posPct}%`} />
              <div style={{ width: `${neuPct}%` }} className="bg-slate-400" title={`Neutral: ${neuPct}%`} />
              <div style={{ width: `${negPct}%` }} className="bg-rose-600" title={`Negative: ${negPct}%`} />
            </>
          ) : (
            <div className="w-full bg-slate-200" title="No mentions detected" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 text-center font-mono text-[10px]">
        <div className="bg-slate-50/60 p-1 rounded border border-slate-100">
          <span className="text-[9px] text-emerald-800 block uppercase font-bold font-sans">Positive</span>
          <span className="font-bold text-emerald-700">{posPct}%</span>
          <span className="text-[9px] text-slate-400 block">({data.positive})</span>
        </div>
        <div className="bg-slate-50/60 p-1 rounded border border-slate-100">
          <span className="text-[9px] text-slate-700 block uppercase font-bold font-sans">Neutral</span>
          <span className="font-bold text-slate-700">{neuPct}%</span>
          <span className="text-[9px] text-slate-400 block">({data.neutral})</span>
        </div>
        <div className="bg-slate-50/60 p-1 rounded border border-slate-100">
          <span className="text-[9px] text-rose-800 block uppercase font-bold font-sans">Negative</span>
          <span className="font-bold text-rose-700">{negPct}%</span>
          <span className="text-[9px] text-slate-400 block">({data.negative})</span>
        </div>
      </div>
    </div>
  );
};
