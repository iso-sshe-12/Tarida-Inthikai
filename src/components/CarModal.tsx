import React, { useState } from 'react';
import { AuditItem, CapData } from '../types/audit';
import { X, Copy, Check, ShieldAlert, CheckCircle2, UserCheck, Calendar, FileText, AlertTriangle } from 'lucide-react';

interface CarModalProps {
  item: AuditItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveCap: (itemId: number, updatedCap: CapData) => void;
}

export const CarModal: React.FC<CarModalProps> = ({ item, isOpen, onClose, onSaveCap }) => {
  if (!isOpen || !item) return null;

  // Initialize or fallback capData
  const initialCap: CapData = item.capData || {
    carNo: `CAR-KRC-2026-${String(item.id).padStart(3, '0')}`,
    targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    personInCharge: 'ผู้ควบคุมงาน / Supervisor แผนกที่เกี่ยวข้อง',
    rootCause: item.auditorFindingDetail ? `จากการวิเคราะห์เบื้องต้น: ${item.auditorFindingDetail}` : '',
    correction: 'แก้ไขสิ่งบกพร่องหน้างานทันที และกำจัดความเสี่ยงเร่งด่วน',
    correctiveAction: 'ปรับปรุงขั้นตอนการปฏิบัติงาน จัดทำ Check sheet และควบคุมเชิงระบบเพื่อไม่ให้เกิดซ้ำ',
    preventiveAction: 'ทบทวนทะเบียนความเสี่ยง/Aspect และจัดอบรมถ่ายทอดความรู้ในการทำงาน',
    extentAnalysis: 'ขยายผลการสุ่มตรวจสอบไปยังทุกพื้นที่ปฏิบัติงานทั้ง 2 ไซต์งาน และผู้รับเหมาทุกราย',
    status: 'ISSUED',
    signatories: {
      preparedBy: 'น้องออดิต (AI Lead Auditor)',
      proposedBy: 'หัวหน้างาน / Supervisor (K.R.C.)',
      reviewedBy: 'ประภาส สันติสุข (QSHE Manager K.R.C.)',
      approvedBy: 'กิตติศักดิ์ เจริญกิจ (President & CEO K.R.C.)',
      acknowledgedByVendor: item.referenceDocs.includes('P-PU') ? 'ตัวแทนผู้รับเหมา (รับทราบผลการประเมิน)' : undefined,
    },
  };

  const [formData, setFormData] = useState<CapData>(initialCap);
  const [copied, setCopied] = useState(false);

  const handleChange = (field: keyof CapData, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSignatoryChange = (field: keyof CapData['signatories'], val: string) => {
    setFormData((prev) => ({
      ...prev,
      signatories: { ...prev.signatories, [field]: val },
    }));
  };

  const handleSave = () => {
    onSaveCap(item.id, formData);
    onClose();
  };

  const handleCopyMarkdown = () => {
    const md = `### ใบแจ้งข้อบกพร่องและแผนแก้ไขป้องกัน (Corrective Action Plan - CAR)
**เอกสารอ้างอิง:** ฟอร์ม F-CR-004 | บจก. เค.อาร์.ซี. ทรานสปอร์ต แอนด์ เซอร์วิส
**เลขที่ CAR:** ${formData.carNo}
**ข้อตรวจที่:** ${item.id} (${item.requirement})
**ข้อกำหนด ISO / กฎหมาย:** ${item.isoClauses?.join(', ') || '-'} | ${item.lawReferences?.join(', ') || '-'}
**กำหนดแล้วเสร็จ:** ${formData.targetDate}
**ผู้รับผิดชอบดำเนินการ:** ${formData.personInCharge}

---

#### 1. สิ่งตรวจพบและข้อบกพร่อง (Finding & Objective Evidence)
${item.evidenceRecorded || '-'}
*ผลวิเคราะห์:* ${item.auditorFindingDetail || '-'}

#### 2. การวิเคราะห์หาสาเหตุที่แท้จริง (Root Cause Analysis - RCA)
${formData.rootCause}

#### 3. การแก้ไขข้อบกพร่องทันที (Correction)
${formData.correction}

#### 4. มาตรการแก้ไขเชิงระบบเพื่อไม่ให้เกิดซ้ำ (Corrective Action)
${formData.correctiveAction}

#### 5. มาตรการป้องกันเชิงรุก (Preventive Action)
${formData.preventiveAction}

#### 6. การขยายผลตรวจสอบจุดอื่น (Extent Analysis)
${formData.extentAnalysis}

---

#### 7. การลงนามอนุมัติและรับทราบ (Signatures Governance)
| บทบาท | ชื่อ-นามสกุล / ตำแหน่ง | สังกัด |
| :--- | :--- | :--- |
| **ผู้จัดทำ (Prepared by)** | ${formData.signatories.preparedBy} | K.R.C. Internal |
| **ผู้เสนอแนวทางแก้ไข (Proposed by)** | ${formData.signatories.proposedBy} | K.R.C. Supervisor |
| **ผู้ตรวจสอบ (Reviewed by)** | ${formData.signatories.reviewedBy} | K.R.C. QSHE Manager |
| **ผู้อนุมัติ (Approved by)** | ${formData.signatories.approvedBy} | K.R.C. Top Management |
${formData.signatories.acknowledgedByVendor ? `| **ผู้รับทราบผล (Acknowledged by vendor)** | ${formData.signatories.acknowledgedByVendor} | ผู้รับเหมาภายนอก (Vendor) |` : ''}

*(หมายเหตุ: ตามระเบียบ K.R.C. ผู้รับเหมามีสิทธิ์ลงนามเพียงช่อง Acknowledged by vendor เท่านั้น เพื่อความโปร่งใสตามหลักเกณฑ์ออดิต CB)*
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-900 via-red-900 to-slate-900 text-white p-4 sm:p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/20 text-rose-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded text-white">
                  แบบฟอร์ม F-CR-004
                </span>
                <span className="text-xs text-rose-200 font-semibold">{formData.carNo}</span>
                <span className="text-xs px-2 py-0.5 rounded font-bold bg-rose-500/30 text-rose-200 border border-rose-400/30">
                  {item.status} ({item.requirement})
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                ใบแจ้งข้อบกพร่องและแผนแก้ไขป้องกัน (Corrective Action Plan - CAP)
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Finding Reference Header */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-900 text-sm">
                ข้อตรวจที่ {item.id}: {item.categoryTitle}
              </span>
              <span className="text-rose-700 font-medium">เอกสารอ้างอิง: {item.referenceDocs}</span>
            </div>
            <p className="text-slate-700">
              <strong className="text-slate-900">คำถามเช็กลิสต์: </strong> {item.question}
            </p>
            {item.evidenceRecorded && (
              <p className="text-rose-800 bg-white p-2 rounded border border-rose-200/80">
                <strong>หลักฐาน/สิ่งตรวจพบ: </strong> {item.evidenceRecorded}
              </p>
            )}
            <div className="flex flex-wrap gap-2 text-[11px] pt-1">
              <span className="text-slate-600 font-medium">ข้อกำหนดที่เกี่ยวข้อง:</span>
              {item.isoClauses?.map((c, i) => (
                <span key={i} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  {c}
                </span>
              ))}
              {item.lawReferences?.map((l, i) => (
                <span key={i} className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  {l}
                </span>
              ))}
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">เลขที่เอกสาร CAR No.:</label>
              <input
                type="text"
                value={formData.carNo}
                onChange={(e) => handleChange('carNo', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                กำหนดแล้วเสร็จ (Target Date):
              </label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => handleChange('targetDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                ผู้รับผิดชอบหลัก (Person in Charge):
              </label>
              <input
                type="text"
                value={formData.personInCharge}
                onChange={(e) => handleChange('personInCharge', e.target.value)}
                placeholder="ชื่อ-สกุล และตำแหน่ง"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Action Sections */}
          <div className="space-y-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>การวิเคราะห์หาสาเหตุที่แท้จริง (Root Cause Analysis - RCA):</span>
                <span className="text-[11px] font-normal text-slate-500">
                  (ต้องลงลึกถึงรากเหง้า ห้ามหยุดแค่ "ขาดความตระหนัก" หรือ "สื่อสารไม่ทั่วถึง")
                </span>
              </label>
              <textarea
                rows={2}
                value={formData.rootCause}
                onChange={(e) => handleChange('rootCause', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                การแก้ไขทันทีเฉพาะหน้า (Correction):
              </label>
              <textarea
                rows={2}
                value={formData.correction}
                onChange={(e) => handleChange('correction', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>มาตรการแก้ไขเชิงระบบไม่ให้เกิดซ้ำ (Corrective Action):</span>
                <span className="text-[11px] font-normal text-slate-500">
                  (ต้องแก้ไขที่ระบบ ระเบียบ หรือวิศวกรรม ไม่ใช่แค่ "อบรมเน้นย้ำ")
                </span>
              </label>
              <textarea
                rows={2}
                value={formData.correctiveAction}
                onChange={(e) => handleChange('correctiveAction', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                มาตรการป้องกันเชิงรุก (Preventive Action):
              </label>
              <textarea
                rows={2}
                value={formData.preventiveAction}
                onChange={(e) => handleChange('preventiveAction', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                การขยายผลตรวจสอบจุดปฏิบัติงานอื่น (Extent Analysis):
              </label>
              <textarea
                rows={2}
                value={formData.extentAnalysis}
                onChange={(e) => handleChange('extentAnalysis', e.target.value)}
                placeholder="ระบุว่าได้ขยายผลไปตรวจที่ Site 2 หรือตรวจผู้รับเหมาเจ้าอื่นด้วยอย่างไร"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Signatures Governance Section (Crucial requirement from prompt) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-700" />
                <span className="font-bold text-slate-900 text-xs">
                  การควบคุมการลงนามท้ายแบบฟอร์ม (Signatures Governance)
                </span>
              </div>
              <span className="text-[11px] text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded font-semibold">
                * ผู้รับเหมาลงนามเฉพาะช่อง Acknowledged เท่านั้น
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  1. ผู้จัดทำ (Prepared by):
                </label>
                <input
                  type="text"
                  value={formData.signatories.preparedBy}
                  onChange={(e) => handleSignatoryChange('preparedBy', e.target.value)}
                  className="w-full text-xs p-1.5 border border-slate-300 rounded"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Lead Auditor / เจ้าหน้าที่</span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  2. ผู้เสนอ (Proposed by):
                </label>
                <input
                  type="text"
                  value={formData.signatories.proposedBy}
                  onChange={(e) => handleSignatoryChange('proposedBy', e.target.value)}
                  className="w-full text-xs p-1.5 border border-slate-300 rounded"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Supervisor หน่วยงาน</span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  3. ผู้ตรวจสอบ (Reviewed by):
                </label>
                <input
                  type="text"
                  value={formData.signatories.reviewedBy}
                  onChange={(e) => handleSignatoryChange('reviewedBy', e.target.value)}
                  className="w-full text-xs p-1.5 border border-slate-300 rounded"
                />
                <span className="text-[10px] text-slate-400 block mt-1">QSHE Manager</span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  4. ผู้อนุมัติ (Approved by):
                </label>
                <input
                  type="text"
                  value={formData.signatories.approvedBy}
                  onChange={(e) => handleSignatoryChange('approvedBy', e.target.value)}
                  className="w-full text-xs p-1.5 border border-slate-300 rounded"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Top Management</span>
              </div>
            </div>

            {/* Vendor Signature */}
            <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200">
              <label className="text-[11px] font-semibold text-amber-900 block mb-1">
                ผู้รับทราบผล (Acknowledged by vendor) - กรณีตรวจงานผู้รับเหมา Sub SVP / ART:
              </label>
              <input
                type="text"
                value={formData.signatories.acknowledgedByVendor || ''}
                onChange={(e) => handleSignatoryChange('acknowledgedByVendor', e.target.value)}
                placeholder="ระบุชื่อตัวแทนผู้รับเหมาที่รับทราบผล (ลงนามเพื่อรับทราบเท่านั้น ห้ามลงในช่องอนุมัติ)"
                className="w-full text-xs p-1.5 border border-amber-300 rounded bg-white"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleCopyMarkdown}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">คัดลอก Markdown แล้ว</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>คัดลอกเป็น Markdown Table</span>
              </>
            )}
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>บันทึกแผนแก้ไข (Save CAP)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
