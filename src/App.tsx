/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Droplet, 
  TrendingUp, 
  Leaf, 
  Layers, 
  AlertTriangle, 
  Activity, 
  User, 
  Clock, 
  Plus, 
  Check, 
  Settings, 
  Calendar, 
  FileText, 
  Sparkles,
  RefreshCw,
  Search,
  BookOpen,
  Info,
  MapPin,
  Building2,
  Thermometer,
  Mountain,
  Compass,
  Sun,
  Cloud,
  CloudRain,
  CloudSun,
  CloudLightning,
  Wind,
  Umbrella
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from "recharts";
import { PlotData, GrowthRecord, ActivityLog } from "./types";
import PlotGrid from "./components/PlotGrid";
import AppsScriptCenter from "./components/AppsScriptCenter";
import AIAgronomist from "./components/AIAgronomist";
import phuRueaImage from "./assets/images/maize_field_phuruea_1782912123907.jpg";

export default function App() {
  const userEmail = "beehbza123456@gmail.com";
  const [plots, setPlots] = useState<PlotData[]>([]);
  const [history, setHistory] = useState<GrowthRecord[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<PlotData | null>(null);
  
  // Filtering & configuration
  const [filterVariety, setFilterVariety] = useState("");
  const [filterWaterSystem, setFilterWaterSystem] = useState("");
  const [timePeriod, setTimePeriod] = useState<"7" | "15" | "30">("30");
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [weatherTab, setWeatherTab] = useState<"daily" | "weekly" | "monthly">("weekly");

  // Edit plot state
  const [editMoisture, setEditMoisture] = useState<number>(50);
  const [editHeight, setEditHeight] = useState<number>(100);
  const [editSpad, setEditSpad] = useState<number>(45);
  const [editNitrogen, setEditNitrogen] = useState<"Low" | "Optimal" | "High">("Optimal");

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [plotsRes, histRes, logsRes] = await Promise.all([
        fetch("/api/plots"),
        fetch("/api/history"),
        fetch("/api/logs")
      ]);
      
      const plotsData = await plotsRes.json();
      const histData = await histRes.json();
      const logsData = await logsRes.json();

      if (plotsData.success) setPlots(plotsData.plots);
      if (histData.success) setHistory(histData.history);
      if (logsData.success) setLogs(logsData.logs);
      
      // Auto-select P-13 to demonstrate alert handling on startup
      if (plotsData.success && plotsData.plots.length > 0) {
        const p13 = plotsData.plots.find((p: PlotData) => p.plotId === "P-13");
        if (p13) {
          setSelectedPlot(p13);
          setEditMoisture(p13.soilMoisture);
          setEditHeight(p13.plantHeight);
          setEditSpad(p13.spadIndex);
          setEditNitrogen(p13.nitrogenStatus);
        }
      }
    } catch (err) {
      console.error("Failed to load experimental plot data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update a plot's metrics (simulate trigger edit)
  const handleUpdatePlot = async () => {
    if (!selectedPlot) return;
    setSyncStatus("กำลังซิงค์อัปเดตและรัน Google Apps Script Triggers...");
    
    try {
      const alertStatus = editMoisture < 30 ? "danger" : editMoisture < 45 || editMoisture > 80 ? "warning" : "normal";
      const alertMessage = editMoisture < 30 
        ? `ความชื้นต่ำวิกฤต (${editMoisture}%) - ทริกเกอร์แจ้งเตือนอีเมลถูกจัดส่ง` 
        : editMoisture > 80 
        ? `ความชื้นสูงผิดปกติ (${editMoisture}%) - ดินระบายน้ำช้า` 
        : undefined;

      const response = await fetch("/api/plots/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plotId: selectedPlot.plotId,
          soilMoisture: editMoisture,
          plantHeight: editHeight,
          spadIndex: editSpad,
          nitrogenStatus: editNitrogen,
          alertStatus,
          alertMessage
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setSyncStatus("บันทึกข้อมูลและส่งสัญญาณ Trigger สำเร็จ!");
        
        // Refresh local data
        setPlots(prev => prev.map(p => p.plotId === selectedPlot.plotId ? data.plot : p));
        setSelectedPlot(data.plot);
        
        // Prepend new activity log
        setLogs(prev => [data.log, ...prev]);

        // If moisture is critical, pop an alert
        if (editMoisture < 30) {
          alert(`⚠️ แจ้งเตือนทริกเกอร์อัจฉริยะทำงาน!\n\nตรวจพบความชื้นต่ำเกินเกณฑ์ (${editMoisture}%) ที่แปลง ${selectedPlot.plotId}\nระบบได้ส่งคำสั่งเตือนภัยด่วนไปยังเมลวิจัยและกลุ่มไลน์สำเร็จเรียบร้อย`);
        }
        
        setTimeout(() => setSyncStatus(null), 3000);
      }
    } catch (err) {
      console.error("Failed to save plot update", err);
      setSyncStatus("บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง");
    }
  };

  // Select another plot
  const handleSelectPlot = (plot: PlotData) => {
    setSelectedPlot(plot);
    setEditMoisture(plot.soilMoisture);
    setEditHeight(plot.plantHeight);
    setEditSpad(plot.spadIndex);
    setEditNitrogen(plot.nitrogenStatus);
  };

  // Compile Chart data filtered by Period and aggregated appropriately
  const getVarietyGrowthChartData = () => {
    if (history.length === 0) return [];
    
    // Group records by Date and calculate average height per variety
    const grouped: Record<string, any> = {};
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(timePeriod));
    
    history.forEach((rec) => {
      const recDate = new Date(rec.date);
      if (recDate < cutoffDate) return;
      
      const plotMeta = plots.find((p) => p.plotId === rec.plotId);
      if (!plotMeta) return;
      
      const dateStr = rec.date;
      if (!grouped[dateStr]) {
        grouped[dateStr] = { date: dateStr, PAC789: 0, Suwan5720: 0, CPS8: 0, Dekalb: 0, countPAC: 0, countSuwan: 0, countCP: 0, countDekalb: 0 };
      }
      
      if (plotMeta.varietyName === "PAC789") {
        grouped[dateStr].PAC789 += rec.plantHeight;
        grouped[dateStr].countPAC++;
      } else if (plotMeta.varietyName === "สุวรรณ 5720") {
        grouped[dateStr].Suwan5720 += rec.plantHeight;
        grouped[dateStr].countSuwan++;
      } else if (plotMeta.varietyName === "CP S8") {
        grouped[dateStr].CPS8 += rec.plantHeight;
        grouped[dateStr].countCP++;
      } else if (plotMeta.varietyName === "DEKALB 8899S") {
        grouped[dateStr].Dekalb += rec.plantHeight;
        grouped[dateStr].countDekalb++;
      }
    });

    return Object.keys(grouped).sort().map((date) => {
      const g = grouped[date];
      return {
        date: date.substring(5), // truncate year
        "PAC789 (พรีเมียม)": g.countPAC > 0 ? Math.round((g.PAC789 / g.countPAC) * 10) / 10 : 0,
        "สุวรรณ 5720 (คงทน)": g.countSuwan > 0 ? Math.round((g.Suwan5720 / g.countSuwan) * 10) / 10 : 0,
        "CP S8 (ต้านทานสูง)": g.countCP > 0 ? Math.round((g.CPS8 / g.countCP) * 10) / 10 : 0,
        "DEKALB 8899S": g.countDekalb > 0 ? Math.round((g.Dekalb / g.countDekalb) * 10) / 10 : 0,
      };
    });
  };

  const getMoistureCyclesChartData = () => {
    if (history.length === 0) return [];
    
    const grouped: Record<string, any> = {};
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(timePeriod));
    
    history.forEach((rec) => {
      const recDate = new Date(rec.date);
      if (recDate < cutoffDate) return;
      
      const plotMeta = plots.find((p) => p.plotId === rec.plotId);
      if (!plotMeta) return;
      
      const dateStr = rec.date;
      if (!grouped[dateStr]) {
        grouped[dateStr] = { date: dateStr, AWD: 0, DRIP: 0, MINI: 0, countAWD: 0, countDRIP: 0, countMINI: 0 };
      }
      
      if (plotMeta.waterSystem === "W1") {
        grouped[dateStr].AWD += rec.soilMoisture;
        grouped[dateStr].countAWD++;
      } else if (plotMeta.waterSystem === "W2") {
        grouped[dateStr].DRIP += rec.soilMoisture;
        grouped[dateStr].countDRIP++;
      } else if (plotMeta.waterSystem === "W3") {
        grouped[dateStr].MINI += rec.soilMoisture;
        grouped[dateStr].countMINI++;
      }
    });

    return Object.keys(grouped).sort().map((date) => {
      const g = grouped[date];
      return {
        date: date.substring(5),
        "เปียกสลับแห้ง (AWD)": g.countAWD > 0 ? Math.round(g.AWD / g.countAWD) : 0,
        "ระบบน้ำหยด (DRIP)": g.countDRIP > 0 ? Math.round(g.DRIP / g.countDRIP) : 0,
        "สปริงเกลอร์ (MINI)": g.countMINI > 0 ? Math.round(g.MINI / g.countMINI) : 0,
      };
    });
  };

  // Compute metrics summaries
  const avgMoisture = plots.length > 0 ? Math.round(plots.reduce((acc, p) => acc + p.soilMoisture, 0) / plots.length) : 0;
  const avgHeightValue = plots.length > 0 ? Math.round((plots.reduce((acc, p) => acc + p.plantHeight, 0) / plots.length) * 10) / 10 : 0;
  const avgSpadValue = plots.length > 0 ? Math.round((plots.reduce((acc, p) => acc + p.spadIndex, 0) / plots.length) * 10) / 10 : 0;
  const dangerAlertsCount = plots.filter((p) => p.alertStatus === "danger").length;
  const warningAlertsCount = plots.filter((p) => p.alertStatus === "warning").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 font-sans" id="app-root">
      {/* Bento-Style Header Panel */}
      <header className="max-w-7xl mx-auto px-6 pt-8" id="main-header">
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 pointer-events-none"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              <Leaf className="h-6 w-6 text-emerald-400 fill-emerald-400/10" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                  SheetSync Corn Analytics Pro
                </h1>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full font-sans uppercase">
                  RCBD v2.4.0 Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                ระบบจัดการแปลงเกษตรและ Triggers จำลอง คุมสถานะความชื้นดินและดัชนีสายพันธุ์ข้าวโพด 36 แปลงซิงค์ LINE Notify
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-slate-950/60 border border-slate-800/80 px-5 py-3.5 rounded-2xl relative z-10" id="user-info-badge">
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Research Lead</p>
              <p className="text-xs font-mono font-semibold text-emerald-400">{userEmail}</p>
            </div>
            <div className="h-8 w-[1px] bg-slate-800"></div>
            <div className="bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20 text-emerald-400">
              <User className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>

      {/* KPI Bento Grid Strip */}
      <section className="max-w-7xl mx-auto px-6 mt-6" id="kpi-strip">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Moisture CARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-lg">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Soil Moisture (เฉลี่ย)</span>
              <p className="text-2xl font-bold text-white font-mono tracking-tight flex items-baseline gap-1.5">
                {avgMoisture}%
                <span className="text-xs font-semibold text-emerald-400 font-sans">เสถียร</span>
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl text-sky-400">
              <Droplet className="h-5 w-5" />
            </div>
          </div>

          {/* Plant Height CARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-lg">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Plant Height (ความสูง)</span>
              <p className="text-2xl font-bold text-white font-mono tracking-tight">
                {avgHeightValue} <span className="text-xs font-normal text-slate-400">cm</span>
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          {/* SPAD Chlorophyll CARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-lg">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">SPAD Index (คลอโรฟิลล์)</span>
              <p className="text-2xl font-bold text-white font-mono tracking-tight">
                {avgSpadValue} <span className="text-xs font-normal text-slate-400">SPAD</span>
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl text-green-400">
              <Leaf className="h-5 w-5" />
            </div>
          </div>

          {/* Active Alerts CARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-lg">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sensor Alerts Status</span>
              <p className="text-2xl font-bold font-mono tracking-tight">
                {dangerAlertsCount > 0 ? (
                  <span className="text-red-400 animate-pulse">{dangerAlertsCount} วิกฤต</span>
                ) : warningAlertsCount > 0 ? (
                  <span className="text-amber-400">{warningAlertsCount} ผิดปกติ</span>
                ) : (
                  <span className="text-emerald-400">เสถียรปกติ</span>
                )}
              </p>
            </div>
            <div className={`p-3.5 rounded-2xl border border-slate-800 ${dangerAlertsCount > 0 ? "bg-red-500/10 text-red-400" : "bg-slate-950 text-slate-500"}`}>
              <AlertTriangle className={`h-5 w-5 ${dangerAlertsCount > 0 ? "animate-bounce" : ""}`} />
            </div>
          </div>
        </div>
      </section>

      {/* Main Bento Grid Layout Container */}
      <main className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6" id="main-content">
        
        {/* Left Side (Grid Column 1 & 2): 36 Plots layout + Trends + AI + GAS Center */}
        <div className="lg:col-span-2 space-y-6" id="left-column">
          
          {/* Quick Filters - Sleek Bento Controls */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col sm:flex-row gap-4 justify-between items-center shadow-md" id="quick-filters">
            <div className="flex items-center space-x-2.5 shrink-0">
              <Search className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300 font-sans">คัดกรองข้อมูลพื้นที่ทดลอง:</span>
            </div>
            
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full sm:w-auto">
              {/* Variety selector */}
              <select
                value={filterVariety}
                onChange={(e) => setFilterVariety(e.target.value)}
                className="bg-slate-950 text-slate-300 text-xs px-3 py-2 rounded-xl border border-slate-800 outline-none focus:border-emerald-500 font-sans hover:border-slate-700 transition-colors"
              >
                <option value="">พันธุ์ข้าวโพดทั้งหมด</option>
                <option value="PAC789">พันธุ์ PAC789</option>
                <option value="สุวรรณ 5720">พันธุ์ สุวรรณ 5720</option>
                <option value="CP S8">พันธุ์ CP S8</option>
                <option value="DEKALB 8899S">พันธุ์ DEKALB 8899S</option>
              </select>

              {/* Water system selector */}
              <select
                value={filterWaterSystem}
                onChange={(e) => setFilterWaterSystem(e.target.value)}
                className="bg-slate-950 text-slate-300 text-xs px-3 py-2 rounded-xl border border-slate-800 outline-none focus:border-emerald-500 font-sans hover:border-slate-700 transition-colors"
              >
                <option value="">ระบบจัดการน้ำทั้งหมด</option>
                <option value="W1">AWD (เปียกสลับแห้ง)</option>
                <option value="W2">DRIP (ระบบน้ำหยด)</option>
                <option value="W3">MINI (ระบบมินิสปริงเกลอร์)</option>
              </select>

              {/* Period selector */}
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value as any)}
                className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-3 py-2 rounded-xl border border-emerald-500/20 outline-none focus:border-emerald-400 font-sans"
              >
                <option value="7">สัปดาห์นี้</option>
                <option value="15">15 วันที่ผ่านมา</option>
                <option value="30">30 วันที่ผ่านมา</option>
              </select>
            </div>
          </div>

          {/* 36 Plots Layout Block */}
          <PlotGrid 
            plots={plots}
            selectedPlot={selectedPlot}
            onSelectPlot={handleSelectPlot}
            filterVariety={filterVariety}
            filterWaterSystem={filterWaterSystem}
          />

          {/* Hor Kaset Rung Ruang Company Phu Ruea Site Condition Dashboard */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md space-y-6" id="phuruea-dashboard">
            <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-sky-500/15 text-sky-400 font-bold px-2 py-0.5 rounded-md uppercase font-mono border border-sky-500/20 flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> สถานีวิจัยต้นแบบ (ภูเรือ)
                  </span>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded-md uppercase font-mono border border-emerald-500/20">
                    IoT Telemetry Live
                  </span>
                </div>
                <h4 className="font-sans font-bold text-white text-base flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-emerald-400" /> สภาพแวดล้อมพื้นที่แปลงทดลอง (บริษัทหอเกษตรรุ่งเรือง)
                </h4>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  ติดทางหลวงหมายเลข 21 ตรงข้ามรุ่งทิวารีสอร์ท หมู่ 10 บ้านโนนแสงแก้ว ตำบลร่องจิก อำเภอภูเรือ จังหวัดเลย 42160
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Details Grid - 7 Columns */}
              <div className="lg:col-span-7 space-y-5 flex flex-col justify-between">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Elevation */}
                  <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-2xl flex items-start gap-3">
                    <div className="p-2.5 bg-sky-500/10 rounded-xl text-sky-400">
                      <Mountain className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">ระดับความสูง</span>
                      <p className="font-bold text-white text-sm font-sans">620 เมตร (MSL)</p>
                      <p className="text-[9px] text-slate-400">พื้นที่ภูเขาสูงชันจังหวัดเลย</p>
                    </div>
                  </div>

                  {/* Avg Temp */}
                  <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-2xl flex items-start gap-3">
                    <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400">
                      <Thermometer className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">อุณหภูมิเฉลี่ย</span>
                      <p className="font-bold text-white text-sm font-sans">22.4 °C</p>
                      <p className="text-[9px] text-slate-400">อากาศหนาวเย็น/ความชื้นสัมพัทธ์สูง</p>
                    </div>
                  </div>

                  {/* Soil pH */}
                  <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-2xl flex items-start gap-3">
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                      <Leaf className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">ความอุดมสมบูรณ์ดิน</span>
                      <p className="font-bold text-white text-sm font-sans">pH 5.8 - 6.2</p>
                      <p className="text-[9px] text-slate-400">ดินร่วนปนทราย ระบายน้ำดี</p>
                    </div>
                  </div>

                  {/* Coordinates */}
                  <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-2xl flex items-start gap-3">
                    <div className="p-2.5 bg-pink-500/10 rounded-xl text-pink-400">
                      <Compass className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">พิกัดทางภูมิศาสตร์</span>
                      <p className="font-bold text-white text-[11px] font-mono whitespace-normal break-all">17.4368° N, 101.3524° E</p>
                      <p className="text-[9px] text-slate-400">ตรงข้ามรุ่งทิวารีสอร์ท</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-2">
                  <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" /> บทวิเคราะห์กายภาพแปลงทดลองภูเรือ:
                  </h5>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    ด้วยสภาวะอากาศที่มีความแปรปรวนของอุณหภูมิระหว่างกลางวันและกลางคืนค่อนข้างสูง (Diurnal Temperature Variation) แปลงสาธิต ณ อำเภอภูเรือแห่งนี้ จึงเป็นจุดยุทธศาสตร์สำคัญในการวิจัยเพื่อประเมินความแข็งแกร่งของสายพันธุ์ข้าวโพดเลี้ยงสัตว์ต่อภัยแล้งและการขาดน้ำแบบฉับพลัน ร่วมกับระบบส่งน้ำแบบ Smart Drip และ AWD ในการเพาะปลูกแบบแม่นยำ
                  </p>
                </div>
              </div>

              {/* Right Field Image & Camera Overlay - 5 Columns */}
              <div className="lg:col-span-5 relative group overflow-hidden rounded-2xl border border-slate-850">
                <img 
                  src={phuRueaImage} 
                  alt="ภาพแปลงทดลอง บริษัทหอเกษตรรุ่งเรือง เลย" 
                  className="w-full h-full min-h-[220px] object-cover transition-transform duration-500 group-hover:scale-105" 
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual Glass Overlay representing sensor parameters */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40 p-4 flex flex-col justify-between pointer-events-none">
                  <div className="flex justify-between items-start">
                    <span className="bg-red-500/80 text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE DRONE FEED
                    </span>
                    <span className="text-[10px] text-slate-100 font-mono bg-slate-950/60 px-2 py-0.5 rounded backdrop-blur-sm">
                      ALT 120m
                    </span>
                  </div>

                  <div className="space-y-1 backdrop-blur-sm bg-slate-950/65 p-3 rounded-xl border border-slate-800/60">
                    <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <Droplet className="h-3 w-3 animate-bounce" /> ดัชนีความชื้นแปลงย่อย: 41.2%
                    </p>
                    <p className="text-[9px] text-slate-300 leading-relaxed">
                      กล้องสเปกตรัมจับภาพสีใบข้าวโพด (SPAD Index เฉลี่ย: 46.5) สัญญาณส่งออกทาง Google Sheets API ล่าสุดปกติ
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Weather Forecast Sub-section */}
            <div className="border-t border-slate-800 pt-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h5 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Sun className="h-4 w-4 text-amber-400" />
                    พยากรณ์อากาศล่วงหน้า อำเภอภูเรือ (Weather Forecast)
                  </h5>
                  <p className="text-[11px] text-slate-400 font-sans">พยากรณ์เชิงสถิติสำหรับกำหนดเวลาจ่ายน้ำและใส่ปุ๋ยแบบแม่นยำเพื่อเพิ่มดัชนี SPAD และการสังเคราะห์แสง</p>
                </div>
                
                {/* Weather Filter Tabs */}
                <div className="bg-slate-950/80 p-1 rounded-xl border border-slate-850 flex items-center self-start sm:self-auto gap-1">
                  <button
                    onClick={() => setWeatherTab("daily")}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                      weatherTab === "daily"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-semibold"
                        : "text-slate-400 hover:text-slate-200 border border-transparent"
                    }`}
                  >
                    รายวัน (Daily)
                  </button>
                  <button
                    onClick={() => setWeatherTab("weekly")}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                      weatherTab === "weekly"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-semibold"
                        : "text-slate-400 hover:text-slate-200 border border-transparent"
                    }`}
                  >
                    รายสัปดาห์ (Weekly)
                  </button>
                  <button
                    onClick={() => setWeatherTab("monthly")}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                      weatherTab === "monthly"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-semibold"
                        : "text-slate-400 hover:text-slate-200 border border-transparent"
                    }`}
                  >
                    รายเดือน (Monthly)
                  </button>
                </div>
              </div>

              {/* Forecast Views */}
              {weatherTab === "daily" && (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {[
                    { time: "07:00", temp: "18°C", weather: "🌫️ หมอกหนาภูเรือ", status: "ความชื้นสูง 92%", icon: <Cloud className="h-5 w-5 text-sky-300" /> },
                    { time: "10:00", temp: "22°C", weather: "⛅ มีเมฆบางส่วน", status: "ความชื้น 75%", icon: <CloudSun className="h-5 w-5 text-amber-200" /> },
                    { time: "13:00", temp: "28°C", weather: "☀️ แดดแรงดีมาก", status: "ดัชนี UV สูง", icon: <Sun className="h-5 w-5 text-amber-400" /> },
                    { time: "16:00", temp: "26°C", weather: "🌦️ ฝนตกโปรยๆ", status: "โอกาสฝน 35%", icon: <CloudRain className="h-5 w-5 text-teal-300" /> },
                    { time: "19:00", temp: "21°C", weather: "🌙 ฟ้าโปร่งใส", status: "ลมเบาสบาย", icon: <Sun className="h-5 w-5 text-slate-400" /> },
                    { time: "22:00", temp: "19°C", weather: "🌙 อากาศเย็นลง", status: "น้ำค้างเริ่มจับใบ", icon: <Cloud className="h-5 w-5 text-slate-500" /> }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-slate-950/50 p-3 rounded-xl border border-slate-850 flex flex-col items-center text-center space-y-1.5 hover:border-emerald-500/20 transition-colors">
                      <span className="text-[10px] text-slate-500 font-mono font-bold">{item.time}</span>
                      <div className="p-1.5 bg-slate-900 rounded-lg">{item.icon}</div>
                      <p className="font-bold text-white text-sm">{item.temp}</p>
                      <p className="text-[10px] text-slate-300 font-sans font-medium">{item.weather}</p>
                      <span className="text-[9px] text-slate-500 font-sans font-medium">{item.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {weatherTab === "weekly" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                  {[
                    { day: "พุธ 1 ก.ค.", temp: "28° / 18°C", weather: "🌦️ ฝนตกกระจาย", rain: "40%", wind: "12 km/h", icon: <CloudRain className="h-5 w-5 text-sky-400" /> },
                    { day: "พฤหัสฯ 2 ก.ค.", temp: "29° / 19°C", weather: "⛅ เมฆบางส่วน", rain: "20%", wind: "10 km/h", icon: <CloudSun className="h-5 w-5 text-amber-200" /> },
                    { day: "ศุกร์ 3 ก.ค.", temp: "30° / 18°C", weather: "☀️ แดดแรงจัด", rain: "10%", wind: "8 km/h", icon: <Sun className="h-5 w-5 text-amber-400" /> },
                    { day: "เสาร์ 4 ก.ค.", temp: "31° / 20°C", weather: "☀️ แดดแรงจัด", rain: "5%", wind: "9 km/h", icon: <Sun className="h-5 w-5 text-amber-500" /> },
                    { day: "อาทิตย์ 5 ก.ค.", temp: "29° / 19°C", weather: "🌧️ ฝนตกปานกลาง", rain: "60%", wind: "15 km/h", icon: <CloudRain className="h-5 w-5 text-teal-400" /> },
                    { day: "จันทร์ 6 ก.ค.", temp: "27° / 17°C", weather: "⛈️ พายุฝนฟ้าคะนอง", rain: "80%", wind: "18 km/h", icon: <CloudLightning className="h-5 w-5 text-red-400" /> },
                    { day: "อังคาร 7 ก.ค.", temp: "28° / 18°C", weather: "🌦️ ฝนตกเล็กน้อย", rain: "50%", wind: "11 km/h", icon: <CloudRain className="h-5 w-5 text-sky-300" /> }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-slate-950/50 p-3 rounded-xl border border-slate-850 flex flex-col justify-between space-y-2 hover:border-emerald-500/20 transition-all">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-300 font-bold block whitespace-normal break-words">{item.day}</span>
                        <p className="text-[9px] text-slate-500">ภูเรือ, เลย</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-slate-900 rounded-lg">{item.icon}</div>
                        <div>
                          <p className="font-bold text-white text-[13px] font-sans leading-none">{item.temp}</p>
                          <span className="text-[9px] text-slate-400 font-sans">{item.weather}</span>
                        </div>
                      </div>
                      <div className="border-t border-slate-800/80 pt-1.5 flex justify-between text-[9px] font-mono text-slate-500">
                        <span className="flex items-center gap-0.5"><Droplet className="h-2.5 w-2.5 text-sky-400" /> {item.rain}</span>
                        <span className="flex items-center gap-0.5"><Wind className="h-2.5 w-2.5 text-slate-400" /> {item.wind}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {weatherTab === "monthly" && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { 
                      week: "สัปดาห์ที่ 1 (1-7 ก.ค.)", 
                      temp: "เฉลี่ย 28.5° / 18.5°C", 
                      rain: "ฝนสะสม 35 มม.", 
                      desc: "ฝนสลับแดดจัด เหมาะสำหรับระยะเจริญเติบโตรวดเร็ว (V3-V6 stage) ของต้นข้าวโพด",
                      action: "รักษาระดับน้ำหยดตามเกณฑ์ปกติ", 
                      color: "border-sky-500/15 bg-sky-950/10" 
                    },
                    { 
                      week: "สัปดาห์ที่ 2 (8-14 ก.ค.)", 
                      temp: "เฉลี่ย 29.0° / 19.0°C", 
                      rain: "ฝนสะสม 20 มม.", 
                      desc: "เมฆบางส่วน แดดดีเป็นส่วนใหญ่ เหมาะสมสำหรับการพ่นปุ๋ยไนโตรเจนเสริมและสแกนวัดค่า SPAD",
                      action: "แนะนำให้ปุ๋ยทางใบเคมีสูตรพิเศษ", 
                      color: "border-emerald-500/15 bg-emerald-950/10" 
                    },
                    { 
                      week: "สัปดาห์ที่ 3 (15-21 ก.ค.)", 
                      temp: "เฉลี่ย 30.2° / 20.1°C", 
                      rain: "ฝนสะสม 15 มม.", 
                      desc: "แดดจัดต่อเนื่อง อุณหภูมิค่อนข้างสูง อัตราคายน้ำเพิ่ม ควรเฝ้าระวังไม่ให้ความชื้นต่ำกว่า 40%",
                      action: "เพิ่มรอบการส่งน้ำแบบระบบ Drip", 
                      color: "border-amber-500/15 bg-amber-950/10" 
                    },
                    { 
                      week: "สัปดาห์ที่ 4 (22-31 ก.ค.)", 
                      temp: "เฉลี่ย 27.8° / 18.2°C", 
                      rain: "ฝนสะสม 55 มม.", 
                      desc: "มีลมมรสุมพัดผ่าน มีฝนหนักต่อเนื่องสะสมในดินสูง ควรระบายน้ำส่วนเกินออกป้องกันรากข้าวโพดเน่าขัง",
                      action: "ปิดวาล์วน้ำหลักและเปิดช่องระบาย", 
                      color: "border-teal-500/15 bg-teal-950/10" 
                    }
                  ].map((item, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl border ${item.color} flex flex-col justify-between space-y-3`}>
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-200 block">{item.week}</span>
                        <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                          <span className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">{item.temp}</span>
                          <span className="bg-slate-900 px-1.5 py-0.5 rounded text-sky-400">{item.rain}</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-sans">{item.desc}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-800/40 flex items-center gap-1.5">
                        <span className="text-[9px] font-mono uppercase bg-slate-950 px-2 py-0.5 rounded font-bold text-emerald-400 shrink-0">คำแนะนำ:</span>
                        <span className="text-[11px] font-semibold text-slate-200 font-sans whitespace-normal break-words">{item.action}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Interactive Trends Analytics Block */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md space-y-8" id="charts-panel">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="space-y-0.5">
                <h4 className="font-sans font-bold text-white text-sm">วิเคราะห์แนวโน้มเชิงลึกของโครงการ (Interactive Trends)</h4>
                <p className="text-xs text-slate-400 font-sans">คำนวณและอัปเดตสถิติโดยอัตโนมัติเมื่อข้อมูลในตารางวิจัยมีการแก้ไข</p>
              </div>
            </div>

            {/* Chart 1: Variety Growth Line Chart */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-300 font-sans flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-emerald-400" /> ดัชนีเฉลี่ยความสูงลำต้นแต่ละสายพันธุ์ตามวันสำรวจ (ซม.)
              </h5>
              <div className="h-72 w-full" id="growth-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getVarietyGrowthChartData()} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={["auto", "auto"]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 11, color: '#f8fafc' }} 
                      itemStyle={{ color: '#f8fafc' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10, color: '#94a3b8' }} />
                    <Line type="monotone" dataKey="PAC789 (พรีเมียม)" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} dot={false} />
                    <Line type="monotone" dataKey="สุวรรณ 5720 (คงทน)" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="CP S8 (ต้านทานสูง)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="DEKALB 8899S" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Soil Moisture regimes Comparison */}
            <div className="space-y-3 pt-6 border-t border-slate-800">
              <h5 className="text-xs font-bold text-slate-300 font-sans flex items-center gap-1.5">
                <Droplet className="h-4 w-4 text-sky-400" /> พฤติกรรมค่าความชื้นดินสัมพัทธ์จำแนกตามระบบให้น้ำ (%)
              </h5>
              <div className="h-72 w-full" id="moisture-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getMoistureCyclesChartData()} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[20, 90]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 11, color: '#f8fafc' }} 
                      itemStyle={{ color: '#f8fafc' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10, color: '#94a3b8' }} />
                    <Line type="monotone" dataKey="เปียกสลับแห้ง (AWD)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    <Line type="monotone" dataKey="ระบบน้ำหยด (DRIP)" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="สปริงเกลอร์ (MINI)" stroke="#6366f1" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* AI Agronomist Insights */}
          <AIAgronomist />

          {/* Apps Script Code Center & Setup */}
          <AppsScriptCenter userEmail={userEmail} plots={plots} history={history} />

        </div>

        {/* Right Side (Grid Column 3): Selected Plot Detail + Activity logs */}
        <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto space-y-6 pr-1 scrollbar-thin" id="right-column">
          
          {/* Detail Panel */}
          {selectedPlot ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6" id="detail-panel">
              <div className="border-b border-slate-800 pb-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] bg-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded-md uppercase font-mono border border-emerald-500/20">
                    Active Plot Settings
                  </span>
                  
                  {/* Select Plot Dropdown Selector */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-400 font-sans">เลือกแปลง:</span>
                    <select
                      value={selectedPlot.plotId}
                      onChange={(e) => {
                        const found = plots.find((p) => p.plotId === e.target.value);
                        if (found) handleSelectPlot(found);
                      }}
                      className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-slate-200 text-[11px] rounded-lg px-2 py-1 font-mono focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                    >
                      {plots.map((p) => (
                        <option key={p.plotId} value={p.plotId} className="bg-slate-950 text-slate-300 font-mono">
                          {p.plotId} ({p.varietyCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <h4 className="text-base font-bold text-white font-sans mt-1 flex items-center justify-between">
                  <span>ข้อมูลแปลงทดลอง {selectedPlot.plotId}</span>
                  {selectedPlot.alertStatus !== "normal" && (
                    <span className={`text-[9px] px-2 py-0.5 rounded-md font-sans font-bold uppercase tracking-wider ${selectedPlot.alertStatus === "danger" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"}`}>
                      {selectedPlot.alertStatus === "danger" ? "วิกฤต" : "ผิดปกติ"}
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-400 font-sans">
                  Block ซ้ำที่ {selectedPlot.replication} • ขนาด {selectedPlot.plotSize} ม. (พืช {selectedPlot.plantCount} ต้น)
                </p>
              </div>

              {/* Highlighted alert */}
              {selectedPlot.alertMessage && (
                <div className={`p-4 rounded-2xl text-xs font-sans flex items-start gap-2.5 ${selectedPlot.alertStatus === "danger" ? "bg-red-500/10 text-red-300 border border-red-500/20" : "bg-amber-500/10 text-amber-300 border border-amber-500/20"}`}>
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{selectedPlot.alertMessage}</p>
                </div>
              )}

              {/* Core Information Stats */}
              <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-2xl space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">พันธุ์ข้าวโพด</span>
                  <p className="font-bold text-white text-xs whitespace-normal break-words" title={selectedPlot.varietyName}>{selectedPlot.varietyName}</p>
                  <span className="inline-block text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono mt-1">ID {selectedPlot.varietyCode}</span>
                </div>

                <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-2xl space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">ระบบให้น้ำ</span>
                  <p className="font-bold text-white text-xs whitespace-normal break-words" title={selectedPlot.waterSystemDesc}>{selectedPlot.waterSystemDesc}</p>
                  <span className="inline-block text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono mt-1">{selectedPlot.waterSystemName}</span>
                </div>
              </div>

              {/* Dynamic trigger editing (simulation) */}
              <div className="space-y-5 border-t border-slate-800 pt-5">
                <h5 className="text-xs font-bold text-slate-300 font-sans flex items-center gap-1.5">
                  <Settings className="h-4 w-4 text-slate-400" />
                  จำลองการป้อนข้อมูลเพื่อรัน Triggers (Google Sheets)
                </h5>

                {/* Soil Moisture Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-sans">ความชื้นดิน (%)</span>
                    <span className="font-mono font-bold text-emerald-400">{editMoisture}%</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="90"
                    value={editMoisture}
                    onChange={(e) => setEditMoisture(Number(e.target.value))}
                    className="w-full accent-emerald-500 h-1.5 bg-slate-950 border border-slate-850 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-sans leading-relaxed">
                    <span>ต่ำสุด (15%)</span>
                    <span className="text-amber-500/80 text-center px-1">ต่ำกว่า 30% เพื่อส่ง Mail ด่วน</span>
                    <span>สูงสุด (90%)</span>
                  </div>
                </div>

                {/* Plant height input */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-sans">ความสูงลำต้นข้าวโพด (ซม.)</span>
                    <span className="font-mono font-bold text-emerald-400">{editHeight} cm</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="180"
                    value={editHeight}
                    onChange={(e) => setEditHeight(Number(e.target.value))}
                    className="w-full accent-emerald-500 h-1.5 bg-slate-950 border border-slate-850 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* SPAD input */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-sans">ดัชนีคลอโรฟิลล์ (SPAD Index)</span>
                    <span className="font-mono font-bold text-emerald-400">{editSpad} SPAD</span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="70"
                    value={editSpad}
                    onChange={(e) => setEditSpad(Number(e.target.value))}
                    className="w-full accent-emerald-500 h-1.5 bg-slate-950 border border-slate-850 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Nitrogen status */}
                <div className="space-y-2">
                  <label className="block text-[11px] text-slate-400 font-sans">สถานะไนโตรเจนที่สังเกตได้ (Nitrogen):</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Low", "Optimal", "High"] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setEditNitrogen(lvl)}
                        className={`py-2 px-1 rounded-xl text-[10px] font-bold font-sans border transition-all cursor-pointer ${
                          editNitrogen === lvl 
                            ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200"
                        }`}
                      >
                        {lvl === "Low" ? "ต่ำเกณฑ์" : lvl === "Optimal" ? "เหมาะสม" : "สูงเกณฑ์"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save button */}
                <button
                  onClick={handleUpdatePlot}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-2xl text-xs font-bold font-sans shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                >
                  <Check className="h-4 w-4" /> บันทึกสถิติลง Google Sheet จำลอง
                </button>

                {syncStatus && (
                  <p className="text-[10px] text-center text-emerald-400 font-mono animate-pulse bg-emerald-500/10 py-1.5 rounded-lg border border-emerald-500/20 mt-2">
                    {syncStatus}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-sm text-center space-y-4" id="no-selection-panel">
              <Info className="h-8 w-8 text-slate-500 mx-auto animate-pulse" />
              <div className="space-y-1.5">
                <h4 className="font-sans font-bold text-slate-300 text-xs">ยังไม่ได้เลือกแปลงทดลอง</h4>
                <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                  กรุณาคลิกเลือกแปลงย่อยข้าวโพด (P-01 ถึง P-36) ในแผงผังด้านซ้าย หรือเลือกจากเมนูด้านล่างนี้เพื่อเริ่มต้นอัปเดตข้อมูลเซ็นเซอร์
                </p>
              </div>
              
              <div className="pt-2 flex justify-center">
                <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-850 px-3 py-1.5 rounded-2xl">
                  <span className="text-[11px] text-slate-400 font-sans">เลือกแปลงด่วน:</span>
                  <select
                    onChange={(e) => {
                      const found = plots.find((p) => p.plotId === e.target.value);
                      if (found) handleSelectPlot(found);
                    }}
                    defaultValue=""
                    className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-200 text-xs rounded-lg px-2 py-1 font-mono focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                  >
                    <option value="" disabled className="text-slate-500">-- เลือกแปลงย่อย --</option>
                    {plots.map((p) => (
                      <option key={p.plotId} value={p.plotId} className="bg-slate-950 text-slate-300 font-mono">
                        {p.plotId} ({p.varietyCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Activity Logs Feed Block */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md space-y-4" id="logs-feed">
            <h4 className="font-sans font-bold text-white text-xs flex items-center gap-1.5 border-b border-slate-800 pb-3">
              <Activity className="h-4 w-4 text-emerald-400 animate-pulse" /> บันทึกสัญญานและ Trigger ล่าสุด (Telemetry Logs)
            </h4>

            <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1" id="logs-container">
              {logs.map((log) => {
                const logTime = new Date(log.timestamp).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={log.id} className="text-[11px] space-y-1 relative pl-4 border-l border-slate-800 pb-1 font-sans">
                    {/* Tiny bullet indicator */}
                    <div className={`absolute left-[-4.5px] top-1 w-2 h-2 rounded-full border border-slate-900 ${
                      log.type === "alert" ? "bg-red-400" : log.type === "irrigation" ? "bg-sky-400" : log.type === "fertilizer" ? "bg-amber-400" : "bg-emerald-400"
                    }`}></div>

                    <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                      <span className="font-bold">{log.operator}</span>
                      <span>{logTime} น.</span>
                    </div>

                    <p className="text-slate-300 leading-relaxed font-sans font-normal">
                      <span className="font-bold text-emerald-400 mr-1.5">{log.plotId}</span>
                      {log.message}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
