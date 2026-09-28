import React, { useState } from 'react';
import {
  X,
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
} from 'lucide-react';
import { TeamMember, UserRole, AuditItem } from '../types/audit';

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  onUpdateTeamMembers: (members: TeamMember[]) => void;
  items: AuditItem[];
  onBulkAssign: (
    categoryCode: string,
    auditorId: string,
    auditorName: string,
    auditeeId: string,
    auditeeName: string
  ) => void;
  currentUser: TeamMember;
  onSwitchCurrentUser: (user: TeamMember) => void;
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
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'ASSIGN'>('MEMBERS');

  // New Member Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('AUDITEE');

  // Bulk Assign State
  const [assignCategory, setAssignCategory] = useState<string>('ALL');
  const [selectedAuditorId, setSelectedAuditorId] = useState<string>('');
  const [selectedAuditeeId, setSelectedAuditeeId] = useState<string>('');
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  // Available unique categories
  const categories = Array.from(
    new Set(items.map((i) => `${i.categoryCode}:::${i.categoryTitle}`))
  ).map((entry) => {
    const [code, title] = entry.split(':::');
    return { code, title };
  });

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
      department: newDept.trim() || 'หน่วยงานทั่วไป',
      role: newRole,
      avatarBg:
        newRole === 'ADMIN'
          ? 'bg-indigo-600'
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

  const handleDeleteMember = (id: string) => {
    if (teamMembers.length <= 1) {
      alert('ต้องมีสมาชิกในระบบอย่างน้อย 1 คน');
      return;
    }
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสมาชิกท่านนี้?')) {
      onUpdateTeamMembers(teamMembers.filter((m) => m.id !== id));
    }
  };

  const handleExecuteBulkAssign = () => {
    const auditor = teamMembers.find((m) => m.id === selectedAuditorId);
    const auditee = teamMembers.find((m) => m.id === selectedAuditeeId);

    if (!selectedAuditorId && !selectedAuditeeId) {
      alert('กรุณาเลือกผู้ตรวจ (Auditor) หรือผู้รับการตรวจ (Auditee) อย่างน้อย 1 ท่าน');
      return;
    }

    onBulkAssign(
      assignCategory,
      auditor?.id || '',
      auditor?.name || '',
      auditee?.id || '',
      auditee?.name || ''
    );

    setAssignSuccess(
      `มอบหมายสำเร็จ: ${assignCategory === 'ALL' ? 'ทุกหมวด' : `หมวด ${assignCategory}`} ให้ Auditor [${auditor?.name || '-'}] และ Auditee [${auditee?.name || '-'}]`
    );
    setTimeout(() => setAssignSuccess(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-5 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wide">
                Role & Team Management
              </span>
              <span className="text-xs text-blue-200">
                ผู้ใช้งานปัจจุบัน: <strong>{currentUser.name}</strong> ({currentUser.role})
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold">
              จัดการทีม Auditor & Auditee และกำหนดสิทธิ์การเข้าถึง
            </h2>
            <p className="text-xs text-slate-300">
              ระบุผู้ตรวจและผู้รับการตรวจในแต่ละหมวด มอบหมายหน้าที่ และจำลองการสลับผู้ใช้งาน (Simulate User Persona)
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('MEMBERS')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'MEMBERS'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>1. รายชื่อทีมและสิทธิ์ ({teamMembers.length} คน)</span>
          </button>

          <button
            onClick={() => setActiveTab('ASSIGN')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'ASSIGN'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowRight className="w-4 h-4 text-emerald-600" />
            <span>2. มอบหมายข้อตรวจตามหมวด (Bulk Assignment)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* TAB 1: MEMBERS */}
          {activeTab === 'MEMBERS' && (
            <div className="space-y-4">
              {/* Quick switch active user */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-700" />
                    <span>จำลองการเข้าสู่ระบบในฐานะ (Current Active Persona):</span>
                  </span>
                  <span className="text-[11px] text-blue-700">
                    คลิกเพื่อทดสอบสิทธิ์ของแต่ละคนทันที
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {teamMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => onSwitchCurrentUser(member)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                        currentUser.id === member.id
                          ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400'
                          : 'bg-white text-slate-700 hover:bg-blue-100/50 border border-slate-300'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          member.role === 'ADMIN'
                            ? 'bg-purple-400'
                            : member.role === 'AUDITOR'
                            ? 'bg-blue-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                      <span>{member.name}</span>
                      <span className="text-[10px] opacity-75 font-mono">
                        ({member.role})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Members List Header & Add Button */}
              <div className="flex items-center justify-between pt-2">
                <h3 className="font-bold text-slate-800 text-sm">
                  สมาชิกทีมตรวจติดตามภายใน K.R.C.
                </h3>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{showAddForm ? 'ปิดแบบฟอร์ม' : 'เพิ่มสมาชิกใหม่'}</span>
                </button>
              </div>

              {/* Add Member Form */}
              {showAddForm && (
                <form
                  onSubmit={handleAddMember}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fadeIn"
                >
                  <span className="font-bold text-slate-800 block text-xs">
                    เพิ่มข้อมูล Auditor หรือ Auditee เข้าสู่ระบบ:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        ชื่อ-นามสกุล:
                      </label>
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="เช่น สมพร ชัยมงคล"
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        อีเมล (สำหรับส่งแจ้งเตือน CAR/ผลตรวจ):
                      </label>
                      <input
                        type="email"
                        required
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="somporn@krctrans.com"
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        แผนก / สังกัด:
                      </label>
                      <input
                        type="text"
                        value={newDept}
                        onChange={(e) => setNewDept(e.target.value)}
                        placeholder="เช่น แผนกลานตู้, แผนกซ่อมบำรุง, ผู้รับเหมา"
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        บทบาทและสิทธิ์ (Role):
                      </label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800"
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
                      className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-lg text-xs"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                    >
                      บันทึกสมาชิก
                    </button>
                  </div>
                </form>
              )}

              {/* Members Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">ชื่อ-นามสกุล</th>
                      <th className="py-2.5 px-3">บทบาทและสิทธิ์</th>
                      <th className="py-2.5 px-3">แผนก/สังกัด</th>
                      <th className="py-2.5 px-3">อีเมลรับการแจ้งเตือน</th>
                      <th className="py-2.5 px-3 text-center">สิทธิ์ที่ทำได้</th>
                      <th className="py-2.5 px-3 text-center">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teamMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-xs ${
                                m.avatarBg || 'bg-slate-600'
                              }`}
                            >
                              {m.name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{m.name}</span>
                              {currentUser.id === m.id && (
                                <span className="text-[10px] text-blue-600 font-semibold">
                                  ● กำลังใช้งานอยู่
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
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
                        <td className="py-2.5 px-3 text-slate-600">{m.department}</td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                          {m.email}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-600">
                          {m.role === 'ADMIN' && 'จัดการทุกอย่าง + อนุมัติ CAR + ตั้งค่า'}
                          {m.role === 'AUDITOR' && 'ตรวจประเมิน + ให้ผล C/NC + ออก CAR'}
                          {m.role === 'AUDITEE' && 'ตอบข้อซักถาม + แนบรูปหลักฐาน + ร่าง CAP'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleDeleteMember(m.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="ลบสมาชิกนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: BULK ASSIGN */}
          {activeTab === 'ASSIGN' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>มอบหมายทีมผู้ตรวจและผู้รับการตรวจแบบกลุ่ม (Category Delegation):</span>
                </span>
                <p className="text-[11px] text-emerald-800">
                  เลือกหมวดการตรวจ และระบุว่าข้อตรวจในหมวดนั้นจะต้องตรวจโดยใคร (Auditor) และให้ใครเป็นผู้ตอบ/แนบหลักฐาน (Auditee)
                  ระบบจะบันทึกชื่อผู้รับผิดชอบลงใน Checklist ทุกข้อในหมวดนั้นอัตโนมัติ
                </p>
              </div>

              {assignSuccess && (
                <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>{assignSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                {/* 1. Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    1. เลือกหมวดการตรวจ:
                  </label>
                  <select
                    value={assignCategory}
                    onChange={(e) => setAssignCategory(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium text-xs text-slate-800"
                  >
                    <option value="ALL">★ ทุกหมวด ({items.length} ข้อ)</option>
                    {categories.map((c) => (
                      <option key={c.code} value={c.code}>
                        หมวด {c.code}: {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Auditor */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    2. มอบหมายผู้ตรวจ (Auditor):
                  </label>
                  <select
                    value={selectedAuditorId}
                    onChange={(e) => setSelectedAuditorId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium text-xs text-blue-900"
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

                {/* 3. Auditee */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    3. มอบหมายผู้รับการตรวจ (Auditee):
                  </label>
                  <select
                    value={selectedAuditeeId}
                    onChange={(e) => setSelectedAuditeeId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium text-xs text-emerald-900"
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

              <button
                type="button"
                onClick={handleExecuteBulkAssign}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>บันทึกการมอบหมายข้อตรวจตามหมวดที่เลือก</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:px-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
