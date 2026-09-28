import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { AuditItem, AuditFinding, CapData, AuditeeSubmission } from '../types/audit';
import { AUDIT_CATEGORIES } from '../data/auditChecklistData';
import { AuditeeResponseModal } from './AuditeeResponseModal';
import {
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Lightbulb,
  Clock,
  MessageCircleQuestion,
  ShieldAlert,
  BookOpen,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Scale,
  Camera,
  AlertTriangle,
  UploadCloud,
  Download,
  RotateCcw,
  UserCheck,
  ShieldCheck,
  Link as LinkIcon,
  ExternalLink,
  PlusCircle,
  X,
} from 'lucide-react';

interface ChecklistTabProps {
  items: AuditItem[];
  onUpdateItem: (updatedItem: AuditItem) => void;
  onOpenExplainModal: (item: AuditItem) => void;
  onOpenCarModal: (item: AuditItem) => void;
  statusFilter: string;
  onClearStatusFilter: () => void;
  onOpenUploadModal: () => void;
  checklistTitle?: string;
  onResetToDefault?: () => void;
  isCustomChecklist?: boolean;
  roleMode?: 'AUDITOR' | 'AUDITEE';
  onToggleRole?: (role: 'AUDITOR' | 'AUDITEE') => void;
}

export const ChecklistTab: React.FC<ChecklistTabProps> = ({
  items,
  onUpdateItem,
  onOpenExplainModal,
  onOpenCarModal,
  statusFilter,
  onClearStatusFilter,
  onOpenUploadModal,
  checklistTitle = 'แบบฟอร์ม F-SE-006 (87 ข้อ)',
  onResetToDefault,
  isCustomChecklist = false,
  roleMode = 'AUDITOR',
  onToggleRole,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [highPriorityOnly, setHighPriorityOnly] = useState<boolean>(false);
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
  const [evaluatingItemId, setEvaluatingItemId] = useState<number | null>(null);

  // Auditee portal filter: 'ALL' | 'PENDING' | 'SUBMITTED' | 'NC_ACTION'
  const [auditeeFilter, setAuditeeFilter] = useState<'ALL' | 'PENDING' | 'SUBMITTED' | 'NC_ACTION'>('ALL');

  // Auditee Modal & Zoom State
  const [auditeeModalItem, setAuditeeModalItem] = useState<AuditItem | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Dynamic categories from items
  const dynamicCategories = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((it) => {
      if (!map.has(it.categoryCode)) {
        map.set(it.categoryCode, it.categoryTitle);
      }
    });
    return Array.from(map.entries()).map(([code, title]) => ({ code, title }));
  }, [items]);

  // Export current checklist to Excel
  const handleExportToExcel = () => {
    const exportRows = items.map((it) => ({
      'ลำดับ (No)': it.id,
      'รหัสหมวด': it.categoryCode,
      'ชื่อหมวด': it.categoryTitle,
      'ข้อกำหนด': it.requirement,
      'ข้อคำถามในการตรวจ': it.question,
      'เอกสารอ้างอิง': it.referenceDocs,
      'หลักฐานที่ต้องตรวจสอบ': it.requiredEvidence,
      'ระดับความสำคัญ': it.priority,
      'ผลการตรวจ (Status)': it.status,
      'คำชี้แจงจาก Auditee': it.auditeeResponse?.explanation || '',
      'ผู้ส่งหลักฐาน (Auditee)': it.auditeeResponse?.responderName || '',
      'บันทึกหลักฐานที่พบ': it.evidenceRecorded || '',
      'บทวิเคราะห์ Lead Auditor': it.auditorFindingDetail || '',
      'ข้อกำหนด ISO': it.isoClauses?.join(', ') || '',
      'กฎหมายที่เกี่ยวข้อง': it.lawReferences?.join(', ') || '',
      'ต้องการใบ CAR': it.capRequired ? 'YES' : 'NO',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AuditResults');
    XLSX.writeFile(
      workbook,
      `KRC_Audit_Checklist_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (selectedCategory !== 'ALL' && item.categoryCode !== selectedCategory) {
      return false;
    }
    if (statusFilter !== 'ALL' && item.status !== statusFilter) {
      return false;
    }
    if (highPriorityOnly && item.priority !== 'HIGH') {
      return false;
    }

    // Role-specific filtering for Auditee
    if (roleMode === 'AUDITEE') {
      if (auditeeFilter === 'PENDING' && item.auditeeResponse?.explanation) {
        return false;
      }
      if (auditeeFilter === 'SUBMITTED' && !item.auditeeResponse?.explanation) {
        return false;
      }
      if (
        auditeeFilter === 'NC_ACTION' &&
        item.status !== 'MA' &&
        item.status !== 'MI' &&
        item.status !== 'OBS'
      ) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = String(item.id).includes(q);
      const matchReq = item.requirement.toLowerCase().includes(q);
      const matchQuestion = item.question.toLowerCase().includes(q);
      const matchDoc = item.referenceDocs.toLowerCase().includes(q);
      const matchEvidence = (item.evidenceRecorded || '').toLowerCase().includes(q);
      const matchAuditee = (item.auditeeResponse?.explanation || '').toLowerCase().includes(q);
      const matchFinding = (item.auditorFindingDetail || '').toLowerCase().includes(q);
      return matchId || matchReq || matchQuestion || matchDoc || matchEvidence || matchAuditee || matchFinding;
    }
    return true;
  });

  const handleStatusChange = (item: AuditItem, newStatus: AuditFinding) => {
    const updated: AuditItem = {
      ...item,
      status: newStatus,
      capRequired: newStatus === 'MA' || newStatus === 'MI',
    };
    onUpdateItem(updated);
  };

  const handleEvidenceChange = (item: AuditItem, text: string) => {
    onUpdateItem({ ...item, evidenceRecorded: text });
  };

  // AI Auto-Audit for single checklist item (considering both auditor note & auditee submission)
  const handleAiEvaluate = async (item: AuditItem, submissionOverride?: AuditeeSubmission) => {
    setEvaluatingItemId(item.id);
    const auditeeResp = submissionOverride || item.auditeeResponse;

    try {
      const res = await fetch('/api/audit/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checklistItem: item,
          evidenceText:
            item.evidenceRecorded ||
            (auditeeResp ? `Auditee ชี้แจง: ${auditeeResp.explanation}` : 'ยังไม่มีการบันทึกหลักฐาน ให้จำลองการสุ่มตรวจตามสภาพความเป็นจริงของลานตู้คอนเทนเนอร์/การขนส่ง KRC'),
          auditeeResponse: auditeeResp,
        }),
      });
      const data = await res.json();

      const newCapData: CapData | undefined = data.capRequired
        ? {
            carNo: data.capDraft?.carNo || `CAR-KRC-2026-${String(item.id).padStart(3, '0')}`,
            targetDate: data.capDraft?.targetDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            personInCharge: data.capDraft?.personInCharge || 'Supervisor หน่วยงานที่เกี่ยวข้อง',
            rootCause: data.capDraft?.rootCause || 'จากการวิเคราะห์สาเหตุเชิงลึก',
            correction: data.capDraft?.correction || 'แก้ไขทันทีเฉพาะหน้า',
            correctiveAction: data.capDraft?.correctiveAction || 'แก้ไขเชิงระบบเพื่อไม่ให้เกิดซ้ำ',
            preventiveAction: data.capDraft?.preventiveAction || 'มาตรการป้องกันเชิงรุก',
            extentAnalysis: data.capDraft?.extentAnalysis || 'ขยายผลการสุ่มตรวจสอบไปยังทุกพื้นที่',
            status: 'ISSUED',
            signatories: {
              preparedBy: data.capDraft?.signatories?.preparedBy || 'น้องออดิต (AI Lead Auditor)',
              proposedBy: data.capDraft?.signatories?.proposedBy || 'หัวหน้างาน / Supervisor (K.R.C.)',
              reviewedBy: data.capDraft?.signatories?.reviewedBy || 'ประภาส สันติสุข (QSHE Manager K.R.C.)',
              approvedBy: data.capDraft?.signatories?.approvedBy || 'กิตติศักดิ์ เจริญกิจ (President & CEO K.R.C.)',
              acknowledgedByVendor: data.capDraft?.signatories?.acknowledgedByVendor || (item.referenceDocs.includes('P-PU') ? 'ตัวแทนผู้รับเหมา (รับทราบผลเท่านั้น)' : undefined),
            },
          }
        : item.capData;

      const updated: AuditItem = {
        ...item,
        status: (data.status as AuditFinding) || item.status,
        evidenceRecorded: item.evidenceRecorded || data.evidenceRecorded,
        auditorFindingDetail: data.auditorFindingDetail,
        isoClauses: data.isoClauses || item.isoClauses,
        lawReferences: data.lawReferences || item.lawReferences,
        capRequired: data.capRequired,
        capData: newCapData,
      };

      onUpdateItem(updated);
      setExpandedItemId(item.id);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการประเมิน: ' + err.message);
    } finally {
      setEvaluatingItemId(null);
    }
  };

  // Save response from Auditee
  const handleSaveAuditeeResponse = (
    itemId: number,
    submission: AuditeeSubmission,
    triggerAutoEvaluate = false
  ) => {
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem) return;

    const updatedItem: AuditItem = {
      ...targetItem,
      auditeeResponse: submission,
      evidenceRecorded: targetItem.evidenceRecorded || `[Auditee: ${submission.responderName}] ${submission.explanation}`,
    };

    onUpdateItem(updatedItem);

    if (triggerAutoEvaluate) {
      handleAiEvaluate(updatedItem, submission);
    }
  };

  // Counts for Auditee filter
  const auditeePendingCount = items.filter((i) => !i.auditeeResponse?.explanation).length;
  const auditeeSubmittedCount = items.filter((i) => i.auditeeResponse?.explanation).length;
  const auditeeNcCount = items.filter(
    (i) => i.status === 'MA' || i.status === 'MI' || i.status === 'OBS'
  ).length;

  return (
    <div className="space-y-6">
      {/* Role Mode Banner & Switcher */}
      <div className={`p-4 rounded-2xl shadow-sm border transition-all ${
        roleMode === 'AUDITEE'
          ? 'bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white border-emerald-500/40'
          : 'bg-white text-slate-800 border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              roleMode === 'AUDITEE'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {roleMode === 'AUDITEE' ? (
                <UserCheck className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  roleMode === 'AUDITEE'
                    ? 'bg-emerald-400 text-slate-950 font-black'
                    : 'bg-blue-100 text-blue-900'
                }`}>
                  {roleMode === 'AUDITEE' ? 'โหมดผู้รับการตรวจ (Auditee Portal)' : 'โหมด Lead Auditor'}
                </span>
                <span className="text-xs font-semibold">
                  {roleMode === 'AUDITEE'
                    ? 'พื้นที่สำหรับทีมหน้างาน & ผู้รับเหมาตอบข้อซักถามและอัปโหลดภาพถ่ายหลักฐาน'
                    : 'พื้นที่ประเมินผล ตัดสินเกรด C/NC และออกใบ CAR'}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${
                roleMode === 'AUDITEE' ? 'text-emerald-100/80' : 'text-slate-500'
              }`}>
                {roleMode === 'AUDITEE'
                  ? '👉 ในแต่ละข้อตรวจ ให้คลิกปุ่มสีเขียว "📸 Auditee ตอบ & แนบหลักฐาน" เพื่อพิมพ์คำชี้แจงและถ่ายรูปหน้างาน'
                  : 'ตรวจสอบคำชี้แจงและรูปภาพที่ Auditee ส่งมา จากนั้นกด "ให้น้องออดิตประเมินแทนฉัน" เพื่อตัดสินผลตรวจ'}
              </p>
            </div>
          </div>

          {/* Switch Role Button */}
          {onToggleRole && (
            <div className="inline-flex rounded-xl p-1 bg-black/20 border border-white/10 shrink-0 self-start sm:self-auto">
              <button
                onClick={() => onToggleRole('AUDITOR')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  roleMode === 'AUDITOR'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>มุมมอง Auditor</span>
              </button>
              <button
                onClick={() => onToggleRole('AUDITEE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  roleMode === 'AUDITEE'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>มุมมอง Auditee</span>
              </button>
            </div>
          )}
        </div>

        {/* Auditee Specific Filter Tabs */}
        {roleMode === 'AUDITEE' && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-emerald-700/40 overflow-x-auto">
            <span className="text-[11px] font-semibold text-emerald-200">กรองเฉพาะ:</span>
            <button
              onClick={() => setAuditeeFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                auditeeFilter === 'ALL'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'bg-emerald-950/60 text-emerald-200 hover:bg-emerald-800/40'
              }`}
            >
              ทุกข้อ ({items.length})
            </button>
            <button
              onClick={() => setAuditeeFilter('PENDING')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                auditeeFilter === 'PENDING'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'bg-amber-950/40 text-amber-200 hover:bg-amber-900/40'
              }`}
            >
              ⏳ ยังไม่ได้ส่งหลักฐาน ({auditeePendingCount})
            </button>
            <button
              onClick={() => setAuditeeFilter('SUBMITTED')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                auditeeFilter === 'SUBMITTED'
                  ? 'bg-emerald-400 text-slate-950 shadow-xs'
                  : 'bg-emerald-950/60 text-emerald-200 hover:bg-emerald-800/40'
              }`}
            >
              ✓ ส่งหลักฐานแล้ว ({auditeeSubmittedCount})
            </button>
            <button
              onClick={() => setAuditeeFilter('NC_ACTION')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                auditeeFilter === 'NC_ACTION'
                  ? 'bg-rose-400 text-slate-950 shadow-xs'
                  : 'bg-rose-950/40 text-rose-200 hover:bg-rose-900/40'
              }`}
            >
              ⚠️ มีข้อบกพร่องต้องแก้ไข (NC/OBS {auditeeNcCount})
            </button>
          </div>
        )}
      </div>

      {/* Category Pills Header & Toolbar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {checklistTitle}
                </span>
                {isCustomChecklist ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Custom Uploaded
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    มาตรฐาน F-SE-006
                  </span>
                )}
                <span className="text-xs text-slate-500 font-medium">
                  ({items.length} รายการตรวจ)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                เลือกตรวจทีละข้อ ให้น้องออดิตช่วยประเมินอัตโนมัติ หรือถามข้อสงสัยแทนฉัน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Upload Button */}
            <button
              onClick={onOpenUploadModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-indigo-200" />
              <span>อัปโหลด Checklist ใหม่</span>
            </button>

            {/* Export to Excel */}
            <button
              onClick={handleExportToExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition active:scale-95 cursor-pointer"
              title="ส่งออกผลการตรวจเป็น Excel (.xlsx)"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>ส่งออก Excel</span>
            </button>

            {/* Reset to Default Button if custom */}
            {isCustomChecklist && onResetToDefault && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      'คุณต้องการรีเซ็ตกลับเป็น Checklist มาตรฐาน F-SE-006 (87 ข้อ) หรือไม่?'
                    )
                  ) {
                    onResetToDefault();
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-700 hover:text-rose-900 hover:bg-rose-50 rounded-xl border border-rose-200 transition cursor-pointer"
                title="กลับไปใช้ฟอร์มมาตรฐาน F-SE-006"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ต F-SE-006</span>
              </button>
            )}
          </div>
        </div>

        {/* Categories scrollable bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            ทุกหมวด ({items.length})
          </button>

          {dynamicCategories.map((cat) => {
            const countInCat = items.filter((i) => i.categoryCode === cat.code).length;
            const evalInCat = items.filter(
              (i) => i.categoryCode === cat.code && i.status !== 'PENDING'
            ).length;
            const isSelected = selectedCategory === cat.code;
            return (
              <button
                key={cat.code}
                onClick={() => setSelectedCategory(cat.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="font-bold">หมวด {cat.code}:</span>
                <span className="max-w-[140px] truncate">{cat.title}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? 'bg-blue-800 text-blue-200'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {evalInCat}/{countInCat}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Quick Filters */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาข้อคำถาม, ข้อกำหนด ISO, เอกสารอ้างอิง, หรือหลักฐาน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ล้าง
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHighPriorityOnly(!highPriorityOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                highPriorityOnly
                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${highPriorityOnly ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>เฉพาะจุดเสี่ยงสูง (High Risk)</span>
            </button>

            {statusFilter !== 'ALL' && (
              <button
                onClick={onClearStatusFilter}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition cursor-pointer whitespace-nowrap"
              >
                ล้างตัวกรองสถานะ ({statusFilter}) ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Checklist Cards List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">ไม่พบรายการตรวจสอบที่ตรงกับเงื่อนไข</h3>
            <p className="text-xs text-slate-500">
              ลองล้างคำค้นหา หรือเลือกหมวดหมู่อื่นเพื่อดูรายการตรวจสอบ
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isExpanded = expandedItemId === item.id;
            const isEvaluating = evaluatingItemId === item.id;

            return (
              <div
                key={item.id}
                id={`item-${item.id}`}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
                  item.status === 'MA'
                    ? 'border-rose-400/80 ring-1 ring-rose-300'
                    : item.status === 'MI'
                    ? 'border-amber-400/80 ring-1 ring-amber-300'
                    : item.status === 'C'
                    ? 'border-emerald-300'
                    : 'border-slate-200/90'
                }`}
              >
                {/* Item Header */}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      {/* Badges row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded-md">
                          #{item.id}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                          {item.requirement}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {item.categoryTitle}
                        </span>

                        {item.priority === 'HIGH' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            ★ จุดเสี่ยงสูง
                          </span>
                        )}

                        {item.remarks && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {item.remarks}
                          </span>
                        )}

                        {/* Auditee Submitted Status Badge */}
                        {item.auditeeResponse?.explanation && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Auditee ส่งหลักฐานแล้ว ({item.auditeeResponse.attachments?.length || 0} ไฟล์)
                          </span>
                        )}
                      </div>

                      {/* Question */}
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {item.question}
                      </h4>

                      {/* Reference & Evidence Description */}
                      <div className="text-xs text-slate-600 space-y-1 pt-1">
                        <p>
                          <strong className="text-slate-700">เอกสาร/ขั้นตอนอ้างอิง:</strong>{' '}
                          <span className="font-mono text-slate-800">{item.referenceDocs}</span>
                        </p>
                        <p>
                          <strong className="text-slate-700">หลักฐานที่ต้องสุ่มตรวจ:</strong>{' '}
                          <span>{item.requiredEvidence}</span>
                        </p>
                      </div>
                    </div>

                    {/* Status Button Bar / Badge */}
                    {roleMode === 'AUDITOR' ? (
                      <div className="shrink-0 flex items-center flex-wrap gap-1.5 pt-2 lg:pt-0">
                        <button
                          onClick={() => handleStatusChange(item, 'C')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            item.status === 'C'
                              ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-400'
                              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                          }`}
                          title="Conforming (สอดคล้อง)"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>C (สอดคล้อง)</span>
                        </button>

                        <button
                          onClick={() => handleStatusChange(item, 'MA')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            item.status === 'MA'
                              ? 'bg-rose-600 text-white shadow ring-2 ring-rose-400'
                              : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-300'
                          }`}
                          title="Major NC (ไม่สอดคล้องขั้นรุนแรง)"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Major NC</span>
                        </button>

                        <button
                          onClick={() => handleStatusChange(item, 'MI')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            item.status === 'MI'
                              ? 'bg-amber-600 text-white shadow ring-2 ring-amber-400'
                              : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300'
                          }`}
                          title="Minor NC (ไม่สอดคล้องขั้นเล็กน้อย)"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Minor NC</span>
                        </button>

                        <button
                          onClick={() => handleStatusChange(item, 'OBS')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            item.status === 'OBS'
                              ? 'bg-purple-600 text-white shadow ring-2 ring-purple-400'
                              : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-300'
                          }`}
                          title="Observation (ข้อสังเกต)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>OBS</span>
                        </button>

                        <button
                          onClick={() => handleStatusChange(item, 'OFI')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            item.status === 'OFI'
                              ? 'bg-cyan-600 text-white shadow ring-2 ring-cyan-400'
                              : 'bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-300'
                          }`}
                          title="Opportunity For Improvement"
                        >
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>OFI</span>
                        </button>
                      </div>
                    ) : (
                      /* Auditee Read-Only Status Indicator */
                      <div className="shrink-0 flex items-center gap-2 pt-2 lg:pt-0 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">
                          ผลการตรวจ:
                        </span>
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                            item.status === 'C'
                              ? 'bg-emerald-600 text-white'
                              : item.status === 'MA'
                              ? 'bg-rose-600 text-white'
                              : item.status === 'MI'
                              ? 'bg-amber-500 text-white'
                              : item.status === 'OBS'
                              ? 'bg-purple-600 text-white'
                              : item.status === 'OFI'
                              ? 'bg-cyan-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.status === 'C' && '✓ สอดคล้อง (Conforming)'}
                          {item.status === 'MA' && '✕ Major NC (ข้อบกพร่องรุนแรง)'}
                          {item.status === 'MI' && '⚠ Minor NC (ข้อบกพร่องเล็กน้อย)'}
                          {item.status === 'OBS' && '👁 Observation (ข้อสังเกต)'}
                          {item.status === 'OFI' && '💡 โอกาสในการปรับปรุง (OFI)'}
                          {item.status === 'PENDING' && 'รอตรวจ (Pending Audit)'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* AUDITEE SECTION: คำชี้แจง & แนบหลักฐานจาก AUDITEE (CORE FEATURE) */}
                  {/* ------------------------------------------------------------- */}
                  <div className={`mt-4 p-4 rounded-xl border transition-all ${
                    roleMode === 'AUDITEE'
                      ? 'bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-white border-emerald-300 shadow-xs'
                      : 'bg-emerald-50/40 border-emerald-200/90'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-xs">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-emerald-950">
                              คำชี้แจง & หลักฐานจาก Auditee (ผู้รับการตรวจ / หน้างาน):
                            </span>
                            {item.auditeeResponse?.submittedAt && (
                              <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-2 py-0.2 rounded font-medium">
                                ยื่นเมื่อ {item.auditeeResponse.submittedAt}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-emerald-800">
                            {item.auditeeResponse
                              ? `ผู้ส่ง: ${item.auditeeResponse.responderName || 'ตัวแทนหน่วยงาน'} (${item.auditeeResponse.responderDept || 'แผนกที่เกี่ยวข้อง'})`
                              : 'คลิกปุ่มสีเขียวเพื่อพิมพ์คำชี้แจง ถ่ายรูปหน้างานจริง หรือแนบเอกสาร'}
                          </span>
                        </div>
                      </div>

                      {/* Prominent Action Button for Auditee */}
                      <button
                        onClick={() => setAuditeeModalItem(item)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer self-start sm:self-auto ${
                          item.auditeeResponse
                            ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/50 animate-pulse'
                        }`}
                      >
                        <Camera className="w-4 h-4 text-amber-300" />
                        <span>
                          {item.auditeeResponse
                            ? 'แก้ไขคำชี้แจง / เพิ่มรูปภาพ'
                            : '📸 Auditee ตอบ & แนบรูปหลักฐาน'}
                        </span>
                      </button>
                    </div>

                    {/* Auditee Content Display */}
                    {item.auditeeResponse ? (
                      <div className="space-y-2.5 text-xs pt-1">
                        {item.auditeeResponse.explanation && (
                          <div className="p-3 bg-white rounded-xl border border-emerald-200/90 text-slate-800 leading-relaxed font-medium shadow-xs">
                            <span className="text-[11px] font-bold text-emerald-900 block mb-0.5">
                              ข้อเท็จจริง / คำชี้แจง:
                            </span>
                            <p className="whitespace-pre-line">{item.auditeeResponse.explanation}</p>
                          </div>
                        )}

                        {/* Attachments / Photos thumbnails */}
                        {item.auditeeResponse.attachments && item.auditeeResponse.attachments.length > 0 && (
                          <div>
                            <span className="text-[11px] font-bold text-emerald-900 block mb-1.5">
                              รูปถ่ายและเอกสารแนบ ({item.auditeeResponse.attachments.length} รายการ):
                            </span>
                            <div className="flex flex-wrap gap-2.5">
                              {item.auditeeResponse.attachments.map((att) => (
                                <div
                                  key={att.id}
                                  className="flex items-center gap-2 p-1.5 bg-white rounded-xl border border-emerald-200/80 shadow-xs hover:border-emerald-400 transition"
                                >
                                  {att.type === 'IMAGE' && att.dataUrl ? (
                                    <div
                                      onClick={() => setZoomedImage(att.dataUrl!)}
                                      className="flex items-center gap-2 cursor-pointer group"
                                      title="คลิกเพื่อดูรูปภาพขนาดใหญ่"
                                    >
                                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                                        <img
                                          src={att.dataUrl}
                                          alt={att.name}
                                          className="w-full h-full object-cover group-hover:scale-105 transition"
                                        />
                                      </div>
                                      <div className="text-[11px]">
                                        <span className="font-semibold text-slate-800 underline block max-w-[140px] truncate">
                                          {att.name}
                                        </span>
                                        <span className="text-[10px] text-emerald-700 font-medium">
                                          คลิกเพื่อดูรูปขยาย
                                        </span>
                                      </div>
                                    </div>
                                  ) : att.type === 'LINK' ? (
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-1.5 text-[11px] text-blue-700 hover:text-blue-900 hover:underline px-1.5"
                                    >
                                      <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                                      <span className="max-w-[140px] truncate font-semibold">
                                        {att.name}
                                      </span>
                                      <ExternalLink className="w-3 h-3 text-slate-400" />
                                    </a>
                                  ) : (
                                    <span className="text-[11px] text-slate-700 px-2 font-medium">
                                      📄 {att.name}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={() => setAuditeeModalItem(item)}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white/70 hover:bg-white rounded-xl border border-dashed border-emerald-300 text-xs text-emerald-900 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-medium text-slate-600">
                            ยังไม่มีการส่งคำชี้แจงหรือหลักฐานจาก Auditee ในข้อนี้
                          </span>
                        </div>
                        <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                          <span>คลิกที่นี่เพื่อตอบและแนบหลักฐาน</span>
                          <span>→</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Evidence Input & Action Triggers (Auditor Notes) */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span>
                          {roleMode === 'AUDITOR'
                            ? 'บันทึกสิ่งตรวจพบของ Lead Auditor (Finding & Objective Evidence):'
                            : 'บันทึกสรุปผลการตรวจจากผู้ตรวจ (Auditor Record):'}
                        </span>
                        <span className="text-[11px] font-normal text-slate-400">
                          {roleMode === 'AUDITOR' ? 'พิมพ์ข้อเท็จจริง หรือกดให้น้องออดิตจำลองการตรวจ' : 'อ้างอิงสำหรับการออดิต'}
                        </span>
                      </label>
                      <textarea
                        rows={2}
                        value={item.evidenceRecorded || ''}
                        onChange={(e) => handleEvidenceChange(item, e.target.value)}
                        placeholder="ระบุสิ่งที่พบหน้างาน เช่น ตรวจสอบเอกสารฉบับอนุมัติแล้ว, สุ่มตรวจ พขร. 5 นายมีผลเป่าแอลกอฮอล์เป็นศูนย์..."
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex flex-wrap gap-2">
                        {/* AI Auto-Audit Button (Uses both auditor text & auditee evidence) */}
                        <button
                          onClick={() => handleAiEvaluate(item)}
                          disabled={isEvaluating}
                          className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>
                            {isEvaluating
                              ? 'น้องออดิตกำลังประเมิน...'
                              : item.auditeeResponse
                              ? 'ให้น้องออดิตตรวจหลักฐานที่ Auditee ส่งมา'
                              : 'ให้น้องออดิตประเมินแทนฉัน'}
                          </span>
                        </button>

                        {/* Explain to Auditee Button */}
                        <button
                          onClick={() => onOpenExplainModal(item)}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition active:scale-95 cursor-pointer flex items-center gap-1.5 border border-slate-300"
                        >
                          <MessageCircleQuestion className="w-3.5 h-3.5 text-blue-600" />
                          <span>อธิบายแทนฉัน (เมื่อ Auditee สงสัย)</span>
                        </button>

                        {/* CAR/CAP Button */}
                        {(item.capRequired || item.capData || item.status === 'MA' || item.status === 'MI') && (
                          <button
                            onClick={() => onOpenCarModal(item)}
                            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-xl transition active:scale-95 cursor-pointer flex items-center gap-1.5 border border-rose-300"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                            <span>ดู/แก้ร่าง CAR & CAP</span>
                          </button>
                        )}
                      </div>

                      {/* Expand / Collapse Details */}
                      <button
                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                        className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 py-1 px-2 rounded hover:bg-slate-100 transition cursor-pointer"
                      >
                        <span>{isExpanded ? 'ซ่อนการวิเคราะห์' : 'ดูบทวิเคราะห์ Lead Auditor'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Pane (AI Findings & Legal Citations) */}
                {isExpanded && (
                  <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 space-y-3 text-xs">
                    {/* Auditor Finding Detail */}
                    {item.auditorFindingDetail ? (
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <FileCheck className="w-4 h-4 text-blue-600" />
                          <span>บทวิเคราะห์ข้อบกพร่องเชิงระบบ (Lead Auditor Analysis):</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{item.auditorFindingDetail}</p>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">
                        ยังไม่มีบทวิเคราะห์เพิ่มเติม คลิก "ให้น้องออดิตประเมินแทนฉัน" เพื่อรับบทวิเคราะห์อัตโนมัติ
                      </p>
                    )}

                    {/* ISO Clauses & Law References */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="font-bold text-blue-900 block mb-1">
                          ข้อกำหนด ISO ที่เกี่ยวข้อง:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.isoClauses && item.isoClauses.length > 0 ? (
                            item.isoClauses.map((c, i) => (
                              <span key={i} className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                                {c}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[11px]">ISO 9001:2015 / ISO 45001:2018</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-900 block mb-1">
                          กฎหมายความปลอดภัย/ขนส่งที่เกี่ยวข้อง:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.lawReferences && item.lawReferences.length > 0 ? (
                            item.lawReferences.map((l, i) => (
                              <span key={i} className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                                {l}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[11px]">กฎหมายความปลอดภัย อาชีวอนามัย และสิ่งแวดล้อมไทย</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Auditee Response Modal */}
      <AuditeeResponseModal
        item={auditeeModalItem}
        isOpen={!!auditeeModalItem}
        onClose={() => setAuditeeModalItem(null)}
        onSaveResponse={handleSaveAuditeeResponse}
      />

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={zoomedImage}
              alt="Zoomed Evidence"
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
            />
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-3 -right-3 p-2 bg-white text-slate-900 rounded-full shadow-lg font-bold"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
