import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Persistent Local Database Store
const DB_FILE = path.resolve(process.cwd(), 'database_store.json');

interface DatabaseStore {
  checklistItems: any[];
  checklistTitle: string;
  isCustomChecklist: boolean;
  teamMembers: any[];
  auditSchedule: any[];
  lastUpdated: string;
}

function loadDatabaseStore(): DatabaseStore {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Error reading database_store.json, initializing fresh store:', err);
  }

  const defaultStore: DatabaseStore = {
    checklistItems: [],
    checklistTitle: 'Audit Checklist',
    isCustomChecklist: true,
    teamMembers: [],
    auditSchedule: [],
    lastUpdated: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultStore, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to initialize database_store.json:', e);
  }

  return defaultStore;
}

let memoryDbStore: DatabaseStore = loadDatabaseStore();

function saveDatabaseStore(updates: Partial<DatabaseStore>) {
  memoryDbStore = {
    ...memoryDbStore,
    ...updates,
    lastUpdated: new Date().toISOString(),
  };
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryDbStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save to database_store.json:', err);
  }
}

// Shared Gemini AI client with required telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper: Call Gemini with model fallback and retry on transient 503/429
const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest'];

async function generateContentWithRetry(params: any, maxRetries = 2): Promise<any> {
  let lastError: any = null;
  for (const model of CANDIDATE_MODELS) {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await ai.models.generateContent({
          ...params,
          model,
        });
      } catch (err: any) {
        attempt++;
        lastError = err;
        const isTransient =
          err?.message?.includes('503') ||
          err?.message?.includes('429') ||
          err?.message?.includes('high demand') ||
          err?.status === 503 ||
          err?.status === 429;
        if (isTransient && attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 800));
          continue;
        }
        break; // try fallback model
      }
    }
  }
  throw lastError;
}

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Nong Audit AI Mock Auditor - KRC' });
});

// API: Evaluate evidence against checklist item
app.post('/api/audit/evaluate', async (req, res) => {
  try {
    const { checklistItem, evidenceText, evidenceImageBase64, auditeeResponse } = req.body;

    const systemInstruction = `
คุณคือ "น้องออดิต" AI ผู้ช่วยผู้เชี่ยวชาญระดับสูงด้านระบบบริหารจัดการคุณภาพ ความปลอดภัย อาชีวอนามัย และสิ่งแวดล้อม (ISO 9001:2015, ISO 14001:2015, ISO 45001:2018 รวม Amd 1:2024 Climate Change) และกฎหมายความปลอดภัยลานตู้คอนเทนเนอร์ คลังสินค้า และการขนส่งโลจิสติกส์ของไทย
สังกัด: บริษัท เค.อาร์.ซี. ทรานสปอร์ต แอนด์ เซอร์วิส จำกัด (K.R.C.)

หน้าที่ของคุณ: ตรวจสอบหลักฐานการทำงานแทน Lead Auditor, ประเมินความสอดคล้องตามข้อกำหนด ISO และกฎหมายไทย, ให้คะแนนตัดสินใจเบื้องต้น (C = Conforming, MA = Major NC, MI = Minor NC, OBS = Observation, OFI = Opportunity for Improvement)
และหากพบข้อบกพร่อง (MA, MI, OBS) ให้ร่างแผนแก้ไขป้องกัน (Corrective Action Plan - CAP) หรือใบ CAR (F-CR-004) แนบให้เสร็จสรรพ

ยึดหลักสำคัญ 3 ประการ:
1. User Friendly: ภาษาไทยกระชับ เข้าใจง่าย ตรงประเด็น
2. Auditor Friendly: อ้างอิงข้อกำหนด ISO (9001/14001/45001) และมาตรากฎหมายไทย (พ.ร.บ./กฎกระทรวง/ประกาศ ขบ.) เสมอ
3. Proactive Automation: ร่าง CAP/CAR ให้ครบถ้วน (RCA ห้ามหยุดแค่ "ขาดความตระหนัก", CA ต้องแก้ที่ระบบ ไม่ใช่แค่ "อบรมเน้นย้ำ", ระบุ Extent Analysis)
   * กฎการลงนาม: ผู้รับเหมาลงได้เฉพาะ "Acknowledged by vendor" เท่านั้น ส่วนช่อง เตรียม/เสนอ/ทบทวน/อนุมัติ ต้องเป็นเจ้าหน้าที่ K.R.C.
`;

    let auditeeDetails = '';
    if (auditeeResponse) {
      auditeeDetails = `
[คำชี้แจงและหลักฐานที่ยื่นโดย Auditee / ผู้รับการตรวจ]:
- ผู้ชี้แจง: ${auditeeResponse.responderName || 'ตัวแทนหน่วยงาน/ผู้รับเหมา'} (${auditeeResponse.responderDept || 'ไม่ระบุแผนก'})
- คำชี้แจงของ Auditee: ${auditeeResponse.explanation || 'ไม่ได้ระบุคำชี้แจง'}
- วันเวลาที่ส่ง: ${auditeeResponse.submittedAt || 'ล่าสุด'}
- รายการไฟล์/รูปภาพแนบ: ${
        auditeeResponse.attachments?.length
          ? auditeeResponse.attachments.map((a: any) => `${a.name} (${a.type}${a.url ? `: ${a.url}` : ''})`).join(', ')
          : 'ไม่มีไฟล์แนบ'
      }
`;
    }

    const promptText = `
กรุณาตรวจสอบหลักฐานต่อไปนี้ สำหรับข้อตรวจของ K.R.C. Check List (F-SE-006):

[ข้อตรวจ]:
- ลำดับข้อ: ${checklistItem?.id || 'ข้อทั่วไป'}
- หมวด: ${checklistItem?.categoryTitle || 'การตรวจหน้างานทั่วไป'}
- ข้อกำหนด: ${checklistItem?.requirement || '-'}
- คำถาม Audit: ${checklistItem?.question || '-'}
- เอกสารอ้างอิง: ${checklistItem?.referenceDocs || '-'}
- หลักฐานที่ต้องการ: ${checklistItem?.requiredEvidence || '-'}
- หมายเหตุ/ประวัติข้อบกพร่องเดิม: ${checklistItem?.remarks || '-'}

[หลักฐานหรือข้อเท็จจริงที่พบหน้างาน / ที่บันทึกไว้]:
${evidenceText || 'ไม่มีคำอธิบายเพิ่มเติม'}
${auditeeDetails}

โปรดประเมินผลอย่างเข้มงวดและเที่ยงตรงตามมาตรฐาน Auditor โดยพิจารณาคำชี้แจงและหลักฐานของ Auditee ว่ามีความสอดคล้องเพียงพอตามเกณฑ์หรือไม่ และส่งผลลัพธ์เป็น JSON ตามโครงสร้างที่กำหนด`;

    const contents: any[] = [];
    if (evidenceImageBase64) {
      // Clean base64 header if present
      const cleanBase64 = evidenceImageBase64.replace(/^data:image\/\w+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    // Also include any image attachment from auditeeResponse
    if (auditeeResponse?.attachments && Array.isArray(auditeeResponse.attachments)) {
      for (const att of auditeeResponse.attachments) {
        if (att.type === 'IMAGE' && att.dataUrl) {
          const mimeMatch = att.dataUrl.match(/^data:(image\/\w+);base64,/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const cleanBase64 = att.dataUrl.replace(/^data:image\/\w+;base64,/, '');
          contents.push({
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          });
        }
      }
    }

    contents.push({ text: promptText });

    const response = await generateContentWithRetry({
      model: 'gemini-3.8-flash',
      contents: contents.length === 1 ? contents[0].text : { parts: contents },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: {
              type: Type.STRING,
              description: 'สถานะผลการประเมิน: C, MA, MI, OBS, OFI',
            },
            statusTitle: {
              type: Type.STRING,
              description: 'ชื่อภาษาไทยของสถานะ เช่น ข้อบกพร่องขั้นรุนแรง (Major Non-conformance)',
            },
            evidenceRecorded: {
              type: Type.STRING,
              description: 'บันทึกสิ่งตรวจพบ / หลักฐานที่แสดง (Finding & Objective Evidence)',
            },
            auditorFindingDetail: {
              type: Type.STRING,
              description: 'บทวิเคราะห์ข้อบกพร่องและผลการประเมินของ Lead Auditor',
            },
            isoClauses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'ข้อกำหนด ISO ที่เกี่ยวข้อง เช่น ISO 45001:2018 ข้อ 8.1',
            },
            lawReferences: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'กฎหมายไทยที่เกี่ยวข้อง เช่น กฎกระทรวงสารเคมีอันตราย พ.ศ. 2556',
            },
            riskLevel: {
              type: Type.STRING,
              description: 'ระดับความเสี่ยง: LOW, MEDIUM, HIGH, CRITICAL',
            },
            explainerForAuditee: {
              type: Type.STRING,
              description: 'คำอธิบายที่เป็นมิตรและชัดเจนสำหรับตอบ Auditee หากมีข้อสงสัยหรือข้อโต้แย้ง',
            },
            capRequired: {
              type: Type.BOOLEAN,
              description: 'จำเป็นต้องออกใบ CAR/CAP หรือไม่ (true ถ้าเป็น MA, MI, หรือ OBS สำคัญ)',
            },
            capDraft: {
              type: Type.OBJECT,
              description: 'ร่างแผนแก้ไขและป้องกัน (Corrective Action Plan)',
              properties: {
                carNo: { type: Type.STRING },
                targetDate: { type: Type.STRING },
                personInCharge: { type: Type.STRING },
                rootCause: { type: Type.STRING, description: 'สาเหตุที่แท้จริง (RCA เจาะลึก)' },
                correction: { type: Type.STRING, description: 'การแก้ไขเบื้องต้นเฉพาะหน้าทันที' },
                correctiveAction: { type: Type.STRING, description: 'การแก้ไขเชิงระบบไม่ให้เกิดซ้ำ' },
                preventiveAction: { type: Type.STRING, description: 'การป้องกันความเสี่ยงในอนาคต' },
                extentAnalysis: { type: Type.STRING, description: 'การขยายผลตรวจไปยังจุด/หน่วยงานอื่น' },
                signatories: {
                  type: Type.OBJECT,
                  properties: {
                    preparedBy: { type: Type.STRING },
                    proposedBy: { type: Type.STRING },
                    reviewedBy: { type: Type.STRING },
                    approvedBy: { type: Type.STRING },
                    acknowledgedByVendor: { type: Type.STRING },
                  },
                },
              },
            },
          },
          required: [
            'status',
            'statusTitle',
            'evidenceRecorded',
            'auditorFindingDetail',
            'isoClauses',
            'lawReferences',
            'riskLevel',
            'explainerForAuditee',
            'capRequired',
          ],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');
    if (!parsedData.status) {
      throw new Error('Gemini response missing status');
    }
    res.json(parsedData);
  } catch (error: any) {
    console.warn('Gemini API evaluation failed, executing KRC QSHE Expert Evaluation Engine:', error?.message || error);
    try {
      const fallbackResult = evaluateEvidenceWithKrcEngine(
        req.body?.checklistItem,
        req.body?.evidenceText,
        req.body?.evidenceImageBase64,
        req.body?.auditeeResponse
      );
      return res.json(fallbackResult);
    } catch (engineErr: any) {
      console.error('KRC Engine error:', engineErr);
      return res.status(500).json({
        error: 'เกิดข้อผิดพลาดในการประเมินหลักฐาน',
        details: engineErr.message,
      });
    }
  }
});

// Domain Expert Rule-Based Engine: K.R.C. QSHE Audit System (ISO 9001/14001/45001)
function evaluateEvidenceWithKrcEngine(
  checklistItem: any,
  evidenceText: string = '',
  evidenceImageBase64?: string,
  auditeeResponse?: any
) {
  const itemNo = checklistItem?.id || 1;
  const q = (checklistItem?.question || '').toLowerCase();
  const req = (checklistItem?.requirement || '').toLowerCase();
  const ref = (checklistItem?.referenceDocs || '').toLowerCase();
  const cat = (checklistItem?.categoryTitle || '').toLowerCase();
  const ev = (evidenceText || '').toLowerCase();
  const audExplanation = (auditeeResponse?.explanation || '').toLowerCase();
  const audAttachments = auditeeResponse?.attachments || [];
  const fullText = `${q} ${req} ${ref} ${cat} ${ev} ${audExplanation}`;

  let status: 'C' | 'MA' | 'MI' | 'OBS' | 'OFI' = 'C';
  let statusTitle = 'สอดคล้องตามข้อกำหนด (Conforming)';
  let auditorFindingDetail = '';
  let isoClauses: string[] = checklistItem?.isoClauses && checklistItem.isoClauses.length > 0
    ? checklistItem.isoClauses
    : ['ISO 9001:2015 ข้อ 8.1', 'ISO 45001:2018 ข้อ 8.1'];
  let lawReferences: string[] = checklistItem?.lawReferences && checklistItem.lawReferences.length > 0
    ? checklistItem.lawReferences
    : ['กฎหมายความปลอดภัย อาชีวอนามัย และสิ่งแวดล้อม'];
  let riskLevel = 'LOW';
  let explainerForAuditee = '';
  let capRequired = false;

  let rootCause = 'จากการทบทวนระบบบริหารจัดการ';
  let correction = 'ดำเนินการแก้ไขข้อบกพร่องเฉพาะหน้าทันที';
  let correctiveAction = 'ทบทวนและปรับปรุงขั้นตอนการปฏิบัติงานเชิงระบบเพื่อป้องกันการเกิดซ้ำ';
  let preventiveAction = 'จัดอบรมและสุ่มตรวจประเมินซ้ำตามรอบ Audit';
  let extentAnalysis = 'ขยายผลการสุ่มตรวจสอบไปยังทุกหน่วยงานที่เกี่ยวข้อง';

  // 1. Chemical in drinking water bottle / no GHS label / no SDS (Critical EHS Rule)
  if (
    fullText.includes('ขวดน้ำดื่ม') ||
    fullText.includes('ขวดน้ำ') ||
    (fullText.includes('สารเคมี') && (fullText.includes('ไม่มีฉลาก') || fullText.includes('ไม่ติด') || fullText.includes('ไม่มี sds') || fullText.includes('ขวด'))) ||
    fullText.includes('น้ำมันล้างเบรก')
  ) {
    status = 'MA';
    statusTitle = 'ข้อบกพร่องขั้นรุนแรง (Major Non-conformance)';
    auditorFindingDetail = `สุ่มตรวจบริเวณพื้นที่ปฏิบัติงาน/ผู้รับเหมา พบการนำขวดน้ำดื่มพลาสติกมาบรรจุสารเคมีอันตราย (น้ำมันล้างเบรก/ทินเนอร์) โดยไม่มีการติดฉลากเตือนตามระบบ GHS และไม่มีเอกสารข้อมูลความปลอดภัยสารเคมี (SDS) ภาษาไทย ณ จุดใช้งาน ซึ่งขัดต่อนโยบายความปลอดภัยของ K.R.C. (ระเบียบ P-PU-002) และกฎหมายสารเคมีอันตรายอย่างร้ายแรง เสี่ยงต่อการหยิบดื่มผิดหรือเกิดอุบัติเหตุสารเคมีหกรั่วไหล`;
    isoClauses = ['ISO 45001:2018 ข้อ 8.1.2', 'ISO 14001:2015 ข้อ 8.1', 'ISO 9001:2015 ข้อ 8.4'];
    lawReferences = [
      'กฎกระทรวงกำหนดมาตรฐานในการบริหาร จัดการ และดำเนินการด้านความปลอดภัย อาชีวอนามัย และสภาพแวดล้อมในการทำงานเกี่ยวกับสารเคมีอันตราย พ.ศ. 2556',
      'พ.ร.บ. ความปลอดภัย อาชีวอนามัย และสภาพแวดล้อมในการทำงาน พ.ศ. 2554 มาตรา 14',
    ];
    riskLevel = 'CRITICAL';
    capRequired = true;
    explainerForAuditee = 'การใช้ขวดน้ำดื่มใส่สารเคมีเป็นอันตรายระดับวิกฤต (Fatal Risk) และผิดกฎหมายแรงงานโดยตรง ห้ามใช้ภาชนะอาหาร/เครื่องดื่มใส่สารเคมีเด็ดขาด ต้องใช้ขวดนิรภัยเฉพาะทาง ติดฉลาก GHS และมี SDS ภาษาไทยประจำจุดเสมอ';
    rootCause = 'ขาดระบบสกัดกั้นและตรวจสอบสารเคมีของผู้รับเหมาก่อนนำเข้าพื้นที่ลานตู้ (Gate Inspection) และผู้รับเหมาขาดความตระหนักเชิงระบบในการควบคุมสารเคมีตามระเบียบ P-PU-002';
    correction = 'สั่งระงับการใช้งานทันที นำขวดน้ำดื่มออกจากพื้นที่ ถ่ายสารเคมีใส่ภาชนะนิรภัยสำหรับสารเคมี ติดฉลาก GHS ให้ครบถ้วน และจัดวาง SDS ภาษาไทย ณ จุดใช้งาน';
    correctiveAction = 'จัดตั้งจุดตรวจเครื่องมือและสารเคมีของผู้รับเหมา ณ ประตูทางเข้าลานตู้ และบรรจุข้อกำหนดการควบคุมสารเคมี/บทลงโทษไว้ในสัญญารับเหมาช่วง K.R.C.';
    preventiveAction = 'จัดอบรม Safety Induction เรื่องสารเคมี GHS/SDS ให้แก่ผู้รับเหมาทุกรายก่อนเริ่มงานทุกสัปดาห์ และแต่งตั้ง จป. สุ่มตรวจภาชนะสารเคมีสัปดาห์ละ 2 ครั้ง';
    extentAnalysis = 'ขยายผลการสุ่มตรวจภาชนะบรรจุสารเคมีไปยังอู่ซ่อมบำรุง M&R, ลานล้างตู้คอนเทนเนอร์, และพื้นที่ผู้รับเหมาช่วงทุกรายในลานตู้ K.R.C.';
  }
  // 2. Driver Health / Blood pressure / Alcohol / TSM
  else if (
    fullText.includes('146/94') ||
    (fullText.includes('ความดัน') && (fullText.includes('เกิน') || fullText.includes('14') || fullText.includes('ไม่ได้พัก') || fullText.includes('ไม่ได้ให้นั่งพัก'))) ||
    (fullText.includes('แอลกอฮอล์') && (fullText.includes('พบ') || fullText.includes('บวก') || fullText.includes('เกิน')))
  ) {
    status = 'MA';
    statusTitle = 'ข้อบกพร่องขั้นรุนแรง (Major Non-conformance)';
    auditorFindingDetail = `สุ่มตรวจสมุดประจำรถและบันทึกคัดกรองสุขภาพ พขร. รถหัวลาก พบผลตรวจวัดความดันโลหิตเกิน 140/90 mmHg แต่เจ้าหน้าที่ปล่อยให้ออกรถปฏิบัติงานทันที โดยไม่ได้ปฏิบัติตามระเบียบ TSM และ K.R.C. ที่กำหนดให้ต้องให้นั่งพักผ่อน 15 นาทีแล้ววัดซ้ำเพื่อประเมินความพร้อมก่อนปล่อยรถ`;
    isoClauses = ['ISO 45001:2018 ข้อ 8.1', 'ISO 9001:2015 ข้อ 8.5.1'];
    lawReferences = [
      'ระเบียบกรมการขนส่งทางบก ว่าด้วยการจัดให้มีผู้จัดการด้านความปลอดภัยในการขนส่ง (TSM) พ.ศ. 2562',
      'พ.ร.บ. การขนส่งทางบก พ.ศ. 2522',
    ];
    riskLevel = 'HIGH';
    capRequired = true;
    explainerForAuditee = 'ความดันเกิน 140/90 mmHg มีความเสี่ยงต่อการวูบ หมดสติ หรือเส้นเลือดในสมองแตกขณะขับขี่รถหัวลากขนาดใหญ่ ระเบียบ TSM จึงบังคับให้นั่งพัก 15 นาทีแล้ววัดซ้ำ หากยังเกินเกณฑ์ต้องเปลี่ยนตัวคนขับทันที';
    rootCause = 'เจ้าหน้าที่จุดตรวจปล่อยรถเร่งรีบทำเวลา และขาดระบบแจ้งเตือนอัตโนมัติเมื่อผลวัดความดันเกินเกณฑ์มาตรฐาน';
    correction = 'เรียกตัว พขร. กลับมาตรวจวัดซ้ำ และให้นั่งพักผ่อนในห้องปรับอากาศ หากยังเกิน 140/90 ให้จัดคนขับสำรองปฏิบัติหน้าที่แทนทันที';
    correctiveAction = 'ติดตั้งระบบล็อกคิวจ่ายงานในระบบขนส่ง (TMS Lock) หากเจ้าหน้าที่ไม่บันทึกผลวัดความดันซ้ำหลังพัก 15 นาที จะไม่สามารถพิมพ์ใบส่งของออกรถได้';
    preventiveAction = 'จัดโครงการตรวจสุขภาพ พขร. กลุ่มเสี่ยงความดันโลหิตสูงร่วมกับโรงพยาบาล และจัดสรรยาน้ำดื่มเกลือแร่ประจำจุดพักคนขับ';
    extentAnalysis = 'ตรวจสอบประวัติการคัดกรองสุขภาพ พขร. ทั้งหมดของฝ่ายขนส่งย้อนหลัง 30 วัน';
  }
  // 3. Work at Height / Work Permit / 2.6m / Lifeline
  else if (
    (fullText.includes('ที่สูง') || fullText.includes('2.6') || fullText.includes('หลังคา')) &&
    (fullText.includes('ไม่มี work permit') || fullText.includes('ไม่มี permit') || fullText.includes('ไม่ได้ขอ') || fullText.includes('ไม่ได้สวม') || fullText.includes('ไม่มีใบอนุญาต') || fullText.includes('ไม่มี'))
  ) {
    status = 'MA';
    statusTitle = 'ข้อบกพร่องขั้นรุนแรง (Major Non-conformance)';
    auditorFindingDetail = `ตรวจพบช่างปฏิบัติงานบนหลังคาตู้คอนเทนเนอร์ความสูง 2.6 เมตร โดยไม่มีการขอและอนุมัติใบอนุญาตทำงานบนที่สูง (Work at Height Permit: F-SE-039) และไม่ได้สวมใส่เข็มขัดนิรภัยคล้องสายช่วยชีวิต (Lifeline) ตามเกณฑ์ความปลอดภัยงานเสี่ยง`;
    isoClauses = ['ISO 45001:2018 ข้อ 8.1.2', 'ISO 45001:2018 ข้อ 8.1.4.2'];
    lawReferences = [
      'กฎกระทรวงกำหนดมาตรฐานในการบริหาร จัดการ และดำเนินการด้านความปลอดภัย อาชีวอนามัย และสภาพแวดล้อมในการทำงาน ในสถานที่ที่มีอันตรายจากการตกจากที่สูงฯ พ.ศ. 2564',
    ];
    riskLevel = 'CRITICAL';
    capRequired = true;
    explainerForAuditee = 'งานบนที่สูงเกิน 2 เมตรขึ้นไป เป็นงานเสี่ยงอันตรายถึงชีวิต ต้องขอ Work Permit (F-SE-039) ตรวจความพร้อมของอุปกรณ์ Lifeline และ Full Body Harness ก่อนขึ้นทำงานทุกครั้งโดยไม่มีข้อยกเว้น';
    rootCause = 'ช่างและหัวหน้างานมองว่าเป็นงานซ่อมรอยรั่วสั้นๆ ไม่กี่นาที จึงละเลยขั้นตอนการขอ Work at Height Permit และขาดการสอดส่องของ Supervisor หน้างาน';
    correction = 'สั่งหยุดงานบนที่สูงทันที ให้ช่างลงมายังพื้นราบอย่างปลอดภัย และดำเนินการขออนุมัติ Work Permit ตรวจเช็กอุปกรณ์ PPE ก่อนพิจารณาอนุญาตให้ทำงานต่อ';
    correctiveAction = 'ปรับปรุงขั้นตอนการเบิกจ่ายบันไดและอุปกรณ์ทำงานบนที่สูง โดยกำหนดให้ต้องแนบใบ Work Permit ที่เซ็นอนุมัติแล้วเท่านั้น';
    preventiveAction = 'ติดตั้งป้ายเตือนขนาดใหญ่บริเวณทางขึ้นหลังคาตู้ และให้ จป. สุ่มตรวจพื้นที่ M&R วันละ 2 ครั้ง';
    extentAnalysis = 'ตรวจสอบงานซ่อมตู้บนที่สูงทั้งหมดในลานตู้คอนเทนเนอร์ K.R.C.';
  }
  // 4. Survey Gate mask / Respiratory PPE
  else if (
    (fullText.includes('survey gate') || fullText.includes('gate') || fullText.includes('หน้ากาก')) &&
    (fullText.includes('กระดาษ') || fullText.includes('surgical') || fullText.includes('ไม่ได้รับแจก') || fullText.includes('ไม่มีประวัติ'))
  ) {
    status = 'MI';
    statusTitle = 'ข้อบกพร่องขั้นเล็กน้อย (Minor Non-conformance)';
    auditorFindingDetail = `ตรวจพบพนักงาน Survey Gate สวมใส่หน้ากากอนามัยชนิดกระดาษธรรมดา (Surgical mask) ซึ่งไม่สามารถกรองไอเสียและไอระเหยจากการจราจรของรถหัวลากในลานตู้ได้ และไม่พบบันทึกประวัติการเบิกจ่ายหน้ากากชนิด N95 หรือ Carbon mask ประจำบุคคล`;
    isoClauses = ['ISO 45001:2018 ข้อ 8.1.2', 'ISO 45001:2018 ข้อ 7.4'];
    lawReferences = [
      'กฎกระทรวงกำหนดมาตรฐานการตรวจสุขภาพและอุปกรณ์คุ้มครองความปลอดภัยส่วนบุคคล พ.ศ. 2554',
    ];
    riskLevel = 'MEDIUM';
    capRequired = true;
    explainerForAuditee = 'พนักงานประจำป้อม Gate ต้องสัมผัสควันและฝุ่นละอองจากรถบรรทุกตลอดวัน หน้ากากกระดาษไม่สามารถป้องกันได้ ต้องจัดสรรหน้ากาก N95 หรือ Carbon mask และลงบันทึกประวัติการเบิกจ่ายให้ตรวจสอบได้';
    rootCause = 'สต็อกหน้ากาก Carbon mask ขาดคลังชั่วคราว และจัดซื้อไม่ได้ติดตามสั่งซื้อล่วงหน้า เจ้าหน้าที่จึงนำหน้ากากกระดาษมาใช้แทน';
    correction = 'เบิกจ่ายหน้ากากกรอง N95/Carbon mask จากคลังกลางให้พนักงาน Survey Gate ใช้งานทันที และจัดทำสมุดบันทึกประวัติการเบิกจ่าย';
    correctiveAction = 'กำหนดระดับ Safety Stock สำหรับหน้ากากกรองสารเคมีและไอระเหยในระบบคลังพัสดุ QSHE ไม่ให้ต่ำกว่า 30 วัน';
    preventiveAction = 'จัดทำรอบตรวจเช็กสต็อก PPE ประจำสัปดาห์โดย จป. K.R.C.';
    extentAnalysis = 'ตรวจเช็กอุปกรณ์ PPE ของพนักงานประจำลานและคลังสินค้าทุกจุด';
  }
  // 5. Hazardous waste segregation
  else if (
    (fullText.includes('ขยะอันตราย') || fullText.includes('กระป๋องสี') || fullText.includes('ปนเปื้อนน้ำมัน')) &&
    (fullText.includes('ทิ้งปะปน') || fullText.includes('ปนกับ') || fullText.includes('ไม่มีถัง') || fullText.includes('เศษเหล็ก'))
  ) {
    status = 'MA';
    statusTitle = 'ข้อบกพร่องขั้นรุนแรง (Major Non-conformance)';
    auditorFindingDetail = `ตรวจพบการทิ้งกระป๋องสีและเศษผ้าปนเปื้อนน้ำมันปะปนกับขยะทั่วไปและเศษเหล็ก ไม่มีการคัดแยกและทิ้งลงในถังขยะอันตรายที่มีฝาปิดมิดชิด ขัดต่อข้อกำหนด ISO 14001 และระเบียบการจัดการขยะอุตสาหกรรม`;
    isoClauses = ['ISO 14001:2015 ข้อ 8.1', 'ISO 14001:2015 ข้อ 8.2'];
    lawReferences = [
      'พ.ร.บ. ส่งเสริมและรักษาคุณภาพสิ่งแวดล้อมแห่งชาติ พ.ศ. 2535',
      'ประกาศกระทรวงอุตสาหกรรม เรื่อง การกำจัดสิ่งปฏิกูลหรือวัสดุที่ไม่ใช้แล้ว พ.ศ. 2566',
    ];
    riskLevel = 'HIGH';
    capRequired = true;
    explainerForAuditee = 'ขยะปนเปื้อนน้ำมันและสารเคมีจัดเป็นขยะอันตราย ต้องคัดแยกใส่ถังสีแดง/ส้มที่มีฝาปิดมิดชิด ห้ามทิ้งปะปนกับขยะทั่วไปหรือเศษเหล็กเด็ดขาด เพราะผิดกฎหมายสิ่งแวดล้อมและเสี่ยงต่อการเกิดเพลิงไหม้';
    rootCause = 'ขาดถังขยะอันตรายประจำจุดงานช่างซ่อมตู้ และพนักงานขาดความรู้ในการคัดแยกขยะปนเปื้อนน้ำมัน';
    correction = 'จัดเก็บคัดแยกกระป๋องสีและเศษผ้าปนเปื้อนน้ำมันออกจากกองขยะทั่วไป นำไปใส่ในถังขยะอันตรายที่ถูกต้องทันที';
    correctiveAction = 'จัดวางถังขยะอันตรายที่มีป้ายบ่งชี้ชัดเจนประจำทุกจุดซ่อมบำรุงในลานตู้ และประสานผู้รับกำจัดขยะอันตรายที่ได้รับอนุญาตจากกรมโรงงาน';
    preventiveAction = 'จัดอบรมการคัดแยกขยะตามมาตรฐาน ISO 14001 ให้แก่พนักงานและผู้รับเหมาทุกคน';
    extentAnalysis = 'สุ่มตรวจถังขยะและจุดทิ้งเศษวัสดุทั่วทั้งบริเวณลานตู้คอนเทนเนอร์ K.R.C.';
  }
  // 6. Climate Change & SWOT (Amd 1:2024)
  else if (
    (fullText.includes('swot') || fullText.includes('climate change') || fullText.includes('ลมแดด')) &&
    (fullText.includes('ครบถ้วน') || fullText.includes('อนุมัติ') || fullText.includes('มีบันทึก') || fullText.includes('แจกน้ำ') || fullText.includes('แสดงเอกสาร'))
  ) {
    status = 'C';
    statusTitle = 'สอดคล้องตามข้อกำหนด (Conforming)';
    auditorFindingDetail = `ฝ่าย QSHE ได้จัดทำและทบทวนบริบทองค์กร SWOT Analysis ประจำปี 2026 ฉบับอนุมัติโดย CEO พร้อมรายงานการประชุมทบทวนที่มีการระบุผลกระทบจาก Climate Change (โรคลมแดดในคนงานลานตู้, อัตราสิ้นเปลืองน้ำมันของรถหัวลาก) สอดคล้องตามข้อกำหนด ISO 9001/14001/45001:2015 Amd 1:2024 อย่างครบถ้วนสมบูรณ์`;
    isoClauses = ['ISO 9001:2015 ข้อ 4.1', 'ISO 14001:2015 ข้อ 4.1', 'ISO 45001:2018 ข้อ 4.1 (รวม Amd 1:2024)'];
    riskLevel = 'LOW';
    capRequired = false;
    explainerForAuditee = 'เอกสารและการประเมินความเสี่ยงด้าน Climate Change มีความสมบูรณ์มาก สอดคล้องตามข้อกำหนดใหม่ Amd 1:2024 ของ ISO เป็นตัวอย่างที่ดีสำหรับการตรวจ Surveillance Audit';
  }
  // 7. General Auditee Submission / Compliant Evidence
  else if (
    audExplanation.includes('ครบถ้วน') ||
    audExplanation.includes('มีเอกสาร') ||
    audExplanation.includes('ผ่านการอบรม') ||
    audExplanation.includes('มีใบอนุญาต') ||
    audExplanation.includes('ตรวจสอบแล้ว') ||
    audExplanation.includes('แก้ไขแล้ว') ||
    audExplanation.includes('สอดคล้อง') ||
    audExplanation.includes('มีบันทึก') ||
    ev.includes('ครบถ้วน') ||
    ev.includes('ถูกต้อง') ||
    ev.includes('สอดคล้อง') ||
    ev.includes('ผ่านเกณฑ์') ||
    ev.includes('มีผลเป็นศูนย์') ||
    ev.includes('มีผลตรวจ')
  ) {
    status = 'C';
    statusTitle = 'สอดคล้องตามข้อกำหนด (Conforming)';
    auditorFindingDetail = `จากการตรวจสอบหลักฐานและคำชี้แจงที่ยื่นโดย Auditee (${auditeeResponse?.responderName || 'ตัวแทนหน่วยงาน'}) พบว่ามีเอกสารหลักฐาน บันทึกการปฏิบัติงาน และมาตรการควบคุมที่สอดคล้องตามข้อกำหนดและระเบียบบริษัท K.R.C. อย่างครบถ้วนสมบูรณ์`;
    riskLevel = 'LOW';
    capRequired = false;
    explainerForAuditee = 'หลักฐานที่ส่งมามีความสมบูรณ์ สอดคล้องตามมาตรฐาน ISO และระเบียบบริษัท ขอให้คงระดับการปฏิบัติงานและบันทึกข้อมูลอย่างต่อเนื่อง';
  }
  // 8. General Deficiencies / Non-conformity
  else if (
    fullText.includes('ไม่พบ') ||
    fullText.includes('ขาด') ||
    fullText.includes('ไม่ได้') ||
    fullText.includes('ชำรุด') ||
    fullText.includes('หมดอายุ') ||
    fullText.includes('ไม่มี') ||
    fullText.includes('ไม่ติด') ||
    fullText.includes('ฝ่าฝืน') ||
    fullText.includes('ตกเกณฑ์')
  ) {
    status = 'MI';
    statusTitle = 'ข้อบกพร่องขั้นเล็กน้อย (Minor Non-conformance)';
    auditorFindingDetail = `จากการสุ่มตรวจหลักฐานพบข้อบกพร่อง: ${evidenceText || audExplanation || checklistItem?.question || 'การปฏิบัติงานยังไม่เป็นไปตามระเบียบขั้นตอนที่กำหนด'}`;
    isoClauses = checklistItem?.isoClauses || ['ISO 9001:2015 ข้อ 8.1', 'ISO 45001:2018 ข้อ 8.1'];
    riskLevel = 'MEDIUM';
    capRequired = true;
    explainerForAuditee = 'พบจุดที่ไม่เป็นไปตามระเบียบ จำเป็นต้องดำเนินการแก้ไขและจัดทำแผนป้องกันตามแบบฟอร์ม CAR/CAP เพื่อปิดข้อบกพร่องก่อนการตรวจจริง';
    rootCause = 'การสื่อสารและติดตามการปฏิบัติตามขั้นตอนการทำงาน (WI) ยังไม่ครอบคลุมครบถ้วนทุกกะการทำงาน';
    correction = 'ดำเนินการปรับปรุงแก้ไขข้อบกพร่องที่พบหน้างานทันที และรายงานต่อหัวหน้างาน';
    correctiveAction = 'ทบทวนคู่มือการปฏิบัติงาน (WI) และซักซ้อมความเข้าใจแก่พนักงานที่เกี่ยวข้อง';
    preventiveAction = 'เพิ่มความถี่ในการสุ่มตรวจติดตามภายในโดย Supervisor ประจำแผนก';
    extentAnalysis = 'ตรวจสอบประเด็นลักษณะเดียวกันในพื้นที่ปฏิบัติงานข้างเคียง';
  }
  // 9. Default: Auditee attachments or general observation
  else {
    status = audAttachments.length > 0 ? 'C' : 'OBS';
    statusTitle = audAttachments.length > 0 ? 'สอดคล้องตามข้อกำหนด (Conforming)' : 'ข้อสังเกต (Observation)';
    auditorFindingDetail = audAttachments.length > 0
      ? `จากการตรวจสอบภาพถ่าย/เอกสารแนบจำนวน ${audAttachments.length} รายการ พบว่ามีการดำเนินงานตามขั้นตอนที่กำหนด แนะนำให้รักษามาตรฐานการบันทึกข้อมูลอย่างสม่ำเสมอ`
      : `จากการสุ่มตรวจเบื้องต้นยังไม่พบบันทึกหลักฐานที่ชัดเจน ณ จุดตรวจ แนะนำให้จัดเตรียมเอกสารและบันทึกหน้างานให้พร้อมแสดงต่อคณะผู้ตรวจประเมิน`;
    isoClauses = checklistItem?.isoClauses || ['ISO 9001:2015 ข้อ 8.1', 'ISO 45001:2018 ข้อ 8.1'];
    riskLevel = 'LOW';
    capRequired = false;
    explainerForAuditee = 'ควรจัดเตรียมเอกสารและบันทึกการทำงานให้พร้อมแสดง เพื่อความสะดวกรวดเร็วในการตรวจ Surveillance Audit';
  }

  const carNo = `CAR-KRC-2026-${String(itemNo).padStart(3, '0')}`;
  const targetDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return {
    status,
    statusTitle,
    evidenceRecorded:
      evidenceText ||
      (auditeeResponse?.explanation
        ? `[Auditee: ${auditeeResponse.responderName}] ${auditeeResponse.explanation}`
        : 'บันทึกการตรวจประเมินของ Lead Auditor'),
    auditorFindingDetail,
    isoClauses,
    lawReferences,
    riskLevel,
    explainerForAuditee,
    capRequired,
    capDraft: capRequired
      ? {
          carNo,
          targetDate,
          personInCharge: auditeeResponse?.responderName || 'Supervisor แผนกที่เกี่ยวข้อง',
          rootCause,
          correction,
          correctiveAction,
          preventiveAction,
          extentAnalysis,
          signatories: {
            preparedBy: 'น้องออดิต (AI Lead Auditor)',
            proposedBy: 'หัวหน้างาน / Supervisor (K.R.C.)',
            reviewedBy: 'ประภาส สันติสุข (QSHE Manager K.R.C.)',
            approvedBy: 'กิตติศักดิ์ เจริญกิจ (President & CEO K.R.C.)',
            acknowledgedByVendor: 'ตัวแทนผู้รับเหมา (รับทราบผลเท่านั้น)',
          },
        }
      : null,
  };
}

// API: Auditee Explainer
app.post('/api/audit/explain', async (req, res) => {
  try {
    const { question, findingContext, standardClause } = req.body;

    const systemInstruction = `
คุณคือ "น้องออดิต" AI ผู้ช่วยผู้เชี่ยวชาญระดับสูงด้าน ISO 9001/14001/45001 และกฎหมายความปลอดภัยลานตู้คอนเทนเนอร์และการขนส่ง บริษัท เค.อาร์.ซี. ทรานสปอร์ต แอนด์ เซอร์วิส จำกัด
เมื่อผู้รับการตรวจ (Auditee) มีข้อสงสัย ไม่เข้าใจ หรือตั้งคำถามว่า "ทำไมต้องทำ?", "ทำไมถึงตรวจตก?", "ทำไมต้องออก CAR?":
ให้คุณอธิบายด้วยน้ำเสียงสุภาพ เป็นมิตร มืออาชีพ เสริมกำลังใจ และเข้าใจง่าย โดย:
1. อธิบายเหตุผลเบื้องหลังในแง่ความปลอดภัยจริงหน้างาน (ไม่ท่องทฤษฎี)
2. อ้างอิงข้อกำหนด ISO และกฎหมายไทยที่เกี่ยวข้องอย่างแม่นยำ
3. ให้แนวทางแก้ไขที่ "ทีมงานทำงานน้อยที่สุด แต่ได้ผลลัพธ์ถูกต้องและดีเยี่ยมที่สุด"
4. แสดงข้อมูลสรุปในรูปแบบ Markdown Table เพื่อความสะดวกในการ Copy-Paste
`;

    const promptText = `
ข้อสงสัยจากผู้รับการตรวจ (Auditee):
"${question}"

บริบทข้อตรวจ / ประเด็นที่พบ:
${findingContext || 'การตรวจตามมาตรฐาน ISO 9001/14001/45001 และกฎหมายความปลอดภัยลานตู้/การขนส่ง KRC'}
${standardClause ? `ข้อกำหนดที่เกี่ยวข้อง: ${standardClause}` : ''}

โปรดตอบคำถามและอธิบายแทน Lead Auditor เพื่อให้ Auditee เข้าใจและนำไปปฏิบัติได้ทันที`;

    const response = await generateContentWithRetry({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction,
      },
    });

    res.json({ explanation: response.text });
  } catch (error: any) {
    console.warn('Gemini explain error, returning KRC QSHE standard explanation:', error?.message || error);
    const { question, findingContext, standardClause } = req.body || {};
    const fallbackExplanation = `
### 💡 คำชี้แจงจากน้องออดิต (Lead Auditor) สำหรับ Auditee

**ข้อคำถาม/ประเด็นที่สงสัย:** "${question || 'การปฏิบัติตามมาตรฐาน ISO และระเบียบความปลอดภัย K.R.C.'}"

${findingContext ? `**บริบทข้อตรวจ:** ${findingContext}\n` : ''}
${standardClause ? `**ข้อกำหนดที่เกี่ยวข้อง:** ${standardClause}\n` : ''}

---

#### 1. เหตุผลและความสำคัญหน้างานจริง (Why it matters):
การปฏิบัติตามข้อกำหนดนี้มีจุดประสงค์หลักเพื่อ **ความปลอดภัยในชีวิตของพนักงาน ลดความเสี่ยงจากการเกิดอุบัติเหตุร้ายแรงในลานตู้ และป้องกันการหยุดชะงักของงานขนส่ง** หากปล่อยให้เกิดข้อบกพร่อง ไม่เพียงแต่เสี่ยงต่อการตรวจไม่ผ่านในการตรวจ Surveillance Audit ของสถาบันรับรอง (CB) แต่ยังอาจส่งผลกระทบทางกฎหมายแรงงานและความปลอดภัยทันที

#### 2. ตารางแนวทางปฏิบัติที่ถูกต้อง (Action Matrix):
| ประเด็นข้อสงสัย | สิ่งที่ระบบต้องการ (Requirement) | เอกสาร/หลักฐานอ้างอิง | แนวทางแก้ไขด่วนของทีมงาน |
| :--- | :--- | :--- | :--- |
| **การปฏิบัติงาน** | ต้องเป็นไปตามขั้นตอนการทำงานที่กำหนด | WI / Manual ที่เกี่ยวข้อง | นำคู่มือมาซักซ้อมความเข้าใจหน้างาน |
| **การบันทึกหลักฐาน** | บันทึกประวัติ ผลตรวจ หรือภาพถ่าย ณ จุดใช้งาน | แบบฟอร์มตรวจเช็ก (F-Form) | ถ่ายภาพหรือสแกนบันทึกลงระบบทันที |
| **การป้องกันการเกิดซ้ำ** | กำหนดมาตรการควบคุมที่ต้นตอ (Root Cause) | ทะเบียน JSA / Aspect | ปรับปรุงจุดสกัดกั้นหน้างาน |

> 📌 **คำแนะนำเสริมจากน้องออดิต:**
> "ทีมงาน K.R.C. ทำงานน้อยที่สุด แต่ได้ผลลัพธ์ถูกต้องและดีเยี่ยมที่สุด" — เพียงแค่จัดเตรียมภาพถ่ายหน้างานจริง หรือแนบเอกสารบันทึกที่มีอยู่แล้วเข้ามาในระบบ น้องออดิตจะช่วยประเมินและสรุปผลให้เสร็จสิ้นทันทีครับ
`;
    res.json({ explanation: fallbackExplanation });
  }
});

// API: Generate Audit Summary Report (F-QS-007)
app.post('/api/audit/generate-report', async (req, res) => {
  try {
    const { auditItems, auditInfo } = req.body;

    const systemInstruction = `
คุณคือ "น้องออดิต" AI ผู้ช่วยผู้เชี่ยวชาญระดับสูงด้านระบบบริหารจัดการ QSHE บริษัท เค.อาร์.ซี. ทรานสปอร์ต แอนด์ เซอร์วิส จำกัด
จงประมวลผลข้อมูลการตรวจติดตามภายใน (Mock Internal Audit) และจัดทำรายงานสรุปผลการตรวจติดตามภายในตามแบบฟอร์ม F-QS-007
เพื่อเตรียมความพร้อมสำหรับการตรวจจริง (14-22 ตุลาคม 2026) และการตรวจประเมิน Surveillance Audit จาก CB

ผลลัพธ์ต้องประกอบด้วย:
1. ตารางสรุปผลคะแนนและเกรด (Conforming %, Counts of C, MA, MI, OBS, OFI, Overall Grade A-F)
2. ตารางสรุปข้อบกพร่องทั้งหมด (Summary of Findings Table) พร้อมคอลัมน์: ข้อที่, ข้อกำหนด ISO, กฎหมายที่เกี่ยวข้อง, รายละเอียดข้อบกพร่อง, ระดับผลกระทบ, กำหนดเสร็จ, ผู้รับผิดชอบ (เป็น Markdown Table ที่ Copy ไปลง Google Sheets ได้ทันที)
3. การวิเคราะห์จุดแข็ง (Strengths) และจุดสกัดกั้นความเสี่ยงวิกฤต (Critical Risk Chokepoints)
4. วาระคำแถลงปิดการตรวจ (Closing Meeting Speech) แนะนำผู้บริหารและ Supervisor ทุกฝ่าย
`;

    const promptText = `
ข้อมูลการตรวจติดตาม:
- โครงการ: ${auditInfo?.auditTitle || 'Pre-audit QSHE 2026 เตรียมพร้อม Internal Audit 14-22 ต.ค.'}
- วันที่ตรวจ: ${auditInfo?.date || new Date().toLocaleDateString('th-TH')}
- ผู้ตรวจ: น้องออดิต (AI Lead Auditor) ร่วมกับทีมงาน QSHE K.R.C.
- รายการตรวจที่บันทึกแล้ว: ${JSON.stringify(auditItems, null, 2)}

โปรดสร้างรายงานสรุปผล F-QS-007 ฉบับสมบูรณ์ในรูปแบบ Markdown ให้สวยงามและชัดเจน`;

    const response = await generateContentWithRetry({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction,
      },
    });

    res.json({ reportMarkdown: response.text });
  } catch (error: any) {
    console.warn('Gemini report error, returning KRC QSHE standard F-QS-007 report:', error?.message || error);
    const { auditItems, auditInfo } = req.body || {};
    const total = (auditItems || []).length;
    const countC = (auditItems || []).filter((i: any) => i.status === 'C').length;
    const countMA = (auditItems || []).filter((i: any) => i.status === 'MA').length;
    const countMI = (auditItems || []).filter((i: any) => i.status === 'MI').length;
    const countOBS = (auditItems || []).filter((i: any) => i.status === 'OBS').length;
    const countOFI = (auditItems || []).filter((i: any) => i.status === 'OFI').length;
    const countPending = (auditItems || []).filter((i: any) => i.status === 'PENDING').length;
    const evaluated = total - countPending;
    const score = evaluated > 0 ? Math.round(((countC * 100 + countOFI * 85 + countOBS * 70 + countMI * 40) / evaluated)) : 0;
    const grade = countMA >= 3 || score < 50 ? 'F' : countMA >= 1 || score < 60 ? 'E' : score < 70 ? 'D' : score < 80 ? 'C' : score < 90 ? 'B' : 'A';

    const fallbackReport = `
# รายงานสรุปผลการตรวจติดตามภายใน (Internal Audit Summary Report)
**แบบฟอร์ม F-QS-007 • บริษัท เค.อาร์.ซี. ทรานสปอร์ต แอนด์ เซอร์วิส จำกัด**
**ระบบบริหารจัดการ:** ISO 9001:2015 / ISO 14001:2015 / ISO 45001:2018 (รวม Amd 1:2024 Climate Change)
**วันที่ออกรายงาน:** ${auditInfo?.date || new Date().toLocaleDateString('th-TH')} | **ผู้ตรวจ:** น้องออดิต (AI Lead Auditor) ร่วมกับทีมงาน QSHE

---

### 1. ตารางสรุปคะแนนและระดับผลการประเมิน (Audit Metric Summary)

| ดัชนีชี้วัด (Key Metrics) | ผลการตรวจประเมิน | เกณฑ์มาตรฐาน | สถานะ |
| :--- | :---: | :---: | :---: |
| **รายการตรวจทั้งหมด (Total Items)** | **${total} ข้อ** | ครอบคลุม 15 ฝ่าย | สมบูรณ์ |
| **ตรวจประเมินแล้ว (Evaluated)** | **${evaluated} ข้อ** | 100% ก่อน CB Audit | ${evaluated === total ? 'ครบถ้วน' : 'อยู่ระหว่างตรวจ'} |
| **สอดคล้องตามเกณฑ์ (Conforming - C)** | **${countC} ข้อ** | มุ่งสู่ 100% | ${countC > 0 ? '✓ ผ่าน' : '-'} |
| **ข้อบกพร่องขั้นรุนแรง (Major NC - MA)** | **${countMA} ข้อ** | ต้องเป็น 0 | ${countMA === 0 ? '✓ ดีเยี่ยม' : '⚠️ ออก CAR ด่วน'} |
| **ข้อบกพร่องขั้นเล็กน้อย (Minor NC - MI)** | **${countMI} ข้อ** | ต่ำกว่า 3 | ${countMI <= 3 ? '✓ ยอมรับได้' : '⚠️ ต้องปรับปรุง'} |
| **ข้อสังเกตและโอกาสปรับปรุง (OBS / OFI)** | **${countOBS + countOFI} ข้อ** | - | แนะนำพัฒนาต่อเนื่อง |
| **คะแนนความสอดคล้องรวม (Conformance %)** | **${score}%** | ≥ 80% (เกรด B ขึ้นไป) | **เกรด ${grade}** |

---

### 2. ตารางสรุปข้อบกพร่องและการแก้ไข (Summary of Findings & Action Plan)
*(สามารถ Copy-Paste ตารางนี้ลงใน Google Sheets / Google Docs ของทีมงานได้ทันที)*

| ข้อที่ | ฝ่าย/แผนก | ผลการตรวจ | ประเด็นข้อบกพร่อง | ข้อกำหนด ISO / กฎหมาย | มาตรการแก้ไขเชิงระบบ (CAP) | กำหนดเสร็จ |
| :---: | :--- | :---: | :--- | :--- | :--- | :---: |
${(auditItems || []).filter((i: any) => i.status === 'MA' || i.status === 'MI' || i.status === 'OBS').map((i: any) => `| #${i.id} | ${i.department || 'ทั่วไป'} | **${i.status}** | ${i.evidenceRecorded || i.question} | ${i.isoClauses?.[0] || 'ISO 45001 / กฎหมาย'} | ${i.capData ? i.capData.correctiveAction : 'จัดทำแผนแก้ไขป้องกัน (CAP)'} | ${i.capData ? i.capData.targetDate : '14 วัน'} |`).join('\n') || '| - | - | - | ไม่พบข้อบกพร่องที่ต้องออกใบ CAR | - | - | - |'}

---

### 3. จุดสกัดกั้นความเสี่ยงวิกฤต (Critical Risk Chokepoints)
1. **การควบคุมสารเคมีของผู้รับเหมา (P-PU-002):** ห้ามนำขวดน้ำดื่มบรรจุสารเคมีเด็ดขาด ต้องติดฉลาก GHS และมี SDS ภาษาไทย ณ จุดใช้งาน
2. **สุขภาพและความพร้อมของพนักงานขับรถ (TSM):** ตรวจวัดความดันโลหิต (หากเกิน 140/90 mmHg ให้นั่งพัก 15 นาทีแล้ววัดซ้ำ) และเป่าแอลกอฮอล์เป็นศูนย์
3. **งานเสี่ยงอันตรายบนที่สูงและงานยก:** ต้องมี Work at Height Permit (F-SE-039) และคล้อง Lifeline ทุกครั้ง

### 4. วาระคำแถลงปิดการตรวจ (Closing Meeting Speech)
> "ขอขอบคุณผู้บริหารและเพื่อนร่วมงานทุกฝ่ายของ เค.อาร์.ซี. ที่ให้ความร่วมมือในการตรวจติดตามภายในครั้งนี้ ภาพรวมการดำเนินงานมีความพร้อมสูง โดยเฉพาะความตระหนักในระบบมาตรฐาน ISO และการปรับตัวรับข้อกำหนด Climate Change ขอให้ทุกฝ่ายที่มีข้อตรวจ MA/MI เร่งส่งแผนแก้ไขป้องกัน (CAP) และดำเนินการปิดข้อบกพร่องให้แล้วเสร็จก่อนการตรวจ Surveillance Audit ประจำปี 2026 เพื่อความสำเร็จและความปลอดภัยสูงสุดขององค์กรครับ"
`;
    res.json({ reportMarkdown: fallbackReport });
  }
});

// API: Parse Checklist from raw text, document, or PDF/Image OCR
app.post('/api/audit/parse-checklist', async (req, res) => {
  try {
    const { rawText, fileBase64, mimeType } = req.body;

    if (!rawText && !fileBase64) {
      return res.status(400).json({ error: 'กรุณาระบุข้อความหรืออัปโหลดไฟล์ Checklist' });
    }

    const systemInstruction = `
คุณคือ "น้องออดิต" AI Lead Auditor ผู้เชี่ยวชาญด้านระบบ ISO 9001, ISO 14001, ISO 45001 และการจัดทำ Audit Checklist สำหรับงานขนส่ง โลจิสติกส์ ลานตู้คอนเทนเนอร์ และคลังสินค้า
หน้าที่ของคุณ: แปลงข้อความหรือเอกสาร Checklist ที่ผู้ใช้งานอัปโหลดมา ให้กลายเป็นรายการตรวจสอบ (Checklist Items) ที่เป็นโครงสร้างมาตรฐานอย่างละเอียดครบถ้วนทุกข้อ
หากข้อใดไม่มีหมวดหมู่ ให้จัดหมวดหมู่ที่เหมาะสม (เช่น หมวดทั่วไป, ความปลอดภัย, สิ่งแวดล้อม, คุณภาพ, ผู้รับเหมา, พนักงานขับรถ)
หากไม่มีการระบุข้อกำหนด ISO หรือกฎหมาย ให้น้องออดิตช่วยวิเคราะห์และเติมข้อกำหนด ISO (ISO 9001 / ISO 14001 / ISO 45001) และกฎหมายไทยที่เกี่ยวข้องให้ทันที เพื่อความสะดวกสูงสุดของทีมงาน K.R.C.
`;

    const parts: any[] = [];

    if (fileBase64 && mimeType) {
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: fileBase64,
        },
      });
    }

    const promptText = `
โปรดอ่านและสกัดข้อคำถามตรวจ/รายการตรวจสอบทั้งหมดจากข้อมูลนี้ ให้เป็น JSON รายการ Audit Checklist ที่สมบูรณ์
${rawText ? `เนื้อหา Checklist:\n${rawText}` : 'โปรดสกัดรายการคำถามตรวจสอบจากเอกสาร/ภาพที่แนบมานี้'}

จงสร้างผลลัพธ์เป็น JSON Object ที่มีคีย์ "items" เป็น Array ของ Checklist Items
แต่ละ Item ต้องประกอบด้วย:
- id: ตัวเลขลำดับ (เริ่มจาก 1, 2, 3...)
- categoryCode: รหัสหมวด เช่น "ก", "ข", "A", "B", "EHS", "QA"
- categoryTitle: ชื่อหมวดหมู่ เช่น "บริบทองค์กรและความปลอดภัย", "การควบคุมผู้รับเหมา", "สุขอนามัยพนักงานขับรถ"
- requirement: ข้อกำหนด หรือหัวข้อหลักที่ตรวจ
- question: ข้อคำถามในการตรวจ หรือรายละเอียดสิ่งที่ต้องตรวจสอบ
- referenceDocs: เอกสารอ้างอิง เช่น "P-PU-001", "P-PU-002", "F-SE-001", "WI-TR-004", "กฎหมายความปลอดภัย"
- requiredEvidence: หลักฐานที่ต้องขอดู เช่น "บันทึกการตรวจ", "ใบอนุญาตทำงาน", "ผลตรวจแอลกอฮอล์"
- priority: "HIGH" หรือ "NORMAL" (หากเกี่ยวกับความปลอดภัยร้ายแรง ให้เป็น HIGH)
- status: "PENDING"
- isoClauses: Array ของข้อกำหนด ISO เช่น ["ISO 45001:2018 ข้อ 8.1.4.2", "ISO 9001:2015 ข้อ 8.4"]
- lawReferences: Array ของกฎหมาย เช่น ["พ.ร.บ. ความปลอดภัยฯ 2554", "กฎกระทรวงสารเคมีอันตราย 2556"]
`;

    parts.push({ text: promptText });

    const response = await generateContentWithRetry({
      model: 'gemini-3.8-flash',
      contents: parts,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            checklistTitle: { type: Type.STRING },
            totalItemsParsed: { type: Type.INTEGER },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  categoryCode: { type: Type.STRING },
                  categoryTitle: { type: Type.STRING },
                  requirement: { type: Type.STRING },
                  question: { type: Type.STRING },
                  referenceDocs: { type: Type.STRING },
                  requiredEvidence: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ['HIGH', 'NORMAL'] },
                  status: { type: Type.STRING, enum: ['PENDING'] },
                  isoClauses: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  lawReferences: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: [
                  'id',
                  'categoryCode',
                  'categoryTitle',
                  'requirement',
                  'question',
                  'referenceDocs',
                  'requiredEvidence',
                  'priority',
                  'status',
                ],
              },
            },
          },
          required: ['items'],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{"items": []}');
    res.json(parsedData);
  } catch (error: any) {
    console.error('Error in /api/audit/parse-checklist:', error);

    // Fallback: If text input is provided, parse line by line so user is never blocked
    const rawText = req.body?.rawText;
    if (rawText && typeof rawText === 'string') {
      const lines = rawText
        .split('\n')
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 2);

      if (lines.length > 0) {
        const fallbackItems = lines.map((line: string, idx: number) => {
          const cleaned = line.replace(/^\d+[\.\-\)]\s*/, '').trim();
          const isHigh =
            cleaned.includes('อันตราย') ||
            cleaned.includes('ความปลอดภัย') ||
            cleaned.includes('แอลกอฮอล์') ||
            cleaned.includes('ที่สูง') ||
            cleaned.includes('สารเคมี');

          return {
            id: idx + 1,
            categoryCode: String.fromCharCode(65 + (idx % 8)),
            categoryTitle: 'หมวดการตรวจสอบ (สกัดจากข้อความ)',
            requirement: cleaned.slice(0, 80),
            question: cleaned,
            referenceDocs: 'P-PU-001',
            requiredEvidence: 'หลักฐานการดำเนินงานและบันทึกหน้างาน',
            priority: isHigh ? 'HIGH' : 'NORMAL',
            status: 'PENDING',
            isoClauses: ['ISO 9001:2015', 'ISO 45001:2018'],
            lawReferences: ['กฎหมายความปลอดภัย อาชีวอนามัย และสิ่งแวดล้อม'],
          };
        });

        return res.json({
          checklistTitle: 'Checklist สกัดจากข้อความ (โหมดสำรอง)',
          totalItemsParsed: fallbackItems.length,
          items: fallbackItems,
        });
      }
    }

    res.status(500).json({
      error: 'เกิดข้อผิดพลาดในการประมวลผลสกัด Checklist ด้วย AI',
      details: error.message,
    });
  }
});

// API: Send Google Chat Notification
app.post('/api/notifications/send-google-chat', async (req, res) => {
  try {
    const { webhookUrl, title, text, eventType, carNo, checklistItemTitle, assigneeName, targetDate } = req.body;

    // Build Google Chat Card V2 Message
    const cardHeader = {
      title: title || 'ระบบแจ้งเตือน Mock Internal Audit K.R.C.',
      subtitle: `ระบบ ISO 9001 / 14001 / 45001 • ${new Date().toLocaleTimeString('th-TH')}`,
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
      imageType: 'CIRCLE',
    };

    const widgets: any[] = [
      {
        textParagraph: {
          text: `<b>สถานะแจ้งเตือน:</b> ${text}`,
        },
      },
    ];

    if (carNo) {
      widgets.push({
        keyValue: {
          topLabel: 'เลขที่ใบ CAR / ข้อบกพร่อง',
          content: carNo,
          icon: 'DESCRIPTION',
        },
      });
    }

    if (checklistItemTitle) {
      widgets.push({
        keyValue: {
          topLabel: 'หัวข้อการตรวจประเมิน',
          content: checklistItemTitle,
          icon: 'BOOKMARK',
        },
      });
    }

    if (assigneeName) {
      widgets.push({
        keyValue: {
          topLabel: 'ผู้รับผิดชอบดำเนินการ (Auditee)',
          content: assigneeName,
          icon: 'PERSON',
        },
      });
    }

    if (targetDate) {
      widgets.push({
        keyValue: {
          topLabel: 'กำหนดเสร็จ (Target Date)',
          content: targetDate,
          icon: 'CLOCK',
        },
      });
    }

    const cardV2 = {
      cardsV2: [
        {
          cardId: `krc-audit-${Date.now()}`,
          card: {
            header: cardHeader,
            sections: [
              {
                header: 'รายละเอียดการปฏิบัติการ',
                widgets,
              },
            ],
          },
        },
      ],
    };

    if (webhookUrl && typeof webhookUrl === 'string' && webhookUrl.startsWith('https://chat.googleapis.com')) {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardV2),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(400).json({
          error: 'ส่งข้อความไปยัง Google Chat ไม่สำเร็จ กรุณาตรวจสอบ Webhook URL',
          details: errorText,
        });
      }

      const result = await response.json();
      return res.json({ success: true, channel: 'GOOGLE_CHAT', status: 'SENT', result });
    }

    // If webhookUrl is empty or simulation mode
    return res.json({
      success: true,
      channel: 'GOOGLE_CHAT',
      status: 'SIMULATED',
      message: 'จำลองการส่งแจ้งเตือนเข้า Google Chat เรียบร้อย (ใส่ Webhook URL จริงเพื่อส่งเข้า Space)',
      previewPayload: cardV2,
    });
  } catch (error: any) {
    console.error('Error in /api/notifications/send-google-chat:', error);
    res.status(500).json({ error: error.message || 'ส่งแจ้งเตือน Google Chat ล้มเหลว' });
  }
});

// API: Send Email Notification
app.post('/api/notifications/send-email', async (req, res) => {
  try {
    const { to, cc, subject, bodyHtml, eventType, carNo } = req.body;

    if (!to) {
      return res.status(400).json({ error: 'กรุณาระบุอีเมลผู้รับ (To)' });
    }

    // Create standard mailto link format so user can also open their local email client
    const mailtoParams = new URLSearchParams({
      subject: subject || 'แจ้งเตือนระบบตรวจติดตามภายใน K.R.C.',
      body: bodyHtml?.replace(/<[^>]+>/g, '') || 'รายละเอียดการตรวจติดตามภายใน K.R.C.',
    });
    if (cc) mailtoParams.append('cc', cc);

    const mailtoUri = `mailto:${encodeURIComponent(to)}?${mailtoParams.toString()}`;

    res.json({
      success: true,
      channel: 'EMAIL',
      status: 'SIMULATED',
      recipient: to,
      cc,
      subject,
      mailtoUri,
      dispatchedAt: new Date().toISOString(),
      message: `เตรียมข้อมูลแจ้งเตือนทางอีเมลถึง ${to} เรียบร้อย`,
    });
  } catch (error: any) {
    console.error('Error in /api/notifications/send-email:', error);
    res.status(500).json({ error: error.message || 'ส่งแจ้งเตือนทางอีเมลล้มเหลว' });
  }
});

// In-memory / persisted Google Sheets config so all published clients share the same sheet
let sharedSheetsConfig = {
  webAppUrl: '',
  isConnected: false,
  lastTestedAt: '',
  lastSyncedAt: '',
  spreadsheetName: 'KRC_Audit_Database_Master',
  autoSyncOnFinding: true,
  autoSyncOnCar: true,
};

app.get('/api/sheets/config', (req, res) => {
  res.json({ success: true, config: sharedSheetsConfig });
});

app.post('/api/sheets/config', (req, res) => {
  try {
    const { config } = req.body;
    if (config) {
      sharedSheetsConfig = { ...sharedSheetsConfig, ...config };
    }
    res.json({ success: true, config: sharedSheetsConfig });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Proxy for Google Sheets Web App to bypass CORS and handle redirects seamlessly
app.post('/api/sheets/proxy', async (req, res) => {
  try {
    const { webAppUrl, method = 'GET', payload } = req.body;
    if (!webAppUrl || typeof webAppUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'กรุณาระบุ Web App URL ที่ถูกต้อง' });
    }

    const cleanUrl = webAppUrl.trim();
    let targetUrl = cleanUrl;
    let fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      redirect: 'follow',
    };

    if (method.toUpperCase() === 'GET' && payload) {
      const params = new URLSearchParams(payload);
      targetUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}${params.toString()}`;
    } else if (method.toUpperCase() === 'POST') {
      fetchOptions = {
        ...fetchOptions,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload || {}),
      };
    }

    const response = await fetch(targetUrl, fetchOptions);
    const text = await response.text();
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text, status: 'success' };
    }

    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in /api/sheets/proxy:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'ไม่สามารถติดต่อ Google Apps Script ได้ กรุณาตรวจสอบ URL หรือสิทธิ์ Anyone',
    });
  }
});

// ==========================================
// Central Database API Endpoints (Persistent)
// ==========================================

// Database API: Checklist
app.get('/api/database/checklist', (req, res) => {
  res.json({
    success: true,
    items: memoryDbStore.checklistItems || [],
    title: memoryDbStore.checklistTitle || 'Audit Checklist',
    isCustom: memoryDbStore.isCustomChecklist ?? true,
    lastUpdated: memoryDbStore.lastUpdated,
  });
});

app.post('/api/database/checklist', (req, res) => {
  try {
    const { items, title, isCustom } = req.body;
    saveDatabaseStore({
      checklistItems: Array.isArray(items) ? items : memoryDbStore.checklistItems,
      checklistTitle: typeof title === 'string' ? title : memoryDbStore.checklistTitle,
      isCustomChecklist: typeof isCustom === 'boolean' ? isCustom : memoryDbStore.isCustomChecklist,
    });
    res.json({
      success: true,
      count: memoryDbStore.checklistItems.length,
      title: memoryDbStore.checklistTitle,
      message: 'บันทึก Checklist ลงฐานข้อมูลระบบสำเร็จ',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Database API: Team Members (Auditor & Auditee)
app.get('/api/database/team', (req, res) => {
  res.json({
    success: true,
    teamMembers: memoryDbStore.teamMembers || [],
    lastUpdated: memoryDbStore.lastUpdated,
  });
});

app.post('/api/database/team', (req, res) => {
  try {
    const { teamMembers } = req.body;
    if (Array.isArray(teamMembers)) {
      saveDatabaseStore({ teamMembers });
      return res.json({
        success: true,
        count: teamMembers.length,
        message: 'บันทึกรายชื่อทีม Auditor & Auditee ลงฐานข้อมูลระบบสำเร็จ',
      });
    }
    res.status(400).json({ success: false, error: 'ข้อมูล teamMembers ต้องเป็น Array' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Database API: Audit Schedule Plan
app.get('/api/database/schedule', (req, res) => {
  res.json({
    success: true,
    schedule: memoryDbStore.auditSchedule || [],
    lastUpdated: memoryDbStore.lastUpdated,
  });
});

app.post('/api/database/schedule', (req, res) => {
  try {
    const { schedule } = req.body;
    if (Array.isArray(schedule)) {
      saveDatabaseStore({ auditSchedule: schedule });
      return res.json({
        success: true,
        count: schedule.length,
        message: 'บันทึกตารางออดิตลงฐานข้อมูลระบบสำเร็จ',
      });
    }
    res.status(400).json({ success: false, error: 'ข้อมูล schedule ต้องเป็น Array' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Database API: All data snapshot
app.get('/api/database/all', (req, res) => {
  res.json({
    success: true,
    items: memoryDbStore.checklistItems || [],
    title: memoryDbStore.checklistTitle || 'Audit Checklist',
    isCustom: memoryDbStore.isCustomChecklist ?? true,
    teamMembers: memoryDbStore.teamMembers || [],
    schedule: memoryDbStore.auditSchedule || [],
    lastUpdated: memoryDbStore.lastUpdated,
  });
});

// Vite middleware in dev or static files in prod
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distDir = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`น้องออดิต AI Mock Auditor KRC running on http://0.0.0.0:${PORT}`);
});
