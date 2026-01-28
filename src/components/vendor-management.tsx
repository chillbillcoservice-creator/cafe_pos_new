import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Trash2, Landmark, Settings, Search, Phone, Mail, MapPin, Calendar, History, ChevronDown, ChevronUp, Truck, Check, X } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import type { Vendor, PendingBill, PendingBillTransaction, Expense, PurchaseOrder, DraftItem, InventoryItem } from '@/lib/types';
import { PendingBillsCard } from './pending-bills-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

function ReceiveOrderDialog({
    open,
    onOpenChange,
    po,
    onReceive,
    currency
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    po: PurchaseOrder | null;
    onReceive: (poId: string, receivedQuantities: Record<string, number>, totalBill: number, amountPaid: number) => void;
    currency: string;
}) {
    const { t } = useLanguage();
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [totalBill, setTotalBill] = useState('');
    const [amountPaid, setAmountPaid] = useState('');

    React.useEffect(() => {
        if (po) {
            const initial: Record<string, number> = {};
            po.items.forEach(item => {
                initial[item.inventoryItemId] = item.quantity;
            });
            setQuantities(initial);
            setTotalBill('');
            setAmountPaid('');
        }
    }, [po, open]);

    const handleReceive = () => {
        if (po) {
            onReceive(po.id, quantities, parseFloat(totalBill) || 0, parseFloat(amountPaid) || 0);
            onOpenChange(false);
        }
    };

    const pendingAmount = (parseFloat(totalBill) || 0) - (parseFloat(amountPaid) || 0);

    if (!po) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t('Match Received Stock')}</DialogTitle>
                    <DialogDescription>{t('Update quantities actually received for order')} {po.id}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="max-h-[30vh] overflow-y-auto pr-2 space-y-3 border rounded-md p-2 bg-muted/20">
                        {po.items.map(item => (
                            <div key={item.inventoryItemId} className="flex items-center justify-between gap-4">
                                <div className="flex-grow">
                                    <p className="font-medium text-sm">{item.name}</p>
                                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                                        <span>{t('Ordered:')} <span className="font-bold">{item.quantity} {item.unit}</span></span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">{t('Received:')}</span>
                                    <Input
                                        type="number"
                                        className="w-20 h-8 text-right"
                                        value={quantities[item.inventoryItemId] || 0}
                                        onChange={e => setQuantities({ ...quantities, [item.inventoryItemId]: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div className="space-y-2">
                            <Label>{t('Total Bill Amount')} ({currency})</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={totalBill}
                                onChange={e => setTotalBill(e.target.value)}
                                className="font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('Amount Paid Now')} ({currency})</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={amountPaid}
                                onChange={e => setAmountPaid(e.target.value)}
                                className="font-bold"
                            />
                        </div>
                    </div>

                    {pendingAmount > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 p-3 rounded-md text-center">
                            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                                {t('Pending Balance:')} <span className="font-bold text-lg">{currency}{pendingAmount.toFixed(2)}</span>
                            </p>
                            <p className="text-xs text-red-500/80 dark:text-red-400/80 mt-1">
                                {t('This amount will be added to the vendor\'s pending balance.')}
                            </p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
                    <Button onClick={handleReceive} className="bg-orange-600 hover:bg-orange-700 text-white">
                        {t('Confirm Reception')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CreateOrderDialog({
    open,
    onOpenChange,
    vendor,
    inventory,
    onAddToDraft,
    setInventory
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vendor: Vendor | null;
    inventory: InventoryItem[];
    onAddToDraft: (item: InventoryItem, qty: number) => void;
    setInventory: (inventory: InventoryItem[]) => void;
}) {
    const { t } = useLanguage();
    const [itemQtys, setItemQtys] = useState<Record<string, number>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [showAllItems, setShowAllItems] = useState(true);

    const filteredInventory = useMemo(() => {
        let items = inventory;
        if (!showAllItems) {
            items = items.filter(i => i.vendorId === vendor?.id);
        }
        if (searchTerm) {
            items = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return items;
    }, [inventory, vendor, searchTerm, showAllItems]);

    const handleAssign = (item: InventoryItem) => {
        if (!vendor) return;
        const newInventory = inventory.map(i =>
            i.id === item.id ? { ...i, vendorId: vendor.id } : i
        );
        setInventory(newInventory);
    };

    const handleUnassign = (item: InventoryItem) => {
        const newInventory = inventory.map(i =>
            i.id === item.id ? { ...i, vendorId: undefined } : i
        );
        setInventory(newInventory);
        // Clear any quantity entered for this item
        const newQtys = { ...itemQtys };
        delete newQtys[item.id];
        setItemQtys(newQtys);
    };

    const handleAdd = () => {
        Object.entries(itemQtys).forEach(([itemId, qty]) => {
            if (qty > 0) {
                const item = inventory.find(i => i.id === itemId);
                if (item) onAddToDraft(item, qty);
            }
        });
        onOpenChange(false);
        setItemQtys({});
        setSearchTerm('');
    };

    if (!vendor) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-primary" />
                        {t('Create Order for')} {vendor.name}
                    </DialogTitle>
                    <DialogDescription>{t('Search and add items to the draft list.')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex flex-col gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('Search inventory items...')}
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant={showAllItems ? "secondary" : "ghost"}
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => setShowAllItems(!showAllItems)}
                            >
                                {showAllItems ? t('Showing All Items') : t('Show All Items')}
                            </Button>
                        </div>
                    </div>

                    <div className="h-[300px] overflow-y-auto pr-2 space-y-3">
                        {filteredInventory.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground text-sm">{t('No items found.')}</p>
                                {!showAllItems && (
                                    <Button variant="link" size="sm" onClick={() => setShowAllItems(true)}>
                                        {t('Browse all inventory items')}
                                    </Button>
                                )}
                            </div>
                        ) : (
                            filteredInventory.map(item => {
                                const isAssigned = item.vendorId === vendor.id;
                                return (
                                    <div key={item.id} className={cn(
                                        "flex flex-col gap-2 p-3 rounded-lg border transition-all",
                                        isAssigned ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-transparent"
                                    )}>
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-grow">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-sm uppercase">{item.name}</p>
                                                    {!isAssigned && <Badge variant="outline" className="text-[10px] h-4">{t('Not Assigned')}</Badge>}
                                                </div>
                                                <p className="text-xs text-muted-foreground font-medium">
                                                    {t('Stock:')} <span className={cn(item.stock <= item.capacity * 0.2 ? "text-red-500 font-bold" : "")}>{item.stock}</span> / {item.capacity} {item.unit}
                                                </p>
                                            </div>
                                            {isAssigned ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24">
                                                        <Input
                                                            type="number"
                                                            placeholder={String(Math.max(0, item.capacity - item.stock))}
                                                            value={itemQtys[item.id] || ''}
                                                            onChange={e => setItemQtys({ ...itemQtys, [item.id]: parseFloat(e.target.value) || 0 })}
                                                            className="h-8 text-xs font-bold"
                                                        />
                                                    </div>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        title={t('Unassign Item')}
                                                        onClick={() => handleUnassign(item)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-xs font-bold border-primary text-primary hover:bg-primary hover:text-white"
                                                    onClick={() => handleAssign(item)}
                                                >
                                                    <PlusCircle className="h-3.5 w-3.5 mr-1" />
                                                    {t('Assign')}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
                <DialogFooter className="border-t pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="font-bold">{t('Cancel')}</Button>
                    <Button
                        onClick={handleAdd}
                        disabled={Object.values(itemQtys).every(q => q <= 0)}
                        className="font-bold"
                    >
                        {t('Add Selected to Draft')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface VendorManagementProps {
    vendors: Vendor[];
    setVendors: (vendors: Vendor[]) => void;
    pendingBills: PendingBill[];
    setPendingBills: (bills: PendingBill[]) => void;
    expenses: Expense[];
    setExpenses: (expenses: Expense[]) => void;
    vendorCreditLimit: number;
    currency: string;
    purchaseOrders: PurchaseOrder[];
    setPurchaseOrders: (orders: PurchaseOrder[]) => void;
    draftItems: DraftItem[];
    setDraftItems: (items: DraftItem[]) => void;
    inventory: InventoryItem[];
    setInventory: (items: InventoryItem[]) => void;
}

export function AddOrEditVendorDialog({
    open,
    onOpenChange,
    onSave,
    existingVendor,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (vendor: Omit<Vendor, 'id'> & { id?: string }) => void;
    existingVendor: Vendor | null;
}) {
    const { t } = useLanguage();
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [location, setLocation] = useState('');
    const [nextPaymentDate, setNextPaymentDate] = useState<string>('');

    React.useEffect(() => {
        if (existingVendor) {
            setName(existingVendor.name);
            setCategory(existingVendor.category);
            setPhone(existingVendor.phone || '');
            setEmail(existingVendor.email || '');
            setLocation(existingVendor.location || '');
            setNextPaymentDate(existingVendor.nextPaymentDate ? new Date(existingVendor.nextPaymentDate).toISOString().split('T')[0] : '');
        } else {
            setName('');
            setCategory('');
            setPhone('');
            setEmail('');
            setLocation('');
            setNextPaymentDate('');
        }
    }, [existingVendor, open]);

    const handleSave = () => {
        if (name && category) {
            onSave({
                id: existingVendor?.id,
                name,
                category,
                phone,
                email,
                location,
                nextPaymentDate: nextPaymentDate ? new Date(nextPaymentDate) : undefined,
            });
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{existingVendor ? t('Edit Vendor') : t('Add Vendor')}</DialogTitle>
                    <DialogDescription>
                        {t('Manage your suppliers and service providers.')}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="vendor-name">{t('Vendor Name')}</Label>
                        <Input id="vendor-name" placeholder={t('e.g., Local Farm Produce')} value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="vendor-category">{t('Category')}</Label>
                        <Input id="vendor-category" placeholder={t('e.g., Food & Beverage')} value={category} onChange={e => setCategory(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="vendor-phone">{t('Mobile No. (Optional)')}</Label>
                        <Input id="vendor-phone" placeholder={t('e.g., 9876543210')} value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="vendor-email">{t('Email (Optional)')}</Label>
                        <Input id="vendor-email" placeholder={t('e.g., vendor@example.com')} value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="vendor-location">{t('Location (Optional)')}</Label>
                        <Input id="vendor-location" placeholder={t('e.g., City Center')} value={location} onChange={e => setLocation(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="vendor-payment-date">{t('Billing Cycle (Optional)')}</Label>
                        <div className="text-xs text-muted-foreground mb-1">{t('Select the date for the next expected payment or billing cycle reset.')}</div>
                        <Input
                            id="vendor-payment-date"
                            type="date"
                            value={nextPaymentDate}
                            onChange={e => setNextPaymentDate(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
                    <Button onClick={handleSave}>{t('Save Vendor')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function ManageVendorsDialog({
    open,
    onOpenChange,
    vendors,
    onEditVendor,
    onDeleteVendor,
    onAddVendor,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vendors: Vendor[];
    onEditVendor: (vendor: Vendor) => void;
    onDeleteVendor: (vendorId: string) => void;
    onAddVendor: () => void;
}) {
    const { t } = useLanguage();
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{t('Manage Vendors')}</DialogTitle>
                    <DialogDescription>{t('View, edit, or delete your vendors.')}</DialogDescription>
                    <div className="flex justify-end mt-2">
                        <div className="space-x-2">
                            <Button onClick={onAddVendor}>
                                <PlusCircle className="mr-2 h-4 w-4" /> {t('Add Vendor')}
                            </Button>
                        </div>
                    </div>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Name')}</TableHead>
                                <TableHead>{t('Category')}</TableHead>
                                <TableHead>{t('Mobile No.')}</TableHead>
                                <TableHead className="text-right">{t('Actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vendors.length > 0 ? (
                                vendors.map((vendor) => (
                                    <TableRow key={vendor.id}>
                                        <TableCell className="font-medium">{vendor.name}</TableCell>
                                        <TableCell>{vendor.category}</TableCell>
                                        <TableCell>{vendor.phone || 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button key="edit-btn" variant="ghost" size="icon" onClick={() => onEditVendor(vendor)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog key="delete-dialog">
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>{t('Are you sure?')}</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            {t('This will permanently delete the vendor')} "{vendor.name}". {t('This action cannot be undone.')}
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => onDeleteVendor(vendor.id)}>{t('Delete')}</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">{t('No vendors found.')}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Close')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function VendorManagement({
    vendors,
    setVendors,
    pendingBills,
    setPendingBills,
    expenses,
    setExpenses,
    vendorCreditLimit,
    currency,
    purchaseOrders,
    setPurchaseOrders,
    draftItems,
    setDraftItems,
    inventory,
    setInventory,
}: VendorManagementProps) {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [isVendorAddDialogOpen, setIsVendorAddDialogOpen] = useState(false);
    const [isVendorManageDialogOpen, setIsVendorManageDialogOpen] = useState(false);
    const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
    const [selectedVendorForOrder, setSelectedVendorForOrder] = useState<Vendor | null>(null);
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
    const [isLimitExceededDialogOpen, setIsLimitExceededDialogOpen] = useState(false);
    const [limitExceededInfo, setLimitExceededInfo] = useState({ type: '', limit: 0 });
    const [searchTerm, setSearchTerm] = useState('');

    const saveVendors = async (newVendors: Vendor[]) => {
        try {
            setVendors(newVendors);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save vendor data.' });
        }
    }

    const handleSaveVendor = async (vendor: Omit<Vendor, 'id'> & { id?: string }) => {
        const { id, ...vendorData } = vendor;
        let newVendors;
        if (id) {
            newVendors = vendors.map(v => v.id === id ? { ...v, ...vendorData } : v);
            toast({ title: "Vendor updated successfully" });
        } else {
            const newVendor = { ...vendorData, id: new Date().toISOString() };
            newVendors = [...vendors, newVendor];
            toast({ title: "Vendor added successfully" });
        }
        await saveVendors(newVendors);
        setIsVendorAddDialogOpen(false);
    };

    const handleDeleteVendor = async (vendorId: string) => {
        const newVendors = vendors.filter(v => v.id !== vendorId);
        await saveVendors(newVendors);
        toast({ title: "Vendor deleted successfully" });
    }

    const openAddVendorDialog = (vendor: Vendor | null) => {
        setEditingVendor(vendor);
        setIsVendorAddDialogOpen(true);
    }

    const savePendingBills = async (newPendingBills: PendingBill[]) => {
        try {
            setPendingBills(newPendingBills);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save pending bills.' });
        }
    }

    const saveExpenses = async (newExpenses: Expense[]) => {
        try {
            setExpenses(newExpenses);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save expense data.' });
        }
    }

    const handleAddPendingTransaction = async (type: 'customer' | 'vendor', name: string, amount: number, mobile?: string, dueDate?: Date) => {
        const totalPending = pendingBills
            .filter(b => b.type === type)
            .reduce((total, bill) => total + bill.transactions.reduce((sum, t) => sum + t.amount, 0), 0);

        const limit = vendorCreditLimit;

        if (totalPending + amount > limit) {
            setLimitExceededInfo({ type: type, limit: limit });
            setIsLimitExceededDialogOpen(true);
            return;
        }

        const newTransaction: PendingBillTransaction = {
            id: new Date().toISOString(),
            amount,
            date: new Date(),
        };

        const existingBillIndex = pendingBills.findIndex(b => b.name.toLowerCase() === name.toLowerCase() && b.type === type);
        let newPendingBills;

        if (existingBillIndex > -1) {
            newPendingBills = [...pendingBills];
            const existingBill = newPendingBills[existingBillIndex];
            existingBill.transactions.push(newTransaction);
        } else {
            const newBill: PendingBill = {
                id: new Date().toISOString(),
                name,
                type,
                transactions: [newTransaction],
                ...(mobile && { mobile }),
            };
            newPendingBills = [...pendingBills, newBill];
        }
        await savePendingBills(newPendingBills);
        toast({ title: 'Pending bill added.' });
    };

    const handleClearAllPendingBillsForPerson = async (billId: string) => {
        const billToClear = pendingBills.find(b => b.id === billId);
        if (!billToClear) return;
        const newPendingBills = pendingBills.filter(b => b.id !== billId);

        const totalPaid = billToClear.transactions.reduce((sum, tx) => sum + tx.amount, 0);
        const vendor = vendors.find(v => v.name.toLowerCase() === billToClear.name.toLowerCase());
        const newExpense: Expense = {
            id: new Date().toISOString(),
            date: new Date(),
            category: vendor?.category || 'Vendor Payment',
            description: `Cleared all pending bills for ${billToClear.name}.`,
            amount: totalPaid,
            vendorId: vendor?.id || null,
        };
        await saveExpenses([...expenses, newExpense]);
        toast({ title: "Expense Recorded", description: `An expense of ${currency}${totalPaid.toFixed(2)} for ${billToClear.name} has been recorded.` });
        await savePendingBills(newPendingBills);
        toast({ title: `${billToClear.name}'s pending bills have been cleared.` });
    };

    const handleSettleTransaction = async (billId: string, transactionId: string, amount: number) => {
        const billToUpdate = pendingBills.find(b => b.id === billId);
        if (!billToUpdate) return;
        const updatedTransactions = billToUpdate.transactions.filter(tx => tx.id !== transactionId);

        let newExpenses = [...expenses];
        const vendor = vendors.find(v => v.name.toLowerCase() === billToUpdate.name.toLowerCase());
        const newExpense: Expense = {
            id: new Date().toISOString(),
            date: new Date(),
            category: vendor?.category || 'Vendor Payment',
            description: `Settled transaction for ${billToUpdate.name}.`,
            amount: amount,
            vendorId: vendor?.id || null,
        };
        newExpenses.push(newExpense);

        let newPendingBills;
        if (updatedTransactions.length === 0) {
            newPendingBills = pendingBills.filter(b => b.id !== billId);
        } else {
            newPendingBills = pendingBills.map(b => b.id === billId ? { ...b, transactions: updatedTransactions } : b);
        }

        await saveExpenses(newExpenses);
        await savePendingBills(newPendingBills);
        toast({ title: "Transaction Settled", description: `${billToUpdate.name}'s transaction has been settled and recorded.` });
    };

    const handleSendDraftOrder = (vendor: Vendor) => {
        // Filter items for this vendor
        const vendorDraftItems = draftItems.filter(d => {
            const item = inventory.find(i => i.id === d.inventoryItemId);
            return item?.vendorId === vendor.id;
        });

        if (vendorDraftItems.length === 0) return;

        const newPO: PurchaseOrder = {
            id: `PO-${Date.now()}`,
            vendorId: vendor.id,
            vendorName: vendor.name,
            date: new Date(),
            status: 'sent',
            items: vendorDraftItems
        };

        setPurchaseOrders([...purchaseOrders, newPO]);

        // Remove these items from draft
        setDraftItems(draftItems.filter(d => {
            const item = inventory.find(i => i.id === d.inventoryItemId);
            return item?.vendorId !== vendor.id;
        }));

        toast({ title: "Order Sent", description: `Draft order sent to ${vendor.name}.` });
    };

    const handleReceiveOrder = (poId: string, receivedQuantities: Record<string, number>, totalBill: number, amountPaid: number) => {
        const po = purchaseOrders.find(p => p.id === poId);
        if (!po) return;

        // Update inventory stock based on actual received quantities
        const newInventory = [...inventory];
        po.items.forEach(poItem => {
            const invItemIndex = newInventory.findIndex(i => i.id === poItem.inventoryItemId);
            if (invItemIndex > -1) {
                const receivedQty = receivedQuantities[poItem.inventoryItemId] ?? poItem.quantity;
                newInventory[invItemIndex] = {
                    ...newInventory[invItemIndex],
                    stock: newInventory[invItemIndex].stock + receivedQty
                };
            }
        });
        setInventory(newInventory);

        // Record Expense if amount paid > 0
        if (amountPaid > 0) {
            const newExpense: Expense = {
                id: `EXP-${Date.now()}`,
                date: new Date(),
                category: po.vendorName ? 'Vendor Payment' : 'Inventory',
                description: `Payment for Order ${po.id}`,
                amount: amountPaid,
                vendorId: po.vendorId,
            };
            setExpenses([...expenses, newExpense]);
        }

        // Record Pending Bill if balance > 0
        const balance = totalBill - amountPaid;
        if (balance > 0) {
            const pendingParams = {
                type: 'vendor' as const,
                name: po.vendorName,
                // Using a temporary ID here, logic similar to handleAddPendingTransaction but inline
                // We'll reimplement the logic to find existing bill or create new one:
            };

            const existingBillIndex = pendingBills.findIndex(b => b.name.toLowerCase() === po.vendorName.toLowerCase() && b.type === 'vendor');
            let newPendingBillsVal = [...pendingBills];

            const newTransaction: PendingBillTransaction = {
                id: `TR-${Date.now()}`,
                amount: balance,
                date: new Date(),
            };

            if (existingBillIndex > -1) {
                newPendingBillsVal[existingBillIndex].transactions.push(newTransaction);
            } else {
                newPendingBillsVal.push({
                    id: `PB-${Date.now()}`,
                    name: po.vendorName,
                    type: 'vendor',
                    transactions: [newTransaction]
                });
            }
            setPendingBills(newPendingBillsVal);
            toast({ title: "Pending Balance Added", description: `${currency}${balance.toFixed(2)} added to ${po.vendorName}'s pending bills.` });
        }

        // Update PO status
        setPurchaseOrders(purchaseOrders.map(p => p.id === poId ? { ...p, status: 'received' } : p));
        toast({ title: "Order Received", description: `Stock updated and transactions recorded.` });
    }

    const onQuickAddToDraft = (item: InventoryItem, qty: number) => {
        const exists = draftItems.find(d => d.inventoryItemId === item.id);
        if (exists) {
            setDraftItems(draftItems.map(d => d.inventoryItemId === item.id ? { ...d, quantity: d.quantity + qty } : d));
        } else {
            setDraftItems([...draftItems, { inventoryItemId: item.id, name: item.name, quantity: qty, unit: item.unit }]);
        }
        toast({ title: "Added to Draft", description: `${item.name} (x${qty}) added to your ordering list.` });
    };

    const aggregatedVendors = useMemo(() => {
        return vendors.map(vendor => {
            const vendorExpenses = expenses.filter(e => e.vendorId === vendor.id);
            const sortedHistory = vendorExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const totalPaid = vendorExpenses.reduce((sum, e) => sum + e.amount, 0);

            // Find pending bill by matching name (case-insensitive)
            const pendingBill = pendingBills.find(b => b.type === 'vendor' && b.name.toLowerCase() === vendor.name.toLowerCase());
            const totalPending = pendingBill ? pendingBill.transactions.reduce((sum, t) => sum + t.amount, 0) : 0;

            return {
                ...vendor,
                totalPaid,
                totalPending,
                history: sortedHistory
            };
        });
    }, [vendors, expenses, pendingBills]);

    const filteredVendors = useMemo(() => {
        if (!searchTerm) return aggregatedVendors;
        const lower = searchTerm.toLowerCase();
        return aggregatedVendors.filter(v =>
            v.name.toLowerCase().includes(lower) ||
            (v.phone && v.phone.includes(lower)) ||
            v.category.toLowerCase().includes(lower)
        );
    }, [aggregatedVendors, searchTerm]);


    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold tracking-tight">{t('Vendors Dashboard')}</h2>
                <Button variant="outline" onClick={() => setIsVendorManageDialogOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" /> {t('Manage Vendors')}
                </Button>
            </div>

            <PendingBillsCard
                title="To Pay to Vendors"
                icon={Landmark}
                bills={pendingBills.filter(b => b.type === 'vendor')}
                type="vendor"
                onAddTransaction={handleAddPendingTransaction}
                onClearAll={handleClearAllPendingBillsForPerson}
                onSettleTransaction={handleSettleTransaction}
                totalLimit={vendorCreditLimit}
                allNames={vendors.map(v => v.name)}
                currency={currency}
            />

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center gap-4 flex-wrap">
                        <div>
                            <CardTitle>{t('Vendor Database')}</CardTitle>
                            <CardDescription>{t('View and manage your vendors.')}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t('Search vendors...')}
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button onClick={() => openAddVendorDialog(null)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> {t('Add Vendor')}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[calc(100vh-28rem)]">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredVendors.map(vendor => (
                                <Card key={vendor.id} className="flex flex-col">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg">{vendor.name}</CardTitle>
                                                <CardDescription>{vendor.category}</CardDescription>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openAddVendorDialog(vendor)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-4">
                                        <div className="grid grid-cols-2 gap-2 text-center">
                                            <div className="p-2 bg-muted rounded-md col-span-1">
                                                <p className="text-xs text-muted-foreground">{t('Total Paid')}</p>
                                                <p className="text-lg font-bold text-green-600 dark:text-green-400">{currency}{vendor.totalPaid.toFixed(2)}</p>
                                            </div>
                                            <div className="p-2 bg-muted rounded-md col-span-1">
                                                <p className="text-xs text-muted-foreground">{t('Pending')}</p>
                                                <p className="text-lg font-bold text-red-600 dark:text-red-400">{currency}{vendor.totalPending.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <div className="text-sm space-y-2">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Phone className="h-4 w-4" />
                                                <span>{vendor.phone || t('No phone')}</span>
                                            </div>
                                            {vendor.email && (
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Mail className="h-4 w-4" />
                                                    <span>{vendor.email}</span>
                                                </div>
                                            )}
                                            {vendor.location && (
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <MapPin className="h-4 w-4" />
                                                    <span>{vendor.location}</span>
                                                </div>
                                            )}
                                            {vendor.nextPaymentDate && (
                                                <div className="flex items-center gap-2 text-orange-600 font-medium">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>{t('Next Payment:')} {format(new Date(vendor.nextPaymentDate), 'PP')}</span>
                                                </div>
                                            )}

                                            <Collapsible className="group/collapsible border rounded-md p-2">
                                                <CollapsibleTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="flex w-full justify-between p-0 font-normal hover:bg-transparent">
                                                        <span className="flex items-center gap-2"><History className="h-4 w-4" /> {t('Order History')}</span>
                                                        <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                                    </Button>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="mt-2 space-y-2">
                                                    {purchaseOrders.filter(p => p.vendorId === vendor.id).length > 0 && (
                                                        <div className="mb-2 space-y-2">
                                                            <div className="text-xs font-semibold text-muted-foreground uppercase">{t('Purchase Orders')}</div>
                                                            {purchaseOrders.filter(p => p.vendorId === vendor.id).map(po => (
                                                                <div key={po.id} className="border rounded p-2 bg-muted/20 text-xs">
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <span className="font-bold">{format(new Date(po.date), 'MM/dd')}</span>
                                                                        <Badge variant={po.status === 'received' ? 'default' : 'outline'} className={po.status === 'received' ? 'bg-green-500 hover:bg-green-600' : 'text-orange-500 border-orange-500'}>
                                                                            {po.status === 'received' ? 'Received' : 'Ordered'}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="mb-2">
                                                                        {po.items.map(i => (
                                                                            <div key={i.inventoryItemId} className="flex justify-between">
                                                                                <span>{i.name}</span>
                                                                                <span>x{i.quantity} {i.unit}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    {po.status === 'sent' && (
                                                                        <Button size="sm" variant="outline" className="w-full h-8 text-xs font-bold border-orange-200 text-orange-600 hover:bg-orange-50" onClick={() => { setSelectedPO(po); setIsReceiveDialogOpen(true); }}>
                                                                            <Truck className="h-3.5 w-3.5 mr-1" /> {t('Receive Order')}
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {vendor.history && vendor.history.length > 0 ? (
                                                        <div className="text-xs space-y-2">
                                                            <div className="text-xs font-semibold text-muted-foreground uppercase">{t('Payments')}</div>
                                                            {vendor.history.slice(0, 5).map((h: Expense) => (
                                                                <div key={h.id} className="border-b pb-1 last:border-0">
                                                                    <div className="flex justify-between font-medium">
                                                                        <span>{format(new Date(h.date), 'MM/dd')}</span>
                                                                        <span>{currency}{h.amount}</span>
                                                                    </div>
                                                                    <div className="text-muted-foreground truncate" title={h.description}>{h.description}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-muted-foreground text-center py-2">{t('No payment history')}</p>
                                                    )}
                                                </CollapsibleContent>
                                            </Collapsible>

                                            <div className="mt-4 border-t pt-2 space-y-2">
                                                {/* Last Order Info */}
                                                {(() => {
                                                    const lastReceivedPO = purchaseOrders
                                                        .filter(p => p.vendorId === vendor.id && p.status === 'received')
                                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

                                                    if (lastReceivedPO) {
                                                        return (
                                                            <div className="bg-primary/5 rounded p-2 mb-2">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-[10px] font-bold text-primary uppercase">{t('Last Received Order')}</span>
                                                                    <span className="text-[10px] text-muted-foreground">{format(new Date(lastReceivedPO.date), 'PP')}</span>
                                                                </div>
                                                                <div className="text-xs text-muted-foreground truncate">
                                                                    {lastReceivedPO.items.map(i => `${i.name} (${i.quantity})`).join(', ')}
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}


                                                {/* Draft / Create Order Buttons */}
                                                {draftItems.some(d => inventory.find(i => i.id === d.inventoryItemId)?.vendorId === vendor.id) ? (
                                                    <div className="space-y-2">
                                                        <div className="text-xs font-bold flex justify-between items-center mb-1">
                                                            <span>{t('Draft List')}</span>
                                                            <Badge variant="secondary" className="bg-green-100 text-green-800">{draftItems.filter(d => inventory.find(i => i.id === d.inventoryItemId)?.vendorId === vendor.id).length} items</Badge>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button className="flex-grow h-9 text-xs font-bold" size="sm" onClick={() => handleSendDraftOrder(vendor)}>
                                                                <Truck className="h-3.5 w-3.5 mr-2" /> {t('Send Order Now')}
                                                            </Button>
                                                            <Button variant="outline" className="h-9 text-xs font-bold border-2" size="sm" onClick={() => { setSelectedVendorForOrder(vendor); setIsCreateOrderDialogOpen(true); }}>
                                                                {t('Modify List')}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Button variant="outline" className="w-full h-9 text-xs font-bold border-2" onClick={() => { setSelectedVendorForOrder(vendor); setIsCreateOrderDialogOpen(true); }}>
                                                        <PlusCircle className="h-3.5 w-3.5 mr-2" /> {t('Create New Order')}
                                                    </Button>
                                                )}

                                                {/* Pending Order Check - Moved BELOW Create New Order */}
                                                {vendors.find(v => v.id === vendor.id) && purchaseOrders.some(po => po.vendorId === vendor.id && po.status === 'sent') && (
                                                    <Button
                                                        className="w-full h-9 text-xs font-extrabold bg-orange-500 hover:bg-orange-600 text-white animate-in zoom-in slide-in-from-top-1"
                                                        onClick={() => {
                                                            const lastPO = [...purchaseOrders].reverse().find(po => po.vendorId === vendor.id && po.status === 'sent');
                                                            if (lastPO) { setSelectedPO(lastPO); setIsReceiveDialogOpen(true); }
                                                        }}
                                                    >
                                                        <Check className="h-3.5 w-3.5 mr-2" /> {t('Receive Pending Order')}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" className="w-full">
                                                    <Trash2 className="mr-2 h-4 w-4" /> {t('Delete')}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>{t('Are you sure?')}</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        {t('This will permanently delete')} {vendor.name}. {t('This action cannot be undone.')}
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteVendor(vendor.id)}>{t('Delete')}</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <AddOrEditVendorDialog
                open={isVendorAddDialogOpen}
                onOpenChange={setIsVendorAddDialogOpen}
                onSave={handleSaveVendor}
                existingVendor={editingVendor}
            />
            <ManageVendorsDialog
                open={isVendorManageDialogOpen}
                onOpenChange={setIsVendorManageDialogOpen}
                vendors={vendors}
                onEditVendor={(vendor) => {
                    setEditingVendor(vendor);
                    setIsVendorAddDialogOpen(true);
                }}
                onDeleteVendor={handleDeleteVendor}
                onAddVendor={() => openAddVendorDialog(null)}
            />

            <AlertDialog open={isLimitExceededDialogOpen} onOpenChange={setIsLimitExceededDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('Credit Limit Exceeded')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('This transaction exceeds the credit limit for')} {limitExceededInfo.type}s ({currency}{limitExceededInfo.limit}). {t('Please increase the limit in Settings if needed.')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setIsLimitExceededDialogOpen(false)}>{t('OK')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <ReceiveOrderDialog
                open={isReceiveDialogOpen}
                onOpenChange={setIsReceiveDialogOpen}
                po={selectedPO}
                onReceive={handleReceiveOrder}
                currency={currency}
            />
            <CreateOrderDialog
                open={isCreateOrderDialogOpen}
                onOpenChange={setIsCreateOrderDialogOpen}
                vendor={selectedVendorForOrder}
                inventory={inventory}
                onAddToDraft={onQuickAddToDraft}
                setInventory={setInventory}
            />
        </div>
    );
}
