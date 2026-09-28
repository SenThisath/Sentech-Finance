export type Item = { description: string; detail: string; quantity: number; unit: string; rateCents: number };
export type Business = { name: string; address: string; phone: string; email: string; accountHolder: string; accountNumber: string; bank: string };
export type Invoice = { id: string; number: string; clientName: string; date: string; items: Item[]; discountCents: number; totalCents: number; status: 'draft' | 'issued' | 'void'; notes: string; business: Business; createdAt: number; updatedAt: number };
export type Kind = 'payment' | 'other_income' | 'expense' | 'owner_deposit' | 'owner_withdrawal';
export type Transaction = { id: string; kind: Kind; amountCents: number; date: string; description: string; category: string; method: string; invoiceId?: string; voidedAt?: number; voidReason?: string; createdAt: number };
export type Audit = { id: string; action: string; detail: string; at: number };
export type Snapshot = { invoices: Invoice[]; transactions: Transaction[]; business: Business; audit: Audit[] };
export type InvoiceInput = { clientName: string; date: string; items: Item[]; discountCents: number; notes: string; issue: boolean; paid: boolean; paymentMethod: string; requestId: string; draftId?: string };
export type TransactionInput = { kind: Kind; amountCents: number; date: string; description: string; category: string; method: string; invoiceId?: string; requestId: string };
export const BUSINESS: Business = { name: 'Sentech', address: '135, Kirindiwela Rd, Radawana', phone: '+94 71 054 8515', email: 'sen.thisathfernando@gmail.com', accountHolder: 'P S T FERNANDO', accountNumber: '214020018871', bank: 'HNB-VEYANGODA' };
export const TERMS = 'Payments are non-refundable.\nPlease use the invoice number as your payment reference and share the payment receipt after the transfer.\nAdditional work beyond the agreed scope will be quoted separately.';
export const KIND_LABEL: Record<Kind, string> = { payment: 'Invoice payment', other_income: 'Other income', expense: 'Business expense', owner_deposit: 'Owner deposit', owner_withdrawal: 'Owner withdrawal' };
export const isInflow = (k: Kind) => k === 'payment' || k === 'other_income' || k === 'owner_deposit';
export const isIncome = (k: Kind) => k === 'payment' || k === 'other_income';
export const money = (cents: number) => new Intl.NumberFormat('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
export const rupees = (cents: number) => `Rs. ${money(cents)}`;
export function today() { return new Date(Date.now() + 330 * 60 * 1000).toISOString().slice(0, 10); }
export function displayDate(date: string) { return new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
export function lineTotal(item: Item) { return Math.round(item.quantity * item.rateCents); }
export function invoiceTotal(items: Item[], discountCents = 0) { return items.reduce((a, i) => a + lineTotal(i), 0) - discountCents; }
export function received(invoiceId: string, tx: Transaction[]) { return tx.filter(t => t.invoiceId === invoiceId && !t.voidedAt && t.kind === 'payment').reduce((a, t) => a + t.amountCents, 0); }
export function status(invoice: Invoice, tx: Transaction[]) { if (invoice.status !== 'issued') return invoice.status; const paid = received(invoice.id, tx); return paid >= invoice.totalCents ? 'paid' : paid > 0 ? 'partial' : 'unpaid'; }
export function validateDate(date: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || date < '2000-01-01' || date > '2100-12-31') throw new Error('Enter a valid date between 2000 and 2100.'); }
export function validateAmount(value: number, allowZero = false) { if (!Number.isSafeInteger(value) || value < (allowZero ? 0 : 1) || value > 100_000_000_000) throw new Error('Enter a valid amount, up to Rs. 1 billion.'); }
export function validateInvoice(input: Pick<InvoiceInput, 'clientName' | 'date' | 'items' | 'discountCents' | 'notes'>) {
  if (!input.clientName.trim() || input.clientName.length > 150) throw new Error('Enter a client name (up to 150 characters).');
  validateDate(input.date);
  if (!input.items.length || input.items.length > 100) throw new Error('Add between 1 and 100 services.');
  for (const item of input.items) {
    if (!item.description.trim() || item.description.length > 200 || item.detail.length > 500) throw new Error('Each service needs a short description.');
    if (!['pages', 'design', 'project', 'hours', 'items', 'slides'].includes(item.unit)) throw new Error('Choose a valid unit.');
    if (!Number.isFinite(item.quantity) || item.quantity <= 0 || item.quantity > 100000 || Math.abs(item.quantity * 100 - Math.round(item.quantity * 100)) > 0.00001) throw new Error('Quantity must be positive, with at most two decimal places.');
    if (['pages', 'slides', 'items', 'design'].includes(item.unit) && !Number.isInteger(item.quantity)) throw new Error('Pages, slides, items and designs must use whole numbers.');
    validateAmount(item.rateCents, true);
    validateAmount(lineTotal(item), true);
  }
  validateAmount(input.discountCents, true);
  validateAmount(invoiceTotal(input.items, input.discountCents));
  if (input.notes.length > 3000) throw new Error('Keep notes below 3,000 characters.');
}
export function summarize(data: Snapshot, from: string, to: string) {
  const active = data.transactions.filter(t => !t.voidedAt && t.date <= to);
  const period = active.filter(t => t.date >= from);
  const sum = (rows: Transaction[]) => rows.reduce((a, t) => a + t.amountCents, 0);
  const income = sum(period.filter(t => isIncome(t.kind)));
  const expenses = sum(period.filter(t => t.kind === 'expense'));
  const outstanding = data.invoices.filter(i => i.status === 'issued' && i.date <= to).reduce((a, i) => a + Math.max(0, i.totalCents - received(i.id, active)), 0);
  return { income, expenses, earnings: income - expenses, cashIn: sum(period.filter(t => isInflow(t.kind))), cashOut: sum(period.filter(t => !isInflow(t.kind))), cash: active.reduce((a, t) => a + (isInflow(t.kind) ? t.amountCents : -t.amountCents), 0), outstanding, deposits: sum(period.filter(t => t.kind === 'owner_deposit')), withdrawals: sum(period.filter(t => t.kind === 'owner_withdrawal')), invoiced: data.invoices.filter(i => i.status === 'issued' && i.date >= from && i.date <= to).reduce((a, i) => a + i.totalCents, 0) };
}
export function csv(rows: (string | number)[][]) { return '\uFEFF' + rows.map(row => row.map(cell => { let value = String(cell); if (/^[=+@\-\t\r]/.test(value) && !/^-?\d+(\.\d+)?$/.test(value)) value = "'" + value; return '"' + value.replaceAll('"', '""') + '"'; }).join(',')).join('\r\n'); }
export function download(name: string, content: string, mime = 'text/csv;charset=utf-8') { const url = URL.createObjectURL(new Blob([content], { type: mime })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
