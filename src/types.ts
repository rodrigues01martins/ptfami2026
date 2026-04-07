export interface BudgetItem {
  id: string;
  stage: string;
  group: string;
  category: string;
  type: string;
  desc: string;
  value: number;
}

export interface LedgerEntry {
  id: number;
  itemCode: string;
  nf: string;
  supplier: string;
  category: string;
  documentName: string;
  documentData: string;
  approvalStatus: 'Pendente' | 'Aprovado' | 'Reprovado';
  stage: string;
  group: string;
  description: string;
  amount: number;
  date: string;
  referenceMonth: string;
  createdAt: string;
  updatedAt: string;
  authorUid: string;
}

export interface AuditLogEntry {
  timestamp: string;
  action: string;
  itemCode: string;
  nf: string;
  amount: number;
  detail: string;
  authorUid: string;
}
