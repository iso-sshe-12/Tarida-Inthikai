export interface AuditDepartment {
  id: string; // e.g. "IT", "HR_GA"
  name: string; // Official Auditee Name as in table
  team: string; // Auditor Team
  teamShort: string; // e.g. "Team 1"
  date: string; // e.g. "14/10/2569"
  time: string; // e.g. "10:00 – 11:30 น."
  badgeColor: string; // Tailwind styling for team badges
  categoryFilterKeywords?: string[]; // Keywords to auto-match initial questions if unassigned
}

export const KRC_AUDIT_DEPARTMENTS: AuditDepartment[] = [
  {
    id: 'IT',
    name: 'IT',
    team: 'Team 1: K.Chakkrit (QSHE), K.Chanyarat (PU)',
    teamShort: 'Team 1',
    date: '14/10/2569',
    time: '10:00 – 11:30 น.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    categoryFilterKeywords: ['IT', 'ระบบสารสนเทศ', 'คอมพิวเตอร์', 'Backup', 'Server', 'Security'],
  },
  {
    id: 'HR & GA',
    name: 'HR & GA',
    team: 'Team 1: K.Chakkrit (QSHE), K.Chanyarat (PU)',
    teamShort: 'Team 1',
    date: '15/10/2569',
    time: '09:00 – 11:30 น.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    categoryFilterKeywords: ['HR', 'GA', 'บุคคล', 'ฝึกอบรม', 'ทรัพยากรบุคคล', 'ธุรการ'],
  },
  {
    id: 'Engineering & Construction',
    name: 'Engineering & Construction',
    team: 'Team 1: K.Chakkrit (QSHE), K.Chanyarat (PU)',
    teamShort: 'Team 1',
    date: '16/10/2569',
    time: '09:00 – 11:00 น.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    categoryFilterKeywords: ['Engineering', 'Construction', 'วิศวกรรม', 'ก่อสร้าง', 'ซ่อมบำรุง', 'อาคาร'],
  },
  {
    id: 'Operation - Reefer',
    name: 'Operation - Reefer',
    team: 'Team 1: K.Chakkrit (QSHE), K.Chanyarat (PU)',
    teamShort: 'Team 1',
    date: '20/10/2569',
    time: '13:30 – 15:30 น.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    categoryFilterKeywords: ['Reefer', 'ตู้เย็น', 'ตู้คอนเทนเนอร์เย็น', 'ปลั๊กไฟ', 'อุณหภูมิ'],
  },
  {
    id: 'Operation - QA',
    name: 'Operation - QA',
    team: 'Team 2: K.Tarida (QSHE), K.Wiroj (QSHE)',
    teamShort: 'Team 2',
    date: '14/10/2569',
    time: '10:00 – 11:30 น.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    categoryFilterKeywords: ['QA', 'ประกันคุณภาพ', 'คุณภาพ', 'Gate', 'ตรวจสภาพ'],
  },
  {
    id: 'Transport',
    name: 'Transport',
    team: 'Team 2: K.Tarida (QSHE), K.Wiroj (QSHE)',
    teamShort: 'Team 2',
    date: '14/10/2569',
    time: '13:30 – 15:30 น.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    categoryFilterKeywords: ['Transport', 'ขนส่ง', 'พขร', 'คนขับ', 'แอลกอฮอล์', 'GPS', 'หัวลาก'],
  },
  {
    id: 'Operation - Survey',
    name: 'Operation - Survey',
    team: 'Team 2: K.Tarida (QSHE), K.Wiroj (QSHE)',
    teamShort: 'Team 2',
    date: '15/10/2569',
    time: '13:30 – 15:00 น.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    categoryFilterKeywords: ['Survey', 'สำรวจตู้', 'หน้ากาก N95', 'Gate เข้า-ออก', 'ลานตู้'],
  },
  {
    id: 'Purchase',
    name: 'Purchase',
    team: 'Team 2: K.Tarida (QSHE), K.Wiroj (QSHE)',
    teamShort: 'Team 2',
    date: '16/10/2569',
    time: '09:00 – 11:00 น.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    categoryFilterKeywords: ['Purchase', 'จัดซื้อ', 'P-PU-001', 'P-PU-002', 'F-PU-008', 'ผู้รับเหมา'],
  },
  {
    id: 'Operation - QC',
    name: 'Operation - QC',
    team: 'Team 2: K.Tarida (QSHE), K.Wiroj (QSHE)',
    teamShort: 'Team 2',
    date: '19/10/2569',
    time: '13:30 – 15:30 น.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    categoryFilterKeywords: ['QC', 'ควบคุมคุณภาพ', 'ซ่อมตู้', 'ตรวจปล่อย'],
  },
  {
    id: 'Management',
    name: 'Management',
    team: 'Team 3: K.Thayarat (ACC), K.Tharnarnuth (WH)',
    teamShort: 'Team 3',
    date: '14/10/2569',
    time: '09:00 – 10:00 น.',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    categoryFilterKeywords: ['Management', 'ผู้บริหาร', 'นโยบาย', 'บริบท', 'วิสัยทัศน์', 'Review'],
  },
  {
    id: 'Operation - Equipment',
    name: 'Operation - Equipment',
    team: 'Team 3: K.Thayarat (ACC), K.Tharnarnuth (WH)',
    teamShort: 'Team 3',
    date: '14/10/2569',
    time: '14:00 – 15:30 น.',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    categoryFilterKeywords: ['Equipment', 'เครื่องจักร', 'เครน', 'Reach Stacker', 'สลิง', 'อุปกรณ์ยก'],
  },
  {
    id: 'QSHE',
    name: 'QSHE',
    team: 'Team 3: K.Thayarat (ACC), K.Tharnarnuth (WH)',
    teamShort: 'Team 3',
    date: '19/10/2569',
    time: '09:00 – 12:00 น.',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    categoryFilterKeywords: ['QSHE', 'ความปลอดภัย', 'สิ่งแวดล้อม', 'JSA', 'Aspect', 'F-SE-001', 'F-SE-039', 'ERP'],
  },
  {
    id: 'Accounting & Finance',
    name: 'Accounting & Finance',
    team: 'Team 4: K.Supalak (HR & GA), K.Yuttaphong (EN)',
    teamShort: 'Team 4',
    date: '15/10/2569',
    time: '10:30 – 12:00 น.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    categoryFilterKeywords: ['Accounting', 'Finance', 'บัญชี', 'การเงิน', 'งบประมาณ'],
  },
  {
    id: 'CR',
    name: 'CR',
    team: 'Team 4: K.Supalak (HR & GA), K.Yuttaphong (EN)',
    teamShort: 'Team 4',
    date: '15/10/2569',
    time: '15:30 – 16:30 น.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    categoryFilterKeywords: ['CR', 'ลูกค้าสัมพันธ์', 'Customer Relation', 'ข้อร้องเรียน', 'CSAT'],
  },
  {
    id: 'Warehouse',
    name: 'Warehouse',
    team: 'Team 4: K.Supalak (HR & GA), K.Yuttaphong (EN)',
    teamShort: 'Team 4',
    date: '20/10/2569',
    time: '09:00 – 11:30 น.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    categoryFilterKeywords: ['Warehouse', 'คลังสินค้า', 'โฟล์กลิฟต์', 'จัดเก็บ', 'Walkway', 'พาเลท'],
  },
];

export const KRC_MEETINGS_SCHEDULE = [
  {
    id: 'OPENING',
    title: 'Opening Meeting',
    team: 'All Auditors & Auditees',
    date: '14/10/2569',
    time: '08:30 – 09:00 น.',
  },
  {
    id: 'AUDITOR_MEETING',
    title: 'Auditor Meeting',
    team: 'All Auditors',
    date: '22/10/2569',
    time: '13:30 – 15:00 น.',
  },
  {
    id: 'CLOSING',
    title: 'Closing Meeting',
    team: 'All Auditors, Auditees & Management',
    date: '22/10/2569',
    time: '15:00 – 16:30 น.',
  },
];

/**
 * Automatically maps an audit question/item to one of the 15 official KRC departments
 * based on question keywords, reference documents, or ISO requirements.
 */
export function assignDepartmentToItem(item: any): string {
  if (item.department) return item.department;
  const text = `${item.question || ''} ${item.requirement || ''} ${item.referenceDocs || ''} ${item.categoryTitle || ''} ${item.requiredEvidence || ''}`.toLowerCase();

  if (text.includes('it') || text.includes('สารสนเทศ') || text.includes('backup') || text.includes('server') || text.includes('กู้คืน') || text.includes('yms')) {
    return 'IT';
  }
  if (text.includes('reefer') || text.includes('ตู้เย็น') || text.includes('ปลั๊ก') || text.includes('อุณหภูมิ') || text.includes('loto')) {
    return 'Operation - Reefer';
  }
  if (text.includes('พขร') || text.includes('ขนส่ง') || text.includes('คนขับ') || text.includes('แอลกอฮอล์') || text.includes('ความดัน') || text.includes('gps') || text.includes('หัวลาก') || text.includes('wi-tr')) {
    return 'Transport';
  }
  if (text.includes('gate') || text.includes('n95') || text.includes('survey') || text.includes('สำรวจ') || text.includes('eir') || text.includes('หน้ากาก')) {
    return 'Operation - Survey';
  }
  if (text.includes('จัดซื้อ') || text.includes('p-pu') || text.includes('ผู้รับเหมา') || text.includes('f-pu-008') || text.includes('avl') || text.includes('vendor')) {
    return 'Purchase';
  }
  if (text.includes('qc') || text.includes('พ่นสี') || text.includes('ghs') || text.includes('sds') || text.includes('ขวดน้ำดื่ม') || text.includes('ขยะอันตราย') || text.includes('สารเคมี') || text.includes('สะเก็ดไฟ')) {
    return 'Operation - QC';
  }
  if (text.includes('qa') || text.includes('iicl') || text.includes('ประกันคุณภาพ') || text.includes('wi-qa')) {
    return 'Operation - QA';
  }
  if (text.includes('เครื่องจักร') || text.includes('reach stacker') || text.includes('ป.ภ.2') || text.includes('สลิง') || text.includes('รอก') || text.includes('พิกัดยก') || text.includes('wi-eq')) {
    return 'Operation - Equipment';
  }
  if (text.includes('ช่าง') || text.includes('ก่อสร้าง') || text.includes('ซ่อมบำรุง') || text.includes('hot work') || text.includes('ที่สูง') || text.includes('นั่งร้าน') || text.includes('p-en')) {
    return 'Engineering & Construction';
  }
  if (text.includes('ผู้บริหาร') || text.includes('swot') || text.includes('pestel') || text.includes('บริบท') || text.includes('นโยบาย') || text.includes('management review') || text.includes('m-mr')) {
    return 'Management';
  }
  if (text.includes('บุคคล') || text.includes('ฝึกอบรม') || text.includes('ตรวจสุขภาพ') || text.includes('ปฐมนิเทศ') || text.includes('hr') || text.includes('ga') || text.includes('p-hr')) {
    return 'HR & GA';
  }
  if (text.includes('บัญชี') || text.includes('การเงิน') || text.includes('งบประมาณ') || text.includes('p-ac')) {
    return 'Accounting & Finance';
  }
  if (text.includes('ลูกค้า') || text.includes('csat') || text.includes('ข้อร้องเรียน') || text.includes('cr') || text.includes('wi-cr')) {
    return 'CR';
  }
  if (text.includes('คลัง') || text.includes('warehouse') || text.includes('โฟล์กลิฟต์') || text.includes('walkway') || text.includes('พาเลท') || text.includes('wi-wh')) {
    return 'Warehouse';
  }
  return 'QSHE'; // Default to QSHE for Risk, Aspect, HIRA, JSA, ERP, Internal Audit, CAR
}
