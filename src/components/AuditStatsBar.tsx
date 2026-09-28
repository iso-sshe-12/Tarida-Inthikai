import React from 'react';
import { AuditItem } from '../types/audit';
import { CheckCircle2, XCircle, AlertCircle, Eye, Lightbulb, Clock, Award, ShieldAlert, FileText } from 'lucide-react';

interface AuditStatsBarProps {
  items: AuditItem[];
  onFilterStatus: (status: string) => void;
  selectedStatusFilter: string;
  onOpenReport: () => void;
  onOpenCarManager: () => void;
}

export const AuditStatsBar: React.FC<AuditStatsBarProps> = ({
  items,
  onFilterStatus,
  selectedStatusFilter,
  onOpenReport,
  onOpenCarManager,
}) => {
  const total = items.length;
  const cCount = items.filter((i) => i.status === 'C').length;
  const maCount = items.filter((i) => i.status === 'MA').length;
  const miCount = items.filter((i) => i.status === 'MI').length;
  const obsCount = items.filter((i) => i.status === 'OBS').length;
  const ofiCount = items.filter((i) => i.status === 'OFI').length;
  const pendingCount = items.filter((i) => i.status === 'PENDING').length;
  const evaluatedCount = total - pendingCount;

  // Conformance score
  // If no items evaluated yet, 0%
  // Score formula: C is 100%, OBS/OFI is 80%, MI is 40%, MA is 0%
  const totalScorePoints =
    evaluatedCount > 0
      ? (cCount * 100 + ofiCount * 85 + obsCount * 70 + miCount * 40 + maCount * 0) / evaluatedCount
      : 0;
  const conformancePercent = Math.round(totalScorePoints);

  // Grade calculation
  let grade = '–';
  let gradeColor = 'text-slate-400 border-slate-300 bg-slate-100';
  let gradeNote = 'ยังไม่มีผลการตรวจ';

  if (evaluatedCount > 0) {
    if (maCount >= 3 || conformancePercent < 50) {
      grade = 'F';
      gradeColor = 'text-rose-700 border-rose-400 bg-rose-50';
      gradeNote = 'ตกเกณฑ์ขั้นวิกฤต (ต้องออก CAR ทันที)';
    } else if (maCount >= 1 || conformancePercent < 60) {
      grade = 'E';
      gradeColor = 'text-amber-800 border-amber-400 bg-amber-50';
      gradeNote = 'มี Major NC หรือคะแนนต่ำ (ต้องแก้ไขเร่งด่วน)';
    } else if (conformancePercent < 70) {
      grade = 'D';
      gradeColor = 'text-orange-700 border-orange-400 bg-orange-50';
      gradeNote = 'ต่ำกว่าเกณฑ์มาตรฐาน 70% (ต้องทำ CAP)';
    } else if (conformancePercent < 80) {
      grade = 'C';
      gradeColor = 'text-yellow-800 border-yellow-400 bg-yellow-50';
      gradeNote = 'ผ่านเกณฑ์มาตรฐานขั้นต่ำ (เฝ้าระวัง)';
    } else if (conformancePercent < 90) {
      grade = 'B';
      gradeColor = 'text-blue-800 border-blue-400 bg-blue-50';
      gradeNote = 'ดี (พร้อมรับการตรวจ CB)';
    } else {
      grade = 'A';
      gradeColor = 'text-emerald-800 border-emerald-400 bg-emerald-50';
      gradeNote = 'ยอดเยี่ยม (ความพร้อมเต็มรูปแบบ)';
    }
  }

  // Count active CARs
  const carCount = items.filter((i) => i.capRequired && i.capData).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-5 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Overall Grade & Progress */}
        <div className="lg:col-span-4 flex items-center gap-4 bg-gradient-to-br from-slate-50 to-blue-50/50 p-4 rounded-xl border border-slate-200/60">
          <div className="flex flex-col items-center justify-center">
            <div
              className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center font-black text-3xl shadow-sm ${gradeColor}`}
            >
              <span>{grade}</span>
              <span className="text-[10px] -mt-1 font-semibold tracking-wider">GRADE</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                ความสอดคล้อง (Conformance)
              </span>
              <span className="text-base font-extrabold text-blue-900">{conformancePercent}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-200 rounded-full h-2.5 my-1.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  conformancePercent >= 80
                    ? 'bg-emerald-500'
                    : conformancePercent >= 70
                    ? 'bg-blue-500'
                    : conformancePercent >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(3, conformancePercent))}%` }}
              />
            </div>

            <p className="text-xs font-medium text-slate-600 truncate">{gradeNote}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ตรวจแล้ว {evaluatedCount} จาก {total} ข้อ (คงเหลือ {pendingCount} ข้อ)
            </p>
          </div>
        </div>

        {/* Quick Filter Badges for Finding Categories */}
        <div className="lg:col-span-5 grid grid-cols-3 sm:grid-cols-6 gap-2">
          {/* C */}
          <button
            onClick={() => onFilterStatus(selectedStatusFilter === 'C' ? 'ALL' : 'C')}
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              selectedStatusFilter === 'C'
                ? 'bg-emerald-100 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-100/60'
            }`}
          >
            <div className="flex items-center justify-center mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-lg font-bold leading-tight">{cCount}</div>
            <div className="text-[10px] font-medium text-emerald-700">สอดคล้อง (C)</div>
          </button>

          {/* MA */}
          <button
            onClick={() => onFilterStatus(selectedStatusFilter === 'MA' ? 'ALL' : 'MA')}
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              selectedStatusFilter === 'MA'
                ? 'bg-rose-100 border-rose-500 text-rose-900 ring-2 ring-rose-400'
                : 'bg-rose-50/70 border-rose-200 text-rose-800 hover:bg-rose-100/60'
            }`}
          >
            <div className="flex items-center justify-center mb-1">
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-lg font-bold leading-tight">{maCount}</div>
            <div className="text-[10px] font-medium text-rose-700">Major NC</div>
          </button>

          {/* MI */}
          <button
            onClick={() => onFilterStatus(selectedStatusFilter === 'MI' ? 'ALL' : 'MI')}
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              selectedStatusFilter === 'MI'
                ? 'bg-amber-100 border-amber-500 text-amber-900 ring-2 ring-amber-400'
                : 'bg-amber-50/70 border-amber-200 text-amber-800 hover:bg-amber-100/60'
            }`}
          >
            <div className="flex items-center justify-center mb-1">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-lg font-bold leading-tight">{miCount}</div>
            <div className="text-[10px] font-medium text-amber-700">Minor NC</div>
          </button>

          {/* OBS */}
          <button
            onClick={() => onFilterStatus(selectedStatusFilter === 'OBS' ? 'ALL' : 'OBS')}
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              selectedStatusFilter === 'OBS'
                ? 'bg-purple-100 border-purple-500 text-purple-900 ring-2 ring-purple-400'
                : 'bg-purple-50/70 border-purple-200 text-purple-800 hover:bg-purple-100/60'
            }`}
          >
            <div className="flex items-center justify-center mb-1">
              <Eye className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-lg font-bold leading-tight">{obsCount}</div>
            <div className="text-[10px] font-medium text-purple-700">ข้อสังเกต (OBS)</div>
          </button>

          {/* OFI */}
          <button
            onClick={() => onFilterStatus(selectedStatusFilter === 'OFI' ? 'ALL' : 'OFI')}
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              selectedStatusFilter === 'OFI'
                ? 'bg-cyan-100 border-cyan-500 text-cyan-900 ring-2 ring-cyan-400'
                : 'bg-cyan-50/70 border-cyan-200 text-cyan-800 hover:bg-cyan-100/60'
            }`}
          >
            <div className="flex items-center justify-center mb-1">
              <Lightbulb className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-lg font-bold leading-tight">{ofiCount}</div>
            <div className="text-[10px] font-medium text-cyan-700">ข้อเสนอ (OFI)</div>
          </button>

          {/* PENDING */}
          <button
            onClick={() => onFilterStatus(selectedStatusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              selectedStatusFilter === 'PENDING'
                ? 'bg-slate-200 border-slate-500 text-slate-900 ring-2 ring-slate-400'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-lg font-bold leading-tight">{pendingCount}</div>
            <div className="text-[10px] font-medium text-slate-600">รอดำเนินการ</div>
          </button>
        </div>

        {/* Action Buttons: CAR & Executive Report */}
        <div className="lg:col-span-3 flex flex-row lg:flex-col gap-2.5">
          <button
            onClick={onOpenCarManager}
            className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 rounded-xl text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>ใบ CAR & CAP ({carCount})</span>
          </button>

          <button
            onClick={onOpenReport}
            className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/10 transition active:scale-95 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-blue-200" />
            <span>สรุปผล & ออกรายงาน (F-QS-007)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
