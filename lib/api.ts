import { makeFunctionReference } from 'convex/server';
import type { Snapshot, InvoiceInput, TransactionInput, Business } from './model';
type OwnerAccess = { password: string };
export const api = {
 snapshot: makeFunctionReference<'query', OwnerAccess, Snapshot>('finance:snapshot'),
 saveInvoice: makeFunctionReference<'mutation', InvoiceInput & OwnerAccess, string>('finance:saveInvoice'),
 recordTransaction: makeFunctionReference<'mutation', TransactionInput & OwnerAccess, string>('finance:recordTransaction'),
 voidInvoice: makeFunctionReference<'mutation', OwnerAccess & {id: string; reason: string}, null>('finance:voidInvoice'),
 reverseTransaction: makeFunctionReference<'mutation', OwnerAccess & {id: string; reason: string}, null>('finance:reverseTransaction'),
 saveSettings: makeFunctionReference<'mutation', OwnerAccess & {business: Business}, null>('finance:saveSettings'),
};
