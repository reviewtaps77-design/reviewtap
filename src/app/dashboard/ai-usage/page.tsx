import { requireOwner, getSessionBusinessId } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { Sparkles, Bot, Zap, Clock, Users, ShieldAlert } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = {
  title: "AI Review Usage | ReviewTap",
};

export default async function AiUsagePage() {
  const session = await requireOwner();
  const businessId = getSessionBusinessId(session);

  const [aiUsageList, totalTokensResult, totalAiReviews] = await Promise.all([
    db.aiUsage.findMany({
      where: { businessId },
      include: { employee: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.aiUsage.aggregate({
      where: { businessId },
      _sum: { tokensUsed: true },
    }),
    db.review.count({
      where: { businessId, aiGenerated: true },
    }),
  ]);

  const totalTokens = totalTokensResult._sum.tokensUsed || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">AI Review Usage</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Monitor your automated customer review generation and OpenAI token consumption.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="AI Reviews Generated"
          value={totalAiReviews}
          icon={<Sparkles className="h-4 w-4 text-purple-600" />}
        />
        <StatCard
          title="Total Tokens Used"
          value={totalTokens.toLocaleString()}
          icon={<Zap className="h-4 w-4 text-amber-500" />}
        />
        <StatCard
          title="Model"
          value={process.env.OPENAI_MODEL || "gpt-4o-mini"}
          icon={<Bot className="h-4 w-4 text-primary" />}
        />
      </div>

      {/* AI Usage Log Table */}
      <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900">Recent AI Syntheses</CardTitle>
          <CardDescription className="text-xs">
            Log of AI review generation requests triggered by customer taps.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/75">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Timestamp</TableHead>
                <TableHead className="font-bold text-slate-700">Model</TableHead>
                <TableHead className="font-bold text-slate-700">Staff Attributed</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Tokens</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aiUsageList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-400 text-xs">
                    No AI generation records found yet.
                  </TableCell>
                </TableRow>
              ) : (
                aiUsageList.map((usage) => (
                  <TableRow key={usage.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-xs text-slate-600">
                      {new Date(usage.createdAt).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-700 font-medium">
                      {usage.model}
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">
                      {usage.employee?.name ? (
                        <span className="font-semibold text-slate-800">{usage.employee.name}</span>
                      ) : (
                        <span className="text-slate-400">Main Business</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-slate-800">
                      {usage.tokensUsed}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
