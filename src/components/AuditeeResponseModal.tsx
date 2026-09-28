import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Link as LinkIcon,
  Trash2,
  CheckCircle2,
  Sparkles,
  User,
  Building,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { AuditItem, AuditeeAttachment, AuditeeSubmission } from '../types/audit';

interface AuditeeResponseModalProps {
  item: AuditItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveResponse: (
    itemId: number,
    submission: AuditeeSubmission,
    triggerAutoEvaluate?: boolean
  ) => void;
}

export const AuditeeResponseModal: React.FC<AuditeeResponseModalProps> = ({
  item,
  isOpen,
  onClose,
  onSaveResponse,
}) => {
  if (!isOpen || !item) return null;

  const existing = item.auditeeResponse;

  const [responderName, setResponderName] = useState<string>(
    existing?.responderName || ''
  );
  const [responderDept, setResponderDept] = useState<string>(
    existing?.responderDept || ''
  );
  const [explanation, setExplanation] = useState<string>(
    existing?.explanation || ''
  );
  const [attachments, setAttachments] = useState<AuditeeAttachment[]>(
    existing?.attachments || []
  );

  // Link input state
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');

  // Image preview zoom modal
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Preset Responders
  const PRESET_RESPONDERS = [
    { name: 'วิชัย ชัยชนะ', dept: 'Supervisor แผนกซ่อมบำรุงและลานตู้' },
    { name: 'สมบัติ มั่นคง', dept: 'เจ้าหน้าที่ความปลอดภัย (จป.วิชาชีพ K.R.C.)' },
    { name: 'อนุชา ขับขี่ปลอดภัย', dept: 'หัวหน้างานแผนกขนส่ง & พขร.' },
    { name: 'ตัวแทนผู้รับเหมา', dept: 'บริษัทผู้รับเหมาช่วง (Contractor)' },
  ];

  // Handle Photo/File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImg = file.type.startsWith('image/');
      const reader = new FileReader();

      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newAttachment: AuditeeAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          dataUrl,
          type: isImg ? 'IMAGE' : 'DOCUMENT',
          uploadedAt: new Date().toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };

        setAttachments((prev) => [...prev, newAttachment]);
      };

      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add Link
  const handleAddLink = () => {
    if (!linkUrl.trim()) return;
    const newAttachment: AuditeeAttachment = {
      id: `att-${Date.now()}`,
      name: linkTitle.trim() || linkUrl.trim(),
      type: 'LINK',
      url: linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`,
      uploadedAt: new Date().toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setAttachments((prev) => [...prev, newAttachment]);
    setLinkUrl('');
    setLinkTitle('');
    setShowLinkInput(false);
  };

  // Remove attachment
  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSave = (autoEvaluate = false) => {
    if (!explanation.trim() && attachments.length === 0) {
      alert('กรุณากรอกคำชี้แจง หรือแนบรูปภาพ/เอกสารหลักฐานอย่างน้อย 1 รายการ');
      return;
    }

    const submission: AuditeeSubmission = {
      responderName: responderName.trim() || 'ตัวแทนผู้รับการตรวจ (Auditee)',
      responderDept: responderDept.trim() || 'หน่วยงานที่เกี่ยวข้อง',
      explanation: explanation.trim(),
      submittedAt: new Date().toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      attachments,
    };

    onSaveResponse(item.id, submission, autoEvaluate);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-5 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wide">
                  Auditee Response Portal
                </span>
                <span className="text-xs text-emerald-200 font-medium">
                  ข้อที่ #{item.id} • {item.categoryTitle}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                คำชี้แจง & ยื่นหลักฐานสำหรับผู้รับการตรวจ (Auditee)
              </h3>
              <p className="text-xs text-emerald-100/90">
                ผู้รับผิดชอบหน้างานหรือผู้รับเหมา สามารถระบุข้อเท็จจริง แนบภาพถ่ายหน้างานจริง หรือแนบลิงก์เอกสารอ้างอิงได้ที่นี่
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Question Reference Box */}
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-slate-600 font-semibold">
              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
              <span>หัวข้อที่ตรวจ / ข้อคำถาม:</span>
            </div>
            <p className="font-bold text-slate-900 pl-6 leading-relaxed">
              {item.question}
            </p>
            <div className="pl-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
              <span>
                <strong className="text-slate-700">หลักฐานที่ต้องการ:</strong>{' '}
                {item.requiredEvidence}
              </span>
              <span>
                <strong className="text-slate-700">เอกสารอ้างอิง:</strong>{' '}
                {item.referenceDocs}
              </span>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
            {/* Responder Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ชื่อผู้ชี้แจง / ผู้ส่งหลักฐาน:</span>
                </label>
                <input
                  type="text"
                  value={responderName}
                  onChange={(e) => setResponderName(e.target.value)}
                  placeholder="เช่น วิชัย ชัยชนะ (Supervisor)"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-emerald-600" />
                  <span>แผนก / สังกัด / ผู้รับเหมา:</span>
                </label>
                <input
                  type="text"
                  value={responderDept}
                  onChange={(e) => setResponderDept(e.target.value)}
                  placeholder="เช่น แผนกปฏิบัติการลานตู้, แผนกขนส่ง"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Quick Fill Buttons */}
            <div>
              <span className="text-[11px] text-slate-500 mr-2">เลือกด่วน:</span>
              <div className="inline-flex flex-wrap gap-1.5 mt-1">
                {PRESET_RESPONDERS.map((pr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setResponderName(pr.name);
                      setResponderDept(pr.dept);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-[11px] text-slate-600 border border-slate-200 transition cursor-pointer"
                  >
                    {pr.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Explanation Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>คำชี้แจง / คำตอบของ Auditee (Auditee Statement):</span>
                <span className="text-[11px] font-normal text-slate-400">
                  ระบุข้อเท็จจริง วิธีการปฏิบัติ หรือการจัดเก็บหลักฐาน
                </span>
              </label>
              <textarea
                rows={4}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="ระบุคำชี้แจง เช่น:
- มีการจัดทำเอกสารและอนุมัติแล้วเมื่อวันที่ 15/01/2026 โดยจัดเก็บในแฟ้ม QSHE
- พนักงานทุกคนได้รับการแจกจ่ายหน้ากาก N95 และลงนามในใบเบิกเรียบร้อย (แนบรูปใบเบิก)
- มีการตรวจเป่าแอลกอฮอล์ทุกเช้า 100% ค่าเป็นศูนย์ และมีสมุดบันทึกวัดความดัน..."
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed text-slate-800"
              />
            </div>

            {/* Attachments & Photos Section */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>รูปถ่ายหลักฐานหน้างาน & เอกสารแนบ ({attachments.length}):</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-300 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>แนบรูป / เอกสาร</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLinkInput(!showLinkInput)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>แนบลิงก์ (Drive/เว็บ)</span>
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Add Link Input Box */}
              {showLinkInput && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 animate-fadeIn">
                  <span className="text-[11px] font-bold text-blue-900 block">
                    เพิ่มลิงก์เอกสารอ้างอิง (Google Drive, SharePoint, OneDrive):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="ชื่อเอกสาร (เช่น ทะเบียนความเสี่ยง 2026 Drive)"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      className="p-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="p-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowLinkInput(false)}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={handleAddLink}
                      disabled={!linkUrl.trim()}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                    >
                      เพิ่มลิงก์
                    </button>
                  </div>
                </div>
              )}

              {/* Attachments Preview Grid */}
              {attachments.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 rounded-xl p-6 text-center cursor-pointer transition space-y-1.5"
                >
                  <Camera className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">
                    คลิกเพื่อถ่ายภาพจากมือถือ หรืออัปโหลดรูปภาพหลักฐานหน้างาน
                  </p>
                  <p className="text-[11px] text-slate-400">
                    เช่น ภาพถ่ายป้าย GHS, ภาพถังขยะอันตราย, ภาพสมุดตรวจความดัน, ภาพใบเซอร์
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="group relative border border-slate-200 rounded-xl p-2 bg-slate-50 hover:bg-white transition flex flex-col justify-between"
                    >
                      {att.type === 'IMAGE' && att.dataUrl ? (
                        <div
                          className="relative h-24 w-full rounded-lg overflow-hidden bg-slate-200 cursor-pointer mb-1.5"
                          onClick={() => setZoomedImage(att.dataUrl!)}
                        >
                          <img
                            src={att.dataUrl}
                            alt={att.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] gap-1 font-medium">
                            <Eye className="w-3.5 h-3.5" />
                            <span>ดูภาพขยาย</span>
                          </div>
                        </div>
                      ) : att.type === 'LINK' ? (
                        <div className="h-20 flex flex-col items-center justify-center bg-blue-50 text-blue-700 rounded-lg p-2 mb-1.5 text-center">
                          <LinkIcon className="w-6 h-6 mb-1 text-blue-600" />
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-bold text-blue-700 hover:underline truncate max-w-full flex items-center gap-1"
                          >
                            <span>เปิดลิงก์</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <div className="h-20 flex flex-col items-center justify-center bg-slate-100 text-slate-700 rounded-lg p-2 mb-1.5 text-center">
                          <FileText className="w-6 h-6 mb-1 text-slate-500" />
                          <span className="text-[10px] text-slate-500">เอกสารแนบ</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-1 text-[11px]">
                        <span className="truncate font-medium text-slate-800" title={att.name}>
                          {att.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                          title="ลบไฟล์นี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-50 border-t border-slate-200 p-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer w-full sm:w-auto"
            >
              ยกเลิก
            </button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {/* Save as draft / without auto-evaluate */}
              <button
                type="button"
                onClick={() => handleSave(false)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                บันทึกคำชี้แจง (ยังไม่ให้ AI ตรวจ)
              </button>

              {/* Save and ask Nong Audit to evaluate */}
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>บันทึก & ให้น้องออดิตตรวจตัดสินทันที</span>
              </button>
            </div>
          </div>
        </div>
      </div>

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
    </>
  );
};
