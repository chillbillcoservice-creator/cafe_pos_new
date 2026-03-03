
'use client';
// aria-label placeholder

import type { MenuCategory, InventoryItem, Employee, Bill, Expense, Customer, Vendor, PendingBill, KOTPreference, Attendance, Advance, EventBooking, VenueDetails, OwnerDetails, SetupData, PurchaseOrder, DraftItem, AdminRequest } from "@/lib/types";
import MainLayout from "./main-layout";
import SetupWizard from "./setup-wizard";
import LoginScreen from "./login-screen";
import OwnerAuthScreen from "./owner-auth-screen";
import AccessDeniedScreen from "./access-denied-screen";
import { useState, useEffect } from "react";
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { LanguageProvider } from "@/contexts/language-context";
import { buildUsername } from "@/lib/generate-username";
import { saveVenueSetup } from "@/lib/db";

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


const useLocalStorageState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
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

  const setWithLocalStorage: React.Dispatch<React.SetStateAction<T>> = (value) => {
    setState((prevState) => {
      const newValue = value instanceof Function ? (value as (prev: T) => T)(prevState) : value;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(key, JSON.stringify(newValue));
        } catch (error) {
          console.error(`Error saving "${key}" to localStorage`, error);
        }
      }
      return newValue;
    });
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
  const [purchaseOrders, setPurchaseOrders] = useLocalStorageState<PurchaseOrder[]>('purchaseOrders', []);
  const [draftItems, setDraftItems] = useLocalStorageState<DraftItem[]>('draftItems', []);
  const [adminRequests, setAdminRequests] = useLocalStorageState<AdminRequest[]>('adminRequests', []);
  const [unlockedItems, setUnlockedItems] = useLocalStorageState<string[]>('unlockedItems', []);

  // New state for currency and setup status
  const [currency, setCurrency] = useLocalStorageState<string>('currency', 'Rs.');
  const [language, setLanguage] = useLocalStorageState<string>('language', 'en');
  const [venueId, setVenueId] = useLocalStorageState<string | null>('venueId', null);
  // ownerUser: the Google-authenticated venue owner. null = not yet authenticated.
  const [ownerUser, setOwnerUser] = useState<User | null>(null);
  // isNewOwner: true means Setup Wizard needs to run for first time
  const [isNewOwner, setIsNewOwner] = useState<boolean | null>(null);
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(
    (!!initialVenueName && initialVenueName !== 'My Restaurant') ||
    (initialEmployees && initialEmployees.length > 0)
  );
  const [venueDetails, setVenueDetails] = useLocalStorageState<VenueDetails | null>('venueDetails', null);
  const [ownerDetails, setOwnerDetails] = useLocalStorageState<OwnerDetails | null>('ownerDetails', null);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  // deniedEmail: set when a Google user signs in but is NOT on the whitelist
  const [deniedEmail, setDeniedEmail] = useState<string | null>(null);
  // isLoadingVenue: true while fetching the returning-owner's venue from Firestore
  const [isLoadingVenue, setIsLoadingVenue] = useState(false);

  // Sync Currency from Firestore on mount — this silently fails before login (expected behavior).
  useEffect(() => {
    if (!db) return;
    const fetchSettings = async () => {
      try {
        const docRef = await getDoc(doc(db, "settings", "venue"));
        if (docRef.exists()) {
          const data = docRef.data();
          if (data.currency) {
            const syncedCurrency = data.currency === '₹' ? 'Rs.' : data.currency;
            setCurrency(syncedCurrency);
          }
          if (data.language) {
            setLanguage(data.language);
          }
        }
      } catch {
        // Expected: Firestore rules block this until user authenticates. Silent fail.
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
    setLanguage(data.language);

    // Create initial employees with auto-generated usernames
    if (data.employees && data.employees.length > 0) {
      const newEmployees: Employee[] = data.employees.map((emp, index) => {
        const loginCode = emp.loginCode || String(Math.floor(1000 + Math.random() * 9000));
        const username = emp.username || buildUsername(data.venue.name, emp.name || 'Unknown', loginCode);
        return {
          id: `EMP${String(index + 1).padStart(3, '0')}`,
          name: emp.name || 'Unknown',
          role: emp.role || 'Staff',
          salary: emp.salary || 0,
          color: emp.color || '#3b82f6',
          mobile: emp.mobile || '',
          govtId: emp.govtId || '',
          email: emp.email || '',
          allowedTabs: emp.allowedTabs,
          password: emp.password || '',
          username,
          loginCode,
        };
      });
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('setupComplete', 'true');
    }

    // Sync to Firestore using the owner's UID so the venue is permanently linked to their Google account
    saveVenueSetup(data, ownerUser?.uid).then((vId) => {
      setVenueId(vId);
      setIsNewOwner(false); // Make sure we exit the SetupWizard
      console.log('Successfully saved venue to Firestore with ID:', vId);
    }).catch(err => {
      console.error("Failed to save venue setup to Firestore:", err);
    });
  };



  // Step 1.5: Access denied — email not on whitelist
  if (deniedEmail) {
    return <AccessDeniedScreen email={deniedEmail} onSignOut={() => setDeniedEmail(null)} />;
  }

  // Step 1.6: Loading venue data for returning owner
  if (isLoadingVenue) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center flex-col gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
        <p className="text-white/40 text-sm">Loading your venue&hellip;</p>
      </div>
    );
  }

  // Step 2: Not yet authenticated — unified Login/Signup page handles both owner and staff
  if (!ownerUser && !currentEmployee) {
    return (
      <LanguageProvider key={language} initialLanguage={language}>
        <LoginScreen
          employees={employees}
          venueName={venueName}
          venueId={venueId || undefined}
          onLogin={(emp) => setCurrentEmployee(emp)}
          onAccessDenied={(email) => setDeniedEmail(email)}
          onOwnerLogin={async (uid) => {
            // Returning owner — fetch their venue from Firestore
            setIsLoadingVenue(true);
            try {
              const { fetchVenue, fetchEmployees } = await import("@/lib/db");
              const [venueData, firestoreEmployees] = await Promise.all([
                fetchVenue(uid),
                fetchEmployees(uid),
              ]);
              if (venueData) {
                setVenueName(venueData.name || venueName);
                if (venueData.currency) setCurrency(venueData.currency === '₹' ? 'Rs.' : venueData.currency);
                if (venueData.language) setLanguage(venueData.language);
              }
              if (firestoreEmployees.length > 0) setEmployees(firestoreEmployees);
              setOwnerUser({ uid } as any);
              setVenueId(uid);
              setIsSetupComplete(true);
            } catch (e) {
              console.error("Failed to load venue:", e);
              // Fallback: still enter POS with local data
              setOwnerUser({ uid } as any);
              setVenueId(uid);
              setIsSetupComplete(true);
            } finally {
              setIsLoadingVenue(false);
            }
          }}
          onOwnerSignup={(uid) => {
            // New owner — route to setup wizard
            setOwnerUser({ uid } as any);
            setVenueId(uid);
            setIsNewOwner(true);
          }}
        />
      </LanguageProvider>
    );
  }

  // Step 3: New owner needs to complete Setup Wizard
  if (isNewOwner === true) {
    return (
      <LanguageProvider key={language} initialLanguage={language}>
        <SetupWizard onComplete={handleSetupComplete} initialData={{ currency, language, venue: venueDetails || { name: venueName || '', address: '', contactNumber: '', email: '', tagline: '' } }} />
      </LanguageProvider>
    );
  }

  // Step 4: Employee login (shared POS tablet)
  if (!currentEmployee) {
    return (
      <LanguageProvider key={language} initialLanguage={language}>
        <LoginScreen
          employees={employees}
          venueName={venueName}
          venueId={venueId || undefined}
          isPosMode={true}
          onLogin={(emp) => setCurrentEmployee(emp)}
        />
      </LanguageProvider>
    );
  }

  // Step 4: Main POS
  return (
    <LanguageProvider key={language} initialLanguage={language}>
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
        initialCurrency={currency || 'Rs.'}
        initialPurchaseOrders={purchaseOrders}
        initialDraftItems={draftItems}
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
        setCurrency={setCurrency}
        setLanguage={setLanguage}
        initialLanguage={language}
        venueDetails={venueDetails}
        ownerDetails={ownerDetails}
        setPurchaseOrders={setPurchaseOrders}
        setDraftItems={setDraftItems}
        adminRequests={adminRequests}
        setAdminRequests={setAdminRequests}
        unlockedItems={unlockedItems}
        setUnlockedItems={setUnlockedItems}
        initialUser={currentEmployee}
      />
    </LanguageProvider>
  );
}
