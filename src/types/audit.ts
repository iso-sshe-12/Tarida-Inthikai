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
