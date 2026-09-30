import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  Shield,
  UserPlus,
  Mail,
  Building,
  CheckCircle2,
  Trash2,
  Edit2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  User,
  Database,
  Building2,
  Calendar,
  Clock,
  Search,
  Filter,
  RotateCcw,
  Check,
  X,
  FileCheck,
} from 'lucide-react';
import { TeamMember, UserRole, AuditItem, AuditPlanEntry } from '../types/audit';
import { KRC_AUDIT_DEPARTMENTS } from '../data/auditDepartments';
import { DEFAULT_TEAM_MEMBERS } from '../data/teamMembersData';

interface TeamManagementTabProps {
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

export const TeamManagementTab: React.FC<TeamManagementTabProps> = ({
  teamMembers,
  onUpdateTeamMembers,
  items,
  onBulkAssign,
  currentUser,
  onSwitchCurrentUser,
  onOpenDatabaseModal,
  scheduleItems = [],
  onUpdateSchedule,
  onResetTeamToDefault,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'MEMBERS' | 'ASSIGN' | 'RBAC'>('MEMBERS');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');

  // Add Member State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('AUDITEE');

  // Edit Member State
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('AUDITEE');

  // Bulk Assign State
  const [assignDept, setAssignDept] = useState<string>('ALL');
  const [selectedAuditorId, setSelectedAuditorId] = useState<string>('');
  const [selectedAuditeeId, setSelectedAuditeeId] = useState<string>('');
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  // Quick Assign Modal for specific department
  const [quickAssignDept, setQuickAssignDept] = useState<string | null>(null);

  // 1. Add Member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      alert('กรุณากรอกชื่อและอีเมลให้ครบถ้วน');
      return;
    }

    const newMember: TeamMember = {
      id: `user-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim(),
      department: newDept.trim() || 'หน่วยงานทั่วไป (KRC)',
      role: newRole,
      avatarBg:
        newRole === 'ADMIN'
          ? 'bg-purple-600'
          : newRole === 'AUDITOR'
          ? 'bg-blue-600'
          : 'bg-emerald-600',
    };

    onUpdateTeamMembers([...teamMembers, newMember]);
    setNewName('');
    setNewEmail('');
    setNewDept('');
    setShowAddForm(false);
  };

  // 2. Start Edit Member
  const handleStartEdit = (member: TeamMember) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditEmail(member.email);
    setEditDept(member.department);
    setEditRole(member.role);
  };

  // 3. Save Edit Member
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!editName.trim() || !editEmail.trim()) {
      alert('กรุณากรอกชื่อและอีเมลให้ครบถ้วน');
      return;
    }

    const updatedMembers = teamMembers.map((m) =>
      m.id === editingMember.id
        ? {
            ...m,
            name: editName.trim(),
            email: editEmail.trim(),
            department: editDept.trim() || m.department,
            role: editRole,
            avatarBg:
              editRole === 'ADMIN'
                ? 'bg-purple-600'
                : editRole === 'AUDITOR'
                ? 'bg-blue-600'
                : 'bg-emerald-600',
          }
        : m
    );

    onUpdateTeamMembers(updatedMembers);

    // If edited current active user, update persona
    if (currentUser.id === editingMember.id) {
      onSwitchCurrentUser({
        ...currentUser,
        name: editName.trim(),
        email: editEmail.trim(),
        department: editDept.trim(),
        role: editRole,
      });
    }

    setEditingMember(null);
  };

  // 4. Delete Member
  const handleDeleteMember = (id: string) => {
    if (teamMembers.length <= 1) {
      alert('ต้องมีสมาชิกในระบบอย่างน้อย 1 คน');
      return;
    }
    const target = teamMembers.find((m) => m.id === id);
    if (confirm(`คุณต้องการลบสมาชิก "${target?.name || id}" ออกจากระบบใช่หรือไม่?`)) {
      const remaining = teamMembers.filter((m) => m.id !== id);
      onUpdateTeamMembers(remaining);
      if (currentUser.id === id) {
        onSwitchCurrentUser(remaining[0]);
      }
    }
  };

  // 5. Reset Team to Defaults
  const handleResetTeam = () => {
    if (confirm('คุณต้องการรีเซ็ตรายชื่อทีม Auditor & Auditee กลับเป็นค่าเริ่มต้นมาตรฐาน K.R.C. ใช่หรือไม่?')) {
      if (onResetTeamToDefault) {
        onResetTeamToDefault();
      } else {
        onUpdateTeamMembers(DEFAULT_TEAM_MEMBERS);
        onSwitchCurrentUser(DEFAULT_TEAM_MEMBERS[0]);
      }
    }
  };

  // 6. Execute Bulk Assign by Department
  const handleExecuteBulkAssign = (deptTarget: string = assignDept) => {
    const auditor = teamMembers.find((m) => m.id === selectedAuditorId);
    const auditee = teamMembers.find((m) => m.id === selectedAuditeeId);

    if (!selectedAuditorId && !selectedAuditeeId) {
      alert('กรุณาเลือกผู้ตรวจ (Auditor) หรือผู้รับการตรวจ (Auditee) อย่างน้อย 1 ท่าน');
      return;
    }

    onBulkAssign(
      deptTarget,
      auditor?.id || '',
      auditor?.name || '',
      auditee?.id || '',
      auditee?.name || ''
    );

    const targetLabel = deptTarget === 'ALL' ? 'ทุกฝ่าย/แผนก' : `ฝ่าย "${deptTarget}"`;
    setAssignSuccess(
      `✓ มอบหมายสำเร็จ: ${targetLabel} -> Auditor [${auditor?.name || '-'}] | Auditee [${auditee?.name || '-'}]`
    );
    setTimeout(() => setAssignSuccess(null), 4000);
    setQuickAssignDept(null);
  };

  // Filtered members list
  const filteredMembers = teamMembers.filter((m) => {
    if (roleFilter !== 'ALL' && m.role !== roleFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate department stats
  const deptStats = KRC_AUDIT_DEPARTMENTS.map((dept) => {
    const deptItems = items.filter((it) => (it.department || '') === dept.id);
    const assignedAuditor = deptItems.find((it) => it.assignedAuditorName)?.assignedAuditorName;
    const assignedAuditee = deptItems.find((it) => it.assignedAuditeeName)?.assignedAuditeeName;

    // From schedule if available
    const scheduleEntry = scheduleItems.find(
      (s) => s.department.includes(dept.id) || dept.name.includes(s.department)
    );

    return {
      dept,
      itemCount: deptItems.length,
      auditor: assignedAuditor || scheduleEntry?.leadAuditor || dept.team,
      auditee: assignedAuditee || scheduleEntry?.auditeeName || 'ตัวแทนหน่วยงาน ' + dept.name,
    };
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header Banner & Team Statistics */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-5 sm:p-6 rounded-2xl shadow-md border border-indigo-500/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wide">
                K.R.C. Team &amp; Role Management
              </span>
              <span className="text-xs text-blue-200">
                ผู้ใช้งานปัจจุบัน: <strong>{currentUser.name}</strong> ({currentUser.role})
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <Users className="w-6 h-6 text-indigo-400 inline" />
              <span>จัดการทีมผู้ตรวจ (Auditor) และผู้รับการตรวจ (Auditee)</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              กำหนดรายชื่อคณะผู้ตรวจประเมิน Lead Auditor, ตัวแทนผู้รับการตรวจหน้างาน (Auditee), ผู้ดูแลระบบ QSHE และมอบหมายความรับผิดชอบแยกตาม 15 ฝ่ายของ K.R.C.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setShowAddForm(true);
                setActiveSubTab('MEMBERS');
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4 text-indigo-200" />
              <span>+ เพิ่มสมาชิกใหม่</span>
            </button>

            <button
              onClick={handleResetTeam}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              title="รีเซ็ตกลับเป็นรายชื่อมาตรฐาน K.R.C."
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>รีเซ็ตทีมมาตรฐาน</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-indigo-900/60">
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs border border-white/10">
            <span className="text-[11px] text-slate-300 block">สมาชิกทั้งหมด</span>
            <span className="text-xl font-black text-white">{teamMembers.length} คน</span>
          </div>
          <div className="bg-purple-950/40 rounded-xl p-3 border border-purple-500/30">
            <span className="text-[11px] text-purple-200 block">QSHE Admin / ผู้บริหาร</span>
            <span className="text-xl font-black text-purple-300">
              {teamMembers.filter((m) => m.role === 'ADMIN').length} คน
            </span>
          </div>
          <div className="bg-blue-950/40 rounded-xl p-3 border border-blue-500/30">
            <span className="text-[11px] text-blue-200 block">Lead Auditor / ผู้ตรวจ</span>
            <span className="text-xl font-black text-blue-300">
              {teamMembers.filter((m) => m.role === 'AUDITOR').length} คน
            </span>
          </div>
          <div className="bg-emerald-950/40 rounded-xl p-3 border border-emerald-500/30">
            <span className="text-[11px] text-emerald-200 block">Auditee หน้างาน</span>
            <span className="text-xl font-black text-emerald-300">
              {teamMembers.filter((m) => m.role === 'AUDITEE').length} คน
            </span>
          </div>
        </div>
      </div>

      {/* 2. Persona Switcher (จำลองการเข้าสู่ระบบ) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-900 text-xs sm:text-sm">
              จำลองการเข้าสู่ระบบในฐานะ (Simulate Persona):
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            คลิกที่ชื่อเพื่อทดสอบมุมมองและสิทธิ์จริงของแต่ละตำแหน่งทันที
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {teamMembers.map((member) => {
            const isActive = currentUser.id === member.id;
            return (
              <button
                key={member.id}
                onClick={() => onSwitchCurrentUser(member)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md ring-2 ring-blue-500 scale-102'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full text-[10px] text-white flex items-center justify-center font-bold ${
                    member.avatarBg || 'bg-slate-600'
                  }`}
                >
                  {member.name.charAt(0)}
                </div>
                <span>{member.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : member.role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-800'
                      : member.role === 'AUDITOR'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {member.role}
                </span>
                {isActive && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Sub-Tabs Header */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-5 pt-3 gap-2 overflow-x-auto shadow-xs">
        <button
          onClick={() => setActiveSubTab('MEMBERS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'MEMBERS'
              ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-xs'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-600" />
          <span>1. รายชื่อทีมและสิทธิ์ ({teamMembers.length} คน)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ASSIGN')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'ASSIGN'
              ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-xs'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>2. มอบหมายผู้ตรวจและ Auditee 15 ฝ่าย (Department Matrix)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('RBAC')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'RBAC'
              ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-xs'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4 text-purple-600" />
          <span>3. สิทธิ์และการลงนาม ISO (RBAC &amp; Signatories)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: MEMBERS LIST                                                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'MEMBERS' && (
        <div className="bg-white p-5 sm:p-6 rounded-b-2xl border border-slate-200 border-t-0 space-y-5 shadow-sm">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, แผนก, หรืออีเมล..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              {/* Role filter buttons */}
              <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setRoleFilter('ALL')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    roleFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  ทั้งหมด ({teamMembers.length})
                </button>
                <button
                  onClick={() => setRoleFilter('AUDITOR')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    roleFilter === 'AUDITOR' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Auditor ({teamMembers.filter((m) => m.role === 'AUDITOR').length})
                </button>
                <button
                  onClick={() => setRoleFilter('AUDITEE')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    roleFilter === 'AUDITEE' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Auditee ({teamMembers.filter((m) => m.role === 'AUDITEE').length})
                </button>
                <button
                  onClick={() => setRoleFilter('ADMIN')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    roleFilter === 'ADMIN' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Admin ({teamMembers.filter((m) => m.role === 'ADMIN').length})
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>{showAddForm ? 'ปิดฟอร์มเพิ่มสมาชิก' : '+ เพิ่มสมาชิกใหม่'}</span>
            </button>
          </div>

          {/* Add Member Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddMember}
              className="p-4 sm:p-5 bg-gradient-to-br from-indigo-50/60 to-blue-50/40 border border-indigo-200 rounded-2xl space-y-3.5 animate-fadeIn"
            >
              <div className="flex items-center justify-between pb-2 border-b border-indigo-200/60">
                <span className="font-bold text-indigo-950 text-xs sm:text-sm flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  <span>เพิ่มข้อมูล Auditor หรือ Auditee เข้าสู่ระบบ:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                >
                  ✕ ปิด
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    ชื่อ-นามสกุล *:
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="เช่น สมพร ชัยมงคล"
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    อีเมลรับแจ้งเตือน CAR/ผลตรวจ *:
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="somporn@krctrans.com"
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    แผนก / ฝ่ายสังกัด:
                  </label>
                  <input
                    type="text"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    placeholder="เช่น Transport, ลานตู้, QSHE"
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    บทบาทและสิทธิ์ (Role) *:
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="AUDITEE">Auditee (ผู้รับการตรวจ - ตอบและส่งหลักฐาน)</option>
                    <option value="AUDITOR">Auditor (ผู้ตรวจประเมิน - ประเมินและออก CAR)</option>
                    <option value="ADMIN">Admin / QSHE Manager (ผู้ดูแลระบบสูงสุด)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  บันทึกสมาชิกใหม่
                </button>
              </div>
            </form>
          )}

          {/* Members Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white uppercase font-bold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">ชื่อ-นามสกุล</th>
                  <th className="py-3 px-3">บทบาทและสิทธิ์ (Role)</th>
                  <th className="py-3 px-3">แผนก / สังกัด</th>
                  <th className="py-3 px-3">อีเมลรับการแจ้งเตือน</th>
                  <th className="py-3 px-3">สิทธิ์ในระบบ K.R.C.</th>
                  <th className="py-3 px-3 text-center w-28">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((m) => {
                  const isCurrent = currentUser.id === m.id;
                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isCurrent ? 'bg-blue-50/40 border-l-4 border-l-blue-600' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-xs ${
                              m.avatarBg || 'bg-slate-600'
                            }`}
                          >
                            {m.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                              {m.name}
                            </span>
                            {isCurrent && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 font-bold bg-blue-100 px-1.5 py-0.2 rounded mt-0.5">
                                ● บัญชีกำลังใช้งาน
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                            m.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : m.role === 'AUDITOR'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {m.role === 'ADMIN' && 'QSHE Admin'}
                          {m.role === 'AUDITOR' && 'Lead Auditor'}
                          {m.role === 'AUDITEE' && 'Auditee (หน้างาน)'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-700 font-medium">{m.department}</td>

                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                        {m.email}
                      </td>

                      <td className="py-3 px-3 text-[11px] text-slate-600">
                        {m.role === 'ADMIN' && 'จัดการระบบทั้งหมด + อนุมัติ CAR + จัดการทีม + ฐานข้อมูล'}
                        {m.role === 'AUDITOR' && 'ตรวจประเมิน + ตัดสินผล C/NC + ออกใบ CAR/CAP'}
                        {m.role === 'AUDITEE' && 'ตอบข้อซักถาม + แนบรูปหลักฐานหน้างาน + ชี้แจงผล'}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleStartEdit(m)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="แก้ไขข้อมูลสมาชิกนี้"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(m.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="ลบสมาชิกนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: DEPARTMENT DELEGATION MATRIX (15 ฝ่าย)                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'ASSIGN' && (
        <div className="bg-white p-5 sm:p-6 rounded-b-2xl border border-slate-200 border-t-0 space-y-5 shadow-sm">
          {/* Banner */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-emerald-900 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>มอบหมายผู้ตรวจ (Auditor) และผู้รับการตรวจ (Auditee) แยกตาม 15 ฝ่าย:</span>
            </span>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              เลือกฝ่าย/แผนกที่ต้องการมอบหมาย จากนั้นเลือกผู้ตรวจประเมิน และผู้รับผิดชอบหน้างาน ระบบจะบันทึกชื่อผู้ตรวจและ Auditee ลงในข้อตรวจทุกข้อของฝ่ายนั้น และอัปเดตลงในตารางออดิต (Audit Schedule Plan) โดยอัตโนมัติ
            </p>
          </div>

          {assignSuccess && (
            <div className="p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{assignSuccess}</span>
            </div>
          )}

          {/* Bulk Assign Control Box */}
          <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <span className="font-bold text-slate-800 text-xs block">
              เครื่องมือมอบหมายงานด่วน (Quick Assignment Tool):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  1. เลือกฝ่าย/แผนกเป้าหมาย:
                </label>
                <select
                  value={assignDept}
                  onChange={(e) => setAssignDept(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">🌐 ทุกฝ่าย / รวมทั้งหมด (Global Delegation)</option>
                  {KRC_AUDIT_DEPARTMENTS.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      🏢 {dept.name} ({dept.teamShort})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  2. มอบหมายผู้ตรวจ (Lead Auditor):
                </label>
                <select
                  value={selectedAuditorId}
                  onChange={(e) => setSelectedAuditorId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-blue-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- ไม่เปลี่ยนแปลง / ตามเดิม --</option>
                  {teamMembers
                    .filter((m) => m.role === 'AUDITOR' || m.role === 'ADMIN')
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.department})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  3. มอบหมายผู้รับการตรวจ (Auditee หน้างาน):
                </label>
                <select
                  value={selectedAuditeeId}
                  onChange={(e) => setSelectedAuditeeId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- ไม่เปลี่ยนแปลง / ตามเดิม --</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => handleExecuteBulkAssign()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 text-indigo-200" />
                <span>บันทึกการมอบหมายฝ่ายที่เลือก</span>
              </button>
            </div>
          </div>

          {/* 15 Departments Delegation Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white uppercase font-bold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-3 w-16 text-center">ทีม</th>
                  <th className="py-3 px-4 min-w-[160px]">ฝ่าย / แผนก (15 ฝ่าย)</th>
                  <th className="py-3 px-3">กำหนดการตรวจ</th>
                  <th className="py-3 px-3 min-w-[180px]">คณะผู้ตรวจ (Auditor Team)</th>
                  <th className="py-3 px-3 min-w-[180px]">ผู้รับการตรวจ (Auditee หน้างาน)</th>
                  <th className="py-3 px-3 w-24 text-center">ข้อตรวจ</th>
                  <th className="py-3 px-3 w-28 text-center">การมอบหมาย</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deptStats.map(({ dept, itemCount, auditor, auditee }) => (
                  <tr key={dept.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 text-center align-top font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${dept.badgeColor}`}>
                        {dept.teamShort}
                      </span>
                    </td>

                    <td className="py-3 px-4 align-top">
                      <div className="font-bold text-slate-900">{dept.name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {dept.id}</span>
                    </td>

                    <td className="py-3 px-3 align-top text-slate-600">
                      <div className="flex items-center gap-1 font-semibold text-slate-800">
                        <Calendar className="w-3 h-3 text-indigo-600" />
                        <span>{dept.date}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{dept.time}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 align-top">
                      <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-200 text-blue-950 font-semibold text-[11px]">
                        {auditor}
                      </div>
                    </td>

                    <td className="py-3 px-3 align-top">
                      <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-950 font-semibold text-[11px]">
                        {auditee}
                      </div>
                    </td>

                    <td className="py-3 px-3 align-top text-center font-mono">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          itemCount > 0
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {itemCount} ข้อ
                      </span>
                    </td>

                    <td className="py-3 px-3 align-top text-center">
                      <button
                        onClick={() => {
                          setAssignDept(dept.id);
                          setQuickAssignDept(dept.id);
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-[11px] font-bold border border-slate-300 hover:border-indigo-300 transition cursor-pointer"
                      >
                        มอบหมาย
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: RBAC & SIGNATORIES GUIDE                                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'RBAC' && (
        <div className="bg-white p-5 sm:p-6 rounded-b-2xl border border-slate-200 border-t-0 space-y-6 shadow-sm text-xs">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              <span>โครงสร้างสิทธิ์การเข้าถึงและการลงนามในระบบ K.R.C. (RBAC Matrix)</span>
            </h3>
            <p className="text-slate-600 leading-relaxed">
              เพื่อให้การตรวจติดตามภายในและหลักฐานเชิงระบบสอดคล้องตามมาตรฐาน ISO 9001/14001/45001 ข้อ 5.3 (Organizational roles, responsibilities and authorities) และระเบียบปฏิบัติงาน P-PU-001/002
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-purple-900 text-sm">
                <span className="p-1 rounded bg-purple-200 text-purple-800">1</span>
                <span>QSHE Admin / Top Management</span>
              </div>
              <ul className="space-y-1.5 text-slate-700 leading-relaxed text-[11px]">
                <li>&bull; จัดการรายชื่อทีมงาน และกำหนดสิทธิ์ผู้ตรวจทั้งหมด</li>
                <li>&bull; ลงนามอนุมัติปิดใบ CAR (Approved by President/CEO)</li>
                <li>&bull; ทบทวนรายงานผลตรวจภาพรวม (Reviewed by QSHE Manager)</li>
                <li>&bull; เข้าถึงและกำหนดค่าเชื่อมต่อฐานข้อมูล Google Sheets</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
                <span className="p-1 rounded bg-blue-200 text-blue-800">2</span>
                <span>Lead Auditor (คณะผู้ตรวจ)</span>
              </div>
              <ul className="space-y-1.5 text-slate-700 leading-relaxed text-[11px]">
                <li>&bull; ตรวจประเมินข้อคำถาม และสุ่มตรวจหลักฐานหน้างาน</li>
                <li>&bull; ตัดสินผล Conforming (C) หรือ Non-conformance (Major/Minor/OBS)</li>
                <li>&bull; ใช้งาน "น้องออดิต AI" เพื่อวิเคราะห์หลักฐานและร่างข้อความ CAR</li>
                <li>&bull; ออกใบ CAR และระบุมาตรการแก้ไขที่ต้องการ (Prepared by Auditor)</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                <span className="p-1 rounded bg-emerald-200 text-emerald-800">3</span>
                <span>Auditee (ผู้รับการตรวจ / หน้างาน)</span>
              </div>
              <ul className="space-y-1.5 text-slate-700 leading-relaxed text-[11px]">
                <li>&bull; ตอบข้อซักถาม ชี้แจงข้อเท็จจริง และถ่ายภาพหลักฐานหน้างานจริง</li>
                <li>&bull; เสนอแนวทางแก้ไขและป้องกัน (Proposed by Supervisor)</li>
                <li>&bull; ผู้รับเหมา/Supplier มีสิทธิ์ลงนามเพียงช่อง "Acknowledged by vendor" เพื่อรับทราบผลเท่านั้น</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 4. Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  แก้ไขข้อมูลสมาชิก: {editingMember.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อ-นามสกุล:</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  อีเมลรับแจ้งเตือน (CAR &amp; Findings):
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">แผนก / สังกัด:</label>
                <input
                  type="text"
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  บทบาทและสิทธิ์ (Role):
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="AUDITEE">Auditee (ผู้รับการตรวจ - ตอบและส่งหลักฐาน)</option>
                  <option value="AUDITOR">Auditor (ผู้ตรวจประเมิน - ประเมินและออก CAR)</option>
                  <option value="ADMIN">Admin / QSHE Manager (ผู้ดูแลระบบสูงสุด)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
