
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Search, Bookmark, Trash2, Eye, Printer, Phone, Mail, User, CalendarDays, ShoppingBag, ArrowUpDown, ChevronDown, ChevronUp, CalendarIcon, Briefcase } from 'lucide-react';
import type { Bill, Customer, PendingBill, Table as TableType, EventBooking } from '@/lib/types';
import { format } from 'date-fns';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';

interface CustomerManagementProps {
  billHistory: Bill[];
  tables: TableType[];
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  pendingBills: PendingBill[];
  eventBookings: EventBooking[];
  setEventBookings: React.Dispatch<React.SetStateAction<EventBooking[]>>;
  currency: string;
}

function AddOrEditCustomerDialog({
  open,
  onOpenChange,
  onSave,
  existingCustomer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (customer: Omit<Customer, 'id' | 'firstSeen' | 'lastSeen' | 'totalVisits' | 'totalSpent'> & { id?: string }) => void;
  existingCustomer: Customer | null;
}) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (existingCustomer) {
      setName(existingCustomer.name);
      setPhone(existingCustomer.phone);
      setEmail(existingCustomer.email || '');
      setAddress(existingCustomer.address || '');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
    }
  }, [existingCustomer, open]);

  const handleSave = () => {
    if (name && phone) {
      onSave({
        id: existingCustomer?.id,
        name,
        phone,
        email,
        address,
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existingCustomer ? t('Edit Customer') : t('Add New Customer')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="customer-name">{t('Customer Name')}</Label>
            <Input id="customer-name" value={name} onChange={e => setName(e.target.value)} placeholder={t('e.g., Jane Doe')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-phone">{t('Phone Number')}</Label>
            <Input id="customer-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('e.g., 9876543210')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-email">{t('Email (Optional)')}</Label>
            <Input id="customer-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g., jane.d@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-address">{t('Address (Optional)')}</Label>
            <Textarea id="customer-address" value={address} onChange={e => setAddress(e.target.value)} placeholder={t('Full Address')} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
          <Button onClick={handleSave}>{t('Save Customer')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReservationHistoryDialog({
  isOpen,
  onOpenChange,
  customer,
  reservations,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  reservations: TableType[];
}) {
  const { t } = useLanguage();
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Reservation History for')} {customer.name}</DialogTitle>
          <DialogDescription>{t('A log of all past and current table reservations.')}</DialogDescription>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto py-4">
          {reservations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((table) => (
                  <TableRow key={table.id}>
                    <TableCell>Table {table.id}</TableCell>
                    <TableCell>{table.reservationDetails?.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground pt-8">{t('No reservation history found for this customer.')}</p>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{t('Close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CustomerHistoryDialog({
  isOpen,
  onOpenChange,
  customer,
  bills,
  currency,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  bills: Bill[];
  currency: string;
}) {
  const { t } = useLanguage();
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const handlePrintBill = (bill: Bill) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt for Bill #${bill.id}</title>
            <style>
              body { font-family: monospace; margin: 20px; }
              pre { white-space: pre-wrap; word-wrap: break-word; }
            </style>
          </head>
          <body>
            <pre>${bill.receiptPreview}</pre>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Bill History for')} {customer.name}</DialogTitle>
            <DialogDescription>
              {t('A log of all past transactions for this customer.')}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto py-4">
            {bills.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Bill ID')}</TableHead>
                    <TableHead>{t('Date')}</TableHead>
                    <TableHead className="text-right">{t('Amount')}</TableHead>
                    <TableHead className="text-center">{t('Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell>{bill.id}</TableCell>
                      <TableCell>{format(new Date(bill.timestamp), "PPP p")}</TableCell>
                      <TableCell className="text-right font-mono">
                        {currency}{bill.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedBill(bill)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handlePrintBill(bill)}>
                          <Printer className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground pt-8">
                No bill history found for this customer.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedBill} onOpenChange={() => setSelectedBill(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Receipt for Bill #')}{selectedBill?.id}</DialogTitle>
            {selectedBill && (
              <DialogDescription>
                {t('Date')}: {format(new Date(selectedBill.timestamp), 'PPP p')}
              </DialogDescription>
            )}
          </DialogHeader>
          <pre className="mt-4 text-sm font-mono whitespace-pre-wrap break-words bg-muted p-4 rounded-md max-h-[50vh] overflow-auto">
            {selectedBill?.receiptPreview}
          </pre>
        </DialogContent>
      </Dialog>
    </>
  );
}


export default function CustomerManagement({ billHistory, tables, customers: initialCustomers, setCustomers, pendingBills, eventBookings, setEventBookings, currency = 'Rs.' }: CustomerManagementProps) {
  const { t } = useLanguage();
  const { toast } = useToast();


  const [isAddOrEditDialogOpen, setIsAddOrEditDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Customer | 'reservations'>('lastSeen');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewingReservationsFor, setViewingReservationsFor] = useState<Customer | null>(null);
  const [viewingHistoryFor, setViewingHistoryFor] = useState<Customer | null>(null);

  const [eventName, setEventName] = useState('');
  const [bookingName, setBookingName] = useState('');
  const [bookingMobile, setBookingMobile] = useState('');
  const [eventDate, setEventDate] = useState<Date | undefined>();
  const [guestCount, setGuestCount] = useState('');
  const [advancePaid, setAdvancePaid] = useState('');


  const aggregatedCustomers = useMemo(() => {
    const customerMap = new Map<string, Customer>();
    const deletedCustomerIds = new Set(initialCustomers.filter(c => c.isDeleted).map(c => c.id));

    initialCustomers.forEach(cust => {
      if (!cust.isDeleted) {
        customerMap.set(cust.id, {
          ...cust,
          totalVisits: cust.totalVisits || 0,
          totalSpent: cust.totalSpent || 0,
          lastSeen: cust.lastSeen || cust.firstSeen,
        });
      }
    });

    billHistory.forEach(bill => {
      if (!bill.customerDetails || !bill.customerDetails.phone || deletedCustomerIds.has(bill.customerDetails.phone)) {
        return;
      }

      const { phone } = bill.customerDetails;
      const { name, email, address } = bill.customerDetails;
      const existing = customerMap.get(phone);
      const billTimestamp = new Date(bill.timestamp);

      if (existing) {
        existing.totalSpent += bill.total;
        existing.totalVisits += 1;
        if (billTimestamp > new Date(existing.lastSeen)) {
          existing.lastSeen = billTimestamp;
        }
      } else {
        customerMap.set(phone, {
          id: phone,
          phone,
          name,
          email: email || '',
          address: address || '',
          firstSeen: billTimestamp,
          lastSeen: billTimestamp,
          totalVisits: 1,
          totalSpent: bill.total,
        });
      }
    });

    pendingBills.filter(pb => pb.type === 'customer').forEach(pBill => {
      if (pBill.mobile && !deletedCustomerIds.has(pBill.mobile) && !customerMap.has(pBill.mobile)) {
        const firstTxDate = pBill.transactions.length > 0 ? new Date(pBill.transactions[0].date) : new Date();
        customerMap.set(pBill.mobile, {
          id: pBill.mobile,
          phone: pBill.mobile,
          name: pBill.name,
          email: '',
          address: '',
          firstSeen: firstTxDate,
          lastSeen: firstTxDate,
          totalVisits: 1,
          totalSpent: 0,
        });
      }
    });

    return Array.from(customerMap.values());
  }, [billHistory, pendingBills, initialCustomers]);

  const customerReservations = useMemo(() => {
    const reservationMap = new Map<string, TableType[]>();
    tables.forEach(table => {
      if (table.status === 'Reserved' && table.reservationDetails?.mobile) {
        const mobile = table.reservationDetails.mobile;
        const customerReservations = reservationMap.get(mobile) || [];
        customerReservations.push(table);
        reservationMap.set(mobile, customerReservations);
      }
    });
    return reservationMap;
  }, [tables]);


  const sortedAndFilteredCustomers = useMemo(() => {
    let filtered = aggregatedCustomers;
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(lowerTerm) ||
        c.phone.includes(lowerTerm)
      );
    }

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'reservations') {
        const aReservations = customerReservations.get(a.phone)?.length || 0;
        const bReservations = customerReservations.get(b.phone)?.length || 0;
        if (aReservations > bReservations) comparison = 1;
        else if (aReservations < bReservations) comparison = -1;
      } else if (sortField) {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA! > valB!) {
          comparison = 1;
        } else if (valA! < valB!) {
          comparison = -1;
        }
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [aggregatedCustomers, searchTerm, sortField, sortDirection, customerReservations]);

  const handleSort = (field: keyof Customer | 'reservations') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };


  const handleSaveCustomer = (customerData: Omit<Customer, 'id' | 'firstSeen' | 'lastSeen' | 'totalVisits' | 'totalSpent'> & { id?: string }) => {
    const { id, ...data } = customerData;
    const docId = id || data.phone;

    if (!docId) {
      toast({ variant: 'destructive', title: t('Phone number is required.') });
      return;
    }

    const existingCustomerIndex = initialCustomers.findIndex(c => c.id === docId);
    let newCustomers;

    if (existingCustomerIndex > -1) {
      newCustomers = [...initialCustomers];
      newCustomers[existingCustomerIndex] = { ...newCustomers[existingCustomerIndex], ...data, isDeleted: false };
    } else {
      const newCustomer: Customer = {
        id: docId,
        ...data,
        firstSeen: new Date(),
        lastSeen: new Date(),
        totalVisits: 0,
        totalSpent: 0,
        isDeleted: false,
      };
      newCustomers = [...initialCustomers, newCustomer];
    }

    setCustomers(newCustomers);
    toast({ title: id ? t('Customer Updated') : t('Customer Saved') });
  };

  const handleDeleteCustomer = (customerId: string) => {
    const customerIndex = initialCustomers.findIndex(c => c.id === customerId);

    let newCustomers;
    if (customerIndex > -1) {
      newCustomers = [...initialCustomers];
      newCustomers[customerIndex].isDeleted = true;
    } else {
      const customerFromBills = aggregatedCustomers.find(c => c.id === customerId);
      if (customerFromBills) {
        const newEntry: Customer = {
          ...customerFromBills,
          totalVisits: 0, // Reset derived stats
          totalSpent: 0,
          isDeleted: true
        };
        newCustomers = [...initialCustomers, newEntry];
      } else {
        toast({ title: t('Error'), description: t('Could not find customer to delete.') });
        return;
      }
    }

    setCustomers(newCustomers);
    toast({ title: t('Customer Deleted'), description: t('They will no longer appear in the CRM.') });
  };

  const handleBookEvent = () => {
    if (!eventName || !bookingName || !eventDate) {
      toast({ variant: 'destructive', title: t('Missing Information'), description: t('Please fill out event name, booking name, and date.') });
      return;
    }

    const newBooking: EventBooking = {
      id: new Date().toISOString(),
      eventName,
      bookingName,
      bookingMobile,
      eventDate,
      guestCount,
      advancePaid,
    };

    setEventBookings(prev => [...prev, newBooking].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()));

    toast({ title: t('Event Booked!'), description: `"${eventName}" for ${bookingName} on ${format(eventDate, 'PPP')}` });

    setEventName('');
    setBookingName('');
    setBookingMobile('');
    setEventDate(undefined);
    setGuestCount('');
    setAdvancePaid('');
  };

  const handleDeleteEvent = (eventId: string) => {
    setEventBookings(prev => prev.filter(event => event.id !== eventId));
    toast({ title: t('Event Removed') });
  };

  const isValidDate = (date: any) => {
    return date && !isNaN(new Date(date).getTime());
  }

  const getBillsForCustomer = (customerPhone: string) => {
    return billHistory.filter(
      (bill) => bill.customerDetails?.phone === customerPhone
    );
  };

  const getSortIcon = (field: keyof Customer | 'reservations') => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('Book an Event')}</CardTitle>
            <CardDescription>{t('Enter the details for the new event booking.')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-name">{t('Event Name')}</Label>
              <Input id="event-name" value={eventName} onChange={e => setEventName(e.target.value)} placeholder={t('e.g., Birthday Party')} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="booking-name">{t('Booking Name')}</Label>
                <Input id="booking-name" value={bookingName} onChange={e => setBookingName(e.target.value)} placeholder={t('e.g., Mr. Sharma')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-mobile">{t('Mobile Number')}</Label>
                <Input id="booking-mobile" value={bookingMobile} onChange={e => setBookingMobile(e.target.value)} placeholder={t('e.g., 9876543210')} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-date">{t('Date of Event')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !eventDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {eventDate ? format(eventDate, "PPP") : <span>{t('Pick a date')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={eventDate} onSelect={setEventDate} initialFocus /></PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="guest-count">{t('Number of Guests')}</Label>
                <Input id="guest-count" type="number" value={guestCount} onChange={e => setGuestCount(e.target.value)} placeholder="e.g., 25" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="advance-paid">{t('Advance Paid')} ({currency})</Label>
              <Input id="advance-paid" type="number" value={advancePaid} onChange={e => setAdvancePaid(e.target.value)} placeholder="e.g., 5000" />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleBookEvent}>
              <Bookmark className="mr-2 h-4 w-4" /> {t('Book Event')}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Upcoming Events')}</CardTitle>
            <CardDescription>{t('A list of all your scheduled events.')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[26.5rem]">
              {eventBookings.length > 0 ? (
                <div className="space-y-4">
                  {eventBookings.map((event) => (
                    <Card key={event.id} className="relative p-4">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive h-7 w-7">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('Are you sure?')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('This will permanently delete the event')} "{event.eventName}". {t('This action cannot be undone.')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteEvent(event.id)}>{t('Delete')}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <CardTitle className="text-lg">{event.eventName}</CardTitle>
                      <CardDescription>{format(new Date(event.eventDate), 'EEEE, PPP')}</CardDescription>
                      <Separator className="my-2" />
                      <div className="text-sm space-y-1">
                        <p><strong>{t('Booked for')}:</strong> {event.bookingName} ({event.bookingMobile})</p>
                        <p><strong>{t('Guests')}:</strong> {event.guestCount}</p>
                        <p><strong>{t('Advance Paid')}:</strong> {currency} {event.advancePaid || '0'}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>{t('No upcoming events booked.')}</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div>
              <CardTitle>{t('Customer Database')}</CardTitle>
              <CardDescription>{t('View and manage your customers.')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('Search by name or phone...')}
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={() => { setEditingCustomer(null); setIsAddOrEditDialogOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4" /> {t('Add New Customer')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-28rem)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedAndFilteredCustomers.map(customer => {
                const reservations = customerReservations.get(customer.phone) || [];
                return (
                  <Card key={customer.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{customer.name}</CardTitle>
                          <CardDescription>{customer.phone}</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingCustomer(customer); setIsAddOrEditDialogOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-muted rounded-md">
                          <p className="text-xs text-muted-foreground">{t('Visits')}</p>
                          <p className="text-lg font-bold">{customer.totalVisits}</p>
                        </div>
                        <div className="p-2 bg-muted rounded-md col-span-2">
                          <p className="text-xs text-muted-foreground">{t('Total Spent')}</p>
                          <p className="text-lg font-bold font-mono">{currency}{customer.totalSpent.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarDays className="h-4 w-4" />
                          <span>{t('Last seen:')} {isValidDate(customer.lastSeen) ? format(new Date(customer.lastSeen), 'MMM d, yyyy') : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{customer.email || t('No email')}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="grid grid-cols-3 gap-2">
                      <Button variant="outline" className="w-full" onClick={() => setViewingHistoryFor(customer)}>
                        <ShoppingBag className="mr-2 h-4 w-4" /> {t('Bills')}
                      </Button>
                      <Button variant="outline" className="w-full relative" onClick={() => setViewingReservationsFor(customer)}>
                        <Briefcase className="mr-2 h-4 w-4" /> {t('Events')}
                        {reservations.length > 0 && <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />}
                      </Button>
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
                              {t('This action will permanently delete')} {customer.name} {t('from your customer list. Their historical billing data will remain, but they will no longer appear in the CRM.')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCustomer(customer.id)}>{t('Delete')}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {viewingReservationsFor && (
        <ReservationHistoryDialog
          isOpen={!!viewingReservationsFor}
          onOpenChange={(open) => !open && setViewingReservationsFor(null)}
          customer={viewingReservationsFor}
          reservations={customerReservations.get(viewingReservationsFor.phone) || []}
        />
      )}
      {viewingHistoryFor && (
        <CustomerHistoryDialog
          isOpen={!!viewingHistoryFor}
          onOpenChange={(open) => !open && setViewingHistoryFor(null)}
          customer={viewingHistoryFor}
          bills={getBillsForCustomer(viewingHistoryFor.phone)}
          currency={currency}
        />
      )}

      <AddOrEditCustomerDialog
        open={isAddOrEditDialogOpen}
        onOpenChange={setIsAddOrEditDialogOpen}
        onSave={handleSaveCustomer}
        existingCustomer={editingCustomer}
      />
    </div>
  );
}
