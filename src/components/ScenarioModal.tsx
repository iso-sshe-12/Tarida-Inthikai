import React from 'react';
import { MOCK_SCENARIOS, MockScenario } from '../data/mockScenarios';
import { Sparkles, X, Check, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenario: MockScenario) => void;
  currentScenarioId?: string;
}

export const ScenarioModal: React.FC<ScenarioModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario,
  currentScenarioId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-400/30 text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-blue-200 bg-blue-800/80 px-2 py-0.5 rounded">
                Mock Audit Simulator
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                เลือกสถานการณ์จำลองการตรวจติดตามภายใน (Mock Audit Scenario)
              </h3>
              <p className="text-xs text-slate-300">
                โหลดข้อมูลตัวอย่างเสมือนจริงเพื่อซ้อมตรวจ เตรียมความพร้อมก่อนวันตรวจจริง 14-22 ตุลาคม 2026
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scenarios List */}
        <div className="p-5 sm:p-6 space-y-3.5 max-h-[70vh] overflow-y-auto">
          {MOCK_SCENARIOS.map((sc) => {
            const isSelected = currentScenarioId === sc.id;
            return (
              <div
                key={sc.id}
                onClick={() => {
                  onSelectScenario(sc);
                  onClose();
                }}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-400'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${sc.badgeColor}`}>
                        {sc.badge}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">หน่วยงาน: {sc.targetUnit}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{sc.title}</h4>
                    <p className="text-xs text-slate-600">{sc.description}</p>
                  </div>

                  <div className="shrink-0 flex items-center">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                        <Check className="w-3.5 h-3.5" /> เลือกอยู่
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 group-hover:text-blue-600 bg-slate-100 px-2.5 py-1 rounded-full">
                        โหลดเคสนี้ <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
