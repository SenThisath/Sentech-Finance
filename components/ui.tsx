'use client';
import { Dialog } from 'radix-ui';
import { X, ArrowUpRight, ArrowDownLeft, FileText } from 'lucide-react';
import type { ReactNode } from 'react';
export function Modal({open,onClose,title,description,children,wide=false}:{open:boolean;onClose:()=>void;title:string;description?:string;children:ReactNode;wide?:boolean}) {return <Dialog.Root open={open} onOpenChange={v=>!v&&onClose()}><Dialog.Portal><Dialog.Overlay className="modal-overlay"/><Dialog.Content className={`modal ${wide?'modal-wide':''}`} aria-describedby={description?'modal-description':undefined}><div className="modal-heading"><div><Dialog.Title>{title}</Dialog.Title>{description&&<Dialog.Description id="modal-description">{description}</Dialog.Description>}</div><Dialog.Close className="icon-button" aria-label="Close"><X size={20}/></Dialog.Close></div>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>}
export function Badge({value}:{value:string}){return <span className={`badge badge-${value}`}>{value==='partial'?'Part paid':value.charAt(0).toUpperCase()+value.slice(1)}</span>}
export function Empty({title,text,action}:{title:string;text:string;action?:ReactNode}){return <div className="empty"><FileText size={30} strokeWidth={1.3}/><h3>{title}</h3><p>{text}</p>{action}</div>}
export function FlowIcon({incoming}:{incoming:boolean}){return <span className={`flow-icon ${incoming?'incoming':''}`}>{incoming?<ArrowDownLeft size={17}/>:<ArrowUpRight size={17}/>}</span>}
export function Logo({large=false}:{large?:boolean}){return <div className={`brand ${large?'brand-large':''}`}><div className="brand-mark"><img src="/logo.png" alt=""/></div><span>Sentech</span></div>}
export function Field({label,children,hint}:{label:string;children:ReactNode;hint?:string}){return <label className="field"><span>{label}</span>{children}{hint&&<small>{hint}</small>}</label>}
