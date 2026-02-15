"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatsCardProps = {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: "blue" | "purple" | "emerald" | "amber";
  delay?: number;
};

const colorMap = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-100" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", ring: "ring-purple-100" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-100" },
};

export function StatsCard({ title, value, icon: Icon, color, delay = 0 }: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="p-5 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center ring-4", colors.bg, colors.ring)}>
            <Icon className={cn("w-6 h-6", colors.text)} />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
