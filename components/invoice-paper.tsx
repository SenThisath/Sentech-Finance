import type { Invoice } from '@/lib/model';
import { lineTotal, money, displayDate } from '@/lib/model';
import { Logo } from './ui';
export function InvoicePaper({invoice,sample=false}:{invoice:Invoice;sample?:boolean}) {const b=invoice.business;return <article className="invoice-paper">
 <header className="ip-header"><Logo/><div className="ip-contact">{b.address}<br/>{b.phone}<br/>{b.email}</div></header>
 <section className="ip-heading"><div className="ip-eyebrow">INVOICE NO. <strong>{invoice.number}</strong>{sample&&<span>PREVIEW</span>}{invoice.status==='void'&&<strong>VOID</strong>}</div><h1>Invoice.</h1></section>
 <section className="ip-recipient"><div><div className="ip-label">PREPARED FOR</div><div className="ip-client">{invoice.clientName||'Client name'}</div></div><div className="ip-date"><div className="ip-label">ISSUED ON</div><div>{displayDate(invoice.date)}</div></div></section>
 <table className="ip-items"><colgroup><col style={{width:'43%'}}/><col style={{width:'19%'}}/><col style={{width:'18%'}}/><col style={{width:'20%'}}/></colgroup><thead><tr><th>SERVICE / DESCRIPTION</th><th>QTY / PAGES</th><th>RATE</th><th>AMOUNT</th></tr></thead><tbody>{invoice.items.map((item,index)=><tr key={index}><td><strong>{item.description||'Service description'}</strong>{item.detail&&<span>{item.detail}</span>}</td><td>{item.quantity}<small>{item.unit}</small></td><td>{money(item.rateCents)}</td><td>{money(lineTotal(item))}</td></tr>)}</tbody></table>
 {invoice.discountCents>0&&<div className="ip-discount"><span>Subtotal <strong>{money(invoice.totalCents+invoice.discountCents)}</strong></span><span>Discount <strong>−{money(invoice.discountCents)}</strong></span></div>}
 <section className="ip-total"><span>TOTAL AMOUNT</span><div><small>Rs.</small> {money(invoice.totalCents)}</div></section>
 <section className="ip-bottom"><div className="ip-bank"><div className="ip-label">PAYMENT DETAILS</div><div className="ip-holder">{b.accountHolder}</div><div className="ip-account">{b.accountNumber}</div><div className="ip-branch">{b.bank}</div><div className="ip-reference">Payment reference <strong>{invoice.number}</strong></div></div><div className="ip-terms"><div className="ip-label">NOTES &amp; TERMS</div>{invoice.notes.split('\n').filter(Boolean).map((p,i)=><p key={i}>{p}</p>)}</div></section>
 <footer className="ip-footer"><div>Thank you for choosing <strong>{b.name}.</strong></div><span>Made with care.</span></footer>
 </article>}
