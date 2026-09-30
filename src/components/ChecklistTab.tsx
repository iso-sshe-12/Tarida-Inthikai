import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { AuditItem, AuditFinding, CapData, AuditeeSubmission } from '../types/audit';
import { AUDIT_CATEGORIES } from '../data/auditChecklistData';
import { KRC_AUDIT_DEPARTMENTS, assignDepartmentToItem } from '../data/auditDepartments';
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
  Building2,
  Calendar,
  Users,
  Plus,
  Trash2,
  Table2,
  LayoutList,
  FileText,
  Lock,
  LogIn,
  Mail,
} from 'lucide-react';

interface ChecklistTabProps {
  items: AuditItem[];
  onUpdateItem: (updatedItem: AuditItem) => void;
  onOpenExplainModal: (item: AuditItem) => void;
  onOpenCarModal: (item: AuditItem) => void;
  statusFilter: string;
  onClearStatusFilter: () => void;
  onOpenUploadModal: () => void;
  onOpenUploadModalWithDept?: (deptId: string) => void;
  onClearDepartmentItems?: (deptId: string) => void;
  onClearAllItems?: () => void;
  checklistTitle?: string;
  onResetToDefault?: () => void;
  isCustomChecklist?: boolean;
  roleMode?: 'AUDITOR' | 'AUDITEE';
  onToggleRole?: (role: 'AUDITOR' | 'AUDITEE') => void;
  selectedDepartment?: string;
  onSelectDepartment?: (deptId: string) => void;
  onOpenTeamModal?: () => void;
  currentUser?: import('../types/audit').TeamMember;
  onOpenLoginModal?: () => void;
}

export const ChecklistTab: React.FC<ChecklistTabProps> = ({
  items,
  onUpdateItem,
  onOpenExplainModal,
  onOpenCarModal,
  statusFilter,
  onClearStatusFilter,
  onOpenUploadModal,
  onOpenUploadModalWithDept,
  onClearDepartmentItems,
  onClearAllItems,
  checklistTitle = 'Audit Checklist',
  onResetToDefault,
  isCustomChecklist = true,
  roleMode = 'AUDITOR',
  onToggleRole,
  selectedDepartment,
  onSelectDepartment,
  onOpenTeamModal,
  currentUser,
  onOpenLoginModal,
}) => {
  const [internalDept, setInternalDept] = useState<string>('ALL');
  const activeDept = selectedDepartment !== undefined ? selectedDepartment : internalDept;
  const setActiveDept = (deptId: string) => {
    if (onSelectDepartment) onSelectDepartment(deptId);
    setInternalDept(deptId);
  };

  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [highPriorityOnly, setHighPriorityOnly] = useState<boolean>(false);
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
  const [evaluatingItemId, setEvaluatingItemId] = useState<number | null>(null);

  // Auditee portal filter: 'ALL' | 'PENDING' | 'SUBMITTED' | 'NC_ACTION'
  const [auditeeFilter, setAuditeeFilter] = useState<'ALL' | 'PENDING' | 'SUBMITTED' | 'NC_ACTION'>('ALL');

  // Auditee Modal & Zoom State
  const [auditeeModalItem, setAuditeeModalItem] = useState<AuditItem | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Department counts
  const departmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    KRC_AUDIT_DEPARTMENTS.forEach((d) => {
      counts[d.id] = 0;
    });
    items.forEach((it) => {
      const dept = it.department || assignDepartmentToItem(it);
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return counts;
  }, [items]);

  const currentDeptInfo = useMemo(() => {
    if (activeDept === 'ALL') return null;
    return KRC_AUDIT_DEPARTMENTS.find((d) => d.id === activeDept) || null;
  }, [activeDept]);

  // Export current checklist to Excel (Matching the 4-column audit layout)
  const handleExportToExcel = () => {
    const itemsToExport = items.filter((it) => {
      if (activeDept === 'ALL') return true;
      const dept = it.department || assignDepartmentToItem(it);
      return dept === activeDept;
    });

    const exportRows = itemsToExport.map((it) => ({
      'No.': it.id,
      'ข้อกำหนด (Requirement)': it.requirement || it.isoClauses?.join('\n') || '',
      'คำถาม (Audit Questions)': it.question,
      'Mannual/Procedure/WI/SD/Form': it.referenceDocs,
      'ฝ่าย/แผนก (Department)': it.department || assignDepartmentToItem(it),
      'ระดับความสำคัญ': it.priority,
      'ผลการตรวจ (Status)': it.status,
      'คำชี้แจงจาก Auditee': it.auditeeResponse?.explanation || '',
      'ผู้ส่งหลักฐาน (Auditee)': it.auditeeResponse?.responderName || '',
      'บันทึกหลักฐานที่พบ (Auditor Finding)': it.evidenceRecorded || '',
      'บทวิเคราะห์ Lead Auditor': it.auditorFindingDetail || '',
      'ข้อกำหนด ISO': it.isoClauses?.join(', ') || '',
      'กฎหมายที่เกี่ยวข้อง': it.lawReferences?.join(', ') || '',
      'ต้องการใบ CAR': it.capRequired ? 'YES' : 'NO',
      'เลขที่ CAR': it.capData?.carNo || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AuditResults');
    const deptTag = activeDept !== 'ALL' ? `_${activeDept}` : '';
    XLSX.writeFile(
      workbook,
      `KRC_Audit_Checklist${deptTag}_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  // Filter items (No category division as requested)
  const filteredItems = items.filter((item) => {
    const itemDept = item.department || assignDepartmentToItem(item);
    if (activeDept !== 'ALL' && itemDept !== activeDept) {
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
      const matchDept = itemDept.toLowerCase().includes(q);
      return matchId || matchReq || matchQuestion || matchDoc || matchEvidence || matchAuditee || matchFinding || matchDept;
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

  // Helper to render Requirement column with line breaks
  const renderRequirementText = (requirement: string, isoClauses?: string[]) => {
    const text = requirement || (isoClauses && isoClauses.length > 0 ? isoClauses.join('\n') : '-');
    return (
      <div className="font-semibold text-slate-800 whitespace-pre-line text-xs leading-relaxed">
        {text}
      </div>
    );
  };

  // Helper to render Audit Questions column (Question + '► หลักฐานที่ขอดู: ...')
  const renderAuditQuestionContent = (question: string, requiredEvidence?: string) => {
    if (question.includes('หลักฐานที่ขอดู:') || question.includes('►')) {
      const markerRegex = /(?=►|\n►|หลักฐานที่ขอดู:)/i;
      const index = question.search(markerRegex);
      if (index !== -1) {
        const qPart = question.slice(0, index).trim();
        const evPart = question.slice(index).replace(/^[►\s]*หลักฐานที่ขอดู:\s*/i, '').trim();
        return (
          <div className="space-y-1.5 text-xs">
            <div className="text-slate-900 font-medium leading-relaxed whitespace-pre-line">
              {qPart}
            </div>
            {evPart && (
              <div className="text-[11px] text-slate-900 bg-slate-100/90 p-2 rounded-lg border border-slate-200 leading-relaxed font-normal">
                <strong className="text-slate-950 font-bold">► หลักฐานที่ขอดู:</strong>{' '}
                <span>{evPart}</span>
              </div>
            )}
          </div>
        );
      }
    }

    return (
      <div className="space-y-1.5 text-xs">
        <div className="text-slate-900 font-medium leading-relaxed whitespace-pre-line">
          {question}
        </div>
        {requiredEvidence && requiredEvidence !== 'บันทึกและหลักฐานการทำงาน' && (
          <div className="text-[11px] text-slate-900 bg-slate-100/90 p-2 rounded-lg border border-slate-200 leading-relaxed font-normal">
            <strong className="text-slate-950 font-bold">► หลักฐานที่ขอดู:</strong>{' '}
            <span>{requiredEvidence}</span>
          </div>
        )}
      </div>
    );
  };

  // Helper to render Reference Documents as bullets
  const renderReferenceDocsList = (docs: string) => {
    if (!docs || docs.trim() === '' || docs === '-') {
      return <span className="text-slate-400">-</span>;
    }

    const lines = docs
      .split(/[\n,;]/)
      .map((s) => s.trim())
      .filter(Boolean);

    return (
      <div className="space-y-1 font-mono text-[11px] leading-snug">
        {lines.map((line, idx) => (
          <div key={idx} className="text-slate-800 flex items-start gap-1">
            <span className="text-slate-600 font-bold">•</span>
            <span>{line.replace(/^[•\-\*]\s*/, '')}</span>
          </div>
        ))}
      </div>
    );
  };

  // Helper to render full evaluation panel
  const renderItemEvaluationPanel = (item: AuditItem, isEvaluating: boolean) => (
    <div className="space-y-4">
      {/* AUDITEE SECTION: คำชี้แจง & แนบหลักฐานจาก AUDITEE */}
      <div className={`p-4 rounded-xl border transition-all ${
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

          <button
            onClick={() => setAuditeeModalItem(item)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer self-start sm:self-auto ${
              item.auditeeResponse
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/50'
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

      {/* Auditor Findings & Evidence Input */}
      <div className="pt-2 space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
            <span>
              {roleMode === 'AUDITOR'
                ? 'บันทึกสิ่งตรวจพบของ Lead Auditor (Finding & Objective Evidence):'
                : 'บันทึกสรุปผลการตรวจจากผู้ตรวจ (Auditor Record):'}
            </span>
            <span className="text-[11px] font-normal text-slate-400">
              {roleMode === 'AUDITOR' ? 'พิมพ์ข้อเท็จจริง หรือกดให้น้องออดิตช่วยจำลองการตรวจ' : 'อ้างอิงสำหรับการออดิต'}
            </span>
          </label>
          <textarea
            rows={2}
            value={item.evidenceRecorded || ''}
            onChange={(e) => handleEvidenceChange(item, e.target.value)}
            placeholder="ระบุสิ่งที่พบหน้างาน เช่น ตรวจสอบเอกสารฉบับอนุมัติแล้ว, สุ่มตรวจ พขร. 5 นายมีผลเป่าแอลกอฮอล์เป็นศูนย์..."
            className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          />
        </div>

        {/* Action Triggers */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap gap-2">
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

            <button
              onClick={() => onOpenExplainModal(item)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition active:scale-95 cursor-pointer flex items-center gap-1.5 border border-slate-300"
            >
              <MessageCircleQuestion className="w-3.5 h-3.5 text-blue-600" />
              <span>อธิบายแทนฉัน (เมื่อ Auditee สงสัย)</span>
            </button>

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
        </div>
      </div>

      {/* Auditor Finding Detail Analysis */}
      {item.auditorFindingDetail && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1 text-xs">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-blue-600" />
            <span>บทวิเคราะห์ข้อบกพร่องเชิงระบบ (Lead Auditor Analysis):</span>
          </div>
          <p className="text-slate-700 leading-relaxed whitespace-pre-line">{item.auditorFindingDetail}</p>
        </div>
      )}

      {/* ISO Clauses & Law References */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
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
              <span className="text-slate-400 text-[11px]">{item.requirement || 'ISO 9001 / ISO 14001 / ISO 45001'}</span>
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
  );

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
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  roleMode === 'AUDITEE'
                    ? 'bg-emerald-400 text-slate-950 font-black'
                    : 'bg-blue-100 text-blue-900'
                }`}>
                  {roleMode === 'AUDITEE' ? 'โหมดผู้รับการตรวจ (Auditee Portal)' : 'โหมด Lead Auditor'}
                </span>
                {currentUser && (
                  <span className="text-xs font-bold text-amber-200 flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded-lg border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>ผู้ใช้งาน: {currentUser.name}</span>
                    <span className="text-[10px] text-slate-300 font-mono">({currentUser.department})</span>
                  </span>
                )}
                {onOpenLoginModal && (
                  <button
                    type="button"
                    onClick={onOpenLoginModal}
                    className="text-[11px] text-blue-200 hover:text-white underline font-semibold flex items-center gap-1 cursor-pointer"
                    title="เข้าสู่ระบบด้วยอีเมล หรือสลับสิทธิ์ผู้ใช้งาน"
                  >
                    <LogIn className="w-3 h-3" />
                    <span>สลับสิทธิ์ / Login</span>
                  </button>
                )}
              </div>
              <p className={`text-xs mt-1 ${
                roleMode === 'AUDITEE' ? 'text-emerald-100/90' : 'text-slate-300'
              }`}>
                {roleMode === 'AUDITEE'
                  ? '👉 สิทธิ์ Auditee ในฐานข้อมูล: ตรวจสอบข้อคำถาม ตอบคำชี้แจง และอัปโหลดภาพถ่ายหลักฐานหน้างาน (ระบบล็อคการประเมินคะแนน C/NC ไว้ให้เฉพาะผู้ตรวจ)'
                  : '👉 สิทธิ์ Auditor: ตรวจสอบหลักฐานหน้างานของ Auditee, ประเมินคะแนน C/NC, เรียกน้องออดิต AI ช่วยวิเคราะห์ และออกใบ CAR'}
              </p>
            </div>
          </div>

          {/* Switch Role Button */}
          {onToggleRole && (
            <div className="inline-flex rounded-xl p-1 bg-black/20 border border-white/10 shrink-0 self-start sm:self-auto">
              <button
                disabled={currentUser?.role === 'AUDITEE'}
                onClick={() => {
                  if (currentUser?.role !== 'AUDITEE') {
                    onToggleRole('AUDITOR');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  currentUser?.role === 'AUDITEE'
                    ? 'text-slate-500 cursor-not-allowed opacity-50'
                    : roleMode === 'AUDITOR'
                    ? 'bg-blue-600 text-white shadow-sm cursor-pointer'
                    : 'text-slate-300 hover:text-white cursor-pointer'
                }`}
                title={
                  currentUser?.role === 'AUDITEE'
                    ? 'ล็อคสิทธิ์ตามฐานข้อมูล: บัญชีของคุณเป็น Auditee ไม่สามารถสลับเป็นผู้ตรวจประเมินได้'
                    : 'สลับเป็นมุมมอง Auditor'
                }
              >
                {currentUser?.role === 'AUDITEE' ? (
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                <span>มุมมอง Auditor</span>
              </button>
              <button
                onClick={() => onToggleRole('AUDITEE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  roleMode === 'AUDITEE'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="สลับเป็นมุมมอง Auditee สำหรับส่งหลักฐาน"
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

      {/* 🏢 Department Selector Section (แบ่งตามฝ่าย/แผนกตามตารางออดิต) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900">
                  จำลองการ Audit: แบ่งตามฝ่าย / แผนก (15 ฝ่ายตามแผนตรวจ K.R.C.)
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                เลือกฝ่ายเพื่อตรวจสอบข้อคำถาม หรืออัปโหลดไฟล์ Checklist แยกตามแต่ละฝ่าย
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onOpenUploadModalWithDept) {
                  onOpenUploadModalWithDept(activeDept !== 'ALL' ? activeDept : 'ALL');
                } else {
                  onOpenUploadModal();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-blue-100" />
              <span>
                {activeDept !== 'ALL'
                  ? `+ อัปโหลด Checklist ฝ่าย ${activeDept}`
                  : '+ อัปโหลด Checklist (เลือกฝ่าย)'}
              </span>
            </button>
          </div>
        </div>

        {/* Departments Multi-Row Filter Buttons (แสดงครบทุกฝ่าย 2-3 แถว ไม่ต้องเลื่อนแถบ Scrollbar) */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setActiveDept('ALL')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs ${
              activeDept === 'ALL'
                ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-400'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <span>🌐 ทุกฝ่าย / รวมทั้งหมด</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                activeDept === 'ALL' ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {items.length}
            </span>
          </button>

          {KRC_AUDIT_DEPARTMENTS.map((dept) => {
            const count = departmentCounts[dept.id] || 0;
            const isSelected = activeDept === dept.id;
            return (
              <button
                key={dept.id}
                onClick={() => setActiveDept(dept.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-300'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                    isSelected ? 'bg-indigo-800 text-indigo-100' : dept.badgeColor
                  }`}
                >
                  {dept.teamShort}
                </span>
                <span>{dept.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                    count === 0
                      ? isSelected
                        ? 'bg-amber-400 text-slate-900'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                      : isSelected
                      ? 'bg-indigo-800 text-indigo-100'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {count > 0 ? `${count} ข้อ` : 'ยังไม่มีข้อ'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Department Focus Card */}
        {activeDept !== 'ALL' && currentDeptInfo && (
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-950 text-white rounded-xl p-4 sm:p-5 shadow-inner border border-indigo-500/30">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wide">
                    {currentDeptInfo.teamShort}
                  </span>
                  <span className="text-xs text-indigo-200 font-medium">
                    กำหนดการ: 📅 {currentDeptInfo.date} | ⏰ {currentDeptInfo.time}
                  </span>
                  <span className="text-xs text-slate-300 font-mono">
                    ({departmentCounts[currentDeptInfo.id] || 0} ข้อตรวจในระบบ)
                  </span>
                </div>

                <h4 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>ฝ่าย / แผนก: {currentDeptInfo.name}</span>
                </h4>

                <p className="text-xs text-indigo-100/90 flex items-center gap-1.5 flex-wrap">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-300 inline" />
                  <strong>คณะผู้ตรวจประเมิน:</strong> {currentDeptInfo.team}
                </p>
              </div>

              {/* Department Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    if (onOpenUploadModalWithDept) {
                      onOpenUploadModalWithDept(currentDeptInfo.id);
                    } else {
                      onOpenUploadModal();
                    }
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <UploadCloud className="w-4 h-4 text-blue-100" />
                  <span>+ อัปโหลด Checklist ฝ่ายนี้</span>
                </button>

                <button
                  onClick={handleExportToExcel}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                  title="ส่งออกข้อตรวจของฝ่ายนี้เป็น Excel"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ส่งออก Excel</span>
                </button>

                {onOpenTeamModal && (
                  <button
                    onClick={onOpenTeamModal}
                    className="px-3 py-2 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl border border-indigo-500/50 transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-xs"
                    title="จัดการหรือมอบหมายทีมตรวจฝ่ายนี้"
                  >
                    <Users className="w-3.5 h-3.5 text-indigo-200" />
                    <span>จัดการทีมตรวจ</span>
                  </button>
                )}

                {(departmentCounts[currentDeptInfo.id] || 0) > 0 && onClearDepartmentItems && (
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `คุณต้องการลบข้อตรวจทั้งหมดของฝ่าย "${currentDeptInfo.name}" (${departmentCounts[currentDeptInfo.id]} ข้อ) เพื่อเตรียมอัปโหลดชุดใหม่ใช่หรือไม่?`
                        )
                      ) {
                        onClearDepartmentItems(currentDeptInfo.id);
                      }
                    }}
                    className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-200 text-xs font-semibold rounded-xl border border-rose-800/60 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                    title="ลบเฉพาะข้อตรวจของฝ่ายนี้"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                    <span>ล้างข้อตรวจฝ่ายนี้</span>
                  </button>
                )}
              </div>
            </div>
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

            {/* Manage Team Button */}
            {onOpenTeamModal && (
              <button
                onClick={onOpenTeamModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl text-xs font-bold border border-indigo-200 shadow-xs transition active:scale-95 cursor-pointer"
                title="จัดการทีม Auditor & Auditee และมอบหมายความรับผิดชอบ"
              >
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>ทีม Auditor &amp; Auditee</span>
              </button>
            )}

            {/* Clear All Items Button */}
            {items.length > 0 && onClearAllItems && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      `คุณต้องการลบข้อตรวจทั้งหมดในระบบ (${items.length} ข้อ) ออกเพื่อเริ่มต้นใหม่ใช่หรือไม่?`
                    )
                  ) {
                    onClearAllItems();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-700 hover:text-rose-900 hover:bg-rose-50 rounded-xl border border-rose-200 transition cursor-pointer"
                title="ลบข้อตรวจทั้งหมดเพื่อเริ่มต้นใหม่"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>ลบข้อตรวจทั้งหมด</span>
              </button>
            )}
          </div>
        </div>

        {/* Controls Toolbar: View Mode Toggle & Summary (No Category grouping as requested) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* View Mode Toggle: Table (default) vs Cards */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">รูปแบบการแสดง:</span>
            <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 shadow-xs">
              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'TABLE'
                    ? 'bg-white text-blue-900 shadow-xs ring-1 ring-blue-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="ตาราง Checklist ตามแบบฟอร์ม"
              >
                <Table2 className="w-3.5 h-3.5 text-blue-600" />
                <span>ตาราง Audit (ตามแบบฟอร์ม)</span>
              </button>
              <button
                onClick={() => setViewMode('CARDS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'CARDS'
                    ? 'bg-white text-blue-900 shadow-xs ring-1 ring-blue-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="มุมมองการ์ดแบบละเอียด"
              >
                <LayoutList className="w-3.5 h-3.5 text-indigo-600" />
                <span>การ์ดละเอียด</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            แสดง <strong className="text-slate-900">{filteredItems.length}</strong> จากทั้งหมด {items.length} รายการ
            {activeDept !== 'ALL' && (
              <span className="ml-1.5 text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                ฝ่าย: {activeDept}
              </span>
            )}
          </div>
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
          currentDeptInfo ? (
            <div className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-indigo-200 space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto text-indigo-600">
                <Building2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  ยังไม่มีข้อตรวจ (Checklist) สำหรับฝ่าย "{currentDeptInfo.name}"
                </h3>
                <p className="text-xs text-slate-500 max-w-lg mx-auto">
                  คณะผู้ตรวจ: <strong>{currentDeptInfo.team}</strong> &bull; กำหนดการตรวจ: <strong>{currentDeptInfo.date} เวลา {currentDeptInfo.time}</strong>
                  <br />
                  คุณสามารถอัปโหลดไฟล์ Checklist (Excel / CSV) สำหรับฝ่ายนี้ได้โดยตรง
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    if (onOpenUploadModalWithDept) {
                      onOpenUploadModalWithDept(currentDeptInfo.id);
                    } else {
                      onOpenUploadModal();
                    }
                  }}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-blue-100" />
                  <span>+ อัปโหลด Checklist ฝ่าย {currentDeptInfo.name}</span>
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border-2 border-dashed border-slate-300 space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-lg mx-auto">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  ระบบลบข้อมูลตัวอย่างทั้งหมดออกเรียบร้อยแล้ว
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  ขณะนี้ไม่มีข้อตรวจตัวอย่างค้างอยู่ในระบบ คุณสามารถอัปโหลดไฟล์ Checklist (Excel หรือ CSV) ได้ทั้งแบบรวมทุกฝ่าย หรือเลือกนำเข้าแยกเฉพาะแต่ละฝ่าย/แผนก (เช่น IT, Transport, QC, Purchase) ได้ทันที
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={onOpenUploadModal}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-blue-100" />
                  <span>+ อัปโหลดไฟล์ Checklist (Excel / CSV)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">ไม่พบรายการตรวจสอบที่ตรงกับเงื่อนไข</h3>
              <p className="text-xs text-slate-500">
                ลองล้างคำค้นหา หรือเลือกหมวดหมู่อื่นเพื่อดูรายการตรวจสอบ
              </p>
            </div>
          )
        ) : viewMode === 'TABLE' ? (
          /* ========================================================================= */
          /* 📋 AUDIT TABLE VIEW (ตามแบบฟอร์ม Audit Checklist มาตรฐาน K.R.C. ไม่แบ่งหมวด) */
          /* ========================================================================= */
          <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-xs tracking-wider divide-x divide-slate-800">
                  <th className="py-3.5 px-3 w-14 text-center">No.</th>
                  <th className="py-3.5 px-3 w-44">ข้อกำหนด (Requirement)</th>
                  <th className="py-3.5 px-4 min-w-[280px]">คำถาม (Audit Questions) &amp; ข้อตรวจ</th>
                  <th className="py-3.5 px-3 w-44">Mannual/Procedure/WI/SD/Form</th>
                  <th className="py-3.5 px-3 w-28 text-center">ฝ่าย/แผนก</th>
                  <th className="py-3.5 px-3 min-w-[180px]">หลักฐานจาก Auditee</th>
                  <th className="py-3.5 px-3 min-w-[210px] text-center">
                    {roleMode === 'AUDITOR' ? 'ผลการตรวจ (Audit Finding)' : 'สถานะการตรวจ'}
                  </th>
                  <th className="py-3.5 px-3 w-32 text-center">การจัดการ &amp; AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredItems.map((item) => {
                  const isExpanded = expandedItemId === item.id;
                  const isEvaluating = evaluatingItemId === item.id;
                  const itemDeptName = item.department || assignDepartmentToItem(item);

                  // Extract requirement lines
                  const reqLines = item.requirement
                    ? item.requirement.split('\n').filter(Boolean)
                    : item.isoClauses || [];

                  // Extract doc lines
                  const docLines = item.referenceDocs
                    ? item.referenceDocs.split('\n').filter(Boolean)
                    : [];

                  // Extract question & evidence to check
                  let questionMain = item.question;
                  let evidencePrompt = item.requiredEvidence;
                  if (item.question.includes('หลักฐานที่ขอดู:')) {
                    const parts = item.question.split(/หลักฐานที่ขอดู:/i);
                    questionMain = parts[0].trim();
                    evidencePrompt = parts[1].trim();
                  }

                  const rowStatusClass =
                    item.status === 'MA'
                      ? 'bg-rose-50/40 hover:bg-rose-50/70 border-l-4 border-l-rose-500'
                      : item.status === 'MI'
                      ? 'bg-amber-50/40 hover:bg-amber-50/70 border-l-4 border-l-amber-500'
                      : item.status === 'C'
                      ? 'bg-emerald-50/30 hover:bg-emerald-50/60 border-l-4 border-l-emerald-500'
                      : item.status === 'OBS'
                      ? 'bg-purple-50/30 hover:bg-purple-50/60 border-l-4 border-l-purple-500'
                      : item.status === 'OFI'
                      ? 'bg-cyan-50/30 hover:bg-cyan-50/60 border-l-4 border-l-cyan-500'
                      : 'hover:bg-slate-50/80 border-l-4 border-l-transparent';

                  return (
                    <React.Fragment key={item.id}>
                      <tr className={`transition-colors divide-x divide-slate-100 ${rowStatusClass}`}>
                        {/* 1. No. */}
                        <td className="py-3.5 px-3 text-center align-top font-mono">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded-md shadow-xs">
                              #{item.id}
                            </span>
                            {item.priority === 'HIGH' && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 whitespace-nowrap">
                                ★ เสี่ยงสูง
                              </span>
                            )}
                            <button
                              onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                              className="mt-1 text-[10px] text-slate-500 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
                              title={isExpanded ? 'ย่อรายละเอียด' : 'ดูบทวิเคราะห์ Lead Auditor'}
                            >
                              <span>{isExpanded ? 'ย่อ' : 'ขยาย'}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>

                        {/* 2. ข้อกำหนด (Requirement) */}
                        <td className="py-3.5 px-3 align-top">
                          <div className="space-y-1">
                            {reqLines.length > 0 ? (
                              reqLines.map((line, idx) => (
                                <div
                                  key={idx}
                                  className="text-[11px] font-semibold text-blue-900 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-200/80 leading-snug"
                                >
                                  {line}
                                </div>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-500">ISO 9001/45001</span>
                            )}
                            {item.remarks && (
                              <span className="inline-block text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 mt-0.5">
                                {item.remarks}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. คำถาม (Audit Questions & Evidence) */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-900 leading-relaxed whitespace-pre-line">
                              {questionMain}
                            </p>
                            {evidencePrompt && (
                              <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/90 text-emerald-950 text-[11px] leading-relaxed">
                                <span className="font-bold flex items-center gap-1 text-emerald-900 mb-0.5">
                                  <FileCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                  <span>หลักฐานที่ต้องสุ่มตรวจ:</span>
                                </span>
                                <span className="text-slate-800">{evidencePrompt}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 4. Mannual/Procedure/WI/SD/Form */}
                        <td className="py-3.5 px-3 align-top font-mono">
                          <div className="space-y-1">
                            {docLines.length > 0 ? (
                              docLines.map((doc, idx) => (
                                <div
                                  key={idx}
                                  className="text-[11px] font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 leading-snug flex items-center gap-1"
                                >
                                  <span className="text-indigo-600 text-[10px]">•</span>
                                  <span>{doc.replace(/^[•\-\*]\s*/, '')}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </div>
                        </td>

                        {/* 5. ฝ่าย/แผนก (Department) */}
                        <td className="py-3.5 px-3 text-center align-top">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 whitespace-nowrap">
                            <Building2 className="w-3 h-3 text-indigo-600 shrink-0" />
                            <span>{itemDeptName}</span>
                          </span>
                        </td>

                        {/* 6. หลักฐานจาก Auditee */}
                        <td className="py-3.5 px-3 align-top">
                          <div className="space-y-1.5">
                            {item.auditeeResponse ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                    <span>ส่งหลักฐานแล้ว</span>
                                  </span>
                                  {item.auditeeResponse.attachments && item.auditeeResponse.attachments.length > 0 && (
                                    <span className="text-[10px] text-emerald-800 font-semibold">
                                      ({item.auditeeResponse.attachments.length} รูป/ไฟล์)
                                    </span>
                                  )}
                                </div>

                                {item.auditeeResponse.explanation && (
                                  <p className="text-[11px] text-slate-700 line-clamp-2 italic bg-slate-50 p-1.5 rounded border border-slate-200">
                                    "{item.auditeeResponse.explanation}"
                                  </p>
                                )}

                                {/* Thumbnails preview */}
                                {item.auditeeResponse.attachments && item.auditeeResponse.attachments.length > 0 && (
                                  <div className="flex flex-wrap gap-1 pt-0.5">
                                    {item.auditeeResponse.attachments.slice(0, 3).map((att) =>
                                      att.type === 'IMAGE' && att.dataUrl ? (
                                        <img
                                          key={att.id}
                                          src={att.dataUrl}
                                          alt={att.name}
                                          onClick={() => setZoomedImage(att.dataUrl!)}
                                          className="w-7 h-7 object-cover rounded border border-slate-300 hover:scale-110 transition cursor-pointer shadow-xs"
                                          title="คลิกเพื่อดูรูปขยาย"
                                        />
                                      ) : null
                                    )}
                                    {item.auditeeResponse.attachments.length > 3 && (
                                      <span className="text-[10px] text-slate-500 self-center">
                                        +{item.auditeeResponse.attachments.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}

                                <button
                                  onClick={() => setAuditeeModalItem(item)}
                                  className="text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold underline block pt-0.5 cursor-pointer"
                                >
                                  แก้ไขคำชี้แจง / เพิ่มรูป
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setAuditeeModalItem(item)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1 w-full justify-center"
                              >
                                <Camera className="w-3.5 h-3.5 text-amber-200" />
                                <span>Auditee ตอบ & แนบรูป</span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 7. ผลการตรวจ (Audit Finding / Status) */}
                        <td className="py-3.5 px-3 align-top text-center">
                          {roleMode === 'AUDITOR' ? (
                            <div className="space-y-1.5 inline-block text-left w-full">
                              {/* 1-Click Status Change Group */}
                              <div className="grid grid-cols-3 gap-1">
                                <button
                                  onClick={() => handleStatusChange(item, 'C')}
                                  className={`px-1.5 py-1 rounded text-[10px] font-bold transition cursor-pointer text-center ${
                                    item.status === 'C'
                                      ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400'
                                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                                  }`}
                                  title="C (Conforming - สอดคล้อง)"
                                >
                                  ✓ C
                                </button>
                                <button
                                  onClick={() => handleStatusChange(item, 'MA')}
                                  className={`px-1.5 py-1 rounded text-[10px] font-bold transition cursor-pointer text-center ${
                                    item.status === 'MA'
                                      ? 'bg-rose-600 text-white shadow-xs ring-1 ring-rose-400'
                                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-300'
                                  }`}
                                  title="Major NC (ไม่สอดคล้องขั้นรุนแรง)"
                                >
                                  ✕ MA
                                </button>
                                <button
                                  onClick={() => handleStatusChange(item, 'MI')}
                                  className={`px-1.5 py-1 rounded text-[10px] font-bold transition cursor-pointer text-center ${
                                    item.status === 'MI'
                                      ? 'bg-amber-600 text-white shadow-xs ring-1 ring-amber-400'
                                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300'
                                  }`}
                                  title="Minor NC (ไม่สอดคล้องขั้นเล็กน้อย)"
                                >
                                  ⚠ MI
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-1">
                                <button
                                  onClick={() => handleStatusChange(item, 'OBS')}
                                  className={`px-1.5 py-1 rounded text-[10px] font-bold transition cursor-pointer text-center ${
                                    item.status === 'OBS'
                                      ? 'bg-purple-600 text-white shadow-xs ring-1 ring-purple-400'
                                      : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-300'
                                  }`}
                                  title="OBS (Observation - ข้อสังเกต)"
                                >
                                  👁 OBS
                                </button>
                                <button
                                  onClick={() => handleStatusChange(item, 'OFI')}
                                  className={`px-1.5 py-1 rounded text-[10px] font-bold transition cursor-pointer text-center ${
                                    item.status === 'OFI'
                                      ? 'bg-cyan-600 text-white shadow-xs ring-1 ring-cyan-400'
                                      : 'bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-300'
                                  }`}
                                  title="OFI (Opportunity For Improvement)"
                                >
                                  💡 OFI
                                </button>
                              </div>

                              {/* Evidence recorded note */}
                              <input
                                type="text"
                                value={item.evidenceRecorded || ''}
                                onChange={(e) => handleEvidenceChange(item, e.target.value)}
                                placeholder="บันทึกสิ่งที่ตรวจพบ..."
                                className="w-full text-[10px] p-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span
                                className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold ${
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
                                {item.status === 'C' && '✓ สอดคล้อง'}
                                {item.status === 'MA' && '✕ Major NC'}
                                {item.status === 'MI' && '⚠ Minor NC'}
                                {item.status === 'OBS' && '👁 ข้อสังเกต'}
                                {item.status === 'OFI' && '💡 ปรับปรุง'}
                                {item.status === 'PENDING' && 'รอตรวจ'}
                              </span>
                              {item.evidenceRecorded && (
                                <p className="text-[10px] text-slate-600 italic">
                                  "{item.evidenceRecorded}"
                                </p>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 8. การจัดการ & AI (Actions) */}
                        <td className="py-3.5 px-3 align-top text-center">
                          <div className="flex flex-col gap-1.5 items-stretch">
                            <button
                              onClick={() => handleAiEvaluate(item)}
                              disabled={isEvaluating}
                              className="px-2 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[10px] font-bold rounded-lg shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                              title="ให้น้องออดิตช่วยวิเคราะห์และตัดสินผลตรวจ"
                            >
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              <span>{isEvaluating ? 'กำลังตรวจ...' : 'น้องออดิต AI'}</span>
                            </button>

                            <button
                              onClick={() => onOpenExplainModal(item)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded-lg border border-slate-300 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                              title="อธิบายข้อสงสัยแทนฉัน"
                            >
                              <MessageCircleQuestion className="w-3 h-3 text-blue-600" />
                              <span>อธิบายแทนฉัน</span>
                            </button>

                            {(item.capRequired || item.capData || item.status === 'MA' || item.status === 'MI') && (
                              <button
                                onClick={() => onOpenCarModal(item)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 text-[10px] font-bold rounded-lg border border-rose-300 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                                title="ดูหรือแก้ไขใบ CAR / CAP"
                              >
                                <ShieldAlert className="w-3 h-3 text-rose-600" />
                                <span>ดู/แก้ CAR</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Sub-Row (บทวิเคราะห์ Lead Auditor, ISO & Legal Clauses) */}
                      {isExpanded && (
                        <tr className="bg-slate-50/95 border-b-2 border-indigo-200">
                          <td colSpan={8} className="p-4 sm:p-5">
                            <div className="space-y-3.5 text-xs">
                              <div className="flex items-center justify-between">
                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                  <FileCheck className="w-4 h-4 text-blue-600" />
                                  <span>รายละเอียดเชิงลึกและบทวิเคราะห์ Lead Auditor (ข้อ #{item.id})</span>
                                </div>
                                <button
                                  onClick={() => setExpandedItemId(null)}
                                  className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer font-semibold"
                                >
                                  ย่อปิด ✕
                                </button>
                              </div>

                              {/* Finding Detail */}
                              {item.auditorFindingDetail ? (
                                <div className="bg-white p-3 rounded-xl border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-line shadow-xs">
                                  <strong className="text-blue-900 block mb-1">
                                    บทวิเคราะห์ข้อบกพร่องเชิงระบบ (Lead Auditor Analysis):
                                  </strong>
                                  {item.auditorFindingDetail}
                                </div>
                              ) : (
                                <p className="text-slate-400 italic">
                                  ยังไม่มีบทวิเคราะห์เพิ่มเติม คลิกปุ่ม "น้องออดิต AI" เพื่อให้น้องช่วยประเมินอัตโนมัติ
                                </p>
                              )}

                              {/* Full Evidence Recorded Textarea */}
                              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1 shadow-xs">
                                <label className="font-bold text-slate-800 text-xs block">
                                  บันทึกหลักฐานที่พบหน้างานจริง (Evidence Recorded by Auditor):
                                </label>
                                <textarea
                                  rows={2}
                                  value={item.evidenceRecorded || ''}
                                  onChange={(e) => handleEvidenceChange(item, e.target.value)}
                                  placeholder="ระบุสิ่งที่พบหน้างาน เช่น ตรวจสอบเอกสารฉบับอนุมัติแล้ว, สุ่มตรวจ พขร. 5 นายมีผลเป่าแอลกอฮอล์เป็นศูนย์..."
                                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                />
                              </div>

                              {/* ISO Clauses & Legal Standards */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="bg-white p-3 rounded-xl border border-slate-200">
                                  <span className="font-bold text-blue-900 block mb-1">
                                    ข้อกำหนด ISO ที่เกี่ยวข้อง:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {item.isoClauses && item.isoClauses.length > 0 ? (
                                      item.isoClauses.map((c, i) => (
                                        <span
                                          key={i}
                                          className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 text-[11px]"
                                        >
                                          {c}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-slate-400 text-[11px]">
                                        {item.requirement || 'ISO 9001 / ISO 14001 / ISO 45001'}
                                      </span>
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
                                        <span
                                          key={i}
                                          className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 text-[11px]"
                                        >
                                          {l}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-slate-400 text-[11px]">
                                        กฎหมายความปลอดภัย อาชีวอนามัย และสิ่งแวดล้อมไทย
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ========================================================================= */
          /* 📇 AUDIT CARDS VIEW (มุมมองการ์ดแบบละเอียด)                               */
          /* ========================================================================= */
          filteredItems.map((item) => {
            const isExpanded = expandedItemId === item.id;
            const isEvaluating = evaluatingItemId === item.id;
            const itemDeptName = item.department || assignDepartmentToItem(item);

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
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-900 border border-indigo-200 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-indigo-600 inline" />
                          <span>{itemDeptName}</span>
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
