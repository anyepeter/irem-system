import { Loader2 } from "lucide-react";

export default function TechnicianDashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading dashboard...</p>
      </div>
    </div>
  );
}
