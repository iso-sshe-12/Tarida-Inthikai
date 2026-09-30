import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AuditStatsBar } from './components/AuditStatsBar';
import { ChecklistTab } from './components/ChecklistTab';
import { EvidenceScannerTab } from './components/EvidenceScannerTab';
import { AuditeeExplainerTab } from './components/AuditeeExplainerTab';
import { AuditSummaryTab } from './components/AuditSummaryTab';
import { AuditScheduleTab } from './components/AuditScheduleTab';
import { ExplainModal } from './components/ExplainModal';
import { CarModal } from './components/CarModal';
import { ScenarioModal } from './components/ScenarioModal';
import { UploadChecklistModal } from './components/UploadChecklistModal';
import { TeamManagementModal } from './components/TeamManagementModal';
import { TeamManagementTab } from './components/TeamManagementTab';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { DatabaseSettingsModal } from './components/DatabaseSettingsModal';
import { LoginModal } from './components/LoginModal';
import { INITIAL_CHECKLIST_DATA, ChecklistItem } from './data/auditChecklistData';
import { MOCK_SCENARIOS, MockScenario } from './data/mockScenarios';
import { DEFAULT_AUDIT_SCHEDULE } from './data/auditScheduleData';
import { DEFAULT_TEAM_MEMBERS, DEFAULT_NOTIFICATION_CONFIG } from './data/teamMembersData';
import { assignDepartmentToItem } from './data/auditDepartments';
import {
  AuditItem,
  CapData,
  TeamMember,
  NotificationConfig,
  NotificationLog,
  UserRole,
  GoogleSheetsConfig,
  AuditPlanEntry,
} from './types/audit';
import {
  getSheetsConfig,
  saveSheetsConfig,
  fetchSharedSheetsConfig,
  syncFindingToSheets,
  syncCarToSheets,
  syncScheduleToSheets,
  syncAllSchedulesToSheets,
  fetchAuditSummaryFromSheets,
  calculateSummaryMetrics,
} from './utils/googleSheetsSync';
import {
  ListChecks,
  Camera,
  MessageCircleQuestion,
  FileSpreadsheet,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  ShieldAlert,
  Users,
  Bell,
} from 'lucide-react';

const STORAGE_KEY_ITEMS = 'krc_audit_items_cache_v3';
const STORAGE_KEY_TITLE = 'krc_audit_checklist_title_v3';
const STORAGE_KEY_IS_CUSTOM = 'krc_audit_is_custom_v3';
const STORAGE_KEY_MEMBERS = 'krc_audit_team_members_v1';
const STORAGE_KEY_NOTIF = 'krc_audit_notif_config_v1';
const STORAGE_KEY_NOTIF_LOGS = 'krc_audit_notif_logs_v1';
const STORAGE_KEY_SCHEDULE = 'krc_audit_schedule_v1';
const STORAGE_KEY_LOGGED_IN_EMAIL = 'krc_audit_logged_in_email_v1';
const STORAGE_KEY_SELECTED_PERSPECTIVE = 'krc_audit_selected_perspective_v1';

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

  // State: Checklist Items with localStorage hydration (default to empty list, sample items removed)
  const [checklistItems, setChecklistItems] = useState<AuditItem[]>(() => {
    try {
      // Purge legacy sample caches
      localStorage.removeItem('krc_audit_items_cache_v1');
      localStorage.removeItem('krc_audit_items_cache_v2');

      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached checklist from localStorage:', e);
    }
    return []; // All sample items deleted as requested
  });

  const [checklistTitle, setChecklistTitle] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_TITLE) || 'Audit Checklist';
    } catch {
      return 'Audit Checklist';
    }
  });

  const [isCustomChecklist, setIsCustomChecklist] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_IS_CUSTOM) === 'true';
    } catch {
      return true;
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
  const [activeTab, setActiveTab] = useState<'SCHEDULE' | 'CHECKLIST' | 'EVIDENCE' | 'EXPLAINER' | 'SUMMARY' | 'TEAM'>('SCHEDULE');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleMode, setRoleMode] = useState<'AUDITOR' | 'AUDITEE'>(() => {
    try {
      const savedPerspective = localStorage.getItem(STORAGE_KEY_SELECTED_PERSPECTIVE);
      if (savedPerspective === 'AUDITOR' || savedPerspective === 'AUDITEE') {
        return savedPerspective;
      }
    } catch (e) {
      console.warn(e);
    }
    return 'AUDITOR';
  });

  // Audit Schedule State
  const [auditSchedule, setAuditSchedule] = useState<AuditPlanEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCHEDULE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse cached audit schedule:', e);
    }
    return DEFAULT_AUDIT_SCHEDULE;
  });

  // Sync audit schedule to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SCHEDULE, JSON.stringify(auditSchedule));
    } catch (e) {
      console.warn('Failed to save audit schedule to localStorage:', e);
    }
  }, [auditSchedule]);

  const handleAddSchedule = (entry: AuditPlanEntry) => {
    setAuditSchedule((prev) => [entry, ...prev]);
    setToastMessage(`✓ เพิ่มแผนตรวจ "${entry.department}" ลงตารางออดิตเรียบร้อยแล้ว`);
    setTimeout(() => setToastMessage(null), 3000);

    // Auto-sync to Google Sheets if connected
    if (sheetsConfig.isConnected && sheetsConfig.webAppUrl) {
      syncScheduleToSheets(sheetsConfig.webAppUrl, entry).then((res) => {
        if (res.success) {
          setToastMessage(`✓ บันทึก "${entry.department}" ลงไฟล์ KRC_Audit_Database_Master แล้ว!`);
          setTimeout(() => setToastMessage(null), 3500);
        }
      });
    }
  };

  const handleUpdateSchedule = (updated: AuditPlanEntry) => {
    setAuditSchedule((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setToastMessage(`✓ อัปเดตข้อมูลตารางออดิต ${updated.id} สำเร็จ`);
    setTimeout(() => setToastMessage(null), 3000);

    // Auto-sync to Google Sheets if connected
    if (sheetsConfig.isConnected && sheetsConfig.webAppUrl) {
      syncScheduleToSheets(sheetsConfig.webAppUrl, updated).then((res) => {
        if (res.success) {
          setToastMessage(`✓ อัปเดตข้อมูล ${updated.id} ไปยังไฟล์ KRC_Audit_Database_Master แล้ว!`);
          setTimeout(() => setToastMessage(null), 3500);
        }
      });
    }
  };

  const handleSyncAllSchedulesToSheets = async () => {
    if (!sheetsConfig.webAppUrl) {
      setToastMessage('⚠️ ยังไม่ได้เชื่อมต่อ Google Sheets กรุณาเปิดเมนูฐานข้อมูลเพื่อตั้งค่า');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    setToastMessage('⏳ กำลังซิงค์ตารางออดิตทั้งหมดไปยังไฟล์ KRC_Audit_Database_Master...');
    const res = await syncAllSchedulesToSheets(sheetsConfig.webAppUrl, auditSchedule);
    if (res.success) {
      setToastMessage(`✓ ซิงค์ตารางออดิต ${auditSchedule.length} แผนกลงชีต Audit_Schedule_Plan สำเร็จแล้ว!`);
    } else {
      setToastMessage(`❌ ซิงค์ไม่สำเร็จ: ${res.message}`);
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeleteSchedule = (id: string) => {
    setAuditSchedule((prev) => prev.filter((s) => s.id !== id));
    setToastMessage(`✓ ลบรายการ ${id} ออกจากตารางออดิตแล้ว`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleResetSchedule = () => {
    setAuditSchedule(DEFAULT_AUDIT_SCHEDULE);
    setToastMessage('✓ รีเซ็ตตารางออดิตกลับเป็นแผนมาตรฐาน K.R.C. สำเร็จ');
    setTimeout(() => setToastMessage(null), 3000);
  };

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

  const [currentUser, setCurrentUser] = useState<TeamMember>(() => {
    try {
      const savedEmail = localStorage.getItem(STORAGE_KEY_LOGGED_IN_EMAIL);
      if (savedEmail) {
        const found = teamMembers.find((m) => m.email.toLowerCase() === savedEmail.toLowerCase());
        if (found) return found;
      }
    } catch (e) {
      console.warn(e);
    }
    return teamMembers[0] || DEFAULT_TEAM_MEMBERS[0];
  });

  // Persist email & currentUser changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGGED_IN_EMAIL, currentUser.email);
    } catch (e) {
      console.warn(e);
    }
  }, [currentUser]);

  // Persist selected perspective
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SELECTED_PERSPECTIVE, roleMode);
    } catch (e) {
      console.warn(e);
    }
  }, [roleMode]);

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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [targetUploadDepartment, setTargetUploadDepartment] = useState<string>('ALL');
  const [isTeamModalOpen, setIsTeamModalOpen] = useState<boolean>(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState<boolean>(false);
  const [explainItem, setExplainItem] = useState<AuditItem | null>(null);
  const [carItem, setCarItem] = useState<AuditItem | null>(null);

  // Google Sheets Database Config state
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(getSheetsConfig);

  // On mount: attempt to check and fetch summary from Google Sheets if Web App URL is configured
  useEffect(() => {
    const initSheets = async () => {
      let currentCfg = sheetsConfig;
      if (!currentCfg.webAppUrl) {
        const remoteCfg = await fetchSharedSheetsConfig();
        if (remoteCfg?.webAppUrl) {
          currentCfg = remoteCfg;
          setSheetsConfig(remoteCfg);
        }
      }

      if (currentCfg.webAppUrl) {
        fetchAuditSummaryFromSheets(currentCfg.webAppUrl)
          .then((res) => {
            if (res.success && res.summary) {
              setSheetsConfig((prev) => {
                const updated = {
                  ...prev,
                  isConnected: true,
                  lastTestedAt: new Date().toLocaleTimeString('th-TH'),
                };
                saveSheetsConfig(updated);
                return updated;
              });
              console.log('[Google Sheets] Connected to KRC_Audit_Database_Master:', res.summary);
            }
          })
          .catch((e) => console.warn('[Google Sheets] Initial connect check failed:', e));
      }
    };

    initSheets();
  }, []);

  // Admin-only Database Modal opener
  const handleOpenDatabaseModal = () => {
    if (currentUser.role !== 'ADMIN') {
      setToastMessage(
        `⚠️ สิทธิ์ไม่เพียงพอ: บัญชี "${currentUser.name}" (${currentUser.role}) ไม่มีสิทธิ์เข้าถึงเมนูฐานข้อมูล (เฉพาะ Admin เท่านั้น)`
      );
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }
    setIsDatabaseModalOpen(true);
  };

  // Bulk Assign Handler (Supports both Department and Category delegation)
  const handleBulkAssign = (
    deptOrCategory: string,
    auditorId: string,
    auditorName: string,
    auditeeId: string,
    auditeeName: string
  ) => {
    // 1. Update all matching checklist items
    setChecklistItems((prev) =>
      prev.map((item) => {
        const itemDept = item.department || assignDepartmentToItem(item);
        if (
          deptOrCategory === 'ALL' ||
          itemDept === deptOrCategory ||
          item.categoryCode === deptOrCategory
        ) {
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

    // 2. Synchronize to Audit Schedule Plan
    setAuditSchedule((prev) =>
      prev.map((s) => {
        if (
          deptOrCategory === 'ALL' ||
          s.department.includes(deptOrCategory) ||
          deptOrCategory.includes(s.department)
        ) {
          return {
            ...s,
            leadAuditor: auditorName || s.leadAuditor,
            auditeeName: auditeeName || s.auditeeName,
          };
        }
        return s;
      })
    );

    const targetLabel = deptOrCategory === 'ALL' ? 'ทุกฝ่าย' : `ฝ่าย "${deptOrCategory}"`;
    setToastMessage(`✓ มอบหมายผู้ตรวจและ Auditee สำหรับ ${targetLabel} เรียบร้อยแล้ว`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Reset Team Members to Default
  const handleResetTeamMembers = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_MEMBERS);
    } catch (e) {
      console.warn(e);
    }
    setTeamMembers(DEFAULT_TEAM_MEMBERS);
    setCurrentUser(DEFAULT_TEAM_MEMBERS[0]);
    setToastMessage('✓ รีเซ็ตรายชื่อทีม Auditor & Auditee กลับเป็นค่าเริ่มต้นมาตรฐาน K.R.C. สำเร็จ');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Switch persona handler
  const handleSwitchCurrentUser = (member: TeamMember) => {
    setCurrentUser(member);
    try {
      localStorage.setItem(STORAGE_KEY_LOGGED_IN_EMAIL, member.email);
    } catch (e) {
      console.warn(e);
    }
    if (member.role === 'AUDITEE') {
      setRoleMode('AUDITEE');
    } else {
      setRoleMode('AUDITOR');
    }
    setToastMessage(`สลับผู้ใช้งานเป็น: ${member.name} (${member.role})`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Login with Email Handler (Supports choosing perspective Auditor / Auditee, except Admin)
  const handleLoginWithEmail = (email: string, perspective?: 'AUDITOR' | 'AUDITEE') => {
    const clean = email.trim().toLowerCase();
    const found = teamMembers.find((m) => m.email.trim().toLowerCase() === clean);
    if (found) {
      setCurrentUser(found);
      try {
        localStorage.setItem(STORAGE_KEY_LOGGED_IN_EMAIL, found.email);
      } catch (e) {
        console.warn(e);
      }

      // If Admin: full access, default to perspective or AUDITOR
      // If Non-Admin: uses the perspective selected by user!
      let targetRoleMode: 'AUDITOR' | 'AUDITEE' = 'AUDITOR';
      if (found.role === 'ADMIN') {
        targetRoleMode = perspective || 'AUDITOR';
      } else {
        targetRoleMode = perspective || (found.role === 'AUDITEE' ? 'AUDITEE' : 'AUDITOR');
      }

      setRoleMode(targetRoleMode);
      try {
        localStorage.setItem(STORAGE_KEY_SELECTED_PERSPECTIVE, targetRoleMode);
      } catch (e) {
        console.warn(e);
      }

      const perspectiveLabel =
        targetRoleMode === 'AUDITOR' ? '🛡️ มุมมอง Auditor (ผู้ตรวจประเมิน)' : '👥 มุมมอง Auditee (ผู้รับการตรวจ)';

      setToastMessage(
        found.role === 'ADMIN'
          ? `✓ ยินดีต้อนรับ Admin คุณ${found.name} (สิทธิ์เต็ม - เข้าใช้งานใน${perspectiveLabel})`
          : `✓ ยินดีต้อนรับ คุณ${found.name} เข้าสู่ระบบใน "${perspectiveLabel}" เรียบร้อยแล้ว!`
      );
      setTimeout(() => setToastMessage(null), 3500);
      return { success: true, message: 'เข้าสู่ระบบสำเร็จ', user: found };
    }

    return {
      success: false,
      message: `ไม่พบอีเมล "${email}" ในฐานข้อมูลระบบ K.R.C.`,
    };
  };

  // Quick Register and Login Handler
  const handleRegisterAndLogin = (newMember: TeamMember, perspective?: 'AUDITOR' | 'AUDITEE') => {
    setTeamMembers((prev) => {
      const updated = [newMember, ...prev.filter((m) => m.email.toLowerCase() !== newMember.email.toLowerCase())];
      try {
        localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });

    setCurrentUser(newMember);
    try {
      localStorage.setItem(STORAGE_KEY_LOGGED_IN_EMAIL, newMember.email);
    } catch (e) {
      console.warn(e);
    }

    const targetMode = perspective || (newMember.role === 'AUDITEE' ? 'AUDITEE' : 'AUDITOR');
    setRoleMode(targetMode);
    try {
      localStorage.setItem(STORAGE_KEY_SELECTED_PERSPECTIVE, targetMode);
    } catch (e) {
      console.warn(e);
    }

    setToastMessage(
      `✓ ลงทะเบียน "${newMember.name}" เข้าสู่ฐานข้อมูล และเข้าใช้งานใน ${targetMode === 'AUDITOR' ? '🛡️ มุมมอง Auditor' : '👥 มุมมอง Auditee'} สำเร็จ!`
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Logout Handler
  const handleLogout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_LOGGED_IN_EMAIL);
    } catch (e) {
      console.warn(e);
    }
    setToastMessage('ออกจากระบบเรียบร้อยแล้ว');
    setIsLoginModalOpen(true);
    setTimeout(() => setToastMessage(null), 2500);
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
    mode: 'REPLACE' | 'APPEND' | 'REPLACE_DEPT',
    title: string,
    targetDept?: string
  ) => {
    if (mode === 'REPLACE_DEPT' && targetDept) {
      setChecklistItems((prev) => {
        const otherDeptItems = prev.filter(
          (it) => (it.department || assignDepartmentToItem(it)) !== targetDept
        );
        const maxId = otherDeptItems.reduce((max, it) => Math.max(max, it.id), 0);
        const remappedNewItems = newItems.map((it, idx) => ({
          ...it,
          id: maxId + idx + 1,
          department: targetDept,
        }));
        return [...otherDeptItems, ...remappedNewItems];
      });
      setToastMessage(`✓ นำเข้า Checklist ฝ่าย "${targetDept}" สำเร็จ (${newItems.length} ข้อ)`);
      setTimeout(() => setToastMessage(null), 3500);
      setIsCustomChecklist(true);
    } else if (mode === 'REPLACE') {
      setChecklistItems(newItems);
      setChecklistTitle(title || 'Checklist ที่อัปโหลดใหม่');
      setIsCustomChecklist(true);
      setToastMessage(`✓ แทนที่ Checklist ทั้งหมดสำเร็จ (${newItems.length} ข้อ)`);
      setTimeout(() => setToastMessage(null), 3500);
    } else {
      // Append mode: ensure continuous IDs
      const maxId = checklistItems.reduce((max, it) => Math.max(max, it.id), 0);
      const remappedNewItems = newItems.map((it, idx) => ({
        ...it,
        id: maxId + idx + 1,
        department: it.department || (targetDept && targetDept !== 'ALL' ? targetDept : assignDepartmentToItem(it)),
      }));
      setChecklistItems([...checklistItems, ...remappedNewItems]);
      setChecklistTitle(`${checklistTitle} (+ ${title})`);
      setIsCustomChecklist(true);
      setToastMessage(`✓ เพิ่มข้อคำถามต่อท้ายสำเร็จ (+${newItems.length} ข้อ)`);
      setTimeout(() => setToastMessage(null), 3500);
    }
    setActiveTab('CHECKLIST');
  };

  const handleClearDepartmentItems = (deptId: string) => {
    setChecklistItems((prev) =>
      prev.filter((it) => (it.department || assignDepartmentToItem(it)) !== deptId)
    );
    setToastMessage(`✓ ล้างข้อตรวจของฝ่าย "${deptId}" เรียบร้อยแล้ว พร้อมอัปโหลดชุดใหม่`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleClearAllItems = () => {
    setChecklistItems([]);
    setChecklistTitle('Audit Checklist');
    setIsCustomChecklist(true);
    setToastMessage('✓ ลบข้อตรวจทั้งหมดในระบบแล้ว พร้อมสำหรับการอัปโหลดชุดใหม่');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleResetToDefault = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_ITEMS);
      localStorage.removeItem(STORAGE_KEY_TITLE);
      localStorage.removeItem(STORAGE_KEY_IS_CUSTOM);
    } catch (e) {
      console.warn(e);
    }
    setChecklistItems([]);
    setChecklistTitle('Audit Checklist');
    setIsCustomChecklist(true);
    setToastMessage('✓ ลบข้อมูลตัวอย่างทั้งหมดแล้ว พร้อมสำหรับการอัปโหลดใหม่');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handlers
  const handleUpdateItem = (updatedItem: AuditItem) => {
    setChecklistItems((prev) => {
      const next = prev.map((item) => (item.id === updatedItem.id ? updatedItem : item));

      // Auto-sync Finding to Google Sheets (Audit_Findings_Evidence & Audit_Summary)
      if (sheetsConfig.webAppUrl && sheetsConfig.autoSyncOnFinding && updatedItem.status !== 'PENDING') {
        const summary = calculateSummaryMetrics(next, activeScenario?.title, currentUser.name);
        syncFindingToSheets(sheetsConfig.webAppUrl, updatedItem, currentUser.role, summary)
          .then((res) => {
            if (res.success) {
              setToastMessage(`✓ บันทึกข้อ #${updatedItem.id} (${updatedItem.status}) ลง Google Sheets สำเร็จ`);
              setTimeout(() => setToastMessage(null), 3000);
            }
          })
          .catch((err) => console.warn('Failed to sync finding to Google Sheets:', err));
      }

      return next;
    });
  };

  const handleApplyFindingFromScanner = (itemId: number, findingData: any) => {
    setChecklistItems((prev) => {
      const next = prev.map((item) => {
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

          const updated: AuditItem = {
            ...item,
            status: findingData.status || item.status,
            evidenceRecorded: findingData.evidenceRecorded || item.evidenceRecorded,
            auditorFindingDetail: findingData.auditorFindingDetail,
            isoClauses: findingData.isoClauses || item.isoClauses,
            lawReferences: findingData.lawReferences || item.lawReferences,
            capRequired: findingData.capRequired,
            capData: newCapData,
          };

          // Auto-sync finding & CAR from Scanner to Google Sheets
          if (sheetsConfig.webAppUrl && sheetsConfig.autoSyncOnFinding) {
            const summary = calculateSummaryMetrics(prev, activeScenario?.title, currentUser.name);
            syncFindingToSheets(sheetsConfig.webAppUrl, updated, currentUser.role, summary);
            if (newCapData && sheetsConfig.autoSyncOnCar) {
              syncCarToSheets(sheetsConfig.webAppUrl, updated, newCapData);
            }
          }

          return updated;
        }
        return item;
      });
      return next;
    });
  };

  const handleSaveCap = (itemId: number, updatedCap: CapData) => {
    setChecklistItems((prev) => {
      const targetItem = prev.find((it) => it.id === itemId);
      const next = prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              capRequired: true,
              capData: updatedCap,
            }
          : item
      );

      // Auto-sync CAR & CAP to Google Sheets (CAR_CAP_Tracking)
      if (sheetsConfig.webAppUrl && sheetsConfig.autoSyncOnCar && targetItem) {
        syncCarToSheets(sheetsConfig.webAppUrl, targetItem, updatedCap, 'AUD-KRC-2026-001')
          .then((res) => {
            if (res.success) {
              setToastMessage(`✓ บันทึกใบ ${updatedCap.carNo} ลงชีต CAR_CAP_Tracking สำเร็จ!`);
              setTimeout(() => setToastMessage(null), 3500);
            }
          })
          .catch((err) => console.warn('Failed to sync CAR to Google Sheets:', err));
      }

      return next;
    });
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
        onOpenDatabaseModal={handleOpenDatabaseModal}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        isSheetsConnected={sheetsConfig.isConnected}
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
        />

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-6 gap-2 overflow-x-auto pb-1">
          {/* Audit Schedule Tab (First Tab) */}
          <button
            onClick={() => setActiveTab('SCHEDULE')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'SCHEDULE'
                ? 'border-indigo-600 text-indigo-700 bg-white/70 rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>ตารางออดิต (Audit Schedule & Plan)</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              {auditSchedule.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('CHECKLIST')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'CHECKLIST'
                ? 'border-blue-600 text-blue-700 bg-white/70 rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <ListChecks className="w-4 h-4 text-blue-600" />
            <span>จำลองการ Audit</span>
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
                ? 'border-emerald-600 text-emerald-800 bg-white/70 rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>รายงานสรุปผลการตรวจ (Audit Summary Report)</span>
          </button>

          {/* Team Management Tab */}
          <button
            onClick={() => setActiveTab('TEAM')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'TEAM'
                ? 'border-purple-600 text-purple-700 bg-white/70 rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Users className="w-4 h-4 text-purple-600" />
            <span>ทีมงาน Auditor &amp; Auditee</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              {teamMembers.length}
            </span>
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'SCHEDULE' && (
          <AuditScheduleTab
            scheduleItems={auditSchedule}
            onAddSchedule={handleAddSchedule}
            onUpdateSchedule={handleUpdateSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            onResetSchedule={handleResetSchedule}
            onJumpToChecklist={() => setActiveTab('CHECKLIST')}
            isSheetsConnected={sheetsConfig.isConnected}
            onSyncAllToSheets={handleSyncAllSchedulesToSheets}
            onOpenTeamModal={() => {
              setActiveTab('TEAM');
            }}
          />
        )}

        {activeTab === 'CHECKLIST' && (
          <ChecklistTab
            items={checklistItems}
            onUpdateItem={handleUpdateItem}
            onOpenExplainModal={(item) => setExplainItem(item)}
            onOpenCarModal={(item) => setCarItem(item)}
            statusFilter={statusFilter}
            onClearStatusFilter={() => setStatusFilter('ALL')}
            onOpenUploadModal={() => {
              setTargetUploadDepartment('ALL');
              setIsUploadModalOpen(true);
            }}
            onOpenUploadModalWithDept={(deptId) => {
              setTargetUploadDepartment(deptId);
              setIsUploadModalOpen(true);
            }}
            onClearDepartmentItems={handleClearDepartmentItems}
            onClearAllItems={handleClearAllItems}
            checklistTitle={checklistTitle}
            isCustomChecklist={isCustomChecklist}
            onResetToDefault={handleResetToDefault}
            roleMode={roleMode}
            onToggleRole={setRoleMode}
            onOpenTeamModal={() => {
              setActiveTab('TEAM');
            }}
            currentUser={currentUser}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
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

        {activeTab === 'EXPLAINER' && <AuditeeExplainerTab />}

        {activeTab === 'SUMMARY' && (
          <AuditSummaryTab
            items={checklistItems}
            onOpenCarModal={(item) => setCarItem(item)}
            onOpenExplainModal={(item) => setExplainItem(item)}
          />
        )}

        {activeTab === 'TEAM' && (
          <TeamManagementTab
            teamMembers={teamMembers}
            onUpdateTeamMembers={setTeamMembers}
            items={checklistItems}
            onBulkAssign={handleBulkAssign}
            currentUser={currentUser}
            onSwitchCurrentUser={handleSwitchCurrentUser}
            onOpenDatabaseModal={handleOpenDatabaseModal}
            scheduleItems={auditSchedule}
            onUpdateSchedule={handleUpdateSchedule}
            onResetTeamToDefault={handleResetTeamMembers}
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
        initialDepartment={targetUploadDepartment}
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
        onOpenDatabaseModal={handleOpenDatabaseModal}
        scheduleItems={auditSchedule}
        onUpdateSchedule={handleUpdateSchedule}
        onResetTeamToDefault={handleResetTeamMembers}
      />

      <NotificationSettingsModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        config={notificationConfig}
        onSaveConfig={setNotificationConfig}
        logs={notificationLogs}
        onTriggerTestNotification={handleTriggerTestNotification}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        teamMembers={teamMembers}
        onLoginWithEmail={handleLoginWithEmail}
        onRegisterAndLogin={handleRegisterAndLogin}
        onLogout={handleLogout}
        currentRoleMode={roleMode}
      />

      <DatabaseSettingsModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        config={sheetsConfig}
        onUpdateConfig={(newCfg) => setSheetsConfig(newCfg)}
        items={checklistItems}
        teamMembers={teamMembers}
        currentUser={currentUser}
        scenarioTitle={activeScenario?.title}
        onApplySummaryFromSheet={(sheetSummary) => {
          setToastMessage(
            `✓ ซิงค์ผลสรุปจากชีตแล้ว: เกรด ${sheetSummary.conformanceGrade || '-'} (${sheetSummary.conformanceRate ?? '-'}%)`
          );
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />
    </div>
  );
}
