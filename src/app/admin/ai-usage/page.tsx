import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { Bot, Sparkles, Zap } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata = { title: "AI Usage | ReviewTap" };

export default async function AdminAiUsagePage() {
  await requireAdmin();
  const [usage, tokens, reviews] = await Promise.all([
    db.aiUsage.findMany({ include: { business: true, employee: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    db.aiUsage.aggregate({ _sum: { tokensUsed: true } }),
    db.review.count({ where: { aiGenerated: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight text-slate-900">AI Usage</h1><p className="text-sm text-slate-500 mt-0.5">Monitor AI review generation across all businesses.</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="AI Reviews Generated" value={reviews} icon={<Sparkles className="h-4 w-4 text-purple-600" />} />
        <StatCard title="Total Tokens Used" value={(tokens._sum.tokensUsed || 0).toLocaleString()} icon={<Zap className="h-4 w-4 text-amber-500" />} />
        <StatCard title="Model" value={process.env.OPENAI_MODEL || "gpt-4o-mini"} icon={<Bot className="h-4 w-4 text-primary" />} />
      </div>
      <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100"><CardTitle className="text-base">Recent AI Syntheses</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>Business</TableHead><TableHead>Staff</TableHead><TableHead>Model</TableHead><TableHead className="text-right">Tokens</TableHead></TableRow></TableHeader><TableBody>
          {usage.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-400">No AI usage records found.</TableCell></TableRow> : usage.map((item) => <TableRow key={item.id}><TableCell className="text-xs">{new Date(item.createdAt).toLocaleString("en-IN")}</TableCell><TableCell className="text-xs font-semibold">{item.business.name}</TableCell><TableCell className="text-xs">{item.employee?.name || "Main Business"}</TableCell><TableCell className="text-xs font-mono">{item.model}</TableCell><TableCell className="text-right text-xs font-mono font-bold">{item.tokensUsed}</TableCell></TableRow>)}
        </TableBody></Table></CardContent>
      </Card>
    </div>
  );
}
