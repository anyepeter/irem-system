"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketStatusBadge } from "./ticket-status-badge";
import { TicketTimeline } from "./ticket-timeline";
import { DiagnosticsForm } from "./diagnostics-form";
import { PaymentForm } from "./payment-form";
import {
  updateTicketStatus,
  markDiagnosticPaid,
  type ActionResult,
} from "@/actions/ticket";
import { PRIORITY_COLORS, STATUS_LABELS } from "@/lib/ticket-constants";
import {
  ArrowLeft,
  Crown,
  Smartphone,
  Phone,
  Calendar,
  User,
  Wrench,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
} from "lucide-react";

type TicketDetail = {
  id: string;
  ticketNumber: string;
  status: string;
  priority: string;
  deviceType: string;
  brand: string;
  serialNumber: string | null;
  issueDescription: string;
  diagnosticFee: unknown;
  diagnosticPaid: boolean;
  diagnosticFindings: string | null;
  requiredParts: string | null;
  estimatedCost: unknown;
  finalCost: unknown;
  laborCost: unknown;
  partsCost: unknown;
  totalAmount: unknown;
  amountPaid: unknown;
  paymentStatus: string;
  paymentMethod: string | null;
  deliveryMethod: string;
  deliveryAddress: string | null;
  deliveryFee: unknown;
  expectedReturnDate: string | null;
  createdAt: string;
  completedAt: string | null;
  customer: {
    id: number;
    name: string;
    phone: string;
    address: string;
    isVIP: boolean;
  };
  assignedTo: { id: string; username: string; phone: string };
  createdBy: { username: string };
  statusHistory: Array<{
    id: string;
    status: string;
    notes: string | null;
    createdAt: string;
    updatedBy: { username: string };
  }>;
};

type Props = {
  ticket: TicketDetail;
  user: {
    id: string;
    username: string;
    avatar: string | null;
    role: "ADMIN" | "CASHIER" | "TECHNICIAN";
  };
  backPath: string;
};

const ALL_STATUSES = Object.keys(STATUS_LABELS);

export function TicketDetailClient({ ticket, user, backPath }: Props) {
  const router = useRouter();
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<ActionResult | null>(null);
  const [newStatus, setNewStatus] = useState(ticket.status);
  const [statusNotes, setStatusNotes] = useState("");
  const [diagPaidLoading, setDiagPaidLoading] = useState(false);

  const isAdmin = user.role === "ADMIN";
  const isCashier = user.role === "CASHIER";
  const isTechnician = user.role === "TECHNICIAN";
  const canManage = isAdmin || isCashier;
  const canDiagnose =
    (isTechnician && ticket.assignedTo.id === user.id) || isAdmin;
  const showDiagForm =
    canDiagnose &&
    (ticket.status === "PENDING" ||
      ticket.status === "IN_DIAGNOSTICS");
  const showPayment =
    canManage &&
    ticket.status !== "PENDING" &&
    ticket.status !== "CANCELLED";

  const handleStatusUpdate = async () => {
    if (newStatus === ticket.status) return;
    setStatusLoading(true);
    setStatusResult(null);
    const res = await updateTicketStatus(ticket.id, newStatus, statusNotes);
    setStatusResult(res);
    setStatusLoading(false);
    if (res.success) {
      setStatusNotes("");
      setTimeout(() => {
        setStatusResult(null);
        router.refresh();
      }, 1000);
    }
  };

  const handleMarkDiagPaid = async () => {
    setDiagPaidLoading(true);
    await markDiagnosticPaid(ticket.id);
    setDiagPaidLoading(false);
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role} username={user.username} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={ticket.ticketNumber}
          subtitle="Ticket Details"
          username={user.username}
          avatar={user.avatar}
          role={user.role}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Back link */}
          <Link
            href={backPath}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tickets
          </Link>

          {/* Header section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {ticket.ticketNumber}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <TicketStatusBadge status={ticket.status} />
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    PRIORITY_COLORS[ticket.priority] || ""
                  }`}
                >
                  {ticket.priority}
                </span>
              </div>
            </div>

            {/* Diagnostic fee payment button */}
            {canManage &&
              Number(ticket.diagnosticFee) > 0 &&
              !ticket.diagnosticPaid &&
              ticket.status === "PENDING" && (
                <Button
                  onClick={handleMarkDiagPaid}
                  disabled={diagPaidLoading}
                  className="gap-2"
                >
                  {diagPaidLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Mark Diagnostic Fee Paid ({Number(ticket.diagnosticFee).toLocaleString()} XAF)
                </Button>
              )}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Ticket info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Customer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">
                        {ticket.customer.name}
                      </span>
                      {ticket.customer.isVIP && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">
                          <Crown className="w-3 h-3" /> VIP
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {ticket.customer.phone}
                    </div>
                    {ticket.customer.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {ticket.customer.address}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Device info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Device & Issue</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Smartphone className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">
                        {ticket.brand} {ticket.deviceType}
                      </span>
                      {ticket.serialNumber && (
                        <span className="text-gray-500">
                          (S/N: {ticket.serialNumber})
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      <FileText className="w-4 h-4 text-gray-400 inline mr-1.5" />
                      {ticket.issueDescription}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 pt-2 border-t">
                      <div className="flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5" />
                        {ticket.assignedTo.username}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Created {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                      {ticket.expectedReturnDate && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Expected{" "}
                          {new Date(
                            ticket.expectedReturnDate
                          ).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Diagnostics results (if submitted) */}
              {ticket.diagnosticFindings && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        Diagnostic Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs text-gray-500">
                          Findings
                        </Label>
                        <p className="text-sm mt-1">
                          {ticket.diagnosticFindings}
                        </p>
                      </div>
                      {ticket.requiredParts && (
                        <div>
                          <Label className="text-xs text-gray-500">
                            Required Parts
                          </Label>
                          <p className="text-sm mt-1">
                            {ticket.requiredParts}
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                        <div>
                          <Label className="text-xs text-gray-500">
                            Labor
                          </Label>
                          <p className="text-sm font-medium">
                            {Number(ticket.laborCost || 0).toLocaleString()} XAF
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">
                            Parts
                          </Label>
                          <p className="text-sm font-medium">
                            {Number(ticket.partsCost || 0).toLocaleString()} XAF
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">
                            Estimated Total
                          </Label>
                          <p className="text-sm font-bold">
                            {Number(
                              ticket.estimatedCost || 0
                            ).toLocaleString()}{" "}
                            XAF
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Diagnostics form (for technician) */}
              {showDiagForm && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <DiagnosticsForm
                    ticketId={ticket.id}
                    existingFindings={ticket.diagnosticFindings}
                    existingParts={ticket.requiredParts}
                    existingLabor={Number(ticket.laborCost || 0)}
                    existingPartsCost={Number(ticket.partsCost || 0)}
                    onSuccess={() => router.refresh()}
                  />
                </motion.div>
              )}

              {/* Status Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <TicketTimeline history={ticket.statusHistory} />
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right column - Actions */}
            <div className="space-y-6">
              {/* Status management */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Update Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label>New Status</Label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes (Optional)</Label>
                      <textarea
                        value={statusNotes}
                        onChange={(e) => setStatusNotes(e.target.value)}
                        placeholder="Add a note..."
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>

                    {statusResult && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                          statusResult.success
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {statusResult.success ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0" />
                        )}
                        {statusResult.message}
                      </motion.div>
                    )}

                    <Button
                      onClick={handleStatusUpdate}
                      className="w-full"
                      disabled={
                        statusLoading || newStatus === ticket.status
                      }
                    >
                      {statusLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Update Status"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Payment section */}
              {showPayment && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <PaymentForm
                    ticketId={ticket.id}
                    totalAmount={Number(ticket.totalAmount)}
                    amountPaid={Number(ticket.amountPaid)}
                    paymentStatus={ticket.paymentStatus}
                    diagnosticFee={Number(ticket.diagnosticFee)}
                    diagnosticPaid={ticket.diagnosticPaid}
                    finalCost={Number(ticket.finalCost || ticket.estimatedCost || 0)}
                    deliveryFee={Number(ticket.deliveryFee)}
                    onSuccess={() => router.refresh()}
                  />
                </motion.div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
