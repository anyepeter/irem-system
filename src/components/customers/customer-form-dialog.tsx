"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  createCustomer,
  updateCustomer,
  type ActionResult,
} from "@/actions/customer";
import {
  UserPlus,
  Pencil,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Crown,
  MapPin,
} from "lucide-react";

type Customer = {
  id: number;
  name: string;
  phone: string;
  address: string;
  isVIP: boolean;
};

type CustomerFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSuccess?: () => void;
};

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerFormDialogProps) {
  const isEdit = !!customer;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isVIP, setIsVIP] = useState(false);

  useEffect(() => {
    if (open) {
      setName(customer?.name ?? "");
      setPhone(customer?.phone ?? "");
      setAddress(customer?.address ?? "");
      setIsVIP(customer?.isVIP ?? false);
      setResult(null);
    }
  }, [open, customer]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("phone", phone);
    formData.set("address", address);
    formData.set("isVIP", String(isVIP));

    const res = isEdit
      ? await updateCustomer(customer!.id, formData)
      : await createCustomer(formData);

    setResult(res);
    setLoading(false);

    if (res.success) {
      setTimeout(() => {
        onOpenChange(false);
        setResult(null);
        onSuccess?.();
      }, 1200);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setResult(null);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? (
              <Pencil className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {isEdit ? "Edit Customer" : "Create Customer"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Update ${customer?.name}'s information.`
              : "Add a new customer to the system."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="customer-name">Customer Name</Label>
            <Input
              id="customer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="customer-phone">Phone Number (WhatsApp)</Label>
            <Input
              id="customer-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+237 6XX XXX XXX"
              required
            />
            <p className="text-xs text-gray-500">
              Enter the WhatsApp number with country code
            </p>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="customer-address" className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              Address
            </Label>
            <Input
              id="customer-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City"
              required
            />
          </div>

          {/* VIP Toggle */}
          <div className="flex items-center justify-between py-2 px-4 rounded-xl bg-gray-50">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <div>
                <Label className="text-sm font-medium">VIP Customer</Label>
                <p className="text-xs text-gray-500">
                  Mark as a priority customer
                </p>
              </div>
            </div>
            <Switch checked={isVIP} onCheckedChange={setIsVIP} />
          </div>

          {/* Result message */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${result.success
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
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

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isEdit ? "Saving..." : "Creating..."}
              </>
            ) : (
              <>
                {isEdit ? (
                  <Pencil className="w-4 h-4" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {isEdit ? "Save Changes" : "Create Customer"}
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
