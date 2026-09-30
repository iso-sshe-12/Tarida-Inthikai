import React, { useState } from 'react';
import { AuditItem } from '../types/audit';
import {
  Sparkles,
  UploadCloud,
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  ShieldAlert,
  ArrowRight,
  Camera,
  Image as ImageIcon,
  Check,
} from 'lucide-react';

interface EvidenceScannerTabProps {
  checklistItems: AuditItem[];
  onApplyFindingToItem: (itemId: number, findingData: any) => void;
  onOpenExplainModal: (item: AuditItem) => void;
  onOpenCarModal: (item: AuditItem) => void;
}

export const EvidenceScannerTab: React.FC<EvidenceScannerTabProps> = ({
  checklistItems,
  onApplyFindingToItem,
  onOpenExplainModal,
  onOpenCarModal,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<number>(25); // Default to item 25 (Chemical)
  const [evidenceText, setEvidenceText] = useState<string>('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);

  // Preset test evidence for instant 1-click simulation
  const PRESET_EVIDENCES = [
    {
      title: '1. ขวดน้ำดื่มบรรจุน้ำมันล้างเบรกในอู่ Sub SVP',
      itemId: 25,
      text: 'จากการเดินสุ่มตรวจบริเวณลานซ่อมตู้คอนเทนเนอร์ของผู้รับเหมา Sub SVP พบขวดน้ำดื่มพลาสติกใสบรรจุของเหลวสีเหลืองใส (น้ำมันล้างเบรก/ทินเนอร์) วางอยู่ข้างกล่องเครื่องมือ ไม่มีการติดฉลากเตือน GHS และไม่มีเอกสารข้อมูลความปลอดภัย (SDS) ภาษาไทย ณ จุดใช้งาน',
    },
    {
      title: '2. ผลตรวจความดัน พขร. 146/94 mmHg ปล่อยขับรถทันที',
      itemId: 78,
      text: 'สุ่มตรวจสมุดประจำรถและบันทึกคัดกรองสุขภาพ พขร. รถหัวลากร่วม ทะเบียน 70-XXXX วันที่ 24 ก.ย. ผลวัดความดันโลหิตได้ 146/94 mmHg ผลตรวจเป่าแอลกอฮอล์ 0.00 มก.% แต่เจ้าหน้าที่ปล่อยให้ออกรถปฏิบัติงานทันที โดยไม่ได้ให้นั่งพักผ่อน 15 นาทีแล้ววัดซ้ำตามขั้นตอน TSM',
    },
    {
      title: '3. ช่างปีนขึ้นหลังคาตู้ 2.6 เมตร ไม่มี Work Permit',
      itemId: 30,
      text: 'ตรวจพบช่างซ่อมตู้ M&R กำลังปีนบันไดลิงขึ้นไปตรวจสอบรอยรั่วบนหลังคาตู้คอนเทนเนอร์ความสูง 2.6 เมตร โดยไม่มีการขอและอนุมัติใบอนุญาตทำงานบนที่สูง (Work at Height Permit) และไม่ได้สวมใส่เข็มขัดนิรภัยคล้อง Lifeline',
    },
    {
      title: '4. Survey Gate สวมหน้ากากอนามัยกระดาษธรรมดา',
      itemId: 59,
      text: 'ตรวจเจ้าหน้าที่ตรวจสภาพตู้ (Survey Gate) 2 นาย พบว่าสวมใส่หน้ากากกระดาษทางการแพทย์แบบบาง (Surgical mask) ไม่ได้รับแจกหน้ากากชนิดกรองฝุ่นและไอระเหย (N95 หรือ Carbon mask) และไม่มีบันทึกประวัติการเบิกจ่าย PPE',
    },
    {
      title: '5. ทบทวน SWOT เรื่อง Climate Change มีบันทึกครบถ้วน',
      itemId: 1,
      text: 'ฝ่าย QSHE แสดงเอกสาร SWOT 2026 ฉบับอนุมัติโดย CEO พร้อมรายงานการประชุมทบทวนที่มีการระบุผลกระทบจาก Climate Change (โรคลมแดดในคนงานลานตู้, น้ำท่วมขังลานจากฝนตกหนัก, การประหยัดพลังงานดีเซลของรถหัวลาก) อย่างชัดเจนและเชื่อมโยงกับทะเบียนความเสี่ยง',
    },
  ];

  const handleSelectPreset = (p: typeof PRESET_EVIDENCES[0]) => {
    setSelectedItemId(p.itemId);
    setEvidenceText(p.text);
    setScanResult(null);
    setAppliedSuccess(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleEvaluate = async () => {
    if (!evidenceText.trim() && !imageBase64) return;

    setLoading(true);
    setScanResult(null);
    setAppliedSuccess(false);

    const targetItem = checklistItems.find((i) => i.id === selectedItemId);

    try {
      const res = await fetch('/api/audit/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checklistItem: targetItem,
          evidenceText: evidenceText,
          evidenceImageBase64: imageBase64,
        }),
      });

      const data = await res.json();
      setScanResult(data);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการตรวจสอบหลักฐาน: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToMainChecklist = () => {
    if (!scanResult) return;
    onApplyFindingToItem(selectedItemId, scanResult);
    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 3000);
  };

  const selectedItem = checklistItems.find((i) => i.id === selectedItemId);

  return (
    <div className="space-y-6">
      {/* Header explanation */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-xl border border-white/20 text-amber-300">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-blue-200">
              Proactive Audit & Automation System
            </span>
            <h3 className="text-lg font-bold">
              เครื่องมือตรวจสอบหลักฐานหน้างานด่วน (Quick Evidence Inspector)
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              พิมพ์บันทึกข้อเท็จจริง หรือแนบรูปภาพหน้างาน น้องออดิต จะทำการวิเคราะห์ข้อบกพร่อง เทียบข้อกำหนด ISO และกฎหมาย พร้อมร่างใบ CAR ให้อัตโนมัติ
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input and Presets */}
        <div className="lg:col-span-6 space-y-4">
          {/* Quick Presets */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <label className="block text-xs font-bold text-slate-800 mb-2">
              เลือกกรณีทดสอบเสมือนจริง (1-Click Test Scenarios):
            </label>
            <div className="flex flex-col gap-1.5">
              {PRESET_EVIDENCES.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPreset(p)}
                  className={`text-left text-xs px-3 py-2 rounded-lg transition border cursor-pointer ${
                    selectedItemId === p.itemId && evidenceText === p.text
                      ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{p.title}</span>
                    <span className="text-[10px] text-slate-400">ข้อ #{p.itemId}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            {/* Checklist item selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                จับคู่กับข้อตรวจตามเช็กลิสต์ (F-SE-006):
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {checklistItems.length === 0 ? (
                  <option value={0}>ยังไม่มีข้อตรวจในระบบ (กรุณาอัปโหลด Checklist ในแท็บ "จำลองการ Audit")</option>
                ) : (
                  checklistItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      ข้อ #{item.id} [{item.requirement}] - {item.question.slice(0, 75)}...
                    </option>
                  ))
                )}
              </select>

              {selectedItem && (
                <div className="mt-2 p-2.5 bg-slate-50 rounded-lg text-slate-600 text-xs border border-slate-200">
                  <span className="font-semibold text-slate-800">เป้าหมายการตรวจ: </span>
                  {selectedItem.requiredEvidence}
                </div>
              )}
            </div>

            {/* Evidence Text Area */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                บันทึกหลักฐาน / สิ่งที่ตรวจพบหน้างาน:
              </label>
              <textarea
                rows={4}
                value={evidenceText}
                onChange={(e) => setEvidenceText(e.target.value)}
                placeholder="ระบุสิ่งที่พบจริง เช่น สภาพภาชนะสารเคมี, เอกสารที่ไม่ครบ, ผลการสัมภาษณ์คนขับ, สภาพถังดับเพลิง..."
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Optional Image Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span>แนบรูปถ่ายหลักฐานหน้างาน (ถ้ามี):</span>
                {imagePreview && (
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setImageBase64(null);
                    }}
                    className="text-[11px] text-rose-600 hover:underline"
                  >
                    ลบรูป
                  </button>
                )}
              </label>

              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-48 bg-slate-900 flex items-center justify-center">
                  <img src={imagePreview} alt="Evidence" className="max-h-48 object-contain" />
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition">
                  <Camera className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-600">
                    คลิกเพื่ออัปโหลดภาพถ่าย หรือลากไฟล์มาวาง
                  </span>
                  <span className="text-[10px] text-slate-400">รองรับไฟล์ JPG, PNG</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleEvaluate}
              disabled={loading || (!evidenceText.trim() && !imageBase64)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{loading ? 'น้องออดิตกำลังประมวลผลการตรวจ...' : 'ตรวจสอบหลักฐาน & ตัดสินใจผลการตรวจ'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: AI Verdict & CAR Proposal */}
        <div className="lg:col-span-6 space-y-4">
          {loading && (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3 shadow-sm">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">
                น้องออดิต กำลังตรวจสอบหลักฐานเทียบข้อกำหนด ISO และกฎหมาย...
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                ระบบกำลังตรวจสอบจุดสกัดกั้นความเสี่ยง EHS, ข้อกฎหมายที่เกี่ยวข้อง, และร่างแผนแก้ไขป้องกัน CAP
              </p>
            </div>
          )}

          {!loading && !scanResult && (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-2 text-slate-400 shadow-sm">
              <FileCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700 text-sm">ยังไม่มีผลการตรวจสอบ</h4>
              <p className="text-xs">
                เลือกกรณีทดสอบทางด้านซ้าย หรือพิมพ์บันทึกข้อเท็จจริงหน้างาน แล้วกดปุ่ม "ตรวจสอบหลักฐาน"
              </p>
            </div>
          )}

          {!loading && scanResult && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden space-y-4 p-5">
              {/* Finding Result Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-sm ${
                      scanResult.status === 'C'
                        ? 'bg-emerald-600'
                        : scanResult.status === 'MA'
                        ? 'bg-rose-600'
                        : scanResult.status === 'MI'
                        ? 'bg-amber-600'
                        : scanResult.status === 'OBS'
                        ? 'bg-purple-600'
                        : 'bg-cyan-600'
                    }`}
                  >
                    {scanResult.status}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 block">
                      ผลการตัดสินโดย Lead Auditor
                    </span>
                    <h4 className="text-base font-bold text-slate-900">
                      {scanResult.statusTitle}
                    </h4>
                  </div>
                </div>

                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                    scanResult.riskLevel === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : scanResult.riskLevel === 'HIGH'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                  }`}
                >
                  ความเสี่ยง: {scanResult.riskLevel}
                </span>
              </div>

              {/* Auditor Finding Detail */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-800 block">บทวิเคราะห์ข้อบกพร่อง:</span>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {scanResult.auditorFindingDetail}
                </p>
              </div>

              {/* ISO & Law Citations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                  <span className="font-bold text-blue-900 block">ข้อกำหนด ISO:</span>
                  <ul className="list-disc list-inside text-blue-800 space-y-0.5">
                    {scanResult.isoClauses?.map((c: string, i: number) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                  <span className="font-bold text-emerald-900 block">กฎหมายไทยที่เกี่ยวข้อง:</span>
                  <ul className="list-disc list-inside text-emerald-800 space-y-0.5">
                    {scanResult.lawReferences?.map((l: string, i: number) => (
                      <li key={i}>{l}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Explainer advice for Auditee */}
              {scanResult.explainerForAuditee && (
                <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-amber-900 block flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                    <span>คำแนะนำในการชี้แจงกับ Auditee / ผู้รับเหมา:</span>
                  </span>
                  <p className="text-slate-700 leading-relaxed">{scanResult.explainerForAuditee}</p>
                </div>
              )}

              {/* CAP Draft preview if applicable */}
              {scanResult.capRequired && scanResult.capDraft && (
                <div className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-900 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>ร่างใบแจ้งข้อบกพร่อง (CAR {scanResult.capDraft.carNo}):</span>
                    </span>
                    <span className="text-[10px] text-rose-700 font-semibold">
                      กำหนดเสร็จ: {scanResult.capDraft.targetDate}
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-700">
                    <p>
                      <strong>สาเหตุที่แท้จริง (RCA): </strong>
                      {scanResult.capDraft.rootCause}
                    </p>
                    <p>
                      <strong>การแก้ไขเบื้องต้น (Correction): </strong>
                      {scanResult.capDraft.correction}
                    </p>
                    <p>
                      <strong>มาตรการแก้ไขเชิงระบบ (Corrective Action): </strong>
                      {scanResult.capDraft.correctiveAction}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons to sync with main audit */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleApplyToMainChecklist}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {appliedSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>อัปเดตลงในเช็กลิสต์ข้อ #{selectedItemId} แล้ว!</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      <span>บันทึกผลนี้ลงในเช็กลิสต์ข้อ #{selectedItemId}</span>
                    </>
                  )}
                </button>

                {selectedItem && (
                  <button
                    onClick={() => onOpenExplainModal(selectedItem)}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition cursor-pointer"
                  >
                    อธิบายเพิ่มเติม
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
