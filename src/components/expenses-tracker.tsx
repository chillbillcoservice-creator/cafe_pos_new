

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from "@/contexts/language-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, CalendarIcon, Building, Repeat, List, ChevronsUpDown, Check, AlertTriangle, HandCoins, Landmark, Settings, ChevronDown } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay, isSameMonth, isSameYear, startOfDay, isAfter } from 'date-fns';
import type { Expense, Vendor, PendingBill, PendingBillTransaction, Customer } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ExpensesTrackerProps {
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  vendors: Vendor[];
  setVendors: (vendors: Vendor[]) => void;
  pendingBills: PendingBill[];
  setPendingBills: (bills: PendingBill[]) => void;
  customers: Customer[];
  customerCreditLimit: number;
  vendorCreditLimit: number;
  currency?: string;
}

function AddOrEditVendorDialog({
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

  useEffect(() => {
    if (existingVendor) {
      setName(existingVendor.name);
      setCategory(existingVendor.category);
      setPhone(existingVendor.phone || '');
    } else {
      setName('');
      setCategory('');
      setPhone('');
    }
  }, [existingVendor, open]);

  const handleSave = () => {
    if (name && category) {
      onSave({
        id: existingVendor?.id,
        name,
        category,
        phone,
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
          <Button onClick={handleSave}>{t('Save Vendor')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function ManageVendorsDialog({
  open,
  onOpenChange,
  vendors,
  onEditVendor,
  onDeleteVendor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendors: Vendor[];
  onEditVendor: (vendor: Vendor) => void;
  onDeleteVendor: (vendorId: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('Manage Vendors')}</DialogTitle>
          <DialogDescription>{t('View, edit, or delete your vendors.')}</DialogDescription>
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

function AddOrEditPendingBillDialog({
  open,
  onOpenChange,
  onSave,
  existingNames,
  type,
  currency,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, amount: number, mobile?: string, dueDate?: Date) => void;
  existingNames: string[];
  type: 'customer' | 'vendor';
  currency: string;
}) {
  const { t } = useLanguage();
  const [isNew, setIsNew] = useState(true);
  const [selectedName, setSelectedName] = useState('');
  const [newName, setNewName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [mobile, setMobile] = useState('');

  useEffect(() => {
    if (open) {
      setIsNew(true);
      setSelectedName('');
      setNewName('');
      setAmount('');
      setDueDate(undefined);
      setMobile('');
    }
  }, [open]);

  const handleSave = () => {
    const finalName = isNew ? newName : selectedName;
    if (!finalName || !amount) {
      alert('Please provide a name and amount.');
      return;
    }
    onSave(finalName, parseFloat(amount), mobile, dueDate);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Add Pending Bill')}</DialogTitle>
          <DialogDescription>
            {t('Record a new transaction for a')} {t(type)}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('Select or Add')} {type === 'customer' ? t('Customer') : t('Vendor')}</Label>
            <div className="flex items-center gap-4">
              <Button
                variant={!isNew ? "default" : "outline"}
                onClick={() => setIsNew(false)}
                className={cn(!isNew && "bg-primary text-primary-foreground")}
              >
                {t('Existing')}
              </Button>
              <Button
                variant={isNew ? "default" : "outline"}
                onClick={() => setIsNew(true)}
                className={cn(isNew && "bg-primary text-primary-foreground")}
              >
                {t('New')}
              </Button>
            </div>
            {isNew ? (
              <Input
                placeholder={`${t('New')} ${t(type)} ${t('name')}`}
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
            ) : (
              <Select onValueChange={setSelectedName} value={selectedName}>
                <SelectTrigger>
                  <SelectValue placeholder={`${t('Select existing')} ${t(type)}`} />
                </SelectTrigger>
                <SelectContent>
                  {existingNames.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {isNew && (
            <div className="space-y-2">
              <Label htmlFor="mobile">{t('Mobile No. (Optional)')}</Label>
              <Input id="mobile" placeholder={t('e.g., 9876543210')} value={mobile} onChange={e => setMobile(e.target.value)} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">{t('Amount')} ({currency})</Label>
            <Input id="amount" type="number" placeholder="e.g., 500" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('Due Date (Optional)')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : <span>{t('Pick a date')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
          <Button onClick={handleSave}>{t('Save Bill')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function PendingBillsCard({
  title,
  icon,
  bills,
  type,
  onAddTransaction,
  onClearAll,
  onSettleTransaction,
  totalLimit,
  allNames = [],
  currency,
}: {
  title: string;
  icon: React.ElementType;
  bills: PendingBill[];
  type: 'customer' | 'vendor';
  onAddTransaction: (type: 'customer' | 'vendor', name: string, amount: number, mobile?: string, dueDate?: Date) => void;
  onClearAll: (billId: string) => void;
  onSettleTransaction: (billId: string, transactionId: string, amount: number) => void;
  totalLimit: number;
  allNames?: string[];
  currency: string;
}) {
  const { t } = useLanguage();
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);

  const totalPending = useMemo(() => bills.reduce((total, bill) => {
    return total + bill.transactions.reduce((sum, t) => sum + t.amount, 0);
  }, 0), [bills]);

  const totalProgress = totalLimit > 0 ? (totalPending / totalLimit) * 100 : 0;

  const existingNames = useMemo(() => {
    const billNames = new Set(bills.map(b => b.name));
    allNames.forEach(name => billNames.add(name));
    return Array.from(billNames);
  }, [bills, allNames]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            {React.createElement(icon, { className: "h-6 w-6" })}
            {t(title)}
          </CardTitle>
          <Button onClick={() => setIsAddBillOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> {t('Add Bill')}
          </Button>
        </div>
        <CardDescription>
          {t('Total Pending')}: <span className={cn("font-bold", type === 'customer' ? 'text-green-600' : 'text-red-600')}>{currency}{totalPending.toFixed(2)}</span>
        </CardDescription>
        <div className="space-y-1 mt-2">
          <div key="pending-info" className="flex justify-between items-center text-sm">
            <span className={cn("font-bold", type === 'customer' ? 'text-green-600' : 'text-red-600')}>
              {currency}{totalPending.toFixed(2)}
            </span>
            <span className="text-muted-foreground">{t('Overall Limit')}: {currency}{totalLimit.toLocaleString()}</span>
          </div>
          <Progress key="progress-bar" value={totalProgress} indicatorClassName={totalProgress > 100 ? "bg-red-500" : (type === 'customer' ? 'bg-green-500' : 'bg-red-500')} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto space-y-2">
          {bills.map((bill) => {
            const totalForName = bill.transactions.reduce((sum, t) => sum + t.amount, 0);
            return (
              <Collapsible key={bill.id} className="p-2 border rounded-lg">
                <div className="flex items-center justify-between">
                  <CollapsibleTrigger className="flex flex-grow items-center gap-2 text-left">
                    <ChevronsUpDown className="h-4 w-4" />
                    <span className="font-medium">{bill.name}</span>
                    <span className={cn("font-semibold text-sm", type === 'customer' ? 'text-green-600' : 'text-red-600')}>
                      ({currency}{totalForName.toFixed(2)})
                    </span>
                  </CollapsibleTrigger>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">{t('Clear All')}</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('Are you sure?')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('This will mark all pending bills for')} {bill.name} {t('as paid and clear their balance. This action cannot be undone.')}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onClearAll(bill.id)}>{t('Confirmed')}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <CollapsibleContent className="mt-2 space-y-1 pr-2 max-h-48 overflow-y-auto">
                  {bill.transactions.map(tx => (
                    <div key={tx.id} className="flex justify-between items-center p-1.5 bg-muted/50 rounded-md text-sm group">
                      <div>
                        <span>{format(new Date(tx.date), 'PPP')}</span>
                        <span className={cn("font-semibold ml-4", type === 'customer' ? 'text-green-700' : 'text-red-700')}>{currency}{tx.amount.toFixed(2)}</span>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-7">{t('Settle')}</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('Settle this transaction?')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('This will settle the transaction of')} {currency}{tx.amount.toFixed(2)} {t('for')} {bill.name}. {t('This cannot be undone.')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onSettleTransaction(bill.id, tx.id, tx.amount)}>{t('Settle')}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>
        <AddOrEditPendingBillDialog
          open={isAddBillOpen}
          onOpenChange={setIsAddBillOpen}
          onSave={(name, amount, mobile, dueDate) => onAddTransaction(type, name, amount, mobile, dueDate)}
          existingNames={existingNames}
          type={type}
          currency={currency}
        />
      </CardContent>
    </Card>
  );
}


export default function ExpensesTracker({
  expenses: initialExpenses,
  setExpenses,
  vendors: initialVendors,
  setVendors,
  pendingBills,
  setPendingBills,
  customers,
  customerCreditLimit,
  vendorCreditLimit,
  currency = 'Rs.',
}: ExpensesTrackerProps) {
  const { t } = useLanguage();
  const { toast } = useToast();


  const vendors = initialVendors || [];

  const [isVendorAddDialogOpen, setIsVendorAddDialogOpen] = useState(false);
  const [isVendorManageDialogOpen, setIsVendorManageDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [expenseFilter, setExpenseFilter] = useState<'all' | 'today' | 'month'>('all');
  const [isLimitExceededDialogOpen, setIsLimitExceededDialogOpen] = useState(false);
  const [limitExceededInfo, setLimitExceededInfo] = useState({ type: '', limit: 0 });

  // Dialog state for expense details
  const [isExpenseDetailOpen, setIsExpenseDetailOpen] = useState(false);
  const [expenseDetailTitle, setExpenseDetailTitle] = useState('');
  const [expenseDetailContent, setExpenseDetailContent] = useState<React.ReactNode>(null);

  // Form state for Expenses
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [vendorId, setVendorId] = useState<string | undefined>(undefined);

  const selectedVendor = vendors.find(v => v.id === vendorId);
  const expenseCategory = selectedVendor?.category || 'Miscellaneous';

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    switch (expenseFilter) {
      case 'today':
        return initialExpenses.filter(e => isSameDay(new Date(e.date), now));
      case 'month':
        return initialExpenses.filter(e => isSameMonth(new Date(e.date), now) && isSameYear(new Date(e.date), now));
      case 'all':
      default:
        return initialExpenses;
    }
  }, [initialExpenses, expenseFilter]);

  const resetForm = () => {
    setEditingExpense(null);
    setDate(new Date());
    setDescription('');
    setAmount('');
    setVendorId(undefined);
  }

  const saveExpenses = async (newExpenses: Expense[]) => {
    try {
      // This would be an API call in a real app
      // await fetch('/api/expenses', { ... });
      setExpenses(newExpenses);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save expense data.' });
    }
  }

  const handleSaveExpense = async () => {
    if (!date || !amount) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill out date and amount." });
      return;
    }

    const categoryToSave = selectedVendor ? selectedVendor.category : 'Miscellaneous';

    let newExpenses: Expense[];

    if (editingExpense?.id) {
      newExpenses = initialExpenses.map(exp => exp.id === editingExpense.id ? { ...editingExpense, date, category: categoryToSave, description, amount: parseFloat(amount), vendorId: vendorId || null } : exp);
      toast({ title: "Expense updated successfully" });
    } else {
      const newExpense: Expense = {
        id: new Date().toISOString(), // Simple unique ID
        date,
        category: categoryToSave,
        description,
        amount: parseFloat(amount),
        vendorId: vendorId || null,
      };
      newExpenses = [...initialExpenses, newExpense];
      toast({ title: "Expense added successfully" });
    }
    await saveExpenses(newExpenses);
    resetForm();
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const newExpenses = initialExpenses.filter(exp => exp.id !== expenseId);
    await saveExpenses(newExpenses);
    toast({ title: "Expense deleted successfully" });
  };

  const saveVendors = async (newVendors: Vendor[]) => {
    try {
      // This would be an API call in a real app
      // await fetch('/api/vendors', { ... });
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
      // This would be an API call in a real app
      // await fetch('/api/pending-bills', { ... });
      setPendingBills(newPendingBills);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save pending bills.' });
    }
  }

  const handleAddPendingTransaction = async (type: 'customer' | 'vendor', name: string, amount: number, mobile?: string, dueDate?: Date) => {
    const totalPending = pendingBills
      .filter(b => b.type === type)
      .reduce((total, bill) => total + bill.transactions.reduce((sum, t) => sum + t.amount, 0), 0);

    const limit = type === 'customer' ? customerCreditLimit : vendorCreditLimit;

    if (totalPending + amount > limit) {
      setLimitExceededInfo({ type: type, limit: limit });
      setIsLimitExceededDialogOpen(true);
      return;
    }

    const newTransaction: PendingBillTransaction = {
      id: new Date().toISOString(), // Simple unique ID
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

    if (billToClear.type === 'vendor') {
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
      await saveExpenses([...initialExpenses, newExpense]);
      toast({ title: "Expense Recorded", description: `An expense of ${currency}${totalPaid.toFixed(2)} for ${billToClear.name} has been recorded.` });
    }

    await savePendingBills(newPendingBills);
    toast({ title: `${billToClear.name}'s pending bills have been cleared.` });
  };

  const handleSettleTransaction = async (billId: string, transactionId: string, amount: number) => {
    const billToUpdate = pendingBills.find(b => b.id === billId);
    if (!billToUpdate) return;

    const updatedTransactions = billToUpdate.transactions.filter(tx => tx.id !== transactionId);

    let newExpenses = [...initialExpenses];
    if (billToUpdate.type === 'vendor') {
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
    }

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


  const now = new Date();
  const todaysExpenses = useMemo(() => initialExpenses.filter(e => isSameDay(new Date(e.date), now)), [initialExpenses, now]);
  const monthlyExpenses = useMemo(() => initialExpenses.filter(e => isSameMonth(new Date(e.date), now) && isSameYear(new Date(e.date), now)), [initialExpenses, now]);
  const totalExpenses = useMemo(() => initialExpenses.reduce((sum, expense) => sum + expense.amount, 0), [initialExpenses]);
  const getVendorDetails = (vendorId: string | undefined | null) => vendorId ? vendors.find(v => v.id === vendorId) || null : null;

  const showExpenseDetails = (title: string, data: Expense[]) => {
    setExpenseDetailTitle(title);
    setExpenseDetailContent(
      data.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Date')}</TableHead>
              <TableHead>{t('Category')}</TableHead>
              <TableHead>{t('Description')}</TableHead>
              <TableHead className="text-right">{t('Amount')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map(expense => (
              <TableRow key={expense.id}>
                <TableCell>{format(new Date(expense.date), 'PPP')}</TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell className="text-right font-mono">{currency}{expense.amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-muted-foreground text-center p-8">{t('No expenses found for this period.')}</p>
      )
    );
    setIsExpenseDetailOpen(true);
  };


  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PendingBillsCard
          key="customer-bills"
          title="To Collect from Customers"
          icon={HandCoins}
          bills={pendingBills.filter(b => b.type === 'customer')}
          type="customer"
          onAddTransaction={handleAddPendingTransaction}
          onClearAll={handleClearAllPendingBillsForPerson}
          onSettleTransaction={handleSettleTransaction}
          totalLimit={customerCreditLimit}
          allNames={customers.map(c => c.name)}
          currency={currency}
        />
        <PendingBillsCard
          key="vendor-bills"
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
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Add New Expense</CardTitle>
              <CardDescription>Record a new business expense.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => openAddVendorDialog(null)} variant="default"><Building className="mr-2 h-4 w-4" /> Add Vendor</Button>
              <Button variant="default" onClick={() => setIsVendorManageDialogOpen(true)}><List className="mr-2 h-4 w-4" /> Vendors List</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Select onValueChange={(value) => setVendorId(value === 'none' ? undefined : value)} value={vendorId || 'none'}>
                <SelectTrigger id="vendor"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vendor Category</Label>
              <Input value={expenseCategory} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input id="description" placeholder="e.g., Weekly vegetable purchase" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (Rs.)</Label>
              <Input id="amount" type="number" placeholder="e.g., 5000" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            {editingExpense && <Button variant="outline" onClick={resetForm}><Repeat className="mr-2 h-4 w-4" />Cancel Edit</Button>}
            <Button onClick={handleSaveExpense}><PlusCircle className="mr-2 h-4 w-4" /> {editingExpense ? 'Update Expense' : 'Save Expense'}</Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Expense History</CardTitle>
          <CardDescription>
            {expenseFilter === 'all' && "A log of all recorded business expenses."}
            {expenseFilter === 'today' && "A log of expenses recorded today."}
            {expenseFilter === 'month' && "A log of expenses recorded this month."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[60vh] overflow-y-auto mb-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Vendor Mobile</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((expense, index) => {
                    const vendor = getVendorDetails(expense.vendorId);
                    return (
                      <TableRow key={expense.id} className={cn(index % 2 === 0 ? 'bg-muted/50' : 'bg-background')}>
                        <TableCell>{format(new Date(expense.date), 'PPP')}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>{vendor?.name || 'N/A'}</TableCell>
                        <TableCell>{vendor?.phone || 'N/A'}</TableCell>
                        <TableCell className="text-right font-mono text-red-600 dark:text-red-400">Rs.{expense.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this expense. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteExpense(expense.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground h-24">No expenses recorded for this period.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105" onClick={() => showExpenseDetails("Today's Expenses", todaysExpenses)}>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">Today's Expenses</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-red-900 dark:text-red-100">Rs.{todaysExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}</p></CardContent>
            </Card>
            <Card className="bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105" onClick={() => showExpenseDetails("This Month's Expenses", monthlyExpenses)}>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">This Month's Expenses</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-orange-900 dark:text-orange-100">Rs.{monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}</p></CardContent>
            </Card>
            <Card className="bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105" onClick={() => showExpenseDetails("Overall Expenses", initialExpenses)}>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Overall Expenses</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">Rs.{totalExpenses.toFixed(2)}</p></CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <AddOrEditVendorDialog open={isVendorAddDialogOpen} onOpenChange={setIsVendorAddDialogOpen} onSave={handleSaveVendor} existingVendor={editingVendor} />
      <ManageVendorsDialog open={isVendorManageDialogOpen} onOpenChange={setIsVendorManageDialogOpen} vendors={vendors} onEditVendor={(v) => { setIsVendorManageDialogOpen(false); setTimeout(() => openAddVendorDialog(v), 150) }} onDeleteVendor={handleDeleteVendor} />

      <Dialog open={isExpenseDetailOpen} onOpenChange={setIsExpenseDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{expenseDetailTitle}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {expenseDetailContent}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsExpenseDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isLimitExceededDialogOpen} onOpenChange={setIsLimitExceededDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive" />Credit Limit Exceeded</DialogTitle>
            <DialogDescription>
              Adding this amount would exceed the total {limitExceededInfo.type} credit limit of <span className="font-bold">Rs.{limitExceededInfo.limit.toLocaleString()}</span>.
              <br /><br />
              Please enter a lower amount or go to the <strong>Admin &gt; Financial Settings</strong> to adjust the credit limit.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsLimitExceededDialogOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
