import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AuditStatsBar } from './components/AuditStatsBar';
import { ChecklistTab } from './components/ChecklistTab';
import { EvidenceScannerTab } from './components/EvidenceScannerTab';
import { AuditeeExplainerTab } from './components/AuditeeExplainerTab';
import { AuditSummaryTab } from './components/AuditSummaryTab';
import { ExplainModal } from './components/ExplainModal';
import { CarModal } from './components/CarModal';
import { ScenarioModal } from './components/ScenarioModal';
import { UploadChecklistModal } from './components/UploadChecklistModal';
import { CarTrackerTab } from './components/CarTrackerTab';
import { TeamManagementModal } from './components/TeamManagementModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { INITIAL_CHECKLIST_DATA, ChecklistItem } from './data/auditChecklistData';
import { MOCK_SCENARIOS, MockScenario } from './data/mockScenarios';
import { DEFAULT_TEAM_MEMBERS, DEFAULT_NOTIFICATION_CONFIG } from './data/teamMembersData';
import { AuditItem, CapData, TeamMember, NotificationConfig, NotificationLog, UserRole } from './types/audit';
import {
  ListChecks,
  Camera,
  MessageCircleQuestion,
  FileSpreadsheet,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  ShieldAlert,
  Users,
  Bell,
} from 'lucide-react';

const STORAGE_KEY_ITEMS = 'krc_audit_items_cache_v1';
const STORAGE_KEY_TITLE = 'krc_audit_checklist_title_v1';
const STORAGE_KEY_IS_CUSTOM = 'krc_audit_is_custom_v1';
const STORAGE_KEY_MEMBERS = 'krc_audit_team_members_v1';
const STORAGE_KEY_NOTIF = 'krc_audit_notif_config_v1';
const STORAGE_KEY_NOTIF_LOGS = 'krc_audit_notif_logs_v1';

export default function App() {
  // Initialize with the realistic pre-audit scenario
  const defaultScenario = MOCK_SCENARIOS[0];

  const applyScenarioToData = (baseData: ChecklistItem[], scenario: MockScenario): AuditItem[] => {
    return baseData.map((item) => {
      const match = scenario.customData.find((d) => d.id === item.id);
      if (match) {
        return {
          ...item,
          ...match,
        } as AuditItem;
      }
      return { ...item } as AuditItem;
    });
  };

  // State: Checklist Items with localStorage hydration
  const [checklistItems, setChecklistItems] = useState<AuditItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached checklist from localStorage:', e);
    }
    return applyScenarioToData(INITIAL_CHECKLIST_DATA, defaultScenario);
  });

  const [checklistTitle, setChecklistTitle] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_TITLE) || 'แบบฟอร์ม F-SE-006 (87 ข้อ)';
    } catch {
      return 'แบบฟอร์ม F-SE-006 (87 ข้อ)';
    }
  });

  const [isCustomChecklist, setIsCustomChecklist] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_IS_CUSTOM) === 'true';
    } catch {
      return false;
    }
  });

  // Save to localStorage whenever checklistItems or title change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(checklistItems));
      localStorage.setItem(STORAGE_KEY_TITLE, checklistTitle);
      localStorage.setItem(STORAGE_KEY_IS_CUSTOM, String(isCustomChecklist));
    } catch (e) {
      console.warn('Failed to save checklist to localStorage:', e);
    }
  }, [checklistItems, checklistTitle, isCustomChecklist]);

  const [activeScenario, setActiveScenario] = useState<MockScenario>(defaultScenario);
  const [activeTab, setActiveTab] = useState<'CHECKLIST' | 'EVIDENCE' | 'CAR_TRACKER' | 'EXPLAINER' | 'SUMMARY'>('CHECKLIST');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleMode, setRoleMode] = useState<'AUDITOR' | 'AUDITEE'>('AUDITOR');

  // Team & Users state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MEMBERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_TEAM_MEMBERS;
  });

  const [currentUser, setCurrentUser] = useState<TeamMember>(() => teamMembers[0] || DEFAULT_TEAM_MEMBERS[0]);

  // Notifications state
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIF);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_NOTIFICATION_CONFIG;
  });

  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIF_LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return [
      {
        id: 'log-default-1',
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        channel: 'GOOGLE_CHAT',
        recipient: 'Google Chat Space: QSHE KRC',
        subject: 'ระบบ Mock Internal Audit พร้อมใช้งาน',
        message: 'เริ่มต้นการจำลองตรวจติดตามภายในเพื่อเตรียม Surveillance Audit ต.ค. 2026',
        status: 'SENT',
      },
    ];
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync team & notif config to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(teamMembers));
    } catch (e) {
      console.warn(e);
    }
  }, [teamMembers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIF, JSON.stringify(notificationConfig));
      localStorage.setItem(STORAGE_KEY_NOTIF_LOGS, JSON.stringify(notificationLogs));
    } catch (e) {
      console.warn(e);
    }
  }, [notificationConfig, notificationLogs]);

  // Modals state
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState<boolean>(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [explainItem, setExplainItem] = useState<AuditItem | null>(null);
  const [carItem, setCarItem] = useState<AuditItem | null>(null);

  // Bulk Assign Handler
  const handleBulkAssign = (
    categoryCode: string,
    auditorId: string,
    auditorName: string,
    auditeeId: string,
    auditeeName: string
  ) => {
    setChecklistItems((prev) =>
      prev.map((item) => {
        if (categoryCode === 'ALL' || item.categoryCode === categoryCode) {
          return {
            ...item,
            assignedAuditorId: auditorId || item.assignedAuditorId,
            assignedAuditorName: auditorName || item.assignedAuditorName,
            assignedAuditeeId: auditeeId || item.assignedAuditeeId,
            assignedAuditeeName: auditeeName || item.assignedAuditeeName,
          };
        }
        return item;
      })
    );
  };

  // Switch persona handler
  const handleSwitchCurrentUser = (member: TeamMember) => {
    setCurrentUser(member);
    if (member.role === 'AUDITEE') {
      setRoleMode('AUDITEE');
    } else {
      setRoleMode('AUDITOR');
    }
    setToastMessage(`สลับผู้ใช้งานเป็น: ${member.name} (${member.role})`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Notification Handler (Google Chat & Email)
  const handleSendNotification = async (
    channel: 'GOOGLE_CHAT' | 'EMAIL',
    item: AuditItem,
    car: CapData
  ) => {
    try {
      if (channel === 'GOOGLE_CHAT') {
        const res = await fetch('/api/notifications/send-google-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webhookUrl: notificationConfig.googleChatWebhookUrl,
            title: `แจ้งเตือนใบ CAR: ${car.carNo} (ข้อ #${item.id})`,
            text: `มีการออกใบ CAR สำหรับข้อ #${item.id} (${item.requirement}) กำหนดเสร็จ ${car.targetDate}`,
            eventType: 'CAR_ISSUED',
            carNo: car.carNo,
            checklistItemTitle: item.question,
            assigneeName: car.personInCharge,
            targetDate: car.targetDate,
          }),
        });
        const data = await res.json();

        const newLog: NotificationLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          channel: 'GOOGLE_CHAT',
          recipient: notificationConfig.googleChatWebhookUrl ? 'Google Chat Space' : 'Simulated Space',
          subject: `แจ้งเตือนใบ ${car.carNo}`,
          message: `แจ้งเตือน ${car.personInCharge} กำหนดเสร็จ ${car.targetDate}`,
          status: data.status || 'SENT',
          relatedCarNo: car.carNo,
          relatedItemId: item.id,
        };
        setNotificationLogs((prev) => [newLog, ...prev]);
        setToastMessage(`✓ ส่งการ์ดแจ้งเตือน ${car.carNo} เข้า Google Chat เรียบร้อย!`);
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        const res = await fetch('/api/notifications/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: item.assignedAuditeeName || notificationConfig.adminEmail || 'iso-sshe@krctrans.com',
            cc: notificationConfig.adminEmail,
            subject: `[K.R.C. Mock Audit] ใบแจ้งขอให้แก้ไขและป้องกัน ${car.carNo} (ข้อ #${item.id})`,
            bodyHtml: `เรียน ${car.personInCharge},\n\nมีการออกใบ CAR เลขที่ ${car.carNo} ในข้อตรวจ #${item.id}: ${item.question}\nกำหนดส่งแผนแก้ไขภายใน ${car.targetDate}\n\nกรุณาเข้าระบบเพื่อบันทึกสาเหตุ (Root Cause) และแผนแก้ไขเชิงระบบ (CAP)`,
            eventType: 'CAR_ISSUED',
            carNo: car.carNo,
          }),
        });
        const data = await res.json();

        const newLog: NotificationLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          channel: 'EMAIL',
          recipient: data.recipient,
          subject: `แจ้งเตือนอีเมล ${car.carNo}`,
          message: `ส่งถึง ${data.recipient}`,
          status: 'SENT',
          relatedCarNo: car.carNo,
          relatedItemId: item.id,
        };
        setNotificationLogs((prev) => [newLog, ...prev]);
        setToastMessage(`✓ เตรียมข้อมูลแจ้งเตือนทางอีเมล ${car.carNo} ถึง ${data.recipient} สำเร็จ!`);
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err: any) {
      alert('ส่งแจ้งเตือนไม่สำเร็จ: ' + err.message);
    }
  };

  // Test Notification
  const handleTriggerTestNotification = async (channel: 'GOOGLE_CHAT' | 'EMAIL') => {
    if (channel === 'GOOGLE_CHAT') {
      const res = await fetch('/api/notifications/send-google-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: notificationConfig.googleChatWebhookUrl,
          title: 'ทดสอบระบบแจ้งเตือน K.R.C. Internal Audit',
          text: 'นี่คือข้อความทดสอบการเชื่อมโยงระบบ Google Chat Webhook พร้อมใช้งาน!',
        }),
      });
      return await res.json();
    } else {
      const res = await fetch('/api/notifications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: notificationConfig.adminEmail || 'iso-sshe@krctrans.com',
          subject: 'ทดสอบระบบแจ้งเตือนทางอีเมล K.R.C. Mock Internal Audit',
          bodyHtml: 'ระบบแจ้งเตือนทางอีเมลของระบบ Mock Internal Audit พร้อมทำงานเรียบร้อย',
        }),
      });
      return await res.json();
    }
  };

  // Handlers for Checklist Import
  const handleImportChecklist = (
    newItems: AuditItem[],
    mode: 'REPLACE' | 'APPEND',
    title: string
  ) => {
    if (mode === 'REPLACE') {
      setChecklistItems(newItems);
      setChecklistTitle(title || 'Checklist ที่อัปโหลดใหม่');
      setIsCustomChecklist(true);
    } else {
      // Append mode: ensure continuous IDs
      const maxId = checklistItems.reduce((max, it) => Math.max(max, it.id), 0);
      const remappedNewItems = newItems.map((it, idx) => ({
        ...it,
        id: maxId + idx + 1,
      }));
      setChecklistItems([...checklistItems, ...remappedNewItems]);
      setChecklistTitle(`${checklistTitle} (+ ${title})`);
      setIsCustomChecklist(true);
    }
    setActiveTab('CHECKLIST');
  };

  const handleResetToDefault = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_ITEMS);
      localStorage.removeItem(STORAGE_KEY_TITLE);
      localStorage.removeItem(STORAGE_KEY_IS_CUSTOM);
    } catch (e) {
      console.warn(e);
    }
    setChecklistItems(applyScenarioToData(INITIAL_CHECKLIST_DATA, defaultScenario));
    setChecklistTitle('แบบฟอร์ม F-SE-006 (87 ข้อ)');
    setIsCustomChecklist(false);
  };

  // Handlers
  const handleUpdateItem = (updatedItem: AuditItem) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  const handleApplyFindingFromScanner = (itemId: number, findingData: any) => {
    setChecklistItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const newCapData: CapData | undefined = findingData.capRequired
            ? {
                carNo: findingData.capDraft?.carNo || `CAR-KRC-2026-${String(item.id).padStart(3, '0')}`,
                targetDate: findingData.capDraft?.targetDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                personInCharge: findingData.capDraft?.personInCharge || 'Supervisor หน่วยงานที่เกี่ยวข้อง',
                rootCause: findingData.capDraft?.rootCause || 'จากการวิเคราะห์สาเหตุเชิงลึก',
                correction: findingData.capDraft?.correction || 'แก้ไขทันทีเฉพาะหน้า',
                correctiveAction: findingData.capDraft?.correctiveAction || 'แก้ไขเชิงระบบเพื่อไม่ให้เกิดซ้ำ',
                preventiveAction: findingData.capDraft?.preventiveAction || 'มาตรการป้องกันเชิงรุก',
                extentAnalysis: findingData.capDraft?.extentAnalysis || 'ขยายผลการสุ่มตรวจสอบไปยังทุกพื้นที่',
                status: 'ISSUED',
                signatories: {
                  preparedBy: findingData.capDraft?.signatories?.preparedBy || 'น้องออดิต (AI Lead Auditor)',
                  proposedBy: findingData.capDraft?.signatories?.proposedBy || 'หัวหน้างาน / Supervisor (K.R.C.)',
                  reviewedBy: findingData.capDraft?.signatories?.reviewedBy || 'ประภาส สันติสุข (QSHE Manager K.R.C.)',
                  approvedBy: findingData.capDraft?.signatories?.approvedBy || 'กิตติศักดิ์ เจริญกิจ (President & CEO K.R.C.)',
                  acknowledgedByVendor: findingData.capDraft?.signatories?.acknowledgedByVendor || (item.referenceDocs.includes('P-PU') ? 'ตัวแทนผู้รับเหมา (รับทราบผลเท่านั้น)' : undefined),
                },
              }
            : item.capData;

          return {
            ...item,
            status: findingData.status || item.status,
            evidenceRecorded: findingData.evidenceRecorded || item.evidenceRecorded,
            auditorFindingDetail: findingData.auditorFindingDetail,
            isoClauses: findingData.isoClauses || item.isoClauses,
            lawReferences: findingData.lawReferences || item.lawReferences,
            capRequired: findingData.capRequired,
            capData: newCapData,
          };
        }
        return item;
      })
    );
  };

  const handleSaveCap = (itemId: number, updatedCap: CapData) => {
    setChecklistItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              capRequired: true,
              capData: updatedCap,
            }
          : item
      )
    );
  };

  const handleSelectScenario = (scenario: MockScenario) => {
    setActiveScenario(scenario);
    setChecklistItems(applyScenarioToData(INITIAL_CHECKLIST_DATA, scenario));
  };

  // Critical issues count for header alert
  const criticalCount = checklistItems.filter((i) => i.status === 'MA').length;
  const totalFindingsCount = checklistItems.filter((i) => i.status !== 'PENDING' && i.status !== 'C').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900">
      {/* Top Header */}
      <Header
        onOpenScenarioModal={() => setIsScenarioModalOpen(true)}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
        onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
        activeScenarioTitle={activeScenario?.title}
        totalFindingsCount={totalFindingsCount}
        criticalCount={criticalCount}
        roleMode={roleMode}
        onToggleRole={setRoleMode}
        currentUser={currentUser}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Scenario Banner / Active Mode */}
        {activeScenario && (
          <div className="bg-white rounded-2xl p-4 mb-5 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.2 rounded">
                    กำลังใช้งานสถานการณ์
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {activeScenario.title}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{activeScenario.description}</p>
              </div>
            </div>

            <button
              onClick={() => setIsScenarioModalOpen(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline shrink-0"
            >
              เปลี่ยนสถานการณ์จำลอง →
            </button>
          </div>
        )}

        {/* Audit Stats Dashboard */}
        <AuditStatsBar
          items={checklistItems}
          onFilterStatus={(st) => {
            setStatusFilter(st);
            setActiveTab('CHECKLIST');
          }}
          selectedStatusFilter={statusFilter}
          onOpenReport={() => setActiveTab('SUMMARY')}
          onOpenCarManager={() => setActiveTab('CAR_TRACKER')}
        />

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-6 gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('CHECKLIST')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'CHECKLIST'
                ? 'border-blue-600 text-blue-700 bg-white/70 rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <ListChecks className="w-4 h-4 text-blue-600" />
            <span>จำลองการตรวจ Audit (87 ข้อ F-SE-006)</span>
          </button>

          <button
            onClick={() => setActiveTab('EVIDENCE')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'EVIDENCE'
                ? 'border-blue-600 text-blue-700 bg-white/70 rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Camera className="w-4 h-4 text-indigo-600" />
            <span>ตรวจสอบหลักฐานด่วน (Evidence Inspector)</span>
          </button>

          {/* Dedicated CAR & CAP Tracker Tab */}
          <button
            onClick={() => setActiveTab('CAR_TRACKER')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'CAR_TRACKER'
                ? 'border-rose-600 text-rose-700 bg-white/70 rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>
              ติดตาม CAR & CAP (
              {
                checklistItems.filter(
                  (i) => i.status === 'MA' || i.status === 'MI' || i.capData
                ).length
              }
              )
            </span>
          </button>

          <button
            onClick={() => setActiveTab('EXPLAINER')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'EXPLAINER'
                ? 'border-blue-600 text-blue-700 bg-white/70 rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <MessageCircleQuestion className="w-4 h-4 text-amber-600" />
            <span>ตอบข้อสงสัย Auditee (Auditee Explainer)</span>
          </button>

          <button
            onClick={() => setActiveTab('SUMMARY')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'SUMMARY'
                ? 'border-blue-600 text-blue-700 bg-white/70 rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>สรุปประเด็น & ออก CAR/CAP (F-QS-007)</span>
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'CHECKLIST' && (
          <ChecklistTab
            items={checklistItems}
            onUpdateItem={handleUpdateItem}
            onOpenExplainModal={(item) => setExplainItem(item)}
            onOpenCarModal={(item) => setCarItem(item)}
            statusFilter={statusFilter}
            onClearStatusFilter={() => setStatusFilter('ALL')}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            checklistTitle={checklistTitle}
            isCustomChecklist={isCustomChecklist}
            onResetToDefault={handleResetToDefault}
            roleMode={roleMode}
            onToggleRole={setRoleMode}
          />
        )}

        {activeTab === 'EVIDENCE' && (
          <EvidenceScannerTab
            checklistItems={checklistItems}
            onApplyFindingToItem={handleApplyFindingFromScanner}
            onOpenExplainModal={(item) => setExplainItem(item)}
            onOpenCarModal={(item) => setCarItem(item)}
          />
        )}

        {activeTab === 'CAR_TRACKER' && (
          <CarTrackerTab
            items={checklistItems}
            onOpenCarModal={(item) => setCarItem(item)}
            onSendNotification={handleSendNotification}
            currentUserRole={currentUser.role}
            onUpdateItem={handleUpdateItem}
          />
        )}

        {activeTab === 'EXPLAINER' && <AuditeeExplainerTab />}

        {activeTab === 'SUMMARY' && (
          <AuditSummaryTab
            items={checklistItems}
            onOpenCarModal={(item) => setCarItem(item)}
            onOpenExplainModal={(item) => setExplainItem(item)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-5 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-slate-200">
              บริษัท เค.อาร์.ซี. ทรานสปอร์ต แอนด์ เซอร์วิส จำกัด (K.R.C.)
            </span>
            <span>&bull;</span>
            <span>K.R.C. Trucking</span>
          </div>

          <p className="text-slate-400 text-[11px]">
            ระบบจำลองและเตรียมความพร้อมการตรวจติดตามภายใน (Pre-audit 14-22 ตุลาคม 2026) &bull; แบบฟอร์ม F-SE-006 / F-QS-007 / F-CR-004
          </p>
        </div>
      </footer>

      {/* Modals */}
      <ExplainModal
        item={explainItem}
        isOpen={!!explainItem}
        onClose={() => setExplainItem(null)}
      />

      <CarModal
        item={carItem}
        isOpen={!!carItem}
        onClose={() => setCarItem(null)}
        onSaveCap={handleSaveCap}
      />

      <ScenarioModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        onSelectScenario={handleSelectScenario}
        currentScenarioId={activeScenario?.id}
      />

      <UploadChecklistModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImportChecklist={handleImportChecklist}
        onResetToDefault={handleResetToDefault}
        currentItemsCount={checklistItems.length}
        currentChecklistTitle={checklistTitle}
      />

      <TeamManagementModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        teamMembers={teamMembers}
        onUpdateTeamMembers={setTeamMembers}
        items={checklistItems}
        onBulkAssign={handleBulkAssign}
        currentUser={currentUser}
        onSwitchCurrentUser={handleSwitchCurrentUser}
      />

      <NotificationSettingsModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        config={notificationConfig}
        onSaveConfig={setNotificationConfig}
        logs={notificationLogs}
        onTriggerTestNotification={handleTriggerTestNotification}
      />
    </div>
  );
}
