
'use client';
import { useEffect, useState } from 'react';
import AppEntry from '@/components/app-entry';
import { seedData } from '@/lib/seed-data';
import type { MenuCategory, InventoryItem, Employee, Bill, Expense, Customer, Vendor, PendingBill, KOTPreference, Attendance, Advance } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue && storedValue !== 'undefined') {
      return JSON.parse(storedValue, (k, v) => {
        // Handle date revival
        if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(v)) {
          return new Date(v);
        }
        return v;
      });
    }
  } catch (error) {
    console.error(`Error loading "${key}" from localStorage`, error);
  }
  return defaultValue;
};


export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState<{
    menu: MenuCategory[],
    inventory: InventoryItem[],
    employees: Employee[],
    bills: Bill[],
    expenses: Expense[],
    customers: Customer[],
    vendors: Vendor[],
    pendingBills: PendingBill[],
    venueName: string,
    kotPreference: KOTPreference,
    attendance: Attendance[],
    advances: Advance[],
  } | null>(null);

  useEffect(() => {
    // This effect runs only on the client
    const seededMenu = seedData();

    const data = {
        menu: loadFromLocalStorage('menu', seededMenu),
        inventory: loadFromLocalStorage('inventory', [
            { "id": "1", "name": "Pizza Base", "stock": 100, "capacity": 200, "unit": "unit", "category": "Bakery" },
            { "id": "2", "name": "Pasta", "stock": 50, "capacity": 100, "unit": "kg", "category": "Grains" },
            { "id": "3", "name": "Cheese", "stock": 20, "capacity": 50, "unit": "kg", "category": "Dairy" },
            { "id": "4", "name": "Coffee Beans", "stock": 30, "capacity": 50, "unit": "kg", "category": "Beverages" }
        ]),
        employees: loadFromLocalStorage('employees', []),
        bills: loadFromLocalStorage('bills', []),
        expenses: loadFromLocalStorage('expenses', []),
        customers: loadFromLocalStorage('customers', []),
        vendors: loadFromLocalStorage('vendors', []),
        pendingBills: loadFromLocalStorage('pendingBills', []),
        venueName: loadFromLocalStorage('venueName', "My Restaurant"),
        kotPreference: loadFromLocalStorage('kotPreference', { type: 'separate' }),
        attendance: loadFromLocalStorage('attendance', []),
        advances: loadFromLocalStorage('advances', []),
    }
    
    setInitialData(data);
    setIsLoading(false);
  }, []);

  if (isLoading || !initialData) {
    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <div className="w-full max-w-md p-8 space-y-4">
                <Skeleton className="h-12 w-full" />
                <div className="flex gap-4">
                    <Skeleton className="h-64 w-1/3" />
                    <div className="flex-grow space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                </div>
                 <Skeleton className="h-24 w-full" />
            </div>
        </div>
    );
  }

  return (
    <AppEntry 
      initialMenu={initialData.menu}
      initialInventory={initialData.inventory}
      initialEmployees={initialData.employees}
      initialBills={initialData.bills}
      initialExpenses={initialData.expenses}
      initialCustomers={initialData.customers}
      initialVendors={initialData.vendors}
      initialPendingBills={initialData.pendingBills}
      initialVenueName={initialData.venueName}
      initialKotPreference={initialData.kotPreference}
      initialAttendance={initialData.attendance || []}
      initialAdvances={initialData.advances || []}
    />
  );
}
