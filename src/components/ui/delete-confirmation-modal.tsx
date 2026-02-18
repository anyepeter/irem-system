"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import type { DeleteCheckResult } from "@/actions/delete";

type Props = {
  open: boolean;
  onClose: () => void;
  checkResult: DeleteCheckResult | null;
  loading: boolean;
  onConfirm: () => void;
  deleting: boolean;
  result: { success: boolean; message: string } | null;
  entityType: string;
};

export function DeleteConfirmationModal({
  open,
  onClose,
  checkResult,
  loading,
  onConfirm,
  deleting,
  result,
  entityType,
}: Props) {
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (!open) setConfirmText("");
  }, [open]);

  const hasRelatedData =
    checkResult && checkResult.relatedData.length > 0;
  const needsTypedConfirmation = hasRelatedData;
  const canConfirm = needsTypedConfirmation
    ? confirmText === "DELETE"
    : true;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Delete {entityType}
          </DialogTitle>
          {checkResult && (
            <DialogDescription className="text-left">
              {checkResult.message}
            </DialogDescription>
          )}
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">
              Checking related data...
            </span>
          </div>
        )}

        {!loading && checkResult && checkResult.canDelete && (
          <div className="space-y-4">
            {/* Related data warning */}
            {hasRelatedData && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium text-red-800">
                  The following related records will be permanently deleted:
                </p>
                <ul className="space-y-1">
                  {checkResult.relatedData.map((item) => (
                    <li
                      key={item.label}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-red-700">{item.label}</span>
                      <span className="font-semibold text-red-900 bg-red-100 px-2 py-0.5 rounded">
                        {item.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Type DELETE confirmation */}
            {needsTypedConfirmation && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Type <span className="font-bold text-red-600">DELETE</span> to
                  confirm:
                </p>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="font-mono"
                  autoFocus
                />
              </div>
            )}

            {/* Result message */}
            {result && (
              <div
                className={`text-sm px-3 py-2 rounded-lg ${
                  result.success
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {result.message}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={onClose} disabled={deleting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={onConfirm}
                disabled={deleting || !canConfirm}
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-1" />
                )}
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        )}

        {!loading && checkResult && !checkResult.canDelete && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">{checkResult.message}</p>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
