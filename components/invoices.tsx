"use client";
import { useState } from "react";
import {
    Search,
    Download,
    Plus,
    Printer,
    Copy,
    Pencil,
    Ban,
    ArrowDownLeft,
} from "lucide-react";
import { useStore } from "./providers";
import { Badge, Empty, Modal } from "./ui";
import { InvoicePaper } from "./invoice-paper";
import {
    status,
    rupees,
    money,
    received,
    displayDate,
    csv,
    download,
    type Invoice,
} from "@/lib/model";
export function InvoiceList({
    onNew,
    onOpen,
}: {
    onNew: () => void;
    onOpen: (i: Invoice) => void;
}) {
    const { data } = useStore();
    const [q, setQ] = useState("");
    const [filter, setFilter] = useState("all");
    const rows = data.invoices
        .filter(
            (i) =>
                (filter === "all" || status(i, data.transactions) === filter) &&
                `${i.number} ${i.clientName}`
                    .toLowerCase()
                    .includes(q.toLowerCase()),
        )
        .sort((a, b) => b.createdAt - a.createdAt);
    const total = data.invoices
        .filter((i) => i.status === "issued")
        .reduce((a, i) => a + i.totalCents, 0);
    const paid = data.transactions
        .filter((t) => t.kind === "payment" && !t.voidedAt)
        .reduce((a, t) => a + t.amountCents, 0);
    return (
        <>
            <div className="invoice-stats">
                <div>
                    <span>Total invoiced</span>
                    <strong>{rupees(total)}</strong>
                </div>
                <div>
                    <span>Payments received</span>
                    <strong>{rupees(paid)}</strong>
                </div>
                <div>
                    <span>Outstanding</span>
                    <strong>{rupees(total - paid)}</strong>
                </div>
                <div>
                    <span>Drafts</span>
                    <strong>
                        {
                            data.invoices.filter((i) => i.status === "draft")
                                .length
                        }
                    </strong>
                </div>
            </div>
            <section className="panel table-panel">
                <div className="list-toolbar">
                    <div className="search-field">
                        <Search size={16} />
                        <input
                            aria-label="Search invoices"
                            placeholder="Search client or invoice…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                    </div>
                    <select
                        aria-label="Invoice status"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All statuses</option>
                        {["unpaid", "partial", "paid", "draft", "void"].map(
                            (v) => (
                                <option key={v} value={v}>
                                    {v === "partial" ?
                                        "Part paid"
                                    :   v.charAt(0).toUpperCase() + v.slice(1)}
                                </option>
                            ),
                        )}
                    </select>
                    <button
                        className="button secondary"
                        onClick={() =>
                            download(
                                "sentech-invoices.csv",
                                csv([
                                    [
                                        "Invoice",
                                        "Client",
                                        "Date",
                                        "Total (Rs.)",
                                        "Received (Rs.)",
                                        "Outstanding (Rs.)",
                                        "Status",
                                    ],
                                    ...rows.map((i) => [
                                        i.number,
                                        i.clientName,
                                        i.date,
                                        (i.totalCents / 100).toFixed(2),
                                        (
                                            received(i.id, data.transactions) /
                                            100
                                        ).toFixed(2),
                                        i.status === "issued" ?
                                            (
                                                (i.totalCents -
                                                    received(
                                                        i.id,
                                                        data.transactions,
                                                    )) /
                                                100
                                            ).toFixed(2)
                                        :   "0.00",
                                        status(i, data.transactions),
                                    ]),
                                ]),
                            )
                        }
                    >
                        <Download size={15} />
                        Export CSV
                    </button>
                </div>
                {rows.length ?
                    <div className="table-scroll">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Invoice</th>
                                    <th>Client</th>
                                    <th>Issued on</th>
                                    <th>Status</th>
                                    <th className="align-right">Total</th>
                                    <th className="align-right">Outstanding</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((i) => (
                                    <tr key={i.id}>
                                        <td>
                                            <button
                                                className="invoice-link"
                                                onClick={() => onOpen(i)}
                                            >
                                                {i.number}
                                            </button>
                                        </td>
                                        <td>
                                            <strong>{i.clientName}</strong>
                                            <span>
                                                {i.items.length} service
                                                {i.items.length !== 1 ?
                                                    "s"
                                                :   ""}
                                            </span>
                                        </td>
                                        <td>{displayDate(i.date)}</td>
                                        <td>
                                            <Badge
                                                value={status(
                                                    i,
                                                    data.transactions,
                                                )}
                                            />
                                        </td>
                                        <td className="align-right amount">
                                            {money(i.totalCents)}
                                        </td>
                                        <td className="align-right">
                                            {i.status === "issued" ?
                                                money(
                                                    i.totalCents -
                                                        received(
                                                            i.id,
                                                            data.transactions,
                                                        ),
                                                )
                                            :   "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                :   <Empty
                        title="No invoices yet"
                        text="Create an invoice with your Sentech design and start tracking your work."
                        action={
                            <button className="button primary" onClick={onNew}>
                                <Plus size={16} />
                                Create invoice
                            </button>
                        }
                    />
                }
                <div className="table-footer">
                    {rows.length} invoice{rows.length !== 1 ? "s" : ""} · Click
                    an invoice number to view it
                </div>
            </section>
        </>
    );
}
export function InvoiceDetail({
    invoice,
    onClose,
    onPrint,
    onEdit,
    onDuplicate,
    onPay,
    onVoid,
}: {
    invoice: Invoice;
    onClose: () => void;
    onPrint: () => void;
    onEdit: () => void;
    onDuplicate: () => void;
    onPay: () => void;
    onVoid: () => void;
}) {
    const { data } = useStore();
    const payments = data.transactions.filter(
        (t) => t.invoiceId === invoice.id && !t.voidedAt,
    );
    const paid = received(invoice.id, data.transactions);
    const currentStatus = status(invoice, data.transactions);
    return (
        <Modal
            open
            onClose={onClose}
            title={`${invoice.number} · ${invoice.clientName}`}
            description="Your invoice and its payment history."
            wide
        >
            <div className="detail-actions">
                <Badge value={currentStatus} />
                <div className="button-row">
                    {invoice.status === "draft" ?
                        <button className="button primary" onClick={onEdit}>
                            <Pencil size={15} />
                            Edit draft
                        </button>
                    :   <button className="button primary" onClick={onPrint}>
                            <Printer size={15} />
                            Print / Save PDF
                        </button>
                    }
                    {invoice.status === "issued" &&
                        paid < invoice.totalCents && (
                            <button
                                className="button secondary"
                                onClick={onPay}
                            >
                                <ArrowDownLeft size={15} />
                                Record payment
                            </button>
                        )}
                    <button className="button secondary" onClick={onDuplicate}>
                        <Copy size={15} />
                        Duplicate
                    </button>
                    {invoice.status !== "void" && (
                        <button
                            className="icon-button"
                            onClick={onVoid}
                            aria-label="Void invoice"
                        >
                            <Ban size={17} />
                        </button>
                    )}
                </div>
            </div>
            <div className="detail-payment-strip">
                <span>
                    Total <strong>{rupees(invoice.totalCents)}</strong>
                </span>
                <span>
                    Received <strong>{rupees(paid)}</strong>
                </span>
                <span>
                    Outstanding{" "}
                    <strong>
                        {invoice.status === "issued" ?
                            rupees(invoice.totalCents - paid)
                        :   "—"}
                    </strong>
                </span>
            </div>
            <div className="detail-paper">
                <InvoicePaper invoice={invoice} />
            </div>
            <section className="payment-history">
                <h3>Payment history</h3>
                {payments.length ?
                    payments.map((t) => (
                        <div key={t.id}>
                            <span>
                                {displayDate(t.date)} · {t.method}
                            </span>
                            <strong>{rupees(t.amountCents)}</strong>
                        </div>
                    ))
                :   <p className="muted">
                        No payments recorded for this invoice.
                    </p>
                }
            </section>
        </Modal>
    );
}
