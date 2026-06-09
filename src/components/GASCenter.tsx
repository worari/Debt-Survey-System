/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Copy, Check, FileCode, Database, RefreshCw, Layers } from 'lucide-react';

export default function GASCenter() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 3000);
  };

  const sheetStructureCode = `
[วิธีเตรียมฐานข้อมูล Google Sheets - สร้างชีต 2 ชีต]

ชีตที่ 1: "Users" (เก็บสิทธิ์และรหัสบัญชีข้าราชการ)
คอลัมน์ A: id
คอลัมน์ B: username
คอลัมน์ C: password
คอลัมน์ D: rank
คอลัมน์ E: firstName
คอลัมน์ F: lastName
คอลัมน์ G: department
คอลัมน์ H: unit
คอลัมน์ I: role  (ADMIN / HR / USER)
คอลัมน์ J: status (PENDING / ACTIVE / SUSPENDED)
คอลัมน์ K: createdAt

ชีตที่ 2: "Records" (เก็บข้อมูลประวัติและการสำรวจหนี้สิน)
คอลัมน์ A: id
คอลัมน์ B: userId
คอลัมน์ C: department
คอลัมน์ D: rank
คอลัมน์ E: firstName
คอลัมน์ F: lastName
คอลัมน์ G: salaryLevel
คอลัมน์ H: salaryAmount
คอลัมน์ I: extraIncome
คอลัมน์ J: netIncome
คอลัมน์ K: maritalStatus
คอลัมน์ L: maritalStatusOther
คอลัมน์ M: spouseOccupation
คอลัมน์ N: spouseOccupationOther
คอลัมน์ O: spouseSalary
คอลัมน์ P: additionalIncomes  (JSON string)
คอลัมน์ Q: creditCards        (JSON string)
คอลัมน์ R: vehicles           (JSON string)
คอลัมน์ S: dependents         (JSON string)
คอลัมน์ T: residenceLocation
คอลัมน์ U: district
คอลัมน์ V: province
คอลัมน์ W: residenceStatus
คอลัมน์ X: residenceType
คอลัมน์ Y: debts              (JSON string)
คอลัมน์ Z: createdAt
คอลัมน์ AA: updatedAt
`;

  const appsScriptCode = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ระบบจัดการหนี้สินกำลังพล - Google Apps Script Backend (Code.gs)
 * พัฒนาเพื่อเชื่อมต่อระบบฐานข้อมูล Google Sheets ร่วมกับเว็บแอปพลิเคชัน
 */

const SHEET_ID = 'ใส่_SPREADSHEET_ID_ของคุณที่นี่';

function getSheetByName(name) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

// ----------------------------------------
// 1. รับส่งคำขอ HTTP (สำหรับทำเป็น Web App และ API)
// ----------------------------------------

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('ระบบจัดการหนี้สินกำลังพล')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ฟังก์ชัน API สำรองกรณีเรียกร้านแบบ AJAX / Web App JSON API
function doPost(e) {
  let result = { success: false, message: 'Invalid action' };
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    
    if (action === 'login') {
      result = loginUser(params.username, params.password);
    } else if (action === 'register') {
      result = registerUser(params);
    } else if (action === 'getAllData') {
      result = getAllData();
    } else if (action === 'saveUserData') {
      result = saveUserData(params.record);
    } else if (action === 'deleteUserData') {
      result = deleteUserData(params.id);
    } else if (action === 'getAllUsers') {
      result = getAllUsers();
    } else if (action === 'manageUserAction') {
      result = manageUserAction(params.userId, params.userAction, params.role);
    }
  } catch (error) {
    result = { success: false, message: 'Error: ' + error.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ----------------------------------------
// 2. ฟังก์ชันหลักสำหรับระบบความปลอดภัยและการเข้าถึงผู้ใช้งาน (Users)
// ----------------------------------------

function loginUser(username, password) {
  try {
    const sheet = getSheetByName('Users');
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      // สร้างผู้ดูแลระบบเริ่มต้นเพื่อความปลอดภัย หากไม่มีข้อมูล
      const defaultAdmin = ['admin-id', 'admin', 'password', 'พ.อ.', 'ผู้ดูแล', 'ระบบ', 'บก.กองสิทธิ', 'สปบ.กพ.ทบ.', 'ADMIN', 'ACTIVE', new Date().toISOString()];
      sheet.appendRow(defaultAdmin);
      if (username.toLowerCase() === 'admin' && password === 'password') {
        return {
          success: true,
          user: { id: 'admin-id', username: 'admin', rank: 'พ.อ.', firstName: 'ผู้ดูแล', lastName: 'ระบบ', department: 'บก.กองสิทธิ', unit: 'สปบ.กพ.ทบ.', role: 'ADMIN', status: 'ACTIVE' }
        };
      }
    }
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[1].toString().toLowerCase() === username.toLowerCase()) {
        if (row[2].toString() === password) {
          const status = row[9].toString();
          if (status === 'PENDING') {
            return { success: false, message: 'บัญชีใช้งานของคุณอยู่ระหว่างขั้นตอนการรออนุมัติสิทธิ์เข้าใช้งาน' };
          }
          if (status === 'SUSPENDED') {
            return { success: false, message: 'บัญชีใช้งานของคุณถูกระงับติดต่อสิทธิ์ชั่วคราว' };
          }
          
          return {
            success: true,
            user: {
              id: row[0],
              username: row[1],
              rank: row[3],
              firstName: row[4],
              lastName: row[5],
              department: row[6],
              unit: row[7],
              role: row[8],
              status: status
            }
          };
        }
      }
    }
    return { success: false, message: 'ชื่อผู้ใช้งานหรือรหัสผ่านระบุไม่ถูกต้อง' };
  } catch (error) {
    return { success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์: ' + error.toString() };
  }
}

function registerUser(params) {
  try {
    const sheet = getSheetByName('Users');
    const data = sheet.getDataRange().getValues();
    const username = params.username;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1].toString().toLowerCase() === username.toLowerCase()) {
        return { success: false, message: 'ชื่อผู้ใช้งาน (Username) นี้ถูกลงทะเบียนไว้เรียบร้อยแล้ว' };
      }
    }
    
    const newId = 'usr-' + Math.random().toString(36).substr(2, 9);
    const newRow = [
      newId,
      username,
      params.password,
      params.rank || 'ส.ต.',
      params.firstName,
      params.lastName,
      params.department || 'แผนกแผน',
      params.unit || 'สปบ.กพ.ทบ.',
      'USER',
      'PENDING',
      new Date().toISOString()
    ];
    
    sheet.appendRow(newRow);
    return { success: true, message: 'ส่งข้อมูลคำขอลงทะเบียนสำเร็จ! กรุณารอผู้รับผิดชอบงานอนุมัติเข้าใช้ระบบ' };
  } catch (error) {
    return { success: false, message: 'เกิดข้อผิดพลาดในการบันทึกบัญชีของท่าน: ' + error.toString() };
  }
}

function getAllUsers() {
  try {
    const sheet = getSheetByName('Users');
    const data = sheet.getDataRange().getValues();
    const users = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      users.push({
        id: row[0],
        username: row[1],
        rank: row[3],
        firstName: row[4],
        lastName: row[5],
        department: row[6],
        unit: row[7],
        role: row[8],
        status: row[9],
        createdAt: row[10]
      });
    }
    return users;
  } catch (error) {
    return [];
  }
}

function manageUserAction(id, action, role) {
  try {
    const sheet = getSheetByName('Users');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === id.toString()) {
        const rowNum = i + 1;
        if (action === 'DELETE') {
          sheet.deleteRow(rowNum);
          return { success: true, message: 'ลบบัญชีผู้ใช้งานระบบสำเร็จเรียบร้อย' };
        }
        
        let newStatus = data[i][9];
        let newRole = data[i][8];
        
        if (action === 'APPROVE') {
          newStatus = 'ACTIVE';
          if (role) newRole = role;
        } else if (action === 'SUSPEND') {
          newStatus = 'SUSPENDED';
        }
        
        sheet.getRange(rowNum, 9).setValue(newRole); // Role
        sheet.getRange(rowNum, 10).setValue(newStatus); // Status
        
        return { success: true, message: 'ปรับปรุงข้อมูลผู้ใช้งานระบบสำเร็จ' };
      }
    }
    return { success: false, message: 'ไม่พบบัญชีผู้ใช้ที่กำหนด' };
  } catch (error) {
    return { success: false, message: 'ข้อผิดพลาด: ' + error.toString() };
  }
}

// ----------------------------------------
// 3. จัดการบันทึกสถิติข้อมูลหนี้สินกำลังพล (Records)
// ----------------------------------------

function getAllData() {
  try {
    const sheet = getSheetByName('Records');
    if (sheet.getLastRow() <= 1) return [];
    
    const data = sheet.getDataRange().getValues();
    const records = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      records.push({
        id: row[0],
        userId: row[1],
        department: row[2],
        rank: row[3],
        firstName: row[4],
        lastName: row[5],
        salaryLevel: row[6],
        salaryAmount: Number(row[7]) || 0,
        extraIncome: Number(row[8]) || 0,
        netIncome: Number(row[9]) || 0,
        maritalStatus: row[10],
        maritalStatusOther: row[11],
        spouseOccupation: row[12],
        spouseOccupationOther: row[13],
        spouseSalary: Number(row[14]) || 0,
        additionalIncomes: JSON.parse(row[15] || '[]'),
        creditCards: JSON.parse(row[16] || '[]'),
        vehicles: JSON.parse(row[17] || '[]'),
        dependents: JSON.parse(row[18] || '[]'),
        residenceLocation: row[19],
        district: row[20],
        province: row[21],
        residenceStatus: row[22],
        residenceType: row[23],
        debts: JSON.parse(row[24] || '[]'),
        createdAt: row[25],
        updatedAt: row[26]
      });
    }
    return records;
  } catch (error) {
    return [];
  }
}

function saveUserData(record) {
  try {
    const sheet = getSheetByName('Records');
    const data = sheet.getDataRange().getValues();
    const isEdit = record.id ? true : false;
    
    const id = isEdit ? record.id : 'rec-' + Math.random().toString(36).substr(2, 9);
    const createdAt = isEdit ? record.createdAt : new Date().toISOString();
    const updatedAt = new Date().toISOString();
    
    const rowValues = [
      id,
      record.userId,
      record.department,
      record.rank,
      record.firstName,
      record.lastName,
      record.salaryLevel,
      record.salaryAmount,
      record.extraIncome,
      record.netIncome,
      record.maritalStatus,
      record.maritalStatusOther || '',
      record.spouseOccupation,
      record.spouseOccupationOther || '',
      record.spouseSalary,
      JSON.stringify(record.additionalIncomes || []),
      JSON.stringify(record.creditCards || []),
      JSON.stringify(record.vehicles || []),
      JSON.stringify(record.dependents || []),
      record.residenceLocation,
      record.district,
      record.province,
      record.residenceStatus,
      record.residenceType,
      JSON.stringify(record.debts || []),
      createdAt,
      updatedAt
    ];
    
    if (isEdit) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][0].toString() === id.toString()) {
          const rowLine = i + 1;
          sheet.getRange(rowLine, 1, 1, rowValues.length).setValues([rowValues]);
          return { success: true, message: 'ปรับปรุงบันทึกข้อมูลกำลังพลเรียบร้อยแล้ว' };
        }
      }
    }
    
    sheet.appendRow(rowValues);
    return { success: true, message: 'ลงทะเบียนหนี้สินกำลังพลใหม่สำเร็จเสร็จสิ้น' };
  } catch (error) {
    return { success: false, message: 'เกิดปัญหาขณะบันทึกฐานข้อมูลชีต: ' + error.toString() };
  }
}

function deleteUserData(id) {
  try {
    const sheet = getSheetByName('Records');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === id.toString()) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'ลบประวัติหนี้สินสำเร็จสมบูรณ์' };
      }
    }
    return { success: false, message: 'ไม่พบประวัติเป้าหมาย' };
  } catch (error) {
    return { success: false, message: 'ลบไม่สำเร็จ: ' + error.toString() };
  }
}
`;

  return (
    <div className="w-full max-w-5xl space-y-8 animate-fade-in" id="gas-guide-panel">
      {/* Overview Head */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-4 translate-x-4">
          <Layers size={180} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="bg-blue-500/30 text-blue-200 text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 mb-4 border border-blue-400/20">
            <RefreshCw size={12} className="animate-spin-slow" /> Google Apps Script Developer Center
          </div>
          <h1 className="text-2xl sm:text-3.5xl font-extrabold tracking-tight">คู่มือเชื่อมต่อฐานข้อมูล Google Sheets</h1>
          <p className="text-blue-100/90 mt-3 text-sm sm:text-base leading-relaxed font-normal">
            ระบบทำงานด้วยสถาปัตยกรรมแบบ Full-stack และสามารถจำลองการทำงานทั้งหมดได้ 100% ในแซนด์บ็อกซ์นี้
            หากต้องการเปลี่ยนไปใช้ <strong className="font-semibold text-white">Google Sheets จริงเป็นฐานข้อมูล</strong> และใช้ <strong className="font-semibold text-white">Apps Script</strong> เป็นเว็บโฮสติ้งหลัก 
            โปรดทำตามคำแนะนำด้านล่าง
          </p>
        </div>
      </div>

      {/* Grid Layout Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Step-by-step instructions (left side 5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-full">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">
              <Database size={20} className="text-blue-600" />
              ขั้นตอนการติดตั้งระบบ
            </h2>
            
            <div className="space-y-4 text-sm flex-grow">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                <div>
                  <h4 className="font-bold text-slate-800">สร้างไฟล์ Google Sheets</h4>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                    สร้างสเปรดชีตเปล่าใหม่ใน Google Drive คัดลอก ID ของชีต (ที่อยู่หลัง <code className="bg-slate-100 px-1 py-0.5 rounded text-red-500 font-mono text-[10px]">/d/</code> ใน URL)
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                <div>
                  <h4 className="font-bold text-slate-800">สร้างโครงสร้างคอลัมน์</h4>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                    สร้างหน้าชื่อ <strong className="text-slate-700 font-medium">"Users"</strong> และ <strong className="text-slate-700 font-medium">"Records"</strong> และกำหนดแถวที่ 1 (Header) ตามโค้ดคอลัมน์สีเขียวด้านขวา
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</div>
                <div>
                  <h4 className="font-bold text-slate-800">เปิด Apps Script Editor</h4>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                    ใน Google Sheets คลิกที่ปุ่ม <strong className="text-slate-700 font-medium">ส่วนขยาย &gt; Apps Script</strong> เพื่อเปิดหน้าเขียนหน้าต่างรหัสของทาง Google
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">4</div>
                <div>
                  <h4 className="font-bold text-slate-800">วางรหัส Code.gs</h4>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                    คัดลอกรหัส <strong className="text-blue-600">Code.gs</strong> ทางด้านล่างไปใส่ และเปลี่ยน <strong className="text-slate-800">SHEET_ID</strong> เป็นไอดีสเปรดชีตของคุณเอง
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">5</div>
                <div>
                  <h4 className="font-bold text-slate-800">สร้างไฟล์ Index.html</h4>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                    กดปุ่ม <strong className="text-slate-700">+</strong> ด้านซ้ายบนของ Apps Script เลือก <strong className="text-slate-700">HTML</strong> ตั้งชื่อว่า <strong className="text-slate-700">Index</strong> คัดลอกโค้ดเว็บของเราไปวางแทนที่ทั้งหมด
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">6</div>
                <div>
                  <h4 className="font-bold text-slate-800">สั่งให้บริการเว็บแอป (Deploy)</h4>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                    กด <strong className="text-slate-700 font-semibold">การทำให้ใช้งานได้ใหม่ (New deployment)</strong> เลือกประเภทเป็น <strong className="text-slate-700 font-semibold">เว็บแอป (Web App)</strong> ตั้งค่าให้ "ทุกคน" (Anyone) เข้าถึงได้ แล้วกดติดตั้งเพื่อรับลิงก์ระบบใช้งานจริงในทันที!
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 bg-blue-50/50 p-4 rounded-xl border border-blue-100/70">
              <span className="text-xs font-bold text-blue-800 uppercase block mb-1">ความเห็นผู้ช่วยนักพฒนา:</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                การแปลงเป็น Apps Script จะจัดเก็บอาเรย์โครงสร้างซับซ้อน เช่น รายการหนี้หลายรายการ (Debts) หรือ บัตรเครดิต ในรูปแบบสตริงแบบ JSON เพื่อป้องกันไม่ให้ข้อมูลแตกในตารางสเปรดชีต และตัวโค้ด Code.gs ด้านขวานี้ได้ออกแบบมาเพื่อแปลงข้อมูลกลับขึ้นมาเป็นวัตถุใน React อัตโนมัติ!
              </p>
            </div>
          </div>
        </div>

        {/* Templates copy area (right side 7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section A: Google Sheets Columns Structure */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200/80 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Database size={18} className="text-slate-600" />
                <span className="font-bold text-slate-800 text-sm">โครงสร้างหัวข้อคอลัมน์สเปรดชีต</span>
              </div>
              <button
                onClick={() => handleCopy(sheetStructureCode, 'structure')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors text-xs font-semibold"
              >
                {copiedSection === 'structure' ? (
                  <>
                    <Check size={14} className="text-green-600 animate-scale-up" />
                    <span className="text-green-600">คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>คัดลอกโครงสร้าง</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-4">
              <pre className="text-slate-600 font-mono text-xs overflow-x-auto bg-slate-50 p-4 rounded-xl max-h-[220px] custom-scrollbar leading-relaxed">
                {sheetStructureCode.trim()}
              </pre>
            </div>
          </div>

          {/* Section B: Apps Script Code.gs code block */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200/80 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileCode size={18} className="text-slate-600" />
                <span className="font-bold text-slate-800 text-sm">ซอร์สโค้ดของหลังบ้าน Google Apps Script (Code.gs)</span>
              </div>
              <button
                onClick={() => handleCopy(appsScriptCode, 'codegs')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors text-xs font-semibold"
              >
                {copiedSection === 'codegs' ? (
                  <>
                    <Check size={14} className="text-green-600" />
                    <span className="text-green-600">คัดลอกรหัสแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>คัดลอกรหัส</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-4">
              <pre className="text-slate-600 font-mono text-xs overflow-x-auto bg-slate-900 text-slate-200 p-4 rounded-xl max-h-[350px] custom-scrollbar leading-relaxed">
                {appsScriptCode.trim()}
              </pre>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
