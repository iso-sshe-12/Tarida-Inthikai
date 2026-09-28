import React, { useState } from 'react';
import {
  X,
  Bell,
  MessageSquare,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Sparkles,
  Info,
} from 'lucide-react';
import { NotificationConfig, NotificationLog } from '../types/audit';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: NotificationConfig;
  onSaveConfig: (newConfig: NotificationConfig) => void;
  logs: NotificationLog[];
  onTriggerTestNotification: (channel: 'GOOGLE_CHAT' | 'EMAIL') => Promise<any>;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  logs,
  onTriggerTestNotification,
}) => {
  if (!isOpen) return null;

  const [formConfig, setFormConfig] = useState<NotificationConfig>(config);
  const [testingChannel, setTestingChannel] = useState<'GOOGLE_CHAT' | 'EMAIL' | null>(null);
  const [testResult, setTestResult] = useState<{ status: 'SUCCESS' | 'ERROR'; message: string } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formConfig);
    onClose();
  };

  const handleTest = async (channel: 'GOOGLE_CHAT' | 'EMAIL') => {
    setTestingChannel(channel);
    setTestResult(null);
    try {
      const res = await onTriggerTestNotification(channel);
      if (res.success) {
        setTestResult({
          status: 'SUCCESS',
          message:
            channel === 'GOOGLE_CHAT'
              ? res.status === 'SENT'
                ? 'ส่งข้อความการ์ดเข้า Google Chat Space สำเร็จเรียบร้อย!'
                : 'จำลองการส่งแจ้งเตือนเข้า Google Chat เรียบร้อย (ใส่ Webhook URL จริงเพื่อรับข้อความใน Space)'
              : `เตรียมการส่งอีเมลแจ้งเตือนถึง ${formConfig.adminEmail || 'ทีมงาน'} เรียบร้อย`,
        });
      } else {
        setTestResult({ status: 'ERROR', message: res.error || 'การส่งทดสอบล้มเหลว' });
      }
    } catch (err: any) {
      setTestResult({ status: 'ERROR', message: err.message || 'เกิดข้อผิดพลาดในการส่งทดสอบ' });
    } finally {
      setTestingChannel(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wide">
                Notifications Hub
              </span>
              <span className="text-xs text-blue-200">Google Chat & Email Alerts</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold">
              ตั้งค่าการแจ้งเตือนผ่าน Google Chat และ อีเมล
            </h2>
            <p className="text-xs text-slate-300">
              แจ้งเตือนอัตโนมัติเมื่อออกใบ CAR, Auditee ส่งหลักฐาน, หรือเมื่อใกล้ครบกำหนดส่งแผนแก้ไข
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 ${
                testResult.status === 'SUCCESS'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {testResult.status === 'SUCCESS' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-semibold">{testResult.message}</span>
            </div>
          )}

          {/* Section 1: Google Chat Webhook */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-xs">
                    1. แจ้งเตือนเข้า Google Chat (Webhook URL)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    ส่งการ์ดแจ้งเตือน (Card V2) เข้า Space แผนก QSHE หรือกลุ่มความปลอดภัย K.R.C.
                  </span>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formConfig.googleChatEnabled}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, googleChatEnabled: e.target.checked })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-700">เปิดใช้งาน</span>
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Google Chat Webhook URL:
              </label>
              <input
                type="url"
                value={formConfig.googleChatWebhookUrl}
                onChange={(e) =>
                  setFormConfig({ ...formConfig, googleChatWebhookUrl: e.target.value })
                }
                placeholder="https://chat.googleapis.com/v1/spaces/SPACE_ID/messages?key=...&token=..."
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-mono text-[11px] text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3 text-blue-500" />
                <span>
                  วิธีสร้าง: ใน Google Chat Space &gt; คลิกชื่อ Space &gt; เลือก "Apps &
                  Integrations" &gt; Add Webhook &gt; คัดลอก URL มาวางที่นี่
                </span>
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleTest('GOOGLE_CHAT')}
                disabled={testingChannel === 'GOOGLE_CHAT'}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testingChannel === 'GOOGLE_CHAT' ? 'กำลังส่งทดสอบ...' : 'ทดสอบส่งการ์ดเข้า Google Chat'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Email Notifications */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-xs">
                    2. แจ้งเตือนทางอีเมล (Email Notifications)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    ส่งอีเมลแจ้งเตือนถึงผู้รับผิดชอบ (Auditee) และ CC ผู้จัดการ QSHE
                  </span>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formConfig.emailEnabled}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, emailEnabled: e.target.checked })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-700">เปิดใช้งาน</span>
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                อีเมลหลักของ QSHE Admin (สำหรับรับแจ้งเตือนและ CC):
              </label>
              <input
                type="email"
                value={formConfig.adminEmail}
                onChange={(e) => setFormConfig({ ...formConfig, adminEmail: e.target.value })}
                placeholder="iso-sshe@krctrans.com"
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleTest('EMAIL')}
                disabled={testingChannel === 'EMAIL'}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testingChannel === 'EMAIL' ? 'กำลังเตรียมการ...' : 'ทดสอบแจ้งเตือนทางอีเมล'}</span>
              </button>
            </div>
          </div>

          {/* Section 3: Notification Event Triggers */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <h4 className="font-bold text-slate-800 text-xs">
              3. เหตุการณ์ที่ต้องการให้ส่งการแจ้งเตือนอัตโนมัติ (Event Triggers):
            </h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formConfig.notifyOnCarIssued}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, notifyOnCarIssued: e.target.checked })
                  }
                  className="rounded text-indigo-600"
                />
                <span className="text-slate-700 font-medium">
                  เมื่อ Auditor ออกใบ CAR ใหม่ (แจ้งเตือน Auditee และกำหนดวันปิด)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formConfig.notifyOnAuditeeSubmitted}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, notifyOnAuditeeSubmitted: e.target.checked })
                  }
                  className="rounded text-indigo-600"
                />
                <span className="text-slate-700 font-medium">
                  เมื่อ Auditee ส่งคำชี้แจง / แนบหลักฐานหน้างานใหม่ (แจ้งเตือน Auditor ให้ตรวจ)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formConfig.notifyOnCarClosed}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, notifyOnCarClosed: e.target.checked })
                  }
                  className="rounded text-indigo-600"
                />
                <span className="text-slate-700 font-medium">
                  เมื่อ Auditor และผู้บริหารลงนามปิดใบ CAR สมบูรณ์ (Closed CAR)
                </span>
              </label>
            </div>
          </div>

          {/* Section 4: Recent Logs */}
          {logs && logs.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-700 block text-xs">
                ประวัติการส่งแจ้งเตือนล่าสุด ({logs.length} รายการ):
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-white">
                {logs.slice(0, 10).map((log) => (
                  <div
                    key={log.id}
                    className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                          log.channel === 'GOOGLE_CHAT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {log.channel === 'GOOGLE_CHAT' ? 'Google Chat' : 'Email'}
                      </span>
                      <span className="font-semibold text-slate-800">{log.subject}</span>
                      <span className="text-slate-400">({log.recipient})</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:px-6 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition active:scale-95 cursor-pointer"
          >
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </div>
  );
};
