export type Role = 'OWNER' | 'ADMIN' | 'MECHANIC';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  vehicles?: Vehicle[];
}

export type VehicleType = 'MOTOR' | 'MOBIL';

export interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year?: number | null;
  color?: string | null;
  type: VehicleType;
  chassisNumber?: string | null;
  engineNumber?: string | null;
  currentOdometer: number;
  notes?: string | null;
  customerId: string;
  customer?: Customer;
  createdAt: string;
  updatedAt: string;
}

export interface Mechanic {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  skills?: string | null;
  isActive: boolean;
  commissionRate: number;
  totalServices?: number;
  completedServices?: number;
  totalCommission?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  pic?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  npwp?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PartCategory {
  id: string;
  name: string;
  description?: string | null;
}

export interface Part {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  categoryId: string;
  category?: PartCategory;
  brand?: string | null;
  unit: string;
  purchasePrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  supplierId?: string | null;
  supplier?: Supplier;
  rackLocation?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string | null;
}

export interface Service {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  category?: ServiceCategory;
  price: number;
  estimatedMinutes: number;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WorkOrderStatus =
  | 'WAITING'
  | 'INSPECTION'
  | 'IN_PROGRESS'
  | 'WAITING_PART'
  | 'COMPLETED'
  | 'CANCELLED';

export interface WorkOrderItem {
  id: string;
  workOrderId: string;
  serviceId: string;
  service?: Service;
  name: string;
  price: number;
  discount: number;
  qty: number;
  total: number;
}

export interface WorkOrderPart {
  id: string;
  workOrderId: string;
  partId: string;
  part?: Part;
  name: string;
  price: number;
  discount: number;
  qty: number;
  total: number;
}

export interface WorkOrder {
  id: string;
  woNumber: string;
  customerId: string;
  customer?: Customer;
  vehicleId: string;
  vehicle?: Vehicle;
  mechanicId?: string | null;
  mechanic?: Mechanic;
  odometer: number;
  customerComplaints?: string | null;
  mechanicInspection?: string | null;
  status: WorkOrderStatus;
  subtotalService: number;
  subtotalParts: number;
  discount: number;
  tax: number;
  grandTotal: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: WorkOrderItem[];
  parts?: WorkOrderPart[];
}

export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';
export type PaymentMethod =
  | 'CASH'
  | 'TRANSFER'
  | 'QRIS'
  | 'DEBIT_CARD'
  | 'CREDIT_CARD'
  | 'E_WALLET';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  itemType: 'SERVICE' | 'PART';
  serviceId?: string | null;
  partId?: string | null;
  name: string;
  price: number;
  qty: number;
  discount: number;
  total: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  transactionNumber: string;
  amount: number;
  method: PaymentMethod;
  paymentDate: string;
  notes?: string | null;
  userId?: string | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  workOrderId?: string | null;
  workOrder?: WorkOrder;
  customerId?: string | null;
  customer?: Customer;
  vehicleId?: string | null;
  vehicle?: Vehicle;
  customerName?: string | null;
  vehiclePlate?: string | null;
  subtotalService: number;
  subtotalParts: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paidAmount: number;
  changeAmount: number;
  paymentStatus: PaymentStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'OPNAME';

export interface StockMovement {
  id: string;
  partId: string;
  part?: Part;
  type: StockMovementType;
  qty: number;
  stockBefore: number;
  stockAfter: number;
  referenceType?: string | null;
  referenceId?: string | null;
  userId?: string | null;
  notes?: string | null;
  createdAt: string;
}

export type PurchaseStatus = 'DRAFT' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  partId: string;
  part?: Part;
  name: string;
  purchasePrice: number;
  qty: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplier?: Supplier;
  status: PurchaseStatus;
  totalAmount: number;
  notes?: string | null;
  receivedDate?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: PurchaseItem[];
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string | null;
}

export interface Expense {
  id: string;
  categoryId: string;
  category?: ExpenseCategory;
  date: string;
  description: string;
  amount: number;
  paymentMethod: string;
  userId?: string | null;
  createdAt: string;
}

export interface ServiceReminder {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  customerId: string;
  customer?: Customer;
  reminderType: 'OIL_CHANGE' | 'TUNE_UP' | 'BRAKE_PAD' | 'PERIODIC';
  dueOdometer?: number | null;
  dueDate?: string | null;
  status: 'PENDING' | 'SENT' | 'COMPLETED';
  notes?: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  userName?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details: string;
  beforeData?: string | null;
  afterData?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface Setting {
  id: string;
  workshopName: string;
  logoUrl?: string | null;
  address: string;
  phone: string;
  email: string;
  invoicePrefix: string;
  taxRate: number;
  currency: string;
  operationalHours: string;
  printHeaderNotes?: string | null;
  printFooterNotes?: string | null;
}

export interface DashboardStats {
  omzetHariIni: number;
  omzetBulanIni: number;
  transaksiHariIni: number;
  kendaraanMasukHariIni: number;
  serviceSedangBerjalan: number;
  serviceSelesaiHariIni: number;
  totalPiutang: number;
  stokMenipisCount: number;
  grafikOmzet: { date: string; omzet: number; transaksi: number }[];
  topServices: { name: string; count: number; omzet: number }[];
  topParts: { name: string; count: number; omzet: number }[];
  aktivitasTerbaru: AuditLog[];
}
