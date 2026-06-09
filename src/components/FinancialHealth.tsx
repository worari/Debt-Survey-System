/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Record } from '../types';
import { ShieldCheck, AlertTriangle, AlertOctagon, Sparkles, TrendingUp, CheckCircle2, ChevronRight, Activity } from 'lucide-react';

interface Props {
  record: Record;
  onNavigateBack: () => void;
}

export default function FinancialHealth({ record, onNavigateBack }: Props) {
  // Calculations
  const salary = Number(record.salaryAmount || 0);
  const extraIncome = Number(record.extraIncome || 0);
  
  // Calculate total additional incomes from side hustles
  const sideIncomeTotal = record.additionalIncomes 
    ? record.additionalIncomes.reduce((sum, item) => sum + Number(item.amount || 0), 0) 
    : 0;

  const grossIncome = salary + extraIncome + sideIncomeTotal;

  // Monthly debt liabilities
  const monthlyDebtRepay = record.debts
    ? record.debts.reduce((sum, debt) => sum + Number(debt.monthlyPayment || 0), 0)
    : 0;

  // Plus vehicle installments if still active (ผ่อน)
  const vehicleInstallments = record.vehicles
    ? record.vehicles
        .filter(v => v.paymentStatus === 'ผ่อน')
        .reduce((sum, v) => sum + Number(v.installmentAmount || 0), 0)
    : 0;

  const totalMonthlyCommitment = monthlyDebtRepay + vehicleInstallments;

  // Total Outstanding Debt amount
  const totalOutstandingDebt = record.debts
    ? record.debts.reduce((sum, debt) => sum + Number(debt.totalAmount || 0), 0)
    : 0;

  // Net monthly cash flow remaining
  const estimatedDisposableIncome = grossIncome - totalMonthlyCommitment;

  // Debt-to-Income / Debt Service Ratio (DTI)
  const dtiRatio = grossIncome > 0 ? (totalMonthlyCommitment / grossIncome) * 100 : 0;

  // Detect Out-of-system debts (นอกระบบ)
  const hasOutofSystemDebt = record.debts
    ? record.debts.some(d => d.paymentMethod === 'นอกระบบ')
    : false;

  // Diagnostic parameters based on Thai military and public service finance rules:
  // - High Risk: DTI over 70% OR having out-of-system debt.
  // - Warning: DTI between 50% and 70%.
  // - Healthy: DTI under 50% with zero out-of-system debt.
  let status: 'HEALTHY' | 'WARNING' | 'DANGER' = 'HEALTHY';
  let message = '';
  let ratingColor = '';
  let ratingBg = '';

  if (dtiRatio >= 70 || hasOutofSystemDebt) {
    status = 'DANGER';
    message = 'สุขภาพทางการเงินมีระดับความเสี่ยงสูงมาก (วิกฤติหนี้)';
    ratingColor = 'text-red-600 border-red-200 bg-red-50';
    ratingBg = 'bg-red-600';
  } else if (dtiRatio >= 50 && dtiRatio < 70) {
    status = 'WARNING';
    message = 'สุขภาพทางการเงินอยู่ในภาวะตึงตัว (ควรเฝ้าระวัง)';
    ratingColor = 'text-amber-600 border-amber-200 bg-amber-50';
    ratingBg = 'bg-amber-500';
  } else {
    status = 'HEALTHY';
    message = 'สุขภาพทางการเงินแข็งแรงดีเยี่ยม (มีวินัยทางการเงิน)';
    ratingColor = 'text-emerald-600 border-emerald-200 bg-emerald-50';
    ratingBg = 'bg-emerald-600';
  }

  return (
    <div className="w-full max-w-4xl space-y-6 animate-fade-in" id="financial-analysis-panel">
      {/* Upper Navigation Header */}
      <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2.5">
          <Activity className="text-blue-600" size={24} />
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">วิเคราะห์สุขภาพการเงินและแนวทางช่วยเหลือ</h2>
            <p className="text-slate-500 text-xs">วิเคราะห์หนี้สินสำหรับ: {record.rank} {record.firstName} {record.lastName}</p>
          </div>
        </div>
        <button 
          onClick={onNavigateBack} 
          className="text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
        >
          กลับหน้าหลัก
        </button>
      </div>

      {/* Main Analysis card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Gauge Score (col 1) */}
        <div className={`p-6 rounded-2xl border flex flex-col justify-between shadow-sm ${ratingColor}`}>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block opacity-75">ดัชนีสุขภาพการเงินการคลัง</span>
            <h3 className="text-2xl font-black mt-2 leading-tight">{message}</h3>
          </div>

          <div className="my-8 flex items-center justify-center relative">
            {/* Visual Circular Meter */}
            <div className="w-32 h-32 rounded-full border-8 border-slate-100 flex flex-col items-center justify-center relative overflow-hidden bg-white shadow-inner">
              <span className="text-3xl font-black text-slate-800 tracking-tight font-mono">{dtiRatio.toFixed(0)}%</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">DTI Ratio</span>
              {/* Colored progress arc wrapper */}
              <div className={`absolute bottom-0 w-full h-2 ${ratingBg}`} />
            </div>
            {/* Warning floating badge */}
            {status === 'DANGER' && (
              <div className="absolute top-0 right-0 animate-bounce bg-red-600 text-white p-2 rounded-full shadow-lg">
                <AlertOctagon size={18} />
              </div>
            )}
            {status === 'WARNING' && (
              <div className="absolute top-0 right-0 bg-amber-500 text-white p-2 rounded-full shadow-lg">
                <AlertTriangle size={18} />
              </div>
            )}
            {status === 'HEALTHY' && (
              <div className="absolute top-0 right-0 bg-emerald-600 text-white p-2 rounded-full shadow-lg">
                <ShieldCheck size={18} />
              </div>
            )}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            * สัดส่วนภาระหนี้สินต่อรายได้รวม (Debt-Service Coverage Ratio) เกณฑ์ควบคุมสูงสุดของกองทัพไม่ควรเกิน 
            <strong className="text-slate-800 font-semibold"> 70% </strong> เพื่อให้เหลือกำลังทรัพย์ดำรงชีพมากกว่า 30% ของเงินเดือน
          </p>
        </div>

        {/* Breakdown Stats (col 2-3) */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-slate-800 text-base border-b pb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-600 animate-pulse" />
            ตรรกะประมวลผลกระแสเงินหมุนเวียนรายเดือน
          </h3>
          
          <div className="grid grid-cols-2 gap-4 my-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-400 font-bold block">รายรับรวมต่อเดือน</span>
              <span className="text-xl font-bold font-mono text-slate-800 mt-1 block">{grossIncome.toLocaleString()} บาท</span>
              <div className="text-[10px] text-slate-500 mt-1">
                เงินเดือนปกติ {salary.toLocaleString()} + อาชีพเสริม {sideIncomeTotal.toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-400 font-bold block">รายจ่ายส่งหนี้รวมต่อเดือน</span>
              <span className="text-xl font-bold font-mono text-red-600 mt-1 block">-{totalMonthlyCommitment.toLocaleString()} บาท</span>
              <div className="text-[10px] text-slate-500 mt-1">
                รายจ่ายหนี้ปกติ {monthlyDebtRepay.toLocaleString()} + ค่าผ่อนรถ {vehicleInstallments.toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-400 font-bold block">สภาพคล่องคงเหลือสุทธิ</span>
              <span className={`text-xl font-bold font-mono mt-1 block ${estimatedDisposableIncome > 0 ? 'text-emerald-600' : 'text-red-600 font-black'}`}>
                {estimatedDisposableIncome.toLocaleString()} บาท
              </span>
              <div className="text-[10px] text-slate-500 mt-1">
                เหลือกำลังทรัพย์ประมาณ {(grossIncome > 0 ? (estimatedDisposableIncome / grossIncome) * 100 : 0).toFixed(0)}% ของรายรับ
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-400 font-bold block">ยอดหนี้สะสมคงเหลือค้างชำระ</span>
              <span className="text-xl font-bold font-mono text-indigo-700 mt-1 block">
                {totalOutstandingDebt.toLocaleString()} บาท
              </span>
              <div className="text-[10px] text-slate-500 mt-1">
                มูลค่ายอดต้นคงค้างจาก {record.debts ? record.debts.length : 0} สถาบันการเงิน
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800 flex items-start gap-2">
            <Sparkles size={16} className="shrink-0 mt-0.5" />
            <span>
              <strong>สรุปคำแนะนำทางการคลัง:</strong> ค่าเดินทางเพื่อมาปฏิบัติงาน {record.vehicles && record.vehicles.some(v => v.usedForWork) ? 'มีความจำเป็น (มียานพาหนะใช้เดินทาง)' : 'ไม่มีภาระค่าน้ำมันผ่อนผันพิเศษ'} และ อาชีพคู่สมรส {record.spouseOccupation ? `${record.spouseOccupation} (รายได้ ${record.spouseSalary.toLocaleString()} บาท/เดือน)` : 'ไม่มีหรือไม่มีรายรับ'} ช่วยพยุงสภาพคล่องในภาพรวม
            </span>
          </div>
        </div>
      </div>

      {/* Action Plan Help guidelines */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
          <ShieldCheck size={22} className="text-emerald-600" />
          แนวทางการช่วยเหลือและจัดระดับการผ่อนปรน โดยหน่วยสิทธิกำลังพล พล.ทบ.
        </h3>
        
        <p className="text-sm text-slate-600 leading-relaxed font-normal">
          จากการประมวลผลภาระข้อมูลทางการเงิน ทางหน่วยงาน สปบ.กพ.ทบ. เสนอแนะมาตรการจัดการทางการเงินให้สอดคล้องกับคุณลักษณะกำลังพล ดังนี้:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Action item 1 */}
          <div className="p-4 rounded-xl border border-slate-150 hover:border-blue-300 hover:bg-slate-50/40 transition-all flex gap-3">
            <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg h-fit shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">การเจรจาลดอัตราดอกเบี้ยและปรับปรุงโครงสร้าง</h4>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                โครงการสินเชื่อสวัสดิการ สหกรณ์ออมทรัพย์ ทบ. มีโครงการปรับปรุงโครงสร้างหนี้ พยุงอัตราดอกเบี้ยร้อยละพิเศษสำหรับข้าราชการกลุ่มเสี่ยง (DTI สูงกว่า 70%) สามารถติดต่อร้องขอรับการเจรจาร่วมชูนโยบายการรวมหนี้ได้
              </p>
            </div>
          </div>

          {/* Action item 2 */}
          <div className="p-4 rounded-xl border border-slate-150 hover:border-blue-300 hover:bg-slate-50/40 transition-all flex gap-3">
            <div className="bg-amber-50 text-amber-600 p-2.5 rounded-lg h-fit shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">การย้ายวงหนี้นอกระบบเข้ามาในระบบทหาร</h4>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                {hasOutofSystemDebt ? (
                  <strong className="text-red-500">ตรวจพบว่ากำลังพลมีรายการหนี้นอกระบบ!</strong>
                ) : (
                  <span>ไม่พบหนี้นอกระบบในระบบการกรอก</span>
                )}{' '}
                ควรลงทะเบียนเข้าแก้ไขหนี้นอกระบบผ่านกลไกสวัสดิการกองทัพบกโดยด่วน เพื่อเปลี่ยนอัตราดอกเบี้ยมหาโหดให้เป็นวงเงินกู้สินเชื่อรายได้พิเศษสวัสดิการที่เหมาะสมและถูกต้องตามกฎหมาย
              </p>
            </div>
          </div>

          {/* Action item 3 */}
          <div className="p-4 rounded-xl border border-slate-150 hover:border-blue-300 hover:bg-slate-50/40 transition-all flex gap-3">
            <div className="bg-purple-50 text-purple-600 p-2.5 rounded-lg h-fit shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">มาตรการลดค่าน้ำนม/ค่าใช้จ่ายด้านอุปการะ</h4>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                กำลังพลมีผู้อยู่ในความดูแลอุปการะ {record.dependents ? record.dependents.length : 0} ท่าน สามารถเบิกสิทธิค่าเล่าเรียนบุตร และเงินสวัสดิการช่วยเหลือครอบครัวกำลังพลที่จัดทำขึ้นส่วนพิเศษได้ที่แผนกสิทธิกำลังพลและครอบครัว
              </p>
            </div>
          </div>

          {/* Action item 4 */}
          <div className="p-4 rounded-xl border border-slate-150 hover:border-blue-300 hover:bg-slate-50/40 transition-all flex gap-3">
            <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg h-fit shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">การหาช่องทางเสริมสร้างรายรับพิเศษเสริม</h4>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                หารายได้สำรองนอกระบบเวลาราชการด้วยความโปร่งใสและไม่กระทบภารกิจหลัก ตัวอย่างอาชีพเสริมที่ลงบันทึกในระบบ: {sideIncomeTotal > 0 ? record.additionalIncomes.map(a => a.source).join(', ') : 'ยังไม่ได้กรอก / ทำงานหลักอย่างเดียว'} สามารถยกระดับเพื่อประทังความขัดสนได้
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
          <span>สถิตินี้ประมวลผลโดยฐานราก AI และเกณฑ์กระทรวงกลาโหม 2026</span>
          <button 
            type="button" 
            onClick={onNavigateBack} 
            className="flex items-center gap-1.5 hover:text-blue-600 font-bold text-slate-700"
          >
            ย้อนไปหน้ารายงาน <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
