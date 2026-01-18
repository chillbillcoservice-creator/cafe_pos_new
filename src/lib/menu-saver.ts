
'use client';
import type { MenuCategory, InventoryItem } from './types';

export function saveMenu(payload: { menu: MenuCategory[], inventory: InventoryItem[] }) {
  try {
    localStorage.setItem('menu', JSON.stringify(payload.menu));
    localStorage.setItem('inventory', JSON.stringify(payload.inventory));
  } catch (error) {
    console.error("Failed to save menu/inventory to localStorage", error);
    // Optionally show a toast to the user
  }
}
