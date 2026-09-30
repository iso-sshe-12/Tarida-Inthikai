import React from 'react';
import {
  ShieldCheck,
  Calendar,
  Sparkles,
  Building2,
  Truck,
  AlertTriangle,
  UploadCloud,
  UserCheck,
  Users,
  Bell,
  User,
  Database,
} from 'lucide-react';
import { TeamMember } from '../types/audit';

interface HeaderProps {
  onOpenScenarioModal: () => void;
  onOpenUploadModal: () => void;
  onOpenTeamModal: () => void;
  onOpenNotificationModal: () => void;
  onOpenDatabaseModal: () => void;
  isSheetsConnected?: boolean;
  activeScenarioTitle?: string;
  totalFindingsCount: number;
  criticalCount: number;
  roleMode: 'AUDITOR' | 'AUDITEE';
  onToggleRole: (role: 'AUDITOR' | 'AUDITEE') => void;
  currentUser: TeamMember;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenScenarioModal,
  onOpenUploadModal,
  onOpenTeamModal,
  onOpenNotificationModal,
  onOpenDatabaseModal,
  isSheetsConnected = false,
  activeScenarioTitle,
  totalFindingsCount,
  criticalCount,
  roleMode,
  onToggleRole,
  currentUser,
}) => {
  // Target audit dates: October 14, 2026
  const targetAuditDate = new Date('2026-10-14T08:30:00');
  const now = new Date();
  const diffTime = targetAuditDate.getTime() - now.getTime();
  const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return (
    <header className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white shadow-xl border-b border-blue-800/40 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Company Title */}
          <div className="flex items-center space-x-3">
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-md shadow-blue-500/20 border border-blue-400/30">
              <span className="text-xs font-black tracking-tighter text-blue-200">KRC</span>
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 border border-blue-400/40 text-blue-300">
                  K.R.C. TRANSPORT & SERVICE
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center gap-1">
                  <Truck className="w-3 h-3" /> TRUCKING
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-400/10 text-amber-300 border border-amber-400/30">
                  <Sparkles className="w-3 h-3 text-amber-300" /> น้องออดิต AI Lead Auditor
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2 mt-0.5">
                ระบบจำลองการตรวจติดตามภายใน (Mock Internal Audit)
                <span className="text-xs font-normal text-slate-300 hidden xl:inline">
                  ISO 9001:2015 / 14001:2015 / 45001:2018 (รวม Amd 1:2024)
                </span>
              </h1>
            </div>
          </div>

          {/* Controls, Role Switcher, Team & Notification Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Active User Badge & Team Modal Trigger */}
            <button
              onClick={onOpenTeamModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer"
              title="คลิกเพื่อจัดการทีม Auditor & Auditee หรือเปลี่ยนสิทธิ์ผู้ใช้งาน"
            >
              <div
                className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold text-white ${
                  currentUser.avatarBg || 'bg-indigo-600'
                }`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <span className="max-w-[100px] truncate font-semibold">{currentUser.name}</span>
              <span className="text-[10px] text-amber-300 font-mono">({currentUser.role})</span>
            </button>

            {/* Role Switcher Pill */}
            <div className="inline-flex rounded-lg p-0.5 bg-slate-800/90 border border-slate-700 shadow-inner">
              <button
                onClick={() => onToggleRole('AUDITOR')}
                className={`px-2 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  roleMode === 'AUDITOR'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="สลับเป็นมุมมองผู้ตรวจประเมิน Lead Auditor"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
                <span className="hidden sm:inline">Auditor</span>
              </button>

              <button
                onClick={() => onToggleRole('AUDITEE')}
                className={`px-2 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  roleMode === 'AUDITEE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="สลับเป็นมุมมองผู้รับการตรวจ Auditee สำหรับตอบและส่งหลักฐาน"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-200" />
                <span>Auditee</span>
              </button>
            </div>

            {/* Team Management Button */}
            <button
              onClick={onOpenTeamModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 text-xs font-bold rounded-lg shadow-xs transition border border-indigo-500/50 cursor-pointer"
              title="จัดการทีม Auditor & Auditee และมอบหมาย 15 ฝ่าย"
            >
              <Users className="w-3.5 h-3.5 text-indigo-300" />
              <span>ทีม Auditor &amp; Auditee</span>
            </button>

            {/* Notification Settings Button */}
            <button
              onClick={onOpenNotificationModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg shadow-xs transition border border-slate-700 cursor-pointer"
              title="ตั้งค่าแจ้งเตือน Google Chat Webhook และ Email"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">แจ้งเตือน</span>
            </button>

            {/* Database Settings Button (Admin Only) */}
            {currentUser.role === 'ADMIN' && (
              <button
                onClick={onOpenDatabaseModal}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg shadow-xs transition border cursor-pointer ${
                  isSheetsConnected
                    ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border-emerald-500/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="ตั้งค่าฐานข้อมูล Google Sheets (KRC_Audit_Database_Master) - เฉพาะ Admin"
              >
                <Database className={`w-3.5 h-3.5 ${isSheetsConnected ? 'text-emerald-400' : 'text-blue-300'}`} />
                <span className="hidden sm:inline">ฐานข้อมูล</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Admin
                </span>
                {isSheetsConnected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            )}

            {/* Upload Checklist Button */}
            <button
              onClick={onOpenUploadModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-semibold rounded-lg shadow transition-all border border-indigo-400/40 cursor-pointer"
              title="อัปโหลดแบบฟอร์ม Audit Checklist (Excel/CSV/PDF/JSON)"
            >
              <UploadCloud className="w-3.5 h-3.5 text-blue-200" />
              <span>อัปโหลด</span>
            </button>

            {/* Scenario Selector Button */}
            <button
              onClick={onOpenScenarioModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-medium rounded-lg shadow transition-all border border-blue-400/30 cursor-pointer"
              title="สลับสถานการณ์จำลองการตรวจ"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{activeScenarioTitle ? 'เคสจำลอง' : 'โหลดเคส'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
