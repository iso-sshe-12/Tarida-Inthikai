import React, { useState } from 'react';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageSquare,
  Mail,
  User,
  Building,
  FileText,
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Calendar,
  XCircle,
  Eye,
} from 'lucide-react';
import { AuditItem, CapData, CarStatus, UserRole } from '../types/audit';

interface CarTrackerTabProps {
  items: AuditItem[];
  onOpenCarModal: (item: AuditItem) => void;
  onSendNotification: (
    channel: 'GOOGLE_CHAT' | 'EMAIL',
    item: AuditItem,
    car: CapData
  ) => Promise<void>;
  currentUserRole: UserRole;
  onUpdateItem: (item: AuditItem) => void;
}

export const CarTrackerTab: React.FC<CarTrackerTabProps> = ({
  items,
  onOpenCarModal,
  onSendNotification,
  currentUserRole,
  onUpdateItem,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sendingCarNo, setSendingCarNo] = useState<string | null>(null);

  // Filter items that have CAR or require CAR
  const carItems = items.filter(
    (i) => i.capData || i.capRequired || i.status === 'MA' || i.status === 'MI'
  );

  // Stats calculation
  const totalCars = carItems.length;
  const issuedCars = carItems.filter(
    (i) => !i.capData || i.capData.status === 'ISSUED' || i.capData.status === 'DRAFT'
  ).length;
  const waitingAuditee = carItems.filter(
    (i) => i.capData?.status === 'WAITING_AUDITEE'
  ).length;
  const submittedCars = carItems.filter(
    (i) => i.capData?.status === 'AUDITEE_SUBMITTED'
  ).length;
  const verifiedCars = carItems.filter(
    (i) => i.capData?.status === 'VERIFIED'
  ).length;
  const closedCars = carItems.filter(
    (i) => i.capData?.status === 'CLOSED'
  ).length;

  // Filtered list
  const filteredCarItems = carItems.filter((item) => {
    const car = item.capData;
    const currentStatus = car?.status || 'ISSUED';

    if (statusFilter !== 'ALL' && currentStatus !== statusFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCarNo = (car?.carNo || '').toLowerCase().includes(q);
      const matchPerson = (car?.personInCharge || '').toLowerCase().includes(q);
      const matchQuestion = item.question.toLowerCase().includes(q);
      const matchReq = item.requirement.toLowerCase().includes(q);
      return matchCarNo || matchPerson || matchQuestion || matchReq;
    }

    return true;
  });

  const handleSendAlert = async (
    channel: 'GOOGLE_CHAT' | 'EMAIL',
    item: AuditItem,
    car: CapData
  ) => {
    setSendingCarNo(car.carNo);
    try {
      await onSendNotification(channel, item, car);
    } finally {
      setSendingCarNo(null);
    }
  };

  const handleQuickStatusChange = (item: AuditItem, newStatus: CarStatus) => {
    if (!item.capData) return;
    const updatedCap: CapData = {
      ...item.capData,
      status: newStatus,
    };
    onUpdateItem({
      ...item,
      capData: updatedCap,
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
          }`}
        >
          <span className="text-[10px] font-bold block uppercase opacity-75">
            ใบ CAR ทั้งหมด
          </span>
          <span className="text-xl font-black">{totalCars}</span>
        </div>

        <div
          onClick={() => setStatusFilter('ISSUED')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'ISSUED'
              ? 'bg-rose-700 text-white shadow-md'
              : 'bg-white border-rose-200 text-rose-900 hover:bg-rose-50/50'
          }`}
        >
          <span className="text-[10px] font-bold block uppercase opacity-80">
            ออกใบ CAR ใหม่
          </span>
          <span className="text-xl font-black">{issuedCars}</span>
        </div>

        <div
          onClick={() => setStatusFilter('WAITING_AUDITEE')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'WAITING_AUDITEE'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white border-amber-200 text-amber-900 hover:bg-amber-50/50'
          }`}
        >
          <span className="text-[10px] font-bold block uppercase opacity-80">
            รอ Auditee ส่งแผน
          </span>
          <span className="text-xl font-black">{waitingAuditee}</span>
        </div>

        <div
          onClick={() => setStatusFilter('AUDITEE_SUBMITTED')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'AUDITEE_SUBMITTED'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white border-blue-200 text-blue-900 hover:bg-blue-50/50'
          }`}
        >
          <span className="text-[10px] font-bold block uppercase opacity-80">
            Auditee ส่งแผนแล้ว
          </span>
          <span className="text-xl font-black">{submittedCars}</span>
        </div>

        <div
          onClick={() => setStatusFilter('VERIFIED')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'VERIFIED'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white border-purple-200 text-purple-900 hover:bg-purple-50/50'
          }`}
        >
          <span className="text-[10px] font-bold block uppercase opacity-80">
            ตรวจหลักฐานแล้ว
          </span>
          <span className="text-xl font-black">{verifiedCars}</span>
        </div>

        <div
          onClick={() => setStatusFilter('CLOSED')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'CLOSED'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white border-emerald-200 text-emerald-900 hover:bg-emerald-50/50'
          }`}
        >
          <span className="text-[10px] font-bold block uppercase opacity-80">
            ปิด CAR สมบูรณ์
          </span>
          <span className="text-xl font-black">{closedCars}</span>
        </div>
      </div>

      {/* Control Bar & Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                ระบบติดตามใบแจ้งข้อบกพร่องและแผนแก้ไข (CAR & CAP Tracker - F-CR-004)
              </h3>
              <p className="text-[11px] text-slate-500">
                ติดตามขั้นตอน: ออกใบ CAR &gt; Auditee วิเคราะห์หาสาเหตุ &gt; เสนอแผนแก้ไข &gt; Auditor ทบทวนผล &gt; ปิดประเด็น
              </p>
            </div>
          </div>

          {statusFilter !== 'ALL' && (
            <button
              onClick={() => setStatusFilter('ALL')}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              แสดงทั้งหมด ({totalCars} รายการ) ✕
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่ CAR, ชื่อผู้รับผิดชอบ, หรือข้อกำหนด..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* CAR Items List */}
      <div className="space-y-4">
        {filteredCarItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
            <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="text-base font-bold text-slate-700">
              ไม่พบรายการข้อบกพร่องหรือใบ CAR ในเงื่อนไขนี้
            </h4>
            <p className="text-xs text-slate-500">
              ระบบแสดงเฉพาะข้อที่ถูกประเมินเป็น Major NC (MA), Minor NC (MI) หรือมีการเปิดแบบฟอร์ม CAR
            </p>
          </div>
        ) : (
          filteredCarItems.map((item) => {
            const car =
              item.capData ||
              ({
                carNo: `CAR-KRC-2026-${String(item.id).padStart(3, '0')}`,
                targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split('T')[0],
                personInCharge: 'Supervisor หน่วยงานที่เกี่ยวข้อง',
                rootCause: 'รอ Auditee วิเคราะห์สาเหตุที่แท้จริง (5 Whys)',
                correction: 'การแก้ไขปัญหาเฉพาะหน้าทันที',
                correctiveAction: 'มาตรการป้องกันการเกิดซ้ำเชิงระบบ',
                preventiveAction: 'การขยายผลและทบทวนความเสี่ยง',
                extentAnalysis: 'สุ่มตรวจทุกพื้นที่เพื่อดูว่ามีปัญหาลักษณะเดียวกันหรือไม่',
                status: 'ISSUED',
                signatories: {
                  preparedBy: 'น้องออดิต (Lead Auditor)',
                  proposedBy: 'หัวหน้างาน / Supervisor (K.R.C.)',
                  reviewedBy: 'ประภาส สันติสุข (QSHE Manager K.R.C.)',
                  approvedBy: 'กิตติศักดิ์ เจริญกิจ (President & CEO)',
                  acknowledgedByVendor: item.referenceDocs.includes('P-PU')
                    ? 'ตัวแทนผู้รับเหมา (รับทราบผลเท่านั้น)'
                    : undefined,
                },
              } as CapData);

            // Calculate deadline status
            const targetDateObj = new Date(car.targetDate);
            const nowObj = new Date();
            const daysLeft = Math.ceil(
              (targetDateObj.getTime() - nowObj.getTime()) / (1000 * 60 * 60 * 24)
            );
            const isOverdue = daysLeft < 0;

            const isSending = sendingCarNo === car.carNo;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg font-mono font-bold text-xs bg-slate-900 text-white">
                      {car.carNo}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.status === 'MA'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {item.status === 'MA' ? 'Major NC (ขั้นรุนแรง)' : 'Minor NC (ขั้นเล็กน้อย)'}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      ข้อที่ #{item.id} • หมวด {item.categoryCode}: {item.categoryTitle}
                    </span>
                  </div>

                  {/* Status & Deadline pill */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                        isOverdue
                          ? 'bg-rose-100 text-rose-900 border border-rose-300 animate-pulse'
                          : 'bg-blue-50 text-blue-900 border border-blue-200'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        กำหนดเสร็จ: {car.targetDate}{' '}
                        {isOverdue ? `(เลยกำหนด ${Math.abs(daysLeft)} วัน!)` : `(เหลืออีก ${daysLeft} วัน)`}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                        car.status === 'CLOSED'
                          ? 'bg-emerald-600 text-white'
                          : car.status === 'AUDITEE_SUBMITTED'
                          ? 'bg-blue-600 text-white'
                          : car.status === 'VERIFIED'
                          ? 'bg-purple-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {car.status === 'ISSUED' && 'ออกใบ CAR แล้ว'}
                      {car.status === 'WAITING_AUDITEE' && 'รอ Auditee ส่งแผน'}
                      {car.status === 'AUDITEE_SUBMITTED' && 'Auditee ส่งแผนแล้ว'}
                      {car.status === 'VERIFIED' && 'Auditor ตรวจสอบผลแล้ว'}
                      {car.status === 'CLOSED' && 'ปิด CAR สมบูรณ์'}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 space-y-4 text-xs">
                  {/* Finding Question & Evidence */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block uppercase">
                      ข้อกำหนดและสิ่งตรวจพบ:
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">{item.question}</h4>
                    {item.evidenceRecorded && (
                      <p className="mt-1 p-2 bg-slate-100 rounded-lg text-slate-700 italic">
                        "{item.evidenceRecorded}"
                      </p>
                    )}
                  </div>

                  {/* CAP Plan Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>ผู้รับผิดชอบดำเนินการ (Auditee):</span>
                      </span>
                      <p className="text-slate-700">{car.personInCharge}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>การแก้ไขเฉพาะหน้า (Correction):</span>
                      </span>
                      <p className="text-slate-700">{car.correction || 'ยังไม่ได้ระบุ'}</p>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <span className="font-bold text-slate-800">
                        สาเหตุที่แท้จริง (Root Cause):
                      </span>
                      <p className="text-slate-700">{car.rootCause || 'รอ Auditee วิเคราะห์'}</p>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <span className="font-bold text-slate-800">
                        มาตรการแก้ไขเชิงระบบ (Corrective Action):
                      </span>
                      <p className="text-slate-700">
                        {car.correctiveAction || 'รอ Auditee กำหนดมาตรการ'}
                      </p>
                    </div>
                  </div>

                  {/* Signatory Check according to KRC rules */}
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 text-[11px] space-y-1">
                    <span className="font-bold text-blue-950 block">
                      การลงนามความโปร่งใส (ตามระเบียบ K.R.C. F-CR-004):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 pt-1">
                      <div>
                        <strong>ผู้เตรียม (Prepare):</strong> {car.signatories?.preparedBy || '-'}
                      </div>
                      <div>
                        <strong>ผู้เสนอ (Proposed):</strong> {car.signatories?.proposedBy || '-'}
                      </div>
                      <div>
                        <strong>ผู้ทบทวน (Review):</strong> {car.signatories?.reviewedBy || '-'}
                      </div>
                      <div>
                        <strong>ผู้อนุมัติ (Approve):</strong> {car.signatories?.approvedBy || '-'}
                      </div>
                    </div>
                    {car.signatories?.acknowledgedByVendor && (
                      <div className="pt-1 text-emerald-800">
                        <strong>ผู้รับเหมา (Vendor):</strong> {car.signatories.acknowledgedByVendor}{' '}
                        <span className="text-[10px] text-slate-500 font-normal">
                          (ลงนามเพื่อรับทราบผลเท่านั้น ตามระเบียบ P-PU-002)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quick Action Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    {/* Status Changer for Admin/Auditor */}
                    {(currentUserRole === 'ADMIN' || currentUserRole === 'AUDITOR') && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-500">เปลี่ยนสถานะ:</span>
                        <button
                          onClick={() => handleQuickStatusChange(item, 'WAITING_AUDITEE')}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-semibold cursor-pointer"
                        >
                          รอ Auditee
                        </button>
                        <button
                          onClick={() => handleQuickStatusChange(item, 'AUDITEE_SUBMITTED')}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-lg text-[11px] font-semibold cursor-pointer"
                        >
                          ส่งแผนแล้ว
                        </button>
                        <button
                          onClick={() => handleQuickStatusChange(item, 'VERIFIED')}
                          className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 rounded-lg text-[11px] font-semibold cursor-pointer"
                        >
                          ตรวจแล้ว
                        </button>
                        <button
                          onClick={() => handleQuickStatusChange(item, 'CLOSED')}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-[11px] font-semibold cursor-pointer"
                        >
                          ✓ ปิด CAR
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Send Google Chat Alert */}
                      <button
                        onClick={() => handleSendAlert('GOOGLE_CHAT', item, car)}
                        disabled={isSending}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                        title="ส่งการ์ดแจ้งเตือนใบ CAR นี้เข้า Google Chat Space"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>ส่ง Google Chat</span>
                      </button>

                      {/* Send Email Alert */}
                      <button
                        onClick={() => handleSendAlert('EMAIL', item, car)}
                        disabled={isSending}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                        title="ส่งอีเมลแจ้งเตือนถึงผู้รับผิดชอบ"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>ส่งแจ้งเตือน Email</span>
                      </button>

                      {/* Open Full CAR Modal */}
                      <button
                        onClick={() => onOpenCarModal(item)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-300" />
                        <span>เปิดดู / แก้ไขใบ CAR เต็ม</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
