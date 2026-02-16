"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTicket, searchCustomers, getTechnicians, type ActionResult } from "@/actions/ticket";
import { DEVICE_TYPES, POPULAR_BRANDS, STANDARD_DIAGNOSTIC_FEE } from "@/lib/ticket-constants";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Crown,
  Search,
  Wrench,
} from "lucide-react";

type Customer = { id: number; name: string; phone: string; isVIP: boolean };
type Technician = { id: string; username: string };

export function CreateTicketForm({ basePath }: { basePath: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);

  // Customer search
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchingCustomers, setSearchingCustomers] = useState(false);

  // Technicians
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [assignedToId, setAssignedToId] = useState("");

  // Form fields
  const [deviceType, setDeviceType] = useState("");
  const [brand, setBrand] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("PICKUP");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);

  // Load technicians on mount
  useEffect(() => {
    getTechnicians().then(setTechnicians);
  }, []);

  // Customer search with debounce
  useEffect(() => {
    if (customerSearch.length < 2) {
      setCustomerResults([]);
      return;
    }
    setSearchingCustomers(true);
    const timer = setTimeout(async () => {
      const results = await searchCustomers(customerSearch);
      setCustomerResults(results);
      setSearchingCustomers(false);
      setShowCustomerDropdown(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const diagnosticFee = selectedCustomer?.isVIP ? 0 : STANDARD_DIAGNOSTIC_FEE;
  const initialTotal = diagnosticFee + (deliveryMethod === "HOME_DELIVERY" ? deliveryFee : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.set("customerId", String(selectedCustomer.id));
    formData.set("deviceType", deviceType);
    formData.set("brand", brand);
    formData.set("serialNumber", serialNumber);
    formData.set("issueDescription", issueDescription);
    formData.set("assignedToId", assignedToId);
    formData.set("priority", priority);
    formData.set("expectedReturnDate", expectedReturnDate);
    formData.set("deliveryMethod", deliveryMethod);
    formData.set("deliveryAddress", deliveryAddress);
    formData.set("deliveryFee", String(deliveryMethod === "HOME_DELIVERY" ? deliveryFee : 0));

    const res = await createTicket(formData);
    setResult(res);
    setLoading(false);

    if (res.success && res.data?.id) {
      setTimeout(() => {
        router.push(`${basePath}/${res.data!.id}`);
      }, 1000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Customer Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{selectedCustomer.name}</span>
                  <span className="text-xs text-gray-500">{selectedCustomer.phone}</span>
                  {selectedCustomer.isVIP && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">
                      <Crown className="w-3 h-3" /> VIP
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerSearch("");
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search customer by name or phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  onFocus={() => customerResults.length > 0 && setShowCustomerDropdown(true)}
                  className="pl-10"
                />
                {showCustomerDropdown && customerResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {customerResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 text-left"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setShowCustomerDropdown(false);
                          setCustomerSearch("");
                        }}
                      >
                        <div>
                          <span className="text-sm font-medium">{c.name}</span>
                          <span className="text-xs text-gray-500 ml-2">{c.phone}</span>
                        </div>
                        {c.isVIP && (
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {searchingCustomers && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border rounded-lg shadow-lg p-3 text-center text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  </div>
                )}
              </div>
            )}
            {selectedCustomer && (
              <p className="text-sm text-gray-500">
                Diagnostic Fee:{" "}
                <span className="font-medium">
                  {selectedCustomer.isVIP ? "0 (VIP Customer)" : `${STANDARD_DIAGNOSTIC_FEE.toLocaleString()} XAF`}
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Device Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Device Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Device Type</Label>
                <Select value={deviceType} onValueChange={setDeviceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select device type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <Select value={brand} onValueChange={setBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_BRANDS.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Serial Number (Optional)</Label>
              <Input
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Device serial number"
              />
            </div>
            <div className="space-y-2">
              <Label>Issue Description</Label>
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Describe the problem in detail..."
                required
                minLength={10}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Assignment */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assign to Technician</Label>
                <Select value={assignedToId} onValueChange={setAssignedToId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select technician" />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.username}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Expected Return Date (Optional)</Label>
              <Input
                type="date"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Delivery */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Delivery Preference</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="PICKUP"
                  checked={deliveryMethod === "PICKUP"}
                  onChange={() => setDeliveryMethod("PICKUP")}
                  className="accent-blue-600"
                />
                <span className="text-sm">Pickup</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="HOME_DELIVERY"
                  checked={deliveryMethod === "HOME_DELIVERY"}
                  onChange={() => setDeliveryMethod("HOME_DELIVERY")}
                  className="accent-blue-600"
                />
                <span className="text-sm">Home Delivery</span>
              </label>
            </div>
            {deliveryMethod === "HOME_DELIVERY" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Delivery Address</Label>
                  <Input
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter delivery address"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Fee (XAF)</Label>
                  <Input
                    type="number"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(Number(e.target.value))}
                    min={0}
                  />
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {selectedCustomer && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Diagnostic Fee</span>
                  <span className="font-medium">
                    {diagnosticFee.toLocaleString()} XAF
                  </span>
                </div>
                {deliveryMethod === "HOME_DELIVERY" && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivery Fee</span>
                    <span className="font-medium">
                      {deliveryFee.toLocaleString()} XAF
                    </span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Initial Total</span>
                  <span>{initialTotal.toLocaleString()} XAF</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Result message */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
              result.success
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
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={loading || !selectedCustomer || !deviceType || !brand || !assignedToId}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Ticket...
            </>
          ) : (
            "Create Ticket"
          )}
        </Button>
      </form>
    </motion.div>
  );
}
