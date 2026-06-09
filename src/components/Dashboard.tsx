/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { User, Record } from '../types';
import * as XLSX from 'xlsx';
import { Download, PlusCircle, Search, Filter, Trash2, Edit3, HeartPulse, RefreshCw, FolderSearch, TrendingDown, LayoutGrid, CheckCircle, ShieldAlert } from 'lucide-react';

interface Props {
  user: User;
  records: Record[];
  onNavigate: (view: string) => void;
  onEdit: (record: Record) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onAnalyze: (record: Record) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
  loading: boolean;
  onRefresh: () => void;
}

export default function Dashboard({ 
  user, records, onNavigate, onEdit, onDelete, onCreate, onAnalyze, showToast, loading, onRefresh 
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debtsFilter, setDebtsFilter] = useState<'all' | 'high' | 'outofsystem' | 'clean'>('all');

  // Multi-tier user authorization checks:
  // - Admin & HR see all personnel forms.
  // - Regular USER only sees their own declarations.
  const authorizedRecords = (user.role === 'ADMIN' || user.role === 'HR') 
    ? records 
    : records.filter(r => r.userId === user.id || r.firstName === user.firstName); // fallback mapping

  // Statistics compiling
  const totalOutstandingCount = authorizedRecords.length;
  
  const totalSystemDebt = authorizedRecords.reduce((sum, r) => {
    if (!r.debts) return sum;
    return sum + r.debts.reduce((s, d) => s + Number(d.totalAmount || 0), 0);
  }, 0);

  const averageDebt = totalOutstandingCount > 0 ? totalSystemDebt / totalOutstandingCount : 0;

  // Counter for danger levels (DTI >= 70% or having out of system debts)
  const highRiskCount = authorizedRecords.filter(r => {
    const gross = Number(r.salaryAmount || 0) + Number(r.extraIncome || 0) + 
      (r.additionalIncomes ? r.additionalIncomes.reduce((s, i) => s + Number(i.amount || 0), 0) : 0);
    const outflow = (r.debts ? r.debts.reduce((s, d) => s + Number(d.monthlyPayment || 0), 0) : 0) + 
      (r.vehicles ? r.vehicles.filter(v => v.paymentStatus === 'ผ่อน').reduce((s, v) => s + Number(v.installmentAmount || 0), 0) : 0);
    const dti = gross > 0 ? (outflow / gross) * 100 : 0;
    const hasOutofSystem = r.debts ? r.debts.some(d => d.paymentMethod === 'นอกระบบ') : false;
    return dti >= 70 || hasOutofSystem;
  }).length;

  const outOfSystemDebtCount = authorizedRecords.filter(r => 
    r.debts ? r.debts.some(d => d.paymentMethod === 'นอกระบบ') : false
  ).length;

  // Exporter to Excel file formats via xlsx library
  const handleExportExcel = () => {
    if (authorizedRecords.length === 0) {
      return showToast('ไม่มีข้อมูลสำหรับส่งออกเอกสาร Excel ในขณะนี้', 'warning');
    }
    
    showToast('กำลังประมวลผลจัดเตรียมสเปรดชีต Excel...', 'success');

    const flattenedData = authorizedRecords.map((r, i) => {
      const overallDebt = r.debts ? r.debts.reduce((s, d) => s + Number(d.totalAmount || 0), 0) : 0;
      const overallMonthlyPay = r.debts ? r.debts.reduce((s, d) => s + Number(d.monthlyPayment || 0), 0) : 0;
      const outOfSysSum = r.debts ? r.debts.filter(d => d.paymentMethod === 'นอกระบบ').reduce((s, d) => s + Number(d.totalAmount || 0), 0) : 0;

      return {
        'ลำดับ': i + 1,
        'ยศ': r.rank,
        'ชื่อ': r.firstName,
        'นามสกุล': r.lastName,
        'แผนกรองสังกัด': r.department,
        'ชั้นอัตราเงินเดือน': r.salaryLevel || '-',
        'ยอดฐานเงินเดือน (บาท)': r.salaryAmount,
        'เงินรับสุทธิ (บาท)': r.netIncome,
        'ยอดหนี้สินสะสม (บาท)': overallDebt,
        'ยอดชำระส่งคืน/เดือน (บาท)': overallMonthlyPay,
        'ในจำนวนนี้เป็นหนี้นอกระบบ (บาท)': outOfSysSum,
        'สถานภาพครัวเรือน': r.maritalStatus + (r.maritalStatusOther ? ` (${r.maritalStatusOther})` : ''),
        'ที่อยู่ปัจจุบัน': r.residenceLocation,
        'จังหวัด': r.province
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'สถิติหนี้สินกำลังพล');
    
    // Auto fit column widths for beauty
    const maxKeys = Object.keys(flattenedData[0]);
    worksheet['!cols'] = maxKeys.map(k => ({ wch: Math.max(k.length * 2 + 5, 12) }));

    XLSX.writeFile(workbook, 'สถิติรายงานหนี้สินกำลังพล_สปบ_กพ_ทบ.xlsx');
  };

  // Filtration logic
  const filteredRecords = authorizedRecords.filter(r => {
    // Search text matching
    const fullName = `${r.rank} ${r.firstName} ${r.lastName} ${r.department} ${r.id}`.toLowerCase();
    const searchMatches = fullName.includes(searchTerm.toLowerCase());

    if (!searchMatches) return false;

    // Debt status matching
    const overallDebt = r.debts ? r.debts.reduce((s, d) => s + Number(d.totalAmount || 0), 0) : 0;
    const hasOutofSys = r.debts ? r.debts.some(d => d.paymentMethod === 'นอกระบบ') : false;

    if (debtsFilter === 'clean') {
      return overallDebt === 0;
    }
    if (debtsFilter === 'outofsystem') {
      return hasOutofSys;
    }
    if (debtsFilter === 'high') {
      // Calculate DTI
      const gross = Number(r.salaryAmount || 0) + Number(r.extraIncome || 0) + 
        (r.additionalIncomes ? r.additionalIncomes.reduce((s, i) => s + Number(i.amount || 0), 0) : 0);
      const outflow = (r.debts ? r.debts.reduce((s, _d) => s + Number(_d.monthlyPayment || 0), 0) : 0) + 
        (r.vehicles ? r.vehicles.filter(v => v.paymentStatus === 'ผ่อน').reduce((s, v) => s + Number(v.installmentAmount || 0), 0) : 0);
      const dti = gross > 0 ? (outflow / gross) * 100 : 0;
      return dti >= 70;
    }

    return true;
  });

  return (
    <div className="w-full max-w-5xl space-y-6 animate-fade-in" id="dashboard-analytical-views">
      {/* Upper header section */}
      <div className="bg-white p-5 sm:p-6.5 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-5.5 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <LayoutGrid className="text-blue-900" size={24} />
            สารสนเทศจัดลำดับเครดิตหนี้สินกำลังพล
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            หน่วยงานควบคุม: <strong className="text-slate-700">สปบ.กพ.ทบ.</strong> | สิทธิ์เข้าถึงของคุณ: <span className="bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-extrabold uppercase rounded border font-mono">{user.role}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto self-stretch md:self-auto justify-end">
          <button 
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-4.5 py-2.5 border border-slate-200 hover:bg-slate-50 bg-white font-bold rounded-xl text-slate-700 text-xs shadow-sm transition-all"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>ซิงก์ข้อมูล</span>
          </button>
          
          {(user.role === 'ADMIN' || user.role === 'HR') && (
            <button 
              onClick={handleExportExcel}
              className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Download size={14} />
              <span>ส่งออกรายงาน Excel (XLSX)</span>
            </button>
          )}

          <button 
            onClick={onCreate}
            className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl text-xs shadow-lg transition-all flex items-center gap-1.5"
          >
            <PlusCircle size={14} />
            <span>ยื่นแบบสำรวจหนี้สินกองทัพ</span>
          </button>
        </div>
      </div>

      {/* Numerical Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric A: Total members registered */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:border-blue-300 transition-all">
          <span className="text-[10px] text-slate-400 font-black tracking-wider uppercase block">จำนวนทำแบบสำรวจรวม</span>
          <span className="text-2.5xl font-black font-mono mt-1 text-slate-800 block">{totalOutstandingCount.toLocaleString()} <span className="text-xs font-bold font-sans text-slate-500">นาย</span></span>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <CheckCircle size={12} className="text-emerald-500" />
            <span>รับรู้ข้อมูลประชากรสมบูรณ์</span>
          </div>
        </div>

        {/* Metric B: Total System Debt */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:border-blue-300 transition-all">
          <span className="text-[10px] text-slate-400 font-black tracking-wider uppercase block">มูลค่าภาระหนี้สินสะสมรวม</span>
          <span className="text-2.5xl font-black font-mono mt-1 text-indigo-900 block">{totalSystemDebt.toLocaleString()} <span className="text-xs font-bold font-sans text-slate-500">บาท</span></span>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <TrendingDown size={12} className="text-indigo-500" />
            <span>ยอดชำระเฉลี่ยลบต้นปีนี้</span>
          </div>
        </div>

        {/* Metric C: Out of system crisis index */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:border-red-300 transition-all">
          <span className="text-[10px] text-red-500 font-black tracking-wider uppercase block">จำนวนผู้มีหนี้นอกระบบ (วิกฤติ)</span>
          <span className={`text-2.5xl font-black font-mono mt-1 block ${outOfSystemDebtCount > 0 ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
            {outOfSystemDebtCount} <span className="text-xs font-bold font-sans text-slate-500 font-normal">กรณี</span>
          </span>
          <div className="text-[10px] mt-2 flex items-center gap-1 text-red-550">
            <ShieldAlert size={12} className={outOfSystemDebtCount > 0 ? 'text-red-500' : 'text-slate-350'} />
            <span className={outOfSystemDebtCount > 0 ? 'text-red-600 font-bold' : 'text-slate-400'}>
              {outOfSystemDebtCount > 0 ? 'ต้องเข้าโครงการพยุงประนอมหนี้ทันที' : 'ไม่มีภัยหนี้สินเร่งด่วน'}
            </span>
          </div>
        </div>

        {/* Metric D: High debt DTI ratio officers */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:border-amber-300 transition-all">
          <span className="text-[10px] text-slate-400 font-black tracking-wider uppercase block">กำลังพลภาระหนี้เกิน 70% (DTI)</span>
          <span className="text-2.5xl font-black font-mono mt-1 text-amber-600 block">{highRiskCount} <span className="text-xs font-bold font-sans text-slate-500">ราย</span></span>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>เฉลี่ย {totalOutstandingCount > 0 ? ((highRiskCount / totalOutstandingCount) * 100).toFixed(0) : 0}% ของกำลังพล</span>
          </div>
        </div>
      </div>

      {/* Controls & Table Block */}
      <div className="bg-white border border-slate-200 rounded-2.5xl shadow-sm overflow-hidden">
        {/* Row Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-150 bg-slate-50/70 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          
          {/* Custom Search Column */}
          <div className="bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 shadow-inner w-full md:max-w-md text-sm">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder="ค้นหาตามชื่อยศทหาร, นามสกุล หรือสังกัดกองร้อย..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full text-xs outline-none bg-transparent placeholder-slate-400 font-sans"
            />
          </div>

          {/* Buttons selection filters */}
          <div className="flex flex-wrap gap-2 text-xs">
            <button 
              onClick={() => setDebtsFilter('all')}
              className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                debtsFilter === 'all' 
                  ? 'bg-slate-800 text-white border-slate-800' 
                  : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
              }`}
            >
              กำลังพลทั้งหมด
            </button>
            <button 
              onClick={() => setDebtsFilter('high')}
              className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                debtsFilter === 'high' 
                  ? 'bg-amber-600 text-white border-amber-600' 
                  : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
              }`}
            >
              หนี้ระดับวิกฤติ (DTI &ge; 70%)
            </button>
            <button 
              onClick={() => setDebtsFilter('outofsystem')}
              className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                debtsFilter === 'outofsystem' 
                  ? 'bg-red-600 text-white border-red-600' 
                  : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
              }`}
            >
              พบหนี้นอกระบบ
            </button>
            <button 
              onClick={() => setDebtsFilter('clean')}
              className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                debtsFilter === 'clean' 
                  ? 'bg-emerald-600 text-white border-emerald-600' 
                  : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
              }`}
            >
              ไม่มีประวัติหนี้สินหลัก
            </button>
          </div>
        </div>

        {/* Main List Table */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-extrabold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="p-4.5 pl-6">ยศ ชื่อ-นามสกุลกำลังพล</th>
                <th className="p-4.5">ระดับกองสังกัด</th>
                <th className="p-4.5 text-right">รายรับรวม (บาท)</th>
                <th className="p-4.5 text-right">ภาระหนี้รวมต้น (บาท)</th>
                <th className="p-4.5 text-right">ชำระเดือนนี้ (บาท)</th>
                <th className="p-4.5 text-center">สัดส่วน DTI</th>
                <th className="p-4.5 text-center pr-6">การประเมินการช่วยเหลือ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center text-slate-400">
                    <RefreshCw className="animate-spin mx-auto mb-3 text-slate-350" size={36} />
                    <span>กำลังโหลดรายงานประวัติหนี้สินกำลังพล...</span>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center text-slate-400 font-medium">
                    <FolderSearch size={40} className="mx-auto text-slate-300 mb-3" />
                    <span>ไม่พบใบรายงานชำระหนี้สินกองร้อยที่สอดรับเงื่อนไขนี้มุ่งเน้น ณ ขณะนี้</span>
                  </td>
                </tr>
              ) : (
                filteredRecords.map(r => {
                  const gross = Number(r.salaryAmount || 0) + Number(r.extraIncome || 0) + 
                    (r.additionalIncomes ? r.additionalIncomes.reduce((s, i) => s + Number(i.amount || 0), 0) : 0);
                  
                  const outPayments = (r.debts ? r.debts.reduce((s, d) => s + Number(d.monthlyPayment || 0), 0) : 0);
                  const carPayments = (r.vehicles ? r.vehicles.filter(v => v.paymentStatus === 'ผ่อน').reduce((s, d) => s + Number(d.installmentAmount || 0), 0) : 0);
                  const totalOutflows = outPayments + carPayments;

                  const outstandingTotal = r.debts ? r.debts.reduce((s, d) => s + Number(d.totalAmount || 0), 0) : 0;
                  const ratioDti = gross > 0 ? (totalOutflows / gross) * 100 : 0;
                  const sideIncomeCount = r.additionalIncomes ? r.additionalIncomes.length : 0;

                  return (
                    <tr key={r.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="p-4.5 pl-6">
                        <span className="font-extrabold text-slate-800 tracking-tight block">
                          {r.rank}{r.firstName} {r.lastName}
                        </span>
                        {/* Tags */}
                        <span className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-450">
                          ID: <span className="font-mono font-bold bg-slate-100 text-slate-650 px-1 rounded">{r.id}</span>
                          {r.debts && r.debts.some(_d => _d.paymentMethod === 'นอกระบบ') && (
                            <span className="bg-red-50 text-red-650 font-bold px-1.5 py-0.2 rounded border border-red-100">มีนอกระบบ!</span>
                          )}
                        </span>
                      </td>

                      <td className="p-4.5 font-medium text-slate-500">{r.department}</td>
                      
                      <td className="p-4.5 text-right font-mono text-slate-700 font-semibold">{gross.toLocaleString()}</td>
                      
                      <td className="p-4.5 text-right font-mono text-indigo-700 font-extrabold">{outstandingTotal.toLocaleString()}</td>
                      
                      <td className="p-4.5 text-right font-mono text-red-600 font-bold">{totalOutflows.toLocaleString()}</td>
                      
                      <td className="p-4.5 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-mono text-xs font-bold ${
                            ratioDti >= 70 ? 'text-red-600 font-black' : ratioDti >= 50 ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {ratioDti.toFixed(0)}%
                          </span>
                          {/* Nano graphical indicator */}
                          <div className="w-14 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                            <div 
                              className={`h-full ${ratioDti >= 70 ? 'bg-red-600' : ratioDti >= 50 ? 'bg-amber-500' : 'bg-emerald-600'}`} 
                              style={{ width: `${Math.min(ratioDti, 100)}%` }} 
                            />
                          </div>
                        </div>
                      </td>

                      <td className="p-4.5 text-center pr-6 space-x-2 flex items-center justify-center">
                        {/* Analytical Advisor Button */}
                        <button 
                          onClick={() => onAnalyze(r)}
                          className="text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 p-2 text-xs font-bold rounded-lg border border-emerald-150 shadow-sm transition-all flex items-center gap-1"
                          title="วินิจฉัยสุขภาพคลัง"
                        >
                          <HeartPulse size={14} />
                          <span>ตรวจวิเคราะห์</span>
                        </button>

                        <button 
                          onClick={() => onEdit(r)}
                          className="text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-700 p-2 rounded-lg border border-blue-150 transition-all"
                          title="แก้ไขใบประวัติ"
                        >
                          <Edit3 size={14} />
                        </button>
                        
                        {(user.role === 'ADMIN' || user.role === 'HR') && (
                          <button 
                            onClick={() => onDelete(r.id)}
                            className="text-red-600 hover:text-white bg-red-50 hover:bg-red-600 p-2 rounded-lg border border-red-150 transition-all"
                            title="ลบ"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
