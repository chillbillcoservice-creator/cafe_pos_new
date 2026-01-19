
"use client";

import * as React from 'react';
import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import { useToast } from '@/hooks/use-toast';
import type { MenuCategory, MenuItem, MenuItemHistory, IngredientItem, InventoryItem, MenuSubCategory } from '@/lib/types';
import { PlusCircle, Trash2, Edit, History, FilePlus, Upload, Camera, Loader2, Wand2, Check, X } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { format } from 'date-fns';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { doc, writeBatch } from 'firebase/firestore';
import { ScrollArea } from './ui/scroll-area';
import { scanMenu, type ScanMenuOutput } from '@/ai/flows/scan-menu-flow';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { useLanguage } from '@/contexts/language-context';


interface EditIngredientsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  menuItem: MenuItem;
  inventory: InventoryItem[];
  onSave: (itemName: string, newIngredients: IngredientItem[]) => void;
}

function EditIngredientsDialog({ isOpen, onOpenChange, menuItem, inventory, onSave }: EditIngredientsDialogProps) {
  const { t } = useLanguage();
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState<IngredientItem['unit']>('g');

  useEffect(() => {
    if (isOpen) {
      setIngredients(menuItem.ingredients || []);
      setSelectedIngredient('');
      setQuantity('');
      setUnit('g');
    }
  }, [isOpen, menuItem]);

  useEffect(() => {
    if (selectedIngredient) {
      const inventoryItem = inventory.find(i => i.id === selectedIngredient);
      if (inventoryItem) {
        if (inventoryItem.unit === 'kg') setUnit('g');
        else if (inventoryItem.unit === 'ltr') setUnit('ml');
        else if (inventoryItem.unit === 'unit') setUnit('pcs');
      }
    }
  }, [selectedIngredient, inventory]);

  const handleAddIngredient = () => {
    if (!selectedIngredient || !quantity) {
      alert(t("Please select an ingredient and enter a quantity."));
      return;
    }
    const newIngredient: IngredientItem = {
      inventoryItemId: selectedIngredient,
      quantity: parseFloat(quantity),
      unit: unit,
    };
    setIngredients([...ingredients, newIngredient]);
    setSelectedIngredient('');
    setQuantity('');
  };

  const handleRemoveIngredient = (inventoryItemId: string, unit: string) => {
    setIngredients(ingredients.filter(ing => !(ing.inventoryItemId === inventoryItemId && ing.unit === unit)));
  };

  const handleSaveIngredients = () => {
    onSave(menuItem.name, ingredients);
    onOpenChange(false);
  }

  const recipeUnits: IngredientItem['unit'][] = ['g', 'ml', 'pcs', 'kg', 'ltr'];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('Edit Ingredients for')} "{menuItem.name}"</DialogTitle>
          <DialogDescription className="italic text-primary">
            {t('Defining ingredients helps you track inventory and know the status of your stock.')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <h4 className="font-semibold mb-2">{t('Current Ingredients')}</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto border p-2 rounded-md">
              {ingredients.length > 0 ? ingredients.map((ingredient, index) => {
                const inventoryItem = inventory.find(i => i.id === ingredient.inventoryItemId);
                return (
                  <div key={`${ingredient.inventoryItemId}-${index}`} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                    <div>
                      <span className="font-medium">{inventoryItem?.name || 'Unknown Item'}</span>
                      <span className="text-sm text-muted-foreground ml-2">({ingredient.quantity} {ingredient.unit})</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveIngredient(ingredient.inventoryItemId, ingredient.unit)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              }) : (
                <p className="text-sm text-muted-foreground text-center p-4">{t('No ingredients in this recipe yet.')}</p>
              )}
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold mb-2">{t('Add New Ingredient')}</h4>
            <div className="flex items-end gap-2">
              <div className="flex-grow space-y-1">
                <Label htmlFor="ingredient-select">{t('Ingredient')}</Label>
                <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
                  <SelectTrigger id="ingredient-select">
                    <SelectValue placeholder={t('Select from inventory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {inventory.map(invItem => (
                      <SelectItem key={invItem.id} value={invItem.id}>{invItem.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ingredient-quantity">{t('Quantity')}</Label>
                <Input
                  id="ingredient-quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g., 50"
                  className="w-24"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ingredient-unit">{t('Unit')}</Label>
                <Select value={unit} onValueChange={(value) => setUnit(value as IngredientItem['unit'])}>
                  <SelectTrigger id="ingredient-unit" className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {recipeUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddIngredient}><PlusCircle className="mr-2 h-4 w-4" />{t('Add')}</Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Skip for Now')}</Button>
          <Button onClick={handleSaveIngredients}>{t('Save Ingredients')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


interface EditItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem;
  onSave: (oldName: string, newItem: MenuItem) => void;
  currency?: string;
}

function EditItemDialog({ isOpen, onOpenChange, item, onSave, currency = 'Rs.' }: EditItemDialogProps) {
  const { t } = useLanguage();
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(String(item.price));
  const [isVeg, setIsVeg] = useState(item.isVeg || false);

  useEffect(() => {
    setName(item.name);
    setPrice(String(item.price));
    setIsVeg(item.isVeg || false);
  }, [item]);

  const handleSave = () => {
    if (name && price) {
      const historyEntry: MenuItemHistory = {
        name: item.name,
        price: item.price,
        changedAt: new Date(),
      };

      const updatedItem: MenuItem = {
        ...item,
        name,
        price: parseFloat(price),
        isVeg,
        history: [...(item.history || []), historyEntry],
      };

      onSave(item.name, updatedItem);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Edit Item')}</DialogTitle>
          <DialogDescription>
            {t('Update the details for')} "{item.name}".
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-item-name">{t('Item Name')}</Label>
            <Input id="edit-item-name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-item-price">{t('Price')}</Label>
            <Input id="edit-item-price" type="number" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="edit-item-veg" checked={isVeg} onCheckedChange={(checked) => setIsVeg(checked === true)} />
            <Label htmlFor="edit-item-veg" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
              {t('Vegetarian')}
              <div className={cn("h-2 w-2 rounded-full", isVeg ? "bg-green-600" : "bg-red-600")} />
            </Label>
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2"><History className="h-4 w-4" /> {t('Change History')}</h4>
          {item.history && item.history.length > 0 ? (
            <div className="max-h-40 overflow-y-auto space-y-2 text-sm text-muted-foreground pr-2">
              {item.history.slice().reverse().map((record, index) => (
                <div key={index} className="p-2 bg-muted/50 rounded-md">
                  <p><strong>Name:</strong> {record.name}, <strong>Price:</strong> {currency}{record.price}</p>
                  <p className="text-xs">{format(new Date(record.changedAt), "PPP p")}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('No previous edits recorded.')}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
          <Button onClick={handleSave}>{t('Save Changes')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


interface ManageMenuDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  menu: MenuCategory[];
  setMenu: (menu: MenuCategory[]) => void;
  inventory: InventoryItem[];
  setInventory: (inventory: InventoryItem[]) => void;
  categoryColors: Record<string, string>;
  setCategoryColors: (colors: Record<string, string>) => void;
  currency?: string;
}

const slugify = (text: string) => {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

const colorNames = ['amber', 'lime', 'rose', 'violet', 'cyan', 'pink', 'fuchsia', 'purple', 'indigo', 'green', 'yellow', 'emerald', 'teal', 'sky', 'blue', 'orange'];


export function ManageMenuDialog({
  isOpen,
  onOpenChange,
  menu,
  setMenu,
  inventory,
  setInventory,
  categoryColors,
  setCategoryColors,
  currency = 'Rs.',
}: ManageMenuDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  const [parentCategoryForSub, setParentCategoryForSub] = useState('');

  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [selectedCategoryForItem, setSelectedCategoryForItem] = useState('');
  const [editMenuSearch, setEditMenuSearch] = useState('');
  const [editingItem, setEditingItem] = useState<{ categoryName: string; item: MenuItem } | null>(null);
  const [editingIngredients, setEditingIngredients] = useState<MenuItem | null>(null);
  const [newItemIsVeg, setNewItemIsVeg] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [scannedMenu, setScannedMenu] = useState<ScanMenuOutput | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraViewOpen, setIsCameraViewOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);


  useEffect(() => {
    let stream: MediaStream | null = null;
    const getCameraPermission = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };

    if (isCameraViewOpen) {
      getCameraPermission();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraViewOpen, toast]);

  const processDataUri = async (dataUri: string) => {
    setIsScanning(true);
    setScannedMenu(null);
    toast({
      title: 'Scanning Menu...',
      description: 'The AI is analyzing your menu. This might take a moment.',
    });
    try {
      const result = await scanMenu({ photoDataUri: dataUri });
      if (result && result.menu) {
        setScannedMenu(result);
        toast({
          title: 'Scan Complete!',
          description: 'Review the scanned items below and add them to your menu.',
        });
      } else {
        throw new Error("AI could not process the menu image.");
      }
    } catch (error) {
      console.error("Menu scanning failed:", error);
      toast({
        variant: 'destructive',
        title: t('Scan Failed'),
        description: t('Could not read the menu from the image. Please try again.'),
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUri = e.target?.result as string;
      await processDataUri(dataUri);
    };
    reader.readAsDataURL(file);
    if (event.target) event.target.value = '';
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/jpeg');
      setIsCameraViewOpen(false);
      processDataUri(dataUri);
    }
  };


  const handleAddCategory = () => {
    if (!newCategoryName) {
      toast({ variant: 'destructive', title: t('Category name is required') });
      return;
    }
    const categorySlug = slugify(newCategoryName);
    if (menu.some(cat => cat.id === categorySlug)) {
      toast({ variant: 'destructive', title: t('Category already exists') });
      return;
    }
    const newMenu = [...menu, { id: categorySlug, name: newCategoryName, items: [], subcategories: [] }];

    const usedColors = Object.values(categoryColors);
    const availableColors = colorNames.filter(c => !usedColors.includes(c));
    const newColor = availableColors.length > 0 ? availableColors[0] : colorNames[menu.length % colorNames.length];
    setCategoryColors({ ...categoryColors, [newCategoryName]: newColor });

    setMenu(newMenu);
    setNewCategoryName('');
    toast({ title: `Category "${newCategoryName}" added.` });
  };

  const handleAddSubCategory = () => {
    if (!newSubCategoryName || !parentCategoryForSub) {
      toast({ variant: 'destructive', title: t('Both fields are required') });
      return;
    }

    const newMenu = [...menu];
    const parentCatIndex = newMenu.findIndex(c => c.name === parentCategoryForSub);
    if (parentCatIndex === -1) return;

    const parentCat = newMenu[parentCatIndex];
    if (parentCat.subcategories?.some(sc => sc.name.toLowerCase() === newSubCategoryName.toLowerCase())) {
      toast({ variant: 'destructive', title: 'Sub-category already exists in this category.' });
      return;
    }

    const newSubCategory: MenuSubCategory = { name: newSubCategoryName, items: [] };
    parentCat.subcategories = [...(parentCat.subcategories || []), newSubCategory];
    newMenu[parentCatIndex] = parentCat;

    setMenu(newMenu);
    setNewSubCategoryName('');
    setParentCategoryForSub('');
    toast({ title: `Sub-category "${newSubCategoryName}" added under "${parentCategoryForSub}".` });
  };

  const handleAddItem = () => {
    if (!newItemName || !newItemPrice || !selectedCategoryForItem) {
      toast({ variant: 'destructive', title: t('All fields are required') });
      return;
    }

    const [catName, subCatName] = selectedCategoryForItem.split(' > ');
    let newMenu = [...menu];
    const categoryIndex = newMenu.findIndex(cat => cat.name === catName);
    if (categoryIndex === -1) return;

    const allItems = newMenu.flatMap(c => {
      const mainItems = c.items;
      const subItems = (c.subcategories || []).flatMap(sc => sc.items);
      return [...mainItems, ...subItems];
    });

    if (allItems.some(item => item.name.toLowerCase() === newItemName.toLowerCase())) {
      toast({ variant: 'destructive', title: 'An item with this name already exists in the menu.' });
      return;
    }

    const maxCode = allItems.reduce((max, item) => {
      const codeNum = parseInt(item.code, 10);
      return !isNaN(codeNum) && codeNum > max ? codeNum : max;
    }, 0);
    const newCode = (maxCode + 1).toString().padStart(2, '0');

    const newItem: MenuItem = {
      name: newItemName,
      price: parseFloat(newItemPrice),
      code: newCode,
      isVeg: newItemIsVeg,
      history: [],
      ingredients: []
    };

    if (subCatName) {
      const subCatIndex = newMenu[categoryIndex].subcategories?.findIndex(sc => sc.name === subCatName);
      if (subCatIndex !== undefined && subCatIndex !== -1 && newMenu[categoryIndex].subcategories) {
        newMenu[categoryIndex].subcategories![subCatIndex].items.push(newItem);
      }
    } else {
      newMenu[categoryIndex].items.push(newItem);
    }

    setMenu(newMenu);
    setEditingIngredients(newItem);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemIsVeg(false);
    toast({ title: `Item "${newItemName}" added.` });
  };

  const handleEditItem = (oldName: string, newItem: MenuItem) => {
    if (!editingItem) return;

    let found = false;
    const newMenu = menu.map(cat => {
      if (found) return cat;

      const items = cat.items.map(item => {
        if (item.name === oldName) {
          found = true;
          return newItem;
        }
        return item;
      });

      const subcategories = cat.subcategories?.map(subCat => {
        if (found) return subCat;
        const subItems = subCat.items.map(item => {
          if (item.name === oldName) {
            found = true;
            return newItem;
          }
          return item;
        });
        return { ...subCat, items: subItems };
      });

      return { ...cat, items, subcategories };
    });

    setMenu(newMenu);
    setEditingItem(null);
    toast({ title: t("Item Updated") });
  };

  const handleSaveIngredients = (itemName: string, newIngredients: IngredientItem[]) => {
    let found = false;
    const newMenu = menu.map(cat => {
      if (found) return cat;

      const items = cat.items.map(item => {
        if (item.name === itemName) {
          found = true;
          return { ...item, ingredients: newIngredients };
        }
        return item;
      });

      const subcategories = cat.subcategories?.map(subCat => {
        if (found) return subCat;
        const subItems = subCat.items.map(item => {
          if (item.name === itemName) {
            found = true;
            return { ...item, ingredients: newIngredients };
          }
          return item;
        });
        return { ...subCat, items: subItems };
      });

      return { ...cat, items, subcategories };
    });
    setMenu(newMenu);
    toast({ title: `Ingredients for ${itemName} updated!` });
  };

  const handleRemoveItem = (itemName: string) => {
    let newMenu = menu.map(cat => {
      const newItems = cat.items.filter(item => item.name !== itemName);
      const newSubcategories = cat.subcategories?.map(subCat => ({
        ...subCat,
        items: subCat.items.filter(item => item.name !== itemName)
      }));
      return { ...cat, items: newItems, subcategories: newSubcategories };
    });

    setMenu(newMenu);
    toast({ title: t("Item Removed") });
  };

  const handleRemoveCategory = (categoryName: string, subCategoryName?: string) => {
    let newMenu;
    if (subCategoryName) {
      newMenu = menu.map(cat => {
        if (cat.name === categoryName) {
          const newSubcategories = cat.subcategories?.filter(sc => sc.name !== subCategoryName);
          return { ...cat, subcategories: newSubcategories };
        }
        return cat;
      });
      toast({ title: t("Sub-category Removed") });
    } else {
      newMenu = menu.filter(cat => cat.name !== categoryName);
      toast({ title: t("Category Removed") });
    }
    setMenu(newMenu);
  };

  const handleAddScannedCategory = (scannedCategory: MenuCategory) => {
    let newMenu = [...menu];
    const categorySlug = slugify(scannedCategory.name);
    const existingCategoryIndex = newMenu.findIndex(c => c.id === categorySlug);

    const allItems = newMenu.flatMap(c => c.items);
    let maxCode = allItems.reduce((max, item) => {
      const codeNum = parseInt(item.code, 10);
      return !isNaN(codeNum) && codeNum > max ? codeNum : max;
    }, 0);

    const itemsToAdd = scannedCategory.items.map(item => ({
      ...item,
      code: (++maxCode).toString().padStart(2, '0'),
      history: [],
      ingredients: []
    }));

    if (existingCategoryIndex > -1) {
      const existingItems = newMenu[existingCategoryIndex].items.map(i => i.name.toLowerCase());
      const newItems = itemsToAdd.filter(i => !existingItems.includes(i.name.toLowerCase()));
      newMenu[existingCategoryIndex].items.push(...newItems);
      toast({ title: `Added ${newItems.length} new item(s) to "${scannedCategory.name}".` });
    } else {
      newMenu.push({ id: categorySlug, name: scannedCategory.name, items: itemsToAdd });
      toast({ title: `Category "${scannedCategory.name}" with ${itemsToAdd.length} item(s) added.` });
    }

    setMenu(newMenu);

    setScannedMenu(prev => prev ? ({ ...prev, menu: prev.menu.filter(c => c.name !== scannedCategory.name) }) : null);
  }

  const filteredMenuForEditing = useMemo(() => {
    if (!editMenuSearch) return menu;
    const lowercasedTerm = editMenuSearch.toLowerCase();

    return menu.map(category => {
      let categoryMatch = category.name.toLowerCase().includes(lowercasedTerm);

      let filteredItems = category.items.filter(item => item.name.toLowerCase().includes(lowercasedTerm));

      let filteredSubcategories = category.subcategories?.map(sub => {
        let subMatch = sub.name.toLowerCase().includes(lowercasedTerm);
        let subItems = sub.items.filter(item => item.name.toLowerCase().includes(lowercasedTerm));
        if (subItems.length > 0 || subMatch) {
          return { ...sub, items: subMatch ? sub.items : subItems };
        }
        return null;
      }).filter(Boolean) as MenuSubCategory[];

      if (categoryMatch || filteredItems.length > 0 || (filteredSubcategories && filteredSubcategories.length > 0)) {
        return {
          ...category,
          items: categoryMatch ? category.items : filteredItems,
          subcategories: categoryMatch ? category.subcategories : filteredSubcategories,
        };
      }
      return null;
    }).filter(Boolean) as MenuCategory[];
  }, [editMenuSearch, menu]);


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle>{t('Manage Menu')}</DialogTitle>
                <DialogDescription>
                  {t('Add, edit, and organize your menu categories, items, and ingredients.')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto p-1">
            <Accordion type="multiple" defaultValue={[]} className="w-full space-y-4">

              {/* Scan from Image */}
              <AccordionItem value="scan-menu">
                <AccordionTrigger className="text-lg font-semibold">{t('Scan Menu from Image')}</AccordionTrigger>
                <AccordionContent className="p-4 bg-muted/50 rounded-b-md">
                  <div className="flex items-center gap-4 mb-4">
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" /> {t('Upload Image')}
                    </Button>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      id="scan-upload"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                    <Button variant="outline" onClick={() => setIsCameraViewOpen(true)}>
                      <Camera className="mr-2 h-4 w-4" /> {t('Open Camera')}
                    </Button>
                  </div>
                  <div className="flex justify-center items-center min-h-[12rem] w-full border-2 border-dashed rounded-lg bg-background relative p-4">
                    {isScanning ? (
                      <div className="flex flex-col items-center gap-2 text-primary">
                        <Loader2 className="h-10 w-10 animate-spin" />
                        <p className="font-semibold">{t('AI is scanning your menu...')}</p>
                      </div>
                    ) : scannedMenu && scannedMenu.menu.length > 0 ? (
                      <div className="w-full space-y-4">
                        <div className="text-center">
                          <h3 className="text-lg font-semibold flex items-center justify-center gap-2"><Wand2 /> {t('Scanned Results')}</h3>
                          <p className="text-sm text-muted-foreground">{t('Review the scanned categories and add them to your menu.')}</p>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {scannedMenu.menu.map(category => (
                            <div key={category.name} className="p-3 border rounded-md bg-background/50">
                              <div className="flex justify-between items-center">
                                <h4 className="font-bold text-base">{category.name}</h4>
                                <Button size="sm" onClick={() => handleAddScannedCategory(category as MenuCategory)}><PlusCircle className="mr-2 h-4 w-4" /> Add to Menu</Button>
                              </div>
                              <ul className="text-sm mt-2 space-y-1">
                                {category.items.map(item => (
                                  <li key={item.name} className="flex justify-between">
                                    <span>{item.name}</span>
                                    <span className="font-mono">{currency}{item.price}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end">
                          <Button variant="ghost" onClick={() => setScannedMenu(null)}><X className="mr-2 h-4 w-4" /> {t('Discard All')}</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Upload an image to start scanning.</p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Add Category */}
              <AccordionItem value="add-category">
                <AccordionTrigger className="text-lg font-semibold">{t('Add New Category')}</AccordionTrigger>
                <AccordionContent className="p-4 bg-muted/50 rounded-b-md space-y-6">
                  {/* Add Main Category */}
                  <div className="space-y-2 p-4 border rounded-lg">
                    <h4 className="font-semibold text-base">1. {t('Add a Main Category')}</h4>
                    <div className="flex items-end gap-2">
                      <div className="flex-grow space-y-1">
                        <Label htmlFor="new-main-category">{t('New Main Category Name')}</Label>
                        <Input
                          id="new-main-category"
                          value={newCategoryName}
                          onChange={e => setNewCategoryName(e.target.value)}
                          placeholder={t('e.g., Appetizers, Desserts')}
                        />
                      </div>
                      <Button onClick={handleAddCategory}><PlusCircle className="mr-2 h-4 w-4" />{t('Add')}</Button>
                    </div>
                  </div>

                  {/* Add Sub Category */}
                  <div className="space-y-2 p-4 border rounded-lg">
                    <h4 className="font-semibold text-base">2. {t('Add a Sub-Category')} ({t('Optional')})</h4>
                    <div className="flex items-end gap-2">
                      <div className="flex-grow space-y-1">
                        <Label htmlFor="parent-category-select">{t('Select Parent Category')}</Label>
                        <Select value={parentCategoryForSub} onValueChange={setParentCategoryForSub}>
                          <SelectTrigger id="parent-category-select">
                            <SelectValue placeholder={t('Select a parent...')} />
                          </SelectTrigger>
                          <SelectContent>
                            {menu.map(cat => (
                              <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-grow space-y-1">
                        <Label htmlFor="new-sub-category">{t('New Sub-Category Name')}</Label>
                        <Input
                          id="new-sub-category"
                          value={newSubCategoryName}
                          onChange={e => setNewSubCategoryName(e.target.value)}
                          placeholder={t('e.g., Hot Drinks, Cold Drinks')}
                          disabled={!parentCategoryForSub}
                        />
                      </div>
                      <Button onClick={handleAddSubCategory} disabled={!parentCategoryForSub || !newSubCategoryName}>
                        <PlusCircle className="mr-2 h-4 w-4" />{t('Add')}
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Add Item */}
              <AccordionItem value="add-item">
                <AccordionTrigger className="text-lg font-semibold">{t('Add New Menu Item')}</AccordionTrigger>
                <AccordionContent className="p-4 bg-muted/50 rounded-b-md space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="select-category">{t('Select Category / Sub-Category')}</Label>
                    <Select value={selectedCategoryForItem} onValueChange={setSelectedCategoryForItem}>
                      <SelectTrigger id="select-category">
                        <SelectValue placeholder={t('Select where to add item')} />
                      </SelectTrigger>
                      <SelectContent>
                        {menu.map(cat => (
                          <React.Fragment key={cat.id}>
                            <SelectItem value={cat.name}>{cat.name}</SelectItem>
                            {cat.subcategories?.map(sub => (
                              <SelectItem key={`${cat.name} > ${sub.name}`} value={`${cat.name} > ${sub.name}`}>
                                &nbsp;&nbsp;&nbsp;↳ {sub.name}
                              </SelectItem>
                            ))}
                          </React.Fragment>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1">
                      <Label htmlFor="new-item-name">{t('Item Name')}</Label>
                      <Input
                        id="new-item-name"
                        value={newItemName}
                        onChange={e => setNewItemName(e.target.value)}
                        placeholder={t('e.g., Chocolate Lava Cake')}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="new-item-price">{t('Price')}</Label>
                      <Input
                        id="new-item-price"
                        type="number"
                        value={newItemPrice}
                        onChange={e => setNewItemPrice(e.target.value)}
                        placeholder={t('e.g., 250')}
                      />
                    </div>
                    <div className="space-y-2 pb-1">
                      <Label className="invisible">Veg</Label>
                      <div className="flex items-center space-x-2 h-10">
                        <Checkbox
                          id="new-item-veg"
                          checked={newItemIsVeg}
                          onCheckedChange={(checked) => setNewItemIsVeg(checked === true)}
                        />
                        <Label htmlFor="new-item-veg" className="text-sm font-medium leading-none flex items-center gap-2">
                          {t('Veg/Non-Veg')}
                          <div className={cn("h-2 w-2 rounded-full", newItemIsVeg ? "bg-green-600" : "bg-red-600")} />
                        </Label>
                      </div>
                    </div>
                    <Button onClick={handleAddItem} className="mb-[2px]"><PlusCircle className="mr-2 h-4 w-4" />{t('Add')}</Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Edit/Remove Menu */}
              <AccordionItem value="edit-menu">
                <AccordionTrigger className="text-lg font-semibold">
                  {t('Edit Menu & Ingredients')}
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-muted/50 rounded-b-md space-y-4">
                  <Input
                    placeholder={t('Search for a category or item to edit...')}
                    value={editMenuSearch}
                    onChange={(e) => setEditMenuSearch(e.target.value)}
                    className="mb-4"
                  />
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {filteredMenuForEditing.map(cat => (
                      <div key={cat.name} className="p-3 border rounded-md bg-background/50">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-lg">{cat.name}</h3>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('Are you absolutely sure?')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('This will permanently delete the entire category')} "{cat.name}" {t('and all items within it.')} {t('This action cannot be undone.')}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveCategory(cat.name)}>{t('Delete Category')}</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        {cat.items.length > 0 && (
                          <ul className="mt-1 space-y-1">
                            {cat.items.map(item => <ItemRow key={item.name} item={item} setEditingItem={() => setEditingItem({ categoryName: cat.name, item })} setEditingIngredients={setEditingIngredients} handleRemoveItem={handleRemoveItem} currency={currency} />)}
                          </ul>
                        )}
                        {cat.subcategories?.map(sub => (
                          <div key={sub.name} className="ml-4 mt-2">
                            <div className="flex justify-between items-center border-t pt-2">
                              <h4 className="font-semibold text-md text-muted-foreground">{sub.name}</h4>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t('Are you absolutely sure?')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('This will permanently delete the sub-category')} "{sub.name}" {t('and all its items.')} {t('This action cannot be undone.')}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRemoveCategory(cat.name, sub.name)}>{t('Delete Sub-category')}</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                            <ul className="mt-1 space-y-1">
                              {sub.items.map(item => <ItemRow key={item.name} item={item} setEditingItem={() => setEditingItem({ categoryName: cat.name, item })} setEditingIngredients={setEditingIngredients} handleRemoveItem={handleRemoveItem} currency={currency} />)}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ))}
                    {filteredMenuForEditing.length === 0 && (
                      <p className="text-center text-muted-foreground">{t('No items match your search.')}</p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('Close')}
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>
      {editingItem && (
        <EditItemDialog
          isOpen={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          item={editingItem.item}
          onSave={handleEditItem}
          currency={currency}
        />
      )}
      {editingIngredients && (
        <EditIngredientsDialog
          isOpen={!!editingIngredients}
          onOpenChange={(open) => !open && setEditingIngredients(null)}
          menuItem={editingIngredients}
          inventory={inventory}
          onSave={handleSaveIngredients}
        />
      )}
      <Dialog open={isCameraViewOpen} onOpenChange={setIsCameraViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Scan with Camera')}</DialogTitle>
            <DialogDescription>
              {t('Position the menu clearly within the frame and capture.')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay muted playsInline />
            {hasCameraPermission === false && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>{t('Camera Access Denied')}</AlertTitle>
                <AlertDescription>
                  {t('Please enable camera permissions in your browser settings to use this feature.')}
                </AlertDescription>
              </Alert>
            )}
            {hasCameraPermission === null && (
              <div className="flex items-center justify-center pt-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="ml-2">{t('Requesting camera access...')}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCameraViewOpen(false)}>{t('Cancel')}</Button>
            <Button onClick={handleCapture} disabled={!hasCameraPermission}>
              <Camera className="mr-2 h-4 w-4" /> {t('Capture')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ItemRow({ item, setEditingItem, setEditingIngredients, handleRemoveItem, currency = 'Rs.' }: {
  item: MenuItem;
  setEditingItem: () => void;
  setEditingIngredients: (item: MenuItem) => void;
  handleRemoveItem: (name: string) => void;
  currency?: string;
}) {
  const { t } = useLanguage();
  return (
    <li className="flex justify-between items-center p-1 rounded-md">
      <span>{item.name} - <span className="font-mono">{currency}{item.price}</span></span>
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={setEditingItem}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingIngredients(item)}>
          <FilePlus className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('Are you absolutely sure?')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('This will permanently delete the item')} "{item.name}". {t('This action cannot be undone.')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleRemoveItem(item.name)}>{t('Delete')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}
