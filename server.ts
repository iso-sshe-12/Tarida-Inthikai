import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
    res.json(parsedData);
  } catch (error: any) {
    console.error('Error in /api/audit/evaluate:', error);
    res.status(500).json({
      error: 'เกิดข้อผิดพลาดในการประเมินหลักฐาน',
      details: error.message,
    });
  }
});

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
    console.error('Error in /api/audit/explain:', error);
    res.status(500).json({
      error: 'เกิดข้อผิดพลาดในการสร้างคำอธิบาย',
      details: error.message,
    });
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
    console.error('Error in /api/audit/generate-report:', error);
    res.status(500).json({
      error: 'เกิดข้อผิดพลาดในการสร้างรายงานสรุป',
      details: error.message,
    });
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
