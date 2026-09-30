export interface ChecklistItem {
  id: number;
  categoryCode: string;
  categoryTitle: string;
  requirement: string;
  question: string;
  referenceDocs: string;
  requiredEvidence: string;
  priority: 'HIGH' | 'NORMAL';
  remarks?: string;
  status: 'PENDING' | 'C' | 'MA' | 'MI' | 'OBS' | 'OFI';
  evidenceRecorded?: string;
  auditorFindingDetail?: string;
  isoClauses?: string[];
  lawReferences?: string[];
  department?: string;
  capRequired?: boolean;
  capData?: {
    carNo: string;
    targetDate: string;
    personInCharge: string;
    rootCause: string;
    correction: string;
    correctiveAction: string;
    preventiveAction: string;
    extentAnalysis: string;
    status: 'DRAFT' | 'ISSUED' | 'CLOSED';
    signatories: {
      preparedBy: string; // KRC Officer
      proposedBy: string; // KRC Supervisor/Dept Head
      reviewedBy: string; // KRC QSHE Manager
      approvedBy: string; // KRC Top Management
      acknowledgedByVendor?: string; // Vendor only acknowledges
    };
  };
}

export const AUDIT_CATEGORIES = [
  { code: 'ก', title: 'ก. บริบทองค์กร ผู้มีส่วนได้ส่วนเสีย ขอบเขต (Plan)' },
  { code: 'ข', title: 'ข. ผู้นำ นโยบาย บทบาท การปรึกษาหารือ' },
  { code: 'ค', title: 'ค. การวางแผน: ความเสี่ยง Aspect HIRA กฎหมาย วัตถุประสงค์ การเปลี่ยนแปลง' },
  { code: 'ง', title: 'ง. การสนับสนุน: เครื่องมือวัด ความสามารถ ความตระหนัก การสื่อสาร เอกสาร' },
  { code: 'จ', title: 'จ. การดำเนินการ: การควบคุมด้าน S&E ผู้รับเหมา ภาวะฉุกเฉิน (เดินหน้างาน)' },
  { code: 'ฉ', title: 'ฉ. การประเมินผล: เฝ้าติดตาม ตรวจติดตามภายใน ทบทวนฝ่ายบริหาร' },
  { code: 'ช', title: 'ช. การปรับปรุง: CAR อุบัติการณ์' },
  { code: 'ซ', title: 'ซ. ติดตามการปิดผลตรวจครั้งก่อน (CB Stage 2 / IA 2025)' },
  { code: 'ฌ', title: 'ฌ. ประเมินการปฏิบัติตามกฎหมาย (14001/45001 ข้อ 6.1.3, 9.1.2)' },
];

/**
 * Empty default checklist data.
 * All sample items have been removed as requested.
 * Users will upload or add their checklist items per department or as a whole.
 */
export const INITIAL_CHECKLIST_DATA: ChecklistItem[] = [];
