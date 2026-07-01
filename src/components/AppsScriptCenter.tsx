/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Code, BookOpen, Send, Mail, CheckCircle, Copy, Terminal, BellRing, FileText } from "lucide-react";

import { PlotData, GrowthRecord } from "../types";

interface AppsScriptCenterProps {
  userEmail: string;
  plots: PlotData[];
  history: GrowthRecord[];
}

export default function AppsScriptCenter({ userEmail, plots, history }: AppsScriptCenterProps) {
  const [activeTab, setActiveTab] = useState<"code" | "guide" | "simulator">("guide");
  const [copied, setCopied] = useState(false);
  const [gasCode, setGasCode] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Simulation states
  const [simLineToken, setSimLineToken] = useState("LINE_NOTIFY_DEMO_TOKEN_XYZ888");
  const [simReceiverEmail, setSimReceiverEmail] = useState(userEmail || "your-email@example.com");
  const [showLinePreview, setShowLinePreview] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/gas-code?email=${encodeURIComponent(simReceiverEmail)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setGasCode(data.code);
      });
  }, [simReceiverEmail]);

  const handleCopy = () => {
    navigator.clipboard.writeText(gasCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateEmail = () => {
    setLoading(true);
    setSimulationStatus("กำลังรันการตรวจสอบเงื่อนไขความผิดปกติรายวันผ่าน Google Apps Script (onEdit/Trigger)...");
    setTimeout(() => {
      setLoading(false);
      setSimulationStatus("พบความชื้นดินวิกฤตที่แปลง P-13 (24%)! กำลังส่งอีเมลแจ้งเตือนด่วน...");
      setTimeout(() => {
        setSimulationStatus("แจ้งเตือนสำเร็จ! กรุณาตรวจสอบกล่องจดหมายจำลองด้านล่าง");
        setShowEmailPreview(true);
      }, 1000);
    }, 1500);
  };

  const handleSimulateLine = () => {
    setLoading(true);
    setSimulationStatus("กำลังดึงรายงานประจำสัปดาห์จากตารางคำนวณ RCBD...");
    setTimeout(() => {
      setSimulationStatus("กำลังคอมไพล์ผลวิจัยสร้างสรุปรายงานรูปแบบ PDF...");
      setTimeout(() => {
        setSimulationStatus("กำลังจัดส่งรายงานประจำสัปดาห์และไฟล์ PDF เข้ากลุ่ม LINE Notify...");
        setTimeout(() => {
          setLoading(false);
          setSimulationStatus("จัดส่งรายงาน PDF สรุปประจำสัปดาห์เข้า LINE ประสบความสำเร็จ!");
          setShowLinePreview(true);
        }, 1200);
      }, 1200);
    }, 1200);
  };

  const handleDownloadPlotsCSV = () => {
    if (!plots || plots.length === 0) return;
    
    // Define the headers matching the Google Sheet columns for the script
    const headers = [
      "PlotID",
      "Replication",
      "WaterSystemCode",
      "WaterSystemName",
      "VarietyCode",
      "VarietyName",
      "SoilMoisture(%)",
      "SoilTemp(C)",
      "PlantHeight(cm)",
      "GrowthStage",
      "SPADIndex",
      "NitrogenStatus",
      "DailyWaterUsage(L)"
    ];

    // Build row lines
    const rows = plots.map((p) => [
      p.plotId,
      p.replication,
      p.waterSystem,
      p.waterSystemName,
      p.varietyCode,
      p.varietyName,
      p.soilMoisture,
      p.soilTemp,
      p.plantHeight,
      p.growthStage,
      p.spadIndex,
      p.nitrogenStatus,
      p.dailyWaterUsage
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => {
        const strVal = String(val);
        if (strVal.includes(",") || strVal.includes("\n") || strVal.includes('"')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(","))
    ].join("\n");

    // Create a Blob and trigger download with UTF-8 BOM
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PlotData_Maize_RCBD.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadHistoryCSV = () => {
    if (!history || history.length === 0) return;

    // Define the headers matching historical records
    const headers = [
      "Date",
      "PlotID",
      "SoilMoisture(%)",
      "PlantHeight(cm)",
      "SPADIndex",
      "DailyWaterUsage(L)"
    ];

    // Build row lines
    const rows = history.map((h) => [
      h.date,
      h.plotId,
      h.soilMoisture,
      h.plantHeight,
      h.spadIndex,
      h.dailyWaterUsage
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => {
        const strVal = String(val);
        if (strVal.includes(",") || strVal.includes("\n") || strVal.includes('"')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(","))
    ].join("\n");

    // Create a Blob and trigger download with UTF-8 BOM
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `GrowthHistory_Maize_RCBD.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-xl overflow-hidden" id="gas-center-root">
      {/* Header */}
      <div className="bg-slate-950 p-6 border-b border-slate-850 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
            Google Workspace Integration
          </span>
          <h3 className="text-xl font-bold font-sans mt-2 flex items-center gap-2">
            <Terminal className="text-emerald-400 h-5 w-5" /> 
            ศูนย์จัดการ Google Apps Script & Triggers
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            เชื่อมต่อ Google Sheets ของคุณกับระบบแจ้งเตือนแบบเรียลไทม์ และระบบรายงาน PDF ผ่าน LINE Notify
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("guide")}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all font-sans font-medium ${
              activeTab === "guide" ? "bg-slate-800 text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" /> คู่มือการตั้งค่า
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all font-sans font-medium ${
              activeTab === "code" ? "bg-slate-800 text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code className="h-3.5 w-3.5" /> รหัส Apps Script
          </button>
          <button
            onClick={() => setActiveTab("simulator")}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all font-sans font-medium ${
              activeTab === "simulator" ? "bg-slate-800 text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Send className="h-3.5 w-3.5" /> ทดสอบ Trigger (Simulator)
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6">
        {activeTab === "guide" && (
          <div className="space-y-6 font-sans">
            <h4 className="text-sm font-bold text-slate-300 border-b border-slate-800 pb-2">
              ขั้นตอนติดตั้งระบบวิเคราะห์ข้าวโพดแบบเรียลไทม์และ PDF เข้า LINE (ใช้เวลา 3 นาที)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Steps */}
              <div className="space-y-4 text-sm text-slate-300">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-slate-200">เปิดตัวแก้ไขสคริปต์ใน Google Sheets</p>
                    <p className="text-xs text-slate-400 mt-1">
                      เปิดไฟล์ Google Sheets ของคุณ จากนั้นไปที่เมนู <span className="text-slate-200 font-bold">ขยาย (Extensions) &gt; Apps Script</span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-slate-200">คัดลอกและบันทึกรหัสสคริปต์</p>
                    <p className="text-xs text-slate-400 mt-1">
                      สลับไปที่แถบ <span className="text-emerald-400 font-bold cursor-pointer" onClick={() => setActiveTab("code")}>"รหัส Apps Script"</span> ด้านบน คัดลอกโค้ดทั้งหมดไปวางในหน้าต่าง Apps Script แล้วกดปุ่มเซฟ
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-slate-200">ออกโทเค็น LINE Notify ส่วนตัว</p>
                    <p className="text-xs text-slate-400 mt-1">
                      ไปที่หน้าเว็บ <a href="https://notify-bot.line.me/" target="_blank" rel="noreferrer" className="text-emerald-400 underline">LINE Notify</a> ล็อกอินแล้วกด "Generate Token" เลือกห้องแชทที่ต้องการรับรายงาน คัดลอก Token มาใส่ในตัวแปร <code className="bg-slate-800 px-1 py-0.5 rounded text-red-400 text-[11px] font-mono">LINE_NOTIFY_TOKEN</code> ในสคริปต์
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                    4
                  </div>
                  <div>
                    <p className="font-bold text-slate-200">ตั้งค่า Trigger เพื่อรันรายงานอัตโนมัติ</p>
                    <p className="text-xs text-slate-400 mt-1">
                      ที่แถบซ้ายของ Apps Script คลิกไอคอนนาฬิกา (Triggers) &gt; กด "Add Trigger" &gt; เลือกฟังก์ชัน <code className="bg-slate-800 text-slate-300 px-1 rounded text-[11px] font-mono">generateWeeklyReportAndSendLine</code> &gt; เลือกประเภทเหตุการณ์ "ขับเคลื่อนด้วยเวลา" (Time-driven) &gt; เลือก "ตั้งเวลาสัปดาห์ละครั้ง" เพื่อรับรายงาน PDF ทุกสัปดาห์โดยอัตโนมัติ!
                    </p>
                  </div>
                </div>
              </div>

              {/* Benefit Visual Card */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/60 flex flex-col justify-between">
                <div>
                  <h5 className="font-bold text-emerald-400 text-sm flex items-center gap-1.5 mb-2">
                    <CheckCircle className="h-4 w-4" /> ประโยชน์ของระบบนี้ต่อการทดลองข้าวโพด:
                  </h5>
                  <ul className="text-xs text-slate-300 space-y-2 mt-1 list-disc list-inside">
                    <li><strong className="text-slate-100">ตอบสนองรวดเร็ว</strong>: รู้ทันทีเมื่อระบบน้ำขัดข้อง คาร์บอนไดออกไซด์หรือความชื้นดินเหวี่ยง</li>
                    <li><strong className="text-slate-100">สรุปข้อมูลอัจฉริยะ</strong>: ไม่ต้องเปิดดูชีตทุกวัน ระบบสรุปเปอร์เซ็นต์ความงอกและความชื้นของสายพันธุ์เปรียบเทียบในแชทกลุ่ม</li>
                    <li><strong className="text-slate-100">PDF สวยงาม</strong>: แฟ้มรายงานสรุปผลการเจริญเติบโตที่สมบูรณ์แบบพร้อมส่งต่อให้ทีมวิจัยวิเคราะห์</li>
                  </ul>
                </div>
                <div className="border-t border-slate-850 pt-4 mt-4 flex items-center gap-3">
                  <div className="bg-emerald-500/10 p-2 rounded-lg">
                    <BellRing className="text-emerald-400 h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">ทดสอบจำลองได้ทันที!</p>
                    <p className="text-[11px] text-slate-400">สลับไปแถบ "ทดสอบ Trigger" เพื่อสัมผัสระบบแจ้งเตือนแบบของจริง</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Sheets Generator Section */}
            <div className="bg-emerald-950/20 border border-emerald-500/25 p-6 rounded-2xl space-y-4 mt-6">
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-emerald-400" />
                <div>
                  <h5 className="font-bold text-slate-100 text-sm">📂 ตัวช่วยสร้างและดาวน์โหลดไฟล์สำหรับ Google Sheets</h5>
                  <p className="text-[11px] text-slate-400">ดาวน์โหลดแม่แบบและไฟล์ CSV ไปนำเข้าเพื่อสร้างตารางข้อมูลใน Google Sheets เพื่อทำหน้าที่เป็นฐานข้อมูลได้ทันที</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-850 space-y-2">
                  <p className="text-xs font-bold text-slate-200">1. ข้อมูลแปลงทดลองล่าสุด (36 แปลงย่อย)</p>
                  <p className="text-[11px] text-slate-400">สำหรับนำเข้าชีตแผ่นที่หนึ่ง (ชื่อแผ่นงาน: <strong className="text-emerald-400 font-mono">PlotData</strong>) เพื่อให้สคริปต์ตรวจจับค่าเซ็นเซอร์ที่ถูกเปลี่ยนแปลง</p>
                  <button
                    onClick={handleDownloadPlotsCSV}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    📥 ดาวน์โหลดไฟล์ PlotData.csv
                  </button>
                </div>

                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-850 space-y-2">
                  <p className="text-xs font-bold text-slate-200">2. ข้อมูลประวัติการเติบโต (Growth History)</p>
                  <p className="text-[11px] text-slate-400">สำหรับนำเข้าชีตแผ่นที่สอง (ชื่อแผ่นงาน: <strong className="text-sky-400 font-mono">GrowthHistory</strong>) เพื่อใช้วิเคราะห์กราฟแนวโน้มการเปลี่ยนแปลงตามวันหลังปลูก</p>
                  <button
                    onClick={handleDownloadHistoryCSV}
                    className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    📥 ดาวน์โหลดไฟล์ GrowthHistory.csv
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-amber-400 bg-amber-500/5 border border-amber-500/15 p-3 rounded-xl font-sans flex items-start gap-2">
                <span className="shrink-0 mt-0.5">💡</span>
                <p>
                  <strong>วิธีการติดตั้งบน Google Sheets:</strong> สร้างไฟล์ชีตใหม่ &gt; ไปที่เมนู <strong>ไฟล์ (File) &gt; นำเข้า (Import) &gt; อัปโหลด (Upload)</strong> &gt; ลากไฟล์ CSV ที่ดาวน์โหลดไปใส่ &gt; เลือกตัวเลือก "แทนที่แผ่นงานปัจจุบัน" (Replace current sheet) และเลือก "ตรวจหาโดยอัตโนมัติ" สำหรับตัวคั่นข้อมูล (Separator) โครงสร้างข้อมูลจะจัดเรียงพร้อมใช้งานทันที!
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "code" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" /> code.gs (คัดลอกไปวางได้ทันที)
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md font-sans transition-all"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> คัดลอกสำเร็จ
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> คัดลอกโค้ด
                  </>
                )}
              </button>
            </div>
            
            <div className="relative">
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto text-[11px] font-mono text-emerald-400 h-96 max-h-96 leading-relaxed select-all">
                <code>{gasCode}</code>
              </pre>
            </div>
          </div>
        )}

        {activeTab === "simulator" && (
          <div className="space-y-6">
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-sans">
                  อีเมลสำหรับรับข้อความแจ้งเตือนความชื้นดินวิกฤต:
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={simReceiverEmail}
                    onChange={(e) => setSimReceiverEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 pl-9 pr-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-sans">
                  LINE Notify Token (จำลองเพื่อเชื่อมต่อ):
                </label>
                <div className="relative">
                  <Terminal className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={simLineToken}
                    onChange={(e) => setSimLineToken(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 pl-9 pr-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Simulated Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleSimulateEmail}
                disabled={loading}
                className="flex-1 min-w-[200px] bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 px-4 py-3 rounded-xl font-sans font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Mail className="h-4 w-4 text-emerald-400 animate-bounce" />
                จำลองรันสปริงเกลอร์/แจ้งเตือนดินแห้ง (อีเมล)
              </button>

              <button
                onClick={handleSimulateLine}
                disabled={loading}
                className="flex-1 min-w-[200px] bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-xl font-sans font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-900/10"
              >
                <Send className="h-4 w-4" />
                จำลองออกรายงาน PDF สรุปส่งแชท LINE
              </button>
            </div>

            {/* Run Logs */}
            {simulationStatus && (
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 flex items-center gap-2 animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>[สเตตัสทริกเกอร์]: {simulationStatus}</span>
              </div>
            )}

            {/* Gmail or LINE Preview Panes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Email Mockup */}
              {showEmailPreview && (
                <div className="bg-white text-slate-800 rounded-xl border border-slate-200 overflow-hidden shadow-lg animate-scale-up" id="email-preview-card">
                  <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 font-sans flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-500" /> กล่องจดหมายจำลอง (Inbox Preview)
                    </span>
                    <button
                      onClick={() => setShowEmailPreview(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 font-sans"
                    >
                      ปิดจำลอง
                    </button>
                  </div>
                  <div className="p-4 space-y-3 font-sans">
                    <div className="text-xs border-b border-slate-100 pb-2">
                      <p className="text-slate-500"><strong>ผู้ส่ง:</strong> smartfarm-research-alert@google.com</p>
                      <p className="text-slate-500"><strong>ผู้รับ:</strong> {simReceiverEmail}</p>
                      <p className="text-slate-800 font-bold mt-1"><strong>เรื่อง:</strong> ⚠️ [แจ้งเตือนด่วนระบบเซ็นเซอร์] แปลงทดลองข้าวโพดไร่ P-13 มีความผิดปกติ</p>
                    </div>
                    
                    <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                      <h4 className="font-bold text-red-700 text-sm mb-1.5">แจ้งเตือนความผิดปกติของแปลงทดลองข้าวโพดย่อย (RCBD)</h4>
                      <p className="text-xs text-slate-700"><strong>รหัสแปลง:</strong> P-13 (Replication 2)</p>
                      <p className="text-xs text-slate-700"><strong>ความผิดปกติ:</strong> <span className="text-red-600 font-semibold">ความชื้นดินต่ำเกินเกณฑ์วิกฤต (&lt; 30%)</span></p>
                      <p className="text-xs text-slate-700"><strong>ค่าที่วัดได้เรียลไทม์:</strong> 24%</p>
                      <p className="text-xs text-slate-700"><strong>สายพันธุ์ทดสอบ:</strong> สุวรรณ 5720</p>
                      <p className="text-xs text-slate-700"><strong>ระบบบริหารน้ำ:</strong> AWD (ระบบเปียกสลับแห้ง)</p>
                      <p className="text-[10px] text-red-500 mt-2 italic">⚠️ แนะนำการดูแลรักษา: กรุณาตรวจสอบการเปิดวาล์วระบบเปียกสลับแห้งใน Block 2 โดยด่วน</p>
                    </div>
                  </div>
                </div>
              )}

              {/* LINE Mockup */}
              {showLinePreview && (
                <div className="bg-[#5680E9] text-slate-800 rounded-xl overflow-hidden shadow-lg border border-[#3752c0] animate-scale-up" id="line-preview-card">
                  <div className="bg-[#4a6dc9] px-4 py-3 border-b border-[#3b59a6] flex items-center justify-between text-white">
                    <span className="text-xs font-bold font-sans flex items-center gap-1.5">
                      <Send className="h-3.5 w-3.5" /> จำลองห้องแชท LINE (Personal Chat)
                    </span>
                    <button
                      onClick={() => setShowLinePreview(false)}
                      className="text-xs text-slate-100 hover:text-white font-sans"
                    >
                      ปิดจำลอง
                    </button>
                  </div>
                  <div className="p-4 space-y-4 font-sans max-h-[350px] overflow-y-auto">
                    {/* Message Bubble */}
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 shadow-sm">
                        Notify
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-blue-100 font-semibold">LINE Notify</span>
                        
                        {/* LINE Bubble Card */}
                        <div className="bg-white p-3.5 rounded-2xl rounded-tl-xs shadow-md space-y-2.5 max-w-[260px]">
                          <p className="text-xs font-semibold text-slate-800">
                            🌿 รายงานสรุปผลวิจัยการเติบโตข้าวโพดรายสัปดาห์สร้างและจัดส่งสำเร็จเรียบร้อย! ค่าความชื้นเฉลี่ยรวม: 52.8%
                          </p>

                          {/* Mini PDF Card */}
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-2.5">
                            <div className="bg-red-500 text-white p-2 rounded-md shrink-0">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold text-slate-800 truncate">Weekly_Maize_Report_2026.pdf</p>
                              <p className="text-[9px] text-slate-400">ขนาด 2.4 MB • เอกสาร PDF งานวิจัย</p>
                            </div>
                          </div>
                          
                          <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-2 space-y-1">
                            <p>📈 <strong>ระบบน้ำหยด (DRIP):</strong> การเจริญเติบโตสูงที่สุด (+12%) ประหยัดน้ำสูงสุด</p>
                            <p>📊 <strong>คลอโรฟิลล์ (SPAD) เฉลี่ย:</strong> 47.6 SPAD</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
