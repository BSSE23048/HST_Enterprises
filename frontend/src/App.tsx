import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { auth } from './lib/firebase';

import {
  createClient,
  createInvoice,
  createProduct,
  deleteClient,
  deleteInvoice,
  deleteProduct,
  loadClients,
  loadInvoice,
  loadInvoices,
  loadNextSequence,
  loadProducts,
  updateClient,
  updateInvoice,
  updateProduct
} from './lib/api';
// PDF code is loaded only when a document action is requested.
import type { Client, Invoice, InvoiceDraft, InvoiceItem, Product } from './types';

type Toast = { id: number; message: string; tone: 'success' | 'error' | 'info' };
type Tab = 'dashboard' | 'clients' | 'catalog' | 'studio' | 'history';

type ClientForm = {
  purchaserName: string; displayName: string; clientCode: string; businessName: string;
  phone: string; email: string; billingAddress: string; notes: string; isActive: boolean;
};

type ProductForm = {
  productName: string; description: string; defaultPrice: string; isActive: boolean;
};

const emptyClientForm: ClientForm = { purchaserName: '', displayName: '', clientCode: '', businessName: '', phone: '', email: '', billingAddress: '', notes: '', isActive: true };
const emptyProductForm: ProductForm = { productName: '', description: '', defaultPrice: '', isActive: true };

const defaultTerms = "1. Validity: This quotation is valid for 15 days.\n2. Payment: 100% Advance Payment.\n3. Delivery: 3 to 4 working days after confirmation.\n4. Taxes: All prices are exclusive of GST unless mentioned.";

function money(value: any) { return (Number(value) || 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function todayIso() { return new Date().toISOString().slice(0, 10); }

// HELPER: Convert YYYY-MM-DD to DD-MM-YYYY for display
function formatDisplayDate(isoDate: string) {
  if (!isoDate) return 'No Date';
  return isoDate.split('-').reverse().join('-');
}

function blankLine(): InvoiceItem { return { description: '', unit: 'Nos', quantity: 1, unitPrice: 0, productId: null } as any; }

function getStatusColor(status: string, recordType: string = 'invoice') {
  if (recordType === 'quotation') return 'bg-purple-100 text-purple-800 border-purple-200';
  switch(status) {
    case 'paid': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'partial': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'overdue': return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'cancelled': return 'bg-slate-200 text-slate-600 border-slate-300';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

export default function App() {
  const toastTimers = useRef(new Set<number>());
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clientForm, setClientForm] = useState<ClientForm>(emptyClientForm);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  
  const [clientSearch, setClientSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all'|'invoice'|'quotation'>('all');
  
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

  const [invoiceDraft, setInvoiceDraft] = useState<InvoiceDraft>({
    clientId: '', invoiceNumber: '', invoiceSequence: '', invoiceDate: todayIso(),
    recordType: 'invoice', status: 'draft', amountPaid: 0, balanceDue: 0, notes: '', items: [blankLine()]
  });

  useEffect(() => {
    let mounted = true;
    let version = 0;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const ownVersion = ++version;
      setAuthChecking(true);
      setUser(null); setClients([]); setProducts([]); setInvoices([]);
      resetInvoice(); setClientForm(emptyClientForm); setProductForm(emptyProductForm);
      setEditingClientId(null); setEditingProductId(null);
      try {
        const token = currentUser ? await currentUser.getIdTokenResult(true) : null;
        if (!mounted || version !== ownVersion) return;
        if (currentUser && token?.claims.admin === true) {
          setUser(currentUser);
          void refreshAll();
        } else if (currentUser) {
          setLoginError('This account is not authorized for the employee portal.');
          await signOut(auth);
        }
      } catch {
        if (mounted) setLoginError('Unable to verify access. Please sign in again.');
      } finally {
        if (mounted && version === ownVersion) setAuthChecking(false);
      }
    });
    return () => { mounted = false; version++; unsubscribe(); toastTimers.current.forEach(clearTimeout); };
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoginError(''); setBusy(true);
    try { await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword); } 
    catch { setLoginError('Access Denied. Invalid credentials.'); } 
    finally { setLoginPassword(''); setBusy(false); }
  }

  async function handleLogout() {
    await signOut(auth); setClients([]); setProducts([]); setInvoices([]); setActiveTab('dashboard');
  }

  useEffect(() => {
    if (!user || !invoiceDraft.clientId || activeInvoice) return;
    let cancelled = false;
    void loadNextSequence(String(invoiceDraft.clientId), invoiceDraft.recordType)
      .then((res) => {
        if (cancelled) return;
        setInvoiceDraft(cur => ({ ...cur, invoiceSequence: res.data.nextSequence, invoiceNumber: res.data.invoiceNumber }));
      }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [user, activeInvoice, invoiceDraft.clientId, invoiceDraft.recordType]);

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    return q ? clients.filter(c => [c.displayName, c.clientCode, c.businessName ?? ''].join(' ').toLowerCase().includes(q)) : clients;
  }, [clientSearch, clients]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return q ? products.filter(p => [p.productName, p.description ?? ''].join(' ').toLowerCase().includes(q)) : products;
  }, [productSearch, products]);

  const filteredInvoices = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    let result = invoices;
    if (historyFilter !== 'all') result = result.filter(i => (i.recordType || 'invoice') === historyFilter);
    return q ? result.filter(i => [i.invoiceNumber, i.clientName, i.clientCode, i.status].join(' ').toLowerCase().includes(q)) : result;
  }, [historySearch, historyFilter, invoices]);

  const subtotal = useMemo(() => invoiceDraft.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0), [invoiceDraft.items]);
  const balanceDue = useMemo(() => Math.max(0, subtotal - Number(invoiceDraft.amountPaid || 0)), [subtotal, invoiceDraft.amountPaid]);
  const currentClient = clients.find((client) => String(client.id) === String(invoiceDraft.clientId));

  const clientStats = useMemo(() => {
    const stats: Record<string, { billed: number, paid: number, balance: number }> = {};
    clients.forEach(c => { stats[String(c.id)] = { billed: 0, paid: 0, balance: 0 }; });
    invoices.forEach(inv => {
      if (inv.status !== 'cancelled' && inv.recordType !== 'quotation') {
        const cId = String(inv.clientId);
        if (stats[cId]) {
          stats[cId].billed += Number(inv.grandTotal || 0);
          stats[cId].paid += Number(inv.amountPaid || 0);
          stats[cId].balance += Number(inv.balanceDue !== undefined ? inv.balanceDue : inv.grandTotal);
        }
      }
    });
    return stats;
  }, [clients, invoices]);

  const { totalRevenue, totalCollected, totalPendingReceivables, currentMonthRevenue, monthlyChartData } = useMemo(() => {
    let total = 0; let collected = 0; let pending = 0; let currentMonthTotal = 0;
    const currentMonthPrefix = todayIso().substring(0, 7); 
    const monthlyMap: Record<string, number> = {};

    invoices.forEach(inv => {
      if (!inv || !inv.grandTotal || inv.status === 'cancelled') return;
      if (inv.recordType !== 'quotation') {
        total += inv.grandTotal;
        collected += (inv.amountPaid || 0);
        pending += (inv.balanceDue !== undefined ? inv.balanceDue : inv.grandTotal);
        
        const monthStr = (inv.invoiceDate || todayIso()).substring(0, 7);
        if (monthStr === currentMonthPrefix) currentMonthTotal += inv.grandTotal;
        monthlyMap[monthStr] = (monthlyMap[monthStr] || 0) + inv.grandTotal;
      }
    });

    const sortedMonths = Object.keys(monthlyMap).sort().reverse().slice(0, 6).reverse();
    const maxMonthValue = Math.max(...Object.values(monthlyMap), 1); 
    const chartData = sortedMonths.map(month => ({
      label: new Date(month + "-01").toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      value: monthlyMap[month], heightPercent: (monthlyMap[month] / maxMonthValue) * 100
    }));

    return { totalRevenue: total, totalCollected: collected, totalPendingReceivables: pending, currentMonthRevenue: currentMonthTotal, monthlyChartData: chartData };
  }, [invoices]);

  function notify(m: string, t: Toast['tone'] = 'info') {
    const id = Date.now(); setToasts(c => [...c, { id, message: m, tone: t }]);
    const timer = window.setTimeout(() => { setToasts(c => c.filter(e => e.id !== id)); toastTimers.current.delete(timer); }, 4000);
    toastTimers.current.add(timer);
  }

  async function refreshAll() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setLoading(true);
    try {
      const [cr, pr, ir] = await Promise.all([loadClients(), loadProducts(), loadInvoices()]);
      if (auth.currentUser?.uid !== uid) return;
      setClients(cr.data as any); setProducts(pr.data as any); setInvoices(ir.data as any);
    } catch (e: any) { notify('Failed to synchronize data with cloud', 'error'); } 
    finally { setLoading(false); }
  }

  function resetInvoice() {
    setActiveInvoice(null); setClientSearch(''); setProductSearch('');
    setInvoiceDraft({ clientId: '', invoiceNumber: '', invoiceSequence: '', invoiceDate: todayIso(), recordType: 'invoice', terms: '', status: 'draft', amountPaid: 0, balanceDue: 0, notes: '', items: [blankLine()] });
  }

  function updateItem(index: number, patch: Partial<InvoiceItem & { unit?: string }>) {
    setInvoiceDraft(cur => { const items = [...cur.items]; items[index] = { ...items[index], ...patch } as any; return { ...cur, items }; });
  }

  function addItem() { setInvoiceDraft(cur => ({ ...cur, items: [...cur.items, blankLine()] })); }
  function removeItem(idx: number) { setInvoiceDraft(cur => ({ ...cur, items: cur.items.length === 1 ? [blankLine()] : cur.items.filter((_, i) => i !== idx) })); }
  function selectProduct(idx: number, p: Product) { updateItem(idx, { productId: String(p.id), description: p.productName, unitPrice: p.defaultPrice, unit: p.unit || 'Nos' }); setProductSearch(''); }
  function selectClient(c: Client) { setInvoiceDraft(cur => ({ ...cur, clientId: String(c.id) })); setClientSearch(c.displayName); }

  function handleStatusClick(stat: string) {
    let newPaid = invoiceDraft.amountPaid;
    if (stat === 'paid') newPaid = subtotal; 
    if (stat === 'draft' || stat === 'cancelled') newPaid = 0; 
    setInvoiceDraft(d => ({ ...d, status: stat as any, amountPaid: newPaid }));
  }

  function handleRecordTypeToggle(type: 'invoice' | 'quotation') {
    setInvoiceDraft(d => ({ ...d, recordType: type, terms: type === 'quotation' && !d.terms ? defaultTerms : d.terms }));
  }

  async function saveClient(e: FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const payload = { purchaserName: clientForm.purchaserName || "", displayName: clientForm.displayName, clientCode: clientForm.clientCode || "", businessName: clientForm.businessName || "", phone: clientForm.phone || "", email: clientForm.email || "", billingAddress: clientForm.billingAddress || "", notes: clientForm.notes || "", isActive: clientForm.isActive };
      if (editingClientId) { await updateClient(editingClientId, payload); notify('Client profile updated securely.', 'success'); } else { await createClient(payload); notify('New client added to directory.', 'success'); }
      setClientForm(emptyClientForm); setEditingClientId(null); await refreshAll();
    } catch (e: any) { notify(e instanceof Error ? e.message : 'Unable to save client.', 'error'); } finally { setBusy(false); }
  }

  async function saveProduct(e: FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const payload = { productName: productForm.productName, description: productForm.description || "", defaultPrice: Number(productForm.defaultPrice), isActive: productForm.isActive };
      if (editingProductId) { await updateProduct(editingProductId, payload); notify('Catalog item updated.', 'success'); } else { await createProduct(payload); notify('New product added to catalog.', 'success'); }
      setProductForm(emptyProductForm); setEditingProductId(null); await refreshAll();
    } catch (e: any) { notify(e instanceof Error ? e.message : 'Unable to save product.', 'error'); } finally { setBusy(false); }
  }

  async function saveInvoice(e: FormEvent) {
    e.preventDefault();
    if (!invoiceDraft.clientId || invoiceDraft.items.length === 0) { notify('Please select a client and add at least one item.', 'error'); return; }
    setBusy(true);
    try {
      const calcTotal = invoiceDraft.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
      const calcBalance = invoiceDraft.recordType === 'quotation' ? calcTotal : Math.max(0, calcTotal - Number(invoiceDraft.amountPaid || 0));
      
      let finalStatus = invoiceDraft.status;
      if (invoiceDraft.recordType === 'invoice' && finalStatus !== 'draft' && finalStatus !== 'sent' && finalStatus !== 'cancelled') {
         if (calcBalance === 0) finalStatus = 'paid';
         else if (Number(invoiceDraft.amountPaid) > 0) finalStatus = 'partial';
      }

      // --- SMART SEQUENCE EXTRACTOR ---
      // If user manually changed "QT-005" to "QT-022", we extract "22" to save to database!
      const seqMatch = invoiceDraft.invoiceNumber.match(/(\d+)$/);
      const finalSequence = seqMatch ? parseInt(seqMatch[1], 10) : (invoiceDraft.invoiceSequence === '' ? 0 : Number(invoiceDraft.invoiceSequence));

      const client = clients.find(c => String(c.id) === String(invoiceDraft.clientId));
      const payload: any = { 
        ...invoiceDraft, clientId: String(invoiceDraft.clientId), clientName: client?.displayName || "Unknown", clientCode: client?.clientCode || "INV",
        subtotal: calcTotal, grandTotal: calcTotal, status: finalStatus, amountPaid: Number(invoiceDraft.amountPaid || 0), balanceDue: calcBalance,
        itemCount: invoiceDraft.items.length, invoiceSequence: finalSequence, 
        items: invoiceDraft.items.map((i: any) => ({ productId: i.productId || null, description: i.description || "", quantity: Number(i.quantity), unitPrice: Number(i.unitPrice || 0), unit: i.unit || 'Nos' })) 
      };
      
      if (activeInvoice) { await updateInvoice(activeInvoice.id, payload); notify('Document successfully updated.', 'success'); } 
      else { await createInvoice(payload); notify('Document securely generated.', 'success'); setActiveTab('history'); }
      await refreshAll(); resetInvoice();
    } catch (e: any) { notify(e instanceof Error ? e.message : 'Unable to save document.', 'error'); } finally { setBusy(false); }
  }

  async function editInvoice(invoice: Invoice) {
    try {
      const res = await loadInvoice(invoice.id); const detail = res.data;
      setActiveInvoice(detail as any);
      setInvoiceDraft({
        id: detail.id, clientId: detail.clientId, invoiceNumber: detail.invoiceNumber, invoiceSequence: detail.invoiceSequence, invoiceDate: detail.invoiceDate, 
        recordType: detail.recordType || 'invoice', terms: detail.terms || '', status: detail.status || 'draft', amountPaid: detail.amountPaid || 0, balanceDue: detail.balanceDue !== undefined ? detail.balanceDue : detail.grandTotal, notes: detail.notes ?? '',
        items: detail.items?.length ? detail.items.map((i: any) => ({ productId: i.productId ?? null, description: i.description, unit: i.unit || 'Nos', quantity: i.quantity, unitPrice: i.unitPrice })) : [blankLine()]
      });
      const client = clients.find(c => String(c.id) === String(detail.clientId));
      if (client) setClientSearch(client.displayName);
      setActiveTab('studio');
    } catch (e: any) { notify('Unable to retrieve document data.', 'error'); }
  }

  async function convertToInvoice(quote: Invoice) {
    try {
      const res = await loadInvoice(quote.id); const detail = res.data;
      const seqRes = await loadNextSequence(String(detail.clientId), 'invoice');
      
      setActiveInvoice(null);
      setInvoiceDraft({
        clientId: detail.clientId, invoiceNumber: seqRes.data.invoiceNumber, invoiceSequence: seqRes.data.nextSequence, invoiceDate: todayIso(), 
        recordType: 'invoice', status: 'draft', amountPaid: 0, balanceDue: detail.grandTotal, notes: detail.notes ?? '',
        items: detail.items?.length ? detail.items.map((i: any) => ({ productId: i.productId ?? null, description: i.description, unit: i.unit || 'Nos', quantity: i.quantity, unitPrice: i.unitPrice })) : [blankLine()]
      });
      const client = clients.find(c => String(c.id) === String(detail.clientId));
      if (client) setClientSearch(client.displayName);
      setActiveTab('studio'); notify(`Quotation transferred to Invoice Studio.`, 'success');
    } catch (e: any) { notify('Error during conversion process.', 'error'); }
  }

  async function togglePaymentStatus(invoice: Invoice) {
    setBusy(true);
    try {
      const isPaid = invoice.status === 'paid';
      const newStatus = isPaid ? 'sent' : 'paid'; 
      const newAmountPaid = isPaid ? 0 : invoice.grandTotal;
      const newBalanceDue = isPaid ? invoice.grandTotal : 0;

      await updateInvoice(invoice.id, {
        status: newStatus, amountPaid: newAmountPaid, balanceDue: newBalanceDue, updatedAt: new Date().toISOString()
      });
      
      await refreshAll();
      notify(isPaid ? 'Invoice marked as Unpaid.' : 'Invoice marked as Fully Paid!', 'success');
    } catch (error) { notify('Failed to update ledger status.', 'error'); } 
    finally { setBusy(false); }
  }

  async function shareOnWhatsApp(invoice: Invoice) {
    setBusy(true);
    try {
      const response = await loadInvoice(invoice.id);
      const detail = response.data as any;
      const client = clients.find(c => String(c.id) === String(detail.clientId));

      notify('Step 1: Downloading PDF...', 'info');
      // Pass the specially formatted DD-MM-YYYY date to PDF generator!
      const { downloadInvoicePdf } = await import('./lib/pdf');
      await downloadInvoicePdf({ 
        client: client || null, invoice: detail, draftItems: detail.items || [], 
        invoiceNumber: detail.invoiceNumber || 'DRAFT', 
        invoiceDate: formatDisplayDate(detail.invoiceDate), 
        notes: detail.notes || '', recordType: detail.recordType || 'invoice', terms: detail.terms || '' 
      });

      let phone = client?.phone || '';
      if (phone.startsWith('0')) phone = '92' + phone.slice(1);
      phone = phone.replace(/[^0-9]/g, '');

      const typeLabel = detail.recordType === 'quotation' ? 'Quotation' : 'Invoice';
      let text = `*HST ENTERPRISES*\n\nHello *${detail.clientName}*,\n\nHere are the details for your recent ${typeLabel}:\n\n*${typeLabel.toUpperCase()} NO:* ${detail.invoiceNumber}\n*DATE:* ${formatDisplayDate(detail.invoiceDate)}\n*GRAND TOTAL:* Rs ${money(detail.grandTotal)}\n`;
      
      if (detail.recordType !== 'quotation') {
        text += `*BALANCE DUE:* Rs ${money(detail.balanceDue !== undefined ? detail.balanceDue : detail.grandTotal)}\n`;
      }
      
      text += `\n_Please find the attached PDF document for complete details._\n\nThank you for your business!`;

      const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      
      setTimeout(() => {
        window.open(url, '_blank', 'noopener,noreferrer');
        notify('Step 2: WhatsApp opened. Drag your downloaded PDF into the chat!', 'success');
      }, 1000);

    } catch (error) { notify('Failed to prepare WhatsApp sharing', 'error'); } 
    finally { setBusy(false); }
  }

  async function removeInvoice(id: string) { if (!window.confirm('WARNING: This will permanently delete this record. Proceed?')) return; setBusy(true); try { await deleteInvoice(id); await refreshAll(); notify('Record securely deleted.', 'success'); } catch (e) { notify('Error deleting record.', 'error'); } finally { setBusy(false); } }
  async function removeClient(id: string) { if (!window.confirm('Delete this client? Existing invoice history will be retained.')) return; try { await deleteClient(id); await refreshAll(); notify('Client removed from directory.', 'success'); } catch (e) { notify('Error deleting client.', 'error'); } }
  async function removeProduct(id: string) { if (!window.confirm('Delete this product from catalog?')) return; try { await deleteProduct(id); await refreshAll(); notify('Product removed.', 'success'); } catch (e) { notify('Error deleting product.', 'error'); } }
  
  function startEditClient(client: Client) { setClientForm({ purchaserName: client.purchaserName ?? '', displayName: client.displayName, clientCode: client.clientCode, businessName: client.businessName ?? '', phone: client.phone ?? '', email: client.email ?? '', billingAddress: client.billingAddress ?? '', notes: client.notes ?? '', isActive: client.isActive }); setEditingClientId(client.id); }
  function startEditProduct(product: Product) { setProductForm({ productName: product.productName, description: product.description ?? '', defaultPrice: String(product.defaultPrice), isActive: product.isActive }); setEditingProductId(product.id); }

  async function handlePdfAction(invoice: Invoice | InvoiceDraft, action: 'view' | 'download') {
    setBusy(true);
    try {
      let finalDoc = invoice;
      if (invoice.id) {
        const res = await loadInvoice(invoice.id); 
        finalDoc = res.data as any;
      }
      const client = clients.find(c => String(c.id) === String(finalDoc.clientId)) || null;
      
      // Formatting date before sending to PDF generator
      const params = { 
        client: client, 
        invoice: finalDoc as any, 
        draftItems: finalDoc.items || [], 
        invoiceNumber: finalDoc.invoiceNumber || 'DRAFT', 
        invoiceDate: formatDisplayDate(finalDoc.invoiceDate), 
        notes: finalDoc.notes || '', 
        recordType: finalDoc.recordType || 'invoice', 
        terms: finalDoc.terms || '' 
      };
      
      const { downloadInvoicePdf, viewInvoicePdf } = await import('./lib/pdf');
      if (action === 'view') await viewInvoicePdf(params as any); 
      else await downloadInvoicePdf(params as any);
    } catch (e) { notify('PDF Generation Error', 'error'); } 
    finally { setBusy(false); }
  }

  if (authChecking) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="w-10 h-10 border-4 border-[#232361] border-t-transparent rounded-full animate-spin"></div></div>;
  
  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">
        <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-2xl shadow-slate-300/50 border border-white">
          <div className="flex flex-col items-center mb-10">
            <img src="/HST_logo.png" alt="Logo" className="h-24 w-auto mb-6 drop-shadow-md hover:scale-105 transition-transform duration-300" />
            <h1 className="text-3xl font-black text-[#790E13] tracking-tight">HST ENTERPRISES</h1>
            <p className="text-xs font-bold tracking-[0.3em] text-[#232361] uppercase mt-2 opacity-80">Cloud ERP System</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            {loginError && <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-bold text-center border border-rose-200 animate-pulse">{loginError}</div>}
            <div className="space-y-1">
               <label htmlFor="portal-email" className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Admin Email</label>
               <input id="portal-email" autoComplete="username" type="email" placeholder="admin@hst.com" className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-5 py-4 text-sm font-medium outline-none transition-all focus:border-[#232361] focus:bg-white" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
            </div>
            <div className="space-y-1">
               <label htmlFor="portal-password" className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Master Password</label>
               <input id="portal-password" autoComplete="current-password" type="password" placeholder="••••••••" className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-5 py-4 text-sm font-medium outline-none transition-all focus:border-[#232361] focus:bg-white" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
            </div>
            <button disabled={busy} className="w-full bg-gradient-to-r from-[#232361] to-[#1a1a45] text-white px-5 py-4 rounded-xl font-bold mt-4 shadow-lg shadow-[#232361]/30 hover:shadow-[#232361]/50 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:transform-none">
              {busy ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>
          <a href="/" className="mt-6 block py-3 text-center text-sm font-semibold text-[#232361] hover:underline">← Back to company website</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/50 px-4 py-8 text-slate-800 sm:px-6 lg:px-8 font-sans selection:bg-[#790E13] selection:text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* PREMIUM HEADER */}
        <header className="bg-white rounded-3xl p-6 md:px-10 shadow-sm border border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-6 backdrop-blur-xl">
          <div className="flex items-center gap-6">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
               <img src="/HST_logo.png" alt="Logo" className="h-14 w-auto object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#790E13] to-[#b0141c]">HST ENTERPRISES</h1>
              <p className="text-xs font-bold tracking-[0.25em] text-[#232361] uppercase mt-1">Enterprise Resource Planning</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => { resetInvoice(); setActiveTab('studio'); }} className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#790E13] to-[#9a1218] text-white text-sm font-bold shadow-lg shadow-[#790E13]/20 hover:shadow-[#790E13]/40 hover:-translate-y-0.5 transition-all duration-300">
              + New Document
            </button>
            <button onClick={handleLogout} className="px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-bold hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50 transition-all duration-300">
              Sign Out
            </button>
          </div>
        </header>

        {/* NAVIGATION TABS */}
        <nav className="flex overflow-x-auto gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200/60 hide-scrollbar">
          {[{ id: 'dashboard', label: '📊 Dashboard' }, { id: 'clients', label: '👥 Directory & Ledger' }, { id: 'catalog', label: '📦 Product Catalog' }, { id: 'studio', label: '📝 Document Studio' }, { id: 'history', label: '📚 Records Vault' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)} className={`whitespace-nowrap px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === tab.id ? 'bg-[#232361] text-white shadow-md scale-100' : 'text-slate-500 hover:bg-slate-100 hover:text-[#232361] scale-95 hover:scale-100'}`}>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* --- 1. THE ANALYTICS DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-gradient-to-br from-[#232361] to-[#1a1a45] rounded-3xl p-8 text-white shadow-xl shadow-[#232361]/20 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                <p className="text-white/70 font-bold uppercase tracking-widest text-xs flex items-center justify-between">Total Billed Revenue <span className="bg-white/10 px-2.5 py-1 rounded-md text-[9px] backdrop-blur-md border border-white/10">INVOICES ONLY</span></p>
                <h3 className="text-4xl font-black mt-3 tracking-tight">Rs {money(totalRevenue)}</h3>
                <p className="text-white/60 text-sm mt-5 font-medium">Lifetime invoiced value</p>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-8 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                <p className="text-white/90 font-bold uppercase tracking-widest text-xs flex items-center gap-3">Total Collected Cash <span className="bg-white/20 px-2.5 py-1 rounded-md text-[9px] backdrop-blur-md border border-white/20">PAID</span></p>
                <h3 className="text-4xl font-black mt-3 tracking-tight">Rs {money(totalCollected)}</h3>
                <p className="text-white/80 text-sm mt-5 font-medium">Cash physically in hand</p>
              </div>
              
              <div className="bg-gradient-to-br from-[#790E13] to-[#9a1218] rounded-3xl p-8 text-white shadow-xl shadow-[#790E13]/20 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                <p className="text-white/90 font-bold uppercase tracking-widest text-xs flex items-center gap-3">Pending Receivables <span className="bg-white/20 px-2.5 py-1 rounded-md text-[9px] backdrop-blur-md border border-white/20">UNPAID</span></p>
                <h3 className="text-4xl font-black mt-3 tracking-tight">Rs {money(totalPendingReceivables)}</h3>
                <p className="text-white/80 text-sm mt-5 font-medium">Cash outstanding in market</p>
              </div>

            </div>
            
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-200/60">
              <div className="flex justify-between items-end mb-8">
                 <div>
                    <h3 className="text-xl font-black text-[#232361]">Revenue Trajectory</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">Confirmed sales performance over the last 6 months</p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">This Month</p>
                    <p className="text-2xl font-black text-[#790E13]">Rs {money(currentMonthRevenue)}</p>
                 </div>
              </div>
              
              {monthlyChartData && monthlyChartData.length > 0 ? (
                <div className="grid grid-cols-6 gap-3 md:gap-6 items-end pt-8 px-2 h-80 border-b-2 border-slate-100">
                  {monthlyChartData.map((data, idx) => (
                    <div key={idx} className="flex flex-col items-center justify-end h-full group pb-3 relative">
                      <span className="absolute -top-8 text-[10px] md:text-xs font-black text-[#790E13] opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-2 whitespace-nowrap bg-rose-50 px-2 py-1 rounded border border-rose-100 z-10 shadow-sm">Rs {money(data.value)}</span>
                      <div className="w-full bg-slate-50 border border-slate-100 rounded-t-2xl flex items-end justify-center overflow-hidden h-56 relative">
                        <div className="w-full bg-gradient-to-t from-[#232361] to-[#3a3a8a] rounded-t-xl transition-all duration-700 ease-out group-hover:from-[#790E13] group-hover:to-[#b0141c]" style={{ height: `${Math.max(data.heightPercent || 0, 3)}%` }}>
                           <div className="absolute inset-0 bg-white/10 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                      </div>
                      <span className="text-[10px] md:text-xs font-bold text-slate-500 mt-4 tracking-tight uppercase">{data.label}</span>
                    </div>
                  ))}
                </div>
              ) : (<div className="h-72 flex items-center justify-center text-slate-400 font-bold bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">No monthly sales data detected yet.</div>)}
            </div>
          </div>
        )}

        {/* --- 2. CLIENT DIRECTORY & LEDGER --- */}
        {activeTab === 'clients' && (
          <div className="grid gap-8 lg:grid-cols-[1.2fr_2fr] animate-in fade-in slide-in-bottom-4 duration-500">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60 h-fit sticky top-6">
              <h2 className="text-2xl font-black text-[#232361] mb-8 flex items-center gap-3"><span className="bg-blue-50 text-blue-600 p-2 rounded-lg text-lg">👤</span> {editingClientId ? 'Edit Client Profile' : 'Onboard New Client'}</h2>
              <form className="space-y-4" onSubmit={saveClient}>
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 mb-1 block">Display Name *</label>
                   <input className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold outline-none focus:border-[#232361] focus:bg-white transition-colors" placeholder="e.g. Pakistan Tiles" value={clientForm.displayName} onChange={e => setClientForm(c => ({...c, displayName: e.target.value}))} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 mb-1 block">Prefix Code *</label>
                     <input className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold outline-none focus:border-[#232361] focus:bg-white transition-colors" placeholder="e.g. PT" value={clientForm.clientCode} onChange={e => setClientForm(c => ({...c, clientCode: e.target.value}))} required />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 mb-1 block">Contact Person</label>
                     <input className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold outline-none focus:border-[#232361] focus:bg-white transition-colors" placeholder="e.g. Mr. Azhar" value={clientForm.purchaserName} onChange={e => setClientForm(c => ({...c, purchaserName: e.target.value}))} />
                  </div>
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 mb-1 block">Official Business Name</label>
                   <input className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold outline-none focus:border-[#232361] focus:bg-white transition-colors" placeholder="Legal company name..." value={clientForm.businessName} onChange={e => setClientForm(c => ({...c, businessName: e.target.value}))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 mb-1 block">WhatsApp / Phone</label>
                     <input className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold outline-none focus:border-[#232361] focus:bg-white transition-colors" placeholder="03001234567" value={clientForm.phone} onChange={e => setClientForm(c => ({...c, phone: e.target.value}))} />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 mb-1 block">Email</label>
                     <input className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold outline-none focus:border-[#232361] focus:bg-white transition-colors" placeholder="info@client.com" value={clientForm.email} onChange={e => setClientForm(c => ({...c, email: e.target.value}))} />
                  </div>
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 mb-1 block">Billing Address</label>
                   <textarea className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold outline-none focus:border-[#232361] focus:bg-white transition-colors min-h-[100px]" placeholder="Complete address..." value={clientForm.billingAddress} onChange={e => setClientForm(c => ({...c, billingAddress: e.target.value}))} />
                </div>
                
                <div className="pt-4">
                   <button disabled={busy} className="w-full rounded-xl bg-gradient-to-r from-[#232361] to-[#1a1a45] px-4 py-4 text-sm font-black text-white shadow-lg shadow-[#232361]/20 hover:-translate-y-0.5 transition-all duration-300">Save Client Profile</button>
                   {editingClientId && <button type="button" onClick={() => {setEditingClientId(null); setClientForm(emptyClientForm);}} className="w-full mt-3 rounded-xl border-2 border-slate-200 text-slate-600 px-4 py-3.5 text-sm font-bold hover:bg-slate-50 transition-colors">Cancel Edit</button>}
                </div>
              </form>
            </div>
            
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                   <h2 className="text-2xl font-black text-[#232361]">Client Ledger</h2>
                   <p className="text-sm font-medium text-slate-500 mt-1">{clients.length} Active Accounts</p>
                </div>
                <input className="w-full md:w-64 rounded-xl border-2 border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold outline-none focus:border-[#232361] focus:bg-white transition-colors" placeholder="Search directory..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
              </div>
              
              <div className="grid gap-5">
                {filteredClients.map(client => {
                  const stats = clientStats[String(client.id)] || { billed: 0, paid: 0, balance: 0 };
                  const hasBalance = stats.balance > 0;

                  return (
                  <div key={client.id} className="group border-2 border-slate-100 bg-white shadow-sm hover:shadow-xl hover:shadow-slate-200/40 p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:border-blue-100 relative overflow-hidden">
                    {hasBalance && (
                       <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl shadow-sm">Owes Cash</div>
                    )}
                    
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                           <h3 className="font-black text-xl text-[#232361]">{client.displayName}</h3>
                           <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider">{client.clientCode}</span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                           <span>👤 {client.purchaserName || client.businessName || 'No Contact Person'}</span>
                           {client.phone && <span>📞 {client.phone}</span>}
                        </p>
                      </div>
                    </div>
                    
                    {/* --- THE LEDGER SUMMARY --- */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mt-2 mb-5">
                       <div className="grid grid-cols-3 gap-2 divide-x divide-slate-200">
                          <div className="text-center">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Billed</p>
                             <p className="text-sm font-black text-[#232361]">Rs {money(stats.billed)}</p>
                          </div>
                          <div className="text-center">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Paid</p>
                             <p className="text-sm font-black text-emerald-600">Rs {money(stats.paid)}</p>
                          </div>
                          <div className="text-center">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Balance Due</p>
                             <p className={`text-sm font-black ${hasBalance ? 'text-rose-600' : 'text-slate-400'}`}>Rs {money(stats.balance)}</p>
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => {startEditClient(client); window.scrollTo({top:0, behavior:'smooth'});}} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-xs font-black hover:bg-slate-200 hover:text-slate-900 transition-colors uppercase tracking-wider">Edit Profile</button>
                      <button onClick={() => removeClient(String(client.id))} className="flex-none px-4 bg-rose-50 text-rose-600 py-2.5 rounded-xl text-xs font-black hover:bg-rose-500 hover:text-white transition-colors">DEL</button>
                    </div>
                  </div>
                )})}
                {filteredClients.length === 0 && <div className="py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-2xl">No clients found in directory.</div>}
              </div>
            </div>
          </div>
        )}

        {/* --- PRODUCT CATALOG --- */}
        {activeTab === 'catalog' && (
          <div className="grid gap-8 lg:grid-cols-[1.2fr_2fr] animate-in fade-in slide-in-bottom-4 duration-500">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60 h-fit sticky top-6">
              <h2 className="text-2xl font-black text-[#232361] mb-8 flex items-center gap-3"><span className="bg-emerald-50 text-emerald-600 p-2 rounded-lg text-lg">📦</span> {editingProductId ? 'Edit Item' : 'Add Inventory Item'}</h2>
              <form className="space-y-4" onSubmit={saveProduct}>
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 mb-1 block">Item Name *</label>
                   <input className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold outline-none focus:border-[#232361] focus:bg-white transition-colors" placeholder="e.g. Capacitor 50KVAR" value={productForm.productName} onChange={e => setProductForm(c => ({...c, productName: e.target.value}))} required />
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 mb-1 block">Technical Description</label>
                   <textarea className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold outline-none focus:border-[#232361] focus:bg-white transition-colors min-h-[100px]" placeholder="Specs, unit details, etc..." value={productForm.description} onChange={e => setProductForm(c => ({...c, description: e.target.value}))} />
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 mb-1 block">Default Rate (Rs) *</label>
                   <input className="w-full rounded-xl border-2 border-slate-200 bg-emerald-50/50 px-4 py-3.5 text-lg font-black text-emerald-900 outline-none focus:border-emerald-500 focus:bg-emerald-50 transition-colors" type="number" step="0.01" placeholder="0.00" value={productForm.defaultPrice} onChange={e => setProductForm(c => ({...c, defaultPrice: e.target.value}))} required />
                </div>
                <div className="pt-4">
                   <button disabled={busy} className="w-full rounded-xl bg-gradient-to-r from-[#232361] to-[#1a1a45] px-4 py-4 text-sm font-black text-white shadow-lg shadow-[#232361]/20 hover:-translate-y-0.5 transition-all duration-300">Save to Catalog</button>
                   {editingProductId && <button type="button" onClick={() => {setEditingProductId(null); setProductForm(emptyProductForm);}} className="w-full mt-3 rounded-xl border-2 border-slate-200 text-slate-600 px-4 py-3.5 text-sm font-bold hover:bg-slate-50 transition-colors">Cancel Edit</button>}
                </div>
              </form>
            </div>
            
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                   <h2 className="text-2xl font-black text-[#232361]">Master Catalog</h2>
                   <p className="text-sm font-medium text-slate-500 mt-1">{products.length} Items Listed</p>
                </div>
                <input className="w-full md:w-64 rounded-xl border-2 border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold outline-none focus:border-[#232361] focus:bg-white transition-colors" placeholder="Search inventory..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredProducts.map(product => (
                  <div key={product.id} className="group border-2 border-slate-100 bg-white shadow-sm hover:shadow-xl hover:shadow-slate-200/40 p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:border-emerald-100">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                         <h3 className="font-black text-lg text-[#232361] leading-tight pr-2">{product.productName}</h3>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mb-4 line-clamp-2 min-h-[32px]">{product.description || 'No description provided.'}</p>
                      <div className="inline-block bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-black tracking-wide">Rs {money(product.defaultPrice)}</div>
                    </div>
                    <div className="flex gap-2 mt-5 pt-5 border-t border-slate-100">
                      <button onClick={() => {startEditProduct(product); window.scrollTo({top:0, behavior:'smooth'});}} className="flex-1 bg-slate-50 text-slate-700 py-2 rounded-xl text-xs font-black hover:bg-slate-200 transition-colors uppercase">Edit</button>
                      <button onClick={() => removeProduct(String(product.id))} className="flex-none px-4 bg-rose-50 text-rose-600 py-2 rounded-xl text-xs font-black hover:bg-rose-500 hover:text-white transition-colors">DEL</button>
                    </div>
                  </div>
                ))}
                {filteredProducts.length === 0 && <div className="col-span-full py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-2xl">No products found in catalog.</div>}
              </div>
            </div>
          </div>
        )}

        {/* --- DOCUMENT STUDIO --- */}
        {activeTab === 'studio' && (
          <article className="bg-white rounded-3xl p-6 md:p-12 shadow-xl shadow-slate-200/40 border border-slate-200/60 max-w-5xl mx-auto animate-in fade-in slide-in-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-slate-100 pb-6 mb-8 gap-6">
               <div>
                 <h2 className="text-3xl font-black text-[#232361] tracking-tight">{activeInvoice ? 'Edit Record' : 'Document Studio'}</h2>
                 
                 {!activeInvoice && (
                   <div className="flex bg-slate-100 p-1.5 rounded-xl mt-3 w-fit shadow-inner border border-slate-200/50">
                     <button type="button" onClick={() => handleRecordTypeToggle('invoice')} className={`px-6 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all duration-300 ${invoiceDraft.recordType === 'invoice' ? 'bg-gradient-to-r from-[#232361] to-[#3a3a8a] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Tax Invoice</button>
                     <button type="button" onClick={() => handleRecordTypeToggle('quotation')} className={`px-6 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all duration-300 ${invoiceDraft.recordType === 'quotation' ? 'bg-gradient-to-r from-[#790E13] to-[#b0141c] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Quotation</button>
                   </div>
                 )}
                 {activeInvoice && (
                   <span className={`inline-block mt-3 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm ${invoiceDraft.recordType === 'quotation' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>Mode: Editing {invoiceDraft.recordType}</span>
                 )}
               </div>

               <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 shadow-inner">
                  {['draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled'].map(stat => (
                    <button 
                      key={stat} type="button"
                      onClick={() => handleStatusClick(stat)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${invoiceDraft.status === stat ? 'bg-white text-[#232361] shadow-sm border border-slate-200 scale-105' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'}`}
                    >
                      {stat}
                    </button>
                  ))}
               </div>
            </div>

            <form className="space-y-8" onSubmit={saveInvoice}>
              
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-6">
                 <div className="relative z-20">
                   <label className="flex items-center gap-2 text-xs font-black text-[#232361] uppercase tracking-widest mb-3">
                      <span className="bg-[#232361] text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span> Client Details
                   </label>
                   <input className="w-full rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 text-sm font-bold outline-none focus:border-[#232361] transition-colors shadow-sm" placeholder="Search and select a client from directory..." value={clientSearch} onFocus={() => setShowClientDropdown(true)} onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)} onChange={e => setClientSearch(e.target.value)} />
                   {showClientDropdown && clientSearch && filteredClients.length > 0 && (
                     <div className="absolute mt-2 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl max-h-64 z-50">
                       {filteredClients.map(c => (
                         <button key={c.id} type="button" className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left hover:bg-blue-50 transition-colors" onMouseDown={(e) => { e.preventDefault(); selectClient(c); setShowClientDropdown(false); }}>
                           <span className="font-black text-[#232361]">{c.displayName}</span>
                           <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{c.clientCode}</span>
                         </button>
                       ))}
                     </div>
                   )}
                 </div>

                 <div className="grid sm:grid-cols-2 gap-6 pt-2">
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 pl-1">Document Number</label>
                     <input className="w-full rounded-2xl border-2 border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-[#790E13] outline-none focus:border-[#232361] transition-colors shadow-sm" value={invoiceDraft.invoiceNumber} onChange={e => setInvoiceDraft(c => ({ ...c, invoiceNumber: e.target.value }))} placeholder="Auto-generated..." />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 pl-1">Issue Date (YYYY-MM-DD)</label>
                     <input className="w-full rounded-2xl border-2 border-slate-200 bg-white px-5 py-3.5 text-sm font-bold outline-none focus:border-[#232361] transition-colors shadow-sm" type="date" value={invoiceDraft.invoiceDate} onChange={e => setInvoiceDraft(c => ({ ...c, invoiceDate: e.target.value }))} />
                     <p className="text-[10px] font-bold text-slate-400 ml-1 mt-1">Calendar requires this format, but PDFs will show DD-MM-YYYY</p>
                   </div>
                 </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-black text-[#232361] uppercase tracking-widest mb-4 pl-2">
                   <span className="bg-[#232361] text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span> Line Items
                </label>
                <div className="space-y-4">
                  {invoiceDraft.items.map((item: any, index) => (
                    <div key={index} className="rounded-3xl border-2 border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all flex flex-col lg:flex-row gap-3 relative z-10 group">
                      <div className="flex-1 relative">
                        <input className="w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white px-4 py-3.5 text-sm font-bold outline-none focus:border-[#232361] transition-colors" placeholder="Type description or search catalog..." value={item.description} onFocus={() => setActiveRowIndex(index)} onBlur={() => setTimeout(() => setActiveRowIndex(null), 200)} onChange={e => { updateItem(index, { description: e.target.value, productId: null }); setProductSearch(e.target.value); }} />
                        {activeRowIndex === index && productSearch && filteredProducts.length > 0 && (
                          <div className="absolute mt-2 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl max-h-56 z-50">
                            {filteredProducts.map(p => (
                              <button key={p.id} type="button" className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left hover:bg-emerald-50 transition-colors" onMouseDown={(e) => { e.preventDefault(); selectProduct(index, p); setActiveRowIndex(null); }}>
                                <span className="font-bold text-[#232361]">{p.productName}</span>
                                <span className="text-xs font-black text-emerald-700 bg-emerald-100/50 px-2 py-1 rounded">Rs {money(p.defaultPrice)}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                         <select className="w-24 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white px-3 py-3.5 text-sm font-black text-slate-600 outline-none focus:border-[#232361] transition-colors" value={item.unit || 'Nos'} onChange={e => updateItem(index, { unit: e.target.value })}>
                           <option value="Nos">Nos</option><option value="Box">Box</option><option value="Meter">Meter</option><option value="Yard">Yard</option><option value="Length">Length</option><option value="Coil">Coil</option><option value="Pkt">Pkt</option><option value="Ft">Ft</option>
                         </select>
                         <input className="w-24 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white px-4 py-3.5 text-sm font-black outline-none text-center focus:border-[#232361] transition-colors" type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(index, { quantity: Number(e.target.value) })} placeholder="Qty" />
                         <input className="w-32 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white px-4 py-3.5 text-sm font-black outline-none text-right focus:border-[#232361] transition-colors" type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(index, { unitPrice: Number(e.target.value) })} placeholder="Rate" />
                      </div>
                      <div className="flex gap-2">
                         <div className="flex-1 lg:w-40 rounded-xl bg-gradient-to-r from-slate-100 to-slate-200 border border-slate-200 px-4 py-3.5 text-sm font-black text-[#232361] text-right flex items-center justify-end">Rs {money(Number(item.quantity || 0) * Number(item.unitPrice || 0))}</div>
                         <button type="button" className="w-12 lg:w-12 rounded-xl bg-rose-50 text-rose-500 font-black hover:bg-rose-500 hover:text-white transition-colors flex items-center justify-center" onClick={() => removeItem(index)}>X</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" className="mt-4 w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-100 px-4 py-4 text-sm font-black text-slate-500 hover:text-[#232361] hover:border-[#232361]/50 transition-all duration-300" onClick={addItem}>+ Add Another Row</button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-xs font-black text-[#232361] uppercase tracking-widest mb-3 pl-2">
                     <span className="bg-[#232361] text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">3</span> Additional Notes
                  </label>
                  <textarea className="min-h-[120px] w-full rounded-2xl border-2 border-slate-200 bg-slate-50 hover:bg-white focus:bg-white px-5 py-4 text-sm font-medium outline-none focus:border-[#232361] transition-colors shadow-sm" placeholder="Client specific notes, project details..." value={invoiceDraft.notes} onChange={e => setInvoiceDraft(c => ({ ...c, notes: e.target.value }))} />
                </div>
                {invoiceDraft.recordType === 'quotation' && (
                  <div>
                    <label className="flex items-center gap-2 text-xs font-black text-[#232361] uppercase tracking-widest mb-3 pl-2">
                       <span className="bg-[#232361] text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">4</span> Terms & Conditions
                    </label>
                    <textarea className="min-h-[120px] w-full rounded-2xl border-2 border-slate-200 bg-slate-50 hover:bg-white focus:bg-white px-5 py-4 text-sm font-medium outline-none focus:border-[#232361] transition-colors shadow-sm" value={invoiceDraft.terms} onChange={e => setInvoiceDraft(c => ({ ...c, terms: e.target.value }))} />
                  </div>
                )}
              </div>

              {invoiceDraft.recordType === 'invoice' ? (
                <div className="rounded-3xl border-2 border-[#232361]/20 p-8 shadow-xl shadow-[#232361]/5 bg-gradient-to-br from-white to-slate-50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#232361]/5 rounded-full blur-3xl -mt-20 -mr-20"></div>
                  
                  <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                    <div className="w-full md:w-1/3">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 pl-1">Amount Paid (Rs)</label>
                      <input className="w-full rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-5 py-4 text-xl font-black outline-none text-emerald-800 focus:border-emerald-500 focus:bg-white transition-colors shadow-inner" type="number" min="0" step="0.01" value={invoiceDraft.amountPaid} onChange={e => setInvoiceDraft(c => ({ ...c, amountPaid: Number(e.target.value) }))} />
                    </div>
                    <div className="w-full md:w-2/3 flex flex-col items-end text-right">
                       <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-widest">Subtotal: Rs {money(subtotal)}</p>
                       <div className="text-4xl md:text-5xl font-black text-[#790E13] tracking-tighter drop-shadow-sm">
                          <span className="text-sm font-black text-[#790E13] uppercase tracking-widest mr-4 opacity-80 inline-block align-middle">Balance Due</span> 
                          Rs {money(balanceDue)}
                       </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl bg-gradient-to-r from-[#790E13] to-[#9a1218] p-8 text-white shadow-xl shadow-[#790E13]/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mt-20 -mr-20"></div>
                  <div className="flex flex-col md:flex-row justify-between items-center relative z-10 gap-4">
                    <span className="text-sm font-bold uppercase tracking-widest opacity-80">Quotation Grand Total</span>
                    <span className="text-4xl md:text-5xl font-black tracking-tighter">Rs {money(subtotal)}</span>
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-3 gap-4 pt-6 border-t-2 border-slate-100">
                <button disabled={busy} className="rounded-2xl bg-gradient-to-r from-[#232361] to-[#1a1a45] px-6 py-4 text-sm font-black text-white shadow-xl shadow-[#232361]/20 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:transform-none">
                  {activeInvoice ? `Update ${invoiceDraft.recordType}` : `Save & Lock ${invoiceDraft.recordType}`}
                </button>
                <button type="button" disabled={!currentClient} className="rounded-2xl border-2 border-[#232361] bg-white px-6 py-4 text-sm font-black text-[#232361] hover:bg-slate-50 shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-50" onClick={() => handlePdfAction(invoiceDraft, 'view')}>
                  Preview Document
                </button>
                <button type="button" disabled={!currentClient} className="rounded-2xl border-2 border-[#232361] bg-[#232361] text-white px-6 py-4 text-sm font-black shadow-lg shadow-[#232361]/20 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:transform-none" onClick={() => handlePdfAction(invoiceDraft, 'download')}>
                  Download PDF
                </button>
              </div>
            </form>
          </article>
        )}

        {/* --- RECORDS VAULT (HISTORY) --- */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60 animate-in fade-in slide-in-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
              <div className="flex flex-col gap-4 w-full md:w-auto">
                <div>
                   <h2 className="text-2xl font-black text-[#232361]">Records Vault</h2>
                   <p className="text-sm font-medium text-slate-500 mt-1">{filteredInvoices.length} Documents Found</p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/50 shadow-inner w-fit">
                  {['all', 'invoice', 'quotation'].map(f => (
                    <button key={f} onClick={() => setHistoryFilter(f as any)} className={`px-5 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all duration-300 ${historyFilter === f ? 'bg-white text-[#232361] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{f}</button>
                  ))}
                </div>
              </div>
              <input className="w-full md:w-80 rounded-2xl border-2 border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-bold outline-none focus:border-[#232361] focus:bg-white transition-colors" placeholder="Search by number, client, or status..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} />
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredInvoices.map(invoice => (
                <div key={invoice.id} className={`group border-2 ${invoice.recordType === 'quotation' ? 'border-purple-100 bg-purple-50/20' : 'border-slate-100 bg-white'} shadow-sm hover:shadow-xl hover:shadow-slate-200/40 p-6 rounded-3xl flex flex-col justify-between transition-all duration-300 relative overflow-hidden`}>
                  
                  <div className={`absolute top-0 right-0 px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-bl-2xl shadow-sm ${getStatusColor(invoice.status || 'draft', invoice.recordType || 'invoice')}`}>
                    {invoice.recordType === 'quotation' ? 'Quotation' : (invoice.status || 'draft')}
                  </div>

                  <div>
                    <div className="flex justify-between items-start mb-3 mt-1">
                      <div>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${invoice.recordType === 'quotation' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {invoice.invoiceNumber || 'DRAFT'}
                        </span>
                        <h3 className="mt-3 text-xl font-black text-[#232361] line-clamp-1">{invoice.clientName || 'Unknown Client'}</h3>
                        <p className="text-xs text-slate-500 font-bold mt-1 tracking-wide">{formatDisplayDate(invoice.invoiceDate)} • {invoice.itemCount || invoice.items?.length || 0} Line Items</p>
                      </div>
                    </div>
                    
                    <div className="mt-5 pt-5 border-t-2 border-slate-100 flex justify-between items-end">
                      {invoice.recordType === 'quotation' ? (
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Value</p>
                            <p className="text-2xl font-black text-[#232361] tracking-tight">Rs {money(invoice.grandTotal)}</p>
                         </div>
                      ) : (
                        <>
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Grand Total</p>
                             <p className="text-xl font-black text-slate-800 tracking-tight">Rs {money(invoice.grandTotal)}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Balance Due</p>
                             <p className="text-2xl font-black text-[#790E13] tracking-tight">Rs {money(invoice.balanceDue !== undefined ? invoice.balanceDue : invoice.grandTotal)}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                     <div className="grid grid-cols-2 gap-2">
                       <button className="bg-slate-50 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-black hover:bg-slate-100 transition-colors uppercase tracking-wider" onClick={() => handlePdfAction(invoice, 'view')}>
                         View PDF
                       </button>
                       <button className="bg-[#25D366]/10 border border-[#25D366]/20 text-[#1da851] py-2.5 rounded-xl text-xs font-black hover:bg-[#25D366] hover:text-white transition-all uppercase tracking-wider" onClick={() => shareOnWhatsApp(invoice)}>
                         WhatsApp
                       </button>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-2">
                       {invoice.recordType === 'quotation' ? (
                         <button className="col-span-2 bg-gradient-to-r from-[#790E13] to-[#9a1218] text-white py-2.5 rounded-xl text-xs font-black shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all uppercase tracking-wider" onClick={() => convertToInvoice(invoice)}>
                           Convert to Invoice
                         </button>
                       ) : (
                         <button 
                           className={`col-span-2 py-2.5 rounded-xl text-xs font-black shadow-sm transition-all uppercase tracking-wider ${invoice.status === 'paid' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-md hover:-translate-y-0.5'}`} 
                           onClick={() => togglePaymentStatus(invoice)}
                         >
                           {invoice.status === 'paid' ? 'Mark Unpaid' : 'Mark as Paid'}
                         </button>
                       )}
                     </div>

                     <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                       <button className="bg-white border border-slate-200 text-slate-600 py-2 rounded-xl text-[10px] font-black hover:bg-slate-50 transition-colors uppercase tracking-widest" onClick={() => editInvoice(invoice)}>
                         Edit
                       </button>
                       <button className="bg-white border border-rose-100 text-rose-500 py-2 rounded-xl text-[10px] font-black hover:bg-rose-50 transition-colors uppercase tracking-widest" onClick={() => removeInvoice(String(invoice.id))}>
                         Delete
                       </button>
                     </div>
                  </div>

                </div>
              ))}
              {filteredInvoices.length === 0 && (
                <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                   <p className="text-slate-400 font-bold text-lg">No records found matching your criteria.</p>
                   <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or search term.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* --- TOAST NOTIFICATIONS --- */}
      <div className="fixed right-6 bottom-6 z-50 space-y-3 flex flex-col items-end">
        {toasts.map(entry => (
          <div key={entry.id} className={`rounded-2xl px-6 py-4 text-sm font-black shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right-8 fade-in duration-300 ${entry.tone === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : entry.tone === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-gradient-to-r from-[#232361] to-[#1a1a45] text-white border-[#232361]'}`}>
            {entry.tone === 'success' && <span className="text-emerald-500 text-lg">✓</span>}
            {entry.tone === 'error' && <span className="text-rose-500 text-lg">⚠</span>}
            {entry.tone === 'info' && <span className="text-blue-300 text-lg">ℹ</span>}
            {entry.message}
          </div>
        ))}
      </div>
    </main>
  );
}
