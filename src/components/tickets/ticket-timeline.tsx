"use client";

import { motion } from "framer-motion";
import { TicketStatusBadge } from "./ticket-status-badge";
import { Clock, User } from "lucide-react";

type HistoryEntry = {
  id: string;
  status: string;
  notes: string | null;
  createdAt: Date | string;
  updatedBy: { username: string };
};

export function TicketTimeline({ history }: { history: HistoryEntry[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Status History</h3>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
        <div className="space-y-4">
          {history.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative flex items-start gap-3 pl-10"
            >
              <div className="absolute left-2.5 w-3 h-3 rounded-full bg-white border-2 border-blue-400 mt-1.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <TicketStatusBadge status={entry.status} />
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                  <User className="w-3 h-3" />
                  {entry.updatedBy.username}
                </div>
                {entry.notes && (
                  <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
