'use client';
import React, { createContext, useContext, useRef, useState } from 'react';
import { ConvexReactClient, ConvexProvider, useConvex, useQuery, useMutation, useConvexConnectionState } from 'convex/react';
import { LockKeyhole } from 'lucide-react';
import { Toaster } from 'sonner';
import { api } from '@/lib/api';
import { demoSnapshot } from '@/lib/demo';
import { invoiceTotal, received, today, validateAmount, validateDate, validateInvoice, type Snapshot, type InvoiceInput, type TransactionInput, type Business, type Invoice } from '@/lib/model';
type Store = { data: Snapshot; demo: boolean; connected: boolean; account: React.ReactNode; saveInvoice: (input: InvoiceInput)=>Promise<string>; recordTransaction:(input:TransactionInput)=>Promise<string>; voidInvoice:(id:string,reason:string)=>Promise<unknown>; reverseTransaction:(id:string,reason:string)=>Promise<unknown>; saveSettings:(business:Business)=>Promise<unknown>; resetDemo?:()=>void };
const Context = createContext<Store | null>(null);
export function useStore() { const store=useContext(Context); if(!store) throw new Error('Workspace unavailable'); return store; }
const url=process.env.NEXT_PUBLIC_CONVEX_URL;
const client = url ? new ConvexReactClient(url) : null;
export function Providers({ children }: { children: React.ReactNode }) {
  return <><Toaster position="bottom-right" richColors={false}/>{client ? <ConvexProvider client={client}><OwnerGate>{children}</OwnerGate></ConvexProvider> : <DemoProvider>{children}</DemoProvider>}</>;
}
class Boundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div className="auth-screen"><h1>Workspace locked or unavailable.</h1><p>Your owner password may have changed, or your database connection was interrupted.</p><button className="button primary" onClick={() => location.reload()}>Unlock again</button></div>;
    return this.props.children;
  }
}
function OwnerGate({ children }: { children: React.ReactNode }) {
  const convex = useConvex();
  const [password, setPassword] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function unlock(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try { await convex.query(api.snapshot, { password: draft }); setPassword(draft); setDraft(''); }
    catch { setError('Unable to unlock. Check your owner password, connection and database setup.'); }
    finally { setBusy(false); }
  }
  if (!password) return <div className="auth-screen"><div className="owner-unlock"><div className="unlock-icon"><LockKeyhole size={25}/></div><h1>Sentech Finance</h1><p>Your personal finance workspace.</p><form onSubmit={unlock}><label className="field"><span>Owner password</span><input type="password" autoComplete="current-password" required maxLength={256} value={draft} onChange={e => setDraft(e.target.value)} autoFocus placeholder="Enter your owner password"/></label>{error && <p className="error-message" role="alert">{error}</p>}<button className="button primary full" disabled={busy}>{busy ? 'Unlocking…' : 'Unlock workspace'}</button></form><p className="field-note">One owner. No account or registration.</p></div></div>;
  return <Boundary><LiveProvider password={password}>{children}</LiveProvider></Boundary>;
}
function LiveProvider({ children, password }: { children: React.ReactNode; password: string }) {
  const data = useQuery(api.snapshot, { password });
  const saveInvoice = useMutation(api.saveInvoice);
  const recordTransaction = useMutation(api.recordTransaction);
  const voidInvoice = useMutation(api.voidInvoice);
  const reverse = useMutation(api.reverseTransaction);
  const settings = useMutation(api.saveSettings);
  const connection = useConvexConnectionState();
  if (!data) return <div className="auth-screen"><div className="loader"/><p>Loading your finances…</p></div>;
  return <Context.Provider value={{ data, demo: false, connected: connection.isWebSocketConnected,
    account: <button className="avatar owner-lock" aria-label="Lock workspace" title="Lock workspace" onClick={() => location.reload()}><LockKeyhole size={16}/></button>,
    saveInvoice: input => saveInvoice({ ...input, password }),
    recordTransaction: input => recordTransaction({ ...input, password }),
    voidInvoice: (id, reason) => voidInvoice({ id, reason, password }),
    reverseTransaction: (id, reason) => reverse({ id, reason, password }),
    saveSettings: business => settings({ business, password })
  }}>{children}</Context.Provider>;
}
function DemoProvider({children}:{children:React.ReactNode}) {
 const [data,setData]=useState<Snapshot>(demoSnapshot);const ref=useRef(data);const done=useRef(new Map<string,string>());
 function commit(next:Snapshot,action:string,detail:string) { next.audit=[{id:crypto.randomUUID(),action,detail,at:Date.now()},...next.audit];ref.current=next;setData(next); }
 const store:Store={data,demo:true,connected:true,account:<span className="avatar">ST</span>,resetDemo:()=>{done.current.clear();const next=demoSnapshot();ref.current=next;setData(next)},
 async saveInvoice(input){if(done.current.has(input.requestId))return done.current.get(input.requestId)!;validateInvoice(input);if(input.paid&&input.date>today())throw new Error('A received payment cannot have a future date.');const state=ref.current;const existing=state.invoices.find(i=>i.id===input.draftId);if(input.draftId && existing?.status!=='draft')throw new Error('Only drafts can be edited.');const prefix='ST'+input.date.slice(2,4);const count=Math.max(0,...state.invoices.filter(i=>i.number.startsWith(prefix)).map(i=>Number(i.number.slice(prefix.length))||0))+1;const id=existing?.id??crypto.randomUUID();const invoice:Invoice={id,number:input.issue?prefix+count:'DRAFT',clientName:input.clientName.trim(),date:input.date,items:input.items,discountCents:input.discountCents,totalCents:invoiceTotal(input.items,input.discountCents),status:input.issue?'issued':'draft',notes:input.notes,business:state.business,createdAt:existing?.createdAt??Date.now(),updatedAt:Date.now()};const transactions=[...state.transactions];if(input.paid&&input.issue)transactions.push({id:crypto.randomUUID(),kind:'payment',amountCents:invoice.totalCents,date:input.date,description:`Payment for ${invoice.number}`,category:'Client payment',method:input.paymentMethod,invoiceId:id,createdAt:Date.now()});commit({...state,invoices:existing?state.invoices.map(i=>i.id===id?invoice:i):[invoice,...state.invoices],transactions},input.issue?'Invoice issued':'Draft saved',`${invoice.number} · ${invoice.clientName}`);done.current.set(input.requestId,id);return id},
 async recordTransaction(input){if(done.current.has(input.requestId))return done.current.get(input.requestId)!;validateAmount(input.amountCents);validateDate(input.date);if(input.date>today())throw new Error('Cash movements cannot be future dated.');if(!input.description.trim())throw new Error('Enter a description.');const state=ref.current;if(input.kind==='payment'){const inv=state.invoices.find(i=>i.id===input.invoiceId);if(!inv||inv.status!=='issued')throw new Error('Select an issued invoice.');if(input.date<inv.date)throw new Error('Payment date cannot be before the invoice date.');if(input.amountCents>inv.totalCents-received(inv.id,state.transactions))throw new Error('Payment exceeds the outstanding amount.');}const id=crypto.randomUUID();const {requestId,...fields}=input;commit({...state,transactions:[{...fields,id,createdAt:Date.now()},...state.transactions]},'Money recorded',input.description);done.current.set(requestId,id);return id},
 async voidInvoice(id,reason){const state=ref.current;if(!reason.trim())throw new Error('Enter a reason.');if(state.transactions.some(t=>t.invoiceId===id&&!t.voidedAt))throw new Error('Reverse linked payment records before voiding this invoice.');commit({...state,invoices:state.invoices.map(i=>i.id===id?{...i,status:'void',updatedAt:Date.now()}:i)},'Invoice voided',reason)},
 async reverseTransaction(id,reason){if(!reason.trim())throw new Error('Enter a reason.');const state=ref.current;commit({...state,transactions:state.transactions.map(t=>t.id===id?{...t,voidedAt:Date.now(),voidReason:reason}:t)},'Transaction reversed',reason)},
 async saveSettings(business){commit({...ref.current,business},'Business details updated','Future invoices will use the updated details.')}
 }; return <Context.Provider value={store}>{children}</Context.Provider>;
}
