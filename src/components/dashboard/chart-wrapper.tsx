"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChartWrapperProps = {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
};

export function ChartWrapper({ title, icon, children, action }: ChartWrapperProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            {icon}
            {title}
          </CardTitle>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
