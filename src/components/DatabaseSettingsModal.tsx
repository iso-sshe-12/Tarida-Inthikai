import React, { useState } from 'react';
import {
  Database,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  FileSpreadsheet,
  Link,
  ShieldCheck,
  ShieldAlert,
  DownloadCloud,
  UploadCloud,
  Settings,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react';
import { GoogleSheetsConfig, AuditItem, TeamMember } from '../types/audit';
import {
  saveSheetsConfig,
  testSheetsConnection,
  syncAllToSheets,
  fetchAuditSummaryFromSheets,
  calculateSummaryMetrics,
  GOOGLE_APPS_SCRIPT_CODE,
} from '../utils/googleSheetsSync';

interface DatabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetsConfig;
  onUpdateConfig: (newConfig: GoogleSheetsConfig) => void;
  items: AuditItem[];
  teamMembers: TeamMember[];
  onApplySummaryFromSheet?: (summaryData: any) => void;
  scenarioTitle?: string;
  currentUser?: TeamMember;
}

export const DatabaseSettingsModal: React.FC<DatabaseSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  items,
  teamMembers,
  onApplySummaryFromSheet,
  scenarioTitle,
  currentUser,
}) => {
  if (!isOpen) return null;

  // Security guard: If current user is not Admin, show restricted screen
  if (currentUser && currentUser.role !== 'ADMIN') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-inner">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-wider">
              สิทธิ์ไม่เพียงพอ (Access Denied)
            </span>
            <h3 className="text-base font-bold text-slate-800 mt-2">
              สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              ผู้ใช้งานปัจจุบัน <strong>"{currentUser.name}"</strong> มีบทบาทเป็น <strong>{currentUser.role}</strong>{' '}
              ไม่มีสิทธิ์เข้าถึงหรือแก้ไขการตั้งค่าฐานข้อมูล Google Sheets
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 active:scale-98 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    );
  }

  const [urlInput, setUrlInput] = useState<string>(config.webAppUrl || '');
  const [autoSyncOnFinding, setAutoSyncOnFinding] = useState<boolean>(config.autoSyncOnFinding ?? true);
  const [autoSyncOnCar, setAutoSyncOnCar] = useState<boolean>(config.autoSyncOnCar ?? true);

  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [syncingAll, setSyncingAll] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const [fetchingSummary, setFetchingSummary] = useState<boolean>(false);
  const [codeCopied, setCodeCopied] = useState<boolean>(false);
  const [showCode, setShowCode] = useState<boolean>(false);

  // Handle Test Connection
  const handleTestConnection = async () => {
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) {
      setTestResult({
        success: false,
        message: 'กรุณาวาง Google Apps Script Web App URL ก่อนกดทดสอบ',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const res = await testSheetsConnection(cleanUrl);
    setTesting(false);
    setTestResult(res);

    if (res.success) {
      const updatedConfig: GoogleSheetsConfig = {
        ...config,
        webAppUrl: cleanUrl,
        isConnected: true,
        lastTestedAt: new Date().toLocaleTimeString('th-TH'),
        spreadsheetName: 'KRC_Audit_Database_Master',
        autoSyncOnFinding,
        autoSyncOnCar,
      };
      saveSheetsConfig(updatedConfig);
      onUpdateConfig(updatedConfig);
    }
  };

  // Handle Save & Connect
  const handleSave = () => {
    const cleanUrl = urlInput.trim();
    const updatedConfig: GoogleSheetsConfig = {
      ...config,
      webAppUrl: cleanUrl,
      isConnected: cleanUrl.length > 0 && (config.isConnected || testResult?.success || false),
      autoSyncOnFinding,
      autoSyncOnCar,
    };
    saveSheetsConfig(updatedConfig);
    onUpdateConfig(updatedConfig);
    onClose();
  };

  // Handle Sync All Now
  const handleSyncAll = async () => {
    const cleanUrl = (urlInput || config.webAppUrl).trim();
    if (!cleanUrl) {
      alert('กรุณาระบุ Web App URL ก่อนทำการซิงค์');
      return;
    }

    setSyncingAll(true);
    setSyncResult(null);

    const summary = calculateSummaryMetrics(items, scenarioTitle);
    const res = await syncAllToSheets(cleanUrl, items, teamMembers, summary);

    setSyncingAll(false);
    setSyncResult({
      success: res.success,
      message: res.message || (res.success ? 'ซิงค์ข้อมูลสำเร็จ' : 'เกิดข้อผิดพลาดในการซิงค์'),
    });

    if (res.success) {
      const updated: GoogleSheetsConfig = {
        ...config,
        webAppUrl: cleanUrl,
        isConnected: true,
        lastSyncedAt: new Date().toLocaleTimeString('th-TH'),
      };
      saveSheetsConfig(updated);
      onUpdateConfig(updated);
    }
  };

  // Handle Fetch Summary from Sheet
  const handleFetchSummary = async () => {
    const cleanUrl = (urlInput || config.webAppUrl).trim();
    if (!cleanUrl) {
      alert('กรุณาระบุ Web App URL ก่อนดึงข้อมูล');
      return;
    }

    setFetchingSummary(true);
    const res = await fetchAuditSummaryFromSheets(cleanUrl);
    setFetchingSummary(false);

    if (res.success && res.summary) {
      if (onApplySummaryFromSheet) {
        onApplySummaryFromSheet(res.summary);
      }
      alert(
        `✓ ดึงข้อมูลสรุปจากชีต Audit_Summary สำเร็จ!\n- เกรด: ${res.summary.conformanceGrade || '-'}\n- ความสอดคล้อง: ${
          res.summary.conformanceRate ?? '-'
        }%\n- ตรวจแล้ว: ${res.summary.evaluatedCount ?? '-'}/${res.summary.totalChecklist ?? '-'}`
      );
    } else {
      alert('ไม่สามารถดึงข้อมูลสรุปได้: ' + (res.message || 'ไม่มีข้อมูล'));
    }
  };

  // Handle Copy Apps Script Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between shrink-0 border-b border-blue-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-200 shadow-inner">
              <Database className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Google Sheets Integration
                </span>
                <span className="text-[11px] font-mono text-emerald-300">
                  KRC_Audit_Database_Master
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  สิทธิ์เฉพาะ Admin {currentUser ? `(${currentUser.name})` : ''}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white mt-0.5">
                ตั้งค่าการเชื่อมต่อฐานข้อมูล Google Sheets
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Connection Status Card */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              config.isConnected
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3.5 h-3.5 rounded-full ${
                    config.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      สถานะการเชื่อมต่อ:
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        config.isConnected
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {config.isConnected ? '✓ เชื่อมต่อสำเร็จ (Connected)' : 'ยังไม่ได้เชื่อมต่อ (Not Connected)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    เป้าหมาย: <strong className="font-mono text-blue-700">KRC_Audit_Database_Master</strong> บน Google Drive
                    {config.lastTestedAt && (
                      <span className="ml-2 text-slate-500">
                        (ทดสอบล่าสุด: {config.lastTestedAt})
                      </span>
                    )}
                    {config.lastSyncedAt && (
                      <span className="ml-2 text-emerald-700 font-medium">
                        &bull; ซิงค์ล่าสุด: {config.lastSyncedAt}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {config.isConnected && (
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    onClick={handleFetchSummary}
                    disabled={fetchingSummary}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <DownloadCloud className={`w-3.5 h-3.5 ${fetchingSummary ? 'animate-bounce' : ''}`} />
                    <span>{fetchingSummary ? 'กำลังดึง...' : 'ดึงผลสรุปจากชีต'}</span>
                  </button>

                  <button
                    onClick={handleSyncAll}
                    disabled={syncingAll}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <UploadCloud className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
                    <span>{syncingAll ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลทั้งหมดเดี๋ยวนี้'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* URL Input Form */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-blue-600" />
                  Google Apps Script Web App URL
                </span>
                <span className="text-[11px] font-normal text-slate-500">
                  ต้องลงท้ายด้วย <code className="text-blue-700">/exec</code>
                </span>
              </label>

              <div className="relative">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition shadow-inner"
                />
                {urlInput && (
                  <button
                    onClick={() => setUrlInput('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    ล้าง
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                เมื่อ Deploy ใน Google Apps Script ให้เลือก <strong>Who has access: Anyone (ทุกคน)</strong> เพื่อให้ Web Dashboard บันทึกข้อมูลได้
              </p>
            </div>

            {/* Test Connection Result Alert */}
            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-150 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-bold">{testResult.success ? 'เชื่อมต่อสำเร็จ!' : 'เชื่อมต่อไม่สำเร็จ'}</p>
                  <p className="text-[11px] mt-0.5 text-slate-600">{testResult.message}</p>
                </div>
              </div>
            )}

            {/* Sync Result Alert */}
            {syncResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-150 ${
                  syncResult.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {syncResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-bold">{syncResult.success ? 'ซิงค์ข้อมูลสำเร็จ!' : 'ซิงค์ข้อมูลไม่สำเร็จ'}</p>
                  <p className="text-[11px] mt-0.5 text-slate-600">{syncResult.message}</p>
                </div>
              </div>
            )}

            {/* Automation Settings Checkboxes */}
            <div className="pt-3 border-t border-slate-200/80 space-y-2.5">
              <label className="text-xs font-bold text-slate-700 block">
                การซิงค์ข้อมูลอัตโนมัติ (Live Auto-Sync):
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={autoSyncOnFinding}
                  onChange={(e) => setAutoSyncOnFinding(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span>
                  <strong>บันทึกผลตรวจ (Findings) อัตโนมัติ:</strong> เมื่อกดตัดสินผล C, Major NC, Minor NC หรือบันทึกหลักฐาน ให้ยิงข้อมูลไปลงชีต <code>Audit_Findings_Evidence</code> ทันที
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={autoSyncOnCar}
                  onChange={(e) => setAutoSyncOnCar(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span>
                  <strong>บันทึกใบ CAR & CAP อัตโนมัติ:</strong> เมื่อกดออกใบ CAR หรือแก้ไขบันทึกแผนแก้ไข ให้ส่งข้อมูลไปลงชีต <code>CAR_CAP_Tracking</code> ทันที
                </span>
              </label>
            </div>

            {/* Test & Save Button Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !urlInput.trim()}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 cursor-pointer shadow-xs ${
                  testing || !urlInput.trim()
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50 active:scale-95'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-blue-600' : 'text-blue-500'}`} />
                <span>{testing ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ (Test Connection)'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/80 transition cursor-pointer"
                >
                  ยกเลิก
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 active:scale-95 text-white transition shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />
                  <span>บันทึกการเชื่อมต่อ (Save & Connect)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Database Schema Overview (5 Sheets) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              โครงสร้างตารางฐานข้อมูลที่รองรับใน Google Sheets (5 แผ่นชีต)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  1. Audit_Summary
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  รอบการตรวจ, Conformance Rate, เกรด A-F, จำนวน C, MA, MI, OBS, OFI
                </p>
              </div>

              <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200">
                <div className="font-bold text-teal-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                  2. Audit_Checklist_Master
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  คลังข้อตรวจ 87 ข้อ F-SE-006, ข้อกำหนด ISO, คำถาม, WI อ้างอิง
                </p>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200">
                <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  3. Audit_Findings_Evidence
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  ผลตรวจรายข้อ, หลักฐานหน้างาน, ลิงก์รูปภาพ, คำชี้แจง Auditee, Timestamp
                </p>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200">
                <div className="font-bold text-rose-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  4. CAR_CAP_Tracking
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  เลขที่ CAR, กำหนดเสร็จ, RCA สาเหตุ, มาตรการ CAP, ผู้รับผิดชอบ, สถานะ
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 border border-slate-300">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                  5. Users_and_Roles
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  รายชื่อทีมงาน, อีเมล, แผนก, สิทธิ์ (Admin, Auditor, Auditee)
                </p>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200">
                <div className="font-bold text-purple-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                  6. Audit_Schedule_Plan
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  กำหนดการตรวจ, วันที่, เวลา, แผนก, สถานที่, ขอบเขตที่ตรวจ, ISO, ผู้ตรวจ, Auditee, สถานะ
                </p>
              </div>
            </div>
          </div>

          {/* Expandable Section: Full Google Apps Script Code & Deployment Guide */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              className="w-full px-5 py-3.5 bg-slate-100 hover:bg-slate-200/80 transition flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">
                  คู่มือ 3 ขั้นตอน & โค้ด Google Apps Script (.gs) สำหรับสร้างฐานข้อมูลบน Google Drive
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <span className="text-[11px] font-medium hidden sm:inline">
                  {showCode ? 'ซ่อนโค้ด' : 'ดูโค้ดและวิธีติดตั้ง'}
                </span>
                {showCode ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showCode && (
              <div className="p-5 bg-white space-y-4 border-t border-slate-200">
                {/* 3 Step Guide */}
                <div className="space-y-2 text-xs text-slate-700 bg-amber-50/60 p-4 rounded-xl border border-amber-200">
                  <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    ขั้นตอนการนำโค้ดไปติดตั้ง (ทำครั้งเดียว):
                  </h4>
                  <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed">
                    <li>
                      เปิด <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold inline-flex items-center gap-0.5">script.google.com <ExternalLink className="w-3 h-3 inline" /></a> หรือเปิด Google Sheets ใหม่ แล้วไปที่เมนู <strong>ส่วนขยาย (Extensions) &gt; Apps Script</strong>
                    </li>
                    <li>
                      ลบโค้ดเดิมใน <code>Code.gs</code> ออก แล้ววางโค้ดด้านล่างนี้ลงไปทั้งหมด จากนั้นกด <strong>บันทึก (Save)</strong>
                    </li>
                    <li>
                      เลือกฟังก์ชัน <strong>createOrInitializeAuditDatabase</strong> แล้วกด <strong>เรียกใช้ (Run)</strong> 1 ครั้ง เพื่อให้สิทธิ์และสร้าง 5 แผ่นชีตอัตโนมัติ
                    </li>
                    <li>
                      กดปุ่ม <strong>ทำให้ใช้งานได้ (Deploy) &gt; การทำให้ใช้งานได้ใหม่ (New deployment)</strong>
                      <ul className="list-disc list-inside pl-5 mt-1 space-y-0.5 text-slate-600">
                        <li>เลือกประเภท: <strong>เว็บแอป (Web app)</strong></li>
                        <li>ดำเนินการในฐานะ (Execute as): <strong>ฉัน (Me)</strong></li>
                        <li>ใครมีสิทธิ์เข้าถึง (Who has access): <strong className="text-rose-700">ทุกคน (Anyone)</strong></li>
                      </ul>
                    </li>
                    <li>
                      คัดลอก <strong>Web App URL</strong> ที่ได้มาวางในช่อง Input ด้านบน แล้วกด <strong>ทดสอบการเชื่อมต่อ</strong>
                    </li>
                  </ol>
                </div>

                {/* Code Block with Copy Button */}
                <div className="relative">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-900 text-slate-300 rounded-t-xl text-xs font-mono">
                    <span>Code.gs (Google Apps Script)</span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                    >
                      {codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{codeCopied ? 'คัดลอกสำเร็จ!' : 'คัดลอกโค้ด .gs'}</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-950 text-slate-100 text-[11px] font-mono rounded-b-xl overflow-x-auto max-h-72 leading-relaxed selection:bg-blue-600">
                    {GOOGLE_APPS_SCRIPT_CODE}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            ระบบซิงค์เชื่อมโยงมาตรฐาน ISO 9001/14001/45001 &bull; บจก. เค.อาร์.ซี. ทรานสปอร์ต แอนด์ เซอร์วิส
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
