
'use client';

import type { MenuCategory, InventoryItem, Employee, Bill, Expense, Customer, Vendor, PendingBill, KOTPreference, Attendance, Advance, EventBooking, VenueDetails, OwnerDetails, SetupData } from "@/lib/types";
import MainLayout from "./main-layout";
import SetupWizard from "./setup-wizard";
import { useState, useEffect } from "react";
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AppEntryProps {
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
}


const useLocalStorageState = <T,>(key: string, defaultValue: T): [T, (value: T) => void] => {
  const [state, setState] = useState<T>(defaultValue);

  useEffect(() => {
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue && storedValue !== 'undefined') {
        setState(JSON.parse(storedValue, (k, v) => {
          if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(v)) {
            return new Date(v);
          }
          return v;
        }));
      }
    } catch (error) {
      console.error(`Error loading "${key}" from localStorage`, error);
    }
  }, [key]);

  const setWithLocalStorage = (newValue: T) => {
    setState(newValue);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.error(`Error saving "${key}" to localStorage`, error);
      }
    }
  };

  return [state, setWithLocalStorage];
};


export default function AppEntry({
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
  initialAdvances
}: AppEntryProps) {
  const db = useFirestore();

  const [menu, setMenu] = useLocalStorageState<MenuCategory[]>('menu', initialMenu);
  const [inventory, setInventory] = useLocalStorageState<InventoryItem[]>('inventory', initialInventory);
  const [employees, setEmployees] = useLocalStorageState<Employee[]>('employees', initialEmployees);
  const [bills, setBills] = useLocalStorageState<Bill[]>('bills', initialBills);
  const [expenses, setExpenses] = useLocalStorageState<Expense[]>('expenses', initialExpenses);
  const [customers, setCustomers] = useLocalStorageState<Customer[]>('customers', initialCustomers);
  const [vendors, setVendors] = useLocalStorageState<Vendor[]>('vendors', initialVendors);
  const [pendingBills, setPendingBills] = useLocalStorageState<PendingBill[]>('pendingBills', initialPendingBills);
  const [venueName, setVenueName] = useLocalStorageState<string>('venueName', initialVenueName);
  const [kotPreference, setKotPreference] = useLocalStorageState<KOTPreference>('kotPreference', initialKotPreference);
  const [attendance, setAttendance] = useLocalStorageState<Attendance[]>('attendance', initialAttendance);
  const [advances, setAdvances] = useLocalStorageState<Advance[]>('advances', initialAdvances);
  const [eventBookings, setEventBookings] = useLocalStorageState<EventBooking[]>('eventBookings', []);

  // New state for currency and setup status
  const [currency, setCurrency] = useLocalStorageState<string>('currency', 'Rs.');
  const [isSetupComplete, setIsSetupComplete] = useLocalStorageState<boolean>('isSetupComplete', false);
  const [venueDetails, setVenueDetails] = useLocalStorageState<VenueDetails | null>('venueDetails', null);
  const [ownerDetails, setOwnerDetails] = useLocalStorageState<OwnerDetails | null>('ownerDetails', null);

  // Sync Currency from Firestore on mount to ensure consistency with Customer View
  useEffect(() => {
    if (!db) return;
    const fetchSettings = async () => {
      try {
        const docRef = await getDoc(doc(db, "settings", "venue"));
        if (docRef.exists()) {
          const data = docRef.data();
          if (data.currency) {
            // Migration: treat '₹' as 'Rs.'
            const syncedCurrency = data.currency === '₹' ? 'Rs.' : data.currency;
            setCurrency(syncedCurrency);
          }
        }
      } catch (e) {
        console.error("Error fetching settings from Firestore:", e);
      }
    };
    fetchSettings();
  }, [db]);

  // Check if it's the very first run (no venue name stored vs initial prop)
  // We can rely on isSetupComplete. If false, show wizard.

  const handleSetupComplete = (data: SetupData) => {
    setVenueName(data.venue.name);
    setVenueDetails(data.venue);
    setOwnerDetails(data.owner);
    setCurrency(data.currency);

    // Create initial employees
    if (data.employees && data.employees.length > 0) {
      const newEmployees: Employee[] = data.employees.map((emp, index) => ({
        id: `EMP${String(index + 1).padStart(3, '0')}`,
        name: emp.name || 'Unknown',
        role: emp.role || 'Staff',
        salary: emp.salary || 0,
        color: emp.color || '#3b82f6',
        mobile: emp.mobile || '',
        govtId: emp.govtId || '',
        email: emp.email || ''
      }));
      setEmployees([...employees, ...newEmployees]);
    }

    // Create initial vendors
    if (data.vendors && data.vendors.length > 0) {
      const newVendors: Vendor[] = data.vendors.map((v, index) => ({
        id: `VND${String(index + 1).padStart(3, '0')}`,
        name: v.name || 'Unknown',
        category: 'General', // Default category as it's not captured yet or use v.category
        phone: v.phone || '',
        email: v.email || ''
      }));
      setVendors([...vendors, ...newVendors]);
    }

    setIsSetupComplete(true);
    // Also set the key that MainLayout might be checking in a separate effects, 
    // though AppEntry controls the view, this prevents double-wizard issues if MainLayout logic runs.
    if (typeof window !== 'undefined') {
      localStorage.setItem('setupComplete', 'true');
    }
  };

  if (!isSetupComplete) {
    return <SetupWizard onComplete={handleSetupComplete} initialData={{ currency, venue: venueDetails || { name: venueName || '', address: '', contactNumber: '', email: '', tagline: '' } }} />;
  }

  return (
    <MainLayout
      initialMenu={menu}
      initialInventory={inventory}
      initialEmployees={employees}
      initialBills={bills}
      initialExpenses={expenses}
      initialCustomers={customers}
      initialVendors={vendors}
      initialPendingBills={pendingBills}
      initialVenueName={venueName}
      initialKotPreference={kotPreference}
      initialAttendance={attendance}
      initialAdvances={advances}
      initialEventBookings={eventBookings}
      initialCurrency={currency}
      setMenu={setMenu}
      setInventory={setInventory}
      setEmployees={setEmployees}
      setBills={setBills}
      setExpenses={setExpenses}
      setCustomers={setCustomers}
      setVendors={setVendors}
      setPendingBills={setPendingBills}
      setAttendance={setAttendance}
      setAdvances={setAdvances}
      setVenueName={setVenueName}
      setKotPreference={setKotPreference}
      setEventBookings={setEventBookings}
      setCurrency={setCurrency} // Pass setter
      venueDetails={venueDetails}
      ownerDetails={ownerDetails}
    />
  );
}
