/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, Brain, Sprout, AlertCircle, Droplet, TrendingUp, CheckCircle, RefreshCw } from "lucide-react";
import { InsightReport } from "../types";

export default function AIAgronomist() {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<InsightReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/gemini/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      if (data.success) {
        setInsights(data.insights);
      } else {
        setError(data.error || "เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูล");
      }
    } catch (err: any) {
      console.error(err);
      setError("ไม่สามารถติดต่อเซิร์ฟเวอร์วิเคราะห์อัจฉริยะได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 relative overflow-hidden shadow-xl" id="ai-agronomist-root">
      {/* Decorative gradient blur background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500/20 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/30">
            <Brain className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-sans text-base font-bold text-slate-100 flex items-center gap-1.5">
              ระบบนักปฐพีวิทยาปัญญาประดิษฐ์ (AI Agronomist Insights)
              <Sparkles className="h-4.5 w-4.5 text-amber-400 fill-amber-400/50" />
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              วิเคราะห์ความเชื่อมโยงของระบบน้ำกับศักยภาพสายพันธุ์ข้าวโพดไร่ด้วย Gemini 1.5 Flash แบบเรียลไทม์
            </p>
          </div>
        </div>

        <button
          onClick={fetchInsights}
          disabled={loading}
          className="bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-semibold font-sans flex items-center gap-1.5 shadow-sm hover:text-white transition-all cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          รีเฟรชการวิเคราะห์ข้อมูล
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center space-y-3 animate-fade-in" id="ai-loader">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-400 animate-pulse font-sans">
            โมเดล Gemini กำลังประมวลผลดัชนีสหสัมพันธ์ RCBD และวิเคราะห์ประสิทธิผลการใช้น้ำ...
          </p>
        </div>
      )}

      {/* Error / Key Info State */}
      {error && !loading && (
        <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex items-start gap-3" id="ai-error">
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1 font-sans">
            <h5 className="font-bold text-amber-300">ระบบประมวลผลหลักออฟไลน์</h5>
            <p className="text-amber-400/80 leading-relaxed">
              สคริปต์ตรวจหา API Key ของกูเกิลขัดข้อง: {error}
            </p>
            <p className="text-slate-400 text-[10px] mt-1.5">
              💡 วิธีแก้ไข: กรุณาระบุรหัสผ่าน <code className="bg-slate-950 border border-slate-800 font-mono px-1.5 py-0.5 rounded text-amber-200">GEMINI_API_KEY</code> ในเมนู <strong>Settings &gt; Secrets</strong> ของ Google AI Studio เพื่อเปิดใช้สมองปัญญาประดิษฐ์วิเคราะห์สายพันธุ์และประสิทธิภาพน้ำสูงสุดในระดับเต็มรูปแบบ
            </p>
          </div>
        </div>
      )}

      {/* Complete Insights Display */}
      {insights && !loading && (
        <div className="space-y-6 animate-fade-in" id="ai-insights-display">
          {/* Executive Summary */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
            <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-2.5 font-sans">
              <Sprout className="h-4.5 w-4.5" /> รายงานวิเคราะห์สภาพแวดล้อมรวม (Executive Summary)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans font-normal" style={{ textIndent: "1.5rem" }}>
              {insights.summary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Water system scores */}
            <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-3.5 font-sans">
                  <Droplet className="h-4.5 w-4.5 text-sky-400" /> คะแนนประสิทธิภาพระบบน้ำแยกประเภท (Water Efficiency Score)
                </h4>
                <div className="space-y-4" id="water-system-efficiency-list">
                  {insights.waterSystemEfficiency?.map((sys, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-300 font-sans">
                          ระบบน้ำ: {sys.system === "DRIP" ? "ระบบน้ำหยด (DRIP)" : sys.system === "AWD" ? "ระบบเปียกสลับแห้ง (AWD)" : "ระบบมินิสปริงเกลอร์ (MINI)"}
                        </span>
                        <span className="font-mono font-bold text-emerald-400">{sys.healthScore} / 100</span>
                      </div>
                      {/* Visual progress bar */}
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${sys.healthScore > 85 ? "bg-emerald-500" : sys.healthScore > 70 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${sys.healthScore}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-sans">
                        <span>ความชื้นเฉลี่ย: {sys.avgMoisture}%</span>
                        <span>ปริมาณน้ำที่ใช้: {sys.totalWaterUsed} ลิตร/แปลง</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Variety Water Use Efficiency */}
            <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-3.5 font-sans">
                <TrendingUp className="h-4.5 w-4.5 text-emerald-400" /> ดัชนีประสิทธิภาพการเจริญเติบโตต่อการใช้น้ำ (Water Use Efficiency)
              </h4>
              <div className="space-y-3" id="variety-performance-list">
                {insights.varietyComparison?.map((v, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-950/40 border border-slate-850 text-xs font-sans">
                    <div>
                      <p className="font-bold text-slate-200">{v.varietyName}</p>
                      <p className="text-[10px] text-slate-500">ความสูงเฉลี่ย: {v.avgHeight} ซม. | ดัชนี SPAD: {v.avgSpad}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-emerald-400">{v.waterUseEfficiency} <span className="text-[9px] text-slate-500 font-normal">cm/L</span></p>
                      <p className="text-[9px] text-slate-500">ประสิทธิภาพใช้น้ำ</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-3.5 font-sans">
              <CheckCircle className="h-4.5 w-4.5 text-emerald-400" /> คำแนะนำเพื่อความคุ้มค่าเชิงนวัตกรรมและการเพิ่มผลผลิต
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="recommendations-container">
              {insights.recommendations?.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-3.5 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-xs text-slate-300 font-sans">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px]">{idx + 1}</span>
                  <p className="leading-relaxed font-sans">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
