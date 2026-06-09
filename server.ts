/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(process.cwd(), 'db.json');

// Interface representation for internal DB storage
interface DBStructure {
  users: any[];
  records: any[];
}

// Function to safely initialize and seed database with descriptive mock items
function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    const defaultDb: DBStructure = {
      users: [
        {
          id: 'admin-id',
          username: 'admin',
          password: 'password', // Plain text for local sandbox login testing
          rank: 'พ.อ.',
          firstName: 'สมรรถชัย',
          lastName: 'สายฟ้า',
          department: 'บก.กองสิทธิ',
          unit: 'สปบ.กพ.ทบ.',
          role: 'ADMIN',
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        },
        {
          id: 'hr-id',
          username: 'hr',
          password: 'password',
          rank: 'ร.อ.',
          firstName: 'เกษมศักดิ์',
          lastName: 'เพียรงาน',
          department: 'แผนกแผน',
          unit: 'สปบ.กพ.ทบ.',
          role: 'HR',
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        },
        {
          id: 'officer-id',
          username: 'officer1',
          password: 'password',
          rank: 'ส.อ.',
          firstName: 'ธีรเดช',
          lastName: 'รักสันติ',
          department: 'แผนกประสานการช่วยเหลือ',
          unit: 'สปบ.กพ.ทบ.',
          role: 'USER',
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        },
        {
          id: 'demo-user-2',
          username: 'user2',
          password: 'password',
          rank: 'ส.ต.',
          firstName: 'ณรงค์เดช',
          lastName: 'หาญกล้า',
          department: 'แผนกสิทธิกำลังพลและครอบครัว',
          unit: 'สปบ.กพ.ทบ.',
          role: 'USER',
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        }
      ],
      records: [
        {
          id: 'rec-1',
          userId: 'officer-id',
          department: 'แผนกประสานการช่วยเหลือ',
          rank: 'ส.อ.',
          firstName: 'ธีรเดช',
          lastName: 'รักสันติ',
          salaryLevel: 'ป.1',
          salaryAmount: 18500,
          extraIncome: 2000,
          netIncome: 8200, // Salary minus deductions and debts
          maritalStatus: 'สมรส',
          spouseOccupation: 'พนักงานบริษัท',
          spouseSalary: 15000,
          additionalIncomes: [
            { source: 'ขับรถรับจ้างเสริมนอกเวลา', amount: 4500 }
          ],
          creditCards: [
            { bank: 'กรุงไทย', limit: 30000 }
          ],
          vehicles: [
            { brand: 'Honda Wave 110i', paymentStatus: 'หมดภาระ', installmentAmount: 0, usedForWork: true }
          ],
          dependents: [
            { gender: 'ชาย', education: 'ประถมศึกษา', age: 8 }
          ],
          residenceLocation: '123/45 แฟลตทหาร บก.กพ.ทบ. ถ.ราชดำเนินนอก',
          district: 'เขตพระนคร',
          province: 'กรุงเทพมหานคร',
          residenceStatus: 'หมดภาระ',
          residenceType: 'บ้านพักราชการ',
          debts: [
            {
              type: 'สหกรณ์ออมทรัพย์ ทบ.',
              paymentMethod: 'ในระบบ',
              startDate: '01/24',
              totalAmount: 450000,
              monthlyPayment: 6500,
              dueDate: '12/29',
              details: 'กู้สามัญเพื่อปรับปรุงที่อยู่อาศัยส่วนตัวต่างจังหวัด'
            },
            {
              type: 'บัตรเครดิตกรุงไทย',
              paymentMethod: 'นอกระบบ',
              startDate: '05/25',
              totalAmount: 24000,
              monthlyPayment: 1800,
              dueDate: '05/26',
              details: 'ผ่อนชำระค่ารักษาพยาบาลมารดา'
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'rec-2',
          userId: 'demo-user-2',
          department: 'แผนกสิทธิกำลังพลและครอบครัว',
          rank: 'ส.ต.',
          firstName: 'ณรงค์เดช',
          lastName: 'หาญกล้า',
          salaryLevel: 'ป.1',
          salaryAmount: 14500,
          extraIncome: 1500,
          netIncome: 3500,
          maritalStatus: 'โสด',
          spouseOccupation: '',
          spouseSalary: 0,
          additionalIncomes: [],
          creditCards: [
            { bank: 'ออมสิน', limit: 20000 },
            { bank: 'เฟิร์สชอยส์', limit: 15000 }
          ],
          vehicles: [
            { brand: 'Yamaha Grand Filano', paymentStatus: 'ผ่อน', installmentAmount: 2800, usedForWork: true }
          ],
          dependents: [],
          residenceLocation: 'แฟลตกองทัพบกเกียกกาย',
          district: 'เขตดุสิต',
          province: 'กรุงเทพมหานคร',
          residenceStatus: 'ผ่อน',
          residenceType: 'บ้านพักราชการ',
          debts: [
            {
              type: 'กู้สวัสดิการ กพ.ทบ.',
              paymentMethod: 'ในระบบ',
              startDate: '10/24',
              totalAmount: 180000,
              monthlyPayment: 3200,
              dueDate: '10/28',
              details: 'กู้ฉุกเฉินช่วยครอบครัวที่ประสบอุทกภัย'
            },
            {
              type: 'ผ่อนรถจักรยานยนต์',
              paymentMethod: 'นอกระบบ',
              startDate: '03/24',
              totalAmount: 42000,
              monthlyPayment: 2800,
              dueDate: '03/27',
              details: 'ผ่อนเช่าซื้อจักรยานยนต์'
            },
            {
              type: 'หนี้นอกระบบอเนกประสงค์',
              paymentMethod: 'นอกระบบ',
              startDate: '02/26',
              totalAmount: 35000,
              monthlyPayment: 3500,
              dueDate: '12/26',
              details: 'กู้ส่วนบุคคลเพื่อช่วยค่าใช้จ่ายครอบครัว'
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), 'utf8');
  }
}

initDb();

// Helper to read DB state
function readDb(): DBStructure {
  try {
    const content = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(content) as DBStructure;
  } catch (err) {
    console.error('Error reading DB, re-initializing', err);
    initDb();
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) as DBStructure;
  }
}

// Helper to write DB state
function writeDb(data: DBStructure) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing requests
  app.use(express.json());

  // --- API Routes ---

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกผู้ใช้และรหัสผ่าน' });
    }

    const db = readDb();
    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user) {
      return res.json({ success: false, message: 'ไม่พบชื่อผู้ใช้งานนี้ในระบบ' });
    }

    if (user.password !== password) {
      return res.json({ success: false, message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    if (user.status === 'PENDING') {
      return res.json({ success: false, message: 'บัญชีนี้อยู่ระหว่างรออนุมัติโดยผู้ดูแลระบบ' });
    }

    if (user.status === 'SUSPENDED') {
      return res.json({ success: false, message: 'บัญชีนี้ถูกระงับการใช้งานชั่วคราว' });
    }

    // Login success, omit password
    const { password: _, ...userSafe } = user;
    res.json({ success: true, user: userSafe });
  });

  // Auth: Register
  app.post('/api/auth/register', (req, res) => {
    const { username, password, rank, firstName, lastName, department, unit } = req.body;
    
    if (!username || !password || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
    }

    const db = readDb();
    const exists = db.users.some(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (exists) {
      return res.json({ success: false, message: 'ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว' });
    }

    const newUser = {
      id: 'usr-' + Math.random().toString(36).substr(2, 9),
      username,
      password,
      rank: rank || 'ส.ต.',
      firstName,
      lastName,
      department: department || 'แผนกแผน',
      unit: unit || 'สปบ.กพ.ทบ.',
      role: 'USER', // default register as officer/USER
      status: 'PENDING', // default pending approval
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDb(db);

    res.json({ 
      success: true, 
      message: 'ลงทะเบียนสำเร็จ! กรุณารอผู้ดูแลระบบอนุมัติบัญชีเข้าใช้งานของคุณ' 
    });
  });

  // Admin: Get all users
  app.get('/api/users', (req, res) => {
    // In actual production, we check token role, here we send for sandbox access
    const db = readDb();
    // Return safe data without passwords
    const usersSafe = db.users.map(({ password: _, ...userSafe }) => userSafe);
    res.json(usersSafe);
  });

  // Admin: manage user action (APPROVE, SUSPEND, DELETE, RE-ACTIVATE, MAKE_HR, MAKE_USER)
  app.post('/api/users/action', (req, res) => {
    const { userId, action, role } = req.body;
    if (!userId || !action) {
      return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
    }

    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return res.json({ success: false, message: 'ไม่พบผู้ใช้ในระบบ' });
    }

    const user = db.users[userIndex];

    if (action === 'DELETE') {
      db.users.splice(userIndex, 1);
      // Clean up records associated with this deleted user
      db.records = db.records.filter(r => r.userId !== userId);
      writeDb(db);
      return res.json({ success: true, message: 'ลบข้อมูลผู้ใช้งานและหลักฐานเกี่ยวดำเนินการเรียบร้อยแล้ว' });
    }

    if (action === 'APPROVE') {
      user.status = 'ACTIVE';
      if (role) user.role = role;
    } else if (action === 'SUSPEND') {
      user.status = 'SUSPENDED';
    } else if (action === 'PROMOTE_HR') {
      user.role = 'HR';
    } else if (action === 'DEMOTE_USER') {
      user.role = 'USER';
    }

    writeDb(db);
    res.json({ success: true, message: `อัปเดตสถานะผู้ใช้ ${user.rank}${user.firstName} สำเร็จ` });
  });

  // Records: Get all records (filtered by user if role is USER)
  app.get('/api/records', (req, res) => {
    const { userId, role } = req.query;
    const db = readDb();

    if (role === 'USER' && userId) {
      // Return records created by this profile only
      const userRecords = db.records.filter(r => r.userId === userId || r.id === userId); // fallback matching ID
      return res.json(userRecords);
    }

    // For ADMIN and HR, return all records
    res.json(db.records);
  });

  // Records: Save (create or update)
  app.post('/api/records/save', (req, res) => {
    const recordData = req.body;
    if (!recordData.firstName || !recordData.lastName) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อและนามสกุลกำลังพล' });
    }

    const db = readDb();
    
    if (recordData.id) {
      // Update
      const recordIndex = db.records.findIndex(r => r.id === recordData.id);
      if (recordIndex !== -1) {
        db.records[recordIndex] = {
          ...db.records[recordIndex],
          ...recordData,
          updatedAt: new Date().toISOString()
        };
        writeDb(db);
        return res.json({ success: true, message: 'แก้ไขข้อมูลกำลังพลสำเร็จแล้ว' });
      }
    }

    // Create new
    const newRecord = {
      ...recordData,
      id: 'rec-' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.records.push(newRecord);
    writeDb(db);
    res.json({ success: true, message: 'ลงบันทึกข้อมูลกำลังพลเรียบร้อยแล้ว' });
  });

  // Records: Delete
  app.delete('/api/records/:id', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const recordIndex = db.records.findIndex(r => r.id === id);

    if (recordIndex === -1) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการข้อมูลที่ต้องการลบ' });
    }

    db.records.splice(recordIndex, 1);
    writeDb(db);
    res.json({ success: true, message: 'ลบข้อมูลหนี้สินกำลังพลเรียบร้อยแล้ว' });
  });

  // --- Vite & Production Mounting Middleware ---
  
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on host 0.0.0.0 and port ${PORT}`);
  });
}

startServer();
