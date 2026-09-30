import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  FileCode,
  Download,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Plus,
  Eye,
  Trash2,
  Building2,
} from 'lucide-react';
import { AuditItem } from '../types/audit';
import { KRC_AUDIT_DEPARTMENTS, assignDepartmentToItem } from '../data/auditDepartments';

interface UploadChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportChecklist: (
    newItems: AuditItem[],
    mode: 'REPLACE' | 'APPEND' | 'REPLACE_DEPT',
    title: string,
    targetDept?: string
  ) => void;
  onResetToDefault: () => void;
  currentItemsCount: number;
  currentChecklistTitle: string;
  initialDepartment?: string;
}

export const UploadChecklistModal: React.FC<UploadChecklistModalProps> = ({
  isOpen,
  onClose,
  onImportChecklist,
  onResetToDefault,
  currentItemsCount,
  currentChecklistTitle,
  initialDepartment = 'ALL',
}) => {
  const [activeTab, setActiveTab] = useState<'EXCEL' | 'AI_DOC' | 'JSON'>('EXCEL');
  const [targetDept, setTargetDept] = useState<string>(initialDepartment || 'ALL');
  const [importMode, setImportMode] = useState<'REPLACE' | 'APPEND' | 'REPLACE_DEPT'>(
    initialDepartment && initialDepartment !== 'ALL' ? 'REPLACE_DEPT' : 'REPLACE'
  );
  const [checklistName, setChecklistName] = useState<string>(
    initialDepartment && initialDepartment !== 'ALL'
      ? `Checklist ฝ่าย ${initialDepartment}`
      : 'Checklist ที่อัปโหลดใหม่'
  );

  useEffect(() => {
    if (initialDepartment) {
      setTargetDept(initialDepartment);
      if (initialDepartment !== 'ALL') {
        setImportMode('REPLACE_DEPT');
        setChecklistName(`Checklist ฝ่าย ${initialDepartment}`);
      }
    }
  }, [initialDepartment]);

  // Parsed items preview state
  const [previewItems, setPreviewItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // AI Doc input state
  const [rawText, setRawText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Template Download (Excel & CSV)
  const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
    const activeDeptName = targetDept !== 'ALL' ? targetDept : 'HR & GA';
    const templateRows = [
      {
        'No.': 1,
        'ข้อกำหนด (Requirement)': 'ISO 9001/45001 cl. 5.3\nISO 9001 cl. 6.3, 7.5.2, 7.5.3\nISO 45001 cl. 8.1.3',
        'คำถาม (Audit Questions)': 'สุ่มแผนผังองค์กรของฝ่าย QSHE ผังองค์กร JD อำนาจอนุมัติ และเอกสารควบคุมฉบับล่าสุด\n► หลักฐานที่ขอดู: Org chart QSHE; JD',
        'Mannual/Procedure/WI/SD/Form': '• P-HR-004\n• WI-HR-003\n• WI-HR-004\n• Org chart QSHE',
        'ฝ่าย/แผนก (Department)': activeDeptName,
      },
      {
        'No.': 2,
        'ข้อกำหนด (Requirement)': 'ISO 9001/45001 cl. 7.2, 7.3\nISO 9001 cl. 7.1.2, 8.1',
        'คำถาม (Audit Questions)': 'ตรวจคุณสมบัติ รปภ. ตาม พ.ร.บ.รปภ. 2558 แฟ้มประวัติ ตารางเวรเทียบอัตรากำลังจริง การจัดคนแทน และบันทึกการฝึกอบรม\n► หลักฐานที่ขอดู: แฟ้มประวัติ รปภ.; ใบอนุญาต รปภ.; ผลตรวจสารเสพติด/อาชญากรรม; ตารางเวร/ใบสแกนนิ้ว; ทะเบียนอบรม',
        'Mannual/Procedure/WI/SD/Form': '• P-HR-004\n• WI-HR-003\n• WI-HR-004',
        'ฝ่าย/แผนก (Department)': activeDeptName,
      },
      {
        'No.': 3,
        'ข้อกำหนด (Requirement)': 'ISO 9001 cl. 7.1.3, 8.1, 9.1.1\nISO 45001 cl. 8.2',
        'คำถาม (Audit Questions)': 'ตรวจการเริ่มกะ การมอบหมายจุด รายงานเหตุการณ์ประจำวัน ผลการสแกน QR ตรวจการณ์ 20 จุด และอุปกรณ์ประจำจุด\n► หลักฐานที่ขอดู: บันทึกประชุมแถว; Daily report; รายงานระบบสแกน QR; ทะเบียนและบันทึกตรวจเช็กวิทยุสื่อสาร/ถังดับเพลิง',
        'Mannual/Procedure/WI/SD/Form': '• P-HR-004\n• WI-HR-003',
        'ฝ่าย/แผนก (Department)': activeDeptName,
      },
      {
        'No.': 4,
        'ข้อกำหนด (Requirement)': 'ISO 9001 cl. 7.1.3, 7.5.3, 8.1\nISO 14001/45001 cl. 8.1',
        'คำถาม (Audit Questions)': 'สังเกตการณ์ป้อม P1 การตรวจสิ่งของต้องห้าม ใบขอเข้า-ออก (F-HR-027) บัตร Visitor เอกสารนำของออก (F-HR-028) และการคุมรถส่งของ/เคมี\n► หลักฐานที่ขอดู: สังเกตหน้างานป้อม P1; บันทึกตรวจค้น; F-HR-027; ทะเบียนบัตร Visitor; F-HR-028; บันทึกเวลาเข้า-ออกรถ',
        'Mannual/Procedure/WI/SD/Form': '• P-HR-004\n• WI-HR-003\n• WI-HR-004',
        'ฝ่าย/แผนก (Department)': activeDeptName,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AuditChecklist');

    const fileName = targetDept !== 'ALL'
      ? `KRC_Audit_Checklist_Template_${targetDept}.xlsx`
      : 'KRC_Audit_Checklist_Template.xlsx';

    if (format === 'xlsx') {
      XLSX.writeFile(workbook, fileName);
    } else {
      XLSX.writeFile(workbook, fileName.replace('.xlsx', '.csv'));
    }
  };

  // 2. Parse Excel/CSV File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessInfo(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonRows || jsonRows.length === 0) {
          throw new Error('ไม่พบข้อมูลในไฟล์ที่เลือก กรุณาตรวจสอบว่ามีข้อมูลในชีตแรก');
        }

        const items: AuditItem[] = jsonRows.map((row, index) => {
          // Flexible column mapping matching user format
          const id =
            parseInt(
              row['No.'] ||
                row['No'] ||
                row['ลำดับ (No)'] ||
                row['ลำดับ'] ||
                row['ID'] ||
                row['ข้อที่'] ||
                String(index + 1),
              10
            ) || index + 1;

          const categoryCode = String(
            row['รหัสหมวด (Category Code)'] ||
              row['รหัสหมวด'] ||
              row['Category Code'] ||
              row['Code'] ||
              'A'
          ).trim();

          const categoryTitle = String(
            row['ชื่อหมวดหมู่ (Category Title)'] ||
              row['หมวด'] ||
              row['หมวดหมู่'] ||
              row['Category'] ||
              'ทั่วไป'
          ).trim();

          const requirement = String(
            row['ข้อกำหนด (Requirement)'] ||
              row['Requirement'] ||
              row['ข้อกำหนด'] ||
              row['หัวข้อ'] ||
              ''
          ).trim();

          const question = String(
            row['คำถาม (Audit Questions)'] ||
              row['Audit Questions'] ||
              row['คำถาม'] ||
              row['ข้อคำถามในการตรวจ (Question)'] ||
              row['ข้อคำถาม'] ||
              row['คำถามตรวจ'] ||
              row['Question'] ||
              row['รายการตรวจ'] ||
              row['รายละเอียด'] ||
              requirement
          ).trim();

          const referenceDocs = String(
            row['Mannual/Procedure/WI/SD/Form'] ||
              row['Manual/Procedure/WI/SD/Form'] ||
              row['Manual/Procedure/WI'] ||
              row['WI/SD/Form'] ||
              row['Procedure/WI/Form'] ||
              row['เอกสารอ้างอิง (Reference Docs)'] ||
              row['เอกสารอ้างอิง'] ||
              row['Reference'] ||
              row['Ref'] ||
              ''
          ).trim();

          // Extract required evidence if question contains '► หลักฐานที่ขอดู:'
          let extractedEvidence = '';
          if (question.includes('หลักฐานที่ขอดู:')) {
            const parts = question.split(/หลักฐานที่ขอดู:/i);
            if (parts[1]) {
              extractedEvidence = parts[1].trim();
            }
          }

          const requiredEvidence = String(
            row['หลักฐานที่ต้องตรวจสอบ (Required Evidence)'] ||
              row['หลักฐานที่ต้องดู'] ||
              row['หลักฐาน'] ||
              row['Evidence'] ||
              extractedEvidence ||
              'บันทึกและหลักฐานการทำงาน'
          ).trim();

          const rawPriority = String(
            row['ระดับความเสี่ยง (Priority)'] ||
              row['Priority'] ||
              row['ความสำคัญ'] ||
              'NORMAL'
          ).toUpperCase();
          const priority: 'HIGH' | 'NORMAL' =
            rawPriority.includes('HIGH') || rawPriority.includes('สูง') || rawPriority.includes('วิกฤต')
              ? 'HIGH'
              : 'NORMAL';

          const rawIso = String(
            row['ข้อกำหนด ISO (ISO Clauses)'] ||
              row['ISO Clauses'] ||
              row['ISO'] ||
              row['ข้อกำหนด ISO'] ||
              requirement ||
              ''
          );
          const isoClauses = rawIso
            ? rawIso.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean)
            : ['ISO 9001:2015', 'ISO 14001:2015', 'ISO 45001:2018'];

          const rawLaws = String(
            row['กฎหมายที่เกี่ยวข้อง (Laws)'] ||
              row['กฎหมาย'] ||
              row['Laws'] ||
              ''
          );
          const lawReferences = rawLaws
            ? rawLaws.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean)
            : ['กฎหมายความปลอดภัย อาชีวอนามัย และสิ่งแวดล้อม'];

          const rowDept = String(
            row['ฝ่าย/แผนก (Department)'] ||
              row['ฝ่าย/แผนก'] ||
              row['แผนก'] ||
              row['Department'] ||
              row['Section'] ||
              ''
          ).trim();
          const department = rowDept || (targetDept !== 'ALL' ? targetDept : undefined);

          return {
            id,
            categoryCode,
            categoryTitle,
            requirement: requirement || question,
            question,
            referenceDocs,
            requiredEvidence,
            priority,
            status: 'PENDING',
            isoClauses,
            lawReferences,
            department: department || assignDepartmentToItem({ question, requirement, referenceDocs, categoryTitle }),
          };
        });

        setPreviewItems(items);
        setSuccessInfo(`อ่านข้อมูลสำเร็จ: พบทั้งหมด ${items.length} ข้อคำถาม`);
        setChecklistName(file.name.replace(/\.[^/.]+$/, ''));
      } catch (err: any) {
        console.error('File parse error:', err);
        setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการอ่านไฟล์ Excel/CSV');
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage('ไม่สามารถอ่านไฟล์ได้');
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // 3. AI Smart Parser (PDF / Image / Raw text)
  const handleAiExtract = async () => {
    if (!rawText.trim() && !selectedFile) {
      setErrorMessage('กรุณาพิมพ์ข้อความ หรือเลือกไฟล์ PDF / รูปภาพ เพื่อให้น้องออดิตสกัดข้อมูล');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessInfo(null);

    try {
      let fileBase64: string | undefined;
      let mimeType: string | undefined;

      if (selectedFile) {
        const buffer = await selectedFile.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        fileBase64 = btoa(binary);
        mimeType = selectedFile.type || 'application/pdf';
      }

      const res = await fetch('/api/audit/parse-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: rawText.trim() || undefined,
          fileBase64,
          mimeType,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'เกิดข้อผิดพลาดในการสกัด Checklist');
      }

      const data = await res.json();
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        const structuredItems: AuditItem[] = data.items.map((it: any, idx: number) => ({
          id: it.id || idx + 1,
          categoryCode: it.categoryCode || 'A',
          categoryTitle: it.categoryTitle || 'หมวดตรวจสอบทั่วไป',
          requirement: it.requirement || it.question || 'ข้อกำหนดตรวจสอบ',
          question: it.question || it.requirement,
          referenceDocs: it.referenceDocs || 'P-PU-001',
          requiredEvidence: it.requiredEvidence || 'หลักฐานบันทึกการทำงาน',
          priority: it.priority === 'HIGH' ? 'HIGH' : 'NORMAL',
          status: 'PENDING',
          isoClauses: it.isoClauses || ['ISO 9001:2015', 'ISO 45001:2018'],
          lawReferences: it.lawReferences || [],
        }));

        setPreviewItems(structuredItems);
        setSuccessInfo(
          `น้องออดิต สกัดข้อคำถามสำเร็จ: ได้รับ ${structuredItems.length} ข้อ พร้อมจับคู่ข้อกำหนด ISO และกฎหมายไทยให้อัตโนมัติ!`
        );
        if (data.checklistTitle) {
          setChecklistName(data.checklistTitle);
        }
      } else {
        throw new Error('ไม่พบรายการตรวจสอบในข้อมูลที่ส่งมา กรุณาตรวจสอบเอกสารหรือข้อความ');
      }
    } catch (err: any) {
      console.error('AI extract error:', err);
      setErrorMessage(err.message || 'ไม่สามารถสกัดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  // 4. JSON Import
  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const items = Array.isArray(parsed) ? parsed : parsed.items || [];
        if (!Array.isArray(items) || items.length === 0) {
          throw new Error('โครงสร้าง JSON ไม่ถูกต้อง ต้องเป็น Array หรือมีคีย์ items');
        }

        const validItems: AuditItem[] = items.map((it, idx) => ({
          ...it,
          id: it.id || idx + 1,
          status: it.status || 'PENDING',
          priority: it.priority || 'NORMAL',
        }));

        setPreviewItems(validItems);
        setSuccessInfo(`นำเข้า JSON สำเร็จ: ${validItems.length} ข้อ`);
        setChecklistName(file.name.replace(/\.[^/.]+$/, ''));
      } catch (err: any) {
        setErrorMessage(err.message || 'ไฟล์ JSON รูปแบบไม่ถูกต้อง');
      }
    };
    reader.readAsText(file);
  };

  // 5. Apply to Application
  const handleApplyChecklist = () => {
    if (previewItems.length === 0) {
      setErrorMessage('ยังไม่มีรายการข้อคำถาม กรุณาอัปโหลดไฟล์หรือสกัดข้อมูลก่อน');
      return;
    }

    const finalItems = previewItems.map((it) => ({
      ...it,
      department: it.department || (targetDept !== 'ALL' ? targetDept : assignDepartmentToItem(it)),
    }));

    onImportChecklist(
      finalItems,
      importMode,
      checklistName,
      targetDept !== 'ALL' ? targetDept : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wide">
                Custom Checklist Uploader
              </span>
              <span className="text-xs text-blue-200">
                ปัจจุบันมี {currentItemsCount} ข้อ ({currentChecklistTitle})
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold">
              อัปโหลดแบบฟอร์ม Audit Checklist เข้าสู่ระบบ
            </h2>
            <p className="text-xs text-slate-300">
              นำเข้าไฟล์ Excel (.xlsx/.csv), เอกสาร PDF/รูปภาพ (ผ่าน AI น้องออดิต), หรือ JSON เพื่อใช้ทำการตรวจ Audit
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Department Selector Banner */}
        <div className="bg-indigo-50/80 border-b border-indigo-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-950 block">
                เลือกฝ่าย / แผนกเป้าหมายสำหรับ Checklist ชุดนี้:
              </span>
              <p className="text-[11px] text-indigo-700">
                {targetDept === 'ALL'
                  ? 'นำเข้าแบบ Global (จัดหมวดหมู่อัตโนมัติ หรืออิงตามคอลัมน์ในไฟล์)'
                  : `นำเข้าเฉพาะสำหรับฝ่าย "${targetDept}"`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={targetDept}
              onChange={(e) => {
                const val = e.target.value;
                setTargetDept(val);
                if (val !== 'ALL') {
                  setImportMode('REPLACE_DEPT');
                  setChecklistName(`Checklist ฝ่าย ${val}`);
                } else {
                  setImportMode('REPLACE');
                  setChecklistName('Checklist ที่อัปโหลดใหม่');
                }
              }}
              className="px-3 py-1.5 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs cursor-pointer"
            >
              <option value="ALL">🌐 ทุกฝ่าย / รวมทั้งหมด (Global Checklist)</option>
              {KRC_AUDIT_DEPARTMENTS.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  🏢 {dept.name} ({dept.teamShort} • {dept.date})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('EXCEL');
              setErrorMessage(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'EXCEL'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>1. ไฟล์ Excel (.xlsx) / CSV</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('AI_DOC');
              setErrorMessage(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'AI_DOC'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>2. ให้น้องออดิตสกัดจาก PDF / รูปภาพ / ข้อความ</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('JSON');
              setErrorMessage(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'JSON'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-4 h-4 text-indigo-600" />
            <span>3. ไฟล์ JSON / Backup</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: EXCEL / CSV */}
          {activeTab === 'EXCEL' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-700" />
                    <span>ดาวน์โหลดเทมเพลตฟอร์มเปล่าเพื่อนำไปกรอกข้อมูล:</span>
                  </h4>
                  <p className="text-[11px] text-emerald-700">
                    หัวคอลัมน์มาตรฐาน: No., ข้อกำหนด (Requirement), คำถาม (Audit Questions), Mannual/Procedure/WI/SD/Form, ฝ่าย/แผนก (Department)
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadTemplate('xlsx')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>เทมเพลต Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => handleDownloadTemplate('csv')}
                    className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 rounded-2xl p-8 text-center cursor-pointer transition space-y-3 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center transition">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    คลิกเพื่อเลือกไฟล์ Excel (.xlsx / .xls) หรือ .csv
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    ระบบจะอ่านและจับคู่หัวตารางภาษาไทยและภาษาอังกฤษให้อัตโนมัติ
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI SMART EXTRACTOR */}
          {activeTab === 'AI_DOC' && (
            <div className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">น้องออดิต AI สกัดหัวข้อตรวจอัตโนมัติ:</span>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    หากคุณมีเอกสารแบบฟอร์มเดิม, รายการจากคู่มือ QSHE, รูปถ่ายตาราง หรือไฟล์ PDF ไม่จำเป็นต้องนั่งพิมพ์ใหม่!
                    น้องออดิตจะอ่านและสกัดข้อคำถาม จัดหมวดหมู่ พร้อมเติมข้อกำหนด ISO และกฎหมายไทยที่เกี่ยวข้องให้ทันที
                  </p>
                </div>
              </div>

              {/* Document upload or paste text */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    แนบไฟล์ PDF หรือ รูปภาพ Checklist (อุปกรณ์/เอกสาร):
                  </label>
                  <input
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                      ✓ เลือกไฟล์: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    หรือ วางข้อความคำถาม Checklist / เนื้อหาเอกสารที่นี่:
                  </label>
                  <textarea
                    rows={5}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="วางข้อความ Checklist ที่คัดลอกมา เช่น:
1. การตรวจสุขภาพพนักงานขับรถ ต้องมีผลตรวจสารเสพติดและเป่าแอลกอฮอล์
2. สารเคมีทุกชนิดในลานตู้ต้องมี SDS ภาษาไทยและห้ามใช้ขวดน้ำดื่มบรรจุ
3. งานบนที่สูงเกิน 2 เมตรต้องมี Work Permit และสวมใส่ Full Body Harness..."
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handleAiExtract}
                  disabled={loading || (!rawText.trim() && !selectedFile)}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {loading ? 'น้องออดิต กำลังอ่านและจัดโครงสร้าง Checklist...' : 'ให้น้องออดิต สกัดและแปลงเป็น Audit Checklist'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: JSON */}
          {activeTab === 'JSON' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center space-y-3">
                <FileCode className="w-10 h-10 text-indigo-500 mx-auto" />
                <p className="text-xs font-bold text-slate-800">
                  นำเข้าไฟล์ Checklist ในรูปแบบ JSON
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleJsonUpload}
                  className="block mx-auto text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Status Messages */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successInfo && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successInfo}</span>
            </div>
          )}

          {/* Preview Section if items parsed */}
          {previewItems.length > 0 && (
            <div className="space-y-3 border-t border-slate-200 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">
                    ตัวอย่างรายการที่จะนำเข้า ({previewItems.length} ข้อ):
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-600 font-medium">ชื่อชุด Checklist:</label>
                  <input
                    type="text"
                    value={checklistName}
                    onChange={(e) => setChecklistName(e.target.value)}
                    className="text-xs px-2.5 py-1 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                    placeholder="เช่น Checklist งานขนส่ง 2026"
                  />
                </div>
              </div>

              {/* Scrollable table preview */}
              <div className="max-h-56 overflow-y-auto border border-slate-300 rounded-xl bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-200 text-slate-800 uppercase font-bold sticky top-0 border-b border-slate-300">
                    <tr>
                      <th className="py-2.5 px-3 w-14 text-center border-r border-slate-300">No.</th>
                      <th className="py-2.5 px-3 w-48 border-r border-slate-300">ข้อกำหนด (Requirement)</th>
                      <th className="py-2.5 px-3 border-r border-slate-300">คำถาม (Audit Questions)</th>
                      <th className="py-2.5 px-3 w-52 border-r border-slate-300">Mannual/Procedure/WI/SD/Form</th>
                      <th className="py-2.5 px-3 w-28 text-center">ฝ่าย/แผนก</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {previewItems.slice(0, 15).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-800 text-center border-r border-slate-200 align-top">
                          {item.id}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 border-r border-slate-200 align-top whitespace-pre-line">
                          {item.requirement || item.isoClauses?.join('\n') || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-900 border-r border-slate-200 align-top whitespace-pre-line">
                          {item.question}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 border-r border-slate-200 align-top whitespace-pre-line font-mono text-[11px]">
                          {item.referenceDocs || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center align-top">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                            {item.department || targetDept || 'ALL'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewItems.length > 15 && (
                <p className="text-[11px] text-slate-400 text-right">
                  ... และอีก {previewItems.length - 15} ข้อ
                </p>
              )}

              {/* Mode Options */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1.5 flex-1">
                  <span className="font-bold text-slate-800 block">รูปแบบการนำเข้า:</span>
                  <div className="flex flex-wrap gap-3 sm:gap-4">
                    {targetDept !== 'ALL' && (
                      <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-indigo-200">
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'REPLACE_DEPT'}
                          onChange={() => setImportMode('REPLACE_DEPT')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-indigo-950 font-bold">
                          แทนที่เฉพาะฝ่าย "{targetDept}" ({previewItems.length} ข้อ)
                        </span>
                      </label>
                    )}

                    <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'APPEND'}
                        onChange={() => setImportMode('APPEND')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-700 font-semibold">
                        {targetDept !== 'ALL'
                          ? `เพิ่มต่อท้ายในฝ่าย "${targetDept}" (+${previewItems.length} ข้อ)`
                          : `เพิ่มต่อท้ายของเดิม (+${previewItems.length} ข้อ)`}
                      </span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'REPLACE'}
                        onChange={() => setImportMode('REPLACE')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-700">
                        แทนที่ Checklist ทั้งระบบ ({previewItems.length} ข้อใหม่)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => {
              if (
                window.confirm(
                  'คุณต้องการรีเซ็ตกลับไปใช้ Checklist มาตรฐาน F-SE-006 (87 ข้อเดิมของ K.R.C.) ใช่หรือไม่?'
                )
              ) {
                onResetToDefault();
                onClose();
              }
            }}
            className="text-xs font-semibold text-rose-700 hover:text-rose-900 hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>รีเซ็ตกลับเป็น F-SE-006 มาตรฐาน (87 ข้อ)</span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              onClick={handleApplyChecklist}
              disabled={previewItems.length === 0}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>นำเข้า Checklist นี้เข้าสู่ระบบ ({previewItems.length} ข้อ)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
