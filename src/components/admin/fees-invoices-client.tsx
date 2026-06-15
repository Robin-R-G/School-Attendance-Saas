"use client";

import { useState, useEffect, useRef } from "react";
import { 
  X, Printer, Receipt, FileText, CheckCircle2, AlertCircle, 
  Plus, Search, Calendar, CreditCard, DollarSign, Loader2, ArrowRight 
} from "lucide-react";
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
  student: {
    id: string;
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

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  class: {
    grade: { name: string };
    section: { name: string };
  };
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

interface FeesInvoicesClientProps {
  invoices: Invoice[];
  school: School;
  students: Student[];
}

export default function FeesInvoicesClient({ invoices, school, students }: FeesInvoicesClientProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // View States
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Issue Invoice Dialog States
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueLoading, setIssueLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [issueStudentId, setIssueStudentId] = useState("");
  const [issueStudentName, setIssueStudentName] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);

  const [issueType, setIssueType] = useState("TUITION");
  const [issueTitle, setIssueTitle] = useState("");
  const [issueAmount, setIssueAmount] = useState("");
  const [issueDueDate, setIssueDueDate] = useState("");

  // Record Payment Dialog States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentReceiptNumber, setPaymentReceiptNumber] = useState("");
  const [paymentTransactionId, setPaymentTransactionId] = useState("");
  const [paymentDate, setPaymentDate] = useState("");

  // School Payment Settings States
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [bankName, setBankName] = useState(school.bankName || "");
  const [bankAccountName, setBankAccountName] = useState(school.bankAccountName || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(school.bankAccountNumber || "");
  const [bankIfscCode, setBankIfscCode] = useState(school.bankIfscCode || "");
  const [upiId, setUpiId] = useState(school.upiId || "");

  // Update settings states if school prop changes
  useEffect(() => {
    setBankName(school.bankName || "");
    setBankAccountName(school.bankAccountName || "");
    setBankAccountNumber(school.bankAccountNumber || "");
    setBankIfscCode(school.bankIfscCode || "");
    setUpiId(school.upiId || "");
  }, [school]);

  // Close student dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsStudentDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Open invoice creation modal
  const handleOpenIssueModal = () => {
    setIssueStudentId("");
    setIssueStudentName("");
    setStudentSearch("");
    setIssueType("TUITION");
    setIssueTitle("");
    setIssueAmount("");
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 30); // 30 days default
    setIssueDueDate(defaultDue.toISOString().split("T")[0]);
    setErrorMessage(null);
    setIsIssueModalOpen(true);
  };

  // Open record payment modal
  const handleOpenPaymentModal = (invoice: Invoice) => {
    setPaymentInvoice(invoice);
    setPaymentAmount(invoice.amount.toString());
    setPaymentMethod("CASH");
    setPaymentTransactionId("");
    setErrorMessage(null);
    
    // Auto-generate a receipt number: REC-[YYYYMMDD]-[RANDOM]
    const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const rand = Math.floor(1000 + Math.random() * 9000);
    setPaymentReceiptNumber(`REC-${dateStr}-${rand}`);
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setIsPaymentModalOpen(true);
  };

  // Handle invoice submission
  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueStudentId || !issueType || !issueTitle || !issueAmount || !issueDueDate) {
      setErrorMessage("Please fill out all required fields.");
      return;
    }

    setIssueLoading(true);
    setErrorMessage(null);

    const payload = {
      studentId: issueStudentId,
      type: issueType,
      title: issueTitle,
      amount: parseFloat(issueAmount),
      dueDate: issueDueDate,
    };

    try {
      const res = await fetch(`/api/schools/${school.code}/fees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsIssueModalOpen(false);
        router.refresh();
      } else {
        setErrorMessage(data.message || "Failed to create fee invoice.");
      }
    } catch (err) {
      setErrorMessage("An unexpected network error occurred.");
    } finally {
      setIssueLoading(false);
    }
  };

  // Handle payment submission
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice || !paymentAmount || !paymentReceiptNumber || !paymentDate) {
      setErrorMessage("Please fill out all required fields.");
      return;
    }

    setPaymentLoading(true);
    setErrorMessage(null);

    const payload = {
      amount: parseFloat(paymentAmount),
      paymentMethod,
      transactionId: paymentTransactionId || null,
      receiptNumber: paymentReceiptNumber,
      paidAt: paymentDate,
    };

    try {
      const res = await fetch(`/api/schools/${school.code}/fees/${paymentInvoice.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsPaymentModalOpen(false);
        router.refresh();
      } else {
        setErrorMessage(data.message || "Failed to record payment.");
      }
    } catch (err) {
      setErrorMessage("An unexpected network error occurred.");
    } finally {
      setPaymentLoading(false);
    }
  };

  // Handle school payment settings submission
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setErrorMessage(null);

    const payload = {
      bankName: bankName || null,
      bankAccountName: bankAccountName || null,
      bankAccountNumber: bankAccountNumber || null,
      bankIfscCode: bankIfscCode || null,
      upiId: upiId || null,
    };

    try {
      const res = await fetch(`/api/schools/${school.code}/payment-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsSettingsModalOpen(false);
        router.refresh();
      } else {
        setErrorMessage(data.message || "Failed to update payment settings.");
      }
    } catch (err) {
      setErrorMessage("An unexpected network error occurred.");
    } finally {
      setSettingsLoading(false);
    }
  };

  // Filter students based on search inside the dropdown
  const filteredDropdownStudents = students.filter(st => {
    const term = studentSearch.toLowerCase();
    return st.firstName.toLowerCase().includes(term) ||
      st.lastName.toLowerCase().includes(term) ||
      st.admissionNumber.toLowerCase().includes(term);
  });

  // Filter main invoices list
  const filteredInvoices = invoices.filter((inv) => {
    const fullName = `${inv.student.firstName} ${inv.student.lastName}`.toLowerCase();
    const searchMatch = fullName.includes(searchQuery.toLowerCase()) ||
      inv.student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.title.toLowerCase().includes(searchQuery.toLowerCase());

    const statusMatch = statusFilter === "all" || inv.status === statusFilter;
    const typeMatch = typeFilter === "all" || inv.type === typeFilter;

    return searchMatch && statusMatch && typeMatch;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:max-w-2xl">
          {/* Keyword Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search student or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-card text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-40 px-3 py-2 rounded-lg border border-input bg-card text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>

          {/* Fee Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 rounded-lg border border-input bg-card text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Fee Types</option>
            <option value="TUITION">Tuition Fee</option>
            <option value="TRANSPORT">Bus/Transport Fee</option>
            <option value="HOSTEL">Hostel Fee</option>
            <option value="EXAMINATION">Exam Fee</option>
            <option value="OTHER">Other Fees</option>
          </select>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => {
              setErrorMessage(null);
              setIsSettingsModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground font-semibold text-xs transition duration-150 active:scale-[0.98] cursor-pointer shadow-sm"
          >
            <CreditCard className="h-4 w-4 text-violet-500" />
            <span>Setup Payments</span>
          </button>
          
          <button
            onClick={handleOpenIssueModal}
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition duration-150 active:scale-[0.98] cursor-pointer shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Issue Invoice</span>
          </button>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm print:hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-bold text-sm text-foreground">Invoices Register ({filteredInvoices.length})</h3>
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
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">
                    No billing invoices matching filters.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
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
                      ₹{inv.amount.toLocaleString()}
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
                      <div className="flex items-center justify-end gap-2">
                        {inv.status !== "PAID" && (
                          <button
                            onClick={() => handleOpenPaymentModal(inv)}
                            className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 shadow-sm"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            <span>Pay</span>
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="py-1 px-2.5 rounded-lg border border-border bg-background hover:bg-secondary text-[11px] font-semibold transition cursor-pointer text-foreground flex items-center gap-1"
                        >
                          <Receipt className="h-3.5 w-3.5 text-violet-500" />
                          <span>Receipt</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SETUP PAYMENT SETTINGS MODAL */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/10">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <CreditCard className="h-4.5 w-4.5 text-violet-500" />
                <span>Configure School Payment Details</span>
              </h3>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSettingsSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              <p className="text-muted-foreground text-xs leading-relaxed border-b border-border pb-3">
                Configure your school's bank account details and UPI address (VPA) so parents and students can make direct transfers.
              </p>

              {/* Bank Details */}
              <div className="space-y-3 pt-1">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-violet-500 font-mono">1. Bank Account Information</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Account Holder Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Grand Academy School A/C"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={settingsLoading}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC Bank, SBI"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={settingsLoading}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">IFSC Code</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC0001234"
                      value={bankIfscCode}
                      onChange={(e) => setBankIfscCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring font-mono uppercase"
                      disabled={settingsLoading}
                    />
                  </div>

                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Account Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 50100123456789"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                      disabled={settingsLoading}
                    />
                  </div>
                </div>
              </div>

              {/* UPI VPA Details */}
              <div className="space-y-3 pt-3 border-t border-border border-dashed">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-violet-500 font-mono">2. UPI Payment gateway (VPA)</h4>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">UPI ID / VPA</label>
                  <input
                    type="text"
                    placeholder="e.g. grandacademy@okaxis"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                    disabled={settingsLoading}
                  />
                  <p className="text-[9px] text-muted-foreground">Required to dynamically generate payment QR codes for parents.</p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="py-2 px-4 rounded-lg border border-border hover:bg-secondary text-foreground text-xs font-semibold cursor-pointer"
                  disabled={settingsLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  disabled={settingsLoading}
                >
                  {settingsLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Settings</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ISSUE INVOICE DIALOG MODAL */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/10">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-violet-500" />
                <span>Issue Fee Invoice</span>
              </h3>
              <button
                onClick={() => setIsIssueModalOpen(false)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleIssueSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              {/* Searchable Student Dropdown Select */}
              <div className="space-y-1 relative" ref={dropdownRef}>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Select Student *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search student by name or admin no..."
                    value={issueStudentName || studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      if (issueStudentName) {
                        setIssueStudentName("");
                        setIssueStudentId("");
                      }
                      setIsStudentDropdownOpen(true);
                    }}
                    onFocus={() => setIsStudentDropdownOpen(true)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={issueLoading}
                  />
                  {issueStudentId && (
                    <button
                      type="button"
                      onClick={() => {
                        setIssueStudentId("");
                        setIssueStudentName("");
                        setStudentSearch("");
                      }}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {isStudentDropdownOpen && (
                  <div className="absolute z-10 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-card border border-border rounded-lg shadow-xl divide-y divide-border text-xs">
                    {filteredDropdownStudents.length === 0 ? (
                      <div className="p-3 text-center text-muted-foreground">No students found.</div>
                    ) : (
                      filteredDropdownStudents.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => {
                            setIssueStudentId(st.id);
                            setIssueStudentName(`${st.firstName} ${st.lastName}`);
                            setStudentSearch("");
                            setIsStudentDropdownOpen(false);
                          }}
                          className="p-2.5 hover:bg-secondary/40 cursor-pointer flex justify-between items-center text-foreground"
                        >
                          <div>
                            <span className="font-bold">{st.firstName} {st.lastName}</span>
                            <span className="text-[10px] text-muted-foreground block">
                              Class: {st.class.grade.name} - {st.class.section.name}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-muted-foreground bg-secondary/80 px-1.5 py-0.5 rounded border border-border">
                            {st.admissionNumber}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Fee Category & Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category *</label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={issueLoading}
                  >
                    <option value="TUITION">Tuition Fee</option>
                    <option value="TRANSPORT">Bus/Transport</option>
                    <option value="HOSTEL">Hostel Fee</option>
                    <option value="EXAMINATION">Exam Fee</option>
                    <option value="OTHER">Other / Custom</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Amount (₹) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={issueAmount}
                      onChange={(e) => setIssueAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={issueLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Invoice Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Invoice Description/Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Bus fee - Quarter 2, PTA Fee"
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  disabled={issueLoading}
                />
              </div>

              {/* Due Date */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Due Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={issueDueDate}
                    onChange={(e) => setIssueDueDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={issueLoading}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="py-2 px-4 rounded-lg border border-border hover:bg-secondary text-foreground text-xs font-semibold cursor-pointer"
                  disabled={issueLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  disabled={issueLoading}
                >
                  {issueLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Issuing...</span>
                    </>
                  ) : (
                    <span>Create Invoice</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT DIALOG MODAL */}
      {isPaymentModalOpen && paymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/10">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <CreditCard className="h-4.5 w-4.5 text-emerald-500" />
                <span>Record Invoice Payment</span>
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              {/* Invoice Summary Info Card */}
              <div className="p-4 bg-secondary/20 border border-border rounded-xl text-xs space-y-2">
                <div className="flex justify-between font-bold text-foreground">
                  <span>Student Name:</span>
                  <span>{paymentInvoice.student.firstName} {paymentInvoice.student.lastName}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Particulars:</span>
                  <span>{paymentInvoice.title} ({paymentInvoice.type})</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-1 border-t border-border border-dashed text-foreground">
                  <span>Balance Due:</span>
                  <span className="text-emerald-500">₹{paymentInvoice.amount.toLocaleString()}.00</span>
                </div>
              </div>

              {/* Payment Method & Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={paymentLoading}
                  >
                    <option value="CASH">Cash Payment</option>
                    <option value="UPI">UPI Transfer</option>
                    <option value="CARD">Debit/Credit Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Amount Paid (₹) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="number"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={paymentLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Receipt Number */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Receipt Number *</label>
                <input
                  type="text"
                  placeholder="Receipt ID"
                  value={paymentReceiptNumber}
                  onChange={(e) => setPaymentReceiptNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  disabled={paymentLoading}
                />
              </div>

              {/* Transaction ID */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Transaction / Reference ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref, Bank Ref, Card Slip ID"
                  value={paymentTransactionId}
                  onChange={(e) => setPaymentTransactionId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  disabled={paymentLoading}
                />
              </div>

              {/* Payment Date */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date of Payment *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={paymentLoading}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="py-2 px-4 rounded-lg border border-border hover:bg-secondary text-foreground text-xs font-semibold cursor-pointer"
                  disabled={paymentLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  disabled={paymentLoading}
                >
                  {paymentLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <span>Record Payment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                          ₹{selectedInvoice.amount.toLocaleString()}.00
                        </td>
                      </tr>
                      {/* Totals */}
                      <tr className="bg-secondary/10 font-bold border-t border-border print:bg-transparent print:border-black">
                        <td colSpan={2} className="px-6 py-4 text-right text-muted-foreground uppercase text-[10px]">Total Amount Billed</td>
                        <td className="px-6 py-4 text-right font-black font-mono text-foreground pr-8 text-sm">
                          ₹{selectedInvoice.amount.toLocaleString()}.00
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
