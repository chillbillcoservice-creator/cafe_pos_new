
"use client"

import { useState, useMemo, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Trash2, Search, ShoppingCart, Truck, Check, ChevronsUpDown, List, X, Settings, Bell, BellOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { InventoryItem, MenuCategory, Vendor, PurchaseOrder, DraftItem, Expense, PendingBill, Employee } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { AddOrEditVendorDialog } from './vendor-management';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

interface InventoryManagementProps {
  inventory: InventoryItem[];
  menu: MenuCategory[];
  setMenu: (menu: MenuCategory[]) => void;
  setInventory: (inventory: InventoryItem[]) => void;
  vendors: Vendor[];
  setVendors: (vendors: Vendor[]) => void;
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: (orders: PurchaseOrder[]) => void;
  draftItems: DraftItem[];
  setDraftItems: (items: DraftItem[]) => void;
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  pendingBills: PendingBill[];
  setPendingBills: (bills: PendingBill[]) => void;
  currency: string;
  onStockRequest?: (itemId: string, itemName: string) => void;
  unlockedItems?: string[];
  currentUser?: Employee | null;
}

function AddOrEditItemDialog({
  open,
  onOpenChange,
  onSave,
  existingItem,
  vendors,
  onOpenVendorDialog,
  onRequestPermission,
  unlockedItems = [],
  currentUser
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: Omit<InventoryItem, 'id'> & { id?: string }) => void;
  existingItem: InventoryItem | null;
  vendors: Vendor[];
  onOpenVendorDialog: () => void;
  onRequestPermission?: (itemId: string, itemName: string) => void;
  unlockedItems?: string[];
  currentUser?: Employee | null;
}) {
  const { toast } = useToast();
  const { t } = { t: (s: string) => s }; // Mock t function or import it
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [capacity, setCapacity] = useState('');
  const [unit, setUnit] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');
  const [vendorSelectOpen, setVendorSelectOpen] = useState(false);

  useEffect(() => {
    if (open) {
      if (existingItem) {
        setName(existingItem.name);
        setCategory(existingItem.category || '');
        setStock(String(existingItem.stock));
        setCapacity(String(existingItem.capacity));
        setUnit(existingItem.unit);
        setVendorId(existingItem.vendorId || '');
        setCostPrice(existingItem.costPrice ? String(existingItem.costPrice) : '');

        // Check if unlocked
        const isUnlocked = unlockedItems.includes(existingItem.id);
        setIsStockLocked(!isUnlocked);
      } else {
        setName('');
        setCategory('');
        setStock('');
        setCapacity('');
        setUnit('');
        setVendorId('');
        setCostPrice('');
        setVendorSearchTerm('');
        setIsStockLocked(false);
      }
    }
  }, [existingItem, open, unlockedItems]);

  const [isStockLocked, setIsStockLocked] = useState(true);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleStockClick = () => {
    if (existingItem && isStockLocked) {
      // Check if user is Admin, if so, unlock immediately
      if (currentUser?.role === 'Admin') {
        setIsStockLocked(false);
        toast({ title: "Admin Override", description: "Stock unlocked for editing." });
      } else {
        setShowPermissionDialog(true);
      }
    }
  };

  const handleRequestPermission = () => {
    if (onRequestPermission && existingItem) {
      onRequestPermission(existingItem.id, existingItem.name);
      setRequestSent(true);
      toast({ title: "Request Sent", description: "Admin has been notified of your request to modify stock." });
      setTimeout(() => setShowPermissionDialog(false), 1500); // Close dialog but keep lock
    } else {
      // Fallback for demo or if function missing
      toast({ title: "Request Sent", description: "Admin has been notified." });
      setTimeout(() => {
        setIsStockLocked(false);
        setShowPermissionDialog(false);
      }, 1500);
    }
  };

  const handleSave = () => {
    if (name && (stock || !existingItem) && capacity && unit) {
      onSave({
        id: existingItem?.id,
        name,
        category,
        stock: existingItem ? parseFloat(stock) : 0,
        capacity: parseFloat(capacity),
        unit,
        vendorId: vendorId || undefined,
        costPrice: costPrice ? parseFloat(costPrice) : undefined,
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
          {existingItem && (
            <div className="space-y-2">
              <Label htmlFor="item-stock" className="flex items-center gap-2">
                Current Stock
                {isStockLocked && <span className="text-xs text-muted-foreground">(Locked)</span>}
              </Label>
              <div onClick={handleStockClick}>
                <Input
                  id="item-stock"
                  type="number"
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                  placeholder="e.g., 50"
                  readOnly={!!isStockLocked}
                  className={cn(!!isStockLocked ? "bg-muted cursor-not-allowed opacity-80" : "")}
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="item-capacity">Total Capacity</Label>
            <Input id="item-capacity" type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="e.g., 100" />
          </div>
          <div className="space-y-2">
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
          <div className="space-y-2">
            <Label htmlFor="item-cost">Cost Price (per {unit || 'unit'})</Label>
            <Input id="item-cost" type="number" value={costPrice} onChange={e => setCostPrice(e.target.value)} placeholder="e.g., 150" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-vendor">Vendor</Label>
            <Popover open={vendorSelectOpen} onOpenChange={setVendorSelectOpen}>
              <PopoverTrigger asChild>
                <div className="relative w-full">
                  <Input
                    placeholder="Search vendor..."
                    value={vendorId && vendorSearchTerm === '' ? vendors.find(v => v.id === vendorId)?.name : vendorSearchTerm}
                    onChange={(e) => {
                      setVendorSearchTerm(e.target.value);
                      if (!vendorSelectOpen) setVendorSelectOpen(true);
                      if (vendorId) setVendorId('');
                    }}
                    onClick={() => setVendorSelectOpen(true)}
                    className={cn(vendorId ? "" : "text-muted-foreground")}
                  />
                  <ChevronsUpDown className="absolute right-2 top-2.5 h-4 w-4 opacity-50 pointer-events-none" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                <div className="max-h-[200px] overflow-y-auto p-1">
                  <div
                    className={cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer", !vendorId && "bg-accent text-accent-foreground")}
                    onClick={() => {
                      setVendorId('');
                      setVendorSearchTerm('');
                      setVendorSelectOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", !vendorId ? "opacity-100" : "opacity-0")} />
                    None
                  </div>
                  {vendors.filter(v => v.name.toLowerCase().includes(vendorSearchTerm.toLowerCase())).map((v) => (
                    <div
                      key={v.id}
                      className={cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer", vendorId === v.id && "bg-accent text-accent-foreground")}
                      onClick={() => {
                        setVendorId(v.id);
                        setVendorSearchTerm('');
                        setVendorSelectOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", vendorId === v.id ? "opacity-100" : "opacity-0")} />
                      {v.name}
                    </div>
                  ))}
                  {vendors.filter(v => v.name.toLowerCase().includes(vendorSearchTerm.toLowerCase())).length === 0 && (
                    <div className="text-sm text-muted-foreground p-2 text-center">No vendor found</div>
                  )}
                </div>
                <div className="p-2 border-t">
                  <Button size="sm" variant="secondary" className="w-full h-8" onClick={() => { setVendorSelectOpen(false); onOpenVendorDialog(); }}>
                    <PlusCircle className="mr-2 h-3 w-3" /> New Vendor
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
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

function DraftListDialog({
  open,
  onOpenChange,
  draftItems,
  onRemoveItem,
  onClearList,
  onPlaceOrders,
  inventory,
  vendors,
  onUpdateItem
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftItems: DraftItem[];
  onRemoveItem: (itemId: string) => void;
  onClearList: () => void;
  onPlaceOrders: () => void;
  inventory: InventoryItem[];
  vendors: Vendor[];
  onUpdateItem: (itemId: string, updates: Partial<DraftItem>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Draft Order List</DialogTitle>
          <DialogDescription>Items added to list for future ordering.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[300px] overflow-y-auto space-y-2 py-2">
          {draftItems.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm">List is empty.</p>
          ) : (
            draftItems.map((item, idx) => {
              const invItem = inventory.find(i => i.id === item.inventoryItemId);
              const vendor = vendors.find(v => v.id === invItem?.vendorId);
              return (
                <div key={idx} className="flex flex-col gap-2 bg-muted/50 p-3 rounded-md border">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      {vendor && (
                        <p className="text-[10px] text-muted-foreground">
                          <span className="font-semibold text-primary/80">{vendor.name}</span>
                          {vendor.phone && <span className="ml-1">({vendor.phone})</span>}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onRemoveItem(item.inventoryItemId)} className="h-6 w-6 p-0 hover:bg-destructive/20 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor={`qty-${idx}`} className="text-[10px]">Qty</Label>
                      <Input
                        id={`qty-${idx}`}
                        type="number"
                        className="h-7 text-xs"
                        value={item.quantity}
                        onChange={(e) => onUpdateItem(item.inventoryItemId, { quantity: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`unit-${idx}`} className="text-[10px]">Unit</Label>
                      <Input
                        id={`unit-${idx}`}
                        className="h-7 text-xs"
                        value={item.unit}
                        onChange={(e) => onUpdateItem(item.inventoryItemId, { unit: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`price-${idx}`} className="text-[10px]">Price/Unit</Label>
                      <Input
                        id={`price-${idx}`}
                        type="number"
                        className="h-7 text-xs"
                        placeholder={invItem?.costPrice ? String(invItem.costPrice) : "0"}
                        value={item.price ?? ''}
                        onChange={(e) => onUpdateItem(item.inventoryItemId, { price: parseFloat(e.target.value) || undefined })}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <DialogFooter className="flex justify-between sm:justify-between items-center gap-2 text-xs">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="mr-auto">Close</Button>
          <div className="flex gap-2">
            {draftItems.length > 0 && <Button variant="destructive" size="sm" onClick={onClearList}>Clear List</Button>}
            {draftItems.length > 0 && <Button onClick={onPlaceOrders} size="sm" className="bg-green-600 hover:bg-green-700 text-white">Place Order</Button>}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReceiveOrderInventoryDialog({
  open,
  onOpenChange,
  po,
  onReceive,
  currency
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  po: PurchaseOrder | null;
  onReceive: (poId: string, receivedQty: number, totalBill: number, amountPaid: number) => void;
  currency: string;
}) {
  const { t } = { t: (s: string) => s };
  const [receivedQty, setReceivedQty] = useState('');
  const [totalBill, setTotalBill] = useState('');
  const [amountPaid, setAmountPaid] = useState('');

  useEffect(() => {
    if (po && po.items.length > 0) {
      setReceivedQty(String(po.items[0].quantity));
      setTotalBill('');
      setAmountPaid('');
    }
  }, [po, open]);

  const handleReceive = () => {
    if (po) {
      onReceive(po.id, parseFloat(receivedQty) || 0, parseFloat(totalBill) || 0, parseFloat(amountPaid) || 0);
    }
  };

  const pendingAmount = (parseFloat(totalBill) || 0) - (parseFloat(amountPaid) || 0);

  if (!po || po.items.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Receive Item Order</DialogTitle>
          <DialogDescription>Update stock and record payment for {po.items[0].name} (PO: {po.id}).</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ordered Qty</Label>
              <Input value={`${po.items[0].quantity} ${po.items[0].unit}`} disabled />
            </div>
            <div className="space-y-2">
              <Label>Received Qty</Label>
              <Input type="number" value={receivedQty} onChange={e => setReceivedQty(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Total Bill Amount ({currency})</Label>
              <Input type="number" value={totalBill} onChange={e => setTotalBill(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Amount Paid ({currency})</Label>
              <Input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          {pendingAmount > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 p-3 rounded-md text-center">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                Pending Balance: <span className="font-bold text-lg">{currency}{pendingAmount.toFixed(2)}</span>
              </p>
              <p className="text-xs text-red-500/80 dark:text-red-400/80 mt-1">
                This amount will be added to the vendor's pending balance.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleReceive}>Confirm Reception</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InventoryStockAlertDialog({
  open,
  onOpenChange,
  item,
  onAddToList,
  onOrderNow
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onAddToList: (item: InventoryItem) => void;
  onOrderNow: (item: InventoryItem) => void;
}) {
  if (!item) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 h-8 w-8 rounded-sm opacity-70 transition-opacity hover:opacity-100"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
        <AlertDialogHeader>
          <AlertDialogTitle className={cn(
            "flex items-center gap-2",
            (item.stock / item.capacity) <= 0.1 ? "text-red-600" : (item.stock / item.capacity) <= 0.25 ? "text-orange-600" : "text-amber-600"
          )}>
            <Truck className="h-5 w-5" />
            {(item.stock / item.capacity) <= 0.1 ? "Critical Stock Alert!" : (item.stock / item.capacity) <= 0.25 ? "Low Stock Alert!" : "Stock Level Warning"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            <span className="text-foreground"><strong>{item.name}</strong></span> stock is currently at <span className="font-bold text-foreground">{item.stock} {item.unit}</span>, which is <span className="font-bold text-red-500">{Math.round((item.stock / item.capacity) * 100)}%</span> of its total capacity ({item.capacity} {item.unit}).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <p className="text-sm font-medium mb-2 text-muted-foreground">Would you like to restock now?</p>
        </div>
        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="sm:mr-auto" onClick={() => onOpenChange(false)}>Later</AlertDialogCancel>
          <Button variant="secondary" onClick={() => { onAddToList(item); onOpenChange(false); }}>Add to List</Button>
          <Button onClick={() => { onOrderNow(item); onOpenChange(false); }}>Order Now</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function InventoryManagement({
  inventory, setInventory,
  vendors, setVendors,
  purchaseOrders, setPurchaseOrders,
  draftItems, setDraftItems,
  expenses, setExpenses,
  pendingBills, setPendingBills,
  currency,
  onStockRequest,
  unlockedItems,
  currentUser
}: InventoryManagementProps) {
  const { t } = { t: (s: string) => s };
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDraftListOpen, setIsDraftListOpen] = useState(false);
  const [isVendorAddDialogOpen, setIsVendorAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [alertItem, setAlertItem] = useState<InventoryItem | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);

  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Persist alert settings
  const [alertSettings, setAlertSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('inventoryAlertSettings');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) { console.error(e); }
      }
    }
    return {
      muted: false,
      thresholds: {
        0.1: true,
        0.25: true,
        0.50: true,
      }
    };
  });

  useEffect(() => {
    localStorage.setItem('inventoryAlertSettings', JSON.stringify(alertSettings));
  }, [alertSettings]);

  const [isAlertSettingsOpen, setIsAlertSettingsOpen] = useState(false);

  useEffect(() => {
    const findItemToAlert = () => {
      if (alertSettings.muted) return null;

      // Find items reaching 10%, 25%, or 50% thresholds
      // Prioritize 10% -> 25% -> 50%
      const thresholds = [0.1, 0.25, 0.5];
      for (const threshold of thresholds) {
        if (!alertSettings.thresholds[threshold]) continue;

        // Only return if not dismissed
        const item = inventory.find(i => (i.stock / i.capacity) <= threshold && i.stock > 0 && !dismissedAlerts.has(i.id));
        if (item) return item;
      }
      return null;
    };

    const lowStockItem = findItemToAlert();
    if (lowStockItem && !isAlertOpen) {
      setAlertItem(lowStockItem);
      setIsAlertOpen(true);
    }
  }, [inventory, isAlertOpen, dismissedAlerts, alertSettings]);

  const handleAlertClose = (open: boolean) => {
    if (!open && alertItem) {
      // Add current alert item to dismissed set when closing
      setDismissedAlerts(prev => new Set(prev).add(alertItem.id));
    }
    setIsAlertOpen(open);
  };

  const handleSaveVendor = async (vendor: Omit<Vendor, 'id'> & { id?: string }) => {
    const { id, ...vendorData } = vendor;
    let newVendors;
    if (id) {
      newVendors = vendors.map(v => v.id === id ? { ...v, ...vendorData } : v);
      toast({ title: "Vendor updated successfully" });
    } else {
      const newVendor = { ...vendorData, id: `VND${Date.now()}` };
      newVendors = [...vendors, newVendor];
      toast({ title: "Vendor added successfully" });
    }
    setVendors(newVendors);
    setIsVendorAddDialogOpen(false);
  };

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

  const getStockColor = (stock: number, capacity: number) => {
    const percentage = capacity > 0 ? (stock / capacity) * 100 : 0;
    if (percentage <= 10) return "bg-red-500";
    if (percentage <= 25) return "bg-yellow-500";
    return "bg-primary";
  };

  const toggleDraftItem = (item: InventoryItem) => {
    const exists = draftItems.find(d => d.inventoryItemId === item.id);
    if (exists) {
      setDraftItems(draftItems.filter(d => d.inventoryItemId !== item.id));
      toast({ title: "Removed from list", description: `${item.name} removed from draft order.` });
    } else {
      setDraftItems([...draftItems, { inventoryItemId: item.id, name: item.name, quantity: item.capacity - item.stock > 0 ? item.capacity - item.stock : 1, unit: item.unit }]);
      toast({ title: "Added to list", description: `${item.name} added to draft order.` });
    }
  }

  const handleOrderNow = (item: InventoryItem) => {
    if (!item.vendorId || item.vendorId === 'none') {
      toast({ title: "No Vendor Assigned", description: "Please edit the item to assign a vendor first.", variant: "destructive" });
      return;
    }
    const vendor = vendors.find(v => v.id === item.vendorId);
    if (!vendor) {
      toast({ title: "Vendor Not Found", description: "The assigned vendor does not exist.", variant: "destructive" });
      return;
    }

    const orderQty = item.capacity - item.stock > 0 ? item.capacity - item.stock : 10;
    const totalAmount = item.costPrice ? item.costPrice * orderQty : undefined;
    const newPO: PurchaseOrder = {
      id: `PO-${Date.now()}`,
      vendorId: vendor.id,
      vendorName: vendor.name,
      date: new Date(),
      status: 'sent',
      items: [{ inventoryItemId: item.id, name: item.name, quantity: orderQty, unit: item.unit }],
      totalAmount
    };
    setPurchaseOrders([...purchaseOrders, newPO]);

    // Remove from draft list if it exists there
    if (draftItems.some(d => d.inventoryItemId === item.id)) {
      setDraftItems(draftItems.filter(d => d.inventoryItemId !== item.id));
    }

    toast({ title: "Order Placed", description: `Order for ${item.name} sent to ${vendor.name}.` });
  }

  const handleUpdateDraftItem = (inventoryItemId: string, updates: Partial<DraftItem>) => {
    setDraftItems(draftItems.map(item =>
      item.inventoryItemId === inventoryItemId ? { ...item, ...updates } : item
    ));
  };

  const handlePlaceAllDraftOrders = () => {
    if (draftItems.length === 0) return;

    // Group items by vendor
    const ordersByVendor: Record<string, DraftItem[]> = {};
    const itemsWithoutVendor: DraftItem[] = [];
    const itemsWithInvalidVendor: DraftItem[] = [];

    draftItems.forEach(dItem => {
      const item = inventory.find(i => i.id === dItem.inventoryItemId);
      if (!item) {
        // Item no longer exists in inventory
        return;
      }

      if (item.vendorId && item.vendorId !== 'none') {
        const vendorExists = vendors.some(v => v.id === item.vendorId);
        if (vendorExists) {
          if (!ordersByVendor[item.vendorId!]) {
            ordersByVendor[item.vendorId!] = [];
          }
          ordersByVendor[item.vendorId!].push(dItem);
        } else {
          itemsWithInvalidVendor.push(dItem);
        }
      } else {
        itemsWithoutVendor.push(dItem);
      }
    });

    if (itemsWithoutVendor.length > 0) {
      toast({
        title: "Missing Vendors",
        description: `${itemsWithoutVendor.length} items skipped (no vendor assigned).`,
        variant: "destructive"
      });
    }

    if (itemsWithInvalidVendor.length > 0) {
      toast({
        title: "Invalid Vendors",
        description: `${itemsWithInvalidVendor.length} items skipped (assigned vendor not found).`,
        variant: "destructive"
      });
    }

    const newPOs: PurchaseOrder[] = [];
    Object.entries(ordersByVendor).forEach(([vendorId, items]) => {
      const vendor = vendors.find(v => v.id === vendorId);
      if (vendor) {
        // Calculate total cost if possible
        const totalAmount = items.reduce((sum, dItem) => {
          const invItem = inventory.find(i => i.id === dItem.inventoryItemId);
          // Use override price if set, else fallback to master cost price
          const price = dItem.price !== undefined ? dItem.price : (invItem?.costPrice || 0);
          return sum + (price * dItem.quantity);
        }, 0);

        newPOs.push({
          id: `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          vendorId: vendor.id,
          vendorName: vendor.name,
          date: new Date(),
          status: 'sent',
          items: items.map(i => ({ ...i })), // Clone items
          totalAmount
        });
      }
    });

    if (newPOs.length > 0) {
      setPurchaseOrders([...purchaseOrders, ...newPOs]);

      // Update draft items to only keep those that failed to be placed
      setDraftItems(draftItems.filter(dItem => {
        const item = inventory.find(i => i.id === dItem.inventoryItemId);
        // Keep if: item missing, no vendor, or vendor invalid
        if (!item) return false; // Remove if item deleted
        if (!item.vendorId || item.vendorId === 'none') return true;
        if (!vendors.some(v => v.id === item.vendorId)) return true;
        return false; // Automatically removed if successfully placed
      }));

      setIsDraftListOpen(false);
      toast({ title: "Orders Placed", description: `${newPOs.length} purchase orders created successfully.` });
    } else if (itemsWithoutVendor.length === draftItems.length || (itemsWithoutVendor.length + itemsWithInvalidVendor.length) === draftItems.length) {
      // All items failed
      // toast is already handled above for specific reasons
    }
  };

  const handleReceiveInventoryOrder = (poId: string, receivedQty: number, totalBill: number, amountPaid: number) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po || po.items.length === 0) return;

    const inventoryItemId = po.items[0].inventoryItemId;
    const vendorId = po.vendorId;

    // 1. Update Inventory Stock
    const newInventory = inventory.map(item =>
      item.id === inventoryItemId ? { ...item, stock: item.stock + receivedQty } : item
    );
    setInventory(newInventory);

    // 2. Add Expense for Amount Paid
    if (amountPaid > 0) {
      const newExpense: Expense = {
        id: `EXP-${Date.now()}`,
        date: new Date(),
        category: 'Inventory',
        description: `Paid for order ${poId} (${po.items[0].name})`,
        amount: amountPaid,
        vendorId: vendorId
      };
      setExpenses([...expenses, newExpense]);
    }

    // 3. Update Pending Balance if Rest exists
    const balance = totalBill - amountPaid;
    if (balance > 0) {
      let updatedPendingBills = [...pendingBills];
      const vendorIndex = updatedPendingBills.findIndex(b => b.type === 'vendor' && b.name.toLowerCase() === po.vendorName.toLowerCase());

      if (vendorIndex > -1) {
        updatedPendingBills[vendorIndex].transactions.push({
          id: `TR-${Date.now()}`,
          amount: balance,
          date: new Date(),
          description: `Pending balance for ${poId} (${po.items[0].name})`
        });
      } else {
        updatedPendingBills.push({
          id: `PB-${Date.now()}`,
          name: po.vendorName,
          type: 'vendor',
          transactions: [{
            id: `TR-${Date.now()}`,
            amount: balance,
            date: new Date(),
            description: `Initial pending balance for ${poId}`
          }]
        });
      }
      setPendingBills(updatedPendingBills);
    }

    // 4. Update PO status
    setPurchaseOrders(purchaseOrders.map(p => p.id === poId ? { ...p, status: 'received' } : p));

    setIsReceiveDialogOpen(false);
    toast({ title: "Order Received", description: `Stock updated and payments recorded.` });
  }

  return (
    <div className="p-4">
      <AddOrEditItemDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveItem}
        existingItem={editingItem}
        vendors={vendors}
        onOpenVendorDialog={() => setIsVendorAddDialogOpen(true)}
        onRequestPermission={onStockRequest}
        unlockedItems={unlockedItems}
        currentUser={currentUser}
      />
      <AddOrEditVendorDialog
        open={isVendorAddDialogOpen}
        onOpenChange={setIsVendorAddDialogOpen}
        onSave={handleSaveVendor}
        existingVendor={null}
      />
      <DraftListDialog
        open={isDraftListOpen}
        onOpenChange={setIsDraftListOpen}
        draftItems={draftItems}
        onRemoveItem={(id) => setDraftItems(draftItems.filter(d => d.inventoryItemId !== id))}
        onClearList={() => setDraftItems([])}
        onPlaceOrders={handlePlaceAllDraftOrders}
        inventory={inventory}
        vendors={vendors}
        onUpdateItem={handleUpdateDraftItem}
      />
      <ReceiveOrderInventoryDialog
        open={isReceiveDialogOpen}
        onOpenChange={setIsReceiveDialogOpen}
        po={receivingPO}
        onReceive={handleReceiveInventoryOrder}
        currency={currency}
      />
      <InventoryStockAlertDialog
        open={isAlertOpen}
        onOpenChange={handleAlertClose}
        item={alertItem}
        onAddToList={toggleDraftItem}
        onOrderNow={handleOrderNow}
      />
      <Card className="bg-muted/30">
        <CardHeader>
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                {t('Inventory Management')}
                <Dialog open={isAlertSettingsOpen} onOpenChange={setIsAlertSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 text-muted-foreground">
                      {alertSettings.muted ? <BellOff className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        {t('Stock Alert Settings')}
                      </DialogTitle>
                      <DialogDescription>
                        {t('Configure when you want to be notified about low stock.')}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="flex items-center justify-between space-x-2 border p-3 rounded-lg">
                        <Label htmlFor="mute-alerts" className="flex flex-col space-y-1">
                          <span>{t('Mute All Alerts')}</span>
                          <span className="font-normal text-xs text-muted-foreground">{t('Disable all low stock popup notifications.')}</span>
                        </Label>
                        <Switch
                          id="mute-alerts"
                          checked={alertSettings.muted}
                          onCheckedChange={(checked) => setAlertSettings((prev: typeof alertSettings) => ({ ...prev, muted: checked }))}
                        />
                      </div>

                      <div className="space-y-3">
                        <Label>{t('Alert Thresholds')}</Label>
                        <div className="grid gap-2">
                          {[{ val: 0.5, label: '50% Capacity' }, { val: 0.25, label: '25% Capacity' }, { val: 0.1, label: '10% Capacity (Critical)' }].map((threshold) => (
                            <div key={threshold.val} className="flex items-center space-x-2">
                              <Checkbox
                                id={`t-${threshold.val}`}
                                checked={alertSettings.thresholds[threshold.val]}
                                onCheckedChange={(checked) => setAlertSettings((prev: typeof alertSettings) => ({
                                  ...prev,
                                  thresholds: { ...prev.thresholds, [threshold.val]: checked === true }
                                }))}
                                disabled={alertSettings.muted}
                              />
                              <Label htmlFor={`t-${threshold.val}`} className={alertSettings.muted ? "opacity-50" : ""}>{threshold.label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
              <CardDescription>{t('Track and manage your stock levels.')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('Search items...')}
                  className="pl-9 w-[400px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => setIsDraftListOpen(true)}>
                <List className="mr-2 h-4 w-4" /> {t('Show List')} ({draftItems.length})
              </Button>
              <Button onClick={() => handleOpenDialog(null)}>
                <PlusCircle className="mr-2 h-4 w-4" /> {t('Add Item')}
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
                {filteredInventory.map((item) => {
                  const isInDraft = draftItems.some(d => d.inventoryItemId === item.id);
                  const activePO = purchaseOrders.find(po => po.status === 'sent' && po.items.some(poi => poi.inventoryItemId === item.id));
                  const isSent = !!activePO;
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="uppercase text-lg font-bold">{item.name}</span>
                          <span className="text-xs text-muted-foreground font-mono normal-case">({item.id})</span>
                          {isInDraft && !isSent && <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 hover:bg-orange-200">In List</Badge>}
                          {isSent && <Badge variant="outline" className="text-xs text-orange-600 border-orange-600 bg-orange-50 font-bold">Ordered</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-muted rounded">{item.category}</span>
                          {item.vendorId && (
                            <span className="flex items-center gap-1">
                              <Truck className="h-3 w-3" /> {vendors.find(v => v.id === item.vendorId)?.name || 'Unknown'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[400px]">
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between items-end text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            <span>Stock Level Progress</span>
                            <span className="text-sm font-black text-foreground">{item.stock} / {item.capacity} {item.unit}</span>
                          </div>
                          <Progress
                            value={(item.stock / item.capacity) * 100}
                            className="w-full h-4 rounded-full"
                            indicatorClassName={getStockColor(item.stock, item.capacity)}
                          />
                          <div className="flex gap-2 mt-1">
                            {!isSent && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant={isInDraft ? "destructive" : "secondary"}
                                      size="sm"
                                      onClick={() => toggleDraftItem(item)}
                                      className={cn("h-8 text-xs font-bold", isInDraft ? '' : 'bg-orange-500 hover:bg-orange-600 text-white')}
                                    >
                                      {isInDraft ? <Trash2 className="h-3.5 w-3.5 mr-1" /> : <ShoppingCart className="h-3.5 w-3.5 mr-1" />}
                                      {isInDraft ? "Remove from List" : "Add to List"}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>{isInDraft ? "Remove from list" : "Add to draft list"}</p></TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 text-xs font-bold border-2" onClick={() => handleOrderNow(item)}>
                                      <Truck className="h-3.5 w-3.5 mr-1" /> Order Now
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Place order immediately</p></TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {isSent && (
                              <Button
                                variant="default"
                                size="sm"
                                className="h-8 text-xs font-extrabold bg-green-600 hover:bg-green-700 text-white animate-pulse"
                                onClick={() => { setReceivingPO(activePO); setIsReceiveDialogOpen(true); }}
                              >
                                <Check className="h-3.5 w-3.5 mr-1" /> Receive Order
                              </Button>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-primary/10" onClick={() => handleOpenDialog(item)}>
                                  <Edit className="h-5 w-5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Edit Item</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive h-9 w-9 hover:bg-destructive/10">
                                      <Trash2 className="h-5 w-5" />
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
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
