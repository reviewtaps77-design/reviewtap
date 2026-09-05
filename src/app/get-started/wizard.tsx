"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BusinessImageUpload } from "@/components/business-image-upload";
import { updateBusinessProfile, completeOnboarding } from "@/actions/business";
import { createEmployee, deleteEmployee } from "@/actions/employee";
import {
  createComplaintTable,
  deleteComplaintTable,
  createComplaintCategory,
  deleteComplaintCategory,
  toggleComplaintCategory,
  updateComplaintSettings,
} from "@/actions/complaint";
import {
  createAiPromptOption,
  deleteAiPromptOption,
  toggleAiPromptOption,
} from "@/actions/ai-prompt";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Users,
  QrCode,
  MessageSquareWarning,
  Sparkles,
  CheckCircle2,
  Loader2,
  Trash2,
  Plus,
  PartyPopper,
} from "lucide-react";

interface WizardProps {
  business: {
    id: string;
    name: string;
    phone: string | null;
    category: string | null;
    address: string | null;
    description: string | null;
    googleReviewUrl: string | null;
    brandColor: string;
    logoUrl: string | null;
    coverUrl: string | null;
  };
  initialEmployees: { id: string; name: string; employeeCode: string | null; role: string | null; department: string | null }[];
  initialTables: { id: string; name: string; branch: string | null; status: string; qrCount: number }[];
  initialCategories: { id: string; label: string; isActive: boolean }[];
  initialAiOptions: { id: string; label: string; isActive: boolean }[];
  initialSettings: { heading: string | null; description: string | null; allowDescription: boolean } | null;
}

const STEPS = [
  { icon: Building2, title: "Business profile", desc: "Name, contact, Google link & colors" },
  { icon: Users, title: "Staff", desc: "Add the people customers will rate" },
  { icon: QrCode, title: "Spots", desc: "Tables, rooms or counters — QR auto-created" },
  { icon: MessageSquareWarning, title: "Complaint options", desc: "Reasons customers can pick + page text" },
  { icon: Sparkles, title: "Custom AI Tags", desc: "Create the tags customers tap on the AI review page" },
  { icon: PartyPopper, title: "Review & Complete", desc: "Check everything and open your dashboard" },
];

export default function Wizard(props: WizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [employees, setEmployees] = useState(props.initialEmployees);
  const [tables, setTables] = useState(props.initialTables);
  const [categories, setCategories] = useState(props.initialCategories);
  const [aiOptions, setAiOptions] = useState(props.initialAiOptions);

  const finish = async (skipped: boolean) => {
    setBusy(true);
    try {
      const res = await completeOnboarding();
      if (!res.success) {
        toast.error(res.error || "Could not finish setup.");
        setBusy(false);
        return;
      }
      toast.success(skipped ? "Setup skipped — you can fill details later." : "Setup complete! Welcome to ReviewTap.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Could not finish setup.");
      setBusy(false);
    }
  };

  // ---- profile ----
  const saveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await updateBusinessProfile(new FormData(e.currentTarget));
      if (!res.success) {
        toast.error(res.error || "Could not save profile.");
        return;
      }
      toast.success("Business profile saved.");
      setStep(2);
    } finally {
      setBusy(false);
    }
  };

  // ---- staff ----
  const addEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    try {
      const res = await createEmployee(new FormData(form));
      if (!res.success || !res.employeeId) {
        toast.error(res.error || "Could not add staff member.");
        return;
      }
      const fd = new FormData(form);
      setEmployees((p) => [
        ...p,
        {
          id: res.employeeId as string,
          name: String(fd.get("name") || ""),
          employeeCode: (fd.get("employeeCode") as string) || null,
          role: (fd.get("role") as string) || null,
          department: (fd.get("department") as string) || null,
        },
      ]);
      form.reset();
      toast.success("Staff member added — personal QR created automatically.");
    } finally {
      setBusy(false);
    }
  };

  const removeEmployee = async (id: string) => {
    const res = await deleteEmployee(id);
    if (!res.success) {
      toast.error(res.error || "Could not remove staff member.");
      return;
    }
    setEmployees((p) => p.filter((e) => e.id !== id));
  };

  // ---- spots ----
  const addTable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    try {
      const res = await createComplaintTable(new FormData(form));
      if (!res.success || !res.tableId) {
        toast.error(res.error || "Could not add spot.");
        return;
      }
      const fd = new FormData(form);
      setTables((p) => [
        ...p,
        {
          id: res.tableId as string,
          name: String(fd.get("name") || ""),
          branch: (fd.get("branch") as string) || null,
          status: "active",
          qrCount: 1,
        },
      ]);
      form.reset();
      toast.success("Spot added — complaint QR created automatically.");
    } finally {
      setBusy(false);
    }
  };

  const removeTable = async (id: string) => {
    const res = await deleteComplaintTable(id);
    if (!res.success) {
      toast.error(res.error || "Could not remove spot.");
      return;
    }
    setTables((p) => p.filter((t) => t.id !== id));
  };

  // ---- complaint options ----
  const addCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    try {
      const fd = new FormData(form);
      fd.set("isActive", "true");
      const res = await createComplaintCategory(fd);
      if (!res.success || !res.categoryId) {
        toast.error(res.error || "Could not add option.");
        return;
      }
      setCategories((p) => [...p, { id: res.categoryId as string, label: String(fd.get("label") || ""), isActive: true }]);
      form.reset();
      toast.success("Complaint option added.");
    } finally {
      setBusy(false);
    }
  };

  const removeCategory = async (id: string) => {
    const res = await deleteComplaintCategory(id);
    if (!res.success) {
      toast.error(res.error || "Could not remove option.");
      return;
    }
    setCategories((p) => p.filter((c) => c.id !== id));
  };

  const flipCategory = async (id: string) => {
    const res = await toggleComplaintCategory(id);
    if (!res.success) {
      toast.error(res.error || "Could not update option.");
      return;
    }
    setCategories((p) => p.map((c) => (c.id === id ? { ...c, isActive: res.isActive ?? !c.isActive } : c)));
  };

  const saveComplaintSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await updateComplaintSettings(new FormData(e.currentTarget));
      if (!res.success) {
        toast.error(res.error || "Could not save settings.");
        return;
      }
      toast.success("Complaint page settings saved.");
    } finally {
      setBusy(false);
    }
  };

  // ---- AI options ----
  const addAiOption = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    try {
      const fd = new FormData(form);
      fd.set("isActive", "true");
      const res = await createAiPromptOption(fd);
      if (!res.success || !res.optionId) {
        toast.error(res.error || "Could not add option.");
        return;
      }
      setAiOptions((p) => [...p, { id: res.optionId as string, label: String(fd.get("label") || ""), isActive: true }]);
      form.reset();
      toast.success("AI quick option added.");
    } finally {
      setBusy(false);
    }
  };

  const removeAiOption = async (id: string) => {
    const res = await deleteAiPromptOption(id);
    if (!res.success) {
      toast.error(res.error || "Could not remove option.");
      return;
    }
    setAiOptions((p) => p.filter((o) => o.id !== id));
  };

  const flipAiOption = async (id: string) => {
    const res = await toggleAiPromptOption(id);
    if (!res.success) {
      toast.error(res.error || "Could not update option.");
      return;
    }
    setAiOptions((p) => p.map((o) => (o.id === id ? { ...o, isActive: res.isActive ?? !o.isActive } : o)));
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
          <div className="h-2 w-full bg-primary" />
          <div className="p-5 sm:p-8">
            {/* header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                  {step === 0 ? `Welcome, ${props.business.name}!` : STEPS[step - 1].title}
                </h1>
                <p className="mt-1 text-sm font-bold text-slate-700 sm:text-base">
                  {step === 0 ? "Let's get your business ready in a few quick steps." : STEPS[step - 1].desc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => finish(true)}
                disabled={busy}
                className="shrink-0 text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Skip for now
              </button>
            </div>

            {/* progress */}
            <div className="mt-5 flex items-center gap-1.5" aria-label="Setup progress">
              {STEPS.map((s, i) => (
                <div
                  key={s.title}
                  className={`h-2 flex-1 rounded-full transition-colors ${i < step ? "bg-emerald-500" : i === step ? "bg-primary" : "bg-slate-200"}`}
                />
              ))}
            </div>
            <p className="mt-1.5 text-[11px] font-medium text-slate-400">
              Step {step + 1} of {STEPS.length + 1}
            </p>

            <div className="mt-6">
              {step === 0 && (
                <div className="space-y-3">
                  {STEPS.slice(1).map((s) => {
                    const Icon = s.icon;
                    return (
                      <div key={s.title} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{s.title}</p>
                          <p className="text-sm font-semibold text-slate-600">{s.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                  <Button onClick={() => setStep(1)} className="h-12 w-full rounded-2xl text-base font-bold">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {step === 1 && (
                <form onSubmit={saveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Business name *</Label>
                      <Input name="name" defaultValue={props.business.name} required className="rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Category</Label>
                      <Input name="category" defaultValue={props.business.category || ""} placeholder="Café, Salon, Clinic…" className="rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Phone</Label>
                      <Input name="phone" defaultValue={props.business.phone || ""} className="rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Brand color</Label>
                      <Input name="brandColor" type="color" defaultValue={props.business.brandColor || "#2563eb"} className="h-11 w-20 cursor-pointer rounded-xl p-1" />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs font-semibold">Google review link * (customers post reviews here)</Label>
                      <Input name="googleReviewUrl" defaultValue={props.business.googleReviewUrl || ""} placeholder="https://g.page/r/…/review" required className="rounded-xl" />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs font-semibold">Address</Label>
                      <Input name="address" defaultValue={props.business.address || ""} className="rounded-xl" />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs font-semibold">About / tagline</Label>
                      <Textarea name="description" defaultValue={props.business.description || ""} rows={2} className="rounded-xl text-sm" />
                    </div>
                  </div>
                  <BusinessImageUpload
                    businessId={props.business.id}
                    logoUrl={props.business.logoUrl || ""}
                    coverUrl={props.business.coverUrl || ""}
                  />
                  <WizardNav step={step} setStep={setStep} busy={busy} nextLabel="Save & Continue" nextType="submit" />
                </form>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <form onSubmit={addEmployee} className="grid grid-cols-1 gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-2">
                    <Input name="name" placeholder="Full name *" required className="rounded-xl bg-white" />
                    <Input name="employeeCode" placeholder="Code (EMP-001)" className="rounded-xl bg-white" />
                    <Input name="role" placeholder="Role (Waiter…)" className="rounded-xl bg-white" />
                    <Input name="department" placeholder="Department" className="rounded-xl bg-white" />
                    <Button type="submit" disabled={busy} className="rounded-xl sm:col-span-2">
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Staff (QR auto-created)
                    </Button>
                  </form>
                  {employees.length === 0 ? (
                    <p className="py-3 text-center text-xs text-slate-400">No staff yet — add at least one if customers rate individuals.</p>
                  ) : (
                    <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-2xl border border-slate-100 px-3">
                      {employees.map((e) => (
                        <div key={e.id} className="flex items-center justify-between gap-2 py-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{e.name}</p>
                            <p className="text-[11px] text-slate-400">{e.role || "Staff"}{e.employeeCode ? ` • ${e.employeeCode}` : ""}</p>
                          </div>
                          <button type="button" onClick={() => removeEmployee(e.id)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${e.name}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <WizardNav step={step} setStep={setStep} busy={busy} onNext={() => setStep(3)} />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <p className="rounded-2xl bg-blue-50 p-3 text-xs leading-relaxed text-blue-900">
                    Spots work for every business — tables, rooms, counters or beds. <b>Each spot instantly gets its own complaint QR</b> ready to print from QR &amp; NFC Codes.
                  </p>
                  <form onSubmit={addTable} className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-3 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Spot name *</Label>
                      <Input name="name" placeholder="Table 12, Room 101, Counter 2…" required className="rounded-xl bg-white" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Branch (optional)</Label>
                      <Input name="branch" placeholder="Pune" className="rounded-xl bg-white" />
                    </div>
                      <Button type="submit" disabled={busy} className="rounded-xl sm:w-auto">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Spot
                      </Button>
                  </form>
                  {tables.length === 0 ? (
                    <p className="py-3 text-center text-xs text-slate-400">No spots yet — add the places customers complain from.</p>
                  ) : (
                    <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-2xl border border-slate-100 px-3">
                      {tables.map((t) => (
                        <div key={t.id} className="flex items-center justify-between gap-2 py-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {t.name}
                              {t.branch && <span className="ml-2 text-xs font-normal text-slate-400">{t.branch}</span>}
                            </p>
                            <p className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                              <CheckCircle2 className="h-3 w-3" /> QR ready
                            </p>
                          </div>
                          <button type="button" onClick={() => removeTable(t.id)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${t.name}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <WizardNav step={step} setStep={setStep} busy={busy} onNext={() => setStep(4)} />
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <form onSubmit={addCategory} className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-3 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">New complaint option *</Label>
                      <Input name="label" placeholder="e.g. Waiting Time" required className="rounded-xl bg-white" />
                    </div>
                      <Button type="submit" disabled={busy} className="rounded-xl sm:w-auto">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
                      </Button>
                    </form>
                  <div className="max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-2xl border border-slate-100 px-3">
                    {categories.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-2 py-2">
                        <p className={`truncate text-sm font-semibold ${c.isActive ? "text-slate-900" : "text-slate-400 line-through"}`}>{c.label}</p>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button type="button" onClick={() => flipCategory(c.id)} className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600">
                            {c.isActive ? "Hide" : "Show"}
                          </button>
                          <button type="button" onClick={() => removeCategory(c.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${c.label}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={saveComplaintSettings} className="space-y-3 rounded-2xl bg-slate-50 p-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Complaint page heading</Label>
                      <Input name="heading" defaultValue={props.initialSettings?.heading || "What went wrong?"} maxLength={200} className="rounded-xl bg-white" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Page description</Label>
                      <Textarea name="description" defaultValue={props.initialSettings?.description || ""} rows={2} maxLength={600} className="rounded-xl bg-white text-sm" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <select name="allowDescription" defaultValue={props.initialSettings?.allowDescription === false ? "false" : "true"} className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700">
                        <option value="true">Show description box</option>
                        <option value="false">Options only</option>
                      </select>
                      <Button type="submit" disabled={busy} size="sm" className="rounded-xl">Save</Button>
                    </div>
                  </form>
                  <WizardNav step={step} setStep={setStep} busy={busy} onNext={() => setStep(5)} />
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">These chips appear on your AI Review Assistant page under “What did you like most?”.</p>
                  <form onSubmit={addAiOption} className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-3 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">New quick option *</Label>
                      <Input name="label" placeholder="e.g. Live music nights" required className="rounded-xl bg-white" />
                    </div>
                      <Button type="submit" disabled={busy} className="rounded-xl sm:w-auto">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
                      </Button>
                    </form>
                  <div className="max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-2xl border border-slate-100 px-3">
                    {aiOptions.map((o) => (
                      <div key={o.id} className="flex items-center justify-between gap-2 py-2">
                        <p className={`truncate text-sm font-semibold ${o.isActive ? "text-slate-900" : "text-slate-400 line-through"}`}>{o.label}</p>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button type="button" onClick={() => flipAiOption(o.id)} className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600">
                            {o.isActive ? "Hide" : "Show"}
                          </button>
                          <button type="button" onClick={() => removeAiOption(o.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${o.label}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <WizardNav step={step} setStep={setStep} busy={busy} onNext={() => setStep(6)} />
                </div>
              )}

              {step === 6 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { label: "Staff members", value: employees.length },
                      { label: "Spots (QR ready)", value: tables.length },
                      { label: "Complaint options", value: categories.filter((c) => c.isActive).length },
                      { label: "AI quick picks", value: aiOptions.filter((o) => o.isActive).length },
                    ].map((s) => (
                      <div key={s.label} className="rounded-2xl bg-slate-50 p-4 text-center">
                        <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
                        <p className="mt-0.5 text-[11px] font-medium text-slate-500">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-xs leading-relaxed text-slate-500">
                    Print your QR codes from <b>QR &amp; NFC Codes</b> and place them at each spot. You can change everything later from the dashboard.
                  </p>
                  <Button onClick={() => finish(false)} disabled={busy} className="h-12 w-full rounded-2xl text-base font-bold">
                    {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                    {busy ? "Opening dashboard…" : "Complete Setup"}
                  </Button>
                  <WizardNav step={step} setStep={setStep} busy={busy} hideNext />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function WizardNav({
  step,
  setStep,
  busy,
  onNext,
  nextLabel = "Continue",
  nextType = "button",
  hideNext = false,
}: {
  step: number;
  setStep: (n: number) => void;
  busy: boolean;
  onNext?: () => void;
  nextLabel?: string;
  nextType?: "button" | "submit";
  hideNext?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 pt-1">
      <Button
        type="button"
        variant="ghost"
        disabled={busy || step <= 1}
        onClick={() => setStep(step - 1)}
        className="rounded-xl text-xs"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Button>
      {!hideNext && (
        <Button
          type={nextType}
          disabled={busy}
          onClick={nextType === "button" ? onNext : undefined}
          className="h-11 rounded-xl px-6 font-bold"
        >
          {nextLabel} <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
