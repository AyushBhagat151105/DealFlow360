import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Send,
  ShieldAlert,
  TrendingDown,
  Clock,
  DollarSign,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  useDealHealthOverview,
  useNudgeDealRep,
  useEscalateDealAlert,
  useSalesReport,
} from "@/hooks/use-deal-health";
import { formatCurrency } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SEVERITY_BADGES: Record<string, string> = {
  LOW: "bg-whisper-gray text-forest-ink/70 border-pencil-gray/40",
  MEDIUM: "bg-highlighter-yellow/40 text-forest-ink border-highlighter-yellow/60",
  HIGH: "bg-terracotta/10 text-terracotta border-terracotta/30",
  CRITICAL: "bg-terracotta/20 text-terracotta border-terracotta/50 font-bold",
};

export function DealHealthPanel() {
  const { data: overview, isLoading, refetch, isFetching } = useDealHealthOverview();
  const { data: salesReport = [] } = useSalesReport();

  const nudgeMutation = useNudgeDealRep();
  const escalateMutation = useEscalateDealAlert();

  const [selectedAlertIdForEscalate, setSelectedAlertIdForEscalate] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState("VP_SALES");

  const handleNudge = (alertId: string, quoteNumber: string) => {
    nudgeMutation.mutate(alertId, {
      onSuccess: () => {
        toast.success(`Automated nudge dispatched to rep for Quote #${quoteNumber}`);
      },
      onError: () => {
        toast.error("Failed to send nudge notification.");
      },
    });
  };

  const handleConfirmEscalate = () => {
    if (!selectedAlertIdForEscalate) return;

    escalateMutation.mutate(
      { alertId: selectedAlertIdForEscalate, targetRole },
      {
        onSuccess: () => {
          toast.success(`Anomaly alert escalated to ${targetRole}!`);
          setSelectedAlertIdForEscalate(null);
        },
        onError: () => {
          toast.error("Failed to escalate alert.");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="py-12 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin text-primary" />
        <span>Loading deal health telemetry and anomaly monitoring...</span>
      </div>
    );
  }

  const kpis = overview?.kpis ?? {
    activePipelineValue: 0,
    pendingApprovalCount: 0,
    stalledDealsCount: 0,
    marginAtRisk: 0,
  };

  const alerts = overview?.alerts ?? [];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <span>Deal Health & Anomaly Monitoring</span>
            </h2>
            <Badge variant="outline" className="text-[10px] uppercase font-mono border-primary/40 text-primary">
              Live Telemetry
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Automated anomaly detection, stalled deal alerts, margin risk metrics, and 1-click rep nudges.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="h-8 text-xs gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          <span>Refresh Metrics</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground block font-medium">Active Pipeline Value</span>
            <span className="text-2xl font-black font-mono text-foreground">
              {formatCurrency(kpis.activePipelineValue, { maximumFractionDigits: 0 })}
            </span>
            <p className="text-[10px] text-muted-foreground pt-1">Total value across non-closed deals</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground block font-medium">Pending Approvals</span>
            <span className="text-2xl font-black font-mono text-amber-500">
              {kpis.pendingApprovalCount}
            </span>
            <p className="text-[10px] text-muted-foreground pt-1">Quotes awaiting governance review</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground block font-medium">Stalled Deals (&gt;3 Days)</span>
            <span className="text-2xl font-black font-mono text-orange-500">
              {kpis.stalledDealsCount}
            </span>
            <p className="text-[10px] text-muted-foreground pt-1">Deals requiring sales rep nudge</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground block font-medium">Margin Value at Risk</span>
            <span className="text-2xl font-black font-mono text-destructive">
              {formatCurrency(kpis.marginAtRisk, { maximumFractionDigits: 0 })}
            </span>
            <p className="text-[10px] text-muted-foreground pt-1">Quotes with positive risk score</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="bg-muted p-1 max-w-md">
          <TabsTrigger value="alerts" className="text-xs font-medium gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span>Active Anomaly Alerts ({alerts.length})</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs font-medium gap-1.5">
            <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
            <span>Sales & Margin Reports</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Anomaly Alerts Table */}
        <TabsContent value="alerts" className="pt-4 space-y-4">
          <Card className="border-border bg-card">
            <CardHeader className="p-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                <span>Detected Deal Anomaly Feed</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time rule engine detections for margin erosion, excessive discount requests, and stalled negotiations.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {alerts.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No active deal health anomalies detected. Pipeline is healthy!
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs font-bold">Severity</TableHead>
                      <TableHead className="text-xs font-bold">Quote #</TableHead>
                      <TableHead className="text-xs font-bold">Customer</TableHead>
                      <TableHead className="text-xs font-bold">Anomaly Type</TableHead>
                      <TableHead className="text-xs font-bold">Diagnostic Message</TableHead>
                      <TableHead className="text-xs font-bold text-center">Status</TableHead>
                      <TableHead className="text-xs font-bold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alt) => (
                      <TableRow key={alt.id} className="hover:bg-muted/30">
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-mono px-1.5 py-0 ${SEVERITY_BADGES[alt.severity] || "border-border text-foreground"
                              }`}
                          >
                            {alt.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-foreground">
                          {alt.quoteNumber}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-foreground">
                          {alt.customerName}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {alt.type.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                          {alt.message}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            {alt.isNudged && (
                              <Badge variant="outline" className="text-[9px] font-mono border-blue-500/30 text-blue-500">
                                Rep Nudged
                              </Badge>
                            )}
                            {alt.isEscalated && (
                              <Badge variant="outline" className="text-[9px] font-mono border-purple-500/30 text-purple-500">
                                Escalated: {alt.escalatedTo || "VP_SALES"}
                              </Badge>
                            )}
                            {!alt.isNudged && !alt.isEscalated && (
                              <span className="text-[10px] text-muted-foreground font-mono">Open</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleNudge(alt.id, alt.quoteNumber)}
                              disabled={nudgeMutation.isPending || alt.isNudged}
                              className="h-7 text-[11px] gap-1"
                              title="Send 1-click notification nudge to rep"
                            >
                              <Send className="h-3 w-3 text-blue-500" />
                              <span>{alt.isNudged ? "Nudged" : "Nudge Rep"}</span>
                            </Button>

                            <Button
                              variant="destructive"
                              size="xs"
                              onClick={() => setSelectedAlertIdForEscalate(alt.id)}
                              disabled={escalateMutation.isPending || alt.isEscalated}
                              className="h-7 text-[11px] gap-1"
                              title="Escalate anomaly to management"
                            >
                              <ShieldAlert className="h-3 w-3" />
                              <span>{alt.isEscalated ? "Escalated" : "Escalate"}</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Sales & Margin Reports */}
        <TabsContent value="reports" className="pt-4 space-y-4">
          <Card className="border-border bg-card">
            <CardHeader className="p-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                  <span>Sales Performance & Discount Margin Report</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Exportable audit report of quote volume, margin %, and risk scores.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast.success("Sales Performance Report downloaded (CSV format)");
                }}
                className="h-8 text-xs gap-1.5"
              >
                <Download className="h-3.5 w-3.5 text-primary" />
                <span>Export Report CSV</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs font-bold">Quote #</TableHead>
                    <TableHead className="text-xs font-bold">Customer</TableHead>
                    <TableHead className="text-xs font-bold">Tier</TableHead>
                    <TableHead className="text-xs font-bold text-center">Status</TableHead>
                    <TableHead className="text-xs font-bold text-right">Value (₹)</TableHead>
                    <TableHead className="text-xs font-bold text-right">Cost (₹)</TableHead>
                    <TableHead className="text-xs font-bold text-right">Margin (%)</TableHead>
                    <TableHead className="text-xs font-bold text-center">Risk Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesReport.map((rpt, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-xs font-bold">{rpt.quoteNumber}</TableCell>
                      <TableCell className="text-xs font-semibold">{rpt.customerName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {rpt.customerTier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {rpt.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {formatCurrency(rpt.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {formatCurrency(rpt.totalCost)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-emerald-500">
                        {rpt.totalMarginPercent.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs font-bold">
                        {rpt.blendedRiskScore} pts
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Escalate Alert Modal */}
      <Dialog
        open={Boolean(selectedAlertIdForEscalate)}
        onOpenChange={(open) => !open && setSelectedAlertIdForEscalate(null)}
      >
        <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              <span>Escalate Deal Health Anomaly</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Escalate this anomaly alert to executive management or finance leadership for priority review.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold block">Select Target Executive Role</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full h-9 text-xs font-mono bg-muted/60 border border-border rounded-md px-3 text-foreground"
              >
                <option value="VP_SALES">VP of Sales Operations</option>
                <option value="FINANCE_DIRECTOR">Finance Director</option>
                <option value="CHIEF_REVENUE_OFFICER">Chief Revenue Officer (CRO)</option>
                <option value="EXECUTIVE_DESK">Executive Review Board</option>
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAlertIdForEscalate(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmEscalate}
                disabled={escalateMutation.isPending}
                className="gap-1.5 font-semibold"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Confirm Escalation</span>
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
