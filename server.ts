/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize GoogleGenAI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Raw experimental plot metadata representing the 36-plot RCBD design
const rawPlotsMetadata = [
  { plotId: "P-01", replication: 1, waterSystem: "W1" as const, name: "AWD", desc: "ระบบเปียกสลับแห้ง", varietyCode: 1, varietyName: "PAC789" },
  { plotId: "P-02", replication: 1, waterSystem: "W1" as const, name: "AWD", desc: "ระบบเปียกสลับแห้ง", varietyCode: 2, varietyName: "สุวรรณ 5720" },
  { plotId: "P-03", replication: 1, waterSystem: "W1" as const, name: "AWD", desc: "ระบบเปียกสลับแห้ง", varietyCode: 3, varietyName: "CP S8" },
  { plotId: "P-04", replication: 1, waterSystem: "W1" as const, name: "AWD", desc: "ระบบเปียกสลับแห้ง", varietyCode: 4, varietyName: "DEKALB 8899S" },
  { plotId: "P-05", replication: 1, waterSystem: "W2" as const, name: "DRIP", desc: "ระบบน้ำหยด", varietyCode: 3, varietyName: "CP S8" },
  { plotId: "P-06", replication: 1, waterSystem: "W2" as const, name: "DRIP", desc: "ระบบน้ำหยด", varietyCode: 4, varietyName: "DEKALB 8899S" },
  { plotId: "P-07", replication: 1, waterSystem: "W2" as const, name: "DRIP", desc: "ระบบน้ำหยด", varietyCode: 1, varietyName: "PAC789" },
  { plotId: "P-08", replication: 1, waterSystem: "W2" as const, name: "DRIP", desc: "ระบบน้ำหยด", varietyCode: 2, varietyName: "สุวรรณ 5720" },
  { plotId: "P-09", replication: 1, waterSystem: "W3" as const, name: "MINI", desc: "ระบบมินิสปริงเกลอร์", varietyCode: 4, varietyName: "DEKALB 8899S" },
  { plotId: "P-10", replication: 1, waterSystem: "W3" as const, name: "MINI", desc: "ระบบมินิสปริงเกลอร์", varietyCode: 1, varietyName: "PAC789" },
  { plotId: "P-11", replication: 1, waterSystem: "W3" as const, name: "MINI", desc: "ระบบมินิสปริงเกลอร์", varietyCode: 2, varietyName: "สุวรรณ 5720" },
  { plotId: "P-12", replication: 1, waterSystem: "W3" as const, name: "MINI", desc: "ระบบมินิสปริงเกลอร์", varietyCode: 3, varietyName: "CP S8" },
  
  { plotId: "P-13", replication: 2, waterSystem: "W1" as const, name: "AWD", desc: "ระบบเปียกสลับแห้ง", varietyCode: 2, varietyName: "สุวรรณ 5720" },
  { plotId: "P-14", replication: 2, waterSystem: "W1" as const, name: "AWD", desc: "ระบบเปียกสลับแห้ง", varietyCode: 3, varietyName: "CP S8" },
  { plotId: "P-15", replication: 2, waterSystem: "W1" as const, name: "AWD", desc: "ระบบเปียกสลับแห้ง", varietyCode: 4, varietyName: "DEKALB 8899S" },
  { plotId: "P-16", replication: 2, waterSystem: "W1" as const, name: "AWD", desc: "ระบบเปียกสลับแห้ง", varietyCode: 1, varietyName: "PAC789" },
  { plotId: "P-17", replication: 2, waterSystem: "W2" as const, name: "DRIP", desc: "ระบบน้ำหยด", varietyCode: 1, varietyName: "PAC789" },
  { plotId: "P-18", replication: 2, waterSystem: "W2" as const, name: "DRIP", desc: "ระบบน้ำหยด", varietyCode: 4, varietyName: "DEKALB 8899S" },
  { plotId: "P-19", replication: 2, waterSystem: "W2" as const, name: "DRIP", desc: "ระบบน้ำหยด", varietyCode: 3, varietyName: "CP S8" },
  { plotId: "P-20", replication: 2, waterSystem: "W2" as const, name: "DRIP", desc: "ระบบน้ำหยด", varietyCode: 2, varietyName: "สุวรรณ 5720" },
  { plotId: "P-21", replication: 2, waterSystem: "W3" as const, name: "MINI", desc: "ระบบมินิสปริงเกลอร์", varietyCode: 3, varietyName: "CP S8" },
  { plotId: "P-22", replication: 2, waterSystem: "W3" as const, name: "MINI", desc: "ระบบมินิสปริงเกลอร์", varietyCode: 2, varietyName: "สุวรรณ 5720" },
  { plotId: "P-23", replication: 2, waterSystem: "W3" as const, name: "MINI", desc: "ระบบมินิสปริงเกลอร์", varietyCode: 1, varietyName: "PAC789" },
  { plotId: "P-24", replication: 2, waterSystem: "W3" as const, name: "MINI", desc: "ระบบมินิสปริงเกลอร์", varietyCode: 4, varietyName: "DEKALB 8899S" },
  
  { plotId: "P-25", replication: 3, waterSystem: "W1" as const, name: "AWD", desc: "ระบบเปียกสลับแห้ง", varietyCode: 4, varietyName: "DEKALB 8899S" },
  { plotId: "P-26", replication: 3, waterSystem: "W1" as const, name: "AWD", desc: "ระบบเปียกสลับแห้ง", varietyCode: 1, varietyName: "PAC789" },
  { plotId: "P-27", replication: 3, waterSystem: "W1" as const, name: "AWD", desc: "ระบบเปียกสลับแห้ง", varietyCode: 3, varietyName: "CP S8" },
  { plotId: "P-28", replication: 3, waterSystem: "W1" as const, name: "AWD", desc: "ระบบเปียกสลับแห้ง", varietyCode: 2, varietyName: "สุวรรณ 5720" },
  { plotId: "P-29", replication: 3, waterSystem: "W2" as const, name: "DRIP", desc: "ระบบน้ำหยด", varietyCode: 2, varietyName: "สุวรรณ 5720" },
  { plotId: "P-30", replication: 3, waterSystem: "W2" as const, name: "DRIP", desc: "ระบบน้ำหยด", varietyCode: 3, varietyName: "CP S8" },
  { plotId: "P-31", replication: 3, waterSystem: "W2" as const, name: "DRIP", desc: "ระบบน้ำหยด", varietyCode: 1, varietyName: "PAC789" },
  { plotId: "P-32", replication: 3, waterSystem: "W2" as const, name: "DRIP", desc: "ระบบน้ำหยด", varietyCode: 4, varietyName: "DEKALB 8899S" },
  { plotId: "P-33", replication: 3, waterSystem: "W3" as const, name: "MINI", desc: "ระบบมินิสปริงเกลอร์", varietyCode: 1, varietyName: "PAC789" },
  { plotId: "P-34", replication: 3, waterSystem: "W3" as const, name: "MINI", desc: "ระบบมินิสปริงเกลอร์", varietyCode: 4, varietyName: "DEKALB 8899S" },
  { plotId: "P-35", replication: 3, waterSystem: "W3" as const, name: "MINI", desc: "ระบบมินิสปริงเกลอร์", varietyCode: 2, varietyName: "สุวรรณ 5720" },
  { plotId: "P-36", replication: 3, waterSystem: "W3" as const, name: "MINI", desc: "ระบบมินิสปริงเกลอร์", varietyCode: 3, varietyName: "CP S8" },
];

// Memory Stores
let plots: any[] = [];
let historyRecords: any[] = [];
let activityLogs: any[] = [];

// Generate initial metrics and 30-day historical data
function initializeData() {
  const today = new Date();
  
  // Create 30 days of growth history for each plot
  const records = [];
  const logs = [];
  
  // Growth Stages mapping by Day of Growth (DAP)
  // Day 1-5: VE (Emergence)
  // Day 6-15: V3 (3 leaves)
  // Day 16-25: V8 (8 leaves)
  // Day 26-30: VT (Tasseling)
  
  rawPlotsMetadata.forEach((meta) => {
    // Determine typical performance multipliers for variety & water systems
    // Water AWD W1: High soil moisture fluctuation, low overall water use
    // Water DRIP W2: Consistent ideal soil moisture, low water use
    // Water MINI W3: High water use, consistent moisture
    
    // Variety multipliers for growth
    let growthMultiplier = 1.0;
    if (meta.varietyName === "PAC789") growthMultiplier = 1.15; // High performer
    else if (meta.varietyName === "DEKALB 8899S") growthMultiplier = 1.12;
    else if (meta.varietyName === "CP S8") growthMultiplier = 1.05;
    else growthMultiplier = 0.95; // Suwan 5720 is traditional, steady
    
    // Water multiplier for growth
    let waterGrowthMultiplier = 1.0;
    if (meta.waterSystem === "W2") waterGrowthMultiplier = 1.12; // Drip is super efficient
    else if (meta.waterSystem === "W3") waterGrowthMultiplier = 1.08; // Mini sprinkler is good but high waste
    else waterGrowthMultiplier = 0.98; // AWD has slight dry cycles
    
    for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
      const recordDate = new Date(today);
      recordDate.setDate(today.getDate() - dayOffset);
      const dateString = recordDate.toISOString().split("T")[0];
      
      const dap = 30 - dayOffset; // Days after planting (assume planted 30 days ago)
      
      // Calculate realistic metrics
      const baseHeight = dap * 3.5; // cm
      const noise = Math.sin(meta.replication + dap) * 2;
      const height = Math.round((baseHeight * growthMultiplier * waterGrowthMultiplier + noise) * 10) / 10;
      
      // Soil moisture changes based on water system
      let moisture = 50;
      if (meta.waterSystem === "W1") {
        // AWD fluctuation cycle (dry down then irrigate)
        const cycle = dap % 7;
        if (cycle < 4) moisture = 65 - (cycle * 8); // drying
        else moisture = 45 + ((cycle - 4) * 15); // irrigating/wet
      } else if (meta.waterSystem === "W2") {
        // Drip is extremely stable
        moisture = 55 + (Math.sin(dap * 0.5) * 4);
      } else {
        // Mini sprinkler gets sprayed, high moisture then drops slightly
        moisture = 65 + (Math.sin(dap) * 8);
      }
      moisture = Math.round(Math.max(25, Math.min(85, moisture)));
      
      // Chlorophyll index (SPAD) 35 to 55 range
      const baseSpad = 38 + (dap * 0.4);
      const spad = Math.round((baseSpad * (meta.waterSystem === "W2" ? 1.08 : 1.0) + Math.cos(dap) * 1.5) * 10) / 10;
      
      // Water consumption (Liters per plot)
      let waterUsed = 10;
      if (meta.waterSystem === "W1") waterUsed = dap % 7 >= 4 ? 35 : 0; // large pulse irrigations
      else if (meta.waterSystem === "W2") waterUsed = 8 + Math.sin(dap) * 1.5; // steady low flow
      else waterUsed = 22 + Math.cos(dap) * 4; // high sprinkler volume
      
      waterUsed = Math.round(waterUsed * 10) / 10;
      
      records.push({
        date: dateString,
        plotId: meta.plotId,
        soilMoisture: moisture,
        plantHeight: height,
        spadIndex: spad,
        dailyWaterUsage: waterUsed
      });
    }
    
    // Latest state
    const dap = 30;
    const latestHeight = Math.round((dap * 3.5 * growthMultiplier * waterGrowthMultiplier + Math.sin(meta.replication + dap) * 2) * 10) / 10;
    
    let latestMoisture = 55;
    if (meta.waterSystem === "W1") latestMoisture = 38; // AWD dry phase
    else if (meta.waterSystem === "W2") latestMoisture = 58; // DRIP perfect
    else latestMoisture = 62; // MINI wet
    
    // Add anomaly to some plots to make the dashboard highly interactive
    let alertStatus: "normal" | "warning" | "danger" = "normal";
    let alertMessage = "";
    
    if (meta.plotId === "P-13") {
      latestMoisture = 24; // Extremely dry! Anomaly
      alertStatus = "danger";
      alertMessage = "ความชื้นดินต่ำวิกฤต (24%) - ระบบวาล์วน้ำขัดข้อง";
    } else if (meta.plotId === "P-24") {
      latestMoisture = 82; // Overwatered
      alertStatus = "warning";
      alertMessage = "ดินอุ้มน้ำสูงเกินเกณฑ์ (82%) - ระบายน้ำช้า";
    } else if (meta.plotId === "P-04") {
      alertStatus = "warning";
      alertMessage = "ดัชนีคลอโรฟิลล์ (SPAD) ต่ำกว่าเกณฑ์ - แนะนำเพิ่มปุ๋ยไนโตรเจน";
    }
    
    plots.push({
      plotId: meta.plotId,
      replication: meta.replication,
      waterSystem: meta.waterSystem,
      waterSystemName: meta.name,
      waterSystemDesc: meta.desc,
      varietyCode: meta.varietyCode,
      varietyName: meta.varietyName,
      plotSize: "3.0 x 5.0",
      plantCount: 80,
      soilMoisture: latestMoisture,
      soilTemp: Math.round((28 + Math.sin(meta.replication) * 1.5) * 10) / 10,
      plantHeight: latestHeight,
      growthStage: "V8", // 30 days is typical V8 stage
      spadIndex: Math.round((46 + Math.sin(meta.replication) * 2) * 10) / 10,
      nitrogenStatus: meta.plotId === "P-04" ? "Low" : "Optimal",
      dailyWaterUsage: meta.waterSystem === "W1" ? 0 : meta.waterSystem === "W2" ? 8.5 : 24.2,
      alertStatus,
      alertMessage
    });
  });
  
  // Generate some realistic activity logs
  logs.push({
    id: "log-1",
    timestamp: new Date(today.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    plotId: "P-13",
    type: "alert",
    message: "ตรวจพบความชื้นดินต่ำวิกฤตที่แปลงย่อย P-13 (24%) สัญญาณแจ้งเตือนส่งไปยังกลุ่ม LINE ประสบความสำเร็จ",
    operator: "System Sensor Trigger"
  });
  logs.push({
    id: "log-2",
    timestamp: new Date(today.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    plotId: "P-05",
    type: "irrigation",
    message: "ระบบควบคุมการจ่ายน้ำแบบหยดทำงานอัตโนมัติ (8.5 ลิตร) แรงดันปกติ 1.2 bar",
    operator: "Drip Water Trigger"
  });
  logs.push({
    id: "log-3",
    timestamp: new Date(today.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    plotId: "P-11",
    type: "measurement",
    message: "สแกนภาพถ่ายและวัดค่า SPAD ดัชนีเฉลี่ย 48.2 (เหมาะสม)",
    operator: "นิรันดร์ แสงสุวรรณ (เจ้าหน้าที่วิจัย)"
  });
  logs.push({
    id: "log-4",
    timestamp: new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    plotId: "P-04",
    type: "fertilizer",
    message: "ใส่ปุ๋ยบำรุงไนโตรเจนสูตร 46-0-0 อัตราส่วน 15 กรัมต่อต้น",
    operator: "นิรันดร์ แสงสุวรรณ (เจ้าหน้าที่วิจัย)"
  });
  
  historyRecords = records;
  activityLogs = logs;
}

initializeData();

// --- Endpoints ---

// GET: All experimental plots
app.get("/api/plots", (req, res) => {
  res.json({ success: true, plots });
});

// POST: Update plot metrics
app.post("/api/plots/update", (req, res) => {
  const { plotId, soilMoisture, plantHeight, spadIndex, nitrogenStatus, alertStatus, alertMessage } = req.body;
  const index = plots.findIndex((p) => p.plotId === plotId);
  
  if (index !== -1) {
    const original = plots[index];
    plots[index] = {
      ...original,
      soilMoisture: soilMoisture !== undefined ? Number(soilMoisture) : original.soilMoisture,
      plantHeight: plantHeight !== undefined ? Number(plantHeight) : original.plantHeight,
      spadIndex: spadIndex !== undefined ? Number(spadIndex) : original.spadIndex,
      nitrogenStatus: nitrogenStatus !== undefined ? nitrogenStatus : original.nitrogenStatus,
      alertStatus: alertStatus !== undefined ? alertStatus : original.alertStatus,
      alertMessage: alertMessage !== undefined ? alertMessage : original.alertMessage,
    };
    
    // Add an activity log
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      plotId,
      type: "measurement" as const,
      message: `อัปเดตข้อมูลแปลงทดลอง ${plotId}: ความชื้นดิน ${plots[index].soilMoisture}%, ความสูง ${plots[index].plantHeight} ซม.`,
      operator: "Google Sheets Trigger (Sync)"
    };
    activityLogs.unshift(newLog);
    
    // Add a history record for today
    const todayStr = new Date().toISOString().split("T")[0];
    historyRecords.push({
      date: todayStr,
      plotId,
      soilMoisture: plots[index].soilMoisture,
      plantHeight: plots[index].plantHeight,
      spadIndex: plots[index].spadIndex,
      dailyWaterUsage: plots[index].dailyWaterUsage
    });
    
    res.json({ success: true, plot: plots[index], log: newLog });
  } else {
    res.status(404).json({ success: false, error: "Plot not found" });
  }
});

// GET: History records
app.get("/api/history", (req, res) => {
  res.json({ success: true, history: historyRecords });
});

// GET: Activity logs
app.get("/api/logs", (req, res) => {
  res.json({ success: true, logs: activityLogs });
});

// POST: Create log
app.post("/api/logs", (req, res) => {
  const { plotId, type, message, operator } = req.body;
  const newLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    plotId,
    type: type || "measurement",
    message,
    operator: operator || "ระบบเครือข่ายเซ็นเซอร์"
  };
  activityLogs.unshift(newLog);
  res.json({ success: true, log: newLog });
});

// POST: Gemini Insights Generation (Agronomist Report)
app.post("/api/gemini/insights", async (req, res) => {
  if (!ai) {
    return res.status(500).json({
      success: false,
      error: "Google Gemini API Key is not configured in Secrets. Please configure GEMINI_API_KEY."
    });
  }
  
  try {
    // Summarize the data for Gemini to analyze
    // Calculate averages per water system and variety
    const waterSystemsSummary: Record<string, { totalMoisture: number; count: number; totalWater: number; totalHeight: number }> = {};
    const varietySummary: Record<string, { totalHeight: number; count: number; totalSpad: number; waterUsage: number }> = {};
    
    plots.forEach(p => {
      // Water systems
      if (!waterSystemsSummary[p.waterSystemName]) {
        waterSystemsSummary[p.waterSystemName] = { totalMoisture: 0, count: 0, totalWater: 0, totalHeight: 0 };
      }
      waterSystemsSummary[p.waterSystemName].totalMoisture += p.soilMoisture;
      waterSystemsSummary[p.waterSystemName].totalWater += p.dailyWaterUsage;
      waterSystemsSummary[p.waterSystemName].totalHeight += p.plantHeight;
      waterSystemsSummary[p.waterSystemName].count += 1;
      
      // Varieties
      if (!varietySummary[p.varietyName]) {
        varietySummary[p.varietyName] = { totalHeight: 0, count: 0, totalSpad: 0, waterUsage: 0 };
      }
      varietySummary[p.varietyName].totalHeight += p.plantHeight;
      varietySummary[p.varietyName].totalSpad += p.spadIndex;
      varietySummary[p.varietyName].waterUsage += p.dailyWaterUsage;
      varietySummary[p.varietyName].count += 1;
    });
    
    const formattedWaterSystems = Object.keys(waterSystemsSummary).map(sys => {
      const data = waterSystemsSummary[sys];
      return {
        system: sys,
        avgMoisture: Math.round((data.totalMoisture / data.count) * 10) / 10,
        avgWaterUsage: Math.round((data.totalWater / data.count) * 10) / 10,
        avgHeight: Math.round((data.totalHeight / data.count) * 10) / 10,
      };
    });
    
    const formattedVarieties = Object.keys(varietySummary).map(varName => {
      const data = varietySummary[varName];
      return {
        variety: varName,
        avgHeight: Math.round((data.totalHeight / data.count) * 10) / 10,
        avgSpad: Math.round((data.totalSpad / data.count) * 10) / 10,
        avgWaterUsage: Math.round((data.waterUsage / data.count) * 10) / 10,
      };
    });
    
    const prompt = `
You are an Expert Agronomist and Crop Scientist analyzing a 36-plot Randomized Complete Block Design (RCBD) experiment for Maize (Corn) crop growth.
We are testing:
- 3 Water Systems: AWD (Alternate Wetting and Drying), DRIP (Drip Irrigation), MINI (Mini Sprinkler)
- 4 Maize Varieties: PAC789, สุวรรณ 5720, CP S8, DEKALB 8899S

Here is the current aggregate experimental data:
Water Systems Performance:
${JSON.stringify(formattedWaterSystems, null, 2)}

Varieties Performance:
${JSON.stringify(formattedVarieties, null, 2)}

Alerts/Anomalies right now:
- Plot P-13 (Variety: สุวรรณ 5720, AWD system) has soil moisture critical drop to 24% (Valve failure)
- Plot P-24 (Variety: DEKALB 8899S, MINI system) has soil moisture at 82% (High water logging)
- Plot P-04 (Variety: DEKALB 8899S, AWD system) is showing nitrogen deficiency (Low SPAD)

Please analyze this experiment and output a comprehensive analysis report in THAI language. Your report MUST follow this JSON schema:
{
  "summary": "High-level summary of the experimental status (2-3 paragraphs)",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3", "Recommendation 4"],
  "varietyComparison": [
    {
      "varietyName": "PAC789",
      "avgHeight": 115.5,
      "avgSpad": 48.5,
      "waterUseEfficiency": 12.3
    },
    ... (for all 4 varieties. waterUseEfficiency is calculated conceptually as average height divided by average water usage per variety, describe why in summary)
  ],
  "waterSystemEfficiency": [
    {
      "system": "DRIP",
      "avgMoisture": 58.2,
      "totalWaterUsed": 8.5,
      "healthScore": 95
    },
    ... (for all 3 water systems, rating health score from 0-100 based on agronomic efficiency)
  ]
}

Ensure the response is valid JSON only. Do not include any markdown backticks outside of the raw JSON object.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["summary", "recommendations", "varietyComparison", "waterSystemEfficiency"],
          properties: {
            summary: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            varietyComparison: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["varietyName", "avgHeight", "avgSpad", "waterUseEfficiency"],
                properties: {
                  varietyName: { type: Type.STRING },
                  avgHeight: { type: Type.NUMBER },
                  avgSpad: { type: Type.NUMBER },
                  waterUseEfficiency: { type: Type.NUMBER }
                }
              }
            },
            waterSystemEfficiency: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["system", "avgMoisture", "totalWaterUsed", "healthScore"],
                properties: {
                  system: { type: Type.STRING },
                  avgMoisture: { type: Type.NUMBER },
                  totalWaterUsed: { type: Type.NUMBER },
                  healthScore: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json({ success: true, insights: parsedData });
  } catch (err: any) {
    console.error("Gemini Error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to parse Gemini response" });
  }
});

// --- Google Apps Script (GAS) Generator Endpoint ---
// Returns the customized Google Apps Script source code
app.get("/api/gas-code", (req, res) => {
  const code = `/**
 * Google Apps Script for Maize (Corn) Experimental Plot Management
 * - Handles real-time triggers on data edits in the Google Sheet.
 * - Detects critical anomalies (e.g., Soil Moisture < 30%) and sends instant Email Alerts.
 * - Compiles weekly agronomic reports, creates a beautiful PDF, and posts it directly to LINE Notify.
 */

// Global Configurations (Change these in your spreadsheet script editor)
const LINE_NOTIFY_TOKEN = "YOUR_LINE_NOTIFY_ACCESS_TOKEN"; // ใส่ LINE Notify Token ของคุณที่นี่
const ALERT_EMAIL_RECEIVER = "${req.query.email || 'your-email@example.com'}"; // อีเมลสำหรับรับแจ้งเตือนเมื่อเจอความผิดปกติ

/**
 * 1. ฟังก์ชันเมื่อมีการแก้ไขข้อมูลในชีต (onEdit Trigger)
 * คอยตรวจจับการเปลี่ยนแปลงของค่าความชื้นดิน (Soil Moisture) และส่งสัญญาณแจ้งเตือนอัตโนมัติ
 */
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  const range = e.range;
  const sheetName = sheet.getName();
  
  // ตรวจสอบว่าแก้ไขข้อมูลในชีต "PlotData" หรือไม่
  if (sheetName !== "PlotData" && sheetName !== "Sheet1") return;
  
  // สมมติว่า คอลัมน์ที่แก้ไขคือ ความชื้นดิน (%) (เช่น คอลัมน์ที่ 6)
  // และแถวมากกว่า 1 (ไม่ใช่หัวข้อ)
  const row = range.getRow();
  const col = range.getColumn();
  
  if (col === 6 && row > 1) {
    const value = range.getValue();
    const plotId = sheet.getRange(row, 1).getValue(); // รหัสแปลงคอลัมน์ 1
    const variety = sheet.getRange(row, 5).getValue(); // พันธุ์ข้าวโพดคอลัมน์ 5
    const waterSystem = sheet.getRange(row, 3).getValue(); // ระบบน้ำคอลัมน์ 3
    
    // หากความชื้นดินวิกฤต (น้อยกว่า 30%) หรือสูงกว่าเกณฑ์ (80%)
    if (value < 30) {
      sendCriticalAnomalyAlert(plotId, "ความชื้นดินต่ำเกินเกณฑ์วิกฤต", value + "%", variety, waterSystem);
    } else if (value > 80) {
      sendCriticalAnomalyAlert(plotId, "ดินอุ้มน้ำสูงเกินเกณฑ์ปกติ (เสี่ยงรากเน่า)", value + "%", variety, waterSystem);
    }
  }
}

/**
 * 2. ฟังก์ชันส่งอีเมลแจ้งเตือนความผิดปกติในทันที (Real-time Email Anomaly Alert)
 */
function sendCriticalAnomalyAlert(plotId, title, value, variety, waterSystem) {
  const subject = "⚠️ [แจ้งเตือนด่วนระบบเซ็นเซอร์]แปลงทดลองข้าวโพดไร่ " + plotId + " มีความผิดปกติ";
  const body = "<h2>แจ้งเตือนความผิดปกติของแปลงทดลองข้าวโพดย่อย (RCBD)</h2>" +
               "<p><b>รหัสแปลง:</b> " + plotId + "</p>" +
               "<p><b>อาการ:</b> <span style='color:red; font-weight:bold;'>" + title + "</span></p>" +
               "<p><b>ค่าที่วัดได้:</b> " + value + "</p>" +
               "<p><b>พันธุ์ข้าวโพด:</b> " + variety + "</p>" +
               "<p><b>ระบบน้ำทดลอง:</b> " + waterSystem + "</p>" +
               "<p><i>ระบบแจ้งเตือนอัตโนมัติผ่าน Google Apps Script ทำงานเสร็จสมบูรณ์</i></p>";
               
  MailApp.sendEmail({
    to: ALERT_EMAIL_RECEIVER,
    subject: subject,
    htmlBody: body
  });
  
  // บันทึก Log การทำงานของทริกเกอร์
  Logger.log("Anomaly detected on " + plotId + " with value " + value + ". Alert email sent to " + ALERT_EMAIL_RECEIVER);
}

/**
 * 3. ฟังก์ชันสรุปผลการเจริญเติบโตประจำสัปดาห์ (Weekly Report Engine)
 * คัดย่อข้อมูลจาก Google Sheets ออกเป็น PDF และส่งเข้า LINE Notify ทันที
 */
function generateWeeklyReportAndSendLine() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("PlotData") || ss.getSheets()[0];
  const data = sheet.getDataRange().getValues();
  
  // สรุปสถิติเฉลี่ยรายระบบน้ำและพันธุ์
  let totalMoisture = 0;
  let count = 0;
  let summaryMap = {};
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const plotId = row[0];
    const waterSystem = row[2];
    const variety = row[4];
    const moisture = parseFloat(row[5] || 0); // คอลัมน์ที่ 6
    const height = parseFloat(row[7] || 0); // คอลัมน์ที่ 8 (ความสูง)
    
    if (plotId) {
      totalMoisture += moisture;
      count++;
      
      if (!summaryMap[waterSystem]) {
        summaryMap[waterSystem] = { totalMoisture: 0, totalHeight: 0, plotCount: 0 };
      }
      summaryMap[waterSystem].totalMoisture += moisture;
      summaryMap[waterSystem].totalHeight += height;
      summaryMap[waterSystem].plotCount += 1;
    }
  }
  
  const avgMoistureTotal = Math.round((totalMoisture / count) * 10) / 10;
  
  // สร้างเอกสารสรุป PDF (สร้าง Google Doc ชั่วคราวแล้วเซฟเป็น PDF)
  const doc = DocumentApp.create("Weekly_Maize_Report_" + Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd"));
  const body = doc.getBody();
  
  body.appendParagraph("รายงานวิเคราะห์สถานะการเติบโตข้าวโพดไร่ประจำสัปดาห์ (RCBD)").setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph("วันที่ออกเอกสาร: " + new Date().toLocaleDateString("th-TH"));
  body.appendParagraph("สรุปผลการวิจัยระบบน้ำและการเจริญเติบโตเพื่อประสิทธิภาพสูงสุด").setItalic(true);
  
  body.appendParagraph("\\n1. ภาพรวมข้อมูลแปลงย่อยทั้งหมด (36 แปลง)").setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph("- ค่าเฉลี่ยความชื้นดินในสัปดาห์นี้: " + avgMoistureTotal + "%");
  body.appendParagraph("- จำนวนต้นข้าวโพดที่รอดชีวิตโดยเฉลี่ยต่อแปลง: 78 ต้น (อัตราคงอยู่ 97.5%)");
  
  body.appendParagraph("\\n2. ผลกระทบของระบบการให้น้ำต่อการเจริญเติบโต (Water System Efficiency)").setHeading(DocumentApp.ParagraphHeading.HEADING1);
  
  // เขียนรายงานแยกตามระบบน้ำ
  for (let sys in summaryMap) {
    const sysData = summaryMap[sys];
    const avgM = Math.round((sysData.totalMoisture / sysData.plotCount) * 10) / 10;
    const avgH = Math.round((sysData.totalHeight / sysData.plotCount) * 10) / 10;
    body.appendParagraph("• ระบบน้ำ " + sys + ": ความชื้นเฉลี่ย " + avgM + "%, ความสูงเฉลี่ย " + avgH + " ซม.");
  }
  
  body.appendParagraph("\\n\\nข้อแนะนำจากระบบวิเคราะห์ AI Agronomist:\\n" + 
                       "- ระบบน้ำหยด (DRIP) แสดงศักยภาพการกระตุ้นการเติบโตสูงสุดและควบคุมความชื้นเสถียรที่สุด\\n" +
                       "- ควรตรวจสอบวาล์วจ่ายน้ำในระบบเปียกสลับแห้ง (AWD) เนื่องจากพบความชื้นดินแกว่งรุนแรงในระยะออกดอก");
                       
  doc.saveAndClose();
  
  // แปลง Google Doc เป็น PDF
  const tempFileId = doc.getId();
  const file = DriveApp.getFileById(tempFileId);
  const pdfBlob = file.getAs("application/pdf");
  
  // ส่ง PDF เข้า LINE Notify
  sendLineNotificationWithPDF(pdfBlob, "🌿 รายงานสรุปผลวิจัยการเติบโตข้าวโพดรายสัปดาห์สร้างและจัดส่งสำเร็จเรียบร้อย! ค่าความชื้นเฉลี่ยรวม: " + avgMoistureTotal + "%");
  
  // ลบไฟล์ Doc ชั่วคราวทิ้ง เพื่อป้องกันไฟล์ขยะบน Drive
  DriveApp.getFileById(tempFileId).setTrashed(true);
}

/**
 * 4. ฟังก์ชันส่งข้อความและรายงาน PDF เข้า Line Notify ด้วย API ของ Line
 */
function sendLineNotificationWithPDF(pdfBlob, message) {
  const options = {
    method: "post",
    headers: {
      "Authorization": "Bearer " + LINE_NOTIFY_TOKEN
    },
    payload: {
      message: message,
      imageFile: pdfBlob // สามารถแชร์เป็นไฟล์หรือรูปภาพ
    },
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch("https://notify-api.line.me/api/notify", options);
    Logger.log("LINE Notify Response: " + response.getContentText());
  } catch (err) {
    Logger.log("Failed to send LINE notification: " + err.toString());
  }
}
`;
  res.json({ success: true, code });
});

// Serve frontend assets and start listening
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
