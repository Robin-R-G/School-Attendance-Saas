"use client";

import { useState } from "react";
import { X, CreditCard, Calendar, QrCode, Landmark, CheckCircle2, AlertCircle, FileText, Printer, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

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
  payments: Payment[];
}

interface School {
  code: string;
  name: string;
  logoUrl: string | null;
  address: string;
  email: string;
  phone: string;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankIfscCode: string | null;
  upiId: string | null;
}

interface ParentFeesClientProps {
  invoices: Invoice[];
  school: School;
}

export default function ParentFeesClient({ invoices, school }: ParentFeesClientProps) {
  const router = useRouter();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // Pay Modal States
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentMode, setPaymentMode] = useState<"UPI" | "BANK">("UPI");
  const [transactionId, setTransactionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Generate UPI Intent URL
  const getUpiUrl = (inv: Invoice) => {
    if (!school.upiId) return "";
    const merchantName = encodeURIComponent(school.name);
    const invoiceTitle = encodeURIComponent(`${inv.title} (${inv.id.substring(0, 8)})`);
    return `upi://pay?pa=${school.upiId}&pn=${merchantName}&am=${inv.amount}&cu=INR&tn=${invoiceTitle}`;
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;
    if (!transactionId) {
      setError("Please provide the transaction ID / UTR reference number.");
      return;
    }

    setSubmitting(true);
    setError(null);

    // Auto-generate receipt number
    const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const rand = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `REC-${dateStr}-${rand}`;

    const payload = {
      amount: payingInvoice.amount,
      paymentMethod: paymentMode === "UPI" ? "UPI" : "BANK_TRANSFER",
      transactionId,
      receiptNumber,
      paidAt: new Date().toISOString(),
    };

    try {
      const res = await fetch(`/api/schools/${school.code}/fees/${payingInvoice.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          setPayingInvoice(null);
          setSuccess(false);
          setTransactionId("");
          router.refresh();
        }, 2000);
      } else {
        setError(data.message || "Failed to submit payment reference.");
      }
    } catch (err) {
      setError("A network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 flex flex-col flex-1">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2">Invoice Title</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Due Date</th>
              <th className="px-4 py-2 text-right">Payment Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs text-foreground">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No invoices found for your child.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-secondary/10">
                  <td className="px-4 py-3 font-semibold text-foreground">{inv.title}</td>
                  <td className="px-4 py-3 font-semibold text-muted-foreground uppercase text-[10px] font-mono">
                    {inv.type}
                  </td>
                  <td className="px-4 py-3 font-bold font-mono text-foreground text-sm">₹{inv.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {typeof inv.dueDate === "string" 
                      ? inv.dueDate.substring(0, 10) 
                      : inv.dueDate.toISOString().split("T")[0]}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {inv.status === "PAID" ? (
                        <>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Paid</span>
                          </span>
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1 rounded hover:bg-secondary text-violet-500 cursor-pointer"
                            title="View Receipt"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            inv.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : "bg-red-500/10 text-red-500 border-red-500/20"
                          }`}>
                            <AlertCircle className="h-3 w-3" />
                            <span>{inv.status}</span>
                          </span>
                          <button
                            onClick={() => {
                              setError(null);
                              setSuccess(false);
                              setTransactionId("");
                              setPayingInvoice(inv);
                            }}
                            className="py-1 px-2.5 rounded bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold tracking-wide transition cursor-pointer shadow-sm"
                          >
                            Pay Now
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PARENT PAY DIALOG MODAL */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/10">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <CreditCard className="h-4.5 w-4.5 text-violet-500" />
                <span>Make Payment</span>
              </h3>
              <button
                onClick={() => setPayingInvoice(null)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            {success ? (
              <div className="p-8 text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-foreground">Reference Submitted!</h4>
                <p className="text-muted-foreground text-xs">Your payment of ₹{payingInvoice.amount.toLocaleString()} has been submitted successfully.</p>
              </div>
            ) : (
              <form onSubmit={handlePaySubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
                    {error}
                  </div>
                )}

                {/* Info summary */}
                <div className="p-3 bg-secondary/20 border border-border rounded-xl text-xs flex justify-between items-center text-foreground">
                  <div>
                    <span className="font-bold block text-sm">{payingInvoice.title}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono">{payingInvoice.type}</span>
                  </div>
                  <span className="font-bold text-lg text-violet-600 dark:text-violet-400">
                    ₹{payingInvoice.amount.toLocaleString()}
                  </span>
                </div>

                {/* Tabs for Payment Mode */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/30 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMode("UPI")}
                    className={`py-1.5 rounded-md font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      paymentMode === "UPI"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    <span>UPI (QR Code)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode("BANK")}
                    className={`py-1.5 rounded-md font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      paymentMode === "BANK"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Landmark className="h-3.5 w-3.5" />
                    <span>Bank Transfer</span>
                  </button>
                </div>

                {/* Payment Option details */}
                <div className="p-4 bg-secondary/10 border border-border rounded-xl">
                  {paymentMode === "UPI" ? (
                    school.upiId ? (
                      <div className="flex flex-col items-center space-y-3">
                        <p className="text-[11px] text-muted-foreground text-center">
                          Scan the QR Code below using BHIM, Google Pay, PhonePe, Paytm, or any banking app.
                        </p>
                        
                        <div className="p-2 bg-white rounded-lg border border-border">
                          <img
                            src={`https://chart.googleapis.com/chart?chs=180x180&cht=qr&chl=${encodeURIComponent(getUpiUrl(payingInvoice))}`}
                            alt="UPI Payment QR Code"
                            className="h-44 w-44 object-contain"
                          />
                        </div>

                        <div className="text-center font-mono text-[10px] text-foreground bg-secondary/50 px-3 py-1.5 rounded border border-border w-full">
                          <span className="text-muted-foreground">UPI ID:</span> <span className="font-bold">{school.upiId}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-muted-foreground space-y-2">
                        <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
                        <p className="font-semibold">UPI Payment is not set up</p>
                        <p className="text-[10px]">The school administration has not configured their UPI VPA. Please use the Bank Transfer option.</p>
                      </div>
                    )
                  ) : (
                    school.bankAccountNumber ? (
                      <div className="space-y-2.5 text-xs text-foreground">
                        <p className="text-[11px] text-muted-foreground">
                          Please initiate a bank transfer (IMPS, NEFT, RTGS) to the official school account below:
                        </p>

                        <div className="grid grid-cols-3 gap-y-1.5 pt-1.5 border-t border-border">
                          <span className="text-muted-foreground font-medium">Bank Name:</span>
                          <span className="col-span-2 font-bold">{school.bankName}</span>

                          <span className="text-muted-foreground font-medium">Account Name:</span>
                          <span className="col-span-2 font-semibold">{school.bankAccountName}</span>

                          <span className="text-muted-foreground font-medium">Account No:</span>
                          <span className="col-span-2 font-bold font-mono text-sm tracking-wide">{school.bankAccountNumber}</span>

                          <span className="text-muted-foreground font-medium">IFSC Code:</span>
                          <span className="col-span-2 font-bold font-mono text-sm uppercase text-violet-500">{school.bankIfscCode}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-muted-foreground space-y-2">
                        <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
                        <p className="font-semibold">Bank Details not configured</p>
                        <p className="text-[10px]">The school administration has not configured their bank details. Please contact the office.</p>
                      </div>
                    )
                  )}
                </div>

                {/* Reference submission */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Transaction ID / UTR Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. 12-digit UPI Ref, Bank UTR Code"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring font-mono uppercase"
                    disabled={submitting}
                  />
                  <p className="text-[9px] text-muted-foreground">Enter the receipt ID or transfer transaction number to verify payment.</p>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setPayingInvoice(null)}
                    className="py-2 px-4 rounded-lg border border-border hover:bg-secondary text-foreground text-xs font-semibold cursor-pointer"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                    disabled={submitting || (paymentMode === "UPI" && !school.upiId) || (paymentMode === "BANK" && !school.bankAccountNumber)}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Submit Payment Reference</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* INVOICE RECEIPT PREVIEW MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm print:relative print:inset-auto print:bg-white print:p-0 print:z-0">
          <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:w-full print:max-w-none print:bg-white print:rounded-none">
            {/* Modal Controls Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/10 print:hidden">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-violet-500" />
                <span>Payment Receipt</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-violet-600 text-white font-semibold text-xs hover:bg-violet-700 active:scale-[0.98] transition cursor-pointer"
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
                    OFFICIAL RECEIPT
                  </h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold font-mono">
                    Receipt ID: <span className="text-foreground print:text-black">{selectedInvoice.payments[0]?.receiptNumber || selectedInvoice.id.substring(0, 8).toUpperCase()}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Paid On: <span className="font-semibold text-foreground print:text-black">
                      {typeof selectedInvoice.payments[0]?.paidAt === "string"
                        ? selectedInvoice.payments[0].paidAt.substring(0, 10)
                        : selectedInvoice.payments[0]?.paidAt.toISOString().split("T")[0] || "N/A"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Student Details Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-secondary/20 p-5 rounded-xl border border-border print:bg-transparent print:border-black print:rounded-none">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Billed To (Parent/Student)</p>
                  <p className="font-bold text-sm text-foreground print:text-black mt-1">
                    {school.name} Student Account
                  </p>
                  <p className="text-muted-foreground font-medium mt-0.5">
                    Invoice ID: <span className="font-mono text-foreground print:text-black font-semibold">{selectedInvoice.id}</span>
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Class Placement</p>
                  <p className="font-bold text-sm text-foreground print:text-black mt-1">
                    Child Student Profile
                  </p>
                  <p className="text-muted-foreground font-medium mt-0.5">
                    Academic Year: <span className="text-foreground print:text-black font-semibold">2026</span>
                  </p>
                </div>
              </div>

              {/* Fee Items Table */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Receipt Particulars</h4>
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
                          ₹{selectedInvoice.amount.toLocaleString()}.00
                        </td>
                      </tr>
                      {/* Totals */}
                      <tr className="bg-secondary/10 font-bold border-t border-border print:bg-transparent print:border-black">
                        <td colSpan={2} className="px-6 py-4 text-right text-muted-foreground uppercase text-[10px]">Total Amount Paid</td>
                        <td className="px-6 py-4 text-right font-black font-mono text-foreground pr-8 text-sm">
                          ₹{selectedInvoice.amount.toLocaleString()}.00
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Details */}
              {selectedInvoice.payments.length > 0 && (
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
