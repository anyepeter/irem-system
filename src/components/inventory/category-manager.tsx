"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createCategory, updateCategory, deleteCategory } from "@/actions/inventory";
import { Plus, Edit2, Trash2, FolderOpen, Package } from "lucide-react";

type Category = {
  id: string;
  name: string;
  description: string | null;
  _count: { products: number };
};

type Props = {
  categories: Category[];
  role: "ADMIN" | "CASHIER" | "TECHNICIAN";
  onDataChange?: () => void;
};

export function CategoryManager({ categories, role, onDataChange }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = editingId
        ? await updateCategory(editingId, formData)
        : await createCategory(formData);

      if (result.success) {
        setShowForm(false);
        setEditingId(null);
        onDataChange?.();
      } else {
        setError(result.message);
      }
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteCategory(deleteId);
      if (result.success) {
        setDeleteId(null);
        onDataChange?.();
      } else {
        setError(result.message);
      }
    });
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setShowForm(true);
    setError("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Categories</h3>
        {(role === "ADMIN" || role === "CASHIER") && (
          <Button size="sm" onClick={() => { setShowForm(true); setEditingId(null); setError(""); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Category
          </Button>
        )}
      </div>

      {error && !showForm && !deleteId && (
        <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>
      )}

      {categories.length === 0 ? (
        <Card className="p-8 text-center">
          <FolderOpen className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">No categories yet. Create one to get started.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <Card key={cat.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{cat.name}</h4>
                  {cat.description && <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>}
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                    <Package className="w-3.5 h-3.5" />
                    <span>{cat._count.products} product{cat._count.products !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                {role === "ADMIN" && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(cat)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(cat.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={() => { setShowForm(false); setEditingId(null); setError(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          {error && showForm && (
            <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={editingId ? categories.find((c) => c.id === editingId)?.name || "" : ""}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                defaultValue={editingId ? categories.find((c) => c.id === editingId)?.description || "" : ""}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? "Saving..." : editingId ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => { setDeleteId(null); setError(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure? Categories with products cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          {error && !!deleteId && (
            <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteId(null); setError(""); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
