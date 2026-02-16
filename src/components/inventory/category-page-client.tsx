"use client";

import { useRouter } from "next/navigation";
import { CategoryManager } from "./category-manager";

type Category = {
  id: string;
  name: string;
  description: string | null;
  _count: { products: number };
};

type Props = {
  initialCategories: Category[];
  role: "ADMIN" | "CASHIER" | "TECHNICIAN";
};

export function CategoryPageClient({ initialCategories, role }: Props) {
  const router = useRouter();

  return (
    <CategoryManager
      categories={initialCategories}
      role={role}
      onDataChange={() => router.refresh()}
    />
  );
}
