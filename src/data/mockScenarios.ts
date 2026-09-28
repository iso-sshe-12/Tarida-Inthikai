import { ChecklistItem, INITIAL_CHECKLIST_DATA } from './auditChecklistData';

export interface MockScenario {
  id: string;
  title: string;
  targetUnit: string;
  description: string;
  badge: string;
  badgeColor: string;
  customData: Partial<ChecklistItem>[];
}

export const MOCK_SCENARIOS: MockScenario[] = [
  {
    id: 'pre-audit-yard-transport',
    title: 'เคสจำลองรวม: ลานตู้คอนเทนเนอร์ & ฝ่ายขนส่ง (Yard & Trucking Mock Audit)',
    targetUnit: 'ลานตู้คอนเทนเนอร์ (Yard), อู่ซ่อมบำรุง (M&R/Workshop), ฝ่ายขนส่ง (KRC Trucking)',
    badge: 'สถานการณ์ทดสอบหลักก่อน Audit จริง 14-22 ต.ค.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'จำลองสุ่มตรวจพบ 5 ข้อบกพร่องวิกฤตที่ CB และผู้ตรวจให้ความสำคัญสูงสุด (ขวดน้ำดื่มบรรจุสารเคมี, หน้ากาก Survey Gate, คนขับความดันสูง, ปนเปื้อนขยะอันตราย, ใบอนุญาตทำงานบนที่สูง)',
    customData: [
      {
        id: 1,
        status: 'C',
        evidenceRecorded: 'ตรวจเอกสาร SWOT 2026 ฉบับอนุมัติโดย CEO วันที่ 15/01/2026 มีการทบทวนเรื่อง Climate change ผลกระทบจากโรคลมแดดของพนักงานขับรถ/คนงานลานตู้ และน้ำท่วมขังลาน',
        auditorFindingDetail: 'สอดคล้องตามข้อกำหนด ISO 9001/14001/45001 ข้อ 4.1 (Amd 1:2024)',
      },
      {
        id: 25,
        status: 'MA',
        evidenceRecorded: 'จากการเดินสุ่มตรวจหน้างานพื้นที่ซ่อมบำรุง M&R และพื้นที่ผู้รับเหมา Sub SVP พบขวดน้ำดื่มพลาสติกใส 600 ml บรรจุน้ำมันทินเนอร์/น้ำยาล้างเบรกโดยไม่มีฉลากเตือน GHS และไม่มีเอกสาร SDS ภาษาไทย ณ จุดใช้งาน',
        auditorFindingDetail: 'พบข้อบกพร่องขั้นรุนแรง (Major Non-conformance): ขัดต่อกฎกระทรวงสารเคมีอันตราย พ.ศ. 2556 และ ISO 45001/14001 ข้อ 8.1 เป็นข้อบกพร่องเดิมซ้ำจาก CB OBS Sub SVP ที่ยังไม่ได้รับการแก้ไขอย่างยั่งยืน เสี่ยงต่อการดื่มผิดและเพลิงไหม้',
        capRequired: true,
        capData: {
          carNo: 'CAR-KRC-2026-001',
          targetDate: '2026-10-10',
          personInCharge: 'สมชาย รักปลอดภัย (Supervisor M&R / Sub SVP Control)',
          rootCause: 'ผู้รับเหมาและช่างซ่อมนำภาชนะเหลือใช้มาบรรจุสารเคมีเพื่อความสะดวกในการพกพา และขาดภาชนะเซฟตี้ (Safety Can) ที่มีฉลากถูกต้องประจำจุด อีกทั้งเจ้าหน้าที่ควบคุมงานยังไม่ได้ตรวจเข้มงวดก่อนอนุญาตให้เข้าพื้นที่',
          correction: 'ทำการยึดขวดน้ำดื่มที่บรรจุสารเคมีทั้งหมดไปทำลายและถ่ายเทลงภาชนะมาตรฐานทันที พร้อมติดฉลาก GHS และแจกจ่าย SDS ภาษาไทย ณ จุดใช้งานภายใน 24 ชม.',
          correctiveAction: 'จัดซื้อ Safety Can บรรจุสารเคมีมาตรฐานที่มีแถบสีและฉลาก GHS ให้ผู้รับเหมาและหน่วยงาน M&R ใช้ถาวร พร้อมบรรจุเกณฑ์การตรวจห้ามใช้ขวดน้ำดื่มใน Daily Safety Checklist',
          preventiveAction: 'เพิ่มหัวข้อห้ามแบ่งถ่ายสารเคมีลงขวดน้ำดื่มในการอบรมปฐมนิเทศผู้รับเหมา (P-PU-002) หากพบเห็นจะสั่งหยุดงานและปรับคะแนนใน FM-PU-008 ทันที',
          extentAnalysis: 'ขยายผลตรวจค้นทุกตู้คอนเทนเนอร์เก็บอุปกรณ์ของ Sub SVP, ART, Reefer และจุดล้างตู้ทั้ง 2 Site ทันที',
          status: 'ISSUED',
          signatories: {
            preparedBy: 'น้องออดิต (AI Lead Auditor)',
            proposedBy: 'วิชัย ชัยชนะ (Supervisor ควบคุมงาน K.R.C.)',
            reviewedBy: 'ประภาส สันติสุข (QSHE Manager K.R.C.)',
            approvedBy: 'กิตติศักดิ์ เจริญกิจ (President & CEO K.R.C.)',
            acknowledgedByVendor: 'ตัวแทน บจก. ซับ เอสวีพี (รับทราบผลการประเมินเท่านั้น)',
          },
        },
      },
      {
        id: 26,
        status: 'MI',
        evidenceRecorded: 'พบเศษผ้าปนเปื้อนคราบน้ำมันเครื่อง 3 ชิ้น ถูกทิ้งปะปนในถังขยะเศษเหล็กทั่วไป บริเวณ Workshop ฝั่งตะวันออก',
        auditorFindingDetail: 'ข้อบกพร่องขั้นเล็กน้อย (Minor NC): ขัดต่อประกาศกระทรวงอุตสาหกรรม เรื่อง การจัดการสิ่งปฏิกูลหรือวัสดุที่ไม่ใช้แล้ว และ ISO 14001 ข้อ 8.1 การคัดแยกขยะอันตรายยังไม่รัดกุม',
        capRequired: true,
        capData: {
          carNo: 'CAR-KRC-2026-002',
          targetDate: '2026-10-08',
          personInCharge: 'สิทธิชัย มั่นคง (หัวหน้าช่าง Workshop)',
          rootCause: 'ถังขยะอันตรายอยู่ห่างจากโต๊ะซ่อมด่วนประมาณ 15 เมตร ช่างจึงทิ้งลงถังเศษเหล็กที่อยู่ใกล้โต๊ะแทน',
          correction: 'นำคีมคีบเศษผ้าปนเปื้อนย้ายไปทิ้งในถังขยะอันตรายสีแดงที่มีฝาปิดทันที',
          correctiveAction: 'เพิ่มถังขยะอันตรายขนาดเล็กประจำโต๊ะซ่อมทุกจุด พร้อมติดป้ายสัญลักษณ์ขยะปนเปื้อนชัดเจน',
          preventiveAction: 'สื่อสาร Safety Talk 5 ส. เรื่องการคัดแยกขยะก่อนทิ้ง และสุ่มตรวจโดย จป. ทุกสัปดาห์',
          extentAnalysis: 'ตรวจสอบถังขยะทุกจุดในลานตู้คอนเทนเนอร์และอู่ซ่อม',
          status: 'ISSUED',
          signatories: {
            preparedBy: 'น้องออดิต (AI Lead Auditor)',
            proposedBy: 'สิทธิชัย มั่นคง (หัวหน้าช่าง Workshop K.R.C.)',
            reviewedBy: 'ประภาส สันติสุข (QSHE Manager K.R.C.)',
            approvedBy: 'กิตติศักดิ์ เจริญกิจ (President & CEO K.R.C.)',
          },
        },
      },
      {
        id: 30,
        status: 'MA',
        evidenceRecorded: 'สุ่มตรวจงานปีนขึ้นไปตรวจสอบรอยรั่วบนหลังคาตู้คอนเทนเนอร์สูง 2.6 เมตร ในแผนก M&R พบช่างกำลังปีนบันไดลิงขึ้นไปโดยไม่มีการออกใบอนุญาตทำงานบนที่สูง (Work at Height Permit) และไม่มีการผูกคล้อง Fall Arrester กับ Lifeline',
        auditorFindingDetail: 'ข้อบกพร่องขั้นรุนแรง (Major NC): ขัดต่อกฎกระทรวงความปลอดภัยเกี่ยวกับนั่งร้านและที่สูง พ.ศ. 2564 และ ISO 45001 ข้อ 8.1.2 เป็นความเสี่ยงระดับวิกฤตตกจากที่สูงถึงขั้นทุพพลภาพหรือเสียชีวิต',
        capRequired: true,
        capData: {
          carNo: 'CAR-KRC-2026-003',
          targetDate: '2026-10-05',
          personInCharge: 'อนุชา ช่างชำนาญ (Foreman M&R)',
          rootCause: 'ผู้ปฏิบัติงานคิดว่าเป็นงานตรวจดูรอยรั่วเพียง 5 นาทีจึงไม่ได้ขอใบ Work Permit ตามขั้นตอน P-QS-009 และขาดการกำกับดูแลหน้างานอย่างต่อเนื่อง',
          correction: 'สั่งหยุดการทำงานทันที ให้พนักงานลงสู่พื้นดิน และดำเนินการขอใบอนุญาต Work at Height Permit พร้อมสวมใส่ Full Body Harness ผูกคล้อง Lifeline ให้ถูกต้องก่อนปฏิบัติงานต่อ',
          correctiveAction: 'ปรับปรุงขั้นตอนระบบ Tag Out บันไดลิงหน้างาน หากไม่มีใบ Permit อนุมัติโดย Supervisor จะไม่อนุญาตให้นำบันไดมาใช้งาน',
          preventiveAction: 'ทบทวนการฝึกอบรมการทำงานบนที่สูงและการใช้อุปกรณ์กันตกแก่ทีม M&R ทุกคน และกำหนดให้หัวหน้างานต้องเซ็นเปิด Permit หน้างานเท่านั้น',
          extentAnalysis: 'ตรวจสอบงานซ่อมบนหลังคาตู้คอนเทนเนอร์และงานตรวจเช็กหลังคารถหัวลากทุกกะ',
          status: 'ISSUED',
          signatories: {
            preparedBy: 'น้องออดิต (AI Lead Auditor)',
            proposedBy: 'อนุชา ช่างชำนาญ (Foreman M&R K.R.C.)',
            reviewedBy: 'ประภาส สันติสุข (QSHE Manager K.R.C.)',
            approvedBy: 'กิตติศักดิ์ เจริญกิจ (President & CEO K.R.C.)',
          },
        },
      },
      {
        id: 59,
        status: 'MI',
        evidenceRecorded: 'สุ่มตรวจเจ้าหน้าที่ Survey Gate 2 นาย พบสวมเพียงหน้ากากอนามัยกระดาษธรรมดา (Surgical Mask) ทั้งที่มีฝุ่นควันและละอองสารเคมีจากตู้คอนเทนเนอร์ขาเข้า ไม่ได้รับแจกหน้ากาก N95/Carbon',
        auditorFindingDetail: 'ข้อบกพร่องขั้นเล็กน้อย (Minor NC): ขัดต่อ ISO 45001 ข้อ 6.1.2/8.1.3 และเป็นข้อสังเกตเดิม CB OBS-11 ที่ยังไม่ได้ปรับปรุงการจัดเตรียม PPE ทางเดินหายใจให้เหมาะสมกับความเสี่ยงจริง',
        capRequired: true,
        capData: {
          carNo: 'CAR-KRC-2026-004',
          targetDate: '2026-10-09',
          personInCharge: 'ธนากร ด่านตรวจ (Supervisor Survey Gate)',
          rootCause: 'ใบเบิก PPE ของคลังไม่ได้ระบุแยกสำหรับ Survey Gate จึงสั่งจ่ายเฉพาะหน้ากากผ่าตัดทั่วไปเพราะต้นทุนต่ำกว่า',
          correction: 'เบิกจ่ายหน้ากากกรองคาร์บอน/N95 ให้พนักงาน Survey Gate ทุกคนทันทีในวันนี้',
          correctiveAction: 'แก้ไขแบบฟอร์ม PPE Matrix ในคู่มือความปลอดภัย ให้ระบุหน้ากาก Carbon/N95 เป็นอุปกรณ์บังคับสำหรับเจ้าหน้าที่ Gate และเปิดตู้',
          preventiveAction: 'กำหนดสต็อกขั้นต่ำหน้ากาก Carbon ในห้องสโตร์ไม่น้อยกว่า 5 กล่อง และบันทึกประวัติการเบิกจ่ายทุก 2 สัปดาห์',
          extentAnalysis: 'ตรวจเจ้าหน้าที่ลานจัดเรียงตู้และคนเปิดตู้สินค้าทุกจุด',
          status: 'ISSUED',
          signatories: {
            preparedBy: 'น้องออดิต (AI Lead Auditor)',
            proposedBy: 'ธนากร ด่านตรวจ (Supervisor Survey Gate K.R.C.)',
            reviewedBy: 'ประภาส สันติสุข (QSHE Manager K.R.C.)',
            approvedBy: 'กิตติศักดิ์ เจริญกิจ (President & CEO K.R.C.)',
          },
        },
      },
      {
        id: 78,
        status: 'MA',
        evidenceRecorded: 'สุ่มตรวจบันทึกควบคุมสุขภาพพนักงานขับรถขนส่ง (พขร.) และหัวลากร่วม วันที่ 24/09/2026 พบ พขร. รหัส D-104 มีผลวัดความดัน 146/94 mmHg แต่เจ้าหน้าที่ปล่อยให้ออกปฏิบัติงานขับรถทันที โดยไม่ได้ให้นั่งพักผ่อน 15 นาทีแล้ววัดซ้ำตามระเบียบ',
        auditorFindingDetail: 'ข้อบกพร่องขั้นรุนแรง (Major NC): ขัดต่อประกาศกรมการขนส่งทางบก เรื่อง ระบบ TSM พ.ศ. 2560 และ ISO 45001 ข้อ 8.1 เสี่ยงต่อการเกิดอุบัติเหตุบนท้องถนนจากโรคความดันโลหิตสูงเฉียบพลัน/วูบหลับใน',
        capRequired: true,
        capData: {
          carNo: 'CAR-KRC-2026-005',
          targetDate: '2026-10-07',
          personInCharge: 'ปิยะวัฒน์ ขนส่งเร็ว (Transport Operations Manager)',
          rootCause: 'เจ้าหน้าที่ตรวจปล่อยรถต้องการเร่งรัดเวลาส่งตู้ตามรอบของสายเรือ จึงละเลยขั้นตอนการให้นั่งพัก 15 นาที และซอฟต์แวร์เช็กอินไม่ได้บล็อกการปล่อยคิวรถเมื่อค่าความดันเกิน',
          correction: 'เรียกตัว พขร. ดังกล่าวตรวจซ้ำและจัดส่งพบแพทย์อาชีวเวชศาสตร์เพื่อประเมินความพร้อมในการขับขี่',
          correctiveAction: 'ปรับปรุงระบบดิจิทัล Check-in จุดปล่อยรถ: หากค่าความดันเกิน 140/90 ระบบจะปฏิเสธการออกใบอนุญาตปล่อยตู้ (Gate Pass) อัตโนมัติ จนกว่าจะบันทึกผลวัดรอบสองหลังพัก 15 นาที',
          preventiveAction: 'ฝึกอบรมเจ้าหน้าที่ Dispatcher ทุกผลัดเรื่องขั้นตอนคัดกรอง TSM และลงโทษพักงานหากปล่อยรถที่สุขภาพไม่ผ่านเกณฑ์',
          extentAnalysis: 'ตรวจสอบบันทึกผลตรวจสุขภาพย้อนหลัง 30 วันของคนขับรถหัวลากบริษัทและหัวลากร่วมทั้งหมด 45 นาย',
          status: 'ISSUED',
          signatories: {
            preparedBy: 'น้องออดิต (AI Lead Auditor)',
            proposedBy: 'ปิยะวัฒน์ ขนส่งเร็ว (Transport Operations Manager K.R.C.)',
            reviewedBy: 'ประภาส สันติสุข (QSHE Manager K.R.C.)',
            approvedBy: 'กิตติศักดิ์ เจริญกิจ (President & CEO K.R.C.)',
          },
        },
      },
    ],
  },
  {
    id: 'contractor-audit-focus',
    title: 'เคสเจาะลึกผู้รับเหมาช่วง Sub SVP & ART (Contractor P-PU-002 & F-PU-008)',
    targetUnit: 'ผู้รับเหมาพ่นสี/ปะผุตู้ (Sub SVP), ผู้รับเหมาบริการซ่อมเครื่องทำความเย็น (ART)',
    badge: 'เน้นเกณฑ์ P-PU-002 และระเบียบการลงนาม',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'ทดสอบการตรวจประเมินผู้รับเหมาตามขั้นตอน F-PU-008 ประจำเดือน และตรวจสอบความถูกต้องของการลงนามท้ายฟอร์ม (ผู้รับเหมาลงนามเฉพาะ Acknowledged by vendor เท่านั้น)',
    customData: [
      {
        id: 29,
        status: 'MA',
        evidenceRecorded: 'ตรวจสอบแบบฟอร์ม FM-PU-008 เดือน ส.ค. 2026 ของผู้รับเหมา ART พบได้คะแนน 64/100 (เกรด D) ต่ำกว่าเกณฑ์มาตรฐาน 70 คะแนน แต่ฝ่ายจัดซื้อและผู้ควบคุมงานไม่มีการออกใบ CAR หรือจัดทำ Action Plan ปรับปรุงตามระเบียบ P-PU-002',
        auditorFindingDetail: 'ข้อบกพร่องขั้นรุนแรง (Major NC): ฝ่ายจัดซื้อไม่ปฏิบัติตามขั้นตอน P-PU-002 เมื่อผู้รับเหมาสอบตกเกณฑ์ และตรวจสอบพบว่าช่องลงนามมีการให้ผู้รับเหมาลงนามในช่อง Reviewer ซึ่งผิดระเบียบของ K.R.C.',
        capRequired: true,
      },
      {
        id: 48,
        status: 'MI',
        evidenceRecorded: 'สุ่มตรวจช่างเชื่อม 2 นายของผู้รับเหมา ART หน้างาน ไม่พบบัตรประจำตัวและใบประกาศรับรองความสามารถช่างเชื่อมตามมาตรฐานฝีมือแรงงาน',
        auditorFindingDetail: 'ข้อบกพร่องขั้นเล็กน้อย (Minor NC): ขัดต่อ ISO 9001 ข้อ 7.2 และไม่เป็นไปตามข้อตกลงเกณฑ์คัดเลือกผู้รับเหมา',
        capRequired: true,
      }
    ],
  },
  {
    id: 'clean-slate',
    title: 'เริ่มทำ Mock Audit ใหม่ทั้งหมด (Blank Checklist)',
    targetUnit: 'ตรวจทุกหน่วยงาน (87 ข้อ)',
    badge: 'สถานะเริ่มต้น (Pending All)',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    description: 'รีเซ็ตข้อมูลทั้งหมดเป็นค่าเริ่มต้น เพื่อให้ทีมงาน K.R.C. บันทึกผลการตรวจและอัปโหลดหลักฐานสดหน้างานทีละข้อ',
    customData: [],
  },
];
