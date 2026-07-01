/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { PlotData } from "../types";
import { Droplet, AlertTriangle, Eye, RefreshCw, Layers } from "lucide-react";

interface PlotGridProps {
  plots: PlotData[];
  selectedPlot: PlotData | null;
  onSelectPlot: (plot: PlotData) => void;
  filterVariety: string;
  filterWaterSystem: string;
}

export default function PlotGrid({
  plots,
  selectedPlot,
  onSelectPlot,
  filterVariety,
  filterWaterSystem,
}: PlotGridProps) {
  // Group plots by replication (block)
  const replications = [1, 2, 3];

  const getWaterSystemColor = (system: string) => {
    switch (system) {
      case "W1": return "border-amber-500/30 bg-amber-500/10 text-amber-400"; // AWD (Warm orange/amber)
      case "W2": return "border-sky-500/30 bg-sky-500/10 text-sky-400"; // DRIP (Perfect blue)
      case "W3": return "border-indigo-500/30 bg-indigo-500/10 text-indigo-400"; // MINI (Deep blue)
      default: return "border-slate-800 bg-slate-900 text-slate-400";
    }
  };

  const getMoistureStatus = (moisture: number) => {
    if (moisture < 30) return { text: "แห้งวิกฤต", color: "bg-red-500/20 text-red-400", ring: "ring-red-500/30" };
    if (moisture < 45) return { text: "แห้ง", color: "bg-amber-500/20 text-amber-400", ring: "ring-amber-500/30" };
    if (moisture > 75) return { text: "น้ำขัง", color: "bg-indigo-500/20 text-indigo-400", ring: "ring-indigo-500/30" };
    return { text: "เหมาะสม", color: "bg-emerald-500/20 text-emerald-400", ring: "ring-emerald-500/30" };
  };

  return (
    <div className="space-y-6" id="plot-grid-container">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2.5">
          <Layers className="h-5 w-5 text-emerald-400" id="icon-layers" />
          <h3 className="font-sans text-base font-bold text-slate-100" id="grid-title">
            แผนผังพื้นที่ทดลองจริง 36 แปลงย่อย (RCBD Block Layout)
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-mono" id="legend-container">
          <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 mr-1.5"></span> เหมาะสม (45-75%)</span>
          <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 mr-1.5"></span> แห้ง (30-45%)</span>
          <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-red-500/80 mr-1.5"></span> แห้งวิกฤต (&lt;30%)</span>
          <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500/80 mr-1.5"></span> น้ำขัง (&gt;75%)</span>
        </div>
      </div>

      {replications.map((repNum) => {
        // Filter plots for this block
        const repPlots = plots.filter((p) => p.replication === repNum);

        return (
          <div key={repNum} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative" id={`rep-block-${repNum}`}>
            <div className="absolute top-4 left-6 flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-1 rounded-full text-xs font-semibold text-slate-300 font-sans shadow-inner">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              <span>Replication Block {repNum} (บล็อกซ้ำที่ {repNum})</span>
            </div>

            {/* Grid display */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-6 mt-2" id={`grid-rep-${repNum}`}>
              {repPlots.map((plot) => {
                const isSelected = selectedPlot?.plotId === plot.plotId;
                const matchesVariety = !filterVariety || plot.varietyName === filterVariety;
                const matchesWater = !filterWaterSystem || plot.waterSystem === filterWaterSystem;
                const isHighlighted = matchesVariety && matchesWater;
                const moistureInfo = getMoistureStatus(plot.soilMoisture);

                return (
                  <button
                    key={plot.plotId}
                    onClick={() => onSelectPlot(plot)}
                    id={`btn-plot-${plot.plotId}`}
                    className={`group text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                      isSelected
                        ? "ring-2 ring-emerald-400 shadow-lg border-emerald-400 scale-[1.02] bg-emerald-950/30"
                        : isHighlighted
                        ? "border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:scale-[1.01] hover:bg-slate-950/90"
                        : "border-slate-900 bg-slate-950/10 opacity-30 hover:opacity-70"
                    }`}
                  >
                    {/* Corner badge for Water system */}
                    <div className="flex justify-between items-center mb-2.5" id={`header-plot-${plot.plotId}`}>
                      <span className="font-mono text-xs font-bold text-slate-400">{plot.plotId}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono border ${getWaterSystemColor(plot.waterSystem)}`}>
                        {plot.waterSystemName}
                      </span>
                    </div>

                    {/* Variety Name */}
                    <div className="text-[11px] font-bold text-slate-200 line-clamp-1 mb-1 font-sans" title={plot.varietyName}>
                      {plot.varietyName}
                    </div>

                    {/* Corn height visual growth meter */}
                    <div className="flex items-end justify-between mt-2.5" id={`stats-plot-${plot.plotId}`}>
                      <div className="space-y-0.5">
                        <div className="text-[9px] text-slate-500 font-sans">ความสูงต้น</div>
                        <div className="text-xs font-bold text-slate-300 font-mono">
                          {plot.plantHeight} <span className="text-[9px] font-normal text-slate-500">cm</span>
                        </div>
                      </div>
                      
                      {/* Soil moisture level */}
                      <div className="text-right">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-sans font-semibold border border-slate-800 ${moistureInfo.color} ring-2 ${moistureInfo.ring} animate-pulse`}>
                          💧 {plot.soilMoisture}%
                        </span>
                      </div>
                    </div>

                    {/* Visual stalk graphic */}
                    <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden mt-3" id={`progress-container-${plot.plotId}`}>
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (plot.plantHeight / 150) * 100)}%` }}
                      ></div>
                    </div>

                    {/* Alerts overlay */}
                    {plot.alertStatus !== "normal" && (
                      <div className="absolute top-1.5 right-1.5" id={`alert-icon-${plot.plotId}`}>
                        <span className="flex h-2 w-2 relative">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${plot.alertStatus === "danger" ? "bg-red-400" : "bg-amber-400"} opacity-75`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${plot.alertStatus === "danger" ? "bg-red-500" : "bg-amber-500"}`}></span>
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
