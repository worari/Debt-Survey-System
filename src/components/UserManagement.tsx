/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { User } from '../types';
import { ShieldCheck, UserX, UserCheck, Trash2, ArrowLeft, ShieldAlert, Award, Star, Search, RefreshCw } from 'lucide-react';

interface Props {
  currentUser: User;
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export default function UserManagement({ currentUser, showToast, showConfirm }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        showToast('ไม่สามารถดึงรายชื่อผู้ใช้จากระบบเบื้องหลังได้', 'error');
      }
    } catch (err) {
      showToast('การเชื่อมต่อกับเซิร์ฟเวอร์ขัดข้อง', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAction = (userId: string, username: string, action: string, role?: string) => {
    let title = '';
    let msg = '';
    
    if (action === 'DELETE') {
      title = 'ยืนยันลบบัญชีผู้ใช้';
      msg = `คุณแน่ใจหรือไม่ว่าต้องการลบชื่อผู้ใช้งาน "${username}"? ข้อมูลหนี้สินและรายละเอียดสำรวจที่ผูกกับผู้นี้ทั้งหมดจะถูกทำลายถาวร และจะไม่สามารถย้อนกลับข้อมูลได้`;
    } else if (action === 'APPROVE') {
      title = 'ยืนยันอนุมัติบัญชี';
      msg = `ต้องการอนุมัติสิทธิ์การเข้าใช้งานระบบให้กับผู้ใช้ "${username}" ใช่หรือไม่?`;
    } else if (action === 'SUSPEND') {
      title = 'ยืนยันระงับบัญชีชั่วคราว';
      msg = `ต้องการระงับผู้ใช้ "${username}" เข้าใช้งานระบบชั่วคราวใช่หรือไม่?`;
    } else if (action === 'PROMOTE_HR') {
      title = 'แต่งตั้งผู้ช่วยกำลังพล (HR)';
      msg = `ต้องการมอบสิทธิ์ระดับ "HR" ให้กับผู้ใช้ "${username}" เพื่อช่วยดูวิเคราะห์รายงานทุกคนใช่หรือไม่?`;
    } else if (action === 'DEMOTE_USER') {
      title = 'ลดสิทธิ์เป็นกำลังพลทั่วไป (USER)';
      msg = `ลดสิทธิ์ "${username}" ให้เข้าถึงคีย์ข้อมูลและประวัติเงินกู้เฉพาะของของตัวเองเท่านั้นใช่หรือไม่?`;
    }

    showConfirm(title, msg, async () => {
      try {
        const res = await fetch('/api/users/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, action, role })
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message, 'success');
          // Reload users list
          fetchUsers();
        } else {
          showToast(data.message, 'error');
        }
      } catch (err) {
        showToast('เกิดความขัดข้องทางเทคนิคขณะส่งคำสั่ง', 'error');
      }
    });
  };

  const filteredUsers = users.filter(u => {
    const fullText = `${u.username} ${u.rank} ${u.firstName} ${u.lastName} ${u.department} ${u.role}`.toLowerCase();
    return fullText.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="w-full max-w-5xl space-y-6 animate-fade-in" id="user-management-panel">
      {/* Header card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <ShieldCheck size={24} className="text-blue-900" />
            แผงควบคุมหลักฝ่ายผู้ดูแลระบบ (Admin)
          </h1>
          <p className="text-slate-500 text-xs mt-1">อนุมัติบัญชีข้าราชการเข้าใช้ระบบ จัดการสิทธิ์ และดูแลความปลอดภัยส่วนบัญชีคลาวด์</p>
        </div>
        <button 
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 bg-white font-bold rounded-xl text-slate-700 text-xs shadow-sm transition-all h-fit self-end shrink-0 disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>รีเฟรชรายชื่อ</span>
        </button>
      </div>

      {/* Filter and stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Pending approvals count */}
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 shadow-inner">
          <div className="p-3 bg-amber-100 rounded-lg text-amber-700">
            <ShieldAlert size={20} />
          </div>
          <div>
            <span className="text-[10px] text-amber-600 font-extrabold uppercase block">รอการอนุมัติสิทธิ์</span>
            <span className="text-2xl font-black font-mono text-amber-800">
              {users.filter(u => u.status === 'PENDING').length} ท่าน
            </span>
          </div>
        </div>

        {/* Total active users */}
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3 shadow-inner">
          <div className="p-3 bg-emerald-100 rounded-lg text-emerald-700">
            <UserCheck size={20} />
          </div>
          <div>
            <span className="text-[10px] text-emerald-600 font-extrabold uppercase block font-sans">กำลังพลปกติ</span>
            <span className="text-2xl font-black font-mono text-emerald-800">
              {users.filter(u => u.status === 'ACTIVE').length} นาย
            </span>
          </div>
        </div>

        {/* Search input (colspan 2) */}
        <div className="md:col-span-2 bg-white border border-slate-200/80 p-3.5 rounded-xl flex items-center gap-2 shadow-sm">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input 
            type="text" 
            placeholder="ค้นหาตามชื่อยศ, นามสกุล, สังกัด หรือสิทธิ์ใช้งาน..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-sm outline-none bg-transparent placeholder-slate-400 font-sans"
          />
        </div>
      </div>

      {/* Table contents */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden min-h-[300px]">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-250 text-slate-500 font-extrabold uppercase tracking-wide text-[11px]">
                <th className="p-4.5 pl-6">ชื่อเข้าใช้งาน (Username)</th>
                <th className="p-4.5">ยศ - นามสกุลกำลังพล</th>
                <th className="p-4.5">หน้าแผนกสังกัด</th>
                <th className="p-4.5">สิทธิ์ระบบ (Role)</th>
                <th className="p-4.5">สถานภาพเข้าใช้</th>
                <th className="p-4.5 text-center pr-6">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-slate-400">
                    <RefreshCw className="animate-spin mx-auto mb-3" size={32} />
                    <span>กำลังประมวลผลคำขอรายชื่อกำลังพล...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-slate-400 font-medium">
                    ไม่พบข้อมูลผู้ใช้งานที่ตรงกับการค้นหาในระบบฐานข้อมูลขณะนี้
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4.5 pl-6 font-bold text-slate-700">{u.username}</td>
                    <td className="p-4.5 font-sans font-medium text-slate-800">
                      {u.rank}{u.firstName} {u.lastName}
                    </td>
                    <td className="p-4.5 text-slate-500 font-normal">{u.department}</td>
                    <td className="p-4.5">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold uppercase px-2 py-1 rounded-md ${
                        u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        u.role === 'HR' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.role === 'ADMIN' && <Star size={12} className="fill-indigo-700" />}
                        {u.role === 'HR' && <Award size={12} className="fill-cyan-700" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4.5">
                      <span className={`inline-flex px-2.5 py-1 text-[10px] font-extrabold rounded-full ${
                        u.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                        u.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {u.status === 'PENDING' && 'รออนุมัติ'}
                        {u.status === 'SUSPENDED' && 'ปิดระงับ'}
                        {u.status === 'ACTIVE' && 'ใช้งานปกติ'}
                      </span>
                    </td>
                    <td className="p-4.5 text-center pr-6 space-x-1.5">
                      {u.id !== currentUser.id && (
                        <>
                          {/* Approve option for pending */}
                          {u.status === 'PENDING' && (
                            <button 
                              onClick={() => handleAction(u.id, u.username, 'APPROVE')}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
                            >
                              อนุมัติสิทธิ์
                            </button>
                          )}

                          {/* Suspension management */}
                          {u.status === 'ACTIVE' && (
                            <button 
                              onClick={() => handleAction(u.id, u.username, 'SUSPEND')}
                              className="px-2.5 py-1.5 border border-amber-200 hover:bg-amber-50 text-amber-700 font-bold text-xs rounded-lg transition-all"
                            >
                              ระงับการใช้
                            </button>
                          )}
                          {u.status === 'SUSPENDED' && (
                            <button 
                              onClick={() => handleAction(u.id, u.username, 'APPROVE')}
                              className="px-2.5 py-1.5 border border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg transition-all"
                            >
                              ปลดระงับ
                            </button>
                          )}

                          {/* Role toggles */}
                          {u.status === 'ACTIVE' && u.role === 'USER' && (
                            <button 
                              onClick={() => handleAction(u.id, u.username, 'PROMOTE_HR')}
                              className="px-2 py-1.5 border border-cyan-200 hover:bg-cyan-50 text-cyan-700 font-bold text-xs rounded-lg transition-all"
                              title="ตั้งเป็นเจ้าหน้าที่ตรวจรายงาน"
                            >
                              ตั้งเป็น HR
                            </button>
                          )}
                          {u.status === 'ACTIVE' && u.role === 'HR' && (
                            <button 
                              onClick={() => handleAction(u.id, u.username, 'DEMOTE_USER')}
                              className="px-2 py-1.5 border border-slate-250 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-lg transition-all"
                              title="ลดเลื่อนระดับเป็นข้าราชการทั่วไป"
                            >
                              ลดเป็นกำลังพล
                            </button>
                          )}

                          {/* Deletion option */}
                          <button 
                            onClick={() => handleAction(u.id, u.username, 'DELETE')}
                            className="p-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg border border-red-200 hover:border-red-600 transition-colors"
                            title="ลบบัญชีและประวัติถาวร"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
