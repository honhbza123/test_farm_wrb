/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PlotData {
  plotId: string;
  replication: number;
  waterSystem: "W1" | "W2" | "W3";
  waterSystemName: string;
  waterSystemDesc: string;
  varietyCode: number;
  varietyName: string;
  plotSize: string;
  plantCount: number;
  
  // Dynamic metrics that change over time
  soilMoisture: number; // %
  soilTemp: number; // °C
  plantHeight: number; // cm
  growthStage: string; // "VE" (Emergence), "V3" (3 leaves), "V8" (8 leaves), "VT" (Tasseling), "R1" (Silking), "R6" (Physiological maturity)
  spadIndex: number; // SPAD chlorophyll value
  nitrogenStatus: "Low" | "Optimal" | "High";
  dailyWaterUsage: number; // Liters
  alertStatus: "normal" | "warning" | "danger";
  alertMessage?: string;
}

export interface GrowthRecord {
  date: string;
  plotId: string;
  soilMoisture: number;
  plantHeight: number;
  spadIndex: number;
  dailyWaterUsage: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  plotId: string;
  type: "irrigation" | "measurement" | "fertilizer" | "alert";
  message: string;
  operator: string;
}

export interface InsightReport {
  timestamp: string;
  summary: string;
  recommendations: string[];
  varietyComparison: {
    varietyName: string;
    avgHeight: number;
    avgSpad: number;
    waterUseEfficiency: number; // cm of growth per Liter of water
  }[];
  waterSystemEfficiency: {
    system: string;
    avgMoisture: number;
    totalWaterUsed: number;
    healthScore: number;
  }[];
}
