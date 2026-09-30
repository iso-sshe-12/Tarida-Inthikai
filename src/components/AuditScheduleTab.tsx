import React, { useState } from 'react';
import { AuditPlanEntry, AuditPlanStatus } from '../types/audit';
import {
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Search,
  Copy,
  Check,
  Building2,
  UserCheck,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  MapPin,
  Users,
  Database,
} from 'lucide-react';
import { DEFAULT_AUDIT_SCHEDULE } from '../data/auditScheduleData';

interface AuditScheduleTabProps {
  scheduleItems: AuditPlanEntry[];
  onAddSchedule: (item: AuditPlanEntry) => void;
  onUpdateSchedule: (item: AuditPlanEntry) => void;
  onDeleteSchedule: (id: string) => void;
  onResetSchedule: () => void;
  onJumpToChecklist?: () => void;
  isSheetsConnected?: boolean;
  onSyncAllToSheets?: () => void;
}

export const AuditScheduleTab: React.FC<AuditScheduleTabProps> = ({
  scheduleItems,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onResetSchedule,
  onJumpToChecklist,
  isSheetsConnected = false,
  onSyncAllToSheets,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AuditPlanStatus>('ALL');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<AuditPlanEntry | null>(null);
  const [copiedTable, setCopiedTable] = useState<boolean>(false);

  // Form State for Add / Edit
  const [formDate, setFormDate] = useState<string>('');
  const [formTimeSlot, setFormTimeSlot] = useState<string>('09:00 - 12:00');
  const [formDepartment, setFormDepartment] = useState<string>('');
  const [formLocation, setFormLocation] = useState<string>('');
  const [formScope, setFormScope] = useState<string>('');
  const [formIsoClauses, setFormIsoClauses] = useState<string>('ISO 9001: 8.5, ISO 14001: 8.1, ISO 45001: 8.1.2');
  const [formLeadAuditor, setFormLeadAuditor] = useState<string>('น้องออดิต (AI Lead Auditor)');
  const [formAuditTeam, setFormAuditTeam] = useState<string>('ประภาส สันติสุข (SSHE Lead)');
  const [formAuditeeName, setFormAuditeeName] = useState<string>('');
  const [formReferenceDocs, setFormReferenceDocs] = useState<string>('F-SE-006 (87 ข้อ)');
  const [formStatus, setFormStatus] = useState<AuditPlanStatus>('PLANNED');
  const [formNotes, setFormNotes] = useState<string>('');

  // Open modal in Add mode
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTimeSlot('09:00 - 12:00');
    setFormDepartment('แผนกปฏิบัติการลานตู้คอนเทนเนอร์ (Yard & Survey Gate)');
    setFormLocation('ลานตู้คอนเทนเนอร์ Yard A & ช่องทาง Gate');
    setFormScope('การสุ่มตรวจสภาพตู้, สารเคมี, Work at Height, หน้ากากกรอง N95');
    setFormIsoClauses('ISO 9001: 8.5.1, ISO 14001: 8.1, ISO 45001: 8.1.2, กฎหมายความปลอดภัย');
    setFormLeadAuditor('น้องออดิต (AI Lead Auditor)');
    setFormAuditTeam('ประภาส สันติสุข (SSHE Lead)');
    setFormAuditeeName('วิชัย ชัยชนะ (Supervisor ลานตู้)');
    setFormReferenceDocs('WI-OP-001, P-PU-002, Checklist F-SE-006');
    setFormStatus('PLANNED');
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open modal in Edit mode
  const handleOpenEditModal = (item: AuditPlanEntry) => {
    setEditingItem(item);
    setFormDate(item.date);
    setFormTimeSlot(item.timeSlot);
    setFormDepartment(item.department);
    setFormLocation(item.location);
    setFormScope(item.scope);
    setFormIsoClauses(item.isoClauses.join(', '));
    setFormLeadAuditor(item.leadAuditor);
    setFormAuditTeam(item.auditTeam || '');
    setFormAuditeeName(item.auditeeName);
    setFormReferenceDocs(item.referenceDocs);
    setFormStatus(item.status);
    setFormNotes(item.notes || '');
    setIsModalOpen(true);
  };

  // Save form (Add or Edit)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();

    const clausesArray = formIsoClauses
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (editingItem) {
      // Update
      const updated: AuditPlanEntry = {
        ...editingItem,
        date: formDate,
        timeSlot: formTimeSlot,
        department: formDepartment,
        location: formLocation,
        scope: formScope,
        isoClauses: clausesArray,
        leadAuditor: formLeadAuditor,
        auditTeam: formAuditTeam,
        auditeeName: formAuditeeName,
        referenceDocs: formReferenceDocs,
        status: formStatus,
        notes: formNotes,
      };
      onUpdateSchedule(updated);
    } else {
      // Add new
      const newEntry: AuditPlanEntry = {
        id: `AUD-SCH-${String(scheduleItems.length + 1).padStart(3, '0')}`,
        date: formDate,
        timeSlot: formTimeSlot,
        department: formDepartment,
        location: formLocation,
        scope: formScope,
        isoClauses: clausesArray,
        leadAuditor: formLeadAuditor,
        auditTeam: formAuditTeam,
        auditeeName: formAuditeeName,
        referenceDocs: formReferenceDocs,
        status: formStatus,
        notes: formNotes,
      };
      onAddSchedule(newEntry);
    }

    setIsModalOpen(false);
  };

  // Quick switch status inline
  const handleToggleStatus = (item: AuditPlanEntry) => {
    const nextStatus: Record<AuditPlanStatus, AuditPlanStatus> = {
      PLANNED: 'IN_PROGRESS',
      IN_PROGRESS: 'COMPLETED',
      COMPLETED: 'POSTPONED',
      POSTPONED: 'PLANNED',
    };
    onUpdateSchedule({
      ...item,
      status: nextStatus[item.status] || 'PLANNED',
    });
  };

  // Filter items
  const filteredItems = scheduleItems.filter((item) => {
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesSearch =
      item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.scope.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.leadAuditor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.auditeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.isoClauses.some((c) => c.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Copy Markdown Table for Google Sheets / Google Docs
  const handleCopyMarkdown = () => {
    let md = `| ลำดับ | รหัส | วันที่ตรวจ | ช่วงเวลา | แผนก / หน่วยงาน | สถานที่ | ขอบเขต / ประเด็นตรวจ | ข้อกำหนด ISO | ผู้ตรวจ (Lead Auditor) | ผู้รับการตรวจ (Auditee) | เอกสารอ้างอิง | สถานะ |\n`;
    md += `| :---: | :---: | :---: | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |\n`;

    filteredItems.forEach((item, idx) => {
      const clauses = item.isoClauses.join('; ');
      const statusText =
        item.status === 'COMPLETED'
          ? 'เสร็จสิ้น (Completed)'
          : item.status === 'IN_PROGRESS'
          ? 'กำลังตรวจ (In Progress)'
          : item.status === 'POSTPONED'
          ? 'เลื่อนตรวจ (Postponed)'
          : 'ตามแผน (Planned)';

      md += `| ${idx + 1} | ${item.id} | ${item.date} | ${item.timeSlot} | ${item.department} | ${item.location} | ${item.scope.replace(/\n/g, ' ')} | ${clauses} | ${item.leadAuditor} | ${item.auditeeName} | ${item.referenceDocs} | ${statusText} |\n`;
    });

    navigator.clipboard.writeText(md);
    setCopiedTable(true);
    setTimeout(() => setCopiedTable(false), 2000);
  };

  // Counts
  const totalCount = scheduleItems.length;
  const plannedCount = scheduleItems.filter((i) => i.status === 'PLANNED').length;
  const inProgressCount = scheduleItems.filter((i) => i.status === 'IN_PROGRESS').length;
  const completedCount = scheduleItems.filter((i) => i.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl border border-white/20 text-blue-200">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-blue-300">
                  แบบฟอร์ม F-QS-002 / F-QS-003
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  แผนตรวจภายใน K.R.C.
                </span>
              </div>
              <h3 className="text-lg font-bold mt-0.5">
                ตารางออดิต & กำหนดการตรวจติดตามภายใน (Internal Audit Schedule & Plan)
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                กำหนดการตรวจประเมินตามมาตรฐาน ISO 9001:2015, ISO 14001:2015, ISO 45001:2018 รายแผนก พร้อมบันทึกผู้ตรวจและผู้รับการตรวจ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ เพิ่มข้อมูลตารางออดิต</span>
            </button>

            {onSyncAllToSheets && (
              <button
                onClick={onSyncAllToSheets}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                  isSheetsConnected
                    ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border-emerald-500/50 shadow-xs'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="ซิงค์ตารางออดิตไปยังไฟล์ KRC_Audit_Database_Master (ชีต Audit_Schedule_Plan)"
              >
                <Database className={`w-4 h-4 ${isSheetsConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>ซิงค์ลง Google Sheets</span>
                {isSheetsConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              </button>
            )}

            <button
              onClick={handleCopyMarkdown}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              title="คัดลอกตารางไปวางใน Google Sheets / Google Docs"
            >
              {copiedTable ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-blue-300" />
                  <span>คัดลอกตาราง (Sheets)</span>
                </>
              )}
            </button>

            <button
              onClick={onResetSchedule}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition active:scale-95 cursor-pointer"
              title="โหลดแม่แบบตารางออดิต K.R.C. เริ่มต้น"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">แผนตรวจทั้งหมด</span>
            <span className="text-xl font-black text-slate-900">{totalCount} รายการ</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">ตามแผน (Planned)</span>
            <span className="text-xl font-black text-amber-700">{plannedCount} แผนก</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">กำลังตรวจ (In Progress)</span>
            <span className="text-xl font-black text-indigo-700">{inProgressCount} แผนก</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">ตรวจเสร็จสิ้นแล้ว</span>
            <span className="text-xl font-black text-emerald-700">{completedCount} แผนก</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาแผนก, สถานที่, ขอบเขตที่ตรวจ, ผู้ตรวจ, หรือผู้รับการตรวจ..."
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { key: 'ALL', label: 'ทั้งหมด' },
              { key: 'PLANNED', label: 'ตามแผน' },
              { key: 'IN_PROGRESS', label: 'กำลังตรวจ' },
              { key: 'COMPLETED', label: 'เสร็จสิ้น' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-3 text-center w-14">รหัส</th>
                <th className="py-3 px-3 w-32">วัน & เวลาตรวจ</th>
                <th className="py-3 px-4 min-w-[200px]">แผนก / สถานที่ตรวจ</th>
                <th className="py-3 px-4 min-w-[240px]">ขอบเขต & ประเด็นการตรวจ</th>
                <th className="py-3 px-3 w-36">ข้อกำหนด ISO</th>
                <th className="py-3 px-3 w-36">ผู้ตรวจ & Auditee</th>
                <th className="py-3 px-3 text-center w-28">สถานะ</th>
                <th className="py-3 px-3 text-center w-24">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    ไม่พบรายการในตารางออดิต หรือไม่มีข้อมูลที่ตรงกับคำค้นหา
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        item.status === 'IN_PROGRESS'
                          ? 'bg-blue-50/30'
                          : item.status === 'COMPLETED'
                          ? 'bg-emerald-50/20'
                          : idx % 2 === 0
                          ? 'bg-white'
                          : 'bg-slate-50/30'
                      }`}
                    >
                      {/* ID */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        {item.id}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-3 space-y-1">
                        <div className="flex items-center gap-1 text-slate-800 font-bold">
                          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{item.date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{item.timeSlot}</span>
                        </div>
                      </td>

                      {/* Department & Location */}
                      <td className="py-3 px-4 space-y-1">
                        <p className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{item.department}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{item.location}</span>
                        </p>
                      </td>

                      {/* Scope & Notes */}
                      <td className="py-3 px-4 space-y-1.5">
                        <p className="text-slate-800 leading-relaxed font-medium">
                          {item.scope}
                        </p>
                        {item.notes && (
                          <div className="text-[10px] text-amber-900 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
                            <strong>หมายเหตุ/จุดสกัดกั้น:</strong> {item.notes}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 font-mono">
                          <strong>เอกสารอ้างอิง:</strong> {item.referenceDocs}
                        </div>
                      </td>

                      {/* ISO Clauses */}
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {item.isoClauses.map((clause, cIdx) => (
                            <span
                              key={cIdx}
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200 whitespace-nowrap"
                            >
                              {clause}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Auditors & Auditees */}
                      <td className="py-3 px-3 space-y-1">
                        <div className="text-[11px] text-slate-800">
                          <span className="font-semibold text-slate-500 text-[10px] block">ผู้ตรวจ:</span>
                          <span className="font-medium text-blue-900">{item.leadAuditor}</span>
                          {item.auditTeam && (
                            <span className="text-[10px] text-slate-500 block truncate">
                              + {item.auditTeam}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-700 pt-0.5 border-t border-slate-100">
                          <span className="font-semibold text-slate-500 text-[10px] block">ผู้รับการตรวจ:</span>
                          <span className="font-medium text-slate-900">{item.auditeeName}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          className={`w-full py-1.5 px-2 rounded-lg font-bold text-[10px] shadow-2xs transition cursor-pointer flex items-center justify-center gap-1 ${
                            item.status === 'COMPLETED'
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                              : item.status === 'IN_PROGRESS'
                              ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-300 animate-pulse'
                              : item.status === 'POSTPONED'
                              ? 'bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300'
                              : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                          }`}
                          title="คลิกเพื่อสลับสถานะ (Planned -> In Progress -> Completed)"
                        >
                          {item.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {item.status === 'IN_PROGRESS' && <Sparkles className="w-3 h-3 text-indigo-600" />}
                          {item.status === 'PLANNED' && <Clock className="w-3 h-3 text-amber-600" />}
                          <span>
                            {item.status === 'COMPLETED'
                              ? 'เสร็จสิ้น'
                              : item.status === 'IN_PROGRESS'
                              ? 'กำลังตรวจ'
                              : item.status === 'POSTPONED'
                              ? 'เลื่อนตรวจ'
                              : 'ตามแผน'}
                          </span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 rounded-lg transition cursor-pointer"
                          title="แก้ไขรายการ"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`ยืนยันการลบแผนตรวจของ ${item.department} หรือไม่?`)) {
                              onDeleteSchedule(item.id);
                            }
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-lg transition cursor-pointer"
                          title="ลบรายการ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal: Add / Edit Audit Schedule Entry */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-600 text-white">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {editingItem ? 'แก้ไขรายการในตารางออดิต' : 'เพิ่มข้อมูลรายการตรวจในตารางออดิต'}
                  </h3>
                  <p className="text-xs text-blue-200">
                    แบบฟอร์มบันทึกกำหนดการตรวจติดตามภายใน (F-QS-002 / F-QS-003)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    วันที่ตรวจ (Audit Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Time slot */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ช่วงเวลา (Time Slot) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTimeSlot}
                    onChange={(e) => setFormTimeSlot(e.target.value)}
                    placeholder="เช่น 09:00 - 12:00 หรือ 13:30 - 16:00"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  แผนก / หน่วยงานที่รับการตรวจ (Department / Section) *
                </label>
                <input
                  type="text"
                  required
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  placeholder="เช่น แผนกปฏิบัติการลานตู้คอนเทนเนอร์, แผนกซ่อมบำรุง, ขนส่ง, คลังสินค้า..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  สถานที่ตรวจหน้างาน (Audit Location) *
                </label>
                <input
                  type="text"
                  required
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="เช่น ลานตู้ Yard A & ช่องทาง Gate เข้า-ออก, โรงซ่อมบำรุง Garage 1"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Scope */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ขอบเขตและกิจกรรมที่ตรวจ (Audit Scope & Key Focus) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formScope}
                  onChange={(e) => setFormScope(e.target.value)}
                  placeholder="ระบุสิ่งที่ต้องตรวจ เช่น การตรวจสภาพตู้, สารเคมีผู้รับเหมา, การสวมใส่ PPE, เป่าแอลกอฮอล์ พขร...."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* ISO Clauses */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ข้อกำหนด ISO และกฎหมายที่เกี่ยวข้อง (คั่นด้วยเครื่องหมายจุลภาค ,)
                </label>
                <input
                  type="text"
                  value={formIsoClauses}
                  onChange={(e) => setFormIsoClauses(e.target.value)}
                  placeholder="ISO 9001: 8.5.1, ISO 14001: 8.1, ISO 45001: 8.1.2, กฎกระทรวงแรงงาน"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Lead Auditor */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    หัวหน้าผู้ตรวจ (Lead Auditor) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formLeadAuditor}
                    onChange={(e) => setFormLeadAuditor(e.target.value)}
                    placeholder="เช่น น้องออดิต (AI Lead Auditor) / ประภาส สันติสุข"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Audit Team */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ทีมผู้ตรวจร่วม (Audit Team)
                  </label>
                  <input
                    type="text"
                    value={formAuditTeam}
                    onChange={(e) => setFormAuditTeam(e.target.value)}
                    placeholder="เช่น ประภาส สันติสุข, อมรเทพ วงษ์สุวรรณ"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Auditee Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ผู้รับการตรวจ / ผู้ประสานงาน (Auditee) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formAuditeeName}
                    onChange={(e) => setFormAuditeeName(e.target.value)}
                    placeholder="เช่น วิชัย ชัยชนะ (Supervisor ลานตู้)"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Reference Docs */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ระเบียบปฏิบัติ / เอกสารอ้างอิง (Procedure / WI)
                  </label>
                  <input
                    type="text"
                    value={formReferenceDocs}
                    onChange={(e) => setFormReferenceDocs(e.target.value)}
                    placeholder="เช่น P-PU-002, WI-OP-001, Checklist F-SE-006"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    สถานะการตรวจ (Status)
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as AuditPlanStatus)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="PLANNED">ตามแผน (Planned)</option>
                    <option value="IN_PROGRESS">กำลังดำเนินการตรวจ (In Progress)</option>
                    <option value="COMPLETED">ตรวจเสร็จสิ้นแล้ว (Completed)</option>
                    <option value="POSTPONED">เลื่อนการตรวจ (Postponed)</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    หมายเหตุ / จุดสกัดกั้นหน้างาน
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="เช่น เน้นตรวจขวดสารเคมี, สุ่มตรวจ พขร. 5 นาย"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  {editingItem ? 'บันทึกการแก้ไข' : 'บันทึกลงตารางออดิต'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
