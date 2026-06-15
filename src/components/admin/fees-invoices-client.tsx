"use client";

import { useState } from "react";
import { X, Printer, Receipt, FileText, CheckCircle2, AlertCircle } from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  transactionId: string | null;
  receiptNumber: string;
  paidAt: Date | string;
}

interface Invoice {
  id: string;
  title: string;
  type: string;
  amount: number;
  dueDate: Date | string;
  status: string;
  createdAt: Date | string;
  student: {
    firstName: string;
    lastName: string;
    admissionNumber: string;
    class: {
      grade: { name: string };
      section: { name: string };
    };
  };
  payments: Payment[];
}

interface School {
  name: string;
  logoUrl: string | null;
  address: string;
  email: string;
  phone: string;
}

interface FeesInvoicesClientProps {
  invoices: Invoice[];
  school: School;
}

export default function FeesInvoicesClient({ invoices, school }: FeesInvoicesClientProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Invoices List Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm print:hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-bold text-sm text-foreground">Invoices Register ({invoices.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3">Student Name</th>
                <th className="px-6 py-3">Class Section</th>
                <th className="px-6 py-3">Invoice Title</th>
                <th className="px-6 py-3">Fee Type</th>
                <th className="px-6 py-3 font-mono">Amount</th>
                <th className="px-6 py-3 font-mono">Due Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs text-foreground">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">
                    No billing invoices generated yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">
                      {inv.student.firstName} {inv.student.lastName}
                    </td>
                    <td className="px-6 py-4 font-semibold text-muted-foreground">
                      {inv.student.class.grade.name} - {inv.student.class.section.name}
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {inv.title}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono uppercase text-muted-foreground">
                      {inv.type}
                    </td>
                    <td className="px-6 py-4 font-bold font-mono text-foreground">
                      ${inv.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">
                      {typeof inv.dueDate === "string"
                        ? inv.dueDate.substring(0, 10)
                        : inv.dueDate.toISOString().split("T")[0]}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        inv.status === "PAID"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : inv.status === "PENDING"
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      }`}>
                        {inv.status === "PAID" ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-amber-500" />
                        )}
                        <span>{inv.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="py-1 px-3 rounded-lg border border-border bg-background hover:bg-secondary text-[11px] font-semibold transition cursor-pointer text-foreground flex items-center gap-1.5 ml-auto"
                      >
                        <Receipt className="h-3.5 w-3.5 text-violet-500" />
                        <span>View Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Receipt Modal Overlay */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm print:relative print:inset-auto print:bg-white print:p-0 print:z-0">
          <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:w-full print:max-w-none print:bg-white print:rounded-none">
            {/* Modal Controls Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/10 print:hidden">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-violet-500" />
                <span>Invoice View</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 active:scale-[0.98] transition cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Receipt Content Area */}
            <div className="p-8 space-y-8 bg-card text-foreground print:bg-white print:text-black">
              {/* Receipt Header: Logo & Details */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-dashed border-border pb-6 print:border-black">
                {/* Logo & School Name */}
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-600 font-extrabold text-2xl print:border-black">
                    {school.logoUrl ? (
                      <img src={school.logoUrl} alt={school.name} className="h-full w-full object-cover rounded-xl" />
                    ) : (
                      school.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground print:text-black leading-tight">{school.name}</h2>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">{school.address}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">{school.phone} | {school.email}</p>
                  </div>
                </div>

                {/* Invoice Meta */}
                <div className="text-left sm:text-right space-y-1">
                  <h3 className="text-lg font-black tracking-tight text-violet-600 dark:text-violet-400 print:text-black">
                    {selectedInvoice.status === "PAID" ? "OFFICIAL RECEIPT" : "PAYMENT INVOICE"}
                  </h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold font-mono">
                    Invoice ID: <span className="text-foreground print:text-black">{selectedInvoice.id.substring(0, 8).toUpperCase()}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Issue Date: <span className="font-semibold text-foreground print:text-black">
                      {typeof selectedInvoice.createdAt === "string"
                        ? selectedInvoice.createdAt.substring(0, 10)
                        : selectedInvoice.createdAt.toISOString().split("T")[0]}
                    </span>
                  </p>
                </div>
              </div>

              {/* Student Details Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-secondary/20 p-5 rounded-xl border border-border print:bg-transparent print:border-black print:rounded-none">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Billed To (Student)</p>
                  <p className="font-bold text-sm text-foreground print:text-black mt-1">
                    {selectedInvoice.student.firstName} {selectedInvoice.student.lastName}
                  </p>
                  <p className="text-muted-foreground font-medium mt-0.5">
                    Admission Number: <span className="font-mono text-foreground print:text-black font-semibold">{selectedInvoice.student.admissionNumber}</span>
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Class Placement</p>
                  <p className="font-bold text-sm text-foreground print:text-black mt-1">
                    {selectedInvoice.student.class.grade.name} - {selectedInvoice.student.class.section.name}
                  </p>
                  <p className="text-muted-foreground font-medium mt-0.5">
                    Academic Year: <span className="text-foreground print:text-black font-semibold">2026</span>
                  </p>
                </div>
              </div>

              {/* Fee Items Table */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Invoice Particulars</h4>
                <div className="border border-border rounded-xl overflow-hidden print:border-black print:rounded-none">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground print:border-black print:bg-transparent">
                        <th className="px-6 py-3">Description</th>
                        <th className="px-6 py-3">Fee Type</th>
                        <th className="px-6 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs text-foreground print:divide-black print:border-black">
                      <tr className="hover:bg-secondary/10">
                        <td className="px-6 py-4 font-semibold text-foreground">
                          {selectedInvoice.title}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-muted-foreground uppercase">
                          {selectedInvoice.type}
                        </td>
                        <td className="px-6 py-4 text-right font-bold font-mono text-foreground pr-8">
                          ${selectedInvoice.amount.toLocaleString()}.00
                        </td>
                      </tr>
                      {/* Totals */}
                      <tr className="bg-secondary/10 font-bold border-t border-border print:bg-transparent print:border-black">
                        <td colSpan={2} className="px-6 py-4 text-right text-muted-foreground uppercase text-[10px]">Total Amount Billed</td>
                        <td className="px-6 py-4 text-right font-black font-mono text-foreground pr-8 text-sm">
                          ${selectedInvoice.amount.toLocaleString()}.00
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Details (Conditional on PAID status) */}
              {selectedInvoice.status === "PAID" && selectedInvoice.payments.length > 0 ? (
                <div className="p-5 border border-emerald-500/20 bg-emerald-500/5 rounded-xl text-xs space-y-3 print:border-black print:bg-transparent print:rounded-none">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 print:text-black">
                    Official Payment Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-medium text-muted-foreground">
                    <div className="space-y-1">
                      <p>Receipt Number: <span className="font-mono text-foreground print:text-black font-bold">{selectedInvoice.payments[0].receiptNumber}</span></p>
                      <p>Payment Method: <span className="font-bold text-foreground print:text-black">{selectedInvoice.payments[0].paymentMethod.replace("_", " ")}</span></p>
                    </div>
                    <div className="space-y-1 sm:text-right">
                      <p>Transaction ID: <span className="font-mono text-foreground print:text-black font-bold">{selectedInvoice.payments[0].transactionId || "N/A"}</span></p>
                      <p>Paid On: <span className="font-mono text-foreground print:text-black font-bold">
                        {typeof selectedInvoice.payments[0].paidAt === "string"
                          ? selectedInvoice.payments[0].paidAt.replace("T", " ").substring(0, 19)
                          : selectedInvoice.payments[0].paidAt.toISOString().replace("T", " ").substring(0, 19)}
                      </span></p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 border border-amber-500/20 bg-amber-500/5 rounded-xl text-xs space-y-1 print:border-black print:bg-transparent print:rounded-none">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 print:text-black flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Payment Pending</span>
                  </h4>
                  <p className="text-muted-foreground">
                    Please settle this outstanding invoice by <span className="font-bold text-foreground print:text-black">
                      {typeof selectedInvoice.dueDate === "string"
                        ? selectedInvoice.dueDate.substring(0, 10)
                        : selectedInvoice.dueDate.toISOString().split("T")[0]}
                    </span> to avoid late academic penalties.
                  </p>
                </div>
              )}

              {/* Receipt Footer Message */}
              <div className="text-center text-[10px] text-muted-foreground pt-4 border-t border-border border-dashed print:border-black">
                <p>This is a computer-generated document. No physical signature is required.</p>
                <p className="mt-0.5">Thank you for supporting Aether ERP Education Services.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
