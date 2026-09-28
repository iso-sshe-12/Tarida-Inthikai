import React, { useState } from 'react';
import { AuditItem } from '../types/audit';
import { Sparkles, MessageCircleQuestion, Copy, Check, X, ShieldCheck, Scale, Lightbulb, BookOpen } from 'lucide-react';

interface ExplainModalProps {
  item: AuditItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExplainModal: React.FC<ExplainModalProps> = ({ item, isOpen, onClose }) => {
  if (!isOpen || !item) return null;

  const [customQuestion, setCustomQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Common quick question presets based on item category
  const getPresetQuestions = (it: AuditItem) => {
    if (it.id === 25 || it.id === 72) {
      return [
        'ทำไมห้ามใช้ขวดน้ำดื่มบรรจุสารเคมีเด็ดขาด แม้จะเขียนชื่อสารเคมีไว้ข้างขวดแล้วก็ตาม?',
        'ทำไมต้องมี SDS ภาษาไทย ณ จุดใช้งานของผู้รับเหมา?',
      ];
    }
    if (it.id === 78) {
      return [
        'ทำไมคนขับรถหัวลากที่ความดันเกิน 140/90 นิดเดียว ต้องให้นั่งพัก 15 นาทีแล้ววัดซ้ำตามระบบ TSM?',
        'ทำไมหัวลากร่วม (Sub-contractor) ถึงต้องปฏิบัติตามมาตรฐาน TSM เดียวกับรถบริษัท?',
      ];
    }
    if (it.id === 29 || it.id === 44) {
      return [
        'ทำไมผู้รับเหมามีสิทธิ์เซ็นชื่อเฉพาะช่อง "Acknowledged by vendor" เท่านั้น?',
        'ถ้าผลประเมินผู้รับเหมาต่ำกว่า 70 คะแนน (เกรด D) ทำไมต้องออกใบ CAR ทันที?',
      ];
    }
    if (it.id === 30 || it.id === 76) {
      return [
        'ทำไมปีนขึ้นไปตรวจหลังคาตู้คอนเทนเนอร์แค่ 5 นาที ต้องขอใบ Work at Height Permit ด้วย?',
      ];
    }
    if (it.id === 26 || it.id === 84) {
      return [
        'ทำไมเศษผ้าเปื้อนน้ำมันเครื่องเพียงผืนเดียว ถึงห้ามทิ้งรวมกับเศษเหล็กหรือขยะทั่วไป?',
      ];
    }
    if (it.id === 1 || it.id === 87) {
      return [
        'ทำไมการขนส่งและลานตู้คอนเทนเนอร์ K.R.C. ถึงต้องระบุประเด็น Climate Change ใน SWOT ตาม ISO Amd 1:2024?',
      ];
    }
    return [
      `ทำไมผู้ตรวจจึงมองว่าเรื่องนี้เป็นประเด็นข้อบกพร่องตามข้อกำหนด ${it.requirement}?`,
      'ทีมงานหน้างานควรปฏิบัติอย่างไรให้สอดคล้องโดยใช้เวลาน้อยที่สุดและไม่ยุ่งยาก?',
    ];
  };

  const handleAsk = async (questionToAsk: string) => {
    setLoading(true);
    setExplanation('');
    try {
      const res = await fetch('/api/audit/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionToAsk,
          findingContext: `ข้อตรวจที่ ${item.id}: ${item.question} | บันทึกหลักฐาน: ${item.evidenceRecorded || 'ยังไม่ได้ระบุ'}`,
          standardClause: `${item.requirement} (${item.isoClauses?.join(', ') || ''})`,
        }),
      });
      const data = await res.json();
      setExplanation(data.explanation || 'ไม่สามารถสร้างคำอธิบายได้');
    } catch (err: any) {
      setExplanation('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!explanation) return;
    navigator.clipboard.writeText(explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const presets = getPresetQuestions(item);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 sm:p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-400/30 text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-200 bg-blue-800/80 px-2 py-0.5 rounded">
                  ข้อตรวจที่ {item.id}
                </span>
                <span className="text-xs text-amber-300 font-semibold">{item.requirement}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                น้องออดิต ช่วยอธิบายแทนฉัน (เมื่อ Auditee สงสัย)
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

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Question Summary Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-700">
            <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>ประเด็นคำถามตามเช็กลิสต์ (F-SE-006):</span>
            </div>
            <p className="line-clamp-3 text-slate-600">{item.question}</p>

            {item.evidenceRecorded && (
              <div className="mt-2 pt-2 border-t border-slate-200 text-slate-600">
                <span className="font-semibold text-rose-700">สิ่งที่ตรวจพบหน้างาน: </span>
                {item.evidenceRecorded}
              </div>
            )}
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <MessageCircleQuestion className="w-4 h-4 text-blue-600" />
              <span>เลือกข้อสงสัยที่ Auditee มักถามบ่อย หรือคลิกถามทันที:</span>
            </label>
            <div className="flex flex-col gap-2">
              {presets.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCustomQuestion(q);
                    handleAsk(q);
                  }}
                  className="text-left text-xs px-3.5 py-2.5 rounded-lg bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/80 text-blue-900 font-medium transition active:scale-[0.99] cursor-pointer flex items-center justify-between"
                >
                  <span>"{q}"</span>
                  <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>

          {/* Custom Question Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              หรือพิมพ์คำถามเฉพาะที่ Auditee กำลังสงสัยหรือโต้แย้ง:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="เช่น ผู้รับเหมาถามว่า ทำไมต้องเขียน SDS เป็นภาษาไทย ทั้งที่ช่างเป็นคนพม่า?"
                className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customQuestion.trim()) {
                    handleAsk(customQuestion);
                  }
                }}
              />
              <button
                onClick={() => customQuestion.trim() && handleAsk(customQuestion)}
                disabled={loading || !customQuestion.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                {loading ? 'กำลังคิด...' : 'ให้น้องออดิตอธิบาย'}
              </button>
            </div>
          </div>

          {/* AI Explanation Result */}
          {loading && (
            <div className="p-8 text-center bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium text-blue-800">
                น้องออดิต กำลังค้นหาข้อกำหนด ISO และกฎหมายไทยที่เกี่ยวข้อง เพื่อจัดเตรียมคำอธิบายที่เข้าใจง่ายที่สุด...
              </p>
            </div>
          )}

          {!loading && explanation && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 relative shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>คำอธิบายมาตรฐานเชิงปฏิบัติการ (น้องออดิต AI Lead Auditor)</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>คัดลอกคำตอบ</span>
                    </>
                  )}
                </button>
              </div>

              {/* Formatted Text */}
              <div className="prose prose-sm max-w-none text-xs sm:text-sm text-slate-800 space-y-2 whitespace-pre-line leading-relaxed">
                {explanation}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            * คำอธิบายนี้สามารถส่งต่อให้ Supervisor นำไปชี้แจงกับทีมงานและผู้รับเหมาได้ทันที
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
