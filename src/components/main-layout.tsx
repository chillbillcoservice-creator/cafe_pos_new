
'use client';

import * as React from 'react';
import { useLanguage } from '@/contexts/language-context';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Utensils, LayoutGrid, Soup, Users, Shield, Receipt, Package, PanelTop, PanelLeft, Users2, Menu as MenuIcon, HelpCircle, BellDot, Bookmark } from 'lucide-react';
import { formatDistanceToNowStrict, isSameDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Table, TableStatus, Order, Bill, Employee, OrderItem, Expense, InventoryItem, KOTPreference, OrderType, MenuCategory, CustomerOrder, Vendor, PendingBill, Customer, Attendance, Advance, EventBooking } from '@/lib/types';
import { Logo } from "./icons";
import PosSystem from './pos-system';
import TableManagement from './table-management';
import KitchenOrders from './kitchen-orders';
import AdminDashboard from './admin-dashboard';
import StaffManagement from "./staff-management";
import ExpensesTracker from './expenses-tracker';
import InventoryManagement from './inventory-management';
import CustomerManagement from './customer-management';
import { Separator } from '@/components/ui/separator';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';
import SetupWizard from './setup-wizard';
import { ThemeToggle } from './theme-toggle';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { HelpDialog } from './help-dialog';
import IncomingOrdersDialog from './incoming-orders-dialog';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, writeBatch, doc, setDoc } from 'firebase/firestore';
import { groupItemsForKOT } from '@/lib/kot-utils';
import type { VenueDetails, OwnerDetails } from "@/lib/types";

const PENDING_ORDER_KEY = -1;

type NavPosition = 'top' | 'left';

interface MainLayoutProps {
  initialMenu: MenuCategory[];
  initialInventory: InventoryItem[];
  initialEmployees: Employee[];
  initialBills: Bill[];
  initialExpenses: Expense[];
  initialCustomers: Customer[];
  initialVendors: Vendor[];
  initialPendingBills: PendingBill[];
  initialVenueName: string;
  initialKotPreference: KOTPreference;
  initialAttendance: Attendance[];
  initialAdvances: Advance[];
  initialEventBookings: EventBooking[];
  setMenu: (menu: MenuCategory[]) => void;
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  setBills: React.Dispatch<React.SetStateAction<Bill[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
  setPendingBills: React.Dispatch<React.SetStateAction<PendingBill[]>>;
  setAttendance: React.Dispatch<React.SetStateAction<Attendance[]>>;
  setAdvances: React.Dispatch<React.SetStateAction<Advance[]>>;
  setVenueName: (name: string) => void;
  setKotPreference: (preference: KOTPreference) => void;

  setEventBookings: React.Dispatch<React.SetStateAction<EventBooking[]>>;
  initialCurrency: string;
  setCurrency: (currency: string) => void;
  venueDetails?: VenueDetails | null;
  ownerDetails?: OwnerDetails | null;
  initialLanguage: string;
  setLanguage: (lang: string) => void;
}

export default function MainLayout({
  initialMenu,
  initialInventory,
  initialEmployees,
  initialBills,
  initialExpenses,
  initialCustomers,
  initialVendors,
  initialPendingBills,
  initialVenueName,
  initialKotPreference,
  initialAttendance,
  initialAdvances,
  initialEventBookings,
  setMenu,
  setInventory,
  setEmployees,
  setBills,
  setExpenses,
  setCustomers,
  setVendors,
  setPendingBills,
  setAttendance,
  setAdvances,
  setVenueName,
  setKotPreference,
  setEventBookings,
  initialCurrency,
  setCurrency,
  venueDetails,
  ownerDetails,
  initialLanguage,
  setLanguage
}: MainLayoutProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const db = useFirestore(); // Still needed for QR code orders listener
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [activeTab, setActiveTab] = useState('pos');
  const [initialTableForManagement, setInitialTableForManagement] = useState<number | null>(null);
  const [navPosition, setNavPosition] = useState<NavPosition>('top');
  const [customerCreditLimit, setCustomerCreditLimit] = useState(10000);
  const [vendorCreditLimit, setVendorCreditLimit] = useState(50000);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  const [showTableDetailsOnPOS, setShowTableDetailsOnPOS] = useState(false);
  const [showReservationTimeOnPOS, setShowReservationTimeOnPOS] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [isIncomingOrderDialogOpen, setIsIncomingOrderDialogOpen] = useState(false);

  useEffect(() => {
    if (!db) return;

    // This listener is for real-time QR code orders from customers.
    const unsub = onSnapshot(collection(db, "customerOrders"), (snapshot) => {
      const newOrders: CustomerOrder[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'pending') {
          newOrders.push({ id: doc.id, ...data } as CustomerOrder);
        }
      });
      if (newOrders.length > customerOrders.length) {
        toast({
          title: t("New Customer Order!"),
          description: t("A new order has been placed for table") + ` ${newOrders[newOrders.length - 1].tableId}.`,
        });
        setIsIncomingOrderDialogOpen(true);
      }
      setCustomerOrders(newOrders);
    });

    return () => unsub();
  }, [db, customerOrders.length, toast]);

  // Sync settings to Firestore whenever they change locally
  useEffect(() => {
    if (!db || !initialVenueName || !initialCurrency) return;

    const syncSettings = async () => {
      try {
        await setDoc(doc(db, "settings", "venue"), {
          venueName: initialVenueName,
          currency: initialCurrency,
          address: venueDetails?.address || '',
          contactNumber: venueDetails?.contactNumber || '',
          email: venueDetails?.email || '',
          tagline: venueDetails?.tagline || '',
          ownerName: ownerDetails?.name || '',
          ownerContact: ownerDetails?.contactNumber || '',
          ownerEmail: ownerDetails?.email || '',
        }, { merge: true });
      } catch (e) {
        console.error("Error syncing settings:", e);
      }
    };

    const timer = setTimeout(syncSettings, 1000);
    return () => clearTimeout(timer);
  }, [db, initialVenueName, initialCurrency]);

  // Sync menu to Firestore whenever it changes locally (e.g. status updates)
  useEffect(() => {
    if (!db || !initialMenu) return;

    const syncMenu = async () => {
      try {
        const batch = writeBatch(db);
        initialMenu.forEach(cat => {
          if (cat.id) {
            const docRef = doc(db, 'menu', cat.id);
            // Sanitize: ensure subcategories is never undefined
            const safeCat = {
              ...cat,
              subcategories: cat.subcategories || []
            };
            batch.set(docRef, safeCat, { merge: true });
          }
        });
        await batch.commit();
      } catch (e) {
        console.error("Error syncing menu:", e);
      }
    };

    const timer = setTimeout(syncMenu, 1500); // 1.5s debounce
    return () => clearTimeout(timer);
  }, [db, initialMenu]);

  useEffect(() => {
    try {
      const setupComplete = localStorage.getItem('setupComplete');
      if (!setupComplete) {
        setShowSetupWizard(true);
      }
    } catch (e) {
      console.error("Could not access localStorage", e);
      setShowSetupWizard(true);
    } finally {
      setIsCheckingSetup(false);
    }
  }, []);

  useEffect(() => {
    try {
      const savedCustomerLimit = localStorage.getItem('customerCreditLimit');
      const savedVendorLimit = localStorage.getItem('vendorCreditLimit');
      if (savedCustomerLimit) setCustomerCreditLimit(JSON.parse(savedCustomerLimit));
      if (savedVendorLimit) setVendorCreditLimit(JSON.parse(savedVendorLimit));
    } catch (e) {
      console.error("Could not parse credit limits from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('customerCreditLimit', JSON.stringify(customerCreditLimit));
    } catch (e) {
      console.error("Could not save customer credit limit to localStorage", e);
    }
  }, [customerCreditLimit]);

  useEffect(() => {
    try {
      localStorage.setItem('vendorCreditLimit', JSON.stringify(vendorCreditLimit));
    } catch (e) {
      console.error("Could not save vendor credit limit to localStorage", e);
    }
  }, [vendorCreditLimit]);

  const [selectedTableId, setSelectedTableId] = useState<number | null>(1);
  const [discount, setDiscount] = useState(0);
  const [showOccupancy, setShowOccupancy] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<Record<number, OrderItem[]>>({});

  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({});
  const [keyboardMode, setKeyboardMode] = useState<'table' | 'order' | 'confirm'>('table');
  const mainRef = useRef<HTMLDivElement>(null);
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType>('Dine-In');


  useEffect(() => {
    mainRef.current?.focus();
  }, []);


  useEffect(() => {
    try {
      const savedColors = localStorage.getItem('categoryColors');
      if (savedColors) {
        setCategoryColors(JSON.parse(savedColors));
      }
    } catch (e) {
      console.error("Could not parse 'categoryColors' from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      if (Object.keys(categoryColors).length > 0) {
        localStorage.setItem('categoryColors', JSON.stringify(categoryColors));
      }
    } catch (e) {
      console.error("Could not save 'categoryColors' to localStorage", e);
    }
  }, [categoryColors]);

  const clearCurrentOrder = useCallback((fullReset = false) => {
    setCurrentOrderItems([]);
    setDiscount(0);
    setActiveOrder(null);

    const tableIdToClear = selectedTableId === null ? PENDING_ORDER_KEY : selectedTableId;

    setPendingOrders(prev => {
      const newPending = { ...prev };
      delete newPending[tableIdToClear];
      return newPending;
    });

    if (fullReset) {
      setSelectedTableId(1);
    }
  }, [selectedTableId]);

  const handleSelectTable = useCallback((tableId: number | null) => {
    if (tableId === selectedTableId) return;

    const currentOrderKey = selectedTableId === null ? PENDING_ORDER_KEY : selectedTableId;

    if (currentOrderItems.length > 0) {
      const itemsToSave = [...currentOrderItems];
      setPendingOrders(prev => ({
        ...prev,
        [currentOrderKey]: itemsToSave,
      }));
    } else {
      setPendingOrders(prev => {
        const newPending = { ...prev };
        delete newPending[currentOrderKey];
        return newPending;
      });
    }

    setSelectedTableId(tableId);
  }, [selectedTableId, currentOrderItems]);

  useEffect(() => {
    const tableId = selectedTableId;
    const orderKey = tableId === null ? PENDING_ORDER_KEY : tableId;

    const existingOrder = orders.find(o => o.tableId === tableId && o.status !== 'Completed');
    const pendingItems = pendingOrders[orderKey] || [];

    if (existingOrder) {
      setActiveOrder(existingOrder);

      if (pendingItems.length > 0) {
        setCurrentOrderItems(pendingItems);
      } else {
        setCurrentOrderItems(existingOrder.items);
      }
    } else {
      setActiveOrder(null);
      setCurrentOrderItems(pendingItems);
    }

    setDiscount(0);
  }, [selectedTableId, orders, pendingOrders]);


  useEffect(() => {
    const initialTables: Table[] = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      status: 'Available',
    }));
    setTables(initialTables);
  }, []);

  useEffect(() => {
    setCurrentDateTime(new Date());
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentDateTime
    ? currentDateTime.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : '';

  const formattedTime = currentDateTime
    ? currentDateTime.toLocaleTimeString()
    : '';

  const updateTableStatus = useCallback((tableIds: number[], status: TableStatus, reservationDetails?: Table['reservationDetails']) => {
    setTables(tables => tables.map(t => {
      if (tableIds.includes(t.id)) {
        return { ...t, status, reservationDetails: status === 'Reserved' ? reservationDetails : undefined };
      }
      return t;
    }));
  }, []);

  const updateTableDetails = useCallback((tableId: number, details: { name?: string, seats?: number }) => {
    setTables(prevTables => prevTables.map(t =>
      t.id === tableId ? { ...t, name: details.name || t.name, seats: details.seats || t.seats } : t
    ));
    toast({ title: "Table Updated", description: `Details for Table ${tableId} have been saved.` });
  }, [toast]);

  const addTable = () => {
    setTables(prevTables => {
      const newTableId = prevTables.length > 0 ? Math.max(...prevTables.map(t => t.id)) + 1 : 1;
      const newTable: Table = { id: newTableId, status: 'Available' };
      return [...prevTables, newTable];
    });
  };

  const removeLastTable = () => {
    if (tables.length > 0) {
      setTables(prevTables => {
        if (prevTables.length === 0) return [];
        const tableToRemove = prevTables.reduce((last, current) => (current.id > last.id ? current : last));
        return prevTables.filter(t => t.id !== tableToRemove.id);
      });
    }
  };

  const occupancyCount = useMemo(() => {
    const counts: Record<number, number> = {};
    const todaysBills = initialBills.filter(bill => bill.timestamp && isSameDay(new Date(bill.timestamp), new Date()));

    todaysBills.forEach(bill => {
      if (bill.tableId) {
        counts[bill.tableId] = (counts[bill.tableId] || 0) + 1;
      }
    });

    return counts;
  }, [initialBills]);

  const handleTabChange = (tab: string) => {
    setInitialTableForManagement(null);
    setActiveTab(tab);
    setIsMobileSheetOpen(false);
  }

  const onOrderCreated = useCallback((order: Order) => {
    setOrders(prev => [...prev, order]);
    setActiveOrder(order);
    setCurrentOrderItems(order.items);
    if (order.tableId) {
      setPendingOrders(prev => {
        const newPending = { ...prev };
        delete newPending[order.tableId!];
        return newPending;
      })
    }
  }, []);

  const handleViewTableDetails = (tableId: number) => {
    setInitialTableForManagement(tableId);
    setActiveTab('tables');
  };

  const handleEditOrderFromShortcut = (tableId: number) => {
    const order = orders.find(o => o.tableId === tableId && o.status !== 'Completed');
    if (order) {
      setSelectedTableId(order.tableId ?? null);
      setActiveOrder(order);
      setCurrentOrderItems(order.items);
      setDiscount(0);
      setActiveTab('pos');
    } else {
      handleSelectTable(tableId);
      setActiveTab('pos');
    }
  };

  const handleCreateOrderFromTables = (tableId: number) => {
    handleSelectTable(tableId);
    setActiveTab('pos');
  };

  const handleAcceptCustomerOrder = useCallback((tableId: number, items: OrderItem[]) => {
    const existingOrderForTable = orders.find(o => o.tableId === tableId && o.status !== 'Completed');

    // This is the new, correct way to get new items to send to the kitchen.
    const newItemsForKOT = items;

    let finalOrderState: Order;
    if (existingOrderForTable) {
      const combinedItemsMap = new Map(existingOrderForTable.items.map(item => [item.name, { ...item }]));
      items.forEach(newItem => {
        if (combinedItemsMap.has(newItem.name)) {
          combinedItemsMap.get(newItem.name)!.quantity += newItem.quantity;
        } else {
          combinedItemsMap.set(newItem.name, { ...newItem });
        }
      });

      finalOrderState = { ...existingOrderForTable, items: Array.from(combinedItemsMap.values()) };
      setOrders(prev => prev.map(o => o.id === existingOrderForTable.id ? finalOrderState : o));
    } else {
      const allIds = [
        ...orders.map(o => parseInt(o.id)).filter(id => !isNaN(id)),
        ...initialBills.map(b => parseInt(b.id)).filter(id => !isNaN(id)),
      ];
      const maxId = Math.max(0, ...allIds);
      const newId = (maxId + 1).toString();

      finalOrderState = {
        id: newId,
        items: items,
        tableId: tableId,
        status: 'In Preparation',
        orderType: 'Dine-In',
        createdAt: new Date(),
      };
      setOrders(prev => [...prev, finalOrderState]);
    }

    updateTableStatus([tableId], 'Occupied');
    setActiveTab('pos');
    setSelectedTableId(tableId);

    // Return the generated KOT groups so the UI can show separate print buttons
    if (finalOrderState && newItemsForKOT.length > 0) {
      const kotGroups = groupItemsForKOT(newItemsForKOT, initialKotPreference);
      toast({ title: `Order for Table ${tableId} accepted.` });
      return kotGroups;
    }
    return [];

  }, [orders, initialBills, setOrders, updateTableStatus, toast, setActiveTab, setSelectedTableId, initialKotPreference]);

  const toggleNavPosition = () => {
    setNavPosition(pos => pos === 'top' ? 'left' : 'top');
  }

  const handleSetupComplete = (data: any) => {
    try {
      localStorage.setItem('setupComplete', 'true');
      setVenueName(data.venue.name);
      setEmployees(prev => [...(data.employees || [])]); // Append or replace? Setup usually replaces or initializes. Let's merge if needed, but for "Re-run" let's be careful. Actually, SetupWizard returns employees.
      // Better to check if we should overwrite. For now, let's update state.
      // But critical: Currency
      if (data.currency) {
        setCurrency(data.currency);
      }

      setVendors(data.vendors);
      localStorage.setItem('venueName', data.venue.name);

      // Persist to Firestore immediately
      if (db) {
        // data.venue has { name, address, ... }
        import('firebase/firestore').then(({ doc, setDoc }) => {
          setDoc(doc(db, "settings", "venue"), {
            venueName: data.venue.name,
            currency: data.currency,
            address: data.venue.address || '',
            contactNumber: data.venue.contactNumber || '',
            email: data.venue.email || '',
            tagline: data.venue.tagline || '',
            ownerName: data.owner ? data.owner.name : '',
            ownerContact: data.owner ? data.owner.contactNumber : '',
            ownerEmail: data.owner ? data.owner.email : '',
          }, { merge: true }).catch(err => console.error("Immediate Firestore Sync Error (MainLayout):", err));
        });
      }

    } catch (e) {
      console.error("Could not access localStorage", e);
    }
    setShowSetupWizard(false);
  }




  if (isCheckingSetup) {
    return null;
  }

  if (showSetupWizard) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  const navItems = [
    { value: 'pos', label: t('Main'), icon: Utensils },
    { value: 'tables', label: t('Tables'), icon: LayoutGrid },
    { value: 'kitchen', label: t('Kitchen & Inventory'), icon: Soup },
    { value: 'expenses', label: t('Expenses'), icon: Receipt },
    { value: 'customers', label: t('Customers & Bookings'), icon: Users2 },
    { value: 'staff', label: t('Staff'), icon: Users },
    { value: 'admin', label: t('Admin'), icon: Shield },
  ];
  const renderNav = (isSheet = false) => (
    <TabsList className={cn(
      "m-2 p-0 h-auto bg-transparent",
      navPosition === 'left' && !isSheet ? "flex-col items-start w-auto" : "",
      isSheet && "flex-col items-start w-full"
    )}>
      {navItems.map((item, index) => (
        <React.Fragment key={item.value}>
          <TabsTrigger
            value={item.value}
            className="w-full px-4 py-3 text-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md flex items-center justify-start gap-3"
            onClick={() => handleTabChange(item.value)}
          >
            <item.icon /> <span>{item.label}</span>
          </TabsTrigger>
          {index < navItems.length - 1 && <Separator orientation={navPosition === 'top' && !isSheet ? 'vertical' : 'horizontal'} className={cn(navPosition === 'top' && !isSheet ? "h-6 mx-1" : "w-full my-1", isSheet && "my-1")} />}
        </React.Fragment>
      ))}
    </TabsList>
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between h-16 px-4 md:px-6 border-b shrink-0">
        <div className="flex items-center gap-2 font-semibold">
          <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden mr-2">
                <MenuIcon className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-2">
              {renderNav(true)}
            </SheetContent>
          </Sheet>
          <Logo className="h-6 w-6" />
          <span className="text-lg font-bold truncate max-w-[150px] sm:max-w-xs">{initialVenueName}</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {customerOrders.length > 0 && (
            <Button
              variant="secondary"
              className="relative bg-orange-500 hover:bg-orange-600 text-white animate-pulse"
              onClick={() => setIsIncomingOrderDialogOpen(true)}
            >
              <BellDot className="mr-2 h-5 w-5" />
              {t('Incoming Orders')}
              <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold">
                {customerOrders.length}
              </span>
            </Button>
          )}
          <ThemeToggle />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleNavPosition} className='hidden md:inline-flex rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground items-center gap-2'>
                  {navPosition === 'top' ? <PanelLeft className="h-5 w-5" /> : <PanelTop className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('Change Nav Position')}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setIsHelpOpen(true)}>
                  <HelpCircle />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('Help')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="text-sm text-foreground text-center font-semibold bg-muted p-2 rounded-lg shadow-inner">
            <div className="hidden sm:block">{formattedDate}</div>
            <div>{formattedTime}</div>
          </div>
        </div>
      </header>
      <DndProvider backend={HTML5Backend}>
        <Tabs value={activeTab} onValueChange={handleTabChange} orientation={navPosition === 'left' ? 'vertical' : 'horizontal'} className={cn("h-full", navPosition === 'top' ? 'flex flex-col' : 'flex')}>
          <div className={cn("hidden md:flex justify-center border-b kitchen-tabs", navPosition === 'left' && "flex-col justify-start items-start border-b-0 border-r")}>
            {renderNav()}
          </div>

          <main ref={mainRef} className="flex-grow overflow-auto focus:outline-none" tabIndex={-1}>
            <TabsContent value="pos" className="m-0 p-0 h-full">
              <PosSystem
                venueName={initialVenueName}
                tables={tables}
                orders={orders}
                setOrders={setOrders}
                updateTableStatus={updateTableStatus}
                occupancyCount={occupancyCount}
                activeOrder={activeOrder}
                setActiveOrder={setActiveOrder}
                orderItems={currentOrderItems}
                setOrderItems={setCurrentOrderItems}
                discount={discount}
                setDiscount={setDiscount}
                selectedTableId={selectedTableId}
                setSelectedTableId={handleSelectTable}
                clearCurrentOrder={clearCurrentOrder}
                onOrderCreated={onOrderCreated}
                showOccupancy={showOccupancy}
                pendingOrders={pendingOrders}
                setPendingOrders={setPendingOrders}
                categoryColors={categoryColors}
                setCategoryColors={setCategoryColors}
                onViewTableDetails={handleViewTableDetails}
                onEditOrder={handleEditOrderFromShortcut}
                keyboardMode={keyboardMode}
                setKeyboardMode={setKeyboardMode}
                billHistory={initialBills}
                setBillHistory={setBills}
                kotPreference={initialKotPreference}
                selectedOrderType={selectedOrderType}
                setSelectedOrderType={setSelectedOrderType}
                showTableDetailsOnPOS={showTableDetailsOnPOS}
                showReservationTimeOnPOS={showReservationTimeOnPOS}
                inventory={initialInventory}
                setInventory={setInventory}
                menu={initialMenu}
                setMenu={setMenu}
                onNavigate={handleTabChange}
                customers={initialCustomers}
                setCustomers={setCustomers}
                currency={initialCurrency}
              />
            </TabsContent>
            <TabsContent value="tables" className="m-0 p-0 h-full">
              <TableManagement
                tables={tables}
                orders={orders}
                billHistory={initialBills}
                updateTableStatus={updateTableStatus}
                updateTableDetails={updateTableDetails}
                addTable={addTable}
                removeLastTable={removeLastTable}
                occupancyCount={occupancyCount}
                onEditOrder={(order) => {
                  setSelectedTableId(order.tableId ?? null);
                  setActiveOrder(order);
                  setCurrentOrderItems(order.items);
                  setDiscount(0);
                  setActiveTab('pos');
                }}
                onCreateOrder={handleCreateOrderFromTables}
                onAcceptCustomerOrder={handleAcceptCustomerOrder}
                showOccupancy={showOccupancy}
                setShowOccupancy={setShowOccupancy}
                initialSelectedTableId={initialTableForManagement}
                showTableDetailsOnPOS={showTableDetailsOnPOS}
                setShowTableDetailsOnPOS={setShowTableDetailsOnPOS}
                showReservationTimeOnPOS={showReservationTimeOnPOS}
                setShowReservationTimeOnPOS={setShowReservationTimeOnPOS}
                customerOrders={customerOrders}
                onOrderCreated={onOrderCreated}
                customers={initialCustomers}
                setCustomers={setCustomers}
                currency={initialCurrency}
              />
            </TabsContent>
            <TabsContent value="kitchen" className="m-0 p-0 h-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                <div className="h-full border-b lg:border-b-0 lg:border-r">
                  <KitchenOrders orders={orders} setOrders={setOrders} />
                </div>
                <div className="h-full">
                  <InventoryManagement
                    inventory={initialInventory}
                    setInventory={setInventory}
                    menu={initialMenu}
                    setMenu={setMenu}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="customers" className="m-0 p-0 h-full">
              <CustomerManagement
                billHistory={initialBills}
                tables={tables}
                customers={initialCustomers}
                setCustomers={setCustomers}
                pendingBills={initialPendingBills}
                eventBookings={initialEventBookings}
                setEventBookings={setEventBookings}
                currency={initialCurrency}
              />
            </TabsContent>
            <TabsContent value="expenses" className="m-0 p-0 h-full">
              <ExpensesTracker
                expenses={initialExpenses}
                setExpenses={setExpenses}
                vendors={initialVendors}
                setVendors={setVendors}
                pendingBills={initialPendingBills}
                setPendingBills={setPendingBills}
                customers={initialCustomers}
                customerCreditLimit={customerCreditLimit}
                vendorCreditLimit={vendorCreditLimit}
                currency={initialCurrency}
              />
            </TabsContent>
            <TabsContent value="staff" className="m-0 p-0 h-full">
              <StaffManagement
                employees={initialEmployees}
                setEmployees={setEmployees}
                advances={initialAdvances}
                setAdvances={setAdvances}
                attendance={initialAttendance}
                setAttendance={setAttendance}
                currency={initialCurrency}
              />
            </TabsContent>
            <TabsContent value="admin" className="m-0 p-0 h-full">
              <AdminDashboard
                billHistory={initialBills}
                employees={initialEmployees}
                setEmployees={setEmployees}
                expenses={initialExpenses}
                inventory={initialInventory}
                setInventory={setInventory}
                customerCreditLimit={customerCreditLimit}
                setCustomerCreditLimit={setCustomerCreditLimit}
                vendorCreditLimit={vendorCreditLimit}
                setVendorCreditLimit={setVendorCreditLimit}
                onRerunSetup={() => setShowSetupWizard(true)}
                kotPreference={initialKotPreference}
                setKotPreference={setKotPreference}
                menu={initialMenu}
                venueName={initialVenueName}
                setVenueName={setVenueName}
                currency={initialCurrency}
                setCurrency={setCurrency}
              />
            </TabsContent>
          </main>
        </Tabs>
      </DndProvider>
      <HelpDialog isOpen={isHelpOpen} onOpenChange={setIsHelpOpen} />
      <IncomingOrdersDialog
        isOpen={isIncomingOrderDialogOpen}
        onOpenChange={setIsIncomingOrderDialogOpen}
        customerOrders={customerOrders}
        onAccept={handleAcceptCustomerOrder}
      />
    </div>
  );
}
