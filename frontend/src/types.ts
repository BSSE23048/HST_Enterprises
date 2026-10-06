export type Client = {
  id: string;
  clientCode: string;
  displayName: string;
  purchaserName?: string;
  businessName?: string;
  phone?: string;
  email?: string;
  billingAddress?: string;
  notes?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Product = {
  id: string;
  productName: string;
  description?: string;
  defaultPrice: number;
  unit?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type InvoiceItem = {
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  lineTotal?: number;
  lineNo?: number;
};

export type Invoice = {
  id: string;
  clientId: string;
  clientCode: string;
  clientName: string;
  invoiceNumber: string;
  invoiceSequence: number | string;
  invoiceDate: string;
  
  documentType?: 'invoice' | 'quotation'; // NEW: Identifies quote vs invoice
  recordType?: 'invoice' | 'quotation';
  terms?: string; // NEW: Terms and conditions for quotes
  
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  amountPaid: number;
  balanceDue: number;
  
  notes?: string;
  items: InvoiceItem[];
  subtotal: number;
  grandTotal: number;
  itemCount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type InvoiceDraft = {
  id?: string;
  clientId: string;
  invoiceNumber: string;
  invoiceSequence: string | number;
  invoiceDate: string;
  
  documentType?: 'invoice' | 'quotation';
  recordType: 'invoice' | 'quotation';
  terms?: string;
  
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  amountPaid: number;
  balanceDue: number;
  
  notes: string;
  items: InvoiceItem[];
};
