import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Plus, Trash2, Download, TrendingUp, TrendingDown, Wallet, Upload, FileText, Building2, Receipt } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/bookkeeping")({
  head: () => ({ meta: [{ title: "Bookkeeping" }, { name: "robots", content: "noindex" }] }),
  component: Bookkeeping,
});

type Entry = {
  id: string;
  user_id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string | null;
  entry_date: string;
  created_at: string;
  vendor: string | null;
  vendor_group: string | null;
  receipt_path: string | null;
  subtotal: number | null;
  tax_rate: number | null;
  tax_amount: number | null;
  is_service: boolean;
  reimbursable: boolean;
  payee: string | null;
  irs_category: string | null;
};

const CATEGORIES = ["fuel", "maintenance", "insurance", "staff", "marketing", "misc"] as const;

// IRS Schedule C-style categories (1040 Schedule C lines) for compliant exports
const IRS_CATEGORIES = [
  "Advertising",
  "Car & Truck Expenses",
  "Commissions & Fees",
  "Contract Labor",
  "Depreciation",
  "Employee Benefits",
  "Insurance (Other than Health)",
  "Interest",
  "Legal & Professional",
  "Office Expense",
  "Rent or Lease",
  "Repairs & Maintenance",
  "Supplies",
  "Taxes & Licenses",
  "Travel",
  "Meals (50%)",
  "Utilities",
  "Wages",
  "Other Expenses",
  "Gross Receipts (Income)",
] as const;

// Alabama state sales tax default (4%). Add local/county on top as needed.
const AL_STATE_TAX = 0.04;
// Federal self-employment tax set-aside for service income (~15.3% SE + ~12% est. income)
const SERVICE_TAX_RESERVE = 0.2735;

function Bookkeeping() {
  const { user, isAdmin } = useAuth();
  const [rows, setRows] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);
  const [groupFilter, setGroupFilter] = useState<string>("all");

  // form
  const [type, setType] = useState<"income" | "expense">("expense");
  const [vendor, setVendor] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [taxRate, setTaxRate] = useState(String(AL_STATE_TAX));
  const [category, setCategory] = useState<string>("fuel");
  const [irsCategory, setIrsCategory] = useState<string>("Supplies");
  const [description, setDescription] = useState("");
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isService, setIsService] = useState(false);
  const [reimbursable, setReimbursable] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const sub = parseFloat(subtotal) || 0;
  const rate = parseFloat(taxRate) || 0;
  const taxAmt = +(sub * rate).toFixed(2);
  const total = +(sub + taxAmt).toFixed(2);
  const serviceReserve = isService && type === "income" ? +(sub * SERVICE_TAX_RESERVE).toFixed(2) : 0;

  async function load() {
    const { data, error } = await supabase
      .from("ledger").select("*").order("entry_date", { ascending: false }).limit(1000);
    if (error) return toast.error(error.message);
    setRows((data ?? []) as Entry[]);
  }
  useEffect(() => { load(); }, [user?.id]);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!sub || sub <= 0) return toast.error("Enter a valid subtotal.");
    if (!vendor.trim()) return toast.error("Enter the company / vendor name.");
    setBusy(true);

    let receipt_path: string | null = null;
    if (receiptFile) {
      const ext = receiptFile.name.split(".").pop() || "bin";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("receipts").upload(path, receiptFile, { upsert: false });
      if (up.error) { setBusy(false); return toast.error(`Receipt upload: ${up.error.message}`); }
      receipt_path = path;
    }

    const { error } = await supabase.from("ledger").insert({
      user_id: user.id,
      type,
      amount: total,
      subtotal: sub,
      tax_rate: rate,
      tax_amount: taxAmt,
      category,
      irs_category: irsCategory,
      vendor: vendor.trim(),
      payee: vendor.trim(),
      description: description.trim() || null,
      entry_date: entryDate,
      is_service: isService,
      reimbursable,
      receipt_path,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setVendor(""); setSubtotal(""); setDescription(""); setReceiptFile(null);
    setIsService(false); setReimbursable(false);
    toast.success("Entry recorded.");
    load();
  }

  async function remove(id: string, path: string | null) {
    if (!confirm("Delete this entry?")) return;
    if (path) await supabase.storage.from("receipts").remove([path]);
    const { error } = await supabase.from("ledger").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  async function viewReceipt(path: string) {
    const { data, error } = await supabase.storage.from("receipts").createSignedUrl(path, 60);
    if (error || !data) return toast.error(error?.message || "Could not open receipt");
    window.open(data.signedUrl, "_blank", "noopener");
  }

  const filtered = useMemo(
    () => groupFilter === "all" ? rows : rows.filter(r => r.vendor_group === groupFilter),
    [rows, groupFilter],
  );

  const totals = useMemo(() => {
    let income = 0, expense = 0, tax = 0, reserve = 0, reimb = 0;
    for (const r of filtered) {
      const amt = Number(r.amount);
      if (r.type === "income") {
        income += amt;
        if (r.is_service) reserve += Number(r.subtotal ?? amt) * SERVICE_TAX_RESERVE;
      } else {
        expense += amt;
        if (r.reimbursable) reimb += amt;
      }
      tax += Number(r.tax_amount ?? 0);
    }
    return { income, expense, net: income - expense, tax, reserve, reimb };
  }, [filtered]);

  const monthly = useMemo(() => {
    const map = new Map<string, { month: string; income: number; expense: number }>();
    for (const r of filtered) {
      const key = r.entry_date.slice(0, 7);
      const e = map.get(key) ?? { month: key, income: 0, expense: 0 };
      if (r.type === "income") e.income += Number(r.amount); else e.expense += Number(r.amount);
      map.set(key, e);
    }
    return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
  }, [filtered]);

  const vendorGroups = useMemo(() => {
    const map = new Map<string, { group: string; vendor: string; count: number; total: number }>();
    for (const r of rows) {
      if (!r.vendor_group) continue;
      const e = map.get(r.vendor_group) ?? { group: r.vendor_group, vendor: r.vendor ?? r.vendor_group, count: 0, total: 0 };
      e.count += 1;
      e.total += Number(r.amount) * (r.type === "expense" ? -1 : 1);
      map.set(r.vendor_group, e);
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [rows]);

  function exportIrsCsv() {
    // Schedule C-ready: per-line totals grouped by IRS category
    const header = ["date","type","vendor","irs_category","subtotal","tax_rate","tax_amount","total","is_service","reimbursable","description"];
    const lines = [header.join(",")];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    for (const r of filtered) {
      lines.push([
        r.entry_date, r.type, esc(r.vendor ?? ""), esc(r.irs_category ?? ""),
        r.subtotal ?? "", r.tax_rate ?? "", r.tax_amount ?? "", r.amount,
        r.is_service, r.reimbursable, esc(r.description ?? ""),
      ].join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ledger-irs-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <AdminShell title="Bookkeeping">
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Stat icon={TrendingUp} label="Income" value={`$${totals.income.toLocaleString()}`} tone="success" />
        <Stat icon={TrendingDown} label="Expenses" value={`$${totals.expense.toLocaleString()}`} tone="destructive" />
        <Stat icon={Wallet} label="Net" value={`$${totals.net.toLocaleString()}`} tone={totals.net >= 0 ? "success" : "destructive"} />
        <Stat icon={Receipt} label="Sales Tax Collected" value={`$${totals.tax.toFixed(2)}`} tone="neutral" />
        <Stat icon={FileText} label="SE Tax Reserve" value={`$${totals.reserve.toFixed(2)}`} tone="neutral" />
      </div>

      {totals.reimb > 0 && (
        <div className="mb-4 text-sm text-gold border border-gold/30 bg-gold/5 rounded px-4 py-2">
          Reimbursable expenses pending: <strong>${totals.reimb.toFixed(2)}</strong>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <form onSubmit={add} className="lg:col-span-1 bg-surface/50 border border-gold/15 rounded-lg p-5 space-y-3">
          <h3 className="font-display text-xl text-champagne flex items-center gap-2"><Plus className="size-5 text-gold" /> New Entry</h3>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setType("income")}
              className={`px-3 py-2 rounded text-sm border ${type === "income" ? "border-success/60 bg-success/10 text-success" : "border-border text-muted-foreground"}`}>Income</button>
            <button type="button" onClick={() => setType("expense")}
              className={`px-3 py-2 rounded text-sm border ${type === "expense" ? "border-destructive/60 bg-destructive/10 text-destructive" : "border-border text-muted-foreground"}`}>Expense</button>
          </div>

          <Input label="Company / Vendor" type="text" value={vendor} onChange={setVendor} placeholder="e.g. Shell Aviation" />
          <Input label="Subtotal (pre-tax USD)" type="number" min="0" step="0.01" value={subtotal} onChange={setSubtotal} />
          <Input label={`Tax Rate (AL state ${(AL_STATE_TAX*100).toFixed(1)}% + local)`} type="number" min="0" step="0.0001" value={taxRate} onChange={setTaxRate} />

          <div className="text-xs text-muted-foreground bg-background/60 rounded p-2 space-y-0.5">
            <div className="flex justify-between"><span>Tax</span><span className="tabular-nums">${taxAmt.toFixed(2)}</span></div>
            <div className="flex justify-between font-medium text-champagne"><span>Total</span><span className="tabular-nums">${total.toFixed(2)}</span></div>
            {serviceReserve > 0 && <div className="flex justify-between text-gold"><span>SE tax reserve ({(SERVICE_TAX_RESERVE*100).toFixed(1)}%)</span><span className="tabular-nums">${serviceReserve.toFixed(2)}</span></div>}
          </div>

          <Select label="Internal Category" value={category} onChange={setCategory} options={CATEGORIES as readonly string[]} />
          <Select label="IRS Schedule C Category" value={irsCategory} onChange={setIrsCategory} options={IRS_CATEGORIES as readonly string[]} />
          <Input label="Date" type="date" value={entryDate} onChange={setEntryDate} />

          <div className="flex flex-wrap gap-3 text-xs">
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={isService} onChange={e => setIsService(e.target.checked)} /> Service revenue (reserve SE tax)</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={reimbursable} onChange={e => setReimbursable(e.target.checked)} /> Reimbursable</label>
          </div>

          <div>
            <label className="text-xs text-muted-foreground flex items-center gap-1.5"><Upload className="size-3" /> Receipt (PDF / image)</label>
            <input type="file" accept="image/*,application/pdf" onChange={e => setReceiptFile(e.target.files?.[0] ?? null)}
              className="w-full mt-1 text-xs file:mr-2 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-gold/10 file:text-gold" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500}
              className="w-full mt-1 bg-background border border-gold/20 rounded px-3 py-2 text-sm h-16" />
          </div>
          <button type="submit" disabled={busy} className="w-full gradient-gold text-gold-foreground font-medium px-4 py-2 rounded">
            {busy ? "Saving…" : "Add Entry"}
          </button>
        </form>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface/50 border border-gold/15 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <h3 className="font-display text-xl text-champagne">Monthly Summary</h3>
              <button onClick={exportIrsCsv} className="text-xs flex items-center gap-1.5 px-3 py-1.5 border border-gold/30 rounded hover:bg-gold/10 text-gold">
                <Download className="size-3" /> IRS-Ready CSV
              </button>
            </div>
            <div className="h-60">
              {monthly.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No entries yet.</div>
              ) : (
                <ResponsiveContainer>
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.1)" />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip contentStyle={{ background: "#0A0E1A", border: "1px solid rgba(201,168,76,0.3)" }} />
                    <Legend />
                    <Bar dataKey="income" fill="oklch(0.7 0.15 155)" radius={[4,4,0,0]} />
                    <Bar dataKey="expense" fill="oklch(0.62 0.22 25)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-surface/50 border border-gold/15 rounded-lg p-5">
            <h3 className="font-display text-xl text-champagne flex items-center gap-2 mb-3"><Building2 className="size-5 text-gold" /> Vendor Groups</h3>
            <p className="text-xs text-muted-foreground mb-3">Entries are grouped by the company prefix — a second purchase from “Shell Premium” rolls up with “Shell Aviation”.</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setGroupFilter("all")} className={`text-xs px-2.5 py-1 rounded border ${groupFilter==="all"?"border-gold bg-gold/10 text-gold":"border-border text-muted-foreground"}`}>All ({rows.length})</button>
              {vendorGroups.map(g => (
                <button key={g.group} onClick={() => setGroupFilter(g.group)}
                  className={`text-xs px-2.5 py-1 rounded border capitalize ${groupFilter===g.group?"border-gold bg-gold/10 text-gold":"border-border text-muted-foreground hover:border-gold/40"}`}>
                  {g.group} <span className="opacity-60">({g.count})</span>
                </button>
              ))}
              {vendorGroups.length === 0 && <span className="text-xs text-muted-foreground">No vendor data yet.</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface/50 border border-gold/15 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-background/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Vendor</th>
              <th className="text-left p-3">Type</th>
              <th className="text-right p-3">Subtotal</th>
              <th className="text-right p-3">Tax</th>
              <th className="text-right p-3">Total</th>
              <th className="text-left p-3">IRS Cat.</th>
              <th className="text-left p-3">Receipt</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">No entries.</td></tr>}
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-gold/10 hover:bg-gold/5">
                <td className="p-3 text-muted-foreground whitespace-nowrap">{r.entry_date}</td>
                <td className="p-3">
                  <div className="text-champagne">{r.vendor ?? "—"}</div>
                  {r.vendor_group && <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.vendor_group}</div>}
                </td>
                <td className="p-3">
                  <span className={`text-[10px] uppercase tracking-wider border rounded px-2 py-0.5 ${r.type === "income" ? "border-success/40 text-success bg-success/10" : "border-destructive/40 text-destructive bg-destructive/10"}`}>{r.type}</span>
                  {r.is_service && <span className="ml-1 text-[10px] uppercase border border-gold/40 text-gold bg-gold/10 rounded px-1.5 py-0.5">service</span>}
                  {r.reimbursable && <span className="ml-1 text-[10px] uppercase border border-gold/40 text-gold bg-gold/10 rounded px-1.5 py-0.5">reimb</span>}
                </td>
                <td className="p-3 text-right tabular-nums text-muted-foreground">{r.subtotal != null ? `$${Number(r.subtotal).toFixed(2)}` : "—"}</td>
                <td className="p-3 text-right tabular-nums text-muted-foreground">{r.tax_amount != null ? `$${Number(r.tax_amount).toFixed(2)}` : "—"}</td>
                <td className={`p-3 text-right tabular-nums ${r.type === "income" ? "text-success" : "text-destructive"}`}>
                  {r.type === "income" ? "+" : "−"}${Number(r.amount).toFixed(2)}
                </td>
                <td className="p-3 text-xs text-muted-foreground">{r.irs_category ?? "—"}</td>
                <td className="p-3">
                  {r.receipt_path
                    ? <button onClick={() => viewReceipt(r.receipt_path!)} className="text-gold hover:underline text-xs flex items-center gap-1"><FileText className="size-3" /> View</button>
                    : <span className="text-xs text-muted-foreground">—</span>}
                </td>
                <td className="p-3">
                  {(r.user_id === user?.id || isAdmin) && (
                    <button onClick={() => remove(r.id, r.receipt_path)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
        IRS compliance: amounts captured pre-tax with sales-tax broken out (Alabama state 4% + local — verify your county rate). Service income reserves an estimated 27.35% for self-employment + federal income tax. Retain receipts for 3 years (7 if claiming losses). This tool aids recordkeeping; consult a licensed CPA before filing.
      </p>
    </AdminShell>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Wallet; label: string; value: string; tone: "success" | "destructive" | "neutral" }) {
  const color = tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : "text-gold";
  return (
    <div className="bg-surface/50 border border-gold/15 rounded-lg p-5">
      <Icon className={`size-5 mb-2 ${color}`} />
      <div className="font-display text-2xl text-champagne tabular-nums">{value}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function Input({ label, type, value, onChange, min, step, placeholder }: { label: string; type: string; value: string; onChange: (v: string) => void; min?: string; step?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <input type={type} value={value} min={min} step={step} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 bg-background border border-gold/20 rounded px-3 py-2 text-sm" />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: readonly string[] }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 bg-background border border-gold/20 rounded px-3 py-2 text-sm capitalize">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
