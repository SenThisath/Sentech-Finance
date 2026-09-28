import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
export const item = v.object({ description: v.string(), detail: v.string(), quantity: v.number(), unit: v.string(), rateCents: v.number() });
export const business = v.object({ name: v.string(), address: v.string(), phone: v.string(), email: v.string(), accountHolder: v.string(), accountNumber: v.string(), bank: v.string() });
export const kind = v.union(v.literal('payment'), v.literal('other_income'), v.literal('expense'), v.literal('owner_deposit'), v.literal('owner_withdrawal'));
export default defineSchema({
  invoices: defineTable({ owner: v.string(), number: v.string(), clientName: v.string(), date: v.string(), items: v.array(item), discountCents: v.number(), totalCents: v.number(), status: v.union(v.literal('draft'), v.literal('issued'), v.literal('void')), notes: v.string(), business, createdAt: v.number(), updatedAt: v.number() }).index('by_owner', ['owner']),
  transactions: defineTable({ owner: v.string(), kind, amountCents: v.number(), date: v.string(), description: v.string(), category: v.string(), method: v.string(), invoiceId: v.optional(v.id('invoices')), voidedAt: v.optional(v.number()), voidReason: v.optional(v.string()), createdAt: v.number() }).index('by_owner', ['owner']).index('by_invoice', ['invoiceId']),
  settings: defineTable({ owner: v.string(), business }).index('by_owner', ['owner']),
  counters: defineTable({ owner: v.string(), year: v.string(), next: v.number() }).index('by_owner_year', ['owner', 'year']),
  requests: defineTable({ owner: v.string(), key: v.string(), operation: v.string(), resultId: v.string() }).index('by_owner_key', ['owner', 'key']),
  audit: defineTable({ owner: v.string(), action: v.string(), detail: v.string(), at: v.number() }).index('by_owner', ['owner']),
});
