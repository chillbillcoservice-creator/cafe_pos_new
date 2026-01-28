
"use client";

import * as React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useFirestore } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import type { Table as TableType, TableStatus, Order, Bill, CustomerOrder, OrderItem, Customer } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, LayoutTemplate, Sparkles, Users, CheckCircle2, Bookmark, Printer, Repeat, Edit, SparklesIcon, UserCheck, BookmarkX, Eye, X, BookMarked, Armchair, QrCode, BellDot, Check, CookingPot } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { format, isSameDay, formatDistanceToNow, formatDistanceToNowStrict } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { generateReceipt } from '@/ai/flows/dynamic-receipt-discount-reasoning';
import { useLanguage } from '@/contexts/language-context';

const statusBaseColors: Record<TableStatus, string> = {
  Available: 'bg-green-400 hover:bg-green-500',
  Occupied: 'bg-red-400 hover:bg-red-500',
  Reserved: 'bg-blue-400 hover:bg-blue-500',
  Cleaning: 'bg-amber-300 hover:bg-amber-400',
};

const getDynamicColor = (status: TableStatus) => {
  return statusBaseColors[status];
};

const statusIcons: Record<TableStatus, React.ElementType> = {
  Available: CheckCircle2,
  Occupied: Users,
  Reserved: Bookmark,
  Cleaning: Sparkles,
};
function TableQrDialog({
  isOpen,
  onOpenChange,
  table,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableType | null;
}) {
  const [baseUrl, setBaseUrl] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  if (!table) return null;

  const orderUrl = `${baseUrl}/order/${table.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(orderUrl)}`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code for Table ${table.id}</title>
            <style>
              body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
              img { max-width: 80%; }
              h1 { font-size: 3rem; }
            </style>
          </head>
          <body>
            <h1>Table ${table.id}</h1>
            <img src="${qrUrl}" alt="QR Code for Table ${table.id}" />
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>QR Code for Table ${table.id}</DialogTitle>
          <DialogDescription>
            Scan this code to view the menu and order.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-8">
          <img src={qrUrl} alt={`QR Code for Table ${table.id}`} />
          <a href={orderUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground mt-2 hover:underline">{orderUrl}</a>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Close')}</Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> {t('Print QR Code')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface TableManagementProps {
  tables: TableType[];
  orders: Order[];
  billHistory: Bill[];
  updateTableStatus: (tableIds: number[], status: TableStatus, reservationDetails?: TableType['reservationDetails']) => void;
  updateTableDetails: (tableId: number, details: { name?: string, seats?: number }) => void;
  addTable: () => void;
  removeLastTable: () => void;
  occupancyCount: Record<number, number>;
  onEditOrder: (order: Order) => void;
  onCreateOrder: (tableId: number) => void;
  onAcceptCustomerOrder: (tableId: number, items: OrderItem[]) => void;
  showOccupancy: boolean;
  setShowOccupancy: React.Dispatch<React.SetStateAction<boolean>>;
  initialSelectedTableId?: number | null;
  showTableDetailsOnPOS: boolean;
  setShowTableDetailsOnPOS: React.Dispatch<React.SetStateAction<boolean>>;
  showReservationTimeOnPOS: boolean;
  setShowReservationTimeOnPOS: React.Dispatch<React.SetStateAction<boolean>>;
  customerOrders: CustomerOrder[];
  onOrderCreated: (order: Order) => void;
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  currency: string;
}

function CancelReservationDialog({
  isOpen,
  onOpenChange,
  tables,
  updateTableStatus,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tables: TableType[];
  updateTableStatus: (tableIds: number[], status: TableStatus, reservationDetails?: TableType['reservationDetails']) => void;
}) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [selectedTableToCancel, setSelectedTableToCancel] = useState<string>('');

  const reservedTables = tables.filter(t => t.status === 'Reserved');

  const handleCancelReservation = () => {
    if (!selectedTableToCancel) {
      toast({
        variant: 'destructive',
        title: 'No Table Selected',
        description: 'Please select a reservation to cancel.',
      });
      return;
    }

    const tableId = parseInt(selectedTableToCancel, 10);
    updateTableStatus([tableId], 'Available', undefined);

    toast({
      title: 'Reservation Cancelled',
      description: `The reservation for Table ${tableId} has been cancelled.`,
    });

    setSelectedTableToCancel('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Cancel a Reservation')}</DialogTitle>
          <DialogDescription>
            {t('Select a reserved table to cancel its booking.')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Label htmlFor="cancel-reservation-select">Select Reservation</Label>
          <Select value={selectedTableToCancel} onValueChange={setSelectedTableToCancel}>
            <SelectTrigger id="cancel-reservation-select">
              <SelectValue placeholder="Select a reserved table..." />
            </SelectTrigger>
            <SelectContent>
              {reservedTables.length > 0 ? (
                reservedTables.map(table => (
                  <SelectItem key={table.id} value={String(table.id)}>
                    Table {table.id} - {table.reservationDetails?.name} at {table.reservationDetails?.time}
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No tables are currently reserved.
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button variant="destructive" onClick={handleCancelReservation} disabled={!selectedTableToCancel}>
            Confirm Cancellation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditTableDetailsDialog({
  isOpen,
  onOpenChange,
  tables,
  onSave
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tables: TableType[];
  onSave: (tableId: number, details: { name: string, seats: number }) => void;
}) {
  const [selectedTableId, setSelectedTableId] = useState('');
  const [name, setName] = useState('');
  const [seats, setSeats] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedTableId('');
      setName('');
      setSeats('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedTableId) {
      const table = tables.find(t => String(t.id) === selectedTableId);
      if (table) {
        setName(table.name || '');
        setSeats(table.seats ? String(table.seats) : '');
      }
    }
  }, [selectedTableId, tables]);

  const handleSave = () => {
    if (selectedTableId) {
      onSave(Number(selectedTableId), { name, seats: Number(seats) || 0 });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Table Details</DialogTitle>
          <DialogDescription>
            Select a table to set a custom name and seat count.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="table-select">Select Table</Label>
            <Select value={selectedTableId} onValueChange={setSelectedTableId}>
              <SelectTrigger id="table-select">
                <SelectValue placeholder="Select a table..." />
              </SelectTrigger>
              <SelectContent>
                {tables.map(table => (
                  <SelectItem key={table.id} value={String(table.id)}>
                    Table {table.id} {table.name ? `(${table.name})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedTableId && (
            <>
              <div className="space-y-2">
                <Label htmlFor="table-name">Table Name (Optional)</Label>
                <Input
                  id="table-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Window Seat, Couple's Corner"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="table-seats">Number of Seats (Optional)</Label>
                <Input
                  id="table-seats"
                  type="number"
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                  placeholder="e.g., 4"
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!selectedTableId}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TableManagement({ tables, orders, billHistory, updateTableStatus, updateTableDetails, addTable, removeLastTable, occupancyCount, onEditOrder, showOccupancy, setShowOccupancy, initialSelectedTableId, onCreateOrder, onAcceptCustomerOrder, showTableDetailsOnPOS, setShowTableDetailsOnPOS, showReservationTimeOnPOS, setShowReservationTimeOnPOS, customerOrders, onOrderCreated, customers, setCustomers, currency = 'Rs.' }: TableManagementProps) {
  const [selectedTable, setSelectedTable] = useState<TableType | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [selectedTables, setSelectedTables] = useState<number[]>([]);
  const [isLayoutManagerOpen, setIsLayoutManagerOpen] = useState(false);
  const [filter, setFilter] = useState<TableStatus | 'All'>('All');
  const [hoveredStatus, setHoveredStatus] = useState<TableStatus | null>(null);
  const [isBillHistoryDialogOpen, setIsBillHistoryDialogOpen] = useState(false);
  const [billsForDialog, setBillsForDialog] = useState<Bill[]>([]);
  const { toast } = useToast();
  const { t } = useLanguage();
  const [reservedTableAction, setReservedTableAction] = useState<TableType | null>(null);
  const [occupiedTableAction, setOccupiedTableAction] = useState<TableType | null>(null);
  const [availableTableAction, setAvailableTableAction] = useState<TableType | null>(null);
  const [isEditDetailsDialogOpen, setIsEditDetailsDialogOpen] = useState(false);
  const [tableForQr, setTableForQr] = useState<TableType | null>(null);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);

  const [reservationName, setReservationName] = useState('');
  const [reservationSalutation, setReservationSalutation] = useState('Mr.');
  const [reservationMobile, setReservationMobile] = useState('');
  const [reservationTime, setReservationTime] = useState({ hour: '12', minute: '00', period: 'PM' });
  const [reservationTableId, setReservationTableId] = useState<string>('');
  const [isCancelReservationDialogOpen, setIsCancelReservationDialogOpen] = useState(false);

  const db = useFirestore();
  const reservationNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialSelectedTableId) {
      const table = tables.find(t => t.id === initialSelectedTableId);
      if (table) {
        setSelectedTable(table);
      }
    }
  }, [initialSelectedTableId, tables]);

  const filteredTables = tables.filter(table => filter === 'All' || table.status === filter);
  const availableTables = useMemo(() => tables.filter(t => t.status === 'Available'), [tables]);
  const reservedTables = useMemo(() => tables.filter(t => t.status === 'Reserved'), [tables]);

  const tablePerformanceData = useMemo(() => {
    const todaysBills = billHistory.filter(bill => {
      if (!bill.timestamp) return false;
      return isSameDay(new Date(bill.timestamp), new Date());
    });

    return tables.map(table => {
      const billsForTable = todaysBills.filter(bill => String(bill.tableId) === String(table.id));
      const turnover = billsForTable.length;
      const revenue = billsForTable.reduce((sum, bill) => sum + bill.total, 0);

      const avgDuration = turnover > 0 ? billsForTable.reduce((sum, bill) => {
        const start = bill.createdAt;
        const end = bill.completedAt;
        return sum + (end.getTime() - start.getTime());
      }, 0) / turnover / 60000 : 0;

      const aov = turnover > 0 ? revenue / turnover : 0;

      return { id: table.id, turnover, revenue, avgDuration, aov, bills: billsForTable };
    });
  }, [tables, billHistory]);

  const handleTableClick = (table: TableType) => {
    if (selectedTables.length > 0) {
      handleCheckboxChange(table.id, !selectedTables.includes(table.id));
      return;
    }

    if (table.status === 'Available') {
      setAvailableTableAction(table);
    } else if (table.status === 'Occupied') {
      setOccupiedTableAction(table);
    } else if (table.status === 'Reserved') {
      setReservedTableAction(table);
    } else {
      updateTableStatus([table.id], 'Available', undefined);
    }
  };


  const handleDoubleClick = (table: TableType) => {
    const order = orders.find(o => o.tableId === table.id && o.status !== 'Completed');
    if (order) {
      onEditOrder(order);
    } else {
      onCreateOrder(table.id);
    }
  };

  const handleCheckboxChange = (tableId: number, checked: boolean) => {
    setSelectedTables(prev =>
      checked
        ? [...prev, tableId]
        : prev.filter(id => id !== tableId)
    );
  };

  const handleSelectAllTables = (checked: boolean) => {
    if (checked) {
      setSelectedTables(filteredTables.map(t => t.id));
    } else {
      setSelectedTables([]);
    }
  }

  const handleBulkUpdate = (status: TableStatus) => {
    updateTableStatus(selectedTables, status);
    setSelectedTables([]);
  }

  const handleStatusButtonClick = (status: TableStatus | 'All') => {
    if (status !== 'All' && selectedTables.length > 0) {
      handleBulkUpdate(status);
    } else {
      setFilter(status);
      setSelectedTables([]);
    }
  };

  const handleRemoveLastTable = () => {
    if (tables.length > 0) {
      removeLastTable();
      const lastTable = tables.reduce((prev, current) => (prev.id > current.id) ? prev : current);
      setSelectedTables(prev => prev.filter(id => id !== lastTable.id));
    }
  };

  const getLocalReceipt = (orderItems: OrderItem[], discount: number, venueName: string) => {
    if (orderItems.length === 0) return '';

    const pad = (str: string, len: number, char = ' ') => str.padEnd(len, char);
    const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const total = subtotal * (1 - discount / 100);
    const money = (val: number) => `${currency}${val.toFixed(2)}`;

    let receiptLines = [];
    receiptLines.push('*************************');
    receiptLines.push(`    ${venueName}    `);
    receiptLines.push('*************************');
    receiptLines.push('');
    receiptLines.push('Order Details:');
    orderItems.forEach((item, index) => {
      const lineTotal = item.price * item.quantity;
      const qtyName = `${item.quantity} x ${item.name}`;
      const priceStr = money(lineTotal);
      const line = `${pad(`${index + 1}. ${qtyName}`, 25)} ${priceStr.padStart(10)}`;
      receiptLines.push(line);
    });
    receiptLines.push('');
    receiptLines.push('-------------------------');
    receiptLines.push(`${pad('Subtotal:', 25)} ${money(subtotal).padStart(10)}`);

    if (discount > 0) {
      const discountAmount = subtotal * (discount / 100);
      receiptLines.push(`${pad(`Discount (${discount}%):`, 25)} ${money(-discountAmount).padStart(10)}`);
      receiptLines.push('-------------------------');
    }

    receiptLines.push(`${pad('Total:', 25)} ${`${currency}${total.toFixed(2)}`.padStart(10)}`);
    receiptLines.push('');
    receiptLines.push('   Thank you for dining!   ');
    receiptLines.push('*************************');

    return receiptLines.join('\n');
  };

  const handleOpenPrintDialog = async (e: React.MouseEvent, table: TableType) => {
    e.stopPropagation();
    const order = orders.find(o => o.tableId === table.id && o.status !== 'Completed');
    if (order) {
      const receipt = getLocalReceipt(order.items, 0, "Up & Above"); // Assuming 0 discount for now

      const billForPrint: Bill = {
        id: order.id,
        orderItems: order.items,
        tableId: order.tableId,
        total: order.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        receiptPreview: receipt,
        timestamp: new Date(),
        orderType: order.orderType,
        createdAt: order.createdAt,
        completedAt: new Date(),
      };
      setSelectedBill(billForPrint);
    } else {
      toast({
        variant: 'destructive',
        title: 'No Active Order',
        description: 'There is no active order for this table to print a bill.',
      });
    }
  };

  const handleOpenQrDialog = (e: React.MouseEvent, table: TableType) => {
    e.stopPropagation();
    setTableForQr(table);
    setIsQrDialogOpen(true);
  };

  const handlePrintReceipt = (bill: Bill) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Bill for #${bill.id}</title>
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
    setSelectedBill(null);
  };

  const openBillsDialog = (bills: Bill[]) => {
    setBillsForDialog(bills);
    setIsBillHistoryDialogOpen(true);
  };

  const handleReserveTable = () => {
    const { hour, minute, period } = reservationTime;
    if (!reservationName || !hour || !minute || !period || !reservationTableId) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide guest name, a valid arrival time, and select a table.',
      });
      return;
    }

    const fullName = `${reservationSalutation} ${reservationName}`;
    const formattedTime = `${hour}:${minute} ${period}`;
    const reservationDetails = {
      name: fullName,
      mobile: reservationMobile,
      time: formattedTime,
    };

    updateTableStatus([parseInt(reservationTableId)], 'Reserved', reservationDetails);

    // Sync with Customer Database
    const existingCustomer = customers.find(c => c.phone === reservationMobile);
    if (!existingCustomer) {
      const newCustomer: Customer = {
        id: reservationMobile,
        name: fullName,
        phone: reservationMobile,
        email: '',
        address: '',
        firstSeen: new Date(),
        lastSeen: new Date(),
        totalVisits: 0,
        totalSpent: 0,
        isDeleted: false,
      };
      setCustomers([...customers, newCustomer]);
      toast({
        title: 'Customer Added',
        description: `${fullName} has been added to the customer database.`,
      });
    }

    toast({
      title: 'Table Reserved!',
      description: `Table ${reservationTableId} is now reserved for ${fullName}.`,
    });

    setReservationName('');
    setReservationMobile('');
    setReservationTime({ hour: '12', minute: '00', period: 'PM' });
    setReservationTableId('');
    setReservationSalutation('Mr.');
  };


  return (
    <div className="p-4 space-y-6">

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center gap-4 flex-wrap mb-4">
            <div>
              <CardTitle>{t('Table Management')}</CardTitle>
              <CardDescription>{t('Oversee and manage all tables in your restaurant.')}</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="secondary" className='bg-primary hover:bg-primary/90 text-primary-foreground' onClick={() => setIsLayoutManagerOpen(true)}>
                <LayoutTemplate className="mr-2 h-4 w-4" />
                <span>{t('Manage Tables')}</span>
              </Button>
              {selectedTables.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    onCheckedChange={(checked) => handleSelectAllTables(Boolean(checked))}
                    checked={selectedTables.length === filteredTables.length && filteredTables.length > 0}
                    disabled={filteredTables.length === 0}
                  />
                  <Label htmlFor="select-all">Select All ({selectedTables.length})</Label>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap p-4 border-t border-b">
            <span className="text-sm font-semibold text-muted-foreground mr-2">{selectedTables.length > 0 ? 'Change selected to:' : 'Filter by:'}</span>
            <Button
              variant={filter === 'All' ? 'default' : 'outline'}
              onClick={() => handleStatusButtonClick('All')}
            >
              All ({tables.length})
            </Button>
            {(Object.keys(statusBaseColors) as TableStatus[]).map(status => {
              const Icon = statusIcons[status];
              return (
                <Button
                  key={status}
                  onClick={() => handleStatusButtonClick(status)}
                  onMouseEnter={() => setHoveredStatus(status)}
                  onMouseLeave={() => setHoveredStatus(null)}
                  variant={filter === status ? 'default' : 'outline'}
                  className={cn(
                    'transition-all',
                    filter !== status && getDynamicColor(status),
                    filter !== status && (status === 'Available' || status === 'Occupied' ? 'text-white' : 'text-black'),
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {status} ({tables.filter(t => t.status === status).length})
                </Button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10 gap-4">
            {filteredTables.map(table => {
              const Icon = statusIcons[table.status];
              const turnover = occupancyCount[table.id] || 0;
              const order = orders.find(o => o.tableId === table.id && o.status === 'In Preparation');
              const elapsedTimeString = order?.createdAt ? formatDistanceToNowStrict(new Date(order.createdAt)) : null;

              let displayTime = elapsedTimeString;
              if (elapsedTimeString) {
                const timeParts = elapsedTimeString.split(" ");
                if (timeParts.includes("seconds") || timeParts.includes("second")) {
                  displayTime = `${String(timeParts[0]).padStart(2, '0')} seconds`;
                } else if (timeParts.includes("minutes") || timeParts.includes("minute")) {
                  displayTime = `${timeParts[0]} ${timeParts[1]}`;
                }
              }

              return (
                <div
                  key={table.id}
                  className={cn(
                    'group aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-lg hover:shadow-2xl relative border-2 p-1 hover:scale-110 hover:z-10',
                    getDynamicColor(table.status),
                    selectedTables.includes(table.id) && 'ring-4 ring-offset-2 ring-primary border-primary',
                    !selectedTables.includes(table.id) && 'border-black/50',
                    hoveredStatus === table.status && 'scale-110 z-10'
                  )}
                  onClick={() => handleTableClick(table)}
                  onDoubleClick={() => handleDoubleClick(table)}
                >
                  <div className="absolute top-1 left-1 flex flex-col gap-1">
                    {table.status === 'Occupied' && (
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 bg-white/30 hover:bg-white/50"
                        onClick={(e) => handleOpenPrintDialog(e, table)}
                      >
                        <Printer className="h-4 w-4 text-black" />
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 bg-white/30 hover:bg-white/50"
                      onClick={(e) => handleOpenQrDialog(e, table)}
                    >
                      <QrCode className="h-4 w-4 text-black" />
                    </Button>
                    {table.status === 'Reserved' && (
                      <>
                        <Button variant="secondary" size="icon" className="h-7 w-7 bg-green-500 hover:bg-green-600" onClick={(e) => {
                          e.stopPropagation();
                          const allOrderIds = [...orders.map(o => parseInt(o.id)).filter(id => !isNaN(id)), ...billHistory.map(b => parseInt(b.id)).filter(id => !isNaN(id))];
                          const maxId = Math.max(0, ...allOrderIds);
                          const newId = (maxId + 1).toString();
                          const newOrder: Order = { id: newId, items: [], tableId: table.id, status: 'In Preparation', orderType: 'Dine-In', createdAt: new Date() };
                          onOrderCreated(newOrder);
                          updateTableStatus([table.id], 'Occupied');
                        }}>
                          <UserCheck className="h-4 w-4 text-white" />
                        </Button>
                        <Button variant="secondary" size="icon" className="h-7 w-7 bg-red-500 hover:bg-red-600" onClick={(e) => { e.stopPropagation(); updateTableStatus([table.id], 'Available', undefined); }}>
                          <BookmarkX className="h-4 w-4 text-white" />
                        </Button>
                      </>
                    )}
                  </div>
                  {showOccupancy && turnover > 0 &&
                    <div className="absolute bottom-1 left-1 flex items-center gap-1 bg-black/50 text-white text-xs font-bold p-1 rounded-md">
                      <Repeat className="h-3 w-3" />
                      <span>{turnover}</span>
                    </div>
                  }
                  <div className={cn("absolute top-1 right-1 transition-opacity", (selectedTables.length > 0 || table.status === 'Reserved' || hoveredStatus) ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                    <Checkbox
                      className="bg-white/50 border-gray-500 data-[state=checked]:bg-primary"
                      checked={selectedTables.includes(table.id)}
                      onCheckedChange={(checked) => handleCheckboxChange(table.id, Boolean(checked))}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="text-center">
                    <span className={cn("text-6xl font-bold", table.status === 'Available' || table.status === 'Occupied' ? 'text-white' : 'text-black')}>{table.id}</span>
                    <div className="flex items-center justify-center gap-1">
                      {React.createElement(Icon, { className: cn("h-4 w-4", table.status === 'Available' || table.status === 'Occupied' ? 'text-white' : 'text-black') })}
                      <span className={cn("text-base font-semibold leading-tight", table.status === 'Available' || table.status === 'Occupied' ? 'text-white' : 'text-black')}>{table.status}</span>
                    </div>
                    {table.name && <div className="text-xs font-bold text-white mt-1 max-w-full truncate">{table.name}</div>}
                    {table.seats && <div className="text-xs text-white flex items-center justify-center gap-1"><Armchair className="h-3 w-3" /> {table.seats}</div>}
                    {table.status === 'Occupied' && displayTime && (
                      <div className="text-xs text-white font-bold bg-black/50 rounded-full px-2 py-0.5 mt-1">
                        {displayTime}
                      </div>
                    )}
                    {table.status === 'Reserved' && table.reservationDetails && (
                      <div className="text-xs text-black font-bold mt-1 max-w-full truncate px-1">
                        <p>{table.reservationDetails.time}</p>
                        <p>for {table.reservationDetails.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {filteredTables.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground py-16">
                {t('No tables with status')} "{filter}".
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 mt-6">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Table Performance (Today)</CardTitle>
            <CardDescription>Review daily turnover, revenue, and occupancy duration for each table.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Table')} No.</TableHead>
                    <TableHead>{t('Turnover')}</TableHead>
                    <TableHead>{t('Total Revenue')}</TableHead>
                    <TableHead>{t('Avg. Order Value')}</TableHead>
                    <TableHead>{t('Avg. Duration')}</TableHead>
                    <TableHead className="text-right">{t('Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tablePerformanceData.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-bold text-lg">{p.id}</TableCell>
                      <TableCell className="font-semibold">{p.turnover}</TableCell>
                      <TableCell className="font-semibold text-green-600">Rs.{p.revenue.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">Rs.{p.aov.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">{p.avgDuration > 0 ? `${p.avgDuration.toFixed(0)} min` : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => openBillsDialog(p.bills)} disabled={p.bills.length === 0}>
                          <Eye className="mr-2 h-4 w-4" /> View Bills
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <div className="lg:col-span-3 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookMarked /> Reserve a Table</CardTitle>
              <CardDescription>Book a table for a future date or time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-4 items-end">
                <div className='space-y-2'>
                  <Label htmlFor="guest-salutation">Title</Label>
                  <Select value={reservationSalutation} onValueChange={setReservationSalutation}>
                    <SelectTrigger id="guest-salutation" className="w-[80px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr.">Mr.</SelectItem>
                      <SelectItem value="Mrs.">Mrs.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest-name">Guest Name</Label>
                  <Input ref={reservationNameInputRef} id="guest-name" value={reservationName} onChange={(e) => setReservationName(e.target.value)} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="guest-mobile">Mobile No. (Optional)</Label>
                  <Input id="guest-mobile" value={reservationMobile} onChange={(e) => setReservationMobile(e.target.value)} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Time of Arrival</Label>
                  <div className="flex items-center gap-1">
                    <Select value={reservationTime.hour} onValueChange={(v) => setReservationTime(p => ({ ...p, hour: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>{String(i + 1).padStart(2, '0')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="font-bold">:</span>
                    <Select value={reservationTime.minute} onValueChange={(v) => setReservationTime(p => ({ ...p, minute: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 60 }, (_, i) => (
                          <SelectItem key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={reservationTime.period} onValueChange={(v) => setReservationTime(p => ({ ...p, period: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="table-no">Table No.</Label>
                  <Select value={reservationTableId} onValueChange={setReservationTableId}>
                    <SelectTrigger id="table-no">
                      <SelectValue placeholder="Select Table" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTables.map(table => (
                        <SelectItem key={table.id} value={String(table.id)}>
                          Table {table.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={handleReserveTable}>Reserve Table</Button>
              <Button variant="destructive" className="w-full" onClick={() => setIsCancelReservationDialogOpen(true)}>Cancel Reservation</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Current Reservations</CardTitle>
              <CardDescription>A list of upcoming bookings.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {reservedTables.length > 0 ? reservedTables.map(table => (
                  <div key={table.id} className="p-3 rounded-lg border bg-muted/50 flex justify-between items-center">
                    <div>
                      <p className="font-bold">Table {table.id}</p>
                      <p className="text-sm text-muted-foreground">{table.reservationDetails?.name}</p>
                    </div>
                    <p className="font-semibold">{table.reservationDetails?.time}</p>
                  </div>
                )) : (
                  <p className="text-center text-muted-foreground py-8">No tables are currently reserved.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isLayoutManagerOpen} onOpenChange={setIsLayoutManagerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Tables</DialogTitle>
            <DialogDescription>
              Add or remove tables and manage display settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={addTable}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add a New Table
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={tables.length === 0}>
                    <Trash2 className="mr-2 h-4 w-4" /> Remove Table
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove the last table. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemoveLastTable}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setIsEditDetailsDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Table Details
            </Button>
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
              <Label htmlFor="show-occupancy">Show Occupancy Counter</Label>
              <Switch
                id="show-occupancy"
                checked={showOccupancy}
                onCheckedChange={setShowOccupancy}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
              <Label htmlFor="show-table-details-pos">Show table details on main window</Label>
              <Switch
                id="show-table-details-pos"
                checked={showTableDetailsOnPOS}
                onCheckedChange={setShowTableDetailsOnPOS}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
              <Label htmlFor="show-reservation-time-pos">Show reserved table details on main window</Label>
              <Switch
                id="show-reservation-time-pos"
                checked={showReservationTimeOnPOS}
                onCheckedChange={setShowReservationTimeOnPOS}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsLayoutManagerOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedBill} onOpenChange={() => setSelectedBill(null)}>
        <DialogContent>
          {selectedBill && (
            <>
              <DialogHeader>
                <DialogTitle>Bill for Table {selectedBill.tableId}</DialogTitle>
              </DialogHeader>
              <div className="py-4 font-mono max-h-96 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-md">
                  {selectedBill?.receiptPreview}
                </pre>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedBill(null)}>Cancel</Button>
                <Button onClick={() => handlePrintReceipt(selectedBill)}>
                  <Printer className="mr-2 h-4 w-4" /> Print Bill
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isBillHistoryDialogOpen} onOpenChange={setIsBillHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bill History for Table {billsForDialog[0]?.tableId}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill ID</TableHead>
                  <TableHead>Date &amp; Time</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billsForDialog.map(bill => (
                  <TableRow key={bill.id}>
                    <TableCell>{bill.id}</TableCell>
                    <TableCell>{format(new Date(bill.timestamp), 'Pp')}</TableCell>
                    <TableCell>₹{bill.total.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedBill(bill)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handlePrintReceipt(bill)}><Printer className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reservedTableAction} onOpenChange={() => setReservedTableAction(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('Reservation for Table')} {reservedTableAction?.id}</DialogTitle>
            <DialogDescription>
              {t('Guest')}: {reservedTableAction?.reservationDetails?.name || t('N/A')} {t('at')} {reservedTableAction?.reservationDetails?.time || t('N/A')}.
              <br />
              {t('What would you like to do?')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-4">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                if (reservedTableAction) {
                  updateTableStatus([reservedTableAction.id], 'Available', undefined);
                  setReservedTableAction(null);
                }
              }}
            >
              <BookmarkX className="mr-2 h-4 w-4" />
              {t('Cancel Reservation')}
            </Button>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => {
                if (reservedTableAction) {
                  const tableId = reservedTableAction.id;
                  const allOrderIds = [...orders.map(o => parseInt(o.id)).filter(id => !isNaN(id)), ...billHistory.map(b => parseInt(b.id)).filter(id => !isNaN(id))];
                  const maxId = Math.max(0, ...allOrderIds);
                  const newId = (maxId + 1).toString();
                  const newOrder: Order = { id: newId, items: [], tableId: tableId, status: 'In Preparation', orderType: 'Dine-In', createdAt: new Date() };
                  onOrderCreated(newOrder);
                  updateTableStatus([tableId], 'Occupied');
                  setReservedTableAction(null);
                }
              }}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              {t('Guest Has Arrived')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!occupiedTableAction} onOpenChange={() => setOccupiedTableAction(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('Table')} {occupiedTableAction?.id} {t('is Occupied')}</DialogTitle>
            <DialogDescription>
              {t('What would you like to do for this table?')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4">
            <Button variant="outline" className="w-full" onClick={(e) => {
              if (occupiedTableAction) {
                handleOpenPrintDialog(e, occupiedTableAction);
              }
              setOccupiedTableAction(null);
            }}>
              <Printer className="mr-2 h-4 w-4" /> {t('Show Bill')}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => {
              if (occupiedTableAction) {
                const order = orders.find(o => o.tableId === occupiedTableAction.id && o.status !== 'Completed');
                if (order) onEditOrder(order);
                else onCreateOrder(occupiedTableAction.id);
              }
              setOccupiedTableAction(null);
            }}>
              <Edit className="mr-2 h-4 w-4" /> {t('Edit Order')}
            </Button>
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => {
              if (occupiedTableAction) {
                const order = orders.find(o => o.tableId === occupiedTableAction.id && o.status !== 'Completed');
                if (order) onEditOrder(order);
                else onCreateOrder(occupiedTableAction.id);
              }
              setOccupiedTableAction(null);
            }}>
              <Check className="mr-2 h-4 w-4" /> {t('Go to Payment')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!availableTableAction} onOpenChange={() => setAvailableTableAction(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Table {availableTableAction?.id} {t('is Available')}</DialogTitle>
            <DialogDescription>{t('What would you like to do?')}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                if (availableTableAction) {
                  const tableId = availableTableAction.id;
                  const allOrderIds = [
                    ...orders.map(o => parseInt(o.id)).filter(id => !isNaN(id)),
                    ...billHistory.map(b => parseInt(b.id)).filter(id => !isNaN(id)),
                  ];
                  const maxId = Math.max(0, ...allOrderIds);
                  const newId = (maxId + 1).toString();
                  const newOrder: Order = {
                    id: newId,
                    items: [],
                    tableId: tableId,
                    status: 'In Preparation',
                    orderType: 'Dine-In',
                    createdAt: new Date(),
                  };
                  onOrderCreated(newOrder);
                  updateTableStatus([tableId], 'Occupied');
                  setAvailableTableAction(null);
                }
              }}
            >
              <UserCheck className="mr-2 h-4 w-4" /> {t('Mark Occupied')}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                if (availableTableAction) {
                  setReservationTableId(String(availableTableAction.id));
                  setAvailableTableAction(null);
                  setTimeout(() => {
                    reservationNameInputRef.current?.focus();
                  }, 100);
                }
              }}
            >
              <Bookmark className="mr-2 h-4 w-4" /> {t('Reserve Table')}
            </Button>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => {
                if (availableTableAction) {
                  onCreateOrder(availableTableAction.id);
                }
                setAvailableTableAction(null);
              }}
            >
              <CookingPot className="mr-2 h-4 w-4" /> {t('Take New Order')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CancelReservationDialog
        isOpen={isCancelReservationDialogOpen}
        onOpenChange={setIsCancelReservationDialogOpen}
        tables={tables}
        updateTableStatus={updateTableStatus}
      />

      <EditTableDetailsDialog
        isOpen={isEditDetailsDialogOpen}
        onOpenChange={setIsEditDetailsDialogOpen}
        tables={tables}
        onSave={(tableId, details) => updateTableDetails(tableId, details)}
      />

      <TableQrDialog
        isOpen={isQrDialogOpen}
        onOpenChange={setIsQrDialogOpen}
        table={tableForQr}
      />

    </div>
  );
}
