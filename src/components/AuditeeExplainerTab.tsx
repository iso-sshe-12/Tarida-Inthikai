import React, { useState } from 'react';
import {
  MessageCircleQuestion,
  Sparkles,
  Send,
  Copy,
  Check,
  BookOpen,
  Scale,
  ShieldCheck,
  HelpCircle,
  Flame,
  AlertTriangle,
  HeartPulse,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';

export const AuditeeExplainerTab: React.FC = () => {
  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | null>(0);
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [chatResponse, setChatResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Top 8 Strategic EHS Topics strictly from the prompt instructions
  const STRATEGIC_TOPICS = [
    {
      id: 1,
      title: '1. ห้ามใช้ขวดน้ำดื่มบรรจุสารเคมีเด็ดขาด & SDS ภาษาไทย',
      category: 'สารเคมีอันตราย & ผู้รับเหมา',
      shortDesc: 'ทำไมเขียนชื่อข้างขวดน้ำดื่มแล้ว ยังถือเป็นข้อบกพร่องขั้นรุนแรง (Major NC)?',
      fullExplanation: `### ทำไมจึงห้ามใช้ขวดน้ำดื่มบรรจุสารเคมีเด็ดขาด (แม้จะเขียนชื่อไว้ข้างขวดก็ตาม)?

#### 1. เหตุผลด้านความปลอดภัยหน้างานจริง (Yard & Contractor Safety)
* **ความเสี่ยงเกิดการดื่มผิด (Accidental Ingestion):** สถิติอุบัติเหตุชี้ว่า การใช้ขวดเครื่องดื่มหรือขวดน้ำดื่มใสบรรจุสารเคมี (เช่น ทินเนอร์, น้ำมันล้างเบรก, น้ำมันก๊าด) แม้จะเขียนปากกาเมจิกไว้ แต่เมื่อเวลาผ่านไปหมึกอาจลบเลือน หรือพนักงานที่เหนื่อยล้า/ทำงานท่ามกลางแดดร้อนจัดอาจหยิบดื่มด้วยความคุ้นชิน ทำให้เกิดอันตรายถึงชีวิต
* **ปฏิกิริยาต่อเนื้อพลาสติก:** พลาสติกขวดน้ำดื่มประเภท PET ไม่ได้ออกแบบมาเพื่อทนทานต่อสารทำละลายอินทรีย์ อาจทำให้สารเคมีกัดกร่อน เกิดการรั่วซึม หรือละลายจนเกิดสารพิษสะสม
* **ข้อกำหนด SDS ภาษาไทย:** กฎหมายและมาตรฐานกำหนดให้ต้องมี SDS ภาษาไทย ณ จุดใช้งาน เพื่อให้ผู้ปฏิบัติงานและเจ้าหน้าที่ปฐมพยาบาลสามารถอ่านวิธีแก้พิษเบื้องต้นได้ทันทีเมื่อเกิดเหตุฉุกเฉิน

#### 2. ตารางเปรียบเทียบข้อกำหนดและแนวทางปฏิบัติที่ถูกต้อง

| หัวข้อ | สิ่งที่ห้ามปฏิบัติเด็ดขาด | แนวทางปฏิบัติที่ถูกต้อง (ตามระบบ K.R.C.) | ข้อกำหนด ISO / กฎหมายอ้างอิง |
| :--- | :--- | :--- | :--- |
| **ภาชนะบรรจุ** | ขวดน้ำดื่ม, ขวดชาเขียว, แก้วกาแฟ | Safety Can หรือขวดทนสารเคมีเฉพาะที่มีฝาปิดแน่นหนา | กฎกระทรวงสารเคมีอันตราย 2556 ข้อ 12 |
| **ฉลากเตือน** | เขียนปากกาเมจิกไม่มีสัญลักษณ์ | ฉลากระบบ GHS มีรูปสัญลักษณ์ความเป็นอันตรายชัดเจน | ISO 45001 ข้อ 8.1 / GHS System |
| **เอกสารความปลอดภัย** | ไม่มี SDS หรือมีเฉพาะภาษาอังกฤษ | จัดทำ SDS ภาษาไทยใส่ซองกันน้ำแขวนไว้ ณ จุดใช้งาน | กฎกระทรวงสารเคมีอันตราย 2556 ข้อ 5 |
| **การควบคุมของเสีย** | เทสารเคมีใช้แล้วลงท่อระบายน้ำลาน | เทใส่ถังพักสารเคมีเสีย มีถาดรองรับ (Drip Tray) | ISO 14001 ข้อ 8.1 / ประกาศ กรอ. 2566 |
`,
    },
    {
      id: 2,
      title: '2. หน้ากากกรอง N95/Carbon สำหรับพนักงาน Survey Gate',
      category: 'อาชีวอนามัย & ทางเดินหายใจ',
      shortDesc: 'ทำไมจุดตรวจรับตู้ (Survey Gate) ต้องใช้หน้ากาก N95/Carbon และบันทึกประวัติเบิก?',
      fullExplanation: `### ทำไมพนักงาน Survey Gate ต้องใช้หน้ากาก N95/Carbon พร้อมบันทึกประวัติการเบิกจ่าย?

#### 1. เหตุผลด้านความปลอดภัยหน้างาน
* **ไอระเหยสารเคมีตกค้างในตู้คอนเทนเนอร์:** พนักงาน Survey Gate ต้องเปิดประตูตู้สินค้าเพื่อตรวจสอบสภาพภายใน ซึ่งตู้สินค้าอาจมีการรมยากำจัดแมลง (Fumigation เช่น Methyl Bromide, Phosphine) หรือมีสินค้าเคมีรั่วซึม หน้ากากอนามัยกระดาษ (Surgical Mask) ป้องกันได้เพียงละอองน้ำลาย ไม่สามารถกรองฝุ่นละเอียด ไอระเหยสารเคมี หรือก๊าซพิษได้
* **ฝุ่นควันและละอองไอเสียรถบรรทุก:** บริเวณ Gate มีรถหัวลากเข้า-ออกตลอดเวลา มีไอเสียดีเซลและฝุ่นละอองขนาดเล็ก (PM2.5) สูง จึงจำเป็นต้องใช้หน้ากากที่มีชั้นกรอง Activated Carbon ร่วมกับมาตรฐาน N95
* **หลักฐานการตรวจของ CB:** ผู้ตรวจประเมินต้องการเห็น "บันทึกประวัติการเบิกจ่าย PPE" เพื่อยืนยันว่าบริษัทมีการจัดหาให้อย่างเพียงพอและต่อเนื่องตามรอบ ไม่ใช่ซื้อมาตั้งโชว์เฉพาะวันที่มีการตรวจออดิต

#### 2. ตารางแนวทางการควบคุม PPE ทางเดินหายใจ

| ตำแหน่งงาน | ชนิดหน้ากากที่ต้องใช้ | ความถี่การเบิกเปลี่ยน | หลักฐานที่ต้องมีให้ผู้ตรวจ CB |
| :--- | :--- | :--- | :--- |
| **Survey Gate** | หน้ากาก Half-mask N95 หรือ Carbon Filter | ทุก 1-2 สัปดาห์ (หรือเมื่ออุดตัน/มีกลิ่น) | ใบบันทึกประวัติการเบิกจ่าย PPE (F-HR) |
| **เปิดตู้สินค้ารมยา** | เครื่องวัดก๊าซ + หน้ากากชนิดไส้กรองไอระเหย | ตามชั่วโมงการใช้งานของไส้กรอง | ใบอนุญาตเข้าตู้ + ผลวัดก๊าซ O2/LEL/Toxics |
| **ช่างซ่อม M&R / เชื่อม** | หน้ากากกรองควันเชื่อม (Welding Fume Mask) | เปลี่ยนเมื่อมีกลิ่นไหม้หรือหายใจติดขัด | เอกสาร Training Matrix & JSA (F-SE-039) |
`,
    },
    {
      id: 3,
      title: '3. ระเบียบสุขภาพ พขร. (เป่าแอลกอฮอล์ & ความดัน >140/90)',
      category: 'ความปลอดภัยการขนส่ง (TSM & Trucking)',
      shortDesc: 'ทำไมความดันเกิน 140/90 ต้องให้นั่งพักผ่อน 15 นาทีแล้ววัดซ้ำก่อนปล่อยรถ?',
      fullExplanation: `### ทำไมพนักงานขับรถขนส่ง (พขร.) ความดันเกิน 140/90 ต้องให้นั่งพัก 15 นาทีแล้ววัดซ้ำ?

#### 1. เหตุผลทางการแพทย์และความปลอดภัยบนท้องถนน
* **ภาวะ White Coat Effect และความเหนื่อยล้า:** คนขับรถที่เพิ่งเดินทางมาถึง หรือรีบวิ่งมาลงชื่อ อาจมีชีพจรและความดันโลหิตพุ่งสูงชั่วคราว การให้นั่งพักในห้องปรับอากาศหรือที่ร่ม 15 นาทีจะทำให้สรีรวิทยาของร่างกายกลับสู่สภาวะสงบจริง
* **การป้องกันโรควูบ หลอดเลือดสมอง และหัวใจวายเฉียบพลัน:** หากปล่อยให้ พขร. ที่มีความดันสูงต่อเนื่อง (เช่น ตัวบนเกิน 140 หรือตัวล่างเกิน 90) ออกไปขับรถหัวลากที่มีน้ำหนักบรรทุกกว่า 30-40 ตัน ท่ามกลางสภาพอากาศร้อนจัดและสภาพการจราจรติดขัด มีความเสี่ยงสูงมากที่จะเกิดอาการหน้ามืด วูบ หรือเส้นเลือดในสมองแตก ซึ่งนำไปสู่อุบัติเหตุร้ายแรงบนท้องถนน
* **ข้อกำหนดกฎหมาย TSM ขนส่งทางบก:** กรมการขนส่งทางบกกำหนดให้ผู้ประกอบการขนส่งต้องมีระบบความปลอดภัย TSM และต้องคัดกรองความพร้อมด้านสุขภาพก่อนปฏิบัติหน้าที่ทุกวัน

#### 2. ตารางเกณฑ์การตัดสินและการดำเนินการคัดกรอง พขร.

| รายการตรวจ | เกณฑ์ผ่าน | ผลที่พบเกินเกณฑ์ | การดำเนินการทันที |
| :--- | :--- | :--- | :--- |
| **แอลกอฮอล์** | 0.00 มก.% | > 0.00 มก.% | **สั่งหยุดงานทันที** ปลดออกจากเวรขับรถ และส่งตรวจสารเสพติด |
| **ความดันโลหิต** | < 140/90 mmHg | ≥ 140/90 mmHg | **ให้นั่งพักผ่อน 15 นาที** ในจุดที่กำหนด แล้วทำการวัดซ้ำ |
| **วัดซ้ำรอบสอง** | < 140/90 mmHg | ≥ 140/90 mmHg | **ห้ามขับรถเด็ดขาด** ให้สับเปลี่ยน พขร. สำรอง และส่งพบแพทย์อาชีวเวชศาสตร์ |
`,
    },
    {
      id: 4,
      title: '4. การคัดแยกและทิ้งขยะอันตราย (ห้ามปนเศษเหล็ก)',
      category: 'สิ่งแวดล้อม (ISO 14001)',
      shortDesc: 'ทำไมกระป๋องสีและเศษผ้าเปื้อนน้ำมัน ห้ามทิ้งปะปนกับเศษเหล็กหรือขยะทั่วไป?',
      fullExplanation: `### ทำไมกระป๋องสีและเศษผ้าเปื้อนน้ำมัน ห้ามทิ้งปะปนกับเศษเหล็กหรือขยะทั่วไปเด็ดขาด?

#### 1. เหตุผลด้านสิ่งแวดล้อมและกฎหมาย
* **กฎหมายกากอุตสาหกรรม (ประกาศ กรอ. 2566):** เศษผ้าเปื้อนน้ำมัน กระป๋องสเปรย์ และกระป๋องสี จัดเป็น "ของเสียอันตราย (Hazardous Waste)" หากนำไปทิ้งปะปนกับเศษเหล็กที่จะนำไปรีไซเคิล หรือขยะทั่วไป จะทำให้ขยะทั้งหมดถูกปนเปื้อน และบริษัทจะมีความผิดตาม พ.ร.บ.โรงงาน และ พ.ร.บ.ส่งเสริมและรักษาคุณภาพสิ่งแวดล้อม
* **ความเสี่ยงเพลิงไหม้ (Spontaneous Combustion):** เศษผ้าที่ชุ่มด้วยน้ำมันหรือทินเนอร์ เมื่อกองทับถมกันในถังขยะท่ามกลางอากาศร้อนจัดของลานตู้คอนเทนเนอร์ สามารถเกิดปฏิกิริยาคายความร้อนจนลุกไหม้เองได้ (Spontaneous Ignition)
* **การสอบกลับ Manifest:** ผู้รับกำจัดขยะที่ได้รับอนุญาต (รง.4 ประเภท 105/106) จะต้องออกใบกำกับการขนส่ง (กอ.1) และระบุรหัสของเสียตรงตามประเภท หากตรวจพบการปะปน ผู้รับกำจัดจะปฏิเสธการรับและถูกผู้ตรวจ CB ปรับตกเป็น Major NC ทันที

#### 2. ตารางจำแนกการคัดแยกขยะในลานตู้คอนเทนเนอร์ K.R.C.

| ประเภทขยะ | ตัวอย่างของเสียหน้างาน | ถังขยะที่ต้องทิ้ง | วิธีการกำจัด / ผู้รับกำจัด |
| :--- | :--- | :--- | :--- |
| **ขยะอันตราย** | เศษผ้าเปื้อนน้ำมัน, กระป๋องสี, ถุงมือเปื้อนสารเคมี | ถังสีแดง มีฝาปิดมิดชิด ติดป้ายวัตถุอันตราย | ส่งผู้รับกำจัดที่ได้รับอนุญาต กรอ. (มีใบ กอ.1) |
| **ขยะรีไซเคิล/เศษเหล็ก** | เศษเหล็กปะผุตู้, ลวดเชื่อมเหลือใช้, ชิ้นส่วนโลหะ | ถังหรือกระบะเศษเหล็กเฉพาะ ไม่ปนเปื้อนน้ำมัน | ส่งโรงหลอมหรือขายเป็นเศษเหล็กรีไซเคิล |
| **ขยะทั่วไป** | เศษอาหาร, พลาสติกห่อของ, กระดาษเอกสาร | ถังสีเขียว/น้ำเงิน มีถุงดำ | ส่งเทศบาลท้องถิ่น (เทศบาลนครแหลมฉบัง/ทุ่งสุขลา) |
`,
    },
    {
      id: 5,
      title: '5. มาตรการควบคุมสะเก็ดไฟ & ห้ามทิ้งก้นบุหรี่บนพื้นลาน',
      category: 'ความปลอดภัยอัคคีภัย & ระเบียบลานตู้',
      shortDesc: 'การทำงานที่มีประกายไฟ และการควบคุมการสูบบุหรี่ในลานตู้คอนเทนเนอร์',
      fullExplanation: `### มาตรการควบคุมสะเก็ดไฟ และการห้ามทิ้งก้นบุหรี่บนพื้นลานตู้คอนเทนเนอร์

#### 1. เหตุผลด้านความเสี่ยงอัคคีภัยในลานตู้
* **ลานตู้คอนเทนเนอร์เป็นพื้นที่ความเสี่ยงไฟไหม้สูง:** ในลานตู้มีทั้งตู้เก็บสินค้าอันตราย (IMDG), ถังน้ำมันดีเซลของรถยก/หัวลาก, ตู้ Reefer ที่มีฉนวนโฟมไวไฟ และสารเคลือบสีตู้
* **การสูบบุหรี่ไม่เป็นที่:** การทิ้งก้นบุหรี่ที่ยังไม่ดับสนิทลงบนพื้นลาน หรือโยนเข้าใต้ท้องรถหัวลากที่มีคราบน้ำมัน สามารถลุกลามเป็นเพลิงไหม้ขนาดใหญ่ได้อย่างรวดเร็ว
* **การขออนุญาต Hot Work Permit:** งานเชื่อม ตัด เจียร ต้องมีมาตรการกั้นสะเก็ดไฟ (Fire Blanket) ถังดับเพลิงประจำจุด และมีผู้เฝ้าระวังไฟ (Fire Watch) ตลอดเวลาที่ปฏิบัติงาน

#### 2. ข้อบังคับเชิงระบบ K.R.C.
1. กำหนด "จุดสูบบุหรี่ที่ถูกกฎหมาย" เพียงจุดเดียวที่มีป้ายชัดเจน มีถังทรายดับก้นบุหรี่ และอยู่ห่างจากจุดเสี่ยงไม่น้อยกว่า 5 เมตร ตามประกาศ สธ. 2561
2. ห้ามสูบบุหรี่บนรถหัวลาก บนรถยก หรือในพื้นที่ลานตู้คอนเทนเนอร์เด็ดขาด หากพบเห็นจะพักงานและปรับคะแนนใน FM-PU-008
`,
    },
    {
      id: 6,
      title: '6. บันทึกควบคุมใน Aspect (F-SE-001) และ JSA (F-SE-039)',
      category: 'ระบบเอกสาร (ISO 14001 / 45001)',
      shortDesc: 'ทำไมต้องระบุบันทึกควบคุมจริงในทะเบียน Aspect & JSA สำหรับงานเสี่ยง?',
      fullExplanation: `### การระบุบันทึกควบคุม (Control Records) ในทะเบียน Aspect (F-SE-001) และ JSA (F-SE-039)

#### 1. ปัญหาเดิมที่ CB พบ (CB NC3 & IA2025 #2)
* ในอดีต ทะเบียน Aspect และ JSA ของบริษัทมักเขียนมาตรการควบคุมแบบลอยๆ เช่น "ควบคุมดูแล", "ปฏิบัติตามขั้นตอน" แต่ไม่มีการระบุชัดเจนว่า **"มีบันทึกควบคุม (Control Record) รหัสแบบฟอร์มใดที่ใช้หน้างานจริง"**
* ส่งผลให้ผู้ตรวจ CB ปรับตกเป็น NC เพราะไม่สามารถพิสูจน์ได้ว่ามาตรการที่เขียนไว้ในกระดาษ มีการนำไปปฏิบัติจริงหน้างาน

#### 2. ตัวอย่างการเชื่อมโยงบันทึกควบคุมที่ถูกต้องตามระบบ K.R.C.

| กิจกรรมเสี่ยง | สิ่งแวดล้อม / อันตราย | มาตรการควบคุมที่ระบุ | บันทึกควบคุมหน้างานจริง (Control Record) |
| :--- | :--- | :--- | :--- |
| **การล้างตู้/ล้างรถยก** | น้ำทิ้งปนเปื้อนไขมัน/สิ่งสกปรก | บ่อดักไขมัน และการลอกตะกอนตามรอบ | ใบบันทึกลอกตะกอนบ่อดักไขมัน + ผลวิเคราะห์น้ำทิ้ง |
| **งานซ่อมบนหลังคาตู้** | พลัดตกจากที่สูง (> 2 เมตร) | อุปกรณ์กันตก Lifeline และบันไดมาตรฐาน | ใบอนุญาตทำงานบนที่สูง (Work at Height Permit) |
| **งานยกอะไหล่หนัก** | อะไหล่หล่นทับ, สลิงขาด | ตรวจสอบพิกัดยกและสลิงก่อนใช้งาน | ใบบันทึกตรวจเช็กรอกและสลิงประจำวัน (Check sheet) |
| **การเติมน้ำมันดีเซล** | การรั่วไหลลงสู่พื้นดิน/รางระบายน้ำ | ถาดรองรับ Drip Tray + ชุด Spill Kit | ใบบันทึกการตรวจสอบสภาพ Spill Kit ประจำเดือน |
`,
    },
    {
      id: 7,
      title: '7. ทบทวน SWOT & ผลกระทบ Climate Change (ISO Amd 1:2024)',
      category: 'บริบทองค์กร (ISO ข้อ 4.1)',
      shortDesc: 'ทำไมบริษัทโลจิสติกส์ต้องประเมิน Climate Change ในบริบทองค์กร?',
      fullExplanation: `### การทบทวนบริบทองค์กร SWOT และผลกระทบจาก Climate Change (ISO Amd 1:2024)

#### 1. ข้อกำหนดแก้ไขใหม่ (ISO Amendment 1:2024)
* ตั้งแต่วันที่ 23 กุมภาพันธ์ 2024 องค์กร ISO ได้ประกาศแก้ไขเพิ่มเติมข้อกำหนดข้อ 4.1 และ 4.2 ของมาตรฐาน ISO 9001, 14001, 45001 โดยกำหนดว่า: **"องค์กรต้องพิจารณาตัดสินว่าการเปลี่ยนแปลงสภาพภูมิอากาศ (Climate Change) เป็นประเด็นที่เกี่ยวข้องกับองค์กรหรือไม่"**
* หากเป็นประเด็นที่เกี่ยวข้อง ต้องถูกนำไปถ่ายทอดลงสู่ทะเบียนความเสี่ยงและโอกาส (Risk & Opportunity Register) และจัดทำแผนรองรับ

#### 2. ประเด็น Climate Change ที่ส่งผลกระทบต่อ บจก. เค.อาร์.ซี. ทรานสปอร์ต แอนด์ เซอร์วิส

| มุมมองผลกระทบ | ความเสี่ยงที่เกิดขึ้นจริง | แผนปฏิบัติการรองรับของ K.R.C. |
| :--- | :--- | :--- |
| **อาชีวอนามัย (45001)** | คลื่นความร้อนสูง ทำให้คนงานลานตู้และ พขร. เสี่ยงเป็นโรคลมแดด (Heat Stroke) | จัดจุดพักพร้อมน้ำดื่มเกลือแร่, ตรวจสุขภาพก่อนขับรถ, ปรับเวลาทำงานช่วงแดดจัด |
| **การดำเนินงาน (9001)** | ฝนตกหนักผิดปกติ ทำให้น้ำท่วมขังลานตู้คอนเทนเนอร์ ส่งผลให้รถยกสัญจรไม่ได้ | ติดตั้งเครื่องสูบน้ำสำรอง, ปรับปรุงระบบระบายน้ำลาน, ซ้อมแผน ERP น้ำท่วมลาน |
| **สิ่งแวดล้อม (14001)** | อุณหภูมิสูงทำให้ตู้ Reefer ใช้พลังงานไฟฟ้าสูงขึ้น และรถหัวลากสิ้นเปลืองน้ำมันดีเซล | บำรุงรักษาระบบไฟ Reefer ตามรอบ, ติดตั้ง GPS ตรวจสอบพฤติกรรมการขับขี่ประหยัดน้ำมัน |
| **ความต้องการลูกค้า** | สายเรือและลูกค้าเรียกร้องการลดการปล่อยก๊าซเรือนกระจก (Scope 1 & Scope 2 GHG) | รวบรวมข้อมูลคาร์บอนฟุตพริ้นท์การใช้น้ำมัน และเตรียมพร้อมรับ พ.ร.บ.การเปลี่ยนแปลงสภาพภูมิอากาศ |
`,
    },
    {
      id: 8,
      title: '8. ระเบียบการลงนามท้ายฟอร์ม F-PU-008 (สิทธิ์ผู้รับเหมา)',
      category: 'การควบคุมผู้รับเหมา (P-PU-002)',
      shortDesc: 'ทำไมผู้รับเหมามีสิทธิ์ลงนามเพียงช่อง "Acknowledged by vendor" เท่านั้น?',
      fullExplanation: `### ระเบียบการลงนามท้ายแบบฟอร์มประเมินผู้รับเหมา (FM-PU-008)

#### 1. หลักการแบ่งแยกหน้าที่และความโปร่งใส (Governance & Segregation of Duties)
* **ผู้รับเหมาเป็นผู้ถูกประเมิน (Evaluated Party):** ในกระบวนการตรวจประเมินคุณภาพ ความปลอดภัย และสิ่งแวดล้อม ผู้รับเหมาเป็นบุคคลภายนอกที่อยู่ภายใต้การกำกับดูแลของ บจก. เค.อาร์.ซี. ทรานสปอร์ต แอนด์ เซอร์วิส
* **ป้องกันผลประโยชน์ทับซ้อน (Conflict of Interest):** หากผู้รับเหมาลงนามในช่องตรวจสอบ (Reviewed) หรืออนุมัติ (Approved) จะถือว่าผู้ถูกประเมินเป็นผู้อนุมัติผลงานตนเอง ซึ่งขัดต่อหลักการตรวจสอบสากล (Audit Principles) และผู้ตรวจ CB จะถือเป็นข้อบกพร่องด้านการควบคุมระบบเอกสารทันที

#### 2. ลำดับการลงนามที่ถูกต้องตามระเบียบ K.R.C.

| ช่องลงนาม | ผู้มีสิทธิ์ลงนาม | ความรับผิดชอบตามระบบ |
| :--- | :--- | :--- |
| **1. Prepared by (ผู้จัดทำ)** | เจ้าหน้าที่จัดซื้อ / เจ้าหน้าที่ QSHE K.R.C. | รวบรวมข้อมูลสถิติหน้างานและคำนวณคะแนนตามแบบฟอร์ม |
| **2. Proposed by (ผู้เสนอ)** | Supervisor ควบคุมงานหน้างาน K.R.C. | ยืนยันพฤติกรรมความปลอดภัยและคุณภาพงานจริงหน้างาน |
| **3. Reviewed by (ผู้ตรวจสอบ)** | ผู้จัดการฝ่ายจัดซื้อ / ผู้จัดการฝ่าย QSHE K.R.C. | ตรวจสอบความถูกต้องของเกณฑ์คะแนนและสั่งการออก CAR (ถ้า < 70 คะแนน) |
| **4. Approved by (ผู้อนุมัติ)** | ผู้บริหารระดับสูง (President & CEO / COO) K.R.C. | อนุมัติผลการประเมินและการต่อสัญญาจ้างผู้รับเหมา |
| **5. Acknowledged by vendor** | **ตัวแทนผู้รับเหมา (Vendor / Subcontractor)** | **ลงนามเพื่อรับทราบผลคะแนนและข้อบกพร่องที่ต้องแก้ไขเท่านั้น** |
`,
    },
  ];

  const handleAskQuestion = async () => {
    if (!customQuestion.trim()) return;

    setLoading(true);
    setChatResponse('');

    try {
      const res = await fetch('/api/audit/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: customQuestion,
          findingContext: 'คำถามเกี่ยวกับระบบบริหารจัดการ ISO 9001/14001/45001 และกฎหมายความปลอดภัยลานตู้/การขนส่ง K.R.C.',
        }),
      });
      const data = await res.json();
      setChatResponse(data.explanation || 'ไม่มีคำตอบ');
    } catch (err: any) {
      setChatResponse('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Tab Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-xl border border-white/20 text-amber-300">
            <MessageCircleQuestion className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-blue-200">
              Auditor Friendly & Auditee Explainer
            </span>
            <h3 className="text-lg font-bold">
              ศูนย์รวมคำอธิบายและแนวทางตอบข้อสงสัย Auditee (Auditee Consultation Hub)
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              รวม 8 ประเด็นหลักที่มักเกิดข้อโต้แย้งหน้างาน พร้อมเหตุผลด้านความปลอดภัย ข้อกำหนด ISO และกฎหมายไทยในรูปแบบตาราง เพื่อให้ทีมงานนำไปชี้แจงได้ทันที
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 8 Strategic Topics List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>8 จุดสกัดกั้นความเสี่ยงวิกฤต (Critical EHS)</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">คลิกเพื่อดูคำชี้แจง</span>
            </div>

            <div className="space-y-2">
              {STRATEGIC_TOPICS.map((topic, index) => {
                const isSelected = selectedTopicIndex === index;
                return (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setSelectedTopicIndex(index);
                      setChatResponse('');
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-400'
                        : 'border-slate-200/90 hover:border-blue-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {topic.category}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug pt-1">
                          {topic.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{topic.shortDesc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ask Custom Question Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-800">
                ถามข้อสงสัยอื่น ๆ กับน้องออดิต (AI Q&A):
              </span>
            </div>

            <div className="space-y-2">
              <textarea
                rows={3}
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="เช่น ผู้รับเหมาเถียงว่า ทำไมงานปะผุตู้ต้องมีถังดับเพลิงประจำจุด ทั้งที่ถังรวมอยู่อีก 20 เมตร?..."
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />

              <button
                onClick={handleAskQuestion}
                disabled={loading || !customQuestion.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'น้องออดิตกำลังจัดเตรียมคำตอบ...' : 'ให้น้องออดิตตอบและอธิบายแทน'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Explanation Display (Markdown format with Copy button) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">
                  {chatResponse
                    ? 'คำตอบสำหรับข้อสงสัยเฉพาะจากน้องออดิต'
                    : selectedTopicIndex !== null
                    ? STRATEGIC_TOPICS[selectedTopicIndex].title
                    : 'คำอธิบายมาตรฐาน'}
                </span>
              </div>

              <button
                onClick={() =>
                  handleCopy(
                    chatResponse ||
                      (selectedTopicIndex !== null
                        ? STRATEGIC_TOPICS[selectedTopicIndex].fullExplanation
                        : '')
                  )
                }
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-300 transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">คัดลอกข้อความแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>คัดลอกตาราง & เนื้อหา</span>
                  </>
                )}
              </button>
            </div>

            {/* Explanation Content */}
            <div className="overflow-x-auto text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
              {loading ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-medium text-blue-800">
                    น้องออดิต กำลังค้นหาข้อกำหนด ISO และกฎหมายไทย เพื่อเขียนคำอธิบายและสร้างตารางเปรียบเทียบ...
                  </p>
                </div>
              ) : chatResponse ? (
                <div className="prose prose-sm max-w-none text-slate-800 space-y-3">
                  {chatResponse}
                </div>
              ) : selectedTopicIndex !== null ? (
                <div className="prose prose-sm max-w-none text-slate-800 space-y-3">
                  {STRATEGIC_TOPICS[selectedTopicIndex].fullExplanation}
                </div>
              ) : (
                <p className="text-slate-400 italic">เลือกหัวข้อทางด้านซ้ายเพื่อดูคำอธิบาย</p>
              )}
            </div>

            {/* Bottom Tip for Supervisor */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>
                💡 <strong>เคล็ดลับ:</strong> คุณสามารถกดปุ่ม "คัดลอกตาราง & เนื้อหา" เพื่อนำไป Paste ลงใน Google Docs หรือ Google Sheets ได้ทันทีโดยตารางจะไม่เพี้ยน
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
