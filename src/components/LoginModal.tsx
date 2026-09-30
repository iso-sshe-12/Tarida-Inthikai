import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Mail,
  ShieldCheck,
  UserCheck,
  Shield,
  UserPlus,
  LogIn,
  LogOut,
  Building2,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  ArrowRight,
  Info,
  Check,
  Lock,
} from 'lucide-react';
import { TeamMember, UserRole } from '../types/audit';
import { KRC_AUDIT_DEPARTMENTS } from '../data/auditDepartments';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: TeamMember;
  teamMembers: TeamMember[];
  onLoginWithEmail: (
    email: string,
    perspective?: 'AUDITOR' | 'AUDITEE'
  ) => { success: boolean; message: string; user?: TeamMember };
  onRegisterAndLogin: (member: TeamMember, perspective?: 'AUDITOR' | 'AUDITEE') => void;
  onLogout: () => void;
  currentRoleMode?: 'AUDITOR' | 'AUDITEE';
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  teamMembers,
  onLoginWithEmail,
  onRegisterAndLogin,
  onLogout,
  currentRoleMode = 'AUDITOR',
}) => {
  if (!isOpen) return null;

  const [inputEmail, setInputEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchMember, setSearchMember] = useState('');
  const [directoryRoleFilter, setDirectoryRoleFilter] = useState<'ALL' | 'AUDITOR' | 'AUDITEE'>('ALL');

  // Perspective selection: 'AUDITOR' | 'AUDITEE'
  const [selectedPerspective, setSelectedPerspective] = useState<'AUDITOR' | 'AUDITEE'>('AUDITOR');
  const [userChangedPerspectiveManually, setUserChangedPerspectiveManually] = useState(false);

  // Quick Register State
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('AUDITEE');
  const [regDept, setRegDept] = useState(KRC_AUDIT_DEPARTMENTS[0]?.name || 'IT');
  const [regPerspective, setRegPerspective] = useState<'AUDITOR' | 'AUDITEE'>('AUDITEE');

  // Real-time matched user based on typed email
  const matchedUser = useMemo(() => {
    if (!inputEmail.trim()) return null;
    const clean = inputEmail.trim().toLowerCase();
    return teamMembers.find((m) => m.email.trim().toLowerCase() === clean) || null;
  }, [inputEmail, teamMembers]);

  // Pre-adjust perspective if matched user changes and user hasn't manually overridden
  useEffect(() => {
    if (matchedUser && !userChangedPerspectiveManually) {
      if (matchedUser.role === 'AUDITEE') {
        setSelectedPerspective('AUDITEE');
      } else {
        setSelectedPerspective('AUDITOR');
      }
    }
  }, [matchedUser, userChangedPerspectiveManually]);

  // Handle Login Submit
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!inputEmail.trim()) {
      setErrorMessage('กรุณาระบุอีเมลที่ต้องการเข้าสู่ระบบ');
      return;
    }

    const res = onLoginWithEmail(inputEmail.trim(), selectedPerspective);
    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.message);
      // Auto pre-fill registration email if not found
      setRegEmail(inputEmail.trim());
      setShowRegisterForm(true);
    }
  };

  // Handle 1-Click Login from Directory with chosen perspective
  const handleDirectLogin = (email: string, perspective?: 'AUDITOR' | 'AUDITEE') => {
    const res = onLoginWithEmail(email, perspective || selectedPerspective);
    if (res.success) {
      onClose();
    }
  };

  // Handle Quick Registration & Login
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      setErrorMessage('กรุณากรอกชื่อและอีเมลให้ครบถ้วน');
      return;
    }

    const newMember: TeamMember = {
      id: `user-${Date.now()}`,
      name: regName.trim(),
      email: regEmail.trim().toLowerCase(),
      role: regRole,
      department: regDept,
      avatarBg: regRole === 'AUDITOR' ? 'bg-blue-600' : regRole === 'ADMIN' ? 'bg-indigo-600' : 'bg-emerald-600',
      assignedCategories: ['ALL'],
    };

    onRegisterAndLogin(newMember, regRole === 'ADMIN' ? 'AUDITOR' : regPerspective);
    onClose();
  };

  // Filtered Directory
  const filteredMembers = useMemo(() => {
    return teamMembers.filter((m) => {
      // Role filter
      if (directoryRoleFilter === 'AUDITOR' && m.role !== 'AUDITOR' && m.role !== 'ADMIN') return false;
      if (directoryRoleFilter === 'AUDITEE' && m.role !== 'AUDITEE') return false;

      // Search filter
      if (!searchMember.trim()) return true;
      const q = searchMember.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
      );
    });
  }, [teamMembers, directoryRoleFilter, searchMember]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-5 flex items-start justify-between border-b border-blue-900/50">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-blue-600/30 rounded-xl border border-blue-400/30 text-blue-300 shadow-inner">
              <LogIn className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 border border-blue-400/40 text-blue-300">
                  K.R.C. TRANSPORT &amp; SERVICE
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> ISO 9001 / 14001 / 45001
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
                เข้าสู่ระบบด้วยอีเมล (Email Login &amp; Perspective Selection)
              </h2>
              <p className="text-xs text-blue-200/80">
                กรอกอีเมลและเลือกมุมมองที่ต้องการเข้าใช้งาน: <strong>Auditor (ผู้ตรวจ)</strong> หรือ{' '}
                <strong>Auditee (ผู้รับการตรวจ)</strong> (ยกเว้น Admin เข้าถึงได้ทุกมุมมอง)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Active Session Status */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl text-white font-bold flex items-center justify-center text-base shadow-sm ${
                  currentUser.avatarBg || 'bg-indigo-600'
                }`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-500">บัญชีที่กำลังใช้งาน:</span>
                  <span className="text-sm font-bold text-slate-800">{currentUser.name}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      currentUser.role === 'ADMIN'
                        ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                        : currentUser.role === 'AUDITOR'
                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {currentUser.role === 'ADMIN'
                      ? '👑 ADMIN (QSHE)'
                      : currentUser.role === 'AUDITOR'
                      ? '🛡️ AUDITOR'
                      : '👥 AUDITEE'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-mono">
                    มุมมองปัจจุบัน: {currentRoleMode === 'AUDITOR' ? '🛡️ Auditor' : '👥 Auditee'}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-slate-500">{currentUser.email}</span>
                  <span className="text-slate-300">•</span>
                  <span>{currentUser.department}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 active:scale-98 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>ออกจากระบบ</span>
            </button>
          </div>

          {/* Email Input & Perspective Selection Form */}
          <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 rounded-2xl border border-blue-200 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                เข้าสู่ระบบด้วยอีเมลและเลือกมุมมอง
              </h3>
              <span className="text-[11px] text-blue-700 font-medium">
                K.R.C. Internal Audit Access Control
              </span>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {/* 1. Email Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. ระบุอีเมลของคุณ (Your E-mail):
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={inputEmail}
                    onChange={(e) => {
                      setInputEmail(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="เช่น iso-sshe@krctrans.com หรือ transport.sup@krctrans.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    autoFocus
                  />
                </div>
              </div>

              {/* Matched User Feedback */}
              {matchedUser && (
                <div className="p-3 rounded-xl bg-blue-100/70 border border-blue-300 text-blue-950 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {matchedUser.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-blue-900">
                        พบบัญชี: {matchedUser.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-white text-blue-800 border border-blue-200">
                        ตำแหน่ง: {matchedUser.role}
                      </span>
                      <span className="text-xs text-blue-800">
                        ({matchedUser.department})
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Perspective Selection (Mandatory for non-admin) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span>2. เลือกมุมมองที่ต้องการเข้าใช้งานในรอบนี้ (Select Perspective):</span>
                  </label>
                  {matchedUser?.role === 'ADMIN' && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200">
                      👑 Admin สลับมุมมองได้ตลอดเวลา
                    </span>
                  )}
                </div>

                {matchedUser?.role === 'ADMIN' ? (
                  <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-indigo-900">
                        คุณมีสิทธิ์ผู้ดูแลระบบ (Admin) — เข้าถึงได้ครบทั้งมุมมอง Auditor และ Auditee
                      </span>
                      <p className="text-[11px] text-indigo-700 mt-0.5 leading-relaxed">
                        ระบบจะเริ่มต้นให้คุณเข้าใช้งานในมุมมอง <strong>Auditor</strong> (หรือสามารถกดเลือกมุมมองเริ่มต้นด้านล่างได้) และคุณสามารถสลับมุมมองไป-มาบนแถบ Header ได้อย่างอิสระตลอดเวลา
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    ตามระเบียบ K.R.C. กรุณาเลือกมุมมองที่คุณต้องการปฏิบัติงาน (ตรวจประเมิน หรือ ตอบหลักฐาน):
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Perspective A: Auditor */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPerspective('AUDITOR');
                      setUserChangedPerspectiveManually(true);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 ${
                      selectedPerspective === 'AUDITOR'
                        ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-400/50 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        selectedPerspective === 'AUDITOR'
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {selectedPerspective === 'AUDITOR' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-blue-600" />
                          มุมมอง Auditor (ผู้ตรวจประเมิน)
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded">
                          สำหรับผู้ตรวจ
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        • บันทึกผลการตรวจ (C / MA / MI / OBS / OFI)<br />
                        • เรียกน้องออดิต AI ช่วยวิเคราะห์ข้อบกพร่อง<br />
                        • ออกใบแจ้งข้อบกพร่อง CAR (F-CR-004)
                      </p>
                    </div>
                  </button>

                  {/* Perspective B: Auditee */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPerspective('AUDITEE');
                      setUserChangedPerspectiveManually(true);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 ${
                      selectedPerspective === 'AUDITEE'
                        ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-400/50 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        selectedPerspective === 'AUDITEE'
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {selectedPerspective === 'AUDITEE' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          มุมมอง Auditee (ผู้รับการตรวจ)
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                          สำหรับหน้างาน/ผู้รับเหมา
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        • ตรวจสอบข้อคำถามและข้อกำหนดของฝ่ายตนเอง<br />
                        • พิมพ์คำชี้แจงข้อเท็จจริง และตอบคำถามออดิต<br />
                        • ถ่ายรูป/แนบไฟล์รูปภาพหลักฐานหน้างานจริง
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{errorMessage}</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      คุณสามารถลงทะเบียนอีเมลนี้ด้านล่าง หรือเลือกเข้าสู่ระบบด่วนจากรายชื่อในฐานข้อมูล
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className={`w-full py-2.5 text-white rounded-xl text-xs font-bold transition shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                    selectedPerspective === 'AUDITOR'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>
                    เข้าสู่ระบบใน "มุมมอง{' '}
                    {selectedPerspective === 'AUDITOR' ? 'Auditor (ผู้ตรวจ)' : 'Auditee (ผู้รับการตรวจ)'}
                    " ทันที
                  </span>
                </button>
              </div>
            </form>

            {/* Quick Register Toggle */}
            <div className="pt-3 border-t border-blue-200/80 flex items-center justify-between">
              <span className="text-xs text-slate-600">ยังไม่มีอีเมลในฐานข้อมูล K.R.C.?</span>
              <button
                type="button"
                onClick={() => setShowRegisterForm(!showRegisterForm)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{showRegisterForm ? 'ซ่อนแบบฟอร์มลงทะเบียน' : 'ลงทะเบียนผู้ใช้งานใหม่'}</span>
              </button>
            </div>

            {/* Registration Form Drawer */}
            {showRegisterForm && (
              <form
                onSubmit={handleRegisterSubmit}
                className="p-4 rounded-xl bg-white border border-blue-200 shadow-sm space-y-3 mt-3 animate-in fade-in duration-200"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">
                    ลงทะเบียนผู้ใช้งานใหม่เข้าฐานข้อมูล K.R.C.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ชื่อ - นามสกุล *
                    </label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="เช่น สมศักดิ์ มีสุข"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      อีเมล (Email) *
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="เช่น somsak@krctrans.com"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ตำแหน่งในฐานข้อมูล (Role) *
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="AUDITEE">👥 Auditee (ผู้รับการตรวจ)</option>
                      <option value="AUDITOR">🛡️ Auditor (ผู้ตรวจประเมิน)</option>
                      <option value="ADMIN">👑 Admin (ผู้ดูแลระบบ QSHE)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ฝ่าย / แผนก *
                    </label>
                    <select
                      value={regDept}
                      onChange={(e) => setRegDept(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      {KRC_AUDIT_DEPARTMENTS.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name} ({d.teamShort})
                        </option>
                      ))}
                      <option value="ฝ่าย QSHE & ระบบบริหารคุณภาพ">ฝ่าย QSHE &amp; ระบบบริหารคุณภาพ</option>
                      <option value="ผู้บริหารระดับสูง (Management)">ผู้บริหารระดับสูง (Management)</option>
                      <option value="ผู้รับเหมาช่วงประจำลาน (Contractor P-PU-002)">
                        ผู้รับเหมาช่วงประจำลาน (Contractor P-PU-002)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      มุมมองที่ต้องการเข้าใช้งาน *
                    </label>
                    <select
                      value={regPerspective}
                      onChange={(e) => setRegPerspective(e.target.value as 'AUDITOR' | 'AUDITEE')}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="AUDITOR">🛡️ มุมมอง Auditor</option>
                      <option value="AUDITEE">👥 มุมมอง Auditee</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>บันทึกลงฐานข้อมูลและเข้าสู่ระบบทันที</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Quick 1-Click Directory from Database (With Choice of Auditor or Auditee) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  หรือเลือกเข้าสู่ระบบด่วนจากฐานข้อมูล (เลือกมุมมองได้ทันที)
                </h3>
                <p className="text-xs text-slate-500">
                  คลิกปุ่ม <strong>[Auditor]</strong> หรือ <strong>[Auditee]</strong> ของรายชื่อเพื่อเข้าสู่ระบบในมุมมองนั้นทันที
                </p>
              </div>

              {/* Role Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDirectoryRoleFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    directoryRoleFilter === 'ALL'
                      ? 'bg-white text-slate-800 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  ทั้งหมด ({teamMembers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDirectoryRoleFilter('AUDITOR')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                    directoryRoleFilter === 'AUDITOR'
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-blue-700'
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  <span>Auditor / Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDirectoryRoleFilter('AUDITEE')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                    directoryRoleFilter === 'AUDITEE'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  <UserCheck className="w-3 h-3" />
                  <span>Auditee (15 ฝ่าย)</span>
                </button>
              </div>
            </div>

            {/* Search Box in Directory */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                placeholder="ค้นหาชื่อ, แผนก, หรืออีเมลในฐานข้อมูล..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-400 transition"
              />
            </div>

            {/* Member Cards Grid with Perspective Selection Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {filteredMembers.map((m) => {
                const isCurrent = currentUser.email.toLowerCase() === m.email.toLowerCase();
                const isAdmin = m.role === 'ADMIN';

                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-400'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg text-white font-bold flex items-center justify-center text-xs shrink-0 ${
                          m.avatarBg || 'bg-slate-700'
                        }`}
                      >
                        {m.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {m.name}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                              isAdmin
                                ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                : m.role === 'AUDITOR'
                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {m.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono truncate">{m.email}</p>
                        <p className="text-[10px] text-slate-600 truncate">{m.department}</p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() => handleDirectLogin(m.email, 'AUDITOR')}
                          className="px-2.5 py-1 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
                          title="เข้าสู่ระบบในสิทธิ์ Admin (เข้าถึงได้ทุกมุมมอง)"
                        >
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          <span>Admin เข้าใช้</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDirectLogin(m.email, 'AUDITOR')}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-0.5 shadow-xs"
                            title="เลือกเข้าสู่ระบบในมุมมอง Auditor"
                          >
                            <Shield className="w-3 h-3" />
                            <span>Auditor</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDirectLogin(m.email, 'AUDITEE')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-0.5 shadow-xs"
                            title="เลือกเข้าสู่ระบบในมุมมอง Auditee"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Auditee</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Auditor Friendly & ISO Standard Compliance Footnote */}
          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>หลักเกณฑ์การควบคุมสิทธิ์ตามมาตรฐาน ISO 19011:2018 (Impartiality & Conflict of Interest)</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              • <strong>การเลือกมุมมอง (Perspective Selection):</strong> ผู้ใช้งานสามารถเลือกเข้าใช้งานในมุมมอง <strong>Auditor (ผู้ตรวจ)</strong> เมื่อต้องทำหน้าที่ตรวจประเมิน หรือเลือกมุมมอง <strong>Auditee (ผู้รับการตรวจ)</strong> เมื่อต้องตอบคำถามและส่งหลักฐานของฝ่ายตนเอง
            </p>
            <p className="text-[11px] leading-relaxed">
              • <strong>ข้อยกเว้นสำหรับ Admin (QSHE):</strong> ได้รับสิทธิ์เต็ม (Full Access) ครอบคลุมทั้งสองมุมมอง และสามารถสลับมุมมองบนหน้าจอได้ตลอดเวลาโดยไม่ต้องเลือกตอน Login
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            KRC_Audit_Database_Master v2.5 | Dynamic Perspective Selector
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 active:scale-98 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
