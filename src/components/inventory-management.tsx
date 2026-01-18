
"use client"

import { useState, useMemo, useEffect, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Trash2, Plus, Minus, Server, Search, FilePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { InventoryItem, MenuCategory } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ManageMenuDialog } from './manage-menu-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InventoryManagementProps {
  inventory: InventoryItem[];
  menu: MenuCategory[];
  setMenu: (menu: MenuCategory[]) => void;
  setInventory: (inventory: InventoryItem[]) => void;
}

function AddOrEditItemDialog({
  open,
  onOpenChange,
  onSave,
  existingItem,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: Omit<InventoryItem, 'id'> & { id?: string }) => void;
  existingItem: InventoryItem | null;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [capacity, setCapacity] = useState('');
  const [unit, setUnit] = useState('');

  useEffect(() => {
    if (open) {
      if (existingItem) {
        setName(existingItem.name);
        setCategory(existingItem.category || '');
        setStock(String(existingItem.stock));
        setCapacity(String(existingItem.capacity));
        setUnit(existingItem.unit);
      } else {
        setName('');
        setCategory('');
        setStock('');
        setCapacity('');
        setUnit('');
      }
    }
  }, [existingItem, open]);

  const handleSave = () => {
    if (name && stock && capacity && unit) {
      onSave({
        id: existingItem?.id,
        name,
        category,
        stock: parseFloat(stock),
        capacity: parseFloat(capacity),
        unit,
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existingItem ? 'Edit' : 'Add'} Inventory Item</DialogTitle>
          <DialogDescription>Manage your stock items.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="item-id">Item ID (Cannot be changed)</Label>
            <Input id="item-id" value={existingItem?.id || 'Will be auto-generated'} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-name">Item Name</Label>
            <Input id="item-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Coffee Beans" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-category">Category</Label>
            <Input id="item-category" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g., Beverages" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-stock">Current Stock</Label>
            <Input id="item-stock" type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="e.g., 50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-capacity">Total Capacity</Label>
            <Input id="item-capacity" type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="e.g., 100" />
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="item-unit">Unit</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger id="item-unit">
                <SelectValue placeholder="Select a unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="ltr">ltr</SelectItem>
                <SelectItem value="unit">unit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function InventoryManagement({ inventory, menu, setMenu, setInventory }: InventoryManagementProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInventory = useMemo(() => {
    if (!searchTerm) return inventory;
    const lowercasedTerm = searchTerm.toLowerCase();
    return inventory.filter(item =>
      item.name.toLowerCase().includes(lowercasedTerm) ||
      item.id.toString().includes(lowercasedTerm)
    );
  }, [inventory, searchTerm]);

  const handleSaveItem = (itemData: Omit<InventoryItem, 'id'> & { id?: string }) => {
    const { id, ...data } = itemData;
    let newInventory;
    if (id) {
      newInventory = inventory.map(item => item.id === id ? { ...item, ...data } : item);
      toast({ title: "Item updated successfully" });
    } else {
      const existingIds = inventory.map(item => parseInt(item.id, 10)).filter(id => !isNaN(id));
      const newId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
      const newItem = { ...data, id: String(newId) };
      newInventory = [...inventory, newItem];
      toast({ title: "Item added successfully", description: `ID: ${newId}` });
    }
    setInventory(newInventory);
  };

  const handleDeleteItem = (itemId: string) => {
    const newInventory = inventory.filter(item => item.id !== itemId);
    setInventory(newInventory);
    toast({ title: "Item deleted successfully" });
  };

  const handleOpenDialog = (item: InventoryItem | null) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleStockChange = (id: string, newStock: number) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    const stock = Math.max(0, Math.min(item.capacity, newStock));

    if (stock === 10) {
      toast({
        title: "Stock Alert",
        description: `Only 10 ${item.unit} remaining for ${item.name}!`,
        variant: "warning",
      });
    } else if (stock === 5) {
      toast({
        title: "Critical Stock Alert",
        description: `Only 5 ${item.unit} remaining for ${item.name}!`,
        variant: "destructive",
      });
    } else if (stock === 0) {
      toast({
        title: "Stock Depleted",
        description: `${item.name} is now Out of Stock!`,
        variant: "destructive",
      });
    }

    const newInventory = inventory.map(i => i.id === id ? { ...i, stock } : i);
    setInventory(newInventory);
  }

  const getStockColor = (stock: number, capacity: number) => {
    const percentage = capacity > 0 ? (stock / capacity) * 100 : 0;
    if (percentage <= 10) {
      return "bg-red-500";
    }
    if (percentage <= 25) {
      return "bg-yellow-500";
    }
    return "bg-primary";
  };

  return (
    <div className="p-4">
      <Card className="bg-muted/30">
        <CardHeader>
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>Track and manage your stock levels.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={() => handleOpenDialog(null)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[calc(100vh-15rem)] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-foreground uppercase">Item</TableHead>
                  <TableHead className="font-bold text-foreground uppercase">Stock Level</TableHead>
                  <TableHead className="text-right font-bold text-foreground uppercase">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div className="uppercase">{item.name} <span className="text-xs text-muted-foreground font-mono normal-case">({item.id})</span></div>
                      <div className="text-xs text-muted-foreground">{item.category}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <Progress
                          value={(item.stock / item.capacity) * 100}
                          className="w-full h-2"
                          indicatorClassName={getStockColor(item.stock, item.capacity)}
                        />
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleStockChange(item.id, item.stock - 5)}>-5</Button>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleStockChange(item.id, item.stock - 1)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            value={item.stock}
                            onChange={(e) => handleStockChange(item.id, e.target.value === '' ? 0 : parseInt(e.target.value, 10))}
                            onBlur={(e) => { if (e.target.value === '') { handleStockChange(item.id, 0); } }}
                            className="w-20 h-10 text-center text-base font-bold"
                          />
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleStockChange(item.id, item.stock + 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleStockChange(item.id, item.stock + 5)}>+5</Button>
                          <div className="text-base text-muted-foreground ml-2">/ {item.capacity} {item.unit}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenDialog(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Edit Item</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" className="h-8" onClick={() => handleStockChange(item.id, item.capacity / 2)}>
                              HALF
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Fill to Half Capacity</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" className="h-8" onClick={() => handleStockChange(item.id, item.capacity)}>
                              FULL
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Fill to Capacity</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete the item "{item.name}".</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteItem(item.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TooltipTrigger>
                          <TooltipContent><p>Delete Item</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddOrEditItemDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveItem}
        existingItem={editingItem}
      />
    </div>
  );
}
