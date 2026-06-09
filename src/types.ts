/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AdditionalIncome {
  source: string;
  amount: number;
}

export interface CreditCard {
  bank: string;
  limit: number;
}

export interface Vehicle {
  brand: string;
  paymentStatus: 'ผ่อน' | 'หมดภาระ';
  installmentAmount: number;
  usedForWork: boolean;
}

export interface Dependent {
  gender: 'ชาย' | 'หญิง' | '';
  education: string;
  age: number;
}

export interface Debt {
  type: string;
  paymentMethod: 'ในระบบ' | 'นอกระบบ';
  startDate: string;
  totalAmount: number;
  monthlyPayment: number;
  dueDate: string;
  details: string;
}

export interface User {
  id: string;
  username: string;
  rank: string;
  firstName: string;
  lastName: string;
  department: string;
  unit: string;
  role: 'ADMIN' | 'HR' | 'USER';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  createdAt?: string;
}

export interface Record {
  id: string;
  userId: string;
  department: string;
  rank: string;
  firstName: string;
  lastName: string;
  salaryLevel: string;
  salaryAmount: number;
  extraIncome: number;
  netIncome: number;
  maritalStatus: string;
  maritalStatusOther?: string;
  spouseOccupation: string;
  spouseOccupationOther?: string;
  spouseSalary: number;
  additionalIncomes: AdditionalIncome[];
  creditCards: CreditCard[];
  vehicles: Vehicle[];
  dependents: Dependent[];
  residenceLocation: string;
  district: string;
  province: string;
  residenceStatus: 'ผ่อน' | 'หมดภาระ' | '';
  residenceType: 'บ้านพักราชการ' | 'บ้านพักส่วนตัว' | '';
  debts: Debt[];
  createdAt: string;
  updatedAt: string;
}
