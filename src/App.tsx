/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { User, Record } from './types';
import Dashboard from './components/Dashboard';
import FormView from './components/FormView';
import UserManagement from './components/UserManagement';
import GASCenter from './components/GASCenter';
import FinancialHealth from './components/FinancialHealth';
import { ShieldCheck, LogIn, Key, Users, Layers, ShieldAlert, CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle, LogOut, Menu, X, Star, ChevronRight, RefreshCw } from 'lucide-react';

const RANKS = [
  'นาย', 'น.ส.', 'นาง', 'ส.ต.', 'ส.ท.', 'ส.อ.', 'จ.ส.ต.', 'จ.ส.ท.', 'จ.ส.อ.', 
  'ร.ต.', 'ร.ท.', 'ร.อ.', 'พ.ต.', 'พ.ท.', 'พ.อ.', 'พ.อ.(พ.)'
];

const DEPARTMENTS = [
  'แผนกแผน', 
  'แผนกประสานการช่วยเหลือ', 
  'แผนกสิทธิกำลังพลและครอบครัว', 
  'แผนกสิทธิข้าราชการนอกประจำการ', 
  'บก.กองสิทธิ'
];

const UNITS = ['สปบ.กพ.ทบ.'];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('login');
  const [records, setRecords] = useState<Record[]>([]);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [analyzingRecord, setAnalyzingRecord] = useState<Record | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  
  // Custom toast notification states
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' }>({
    show: false,
    message: '',
    type: 'success'
  });

  // Dialog confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ show: true, title, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
  };

  // REST API: Load all records
  const loadRecords = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const url = `/api/records?userId=${currentUser.id}&role=${currentUser.role}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      } else {
        showToast('ไม่สามารถดึงข้อมูลประวัติการชำระหนี้กำลังพลได้', 'error');
      }
    } catch (err) {
      showToast('การเชื่อมต่อรับข้อมูลจากเซิร์ฟเวอร์ขัดข้อง', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadRecords();
    }
  }, [currentUser]);

  // REST API: Save record data (Create / Update)
  const handleSaveRecord = async (docData: Record) => {
    setLoadingMsg('กำลังบันทึกข้อมูลเข้าสู่เซิร์ฟเวอร์...');
    try {
      // Set the active user reference if launching a new record creation
      const recordToSave = {
        ...docData,
        userId: docData.userId || currentUser?.id || 'usr-default'
      };

      const res = await fetch('/api/records/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recordToSave)
      });
      const data = await res.json();
      
      if (data.success) {
        showToast(data.message, 'success');
        await loadRecords();
        setCurrentView('dashboard');
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูลเข้าฐานคลาวด์', 'error');
    } finally {
      setLoadingMsg('');
    }
  };

  // REST API: Delete record by ID
  const handleDeleteRecord = (id: string) => {
    showConfirm(
      'ยืนยันลบชุดแบบสำรวจหนี้สินนี้',
      'คุณแน่ใจว่าต้องการลบแบบจำลองข้อมูลหนี้สินกำลังพลนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถกู้คืนได้ภายหลัง',
      async () => {
        closeConfirm();
        setLoadingMsg('กำลังทำลายข้อมูลเป้าหมาย...');
        try {
          const res = await fetch(`/api/records/${id}`, {
            method: 'DELETE'
          });
          const data = await res.json();
          if (data.success) {
            showToast(data.message, 'success');
            await loadRecords();
          } else {
            showToast(data.message, 'error');
          }
        } catch (err) {
          showToast('การเชื่อมต่อเพื่อส่งคำสั่งลบเกิดขัดข้อง', 'error');
        } finally {
          setLoadingMsg('');
        }
      }
    );
  };

  // REST API: User Login View wrapper
  const handleLogin = (userProfile: User) => {
    setCurrentUser(userProfile);
    setCurrentView('dashboard');
    showToast(`ยินดีต้อนรับ ${userProfile.rank}${userProfile.firstName} เข้าสู่ระบบสำเร็จ`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    showToast('ออกจากระบบสารสนเทศเรียบร้อยแล้ว', 'warning');
  };

  // Views routers
  const renderContentView = () => {
    if (!currentUser) {
      if (currentView === 'register') {
        return <RegisterView onNavigate={setCurrentView} showToast={showToast} showLoading={setLoadingMsg} hideLoading={() => setLoadingMsg('')} />;
      }
      return <LoginView onLogin={handleLogin} onNavigate={setCurrentView} showToast={showToast} showLoading={setLoadingMsg} hideLoading={() => setLoadingMsg('')} />;
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            user={currentUser}
            records={records}
            onNavigate={setCurrentView}
            onEdit={(rec) => {
              setEditingRecord(rec);
              setCurrentView('form');
            }}
            onDelete={handleDeleteRecord}
            onCreate={() => {
              setEditingRecord(null);
              setCurrentView('form');
            }}
            onAnalyze={(rec) => {
              setAnalyzingRecord(rec);
              setCurrentView('financialHealth');
            }}
            showToast={showToast}
            loading={loading}
            onRefresh={loadRecords}
          />
        );
      case 'form':
        return (
          <FormView 
            user={currentUser}
            initialData={editingRecord}
            onSave={handleSaveRecord}
            onCancel={() => {
              setEditingRecord(null);
              setCurrentView('dashboard');
            }}
          />
        );
      case 'adminUsers':
        return (
          <UserManagement 
            currentUser={currentUser}
            showToast={showToast}
            showConfirm={showConfirm}
          />
        );
      case 'gasCenter':
        return <GASCenter />;
      case 'financialHealth':
        return analyzingRecord ? (
          <FinancialHealth 
            record={analyzingRecord}
            onNavigateBack={() => {
              setAnalyzingRecord(null);
              setCurrentView('dashboard');
            }}
          />
        ) : (
          <div className="p-8 text-center text-slate-500">ข้อมูลประมวลผลทางการคลังสูญหาย</div>
        );
      default:
        return <div className="p-8 text-center text-slate-500 font-bold">ไม่พบวิวที่กําหนดในระบบ</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      
      {/* Toast Overlay */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-[60] px-5 py-3.5 rounded-2xl shadow-2xl border transition-all duration-300 transform flex items-center space-x-3 text-white font-bold text-xs ${
          toast.type === 'error' ? 'bg-red-650 border-red-500' :
          toast.type === 'warning' ? 'bg-amber-600 border-amber-550' :
          'bg-emerald-600 border-emerald-550'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Synchronous Block Overlay */}
      {loadingMsg && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-55 flex items-center justify-center">
          <div className="bg-white p-6 sm:p-8 rounded-2.5xl shadow-2xl border border-slate-100 flex flex-col items-center max-w-sm w-full mx-4">
            <RefreshCw className="animate-spin text-blue-900 mb-4" size={32} />
            <h3 className="text-base font-extrabold text-slate-800 text-center">{loadingMsg}</h3>
            <p className="text-slate-400 mt-2 text-[10px] text-center font-bold uppercase tracking-wider">โปรดอย่าปิดหน้าต่างเบราว์เซอร์นี้</p>
          </div>
        </div>
      )}

      {/* Confirmation modal dialogue block */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] z-[52] flex items-center justify-center">
          <div className="bg-white p-6.5 rounded-2.5xl shadow-2xl max-w-md w-full mx-4 border border-slate-100 animate-scale-up">
            <div className="flex items-center space-x-3 text-red-650 mb-3.5">
              <div className="bg-red-50 p-2.5 rounded-full"><ShieldAlert size={22} /></div>
              <h3 className="text-lg font-black text-slate-800">{confirmModal.title}</h3>
            </div>
            <p className="text-slate-550 text-sm leading-relaxed mb-6.5 font-normal">{confirmModal.message}</p>
            <div className="flex justify-end space-x-2.5">
              <button 
                onClick={closeConfirm} 
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button 
                onClick={confirmModal.onConfirm || undefined} 
                className="px-5.5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer select-none"
              >
                ยืนยันคำสั่ง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Top bar */}
      {currentUser && (
        <nav className="bg-gradient-to-r from-blue-950 to-slate-900 text-white shadow-xl sticky top-0 z-40 border-b border-blue-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              
              {/* Left hand side logo and identities */}
              <div className="flex items-center space-x-3">
                <div className="bg-blue-800/60 p-1.5 rounded-lg border border-blue-500/30">
                  <ShieldCheck className="text-blue-300" size={20} />
                </div>
                <div>
                  <span className="font-extrabold text-base tracking-tight block sm:inline">ระบบจัดการหนี้สินกำลังพล</span>
                  <span className="bg-blue-900 text-blue-200 border border-blue-800/40 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ml-2 hidden sm:inline-block">
                    {currentUser.role}
                  </span>
                </div>
              </div>

              {/* Central and right selectors */}
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setCurrentView('dashboard')} 
                  className={`px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                    currentView === 'dashboard' || currentView === 'financialHealth' || currentView === 'form'
                      ? 'bg-blue-850 text-white' 
                      : 'text-blue-200 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  แดชบอร์ด
                </button>
                
                {currentUser.role === 'ADMIN' && (
                  <button 
                    onClick={() => setCurrentView('adminUsers')} 
                    className={`px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                      currentView === 'adminUsers' 
                        ? 'bg-blue-850 text-white' 
                        : 'text-blue-200 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    จัดการผู้ใช้
                  </button>
                )}

                <button 
                  onClick={() => setCurrentView('gasCenter')} 
                  className={`px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                    currentView === 'gasCenter' 
                      ? 'bg-blue-850 text-white' 
                      : 'text-blue-200 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  คู่มือเชื่อม Google Sheet
                </button>

                <div className="w-px h-5 bg-blue-800/60 mx-1 hidden sm:block"></div>
                
                <div className="hidden md:flex flex-col items-end text-xs">
                  <span className="font-extrabold text-white">{currentUser.rank}{currentUser.firstName} {currentUser.lastName}</span>
                  <span className="text-[9px] text-blue-300 font-bold">{currentUser.department}</span>
                </div>

                <button 
                  onClick={handleLogout} 
                  className="text-red-300 hover:text-white bg-red-900/30 hover:bg-red-600/50 p-2 text-xs font-bold rounded-xl transition-all"
                  title="ออกจากระบบ"
                >
                  <LogOut size={16} />
                </button>
              </div>

            </div>
          </div>
        </nav>
      )}

      {/* Main Core View Area */}
      <main className="flex-grow flex flex-col items-center justify-start w-full py-6 sm:py-9 px-4 sm:px-8">
        {renderContentView()}
      </main>

      {/* Humble Footer */}
      <footer className="py-4 border-t border-slate-100 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0 bg-white">
        © 2026 ระบบแผนสารสนเทศคลังกองทัพ · สปบ.กพ.ทบ. ALL RIGHTS RESERVED
      </footer>

    </div>
  );
}

// Sub components representing login and register inline wrapper for speed, simplicity and robustness
interface FormViewsProps {
  onNavigate: (view: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
  showLoading: (msg: string) => void;
  hideLoading: () => void;
}

function LoginView({ onLogin, onNavigate, showToast, showLoading, hideLoading }: FormViewsProps & { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      return showToast('กรุณากรอกข้อมูลบัญชีเพื่อเข้าใช้งาน', 'warning');
    }

    showLoading('กำลังสื่อสารเพื่อประมวลผลคำขอล็อกอิน...');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      hideLoading();
      if (data.success) {
        onLogin(data.user);
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      hideLoading();
      showToast('เกิดปัญหารับส่งแพ็คเก็ตข้อมูลกับหลังบ้านเซิร์ฟเวอร์', 'error');
    }
  };

  return (
    <div className="w-full max-w-md p-6 sm:p-9.5 bg-white rounded-3xl shadow-2xl border border-slate-100 mt-10 animate-fade-in" id="login-form-container">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-900 rounded-2xl border border-blue-100 mb-3.5 shadow-sm">
          <ShieldCheck size={36} />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-800">ระบบประมวลผลหนี้สินกำลังพล</h2>
        <p className="text-slate-400 text-xs mt-1.5 font-bold uppercase tracking-wider">กรมกำลังพลทหารบก (สปบ.กพ.ทบ.)</p>
      </div>

      <form onSubmit={handleLoginSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">ชื่อผู้เข้าใช้งาน (Username)</label>
          <div className="relative">
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              placeholder="กรอกชื่อผู้ใช้ เช่น admin"
              className="w-full pl-4.5 pr-4.5 py-3.5 border border-slate-200 hover:border-blue-400 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-slate-800 placeholder-slate-400" 
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5 font-bold">รหัสผ่านลับ (Password)</label>
          <div className="relative">
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="กรอกรหัสผ่าน เช่น password"
              className="w-full pl-4.5 pr-4.5 py-3.5 border border-slate-200 hover:border-blue-400 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-slate-800 placeholder-slate-400 font-mono" 
            />
          </div>
        </div>

        {/* Info panel for ease of use in tests */}
        <div className="bg-blue-550/10 p-3.5 rounded-xl border border-blue-100 text-[11px] text-blue-900 space-y-1">
          <span className="font-extrabold block">บัญชีทดสอบสิทธิ์สำหรับนักทดสอบ:</span>
          <div className="flex justify-between">
            <span>Admin: <strong className="font-bold">admin</strong>/password</span>
            <span>HR: <strong className="font-bold">hr</strong>/password</span>
            <span>User: <strong className="font-bold">officer1</strong>/password</span>
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full px-5 py-4 bg-blue-900 hover:bg-blue-955 text-white rounded-xl font-bold text-sm tracking-wide mt-4 flex justify-center items-center gap-1.5 shadow-lg active:scale-95 transition-transform"
        >
          <LogIn size={16} />
          <span>เข้าตรวจสอบข้อมูลและสิทธิคลัง</span>
        </button>
      </form>

      <div className="text-center pt-6 mt-6 border-t border-slate-100 flex items-center justify-center gap-1">
        <span className="text-slate-400 text-xs">ข้าราชการใหม่?</span>
        <button 
          onClick={() => onNavigate('register')} 
          className="text-blue-900 font-extrabold text-xs hover:underline"
        >
          ลงทะเบียนแจ้งขอใช้งานสิทธิ์
        </button>
      </div>
    </div>
  );
}

function RegisterView({ onNavigate, showToast, showLoading, hideLoading }: FormViewsProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rank, setRank] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [unit, setUnit] = useState(UNITS[0]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !firstName || !lastName || !rank) {
      return showToast('กรุณากรอกข้อมูลที่จำเป็นทั้งหมดให้ถูกต้องสำหรับการยืนยันฝ่ายสิทธิ', 'warning');
    }

    showLoading('กำลังส่งข้อมูลลงทะเบียนบัญชีทหารถึงผู้จัดการระบบ...');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, rank, firstName, lastName, department, unit })
      });
      const data = await res.json();
      
      hideLoading();
      if (data.success) {
        showToast(data.message, 'success');
        onNavigate('login');
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      hideLoading();
      showToast('ระบบเครือข่ายสำหรับลงทะเบียนขัดข้องชั่วคราว', 'error');
    }
  };

  return (
    <div className="w-full max-w-lg p-6 sm:p-9.5 bg-white rounded-3xl shadow-2xl border border-slate-100 mt-10 animate-fade-in" id="register-form-container">
      <h2 className="text-xl sm:text-2xl font-black text-center text-slate-850">ลงชื่อร้องขอลงทะเบียนใช้งานบัญชี</h2>
      <p className="text-slate-450 text-[11px] text-center mt-1 uppercase font-black tracking-wider border-b pb-5 mb-6">กองประเมินสิทธิพยุงคลัง (สปบ.กพ.ทบ.)</p>
      
      <form onSubmit={handleRegisterSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-450 tracking-wider mb-1">ชื่อผู้ใช้งาน (Username)</label>
            <input 
              type="text" 
              placeholder="Username" 
              required 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-3.5 border border-slate-200 hover:border-blue-400 rounded-xl bg-slate-50/50 outline-none text-xs text-slate-800 transition-all font-sans" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-450 tracking-wider mb-1">รหัสผ่านสัญลักษณ์ (Password)</label>
            <input 
              type="password" 
              placeholder="Password" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 border border-slate-200 hover:border-blue-400 rounded-xl bg-slate-50/50 outline-none text-xs text-slate-800 transition-all font-mono" 
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase text-slate-455 tracking-wider mb-1">ยศทหารกองประจำการ (เลือกจากรายชื่อหรือพิมพ์เพิ่มได้)</label>
          <input 
            list="ranks-reg" 
            placeholder="เช่น ส.ต. หรือ พ.ต." 
            required 
            value={rank}
            onChange={e => setRank(e.target.value)}
            className="w-full px-4 py-3.5 border border-slate-200 hover:border-blue-400 rounded-xl bg-slate-50/50 outline-none text-xs text-slate-850" 
          />
          <datalist id="ranks-reg">
            {RANKS.map(r => <option key={r} value={r} />)}
          </datalist>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-450 tracking-wider mb-1">ชื่อจริงประจำตัว</label>
            <input 
              type="text" 
              placeholder="ชื่อทหาร" 
              required 
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className="w-full px-4 py-3.5 border border-slate-200 rounded-xl bg-slate-50/50 outline-none text-xs" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-450 tracking-wider mb-1">นามสกุลข้าราชการ</label>
            <input 
              type="text" 
              placeholder="นามสกุล" 
              required 
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="w-full px-4 py-3.5 border border-slate-200 rounded-xl bg-slate-50/50 outline-none text-xs" 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-450 tracking-wider mb-1">แผนกสายงานปกติ</label>
            <select 
              value={department}
              onChange={e => setDepartment(e.target.value)}
              required 
              className="w-full px-4 py-3.5 border border-slate-200 rounded-xl bg-slate-50/50 outline-none text-xs font-bold text-slate-700 bg-white"
            >
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-450 tracking-wider mb-1">ชื่อหน่วยย่อย</label>
            <select 
              value={unit}
              onChange={e => setUnit(e.target.value)}
              required 
              className="w-full px-4 py-3.5 border border-slate-200 rounded-xl bg-slate-50/50 outline-none text-xs font-bold text-slate-700 bg-white"
            >
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between pt-6 mt-4 border-t border-slate-100 items-center gap-3">
          <button 
            type="button" 
            onClick={() => onNavigate('login')} 
            className="text-slate-400 font-bold text-xs hover:text-slate-700 hover:underline cursor-pointer select-none"
          >
            มีสิทธิ์ใช้งานอยู่แล้ว? ย้อนกลับล็อกอิน
          </button>
          
          <button 
            type="submit" 
            className="bg-blue-900 hover:bg-blue-950 text-white px-7.5 py-3.5 rounded-xl text-xs font-black shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto"
          >
            ส่งคำขอลงทะเบียน
          </button>
        </div>
      </form>
    </div>
  );
}
