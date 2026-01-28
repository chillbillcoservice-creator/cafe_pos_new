
import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ChevronsUpDown, ChevronDown, ChevronUp, HandCoins } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { isValid, format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import type { PendingBill, PendingBillTransaction } from '@/lib/types';

export function AddOrEditPendingBillDialog({
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

    React.useEffect(() => {
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

export function PendingBillsCard({
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
    const [isMinimized, setIsMinimized] = useState(true);

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
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsMinimized(!isMinimized)}>
                            {isMinimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        </Button>
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
            {!isMinimized && (
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
                                                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>{t('Clear All')}</Button>
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
                                                    <span>{(() => {
                                                        const dateObj = new Date(tx.date);
                                                        return isValid(dateObj) ? format(dateObj, 'PPP') : 'Invalid Date';
                                                    })()}</span>
                                                    <span className={cn("font-semibold ml-4", type === 'customer' ? 'text-green-700' : 'text-red-700')}>{currency}{tx.amount.toFixed(2)}</span>
                                                </div>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-7">{t('Settle')}</Button>
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
            )}
        </Card>
    );
}
