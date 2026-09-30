export type AuditFinding = 'PENDING' | 'C' | 'MA' | 'MI' | 'OBS' | 'OFI';

export type UserRole = 'ADMIN' | 'AUDITOR' | 'AUDITEE';

export interface TeamMember {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  email: string;
  avatarBg?: string;
  assignedCategories?: string[];
}

export interface AuditeeAttachment {
  id: string;
  name: string;
  dataUrl?: string; // base64 string for image or file preview
  type: 'IMAGE' | 'DOCUMENT' | 'LINK';
  url?: string;
  uploadedAt: string;
}

export interface AuditeeSubmission {
  responderName?: string; // e.g. "วิชัย ชัยชนะ (Supervisor ลานตู้)"
  responderDept?: string; // e.g. "แผนกปฏิบัติการลานตู้ / บำรุงรักษา"
  explanation: string; // คำชี้แจง/คำตอบของ Auditee
  submittedAt?: string;
  attachments?: AuditeeAttachment[];
}

export interface CapSignatories {
  preparedBy: string; // KRC Officer / Lead Auditor
  proposedBy: string; // KRC Section Supervisor / Head of Dept
  reviewedBy: string; // KRC QSHE Manager
  approvedBy: string; // KRC Top Management (President & CEO / COO)
  acknowledgedByVendor?: string; // Strictly for vendor/contractor
}

export type CarStatus = 'DRAFT' | 'ISSUED' | 'WAITING_AUDITEE' | 'AUDITEE_SUBMITTED' | 'VERIFIED' | 'CLOSED';

export interface CapData {
  carNo: string;
  targetDate: string;
  personInCharge: string;
  rootCause: string;
  correction: string;
  correctiveAction: string;
  preventiveAction: string;
  extentAnalysis: string;
  status: CarStatus;
  signatories: CapSignatories;
}

export interface AuditItem {
  id: number;
  categoryCode: string;
  categoryTitle: string;
  requirement: string;
  question: string;
  referenceDocs: string;
  requiredEvidence: string;
  priority: 'HIGH' | 'NORMAL';
  remarks?: string;
  status: AuditFinding;
  evidenceRecorded?: string;
  auditorFindingDetail?: string;
  isoClauses?: string[];
  lawReferences?: string[];
  capRequired?: boolean;
  capData?: CapData;
  auditeeResponse?: AuditeeSubmission;
  assignedAuditorId?: string;
  assignedAuditorName?: string;
  assignedAuditeeId?: string;
  assignedAuditeeName?: string;
  dueDate?: string;
  department?: string; // Auditee Department/Section e.g. "IT", "HR & GA", "Transport"
}

export interface NotificationConfig {
  googleChatWebhookUrl: string;
  googleChatEnabled: boolean;
  emailEnabled: boolean;
  adminEmail: string;
  notifyOnCarIssued: boolean;
  notifyOnAuditeeSubmitted: boolean;
  notifyOnCarClosed: boolean;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  channel: 'GOOGLE_CHAT' | 'EMAIL';
  recipient: string;
  subject: string;
  message: string;
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  relatedCarNo?: string;
  relatedItemId?: number;
}

export interface GoogleSheetsConfig {
  webAppUrl: string;
  isConnected: boolean;
  lastTestedAt?: string;
  lastSyncedAt?: string;
  spreadsheetName?: string;
  autoSyncOnFinding: boolean;
  autoSyncOnCar: boolean;
}

export interface AuditSummaryMetrics {
  auditId: string;
  scenarioName: string;
  standard: string;
  totalChecklist: number;
  evaluatedCount: number;
  pendingCount: number;
  conformanceRate: number;
  conformanceGrade: string;
  countC: number;
  countMajor: number;
  countMinor: number;
  countOBS: number;
  countOFI: number;
  auditorLeader: string;
  status: string;
  lastUpdated: string;
}

export type AuditPlanStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'POSTPONED';

export interface AuditPlanEntry {
  id: string; // e.g. "AUD-SCH-001"
  date: string; // e.g. "2026-10-14"
  timeSlot: string; // e.g. "09:00 - 12:00"
  department: string; // e.g. "แผนกปฏิบัติการลานตู้คอนเทนเนอร์ (Yard Operations & Gate)"
  location: string; // e.g. "ลานตู้คอนเทนเนอร์ Yard A & Gate 1-2"
  scope: string; // e.g. "การตรวจรับสภาพตู้, สารเคมี, Work at Height, PPE Gate"
  isoClauses: string[]; // e.g. ["ISO 9001: 8.5", "ISO 14001: 8.1", "ISO 45001: 8.1.2"]
  leadAuditor: string; // e.g. "น้องออดิต (AI Lead Auditor) / ประภาส สันติสุข"
  auditTeam?: string; // e.g. "อมรเทพ วงษ์สุวรรณ"
  auditeeName: string; // e.g. "วิชัย ชัยชนะ (Supervisor ลานตู้)"
  referenceDocs: string; // e.g. "P-PU-002, WI-OP-001, F-SE-006, F-SE-039"
  status: AuditPlanStatus;
  notes?: string;
}
