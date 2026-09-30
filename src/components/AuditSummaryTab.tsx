import React, { useState } from 'react';
import { AuditItem } from '../types/audit';
import {
  FileText,
  Copy,
  Check,
  Sparkles,
  ShieldAlert,
  Download,
  Printer,
  Table,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Award,
  Calendar,
  Building2,
} from 'lucide-react';

interface AuditSummaryTabProps {
  items: AuditItem[];
  onOpenCarModal: (item: AuditItem) => void;
  onOpenExplainModal: (item: AuditItem) => void;
}

export const AuditSummaryTab: React.FC<AuditSummaryTabProps> = ({
  items,
  onOpenCarModal,
  onOpenExplainModal,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'DEFICIENCIES' | 'CONFORMING'>('DEFICIENCIES');
  const [copiedTable, setCopiedTable] = useState<boolean>(false);
  const [generatingReport, setGeneratingReport] = useState<boolean>(false);
  const [fullReportMarkdown, setFullReportMarkdown] = useState<string>('');
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  // Filter evaluated items
  const evaluatedItems = items.filter((i) => i.status !== 'PENDING');
  const deficiencies = items.filter((i) => i.status === 'MA' || i.status === 'MI' || i.status === 'OBS');
  const conformingItems = items.filter((i) => i.status === 'C' || i.status === 'OFI');

  const displayedItems =
    filterType === 'DEFICIENCIES'
      ? deficiencies
      : filterType === 'CONFORMING'
      ? conformingItems
      : evaluatedItems;

  const totalEvaluated = evaluatedItems.length;
  const cCount = items.filter((i) => i.status === 'C').length;
  const maCount = items.filter((i) => i.status === 'MA').length;
  const miCount = items.filter((i) => i.status === 'MI').length;
  const obsCount = items.filter((i) => i.status === 'OBS').length;
  const ofiCount = items.filter((i) => i.status === 'OFI').length;

  const scorePoints =
    totalEvaluated > 0
      ? (cCount * 100 + ofiCount * 85 + obsCount * 70 + miCount * 40 + maCount * 0) / totalEvaluated
      : 0;
  const scorePercent = Math.round(scorePoints);

  let grade = '–';
  let gradeColor = 'text-slate-700 bg-slate-100';
  if (totalEvaluated > 0) {
    if (maCount >= 3 || scorePercent < 50) grade = 'F';
    else if (maCount >= 1 || scorePercent < 60) grade = 'E';
    else if (scorePercent < 70) grade = 'D';
    else if (scorePercent < 80) grade = 'C';
    else if (scorePercent < 90) grade = 'B';
    else grade = 'A';
  }

  // Generate Markdown table string for 1-click copy to Google Sheets/Google Docs
  const generateMarkdownTable = () => {
    let md = `| ลำดับ | ข้อที่ | ข้อกำหนด ISO / กฎหมาย | สิ่งตรวจพบ / ข้อเท็จจริงหน้างาน | ผลประเมิน | สรุปข้อบกพร่อง / ข้อสังเกตของ Auditor | เอกสาร/WI อ้างอิง |\n`;
    md += `| :---: | :---: | :--- | :--- | :---: | :--- | :--- |\n`;

    displayedItems.forEach((item, index) => {
      const isoText = item.isoClauses?.join(', ') || item.requirement;
      const findingText = (item.evidenceRecorded || item.question).replace(/\n/g, ' ');
      const detail = (item.auditorFindingDetail || (item.status === 'C' ? 'สอดคล้องตามข้อกำหนด' : '-')).replace(/\n/g, ' ');
      const doc = item.referenceDocs || '-';

      md += `| ${index + 1} | ข้อ #${item.id} | ${isoText} | ${findingText} | ${item.status} | ${detail} | ${doc} |\n`;
    });

    return md;
  };

  const handleCopyTable = () => {
    const md = generateMarkdownTable();
    navigator.clipboard.writeText(md);
    setCopiedTable(true);
    setTimeout(() => setCopiedTable(false), 2000);
  };

  const handleGenerateFullReport = async () => {
    setGeneratingReport(true);
    setFullReportMarkdown('');

    const auditInfo = {
      auditTitle: 'รายงานสรุปผลการตรวจติดตามภายใน (Mock Internal Audit Pre-Audit 2026)',
      company: 'บริษัท เค.อาร์.ซี. ทรานสปอร์ต แอนด์ เซอร์วิส จำกัด & K.R.C. Trucking',
      date: '25 กันยายน 2026 (เตรียมการสำหรับวันตรวจจริง 14-22 ตุลาคม 2026)',
      standards: 'ISO 9001:2015, ISO 14001:2015, ISO 45001:2018 (รวม Amd 1:2024 Climate Change)',
      auditors: 'น้องออดิต (AI Lead Auditor) ร่วมกับคณะกรรมการตรวจติดตามภายใน K.R.C.',
      scores: {
        scorePercent,
        grade,
        totalItems: items.length,
        evaluated: totalEvaluated,
        cCount,
        maCount,
        miCount,
        obsCount,
        ofiCount,
      },
    };

    try {
      const res = await fetch('/api/audit/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditInfo,
          auditItems: displayedItems,
        }),
      });

      const data = await res.json();
      setFullReportMarkdown(data.reportMarkdown || 'ไม่สามารถสร้างรายงานได้');
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการสร้างรายงาน: ' + err.message);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleCopyReport = () => {
    if (!fullReportMarkdown) return;
    navigator.clipboard.writeText(fullReportMarkdown);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl border border-white/20 text-blue-200">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-blue-300">
                แบบฟอร์ม F-QS-007 / F-CR-004
              </span>
              <h3 className="text-lg font-bold">
                สรุปประเด็นที่พบทั้งหมด & รายงานผลการตรวจติดตามภายใน (Audit Findings Summary)
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                รวบรวมข้อบกพร่อง วิเคราะห์เกรด (A-F) พร้อมฟังก์ชัน Copy Markdown Table สำหรับ Google Sheets / Google Docs ของทีมงาน K.R.C.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateFullReport}
              disabled={generatingReport}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{generatingReport ? 'กำลังสร้างรายงาน...' : 'สร้างรายงานฉบับสมบูรณ์ (AI)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[11px] font-semibold text-slate-500 block">คะแนนความสอดคล้อง</span>
          <span className="text-2xl font-black text-blue-900">{scorePercent}%</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">เกรด {grade}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[11px] font-semibold text-slate-500 block">ตรวจแล้วทั้งหมด</span>
          <span className="text-2xl font-black text-slate-800">
            {totalEvaluated}/{items.length}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">ข้อตรวจ</span>
        </div>

        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-center">
          <span className="text-[11px] font-semibold text-emerald-800 block">สอดคล้อง (C)</span>
          <span className="text-2xl font-black text-emerald-700">{cCount}</span>
          <span className="text-[10px] text-emerald-600 block mt-0.5">ผ่านเกณฑ์</span>
        </div>

        <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 text-center">
          <span className="text-[11px] font-semibold text-rose-800 block">Major NC</span>
          <span className="text-2xl font-black text-rose-700">{maCount}</span>
          <span className="text-[10px] text-rose-600 block mt-0.5">ข้อบกพร่องรุนแรง</span>
        </div>

        <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 text-center">
          <span className="text-[11px] font-semibold text-amber-800 block">Minor NC</span>
          <span className="text-2xl font-black text-amber-700">{miCount}</span>
          <span className="text-[10px] text-amber-600 block mt-0.5">ข้อบกพร่องเล็กน้อย</span>
        </div>

        <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200 text-center">
          <span className="text-[11px] font-semibold text-purple-800 block">ข้อสังเกต (OBS)</span>
          <span className="text-2xl font-black text-purple-700">{obsCount}</span>
          <span className="text-[10px] text-purple-600 block mt-0.5">ข้อเสนอแนะ</span>
        </div>
      </div>

      {/* Table Toolbar & View Switcher */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('DEFICIENCIES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              filterType === 'DEFICIENCIES'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>เฉพาะข้อบกพร่องที่ต้องแก้ไข ({deficiencies.length})</span>
          </button>

          <button
            onClick={() => setFilterType('CONFORMING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              filterType === 'CONFORMING'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>สอดคล้อง ({conformingItems.length})</span>
          </button>

          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
              filterType === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            รายการตรวจทั้งหมด ({evaluatedItems.length})
          </button>
        </div>

        {/* Copy as Markdown Table button */}
        <button
          onClick={handleCopyTable}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer active:scale-95"
          title="คัดลอกตารางนี้เพื่อไป Paste ลงใน Google Sheets หรือ Google Docs"
        >
          {copiedTable ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>คัดลอกตาราง Markdown แล้ว!</span>
            </>
          ) : (
            <>
              <Table className="w-4 h-4 text-emerald-200" />
              <span>คัดลอกตาราง Markdown (สำหรับ Google Sheets)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Audit Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-3 text-center w-14">ข้อที่</th>
                <th className="py-3 px-3 w-36">ข้อกำหนด / กฎหมาย</th>
                <th className="py-3 px-4 min-w-[220px]">สิ่งที่ตรวจพบหน้างาน (Objective Evidence)</th>
                <th className="py-3 px-3 text-center w-24">ผลประเมิน</th>
                <th className="py-3 px-4 min-w-[220px]">สรุปข้อบกพร่อง / ข้อสังเกต (Finding Details)</th>
                <th className="py-3 px-3 w-40">เอกสาร / WI อ้างอิง</th>
                <th className="py-3 px-3 text-center w-24">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    ไม่พบรายการในหมวดที่เลือก หรือยังไม่มีการบันทึกผลการตรวจ
                  </td>
                </tr>
              ) : (
                displayedItems.map((item, idx) => {
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        item.status === 'MA'
                          ? 'bg-rose-50/40'
                          : item.status === 'MI'
                          ? 'bg-amber-50/30'
                          : idx % 2 === 0
                          ? 'bg-white'
                          : 'bg-slate-50/30'
                      }`}
                    >
                      {/* ID */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        #{item.id}
                      </td>

                      {/* Requirement & Law */}
                      <td className="py-3 px-3 space-y-1">
                        <span className="font-bold text-blue-900 block">{item.requirement}</span>
                        {item.lawReferences && item.lawReferences.length > 0 && (
                          <span className="text-[10px] text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded block line-clamp-2">
                            {item.lawReferences[0]}
                          </span>
                        )}
                      </td>

                      {/* Finding */}
                      <td className="py-3 px-4 text-slate-700 leading-relaxed">
                        <p className="line-clamp-3">{item.evidenceRecorded || item.question}</p>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md font-bold text-[11px] shadow-sm ${
                            item.status === 'C'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : item.status === 'MA'
                              ? 'bg-rose-600 text-white'
                              : item.status === 'MI'
                              ? 'bg-amber-500 text-white'
                              : item.status === 'OBS'
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Finding Details */}
                      <td className="py-3 px-4 text-slate-700">
                        {item.auditorFindingDetail ? (
                          <p className="text-[11px] text-slate-800 line-clamp-3">
                            {item.auditorFindingDetail}
                          </p>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            {item.status === 'C' ? 'สอดคล้องตามเกณฑ์มาตรฐาน' : 'ยังไม่มีบันทึกเพิ่มเติม'}
                          </span>
                        )}
                      </td>

                      {/* Reference Docs */}
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                        {item.referenceDocs || '-'}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onOpenExplainModal(item)}
                          className="w-full px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                        >
                          ดูข้อกำหนด
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generated AI Executive Report Modal / Container */}
      {fullReportMarkdown && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h4 className="font-bold text-slate-900 text-base">
                รายงานผลการตรวจติดตามภายในฉบับสมบูรณ์ (F-QS-007 Executive Report)
              </h4>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyReport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                {copiedReport ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>คัดลอกรายงานแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-white" />
                    <span>คัดลอกรายงานทั้งหมด</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setFullReportMarkdown('')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-slate-800 leading-relaxed whitespace-pre-line text-xs sm:text-sm bg-slate-50 p-5 rounded-xl border border-slate-200 overflow-x-auto">
            {fullReportMarkdown}
          </div>
        </div>
      )}
    </div>
  );
};
