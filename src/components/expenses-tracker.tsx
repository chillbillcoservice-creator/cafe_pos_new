

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
import { PlusCircle, Edit, Trash2, CalendarIcon, Building, Repeat, List, ChevronsUpDown, Check, AlertTriangle, HandCoins, Landmark, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay, isSameMonth, isSameYear, startOfDay, isAfter, isValid } from 'date-fns';
import type { Expense, Vendor, PendingBill, PendingBillTransaction, Customer } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AddOrEditVendorDialog, ManageVendorsDialog } from './vendor-management';

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


  // Dialog state for expense details
  const [isExpenseDetailOpen, setIsExpenseDetailOpen] = useState(false);
  const [expenseDetailTitle, setExpenseDetailTitle] = useState('');
  const [expenseDetailContent, setExpenseDetailContent] = useState<React.ReactNode>(null);

  // Form state for Expenses
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [vendorSelectOpen, setVendorSelectOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [vendorId, setVendorId] = useState<string | undefined>(undefined);
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');

  const selectedVendor = vendors.find(v => v.id === vendorId);
  const expenseCategory = selectedVendor?.category || 'Miscellaneous';

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    let filtered: Expense[] = [];
    switch (expenseFilter) {
      case 'today':
        filtered = initialExpenses.filter(e => isSameDay(new Date(e.date), now));
        break;
      case 'month':
        filtered = initialExpenses.filter(e => isSameMonth(new Date(e.date), now) && isSameYear(new Date(e.date), now));
        break;
      case 'all':
      default:
        filtered = [...initialExpenses];
        break;
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [initialExpenses, expenseFilter]);

  const resetForm = () => {
    setEditingExpense(null);
    setDate(new Date());
    setDescription('');
    setAmount('');
    setVendorId(undefined);
    setVendorSearchTerm('');
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
                <TableCell>{(() => {
                  const dateObj = new Date(expense.date);
                  return isValid(dateObj) ? format(dateObj, 'PPP') : 'N/A';
                })()}</TableCell>
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


      <Separator />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Add New Expense</CardTitle>
              <CardDescription>Record a new business expense.</CardDescription>
            </div>
            <div className="flex gap-2">
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
              <Popover open={vendorSelectOpen} onOpenChange={setVendorSelectOpen}>
                <PopoverTrigger asChild>
                  <div className="relative w-full">
                    <Input
                      placeholder={t('Search vendor...')}
                      value={vendorId && vendorSearchTerm === '' ? vendors.find(v => v.id === vendorId)?.name : vendorSearchTerm}
                      onChange={(e) => {
                        setVendorSearchTerm(e.target.value);
                        if (!vendorSelectOpen) setVendorSelectOpen(true);
                        if (vendorId) setVendorId(undefined);
                      }}
                      onClick={() => setVendorSelectOpen(true)}
                      className={cn(!vendorId && "text-muted-foreground")}
                    />
                    <ChevronsUpDown className="absolute right-2 top-2.5 h-4 w-4 opacity-50 pointer-events-none" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                  <div className="max-h-[200px] overflow-y-auto p-1">
                    <div
                      className={cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer", !vendorId && "bg-accent text-accent-foreground")}
                      onClick={() => {
                        setVendorId(undefined);
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
                    <Button size="sm" variant="secondary" className="w-full h-8" onClick={() => { setVendorSelectOpen(false); openAddVendorDialog(null); }}>
                      <PlusCircle className="mr-2 h-3 w-3" /> New Vendor
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
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
                        <TableCell>{(() => {
                          const dateObj = new Date(expense.date);
                          return isValid(dateObj) ? format(dateObj, 'PPP') : 'N/A';
                        })()}</TableCell>
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
      <ManageVendorsDialog open={isVendorManageDialogOpen} onOpenChange={setIsVendorManageDialogOpen} vendors={vendors} onEditVendor={(v) => { setIsVendorManageDialogOpen(false); setTimeout(() => openAddVendorDialog(v), 150) }} onDeleteVendor={handleDeleteVendor} onAddVendor={() => { setIsVendorManageDialogOpen(false); setTimeout(() => openAddVendorDialog(null), 150); }} />

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

    </div>
  );
}
