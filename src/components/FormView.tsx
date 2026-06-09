/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Record, AdditionalIncome, CreditCard, Vehicle, Dependent, Debt } from '../types';
import { Save, User as UserIcon, Plus, Trash2, Home, CreditCard as CardIcon, Car, Users, ClipboardList, Wallet, Sparkles, HelpCircle } from 'lucide-react';

interface Props {
  user: User;
  initialData: Record | null;
  onSave: (formData: Record) => void;
  onCancel: () => void;
}

const RANKS = [
  'นาย', 'น.ส.', 'นาง', 'ส.ต.', 'ส.ท.', 'ส.อ.', 'จ.ส.ต.', 'จ.ส.ท.', 'จ.ส.อ.', 
  'ร.ต.', 'ร.ท.', 'ร.อ.', 'พ.ต.', 'พ.ท.', 'พ.อ.', 'พ.อ.(พ.)'
];

const SALARY_LEVELS = ['ป.1', 'ป.2', 'ป.3', 'น.1', 'น.2', 'น.3', 'น.4', 'น.5'];

export default function FormView({ user, initialData, onSave, onCancel }: Props) {
  const defaultState: Record = {
    id: '',
    userId: user.id,
    department: user.department || 'แผนกแผน',
    rank: user.rank || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    salaryLevel: '',
    salaryAmount: 0,
    extraIncome: 0,
    netIncome: 0,
    maritalStatus: '',
    maritalStatusOther: '',
    spouseOccupation: '',
    spouseOccupationOther: '',
    spouseSalary: 0,
    additionalIncomes: [] as AdditionalIncome[],
    creditCards: [] as CreditCard[],
    vehicles: [] as Vehicle[],
    dependents: [] as Dependent[],
    residenceLocation: '',
    district: '',
    province: '',
    residenceStatus: '',
    residenceType: '',
    debts: [] as Debt[],
    createdAt: '',
    updatedAt: ''
  };

  const [formData, setFormData] = useState<Record>(initialData || defaultState);
  const [activeTab, setActiveTab] = useState<number>(1);

  // Auto calculate netIncome or other parameters if needed, but allow manual input too
  const totalMonthsPayingDebts = formData.debts 
    ? formData.debts.reduce((sum, d) => sum + Number(d.monthlyPayment || 0), 0) 
    : 0;

  const totalVehiclePayments = formData.vehicles 
    ? formData.vehicles
        .filter(v => v.paymentStatus === 'ผ่อน')
        .reduce((sum, v) => sum + Number(v.installmentAmount || 0), 0) 
    : 0;

  const totalMonthlyOutflow = totalMonthsPayingDebts + totalVehiclePayments;

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: (name === 'salaryAmount' || name === 'extraIncome' || name === 'netIncome' || name === 'spouseSalary') 
        ? Number(value) || 0 
        : value 
    }));
  };

  // Helper inside arrays
  const handleArrayChange = (section: 'additionalIncomes' | 'creditCards' | 'vehicles' | 'dependents' | 'debts', index: number, field: string, value: any) => {
    setFormData(prev => {
      const arr = [...(prev[section] as any[])];
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, [section]: arr };
    });
  };

  const addArrayItem = (section: 'additionalIncomes' | 'creditCards' | 'vehicles' | 'dependents' | 'debts', defaultObj: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...(prev[section] as any[]), defaultObj]
    }));
  };

  const removeArrayItem = (section: 'additionalIncomes' | 'creditCards' | 'vehicles' | 'dependents' | 'debts', index: number) => {
    setFormData(prev => {
      const arr = [...(prev[section] as any[])];
      arr.splice(index, 1);
      return { ...prev, [section]: arr };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Sections definitions for Thai form index
  const FORM_SECTIONS = [
    { num: 1, title: 'ส่วนตัว/รายรับ', icon: <UserIcon size={16} /> },
    { num: 2, title: 'รายได้เสริม', icon: <Wallet size={16} /> },
    { num: 3, title: 'บัตรเครดิต', icon: <CardIcon size={16} /> },
    { num: 4, title: 'ยานพาหนะ', icon: <Car size={16} /> },
    { num: 5, title: 'ผู้อุปการะ', icon: <Users size={16} /> },
    { num: 6, title: 'ที่พักอาศัย', icon: <Home size={16} /> },
    { num: 7, title: 'หนี้สินสะสม', icon: <ClipboardList size={16} /> }
  ];

  return (
    <div className="w-full max-w-5xl bg-white p-5 sm:p-10 rounded-2xl border border-slate-200 shadow-xl" id="personnel-debt-declaration-form">
      {/* Top Banner & back option */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-5 border-b border-slate-200 gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <ClipboardList className="text-blue-900" size={26} />
            {formData.id ? 'แก้ไขบันทึกประวัติกำลังพล' : 'แบบบันทึกสำรวจหนี้สินกองกำลังพล'}
          </h2>
          <p className="text-slate-500 text-xs mt-1">กรอกข้อมูลให้ครบถ้วนเพื่อผลประโยชน์ในการรับจัดสรรสวัสดิการและวิเคราะห์พยุงสิทธิ์คลัง</p>
        </div>
        <button 
          type="button" 
          onClick={onCancel} 
          className="text-slate-500 hover:text-slate-800 font-bold text-sm px-4.5 py-2 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all"
        >
          ยกเลิกและย้อนกลับ
        </button>
      </div>

      {/* Tabs list */}
      <div className="flex overflow-x-auto gap-3.5 pb-2.5 mb-8 no-scrollbar scroll-smooth">
        {FORM_SECTIONS.map(sec => (
          <button
            key={sec.num}
            type="button"
            onClick={() => setActiveTab(sec.num)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold rounded-full shrink-0 border transition-all ${
              activeTab === sec.num 
                ? 'bg-blue-900 text-white border-blue-900 shadow-sm' 
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            {sec.icon}
            <span>{sec.num}. {sec.title}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* --- PART 1: PERSONAL INFORMATION --- */}
        {activeTab === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b-2 border-slate-100 pb-3">
              <h3 className="text-lg font-black text-blue-900 flex items-center gap-2">
                <UserIcon size={18} />
                ส่วนที่ 1: ข้อมูลส่วนบุคคลและรายรับขั้นพื้นฐาน
              </h3>
            </div>

            {/* Demographics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wide">ยศข้าราชการ</label>
                <input 
                  list="ranks-form" 
                  name="rank" 
                  value={formData.rank} 
                  onChange={handleTextChange} 
                  required 
                  placeholder="กรอกยศ เช่น ส.อ. หรือ พ.ต."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400 font-sans" 
                />
                <datalist id="ranks-form">
                  {RANKS.map(r => <option key={r} value={r} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wide">ชื่อจริง</label>
                <input 
                  type="text" 
                  name="firstName" 
                  value={formData.firstName} 
                  onChange={handleTextChange} 
                  required 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wide">นามสกุล</label>
                <input 
                  type="text" 
                  name="lastName" 
                  value={formData.lastName} 
                  onChange={handleTextChange} 
                  required 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
            </div>

            {/* Salary details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wide">ชั้นประเภทเงินเดือน (ระดับ)</label>
                <input 
                  list="salaryLevels-form" 
                  name="salaryLevel" 
                  value={formData.salaryLevel} 
                  onChange={handleTextChange} 
                  required
                  placeholder="ป.1, น.1 เป็นต้น"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                />
                <datalist id="salaryLevels-form">
                  {SALARY_LEVELS.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wide">ยอดเงินเดือนสุทธิ (บาท)</label>
                <input 
                  type="number" 
                  name="salaryAmount" 
                  value={formData.salaryAmount || ''} 
                  onChange={handleTextChange} 
                  required
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono" 
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wide">เงินเพิ่มพิเศษ/พ.ส.ร./อื่นๆ (บาท)</label>
                <input 
                  type="number" 
                  name="extraIncome" 
                  value={formData.extraIncome || ''} 
                  onChange={handleTextChange} 
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono" 
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-green-700 mb-1.5 uppercase tracking-wide">รับคงเหลือสุทธิ (บาท)</label>
                <input 
                  type="number" 
                  name="netIncome" 
                  value={formData.netIncome || ''} 
                  onChange={handleTextChange} 
                  placeholder="คำนวณอัตโนมัติหรือกรอกตรง"
                  className="w-full px-4 py-3 bg-emerald-50 border border-emerald-200 focus:border-emerald-500 text-emerald-800 font-extrabold rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono" 
                />
              </div>
            </div>

            {/* Marital status & Spouse */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-slate-600 tracking-wider uppercase">สถานภาพครอบครัว</h4>
                <div>
                  <select 
                    name="maritalStatus" 
                    value={formData.maritalStatus} 
                    onChange={handleTextChange} 
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">- เลือกสถานภาพครอบครัว -</option>
                    <option value="โสด">โสด</option>
                    <option value="สมรส">สมรส</option>
                    <option value="หย่า">หย่า</option>
                    <option value="หม้าย">หม้าย</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
                {formData.maritalStatus === 'อื่นๆ' && (
                  <input 
                    type="text" 
                    name="maritalStatusOther" 
                    value={formData.maritalStatusOther || ''} 
                    onChange={handleTextChange} 
                    placeholder="ระบุสถานภาพของคุณ" 
                    required
                    className="w-full px-4 py-3 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                )}
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-slate-600 tracking-wider uppercase text-slate-600">อาชีพคู่สมรสและรายได้</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select 
                    name="spouseOccupation" 
                    value={formData.spouseOccupation} 
                    onChange={handleTextChange}
                    disabled={formData.maritalStatus === 'โสด'} 
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:opacity-55"
                  >
                    <option value="">- เลือกอาชีพคู่สมรส -</option>
                    <option value="รับราชการ">รับราชการ</option>
                    <option value="พนักงานบริษัท">พนักงานบริษัท/เอกชน</option>
                    <option value="ค้าขาย">ค้าขาย/ธุรกิจส่วนตัว</option>
                    <option value="รับจ้าง">รับจ้างทั่วไป</option>
                    <option value="ไม่ได้ประกอบอาชีพ">ไม่ได้ประกอบอาชีพ</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>

                  <input 
                    type="number" 
                    name="spouseSalary" 
                    value={formData.spouseSalary || ''} 
                    onChange={handleTextChange} 
                    disabled={formData.maritalStatus === 'โสด' || formData.spouseOccupation === 'ไม่ได้ประกอบอาชีพ'}
                    placeholder="เงินเดือนคู่สมรส (บาท)" 
                    className="w-full px-4 py-3 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:opacity-55 font-mono" 
                  />
                </div>
                
                {formData.spouseOccupation === 'อื่นๆ' && (
                  <input 
                    type="text" 
                    name="spouseOccupationOther" 
                    value={formData.spouseOccupationOther || ''} 
                    onChange={handleTextChange} 
                    placeholder="ระบุชื่ออาชีพเพิ่มเติม" 
                    required
                    className="w-full px-4 py-3 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- PART 2: ADDITIONAL INCOMES --- */}
        {activeTab === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b-2 border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="text-lg font-black text-blue-900 flex items-center gap-2">
                <Wallet size={18} />
                ส่วนที่ 2: รายได้เพิ่มเติม / อาชีพเสริมนอกราชการ
              </h3>
              <span className="bg-blue-50 text-blue-900 font-extrabold text-xs px-3 py-1 rounded-full border border-blue-100">
                {formData.additionalIncomes ? formData.additionalIncomes.length : 0} รายการ
              </span>
            </div>

            <p className="text-xs text-slate-500 -mt-2 leading-relaxed">
              * ระบุรายได้งานนอกจากสัญญาราชการ (เช่น ค้าขายออนไลน์, ขับรถรับจ้าง, งานเขียนโปรแกรม, รับทำอาหารสัปดาห์หยุด) เพื่อช่วยประเมินการฟื้นฟูทางการคลังสถิติสิทธิ์กำลังพล
            </p>

            <div className="space-y-4">
              {formData.additionalIncomes && formData.additionalIncomes.map((item, i) => (
                <div key={i} className="relative bg-slate-50 border border-slate-200 hover:border-blue-205 p-5 rounded-2xl shadow-sm transition-all animate-fade-in">
                  <button 
                    type="button" 
                    onClick={() => removeArrayItem('additionalIncomes', i)} 
                    className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-2.5 rounded-xl border border-transparent hover:border-red-100 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pr-12">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">แหล่งที่มาของรายรับเสริมนอกเวลา</label>
                      <input 
                        type="text" 
                        value={item.source} 
                        onChange={e => handleArrayChange('additionalIncomes', i, 'source', e.target.value)} 
                        placeholder="เช่น ค้าขายออนไลน์ขายน้ำส้ม, ทำเกษตรกรรมบ่อปลา"
                        required
                        className="w-full px-4 py-2.5 border border-slate-200 focus:border-blue-500 bg-white rounded-xl mt-1.5 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">ยอดเงินรายได้เพิ่มเฉลี่ย (บาท/เดือน)</label>
                      <input 
                        type="number" 
                        value={item.amount || ''} 
                        onChange={e => handleArrayChange('additionalIncomes', i, 'amount', Number(e.target.value) || 0)} 
                        placeholder="0"
                        required
                        className="w-full px-4 py-2.5 border border-slate-200 focus:border-blue-500 bg-white rounded-xl mt-1.5 outline-none font-mono" 
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button 
                type="button" 
                onClick={() => addArrayItem('additionalIncomes', { source: '', amount: 0 })} 
                className="w-full border-2 border-dashed border-slate-300 hover:border-blue-500 text-slate-500 hover:text-blue-900 hover:bg-slate-55 flex justify-center items-center gap-1.5 py-4.5 rounded-2xl text-sm font-bold transition-all"
              >
                <Plus size={16} />
                <span>เพิ่มข้อมูลแหล่งที่มารายรับเสริม</span>
              </button>
            </div>
          </div>
        )}

        {/* --- PART 3: CREDIT CARDS --- */}
        {activeTab === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b-2 border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="text-lg font-black text-blue-900 flex items-center gap-2">
                <CardIcon size={18} />
                ส่วนที่ 3: บัตรเครดิต / บัตรกดเงินสดที่ถือครองทั้งหมด
              </h3>
              <span className="bg-blue-50 text-blue-900 font-extrabold text-xs px-3 py-1 rounded-full border border-blue-100">
                {formData.creditCards ? formData.creditCards.length : 0} บัตร
              </span>
            </div>

            <p className="text-xs text-slate-500 -mt-2 leading-relaxed">
              * ระบุรายละเอียดระดับวงเงินบัตร รวมถึงสถาบันการเงินที่ใช้อยู่จริงเพื่อความครบถ้วนในการออกแบบสิทธิ์เงินช่วยเหลือ
            </p>

            <div className="space-y-4">
              {formData.creditCards && formData.creditCards.map((item, i) => (
                <div key={i} className="relative bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-sm animate-fade-in">
                  <button 
                    type="button" 
                    onClick={() => removeArrayItem('creditCards', i)} 
                    className="absolute top-4 right-4 text-red-500 hover:bg-red-55 p-2.5 rounded-xl border border-transparent hover:border-red-100 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pr-12">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">ธนาคาร / สถาบันการเงินผู้ออกบัตร</label>
                      <input 
                        type="text" 
                        value={item.bank} 
                        onChange={e => handleArrayChange('creditCards', i, 'bank', e.target.value)} 
                        placeholder="เช่น บัตรเครดิต ธ.กรุงไทย KTC, ยูเมะพลัส"
                        required
                        className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl mt-1.5 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">วงเงินสูงสุดของบัตร (บาท)</label>
                      <input 
                        type="number" 
                        value={item.limit || ''} 
                        onChange={e => handleArrayChange('creditCards', i, 'limit', Number(e.target.value) || 0)} 
                        placeholder="0"
                        required
                        className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl mt-1.5 outline-none font-mono" 
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button 
                type="button" 
                onClick={() => addArrayItem('creditCards', { bank: '', limit: 0 })} 
                className="w-full border-2 border-dashed border-slate-300 hover:border-blue-500 text-slate-500 hover:text-blue-900 hover:bg-slate-55 flex justify-center items-center gap-1.5 py-4.5 rounded-2xl text-sm font-bold transition-all"
              >
                <Plus size={16} />
                <span>ระบุรายการถือครองบัตรเพิ่ม</span>
              </button>
            </div>
          </div>
        )}

        {/* --- PART 4: VEHICLES --- */}
        {activeTab === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b-2 border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="text-lg font-black text-blue-900 flex items-center gap-2">
                <Car size={18} />
                ส่วนที่ 4: ยานพาหนะที่ถือครอง / รถยนต์และจักรยานยนต์
              </h3>
              <span className="bg-blue-50 text-blue-900 font-extrabold text-xs px-3 py-1 rounded-full border border-blue-100">
                {formData.vehicles ? formData.vehicles.length : 0} รายการ
              </span>
            </div>

            <div className="space-y-4">
              {formData.vehicles && formData.vehicles.map((item, i) => (
                <div key={i} className="relative bg-slate-50 border border-slate-200 hover:border-blue-200 p-5 rounded-2xl shadow-sm transition-all animate-fade-in">
                  <button 
                    type="button" 
                    onClick={() => removeArrayItem('vehicles', i)} 
                    className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-2.5 rounded-xl border border-transparent hover:border-red-100 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pr-12 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">ยี่ห้อรุ่นและสีรถยนต์/จักรยานยนต์</label>
                      <input 
                        type="text" 
                        value={item.brand} 
                        onChange={e => handleArrayChange('vehicles', i, 'brand', e.target.value)} 
                        placeholder="เช่น Toyota Yaris หรือ Honda Click 150i"
                        required
                        className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl mt-1.5 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">สถานะกรรมสิทธิ์ไฟแนนซ์</label>
                      <select 
                        value={item.paymentStatus} 
                        onChange={e => handleArrayChange('vehicles', i, 'paymentStatus', e.target.value)} 
                        className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl mt-1.5 outline-none text-sm"
                      >
                        <option value="ผ่อน">ผ่อนชำระไฟแนนซ์อยู่</option>
                        <option value="หมดภาระ">หมดภาระแล้ว (โอนกรรมสิทธิ์)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-450 tracking-wider">ค่างวดส่งผ่อนต่อเดือน (บาท)</label>
                      <input 
                        type="number" 
                        disabled={item.paymentStatus === 'หมดภาระ'} 
                        value={item.installmentAmount || ''} 
                        onChange={e => handleArrayChange('vehicles', i, 'installmentAmount', Number(e.target.value) || 0)} 
                        placeholder="0"
                        className="w-full px-4 py-2.5 border border-slate-200 disabled:bg-slate-200 bg-white rounded-xl mt-1.5 outline-none font-mono disabled:opacity-55" 
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <label className="flex items-center text-xs font-bold text-slate-600 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={item.usedForWork} 
                        onChange={e => handleArrayChange('vehicles', i, 'usedForWork', e.target.checked)} 
                        className="w-4 h-4 mr-2 text-blue-600 border-slate-300 rounded focus:ring-blue-500" 
                      />
                      <span>ใช้มียานพาหนะคันนี้เพื่อเดินทางมาปฏิบัติหน้าที่ราชการเป็นประจำ</span>
                    </label>
                  </div>
                </div>
              ))}

              <button 
                type="button" 
                onClick={() => addArrayItem('vehicles', { brand: '', paymentStatus: 'ผ่อน', installmentAmount: 0, usedForWork: false })} 
                className="w-full border-2 border-dashed border-slate-300 hover:border-blue-500 text-slate-500 hover:text-blue-900 hover:bg-slate-55 flex justify-center items-center gap-1.5 py-4.5 rounded-2xl text-sm font-bold transition-all"
              >
                <Plus size={16} />
                <span>ระบุรายการยานพาหนะถือครองเพิ่ม</span>
              </button>
            </div>
          </div>
        )}

        {/* --- PART 5: DEPENDENTS --- */}
        {activeTab === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b-2 border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="text-lg font-black text-blue-900 flex items-center gap-2">
                <Users size={18} />
                ส่วนที่ 5: ข้อมูลบุตร และ ผู้อยู่ในความดูแลอุปการะ
              </h3>
              <span className="bg-blue-50 text-blue-900 font-extrabold text-xs px-3 py-1 rounded-full border border-blue-100">
                {formData.dependents ? formData.dependents.length : 0} คน
              </span>
            </div>

            <div className="space-y-4">
              {formData.dependents && formData.dependents.map((item, i) => (
                <div key={i} className="relative bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-sm animate-fade-in">
                  <button 
                    type="button" 
                    onClick={() => removeArrayItem('dependents', i)} 
                    className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-2.5 rounded-xl border border-transparent hover:border-red-100 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pr-12">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">เพศ</label>
                      <select 
                        value={item.gender} 
                        onChange={e => handleArrayChange('dependents', i, 'gender', e.target.value)} 
                        required
                        className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl mt-1.5 outline-none text-sm"
                      >
                        <option value="">- เลือกเพศ -</option>
                        <option value="ชาย">ชาย</option>
                        <option value="หญิง">หญิง</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">ระดับการศึกษาคร่าวๆ (หรือการอธิบาย)</label>
                      <input 
                        type="text" 
                        value={item.education} 
                        onChange={e => handleArrayChange('dependents', i, 'education', e.target.value)} 
                        placeholder="เช่น ประถมศึกษาตอนต้น หรือ ทำงานแล้ว"
                        required
                        className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl mt-1.5 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">อายุ (ปี)</label>
                      <input 
                        type="number" 
                        value={item.age || ''} 
                        onChange={e => handleArrayChange('dependents', i, 'age', Number(e.target.value) || 0)} 
                        placeholder="0"
                        required
                        className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl mt-1.5 outline-none font-mono" 
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button 
                type="button" 
                onClick={() => addArrayItem('dependents', { gender: '', education: '', age: 0 })} 
                className="w-full border-2 border-dashed border-slate-300 hover:border-blue-500 text-slate-500 hover:text-blue-900 hover:bg-slate-55 flex justify-center items-center gap-1.5 py-4.5 rounded-2xl text-sm font-bold transition-all"
              >
                <Plus size={16} />
                <span>ระบุผู้อุปการะในการดูแลเพิ่ม</span>
              </button>
            </div>
          </div>
        )}

        {/* --- PART 6: RESIDENCE --- */}
        {activeTab === 6 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b-2 border-slate-100 pb-3">
              <h3 className="text-lg font-black text-blue-900 flex items-center gap-2">
                <Home size={18} />
                ส่วนที่ 6: รายละเอียดเกี่ยวกับที่พักอาศัยปัจจุบัน
              </h3>
            </div>

            <div className="bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200 space-y-5 shadow-sm">
              <div>
                <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wide">สถานที่ตั้งที่พักอาศัยจริงในปัจจุบัน (แชร์ข้อมูลพิกัด)</label>
                <textarea 
                  name="residenceLocation" 
                  value={formData.residenceLocation} 
                  onChange={handleTextChange} 
                  rows={2} 
                  required
                  placeholder="กรอกชื่อหมู่บ้าน เลขที่แฟลต ซอย ถนน หรือรายละเอียดอาคารสวัสดิการ"
                  className="w-full px-4 py-3 border border-slate-250 focus:border-blue-500 bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wide">เขตพื้นที่ / อำเภอ</label>
                  <input 
                    type="text" 
                    name="district" 
                    value={formData.district} 
                    onChange={handleTextChange} 
                    required
                    className="w-full px-4 py-3 border border-slate-250 bg-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wide">จังหวัด (จว.)</label>
                  <input 
                    type="text" 
                    name="province" 
                    value={formData.province} 
                    onChange={handleTextChange} 
                    required
                    className="w-full px-4 py-3 border border-slate-250 bg-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
                <div className="bg-white p-4.5 rounded-xl border border-slate-200">
                  <label className="block text-sm font-extrabold text-slate-700 mb-3.5 border-b pb-1">สถานะกรรมสิทธิ์ที่พักอาศัย</label>
                  <div className="flex flex-wrap gap-5">
                    <label className="flex items-center cursor-pointer text-slate-600 select-none text-xs font-bold">
                      <input 
                        type="radio" 
                        name="residenceStatus" 
                        value="ผ่อน" 
                        checked={formData.residenceStatus === 'ผ่อน'} 
                        onChange={handleTextChange} 
                        className="w-4 h-4 mr-2" 
                      />
                      <span>อยู่ระหว่างผ่อนส่งชำระ</span>
                    </label>
                    <label className="flex items-center cursor-pointer text-slate-600 select-none text-xs font-bold">
                      <input 
                        type="radio" 
                        name="residenceStatus" 
                        value="หมดภาระ" 
                        checked={formData.residenceStatus === 'หมดภาระ'} 
                        onChange={handleTextChange} 
                        className="w-4 h-4 mr-2" 
                      />
                      <span>หมดภาระค่าที่อยู่อาศัยแล้ว</span>
                    </label>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200">
                  <label className="block text-sm font-extrabold text-slate-700 mb-3.5 border-b pb-1">ประเภทสิทธิ์บ้านพักอาศัย</label>
                  <div className="flex flex-wrap gap-5">
                    <label className="flex items-center cursor-pointer text-slate-600 select-none text-xs font-bold">
                      <input 
                        type="radio" 
                        name="residenceType" 
                        value="บ้านพักราชการ" 
                        checked={formData.residenceType === 'บ้านพักราชการ'} 
                        onChange={handleTextChange} 
                        className="w-4 h-4 mr-2" 
                      />
                      <span>อาศัยแฟลต / บ้านพักข้าราชการดั้งเดิม</span>
                    </label>
                    <label className="flex items-center cursor-pointer text-slate-600 select-none text-xs font-bold">
                      <input 
                        type="radio" 
                        name="residenceType" 
                        value="บ้านพักส่วนตัว" 
                        checked={formData.residenceType === 'บ้านพักส่วนตัว'} 
                        onChange={handleTextChange} 
                        className="w-4 h-4 mr-2" 
                      />
                      <span>อาศัยทาวน์โฮม / คอนโดส่วนตัวภายนอก</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- PART 7: DEBTS --- */}
        {activeTab === 7 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b-2 border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="text-lg font-black text-blue-900 flex items-center gap-2">
                <ClipboardList size={18} />
                ส่วนที่ 7: รายละเอียดข้อมูลเกี่ยวกับยอดหนี้สินสะสมภายนอก/ภายในทั้งหมด
              </h3>
              <span className="bg-red-50 text-red-900 font-extrabold text-xs px-3 py-1 rounded-full border border-red-100">
                {formData.debts ? formData.debts.length : 0} สัญญาหนี้
              </span>
            </div>

            <p className="text-xs text-red-500/90 -mt-2 leading-relaxed">
              * โปรดกรอกข้อมูลหนี้สินตรงตามประเด็น สหกรณ์ออมทรัพย์, มีข้อตกลงธนาคารพิเศษ, บัตรสินเชื่อ หรือหนี้นอกระบบ (กู้เงินด่วนรายวัน คลุมวงเงิน) โดยสุจริตเพื่อใช้สิทธิ์รับตรวจสอบและรับการบรรเทาสิทธิ์ผ่อนผันดอกเบี้ย
            </p>

            <div className="space-y-6">
              {formData.debts && formData.debts.map((item, i) => (
                <div key={i} className="relative bg-slate-50 border border-slate-200 hover:border-red-200 p-5.5 rounded-2xl shadow-sm transition-all animate-fade-in">
                  <div className="absolute top-4 right-4 flex items-center gap-2.5">
                    {/* Visual debt number tag */}
                    <span className="text-[10px] font-black tracking-wider text-slate-400 border border-slate-205 px-2 py-1 rounded bg-white">สัญญาที่ #{i+1}</span>
                    <button 
                      type="button" 
                      onClick={() => removeArrayItem('debts', i)} 
                      className="text-red-500 hover:bg-red-55 p-2 rounded-xl border border-transparent hover:border-red-105 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5.5 mb-4 pr-24">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">ประเภทรายการเงินกู้</label>
                      <input 
                        type="text" 
                        value={item.type} 
                        onChange={e => handleArrayChange('debts', i, 'type', e.target.value)} 
                        placeholder="เช่น สหกรณ์ออมทรัพย์ ทบ. หรือ นอกระบบ"
                        required
                        className="w-full px-4 py-2 bg-white border border-slate-200 focus:border-red-400 rounded-xl mt-1.5 outline-none font-sans" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">ประเภทระบบที่นำส่งเงินชำระ</label>
                      <select 
                        value={item.paymentMethod} 
                        onChange={e => handleArrayChange('debts', i, 'paymentMethod', e.target.value)} 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-red-400 rounded-xl mt-1.5 outline-none text-xs font-bold"
                      >
                        <option value="ในระบบ">ในระบบ (หักผ่านบัญชีเงินเดือนอัตโนมัติ)</option>
                        <option value="นอกระบบ">นอกระบบ (ผ่อนชำระตรง/เจ้าหนี้ด่วนอื่นๆ)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">วันเดือนที่เริ่มกู้ยืม (ดด/ปป)</label>
                      <input 
                        type="text" 
                        value={item.startDate} 
                        placeholder="ดด/ปป (เช่น 12/24)"
                        onChange={e => handleArrayChange('debts', i, 'startDate', e.target.value)} 
                        required
                        className="w-full px-4 py-2 bg-white border border-slate-250 rounded-xl mt-1.5 outline-none text-xs font-mono" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5.5 mb-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">ยอดเงินกู้รวมทั้งหมด (บาท)</label>
                      <input 
                        type="number" 
                        value={item.totalAmount || ''} 
                        onChange={e => handleArrayChange('debts', i, 'totalAmount', Number(e.target.value) || 0)} 
                        placeholder="0"
                        required
                        className="w-full px-4 py-2 bg-white border border-slate-250 focus:border-red-450 focus:ring-1 focus:ring-red-450 rounded-xl mt-1.5 outline-none font-mono text-red-600 font-extrabold" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">ยอดหักผ่อนชำระ/เดือน (บาท)</label>
                      <input 
                        type="number" 
                        value={item.monthlyPayment || ''} 
                        onChange={e => handleArrayChange('debts', i, 'monthlyPayment', Number(e.target.value) || 0)} 
                        placeholder="0"
                        required
                        className="w-full px-4 py-2 bg-white border border-slate-250 rounded-xl mt-1.5 outline-none font-mono" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">วันสิ้นสุดสัญญาโดยประมาณ (ดด/ปป)</label>
                      <input 
                        type="text" 
                        value={item.dueDate} 
                        placeholder="ดด/ปป (เช่น 12/29)"
                        onChange={e => handleArrayChange('debts', i, 'dueDate', e.target.value)} 
                        required
                        className="w-full px-4 py-2 bg-white border border-slate-250 rounded-xl mt-1.5 outline-none text-xs font-mono" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">หมายเหตุและรายละเอียดวัตถุประสงค์ (สั้นๆ)</label>
                    <input 
                      type="text" 
                      value={item.details} 
                      placeholder="เช่น กู้ซื้อรถยนต์, กู้ฉุกเฉินช่วยอุทกภัยต่างจังหวัดครอบครัว หรือรักษาพยาบาลยืมทั่วไป"
                      onChange={e => handleArrayChange('debts', i, 'details', e.target.value)} 
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl mt-1.5 outline-none text-xs placeholder-slate-400" 
                    />
                  </div>
                </div>
              ))}

              <button 
                type="button" 
                onClick={() => addArrayItem('debts', { type: '', paymentMethod: 'ในระบบ', startDate: '', totalAmount: 0, monthlyPayment: 0, dueDate: '', details: '' })} 
                className="w-full border-2 border-dashed border-red-200 hover:border-red-500 text-slate-500 hover:text-red-700 hover:bg-red-50 flex justify-center items-center gap-1.5 py-4.5 rounded-2xl text-sm font-bold transition-all"
              >
                <Plus size={16} />
                <span>เพิ่มรายการข้อมูลหนี้สินหรือสัญญาเงินค้างชำระเพิ่ม</span>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Financial Overview Summary Footer inside form */}
        <div className="bg-slate-50 p-5 rounded-2.5xl border border-slate-200 mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-lg text-blue-900 shadow-sm shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wide block">ภาระจ่ายรวมต่อเดือน (หนี้+รถ)</span>
              <span className="font-extrabold text-red-600 text-base font-mono">{totalMonthlyOutflow.toLocaleString()} บาท/เดือน</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-lg text-blue-900 shadow-sm shrink-0">
              <CardIcon size={18} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wide block">ยอดหนี้สะสมค้างทั้งหมด</span>
              <span className="font-extrabold text-indigo-700 text-base font-mono">
                {(formData.debts ? formData.debts.reduce((sum, d) => sum + Number(d.totalAmount || 0), 0) : 0).toLocaleString()} บาท
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-lg text-blue-900 shadow-sm shrink-0">
              <Users size={18} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wide block">ผู้อุปการะ / บุตร</span>
              <span className="font-extrabold text-slate-700 text-base font-mono">{formData.dependents ? formData.dependents.length : 0} นาย</span>
            </div>
          </div>
        </div>

        {/* Form controls/buttons with smooth float */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-3.5 sticky bottom-0 bg-white p-4 -mx-5 sm:-mx-10 px-5 sm:px-10 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.15)] rounded-b-2xl z-20">
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-8 py-3 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer select-none"
          >
            ยกเลิกการกรอก
          </button>
          
          {activeTab < 7 ? (
            <button 
              type="button" 
              onClick={() => setActiveTab(prev => prev + 1)}
              className="bg-slate-800 hover:bg-slate-900 active:scale-95 text-white px-8 py-3 rounded-xl font-bold transition-transform shadow-md cursor-pointer select-none"
            >
              ดำเนินการส่วนถัดไป
            </button>
          ) : (
            <button 
              type="submit" 
              className="bg-blue-900 hover:bg-blue-950 active:scale-95 text-white px-10 py-3 rounded-xl font-bold transition-all shadow-xl flex justify-center items-center gap-1.5 cursor-pointer select-none"
            >
              <Save size={18} />
              <span>ยืนยันบันทึกข้อมูลเข้าระบบ</span>
            </button>
          )}
        </div>

      </form>
    </div>
  );
}
