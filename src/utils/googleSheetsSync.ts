import {
  AuditItem,
  CapData,
  GoogleSheetsConfig,
  AuditSummaryMetrics,
  TeamMember,
  AuditPlanEntry,
} from '../types/audit';

export const STORAGE_KEY_SHEETS_CONFIG = 'krc_audit_google_sheets_config_v1';

export const DEFAULT_SHEETS_CONFIG: GoogleSheetsConfig = {
  webAppUrl: '',
  isConnected: false,
  autoSyncOnFinding: true,
  autoSyncOnCar: true,
};

export const getSheetsConfig = (): GoogleSheetsConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SHEETS_CONFIG);
    if (raw) {
      return { ...DEFAULT_SHEETS_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to load Google Sheets config:', e);
  }
  return DEFAULT_SHEETS_CONFIG;
};

export const saveSheetsConfig = (config: GoogleSheetsConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY_SHEETS_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save Google Sheets config:', e);
  }

  // Also broadcast to server so all published app users share the configuration
  fetch('/api/sheets/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config }),
  }).catch((err) => console.warn('Failed to broadcast sheets config to server:', err));
};

export const fetchSharedSheetsConfig = async (): Promise<GoogleSheetsConfig | null> => {
  try {
    const res = await fetch('/api/sheets/config');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.config?.webAppUrl) {
        // Cache to local storage as well
        localStorage.setItem(STORAGE_KEY_SHEETS_CONFIG, JSON.stringify(data.config));
        return data.config;
      }
    }
  } catch (err) {
    console.warn('Could not fetch shared sheets config from server:', err);
  }
  return null;
};

/**
 * Calculate Summary Metrics matching KRC Audit Standards
 */
export const calculateSummaryMetrics = (
  items: AuditItem[],
  scenarioTitle = 'รอบการตรวจติดตามภายในประจำปี 2026',
  leadAuditor = 'น้องออดิต AI (Lead Auditor)'
): AuditSummaryMetrics => {
  const total = items.length;
  const countC = items.filter((i) => i.status === 'C').length;
  const countMajor = items.filter((i) => i.status === 'MA').length;
  const countMinor = items.filter((i) => i.status === 'MI').length;
  const countOBS = items.filter((i) => i.status === 'OBS').length;
  const countOFI = items.filter((i) => i.status === 'OFI').length;
  const pendingCount = items.filter((i) => i.status === 'PENDING').length;
  const evaluatedCount = total - pendingCount;

  const totalPoints =
    evaluatedCount > 0
      ? (countC * 100 + countOFI * 85 + countOBS * 70 + countMinor * 40 + countMajor * 0) / evaluatedCount
      : 0;
  const conformanceRate = Math.round(totalPoints);

  let conformanceGrade = '–';
  if (evaluatedCount > 0) {
    if (countMajor >= 3 || conformanceRate < 50) conformanceGrade = 'F';
    else if (countMajor >= 1 || conformanceRate < 60) conformanceGrade = 'E';
    else if (conformanceRate < 70) conformanceGrade = 'D';
    else if (conformanceRate < 80) conformanceGrade = 'C';
    else if (conformanceRate < 90) conformanceGrade = 'B';
    else conformanceGrade = 'A';
  }

  let status = 'อยู่ระหว่างตรวจ';
  if (evaluatedCount === total && total > 0) {
    status = countMajor === 0 && countMinor === 0 ? 'ผ่านการตรวจ (Compliant)' : 'พบข้อบกพร่อง (NC Issued)';
  }

  return {
    auditId: 'AUD-KRC-2026-001',
    scenarioName: scenarioTitle,
    standard: 'ISO 9001:2015, ISO 14001:2015, ISO 45001:2018 (Amd 1:2024)',
    totalChecklist: total,
    evaluatedCount,
    pendingCount,
    conformanceRate,
    conformanceGrade,
    countC,
    countMajor,
    countMinor,
    countOBS,
    countOFI,
    auditorLeader: leadAuditor,
    status,
    lastUpdated: new Date().toLocaleString('th-TH'),
  };
};

/**
 * Universal caller: tries backend proxy /api/sheets/proxy first (to bypass CORS & follow 302 redirects),
 * with direct fetch fallback.
 */
async function callSheetsEndpoint(
  webAppUrl: string,
  method: 'GET' | 'POST',
  payload?: any
): Promise<any> {
  const cleanUrl = webAppUrl.trim();
  if (!cleanUrl) {
    throw new Error('กรุณาระบุ Google Apps Script Web App URL');
  }

  // 1. Try backend proxy first for reliable CORS and redirect handling
  try {
    const proxyRes = await fetch('/api/sheets/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webAppUrl: cleanUrl,
        method,
        payload,
      }),
    });

    if (proxyRes.ok) {
      const json = await proxyRes.json();
      if (json.success) {
        return json.data;
      }
      throw new Error(json.error || 'Server proxy returned error');
    }
  } catch (proxyErr) {
    console.warn('Proxy request failed or unavailable, attempting direct fetch:', proxyErr);
  }

  // 2. Direct fetch fallback
  const fetchUrl =
    method === 'GET' && payload
      ? `${cleanUrl}?${new URLSearchParams(payload).toString()}`
      : cleanUrl;

  const res = await fetch(fetchUrl, {
    method,
    headers: method === 'POST' ? { 'Content-Type': 'text/plain;charset=utf-8' } : undefined,
    body: method === 'POST' ? JSON.stringify(payload) : undefined,
  });

  if (!res.ok) {
    throw new Error(`Google Apps Script ตอบกลับด้วยสถานะ HTTP ${res.status}`);
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text, status: 'success' };
  }
}

/**
 * Test Connection to Google Apps Script Web App
 */
export async function testSheetsConnection(
  webAppUrl: string
): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    const data = await callSheetsEndpoint(webAppUrl, 'GET', { action: 'test' });
    return {
      success: true,
      message: data.message || 'เชื่อมต่อกับ Google Apps Script สำเร็จ',
      details: data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'ไม่สามารถเชื่อมต่อ Web App ได้ กรุณาตรวจสอบ URL และสิทธิ์การเข้าถึง (Anyone)',
    };
  }
}

/**
 * Fetch latest Audit_Summary row from Google Sheets
 */
export async function fetchAuditSummaryFromSheets(
  webAppUrl: string
): Promise<{ success: boolean; summary?: AuditSummaryMetrics; message?: string }> {
  try {
    const data = await callSheetsEndpoint(webAppUrl, 'GET', { action: 'getSummary' });
    if (data && (data.summary || data.conformanceRate !== undefined)) {
      return {
        success: true,
        summary: data.summary || data,
      };
    }
    return {
      success: true,
      summary: data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'ดึงข้อมูลสรุปจากชีตไม่สำเร็จ',
    };
  }
}

/**
 * Send single Finding & Evidence to Audit_Findings_Evidence sheet
 */
export async function syncFindingToSheets(
  webAppUrl: string,
  item: AuditItem,
  role = 'AUDITOR',
  summary?: AuditSummaryMetrics
): Promise<{ success: boolean; message?: string }> {
  try {
    // Map Finding data for Audit_Findings_Evidence
    const findingRow = {
      findingId: `FIND-${String(item.id).padStart(3, '0')}-${Date.now().toString().slice(-4)}`,
      auditId: summary?.auditId || 'AUD-KRC-2026-001',
      itemNo: item.id,
      evaluatorRole: role,
      assessmentResult: item.status,
      findingDetail: item.auditorFindingDetail || item.question,
      evidenceDescription: item.evidenceRecorded || '-',
      evidencePhotoUrl:
        item.auditeeResponse?.attachments?.find((a) => a.type === 'IMAGE' && a.url)?.url ||
        (item.auditeeResponse?.attachments?.length ? `${item.auditeeResponse.attachments.length} ไฟล์แนบ` : '-'),
      auditeeExplanation: item.auditeeResponse?.explanation || '-',
      aiEvaluationNote: item.isoClauses?.length ? `ISO: ${item.isoClauses.join(', ')}` : '-',
      timestamp: new Date().toISOString(),
    };

    const payload = {
      action: 'saveFinding',
      finding: findingRow,
      summary: summary || null,
    };

    const res = await callSheetsEndpoint(webAppUrl, 'POST', payload);
    return { success: true, message: res.message || 'บันทึกผลตรวจลงชีตสำเร็จ' };
  } catch (err: any) {
    return { success: false, message: err.message || 'ส่งผลตรวจไปยังชีตไม่สำเร็จ' };
  }
}

/**
 * Send CAR & CAP data to CAR_CAP_Tracking sheet
 */
export async function syncCarToSheets(
  webAppUrl: string,
  item: AuditItem,
  carData: CapData,
  auditId = 'AUD-KRC-2026-001'
): Promise<{ success: boolean; message?: string }> {
  try {
    const carRow = {
      carNo: carData.carNo,
      auditId,
      findingId: `FIND-${String(item.id).padStart(3, '0')}`,
      deptInCharge: carData.personInCharge,
      severity: item.status === 'MA' ? 'Major' : item.status === 'MI' ? 'Minor' : 'Observation',
      issueDate: new Date().toISOString().split('T')[0],
      dueDateCap: carData.targetDate,
      rootCauseAnalysis: carData.rootCause,
      correctiveActionPlan: `${carData.correction} | ${carData.correctiveAction}`,
      picName: carData.personInCharge,
      picEmail: item.assignedAuditeeName ? `${item.assignedAuditeeName}@krctrans.com` : 'iso-sshe@krctrans.com',
      followupDate: '',
      effectivenessStatus: carData.status === 'CLOSED' ? 'มีประสิทธิผล' : 'อยู่ระหว่างแก้ไข',
      closureDate: carData.status === 'CLOSED' ? new Date().toISOString().split('T')[0] : '',
    };

    const payload = {
      action: 'saveCar',
      car: carRow,
    };

    const res = await callSheetsEndpoint(webAppUrl, 'POST', payload);
    return { success: true, message: res.message || 'บันทึกใบ CAR ลงชีตสำเร็จ' };
  } catch (err: any) {
    return { success: false, message: err.message || 'ส่งใบ CAR ไปยังชีตไม่สำเร็จ' };
  }
}

/**
 * Send single Audit Plan Entry to Audit_Schedule_Plan sheet
 */
export async function syncScheduleToSheets(
  webAppUrl: string,
  schedule: AuditPlanEntry
): Promise<{ success: boolean; message?: string }> {
  try {
    const payload = {
      action: 'saveSchedule',
      schedule: {
        id: schedule.id,
        date: schedule.date,
        timeSlot: schedule.timeSlot,
        department: schedule.department,
        location: schedule.location,
        scope: schedule.scope,
        isoClauses: schedule.isoClauses,
        leadAuditor: schedule.leadAuditor,
        auditTeam: schedule.auditTeam || '-',
        auditeeName: schedule.auditeeName,
        referenceDocs: schedule.referenceDocs,
        status: schedule.status,
        notes: schedule.notes || '-',
      },
    };

    const res = await callSheetsEndpoint(webAppUrl, 'POST', payload);
    return { success: true, message: res.message || 'บันทึกตารางออดิตลง Google Sheets สำเร็จ' };
  } catch (err: any) {
    return { success: false, message: err.message || 'บันทึกตารางออดิตลง Google Sheets ไม่สำเร็จ' };
  }
}

/**
 * Send all Audit Plan Entries to Audit_Schedule_Plan sheet
 */
export async function syncAllSchedulesToSheets(
  webAppUrl: string,
  schedules: AuditPlanEntry[]
): Promise<{ success: boolean; message?: string }> {
  try {
    const payload = {
      action: 'syncAllSchedules',
      schedules: schedules.map((s) => ({
        id: s.id,
        date: s.date,
        timeSlot: s.timeSlot,
        department: s.department,
        location: s.location,
        scope: s.scope,
        isoClauses: s.isoClauses,
        leadAuditor: s.leadAuditor,
        auditTeam: s.auditTeam || '-',
        auditeeName: s.auditeeName,
        referenceDocs: s.referenceDocs,
        status: s.status,
        notes: s.notes || '-',
      })),
    };

    const res = await callSheetsEndpoint(webAppUrl, 'POST', payload);
    return { success: true, message: res.message || 'ซิงค์ตารางออดิตทั้งหมดลง Google Sheets สำเร็จ' };
  } catch (err: any) {
    return { success: false, message: err.message || 'ซิงค์ตารางออดิตไปยัง Google Sheets ไม่สำเร็จ' };
  }
}

/**
 * Sync entire dashboard state to all 5 sheets in Google Sheets
 */
export async function syncAllToSheets(
  webAppUrl: string,
  items: AuditItem[],
  teamMembers: TeamMember[],
  summary: AuditSummaryMetrics
): Promise<{ success: boolean; message?: string; count?: number }> {
  try {
    const evaluatedItems = items.filter((i) => i.status !== 'PENDING');
    const carItems = items.filter((i) => i.capData || i.capRequired);

    const findings = evaluatedItems.map((item) => ({
      findingId: `FIND-${String(item.id).padStart(3, '0')}`,
      auditId: summary.auditId,
      itemNo: item.id,
      evaluatorRole: 'Auditor',
      assessmentResult: item.status,
      findingDetail: item.auditorFindingDetail || item.question,
      evidenceDescription: item.evidenceRecorded || '-',
      evidencePhotoUrl: item.auditeeResponse?.attachments?.length ? `${item.auditeeResponse.attachments.length} ไฟล์แนบ` : '-',
      auditeeExplanation: item.auditeeResponse?.explanation || '-',
      aiEvaluationNote: item.isoClauses?.join(', ') || '-',
      timestamp: new Date().toISOString(),
    }));

    const cars = carItems
      .filter((i) => i.capData)
      .map((item) => {
        const c = item.capData!;
        return {
          carNo: c.carNo,
          auditId: summary.auditId,
          findingId: `FIND-${String(item.id).padStart(3, '0')}`,
          deptInCharge: c.personInCharge,
          severity: item.status === 'MA' ? 'Major' : 'Minor',
          issueDate: new Date().toISOString().split('T')[0],
          dueDateCap: c.targetDate,
          rootCauseAnalysis: c.rootCause,
          correctiveActionPlan: `${c.correction} | ${c.correctiveAction}`,
          picName: c.personInCharge,
          picEmail: 'iso-sshe@krctrans.com',
          followupDate: '',
          effectivenessStatus: c.status === 'CLOSED' ? 'มีประสิทธิผล' : 'อยู่ระหว่างแก้ไข',
          closureDate: c.status === 'CLOSED' ? new Date().toISOString().split('T')[0] : '',
        };
      });

    const checklistMaster = items.map((item) => ({
      itemNo: item.id,
      categorySection: item.categoryTitle,
      standard: 'ISO 9001/14001/45001',
      clauseNo: item.requirement,
      auditQuestion: item.question,
      targetDept: 'ลานตู้คอนเทนเนอร์ & การขนส่ง',
      riskLevel: item.priority === 'HIGH' ? 'High Risk' : 'Normal',
      relatedDocWi: item.referenceDocs,
    }));

    const users = teamMembers.map((m, idx) => ({
      userId: m.id || `USR-${idx + 1}`,
      fullName: m.name,
      email: m.email,
      department: m.department,
      role: m.role,
      activeStatus: 'Active',
    }));

    const payload = {
      action: 'syncAll',
      summary,
      findings,
      cars,
      checklistMaster,
      users,
    };

    const res = await callSheetsEndpoint(webAppUrl, 'POST', payload);
    return {
      success: true,
      message: res.message || 'ซิงค์ข้อมูลทั้งหมดขึ้น Google Sheets สำเร็จ',
      count: findings.length,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'ซิงค์ข้อมูลไม่สำเร็จ' };
  }
}

/**
 * Complete Google Apps Script (.gs) source code for Google Sheets database
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ============================================================================
 * ระบบฐานข้อมูลการตรวจติดตามภายใน K.R.C. TRANSPORT & SERVICE
 * ไฟล์: KRC_Audit_Database_Master (Google Apps Script .gs)
 * มาตรฐาน: ISO 9001:2015, ISO 14001:2015, ISO 45001:2018
 * ============================================================================
 */

const SPREADSHEET_NAME = "KRC_Audit_Database_Master";

// 1. ฟังก์ชันสร้างไฟล์และโครงสร้างชีต 5 แท็บหลัก
function createOrInitializeAuditDatabase() {
  let ss;
  const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  
  if (files.hasNext()) {
    ss = SpreadsheetApp.open(files.next());
    Logger.log("เปิดไฟล์เดิม: " + ss.getUrl());
  } else {
    ss = SpreadsheetApp.create(SPREADSHEET_NAME);
    Logger.log("สร้างไฟล์ใหม่สำเร็จ: " + ss.getUrl());
  }

  setupAuditSummarySheet(ss);
  setupChecklistMasterSheet(ss);
  setupFindingsEvidenceSheet(ss);
  setupCarTrackingSheet(ss);
  setupAuditScheduleSheet(ss);
  setupUsersSheet(ss);

  // ลบ Sheet1 เริ่มต้นถ้ามี
  const defaultSheet = ss.getSheetByName("Sheet1") || ss.getSheetByName("แผ่น1");
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  return ss.getUrl();
}

function setupAuditSummarySheet(ss) {
  const sheetName = "Audit_Summary";
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  const headers = [
    "Audit_ID", "Scenario_Name", "Standard", "Total_Checklist",
    "Evaluated_Count", "Pending_Count", "Conformance_Rate", "Conformance_Grade",
    "Count_C", "Count_Major", "Count_Minor", "Count_OBS", "Count_OFI",
    "Auditor_Leader", "Status", "Last_Updated"
  ];

  formatHeaderRow(sheet, headers, "#1e3a8a"); // น้ำเงินเข้ม Navy
}

function setupChecklistMasterSheet(ss) {
  const sheetName = "Audit_Checklist_Master";
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  const headers = [
    "Item_No", "Category_Section", "Standard", "Clause_No",
    "Audit_Question", "Target_Dept", "Risk_Level", "Related_Doc_WI"
  ];

  formatHeaderRow(sheet, headers, "#0f766e"); // เขียวเข้ม Teal
}

function setupFindingsEvidenceSheet(ss) {
  const sheetName = "Audit_Findings_Evidence";
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  const headers = [
    "Finding_ID", "Audit_ID", "Item_No", "Evaluator_Role",
    "Assessment_Result", "Finding_Detail", "Evidence_Description",
    "Evidence_Photo_URL", "Auditee_Explanation", "AI_Evaluation_Note", "Timestamp"
  ];

  formatHeaderRow(sheet, headers, "#4338ca"); // น้ำเงินม่วง Indigo
}

function setupCarTrackingSheet(ss) {
  const sheetName = "CAR_CAP_Tracking";
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  const headers = [
    "CAR_No", "Audit_ID", "Finding_ID", "Dept_In_Charge",
    "Severity", "Issue_Date", "Due_Date_CAP", "Root_Cause_Analysis",
    "Corrective_Action_Plan", "PIC_Name", "PIC_Email", "Followup_Date",
    "Effectiveness_Status", "Closure_Date"
  ];

  formatHeaderRow(sheet, headers, "#be123c"); // แดงกุหลาบ Rose
}

function setupUsersSheet(ss) {
  const sheetName = "Users_and_Roles";
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  const headers = ["User_ID", "Full_Name", "Email", "Department", "Role", "Active_Status"];
  formatHeaderRow(sheet, headers, "#334155"); // เทาเข้ม Slate

  if (sheet.getLastRow() === 1) {
    sheet.appendRow(["USR-001", "ประภาส สันติสุข", "iso-sshe@krctrans.com", "QSHE", "ADMIN", "Active"]);
    sheet.appendRow(["USR-002", "น้องออดิต AI", "ai-auditor@krctrans.com", "Lead Auditor", "Lead Auditor", "Active"]);
    sheet.appendRow(["USR-003", "วิชัย ชัยชนะ", "yard-ops@krctrans.com", "Operations", "Auditee", "Active"]);
  }
}

function setupAuditScheduleSheet(ss) {
  const sheetName = "Audit_Schedule_Plan";
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  const headers = [
    "Plan_ID", "Audit_Date", "Time_Slot", "Department",
    "Location", "Scope_Highlights", "ISO_Clauses", "Lead_Auditor",
    "Audit_Team", "Auditee_Name", "Reference_Docs", "Status", "Notes", "Last_Updated"
  ];
  formatHeaderRow(sheet, headers, "#4f46e5"); // สีม่วงคราม Indigo
}

function formatHeaderRow(sheet, headers, bgColor) {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground(bgColor);
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setFontSize(10);
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
}

// 2. Webhook / REST API Handlers
function doGet(e) {
  try {
    const ss = getSpreadsheet();
    const action = e && e.parameter ? e.parameter.action : "test";

    if (action === "getSummary") {
      const summarySheet = ss.getSheetByName("Audit_Summary");
      let summary = null;
      if (summarySheet && summarySheet.getLastRow() > 1) {
        const lastRow = summarySheet.getLastRow();
        const data = summarySheet.getRange(lastRow, 1, 1, 16).getValues()[0];
        summary = {
          auditId: data[0],
          scenarioName: data[1],
          standard: data[2],
          totalChecklist: data[3],
          evaluatedCount: data[4],
          pendingCount: data[5],
          conformanceRate: data[6],
          conformanceGrade: data[7],
          countC: data[8],
          countMajor: data[9],
          countMinor: data[10],
          countOBS: data[11],
          countOFI: data[12],
          auditorLeader: data[13],
          status: data[14],
          lastUpdated: data[15]
        };
      }
      return jsonResponse({ status: "success", summary: summary });
    }

    return jsonResponse({
      status: "success",
      message: "Connected to KRC_Audit_Database_Master successfully",
      spreadsheetUrl: ss.getUrl(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  try {
    const ss = getSpreadsheet();
    let body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    const action = body.action || "saveFinding";

    if (action === "saveFinding") {
      const f = body.finding;
      const sheet = ss.getSheetByName("Audit_Findings_Evidence");
      if (sheet && f) {
        sheet.appendRow([
          f.findingId || "FIND-" + Date.now(),
          f.auditId || "AUD-KRC-2026-001",
          f.itemNo || "",
          f.evaluatorRole || "Auditor",
          f.assessmentResult || "C",
          f.findingDetail || "",
          f.evidenceDescription || "",
          f.evidencePhotoUrl || "",
          f.auditeeExplanation || "",
          f.aiEvaluationNote || "",
          f.timestamp || new Date().toISOString()
        ]);
      }
      if (body.summary) {
        updateAuditSummaryRow(ss, body.summary);
      }
      return jsonResponse({ status: "success", message: "Saved finding to Audit_Findings_Evidence" });
    }

    if (action === "saveCar") {
      const c = body.car;
      const sheet = ss.getSheetByName("CAR_CAP_Tracking");
      if (sheet && c) {
        sheet.appendRow([
          c.carNo,
          c.auditId || "AUD-KRC-2026-001",
          c.findingId || "",
          c.deptInCharge || "",
          c.severity || "Major",
          c.issueDate || new Date().toISOString().split("T")[0],
          c.dueDateCap || "",
          c.rootCauseAnalysis || "",
          c.correctiveActionPlan || "",
          c.picName || "",
          c.picEmail || "",
          c.followupDate || "",
          c.effectivenessStatus || "อยู่ระหว่างแก้ไข",
          c.closureDate || ""
        ]);
      }
      return jsonResponse({ status: "success", message: "Saved CAR to CAR_CAP_Tracking" });
    }

    if (action === "saveSchedule") {
      setupAuditScheduleSheet(ss);
      const sheet = ss.getSheetByName("Audit_Schedule_Plan");
      const p = body.schedule;
      if (sheet && p) {
        const lastRow = sheet.getLastRow();
        let rowFound = -1;
        if (lastRow > 1) {
          const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
          for (let i = 0; i < ids.length; i++) {
            if (String(ids[i][0]) === String(p.id)) {
              rowFound = i + 2;
              break;
            }
          }
        }
        const rowData = [
          p.id, p.date, p.timeSlot, p.department,
          p.location, p.scope, Array.isArray(p.isoClauses) ? p.isoClauses.join(", ") : (p.isoClauses || ""),
          p.leadAuditor, p.auditTeam || "-", p.auditeeName, p.referenceDocs || "-",
          p.status, p.notes || "-", new Date().toISOString()
        ];
        if (rowFound > 0) {
          sheet.getRange(rowFound, 1, 1, rowData.length).setValues([rowData]);
        } else {
          sheet.appendRow(rowData);
        }
      }
      return jsonResponse({ status: "success", message: "Saved audit schedule to Audit_Schedule_Plan" });
    }

    if (action === "syncAllSchedules") {
      setupAuditScheduleSheet(ss);
      const sheet = ss.getSheetByName("Audit_Schedule_Plan");
      const list = body.schedules;
      if (sheet && Array.isArray(list)) {
        list.forEach(function(p) {
          sheet.appendRow([
            p.id, p.date, p.timeSlot, p.department,
            p.location, p.scope, Array.isArray(p.isoClauses) ? p.isoClauses.join(", ") : (p.isoClauses || ""),
            p.leadAuditor, p.auditTeam || "-", p.auditeeName, p.referenceDocs || "-",
            p.status, p.notes || "-", new Date().toISOString()
          ]);
        });
      }
      return jsonResponse({ status: "success", message: "Synced all schedules to Audit_Schedule_Plan" });
    }

    if (action === "syncAll") {
      if (body.summary) updateAuditSummaryRow(ss, body.summary);
      if (body.findings && Array.isArray(body.findings)) {
        const sheet = ss.getSheetByName("Audit_Findings_Evidence");
        body.findings.forEach(function(f) {
          sheet.appendRow([
            f.findingId, f.auditId, f.itemNo, f.evaluatorRole,
            f.assessmentResult, f.findingDetail, f.evidenceDescription,
            f.evidencePhotoUrl, f.auditeeExplanation, f.aiEvaluationNote, f.timestamp
          ]);
        });
      }
      return jsonResponse({ status: "success", message: "Synchronized all data successfully" });
    }

    return jsonResponse({ status: "error", message: "Unknown action: " + action });
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

function updateAuditSummaryRow(ss, s) {
  const sheet = ss.getSheetByName("Audit_Summary");
  if (!sheet) return;
  sheet.appendRow([
    s.auditId, s.scenarioName, s.standard, s.totalChecklist,
    s.evaluatedCount, s.pendingCount, s.conformanceRate, s.conformanceGrade,
    s.countC, s.countMajor, s.countMinor, s.countOBS, s.countOFI,
    s.auditorLeader, s.status, s.lastUpdated
  ]);
}

function getSpreadsheet() {
  const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create(SPREADSHEET_NAME);
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
