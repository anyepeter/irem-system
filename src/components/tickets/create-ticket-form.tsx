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
import { createCustomer } from "@/actions/customer";
import { DEVICE_TYPES, POPULAR_BRANDS, STANDARD_DIAGNOSTIC_FEE } from "@/lib/ticket-constants";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Crown,
  Search,
  Wrench,
  UserPlus,
  MapPin,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

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
  const [searchDone, setSearchDone] = useState(false);

  // Inline customer creation
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");
  const [newCustIsVIP, setNewCustIsVIP] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [custCreateResult, setCustCreateResult] = useState<ActionResult | null>(null);

  // Technicians
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [assignedToId, setAssignedToId] = useState("");

  // Form fields
  const [deviceType, setDeviceType] = useState("");
  const [customDeviceType, setCustomDeviceType] = useState("");
  const [brand, setBrand] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [priority, setPriority] = useState("NORMAL");
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
      setSearchDone(false);
      return;
    }
    setSearchingCustomers(true);
    setSearchDone(false);
    const timer = setTimeout(async () => {
      const results = await searchCustomers(customerSearch);
      setCustomerResults(results);
      setSearchingCustomers(false);
      setSearchDone(true);
      setShowCustomerDropdown(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const diagnosticFee = selectedCustomer?.isVIP ? 0 : STANDARD_DIAGNOSTIC_FEE;
  const initialTotal = diagnosticFee + (deliveryMethod === "HOME_DELIVERY" ? deliveryFee : 0);

  const effectiveDeviceType = deviceType === "Other" ? customDeviceType : deviceType;
  const effectiveBrand = brand === "Other" ? customBrand : brand;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.set("customerId", String(selectedCustomer.id));
    formData.set("deviceType", effectiveDeviceType);
    formData.set("brand", effectiveBrand);
    formData.set("serialNumber", serialNumber);
    formData.set("issueDescription", issueDescription);
    formData.set("assignedToId", assignedToId);
    formData.set("priority", priority);
    formData.set("expectedReturnDate", "");
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

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCustomer(true);
    setCustCreateResult(null);

    const formData = new FormData();
    formData.set("name", newCustName);
    formData.set("phone", newCustPhone);
    formData.set("address", newCustAddress);
    formData.set("isVIP", String(newCustIsVIP));

    const res = await createCustomer(formData);
    setCustCreateResult(res);
    setCreatingCustomer(false);

    if (res.success && res.data) {
      const newCustomer: Customer = {
        id: res.data.id as number,
        name: res.data.name as string,
        phone: res.data.phone as string,
        isVIP: res.data.isVIP as boolean,
      };
      setSelectedCustomer(newCustomer);
      setTimeout(() => {
        setShowCreateCustomer(false);
        setCustCreateResult(null);
        setNewCustName("");
        setNewCustPhone("");
        setNewCustAddress("");
        setNewCustIsVIP(false);
        setCustomerSearch("");
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
                {/* No results — show Add New Customer button */}
                {searchDone && customerResults.length === 0 && customerSearch.length >= 2 && !searchingCustomers && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border rounded-lg shadow-lg p-3">
                    <p className="text-sm text-gray-500 mb-2">No customers found for &quot;{customerSearch}&quot;</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => {
                        setNewCustName(customerSearch);
                        setShowCreateCustomer(true);
                        setShowCustomerDropdown(false);
                      }}
                    >
                      <UserPlus className="w-4 h-4" />
                      Add New Customer
                    </Button>
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
                <Select value={deviceType} onValueChange={(v) => { setDeviceType(v); if (v !== "Other") setCustomDeviceType(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select device type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {deviceType === "Other" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <Input
                      value={customDeviceType}
                      onChange={(e) => setCustomDeviceType(e.target.value)}
                      placeholder="Enter device type..."
                      required
                    />
                  </motion.div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <Select value={brand} onValueChange={(v) => { setBrand(v); if (v !== "Other") setCustomBrand(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_BRANDS.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {brand === "Other" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <Input
                      value={customBrand}
                      onChange={(e) => setCustomBrand(e.target.value)}
                      placeholder="Enter brand name..."
                      required
                    />
                  </motion.div>
                )}
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
            className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${result.success
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
          disabled={loading || !selectedCustomer || !effectiveDeviceType || !effectiveBrand || !assignedToId}
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

      {/* Inline Create Customer Dialog */}
      <Dialog open={showCreateCustomer} onOpenChange={(v) => { setShowCreateCustomer(v); if (!v) setCustCreateResult(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Add New Customer
            </DialogTitle>
            <DialogDescription>
              Create a new customer and auto-select them for this ticket.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCustomer} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="new-cust-name">Customer Name</Label>
              <Input
                id="new-cust-name"
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-cust-phone">Phone Number (WhatsApp)</Label>
              <Input
                id="new-cust-phone"
                type="tel"
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
                placeholder="+237 6XX XXX XXX"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-cust-address" className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                Address
              </Label>
              <Input
                id="new-cust-address"
                value={newCustAddress}
                onChange={(e) => setNewCustAddress(e.target.value)}
                placeholder="123 Main St, City"
                required
              />
            </div>
            <div className="flex items-center justify-between py-2 px-4 rounded-xl bg-gray-50">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <div>
                  <Label className="text-sm font-medium">VIP Customer</Label>
                  <p className="text-xs text-gray-500">Mark as a priority customer</p>
                </div>
              </div>
              <Switch checked={newCustIsVIP} onCheckedChange={setNewCustIsVIP} />
            </div>

            {custCreateResult && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${custCreateResult.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  }`}
              >
                {custCreateResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                {custCreateResult.message}
              </motion.div>
            )}

            <Button type="submit" className="w-full" disabled={creatingCustomer}>
              {creatingCustomer ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create & Select Customer
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
