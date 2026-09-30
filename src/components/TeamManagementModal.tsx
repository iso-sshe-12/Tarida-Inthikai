import React from 'react';
import { X } from 'lucide-react';
import { TeamMember, AuditItem, AuditPlanEntry } from '../types/audit';
import { TeamManagementTab } from './TeamManagementTab';

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  onUpdateTeamMembers: (members: TeamMember[]) => void;
  items: AuditItem[];
  onBulkAssign: (
    deptOrCategory: string,
    auditorId: string,
    auditorName: string,
    auditeeId: string,
    auditeeName: string
  ) => void;
  currentUser: TeamMember;
  onSwitchCurrentUser: (user: TeamMember) => void;
  onOpenDatabaseModal?: () => void;
  scheduleItems?: AuditPlanEntry[];
  onUpdateSchedule?: (item: AuditPlanEntry) => void;
  onResetTeamToDefault?: () => void;
}

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({
  isOpen,
  onClose,
  teamMembers,
  onUpdateTeamMembers,
  items,
  onBulkAssign,
  currentUser,
  onSwitchCurrentUser,
  onOpenDatabaseModal,
  scheduleItems,
  onUpdateSchedule,
  onResetTeamToDefault,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-slate-100 rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200">
              หน้าต่างจัดการทีม Auditor &amp; Auditee (K.R.C. Internal Audit)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with full tab component */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1">
          <TeamManagementTab
            teamMembers={teamMembers}
            onUpdateTeamMembers={onUpdateTeamMembers}
            items={items}
            onBulkAssign={onBulkAssign}
            currentUser={currentUser}
            onSwitchCurrentUser={onSwitchCurrentUser}
            onOpenDatabaseModal={onOpenDatabaseModal}
            scheduleItems={scheduleItems}
            onUpdateSchedule={onUpdateSchedule}
            onResetTeamToDefault={onResetTeamToDefault}
          />
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 px-5 py-3 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            เสร็จสิ้น / ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
