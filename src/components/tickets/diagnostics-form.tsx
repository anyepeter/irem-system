"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitDiagnostics, type ActionResult } from "@/actions/ticket";
import { Loader2, CheckCircle2, AlertCircle, Stethoscope } from "lucide-react";

type Props = {
  ticketId: string;
  existingFindings?: string | null;
  existingParts?: string | null;
  existingLabor?: number;
  existingPartsCost?: number;
  onSuccess?: () => void;
};

export function DiagnosticsForm({
  ticketId,
  existingFindings,
  existingParts,
  existingLabor = 0,
  existingPartsCost = 0,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [findings, setFindings] = useState(existingFindings || "");
  const [requiredParts, setRequiredParts] = useState(existingParts || "");
  const [laborCost, setLaborCost] = useState(existingLabor);
  const [partsCost, setPartsCost] = useState(existingPartsCost);

  const estimatedTotal = laborCost + partsCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.set("diagnosticFindings", findings);
    formData.set("requiredParts", requiredParts);
    formData.set("laborCost", String(laborCost));
    formData.set("partsCost", String(partsCost));

    const res = await submitDiagnostics(ticketId, formData);
    setResult(res);
    setLoading(false);

    if (res.success) {
      setTimeout(() => {
        setResult(null);
        onSuccess?.();
      }, 1500);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Stethoscope className="w-4 h-4" />
          Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Diagnostic Findings</Label>
            <textarea
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="Describe what you found during diagnostics..."
              required
              minLength={10}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <Label>Required Parts</Label>
            <textarea
              value={requiredParts}
              onChange={(e) => setRequiredParts(e.target.value)}
              placeholder="List any parts needed for repair..."
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Labor Cost (XAF)</Label>
              <Input
                type="number"
                value={laborCost}
                onChange={(e) => setLaborCost(Number(e.target.value))}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Parts Cost (XAF)</Label>
              <Input
                type="number"
                value={partsCost}
                onChange={(e) => setPartsCost(Number(e.target.value))}
                min={0}
              />
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Estimated Total</span>
            <span className="text-lg font-bold text-gray-900">
              {estimatedTotal.toLocaleString()} XAF
            </span>
          </div>

          {result && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                result.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              {result.message}
            </motion.div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Diagnostics"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
