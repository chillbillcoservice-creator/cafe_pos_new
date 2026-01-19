
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import type { MenuCategory, MenuItem, OrderItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Minus, Loader2, ArrowRight, UtensilsCrossed, ChevronRight, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomerOrderClientProps {
  tableId: string;
}

// --- Icons ---
const VegIcon = () => (
  <div className="flex items-center justify-center h-[18px] w-[18px] border-[1.5px] border-green-600 rounded-[4px] p-[2px]">
    <div className="h-2 w-2 rounded-full bg-green-600" />
  </div>
);

const NonVegIcon = () => (
  <div className="flex items-center justify-center h-[18px] w-[18px] border-[1.5px] border-red-600 rounded-[4px] p-[2px]">
    <div className="h-2 w-2 rounded-full bg-red-600" />
  </div>
);

export function CustomerOrderClient({ tableId }: CustomerOrderClientProps) {
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [scrolled, setScrolled] = useState(false);

  const { toast } = useToast();
  const db = useFirestore();

  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Data
  const menuQuery = useMemoFirebase(() => db ? collection(db, 'menu') : null, [db]);
  const { data: menuData, isLoading: isMenuLoading } = useCollection<MenuCategory>(menuQuery);
  const [venueName, setVenueName] = useState("Your Restaurant");
  const [currency, setCurrency] = useState("Rs.");
  const [isVenueLoading, setIsVenueLoading] = useState(true);

  useEffect(() => {
    async function fetchVenueName() {
      if (!db) return;
      try {
        const docRef = await getDoc(doc(db, "settings", "venue"));
        if (docRef.exists()) {
          const data = docRef.data();
          setVenueName(data.venueName || "Your Venue");
          setCurrency(data.currency || "Rs.");
        }
      } catch (e) { console.error(e); }
      finally { setIsVenueLoading(false); }
    }
    fetchVenueName();
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [db]);

  const processedMenu = useMemo(() => {
    if (!menuData) return [];
    let cats = menuData.map(c => ({ category: c.name, items: c.items || [], status: c.status }));

    // DEBUG: Log status to console
    console.log("Process Menu Update:", cats.map(c => ({
      cat: c.category,
      status: c.status,
      items: c.items.map(i => `${i.name}:${i.status}`)
    })));

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      cats = cats.map(cat => ({
        ...cat,
        items: cat.items.filter(item => item.name.toLowerCase().includes(lowerTerm))
      })).filter(cat => cat.items.length > 0);
    }

    // Only set active category if we have categories and it's not set, OR if we are searching (to focus the first result)
    if (cats.length > 0 && (!activeCategory || searchTerm)) setActiveCategory(cats[0].category);
    return cats;
  }, [menuData, activeCategory, searchTerm]);

  const getItemQty = (name: string) => cart.find(i => i.name === name)?.quantity || 0;

  const updateCart = (item: MenuItem, cat: string, delta: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.name === item.name);
      if (existing) {
        const newQty = existing.quantity + delta;
        return newQty <= 0 ? prev.filter(i => i.name !== item.name)
          : prev.map(i => i.name === item.name ? { ...i, quantity: newQty } : i);
      }
      return delta > 0 ? [...prev, { ...item, quantity: 1, category: cat }] : prev;
    });
    // Haptic visual
    if (delta > 0 && getItemQty(item.name) === 0 && navigator.vibrate) navigator.vibrate(30);
  };

  const updateItemInstruction = (itemName: string, instruction: string) => {
    setCart(prev => prev.map(item =>
      item.name === itemName ? { ...item, instruction } : item
    ));
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (!db) {
      console.error("Database connection not established");
      toast({ variant: 'destructive', title: 'System Error', description: 'Database not connected. Please refresh.' });
      return;
    }

    setIsPlacingOrder(true);
    console.log("Placing order for table:", tableId, "Items:", cart);

    try {
      await addDoc(collection(db, 'customerOrders'), {
        tableId, items: cart, status: 'pending', createdAt: serverTimestamp(),
      });
      console.log("Order document created successfully");

      await setDoc(doc(db, 'tables', tableId), { status: 'Occupied' }, { merge: true });
      console.log("Table status updated");

      toast({ title: 'Order Placed!', className: "bg-green-600 text-white border-none" });
      setCart([]);
      setIsCartOpen(false);
    } catch (error) {
      console.error("Order Placement Error:", error);
      toast({ variant: 'destructive', title: 'Order Failed', description: String(error) });
    } finally { setIsPlacingOrder(false); }
  };

  const scrollToCategory = (cat: string) => {
    setActiveCategory(cat);
    const el = categoryRefs.current[cat];
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const subtotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const totalQty = cart.reduce((acc, i) => acc + i.quantity, 0);

  if (isMenuLoading || isVenueLoading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-orange-50">
      <UtensilsCrossed className="h-10 w-10 text-orange-300 mb-4 animate-pulse" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-rose-50 pb-32 font-sans selection:bg-orange-200">

      {/* --- Dynamic Header --- */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out border-b border-transparent",
        scrolled ? "bg-white/80 backdrop-blur-md shadow-sm border-white/20 py-2" : "bg-transparent py-4"
      )}>
        <div className="px-5 flex justify-between items-center gap-4">
          <div className={cn("transition-all duration-300", scrolled ? "scale-90 origin-left" : "scale-100")}>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 drop-shadow-sm">{venueName}</h1>
            <p className="text-xs font-semibold text-orange-600 mt-0.5 uppercase tracking-wide">Table {tableId}</p>
          </div>

          <div className="relative flex-1 max-w-[280px] shrink-0">
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-zinc-100/90 backdrop-blur-sm border border-zinc-200 rounded-2xl text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all placeholder:text-zinc-400 shadow-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500 pointer-events-none z-10" />
          </div>
        </div>

        {/* --- Sticky Categories --- */}
        <div className="mt-2 w-full overflow-x-auto no-scrollbar pl-5 pr-2 pb-2">
          <div className="flex gap-3">
            {processedMenu.map((cat, index) => {
              const isActive = activeCategory === cat.category;
              // Define vibrant color schemes for categories
              const colorSchemes = [
                { active: "from-orange-500 to-rose-500", inactive: "bg-orange-50 text-orange-700 border-orange-200", shadow: "shadow-orange-200" },
                { active: "from-blue-500 to-indigo-500", inactive: "bg-blue-50 text-blue-700 border-blue-200", shadow: "shadow-blue-200" },
                { active: "from-emerald-500 to-teal-500", inactive: "bg-emerald-50 text-emerald-700 border-emerald-200", shadow: "shadow-emerald-200" },
                { active: "from-purple-500 to-fuchsia-500", inactive: "bg-purple-50 text-purple-700 border-purple-200", shadow: "shadow-purple-200" },
                { active: "from-amber-500 to-yellow-500", inactive: "bg-amber-100 text-amber-800 border-amber-300", shadow: "shadow-amber-200" },
                { active: "from-pink-500 to-rose-500", inactive: "bg-pink-50 text-pink-700 border-pink-200", shadow: "shadow-pink-200" },
                { active: "from-cyan-500 to-blue-500", inactive: "bg-cyan-50 text-cyan-700 border-cyan-200", shadow: "shadow-cyan-200" },
              ];
              const scheme = colorSchemes[index % colorSchemes.length];

              return (
                <button
                  key={cat.category}
                  onClick={() => scrollToCategory(cat.category)}
                  className={cn(
                    "px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 snap-center shadow-sm border",
                    isActive
                      ? cn("bg-gradient-to-r text-white scale-105 shadow-md", scheme.active, scheme.shadow)
                      : cn(scheme.inactive)
                  )}
                >
                  {cat.category}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      <div className="h-36 w-full" />

      {/* --- Menu Items --- */}
      <main className="px-4 space-y-8">
        {processedMenu.map((cat) => (
          <div key={cat.category} ref={el => { categoryRefs.current[cat.category] = el; }} className="scroll-mt-40">
            <h2 className="text-xl font-black text-zinc-800 mb-4 px-1">{cat.category}</h2>
            <div className="grid gap-4">
              {cat.items.map((item) => {
                const qty = getItemQty(item.name);
                const isOutOfStock = item.status === 'out' || cat.status === 'out';
                const isLowStock = !isOutOfStock && (item.status === 'low' || cat.status === 'low');

                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    whileHover={!isOutOfStock ? { scale: 1.02, y: -2, boxShadow: "0 10px 25px -5px rgba(249, 115, 22, 0.15), 0 8px 10px -6px rgba(249, 115, 22, 0.1)" } : {}}
                    whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
                    className={cn(
                      "relative group bg-gradient-to-br from-[#FFFBF7] to-[#FFF0F0] rounded-2xl p-4 border border-orange-100/50 shadow-sm transition-all",
                      isOutOfStock ? "opacity-60 grayscale filter pointer-events-none" : ""
                    )}
                  >
                    {/* Colorful Accent Line */}
                    <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-orange-400 to-rose-400 rounded-r-full opacity-60 group-hover:opacity-100 transition-opacity" />

                    <div className="flex justify-between items-start gap-4 pl-3">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const lowerName = item.name.toLowerCase();
                            const isVegManual = item.isVeg;
                            const catName = cat.category.toLowerCase();
                            const isBeverage = catName.includes('beverag') || catName.includes('coffee') || catName.includes('tea') || catName.includes('shake');

                            // 1. Check manual flag
                            if (isVegManual === true) return <VegIcon />;
                            if (isVegManual === false) return <NonVegIcon />;

                            // 2. Check keywords for Non-Veg (Priority)
                            const nvKeywords = ['chicken', 'egg', 'omelette', 'fish', 'mutton', 'meat', 'bacon', 'pepperoni', 'salami', 'ham', 'prawn', 'lamb', 'beef', 'steak', 'non-veg'];
                            if (nvKeywords.some(kw => lowerName.includes(kw))) {
                              return <NonVegIcon />;
                            }

                            // 3. Check keywords for Veg OR if it's a Beverage
                            const vegKeywords = ['veg', 'paneer', 'aloo', 'gobhi', 'mix', 'parantha', 'cheese', 'corn', 'poha', 'dal', 'mushroom', 'curd', 'butter', 'jam', 'toast', 'sandwich', 'burger', 'pizza', 'pasta', 'bruschetta', 'garlic', 'rice', 'choco', 'nutella', 'banana', 'fruit', 'salad', 'fries', 'shake', 'coke', 'sprite', 'soda', 'chai', 'tea', 'coffee', 'latte', 'cappuccino', 'espresso', 'americano', 'macchiato', 'mocha', 'smoothie', 'juice'];
                            if (vegKeywords.some(kw => lowerName.includes(kw)) || isBeverage) {
                              return <VegIcon />;
                            }

                            return null;
                          })()}
                          <h3 className="font-bold text-zinc-800 text-[16px] leading-tight">{item.name}</h3>
                          {isOutOfStock && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200">SOLD OUT</span>}
                          {isLowStock && <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200">RUNNING LOW</span>}
                        </div>
                        <p className="font-semibold text-zinc-900">{currency}{item.price}</p>
                        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed opacity-80">Freshly prepared for you.</p>
                      </div>

                      <div className="flex flex-col items-center shrink-0 w-24">
                        {qty === 0 ? (
                          <button
                            onClick={() => updateCart(item, cat.category, 1)}
                            disabled={isOutOfStock}
                            className="w-20 h-9 rounded-xl bg-white border border-orange-100 text-orange-600 text-xs font-black tracking-wider shadow-sm active:scale-95 transition-all uppercase hover:bg-orange-50 hover:border-orange-200 hover:shadow-md disabled:opacity-50 disabled:grayscale"
                          >
                            ADD
                          </button>
                        ) : (
                          <div className="h-9 w-24 bg-orange-50 rounded-xl flex items-center justify-between px-1 shadow-inner border border-orange-100">
                            <button onClick={() => updateCart(item, cat.category, -1)} className="w-7 h-full flex items-center justify-center text-orange-600 active:scale-75 transition-transform"><Minus size={14} strokeWidth={3} /></button>
                            <span className="font-bold text-sm text-orange-700">{qty}</span>
                            <button onClick={() => updateCart(item, cat.category, 1)} className="w-7 h-full flex items-center justify-center text-orange-600 active:scale-75 transition-transform"><Plus size={14} strokeWidth={3} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}
      </main>

      {/* --- Floating Cart Bar --- */}
      <AnimatePresence>
        {totalQty > 0 && !isCartOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-4 right-4 z-[60]"
          >
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-gradient-to-r from-zinc-900 to-zinc-800 text-white p-4 rounded-2xl shadow-xl shadow-orange-900/10 flex items-center justify-between group active:scale-[0.98] transition-all border border-white/10"
            >
              <div className="flex flex-col items-start pl-1">
                <span className="text-[10px] font-bold tracking-wider text-orange-400 uppercase">{totalQty} ITEMS</span>
                <span className="text-lg font-bold text-white">{currency}{subtotal.toFixed(0)}</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-sm bg-white/10 px-4 py-2 rounded-xl group-hover:bg-white/20 transition-all backdrop-blur-md">
                View Cart <ChevronRight size={16} />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Cart Sheet (Custom Framer Motion) --- */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm"
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[100] bg-[#FDFDFD] rounded-t-3xl overflow-hidden max-h-[85vh] flex flex-col shadow-2xl"
            >
              {/* Drag Handle */}
              <div className="bg-white pt-3 pb-1" onClick={() => setIsCartOpen(false)}>
                <div className="h-1.5 w-12 bg-zinc-200 rounded-full mx-auto" />
              </div>

              <div className="px-6 pb-4 border-b border-zinc-50 bg-white">
                <h2 className="text-2xl font-black text-zinc-900">Your Order</h2>
                <p className="text-xs text-zinc-500 font-medium">Table {tableId} • {venueName}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-white to-zinc-50 min-h-[30vh]">
                {cart.length === 0 ? <div className="text-center py-10 opacity-50">Cart is empty</div> : (
                  cart.map((item) => (
                    <div key={item.name} className="flex flex-col gap-3 border-b border-zinc-100 pb-4 last:border-0">
                      <div className="flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                          <div className="mt-0.5">
                            {(() => {
                              const lowerName = item.name.toLowerCase();
                              const isVegManual = item.isVeg;
                              const catName = item.category?.toLowerCase() || '';
                              const isBeverage = catName.includes('beverag') || catName.includes('coffee') || catName.includes('tea') || catName.includes('shake');

                              if (isVegManual === true) return <VegIcon />;
                              if (isVegManual === false) return <NonVegIcon />;

                              const nvKeywords = ['chicken', 'egg', 'omelette', 'fish', 'mutton', 'meat', 'bacon', 'pepperoni', 'salami', 'ham', 'prawn', 'lamb', 'beef', 'steak', 'non-veg'];
                              if (nvKeywords.some(kw => lowerName.includes(kw))) {
                                return <NonVegIcon />;
                              }

                              const vegKeywords = ['veg', 'paneer', 'aloo', 'gobhi', 'mix', 'parantha', 'cheese', 'corn', 'poha', 'dal', 'mushroom', 'curd', 'butter', 'jam', 'toast', 'sandwich', 'burger', 'pizza', 'pasta', 'bruschetta', 'garlic', 'rice', 'choco', 'nutella', 'banana', 'fruit', 'salad', 'fries', 'shake', 'coke', 'sprite', 'soda', 'chai', 'tea', 'coffee', 'latte', 'cappuccino', 'espresso', 'americano', 'macchiato', 'mocha', 'smoothie', 'juice'];
                              if (vegKeywords.some(kw => lowerName.includes(kw)) || isBeverage) {
                                return <VegIcon />;
                              }

                              return null;
                            })()}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-800 text-sm">{item.name}</p>
                            <p className="text-xs font-semibold text-zinc-400">{currency}{item.price * item.quantity}</p>
                          </div>
                        </div>
                        <div className="flex items-center border border-zinc-200 rounded-lg h-8 bg-white shadow-sm">
                          <button
                            onClick={() => updateCart(item, '', -1)}
                            className="px-3 text-black hover:text-red-500 transition-colors flex items-center justify-center"
                          >
                            {item.quantity === 1 ? <span className="text-red-500 text-xs font-bold">✕</span> : <Minus size={14} />}
                          </button>
                          <span className="text-sm font-bold w-5 text-center text-black">{item.quantity}</span>
                          <button onClick={() => updateCart(item, '', 1)} className="px-3 text-black hover:text-green-500 transition-colors"><Plus size={14} /></button>
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Add special cooking instructions..."
                        value={item.instruction || ''}
                        onChange={(e) => updateItemInstruction(item.name, e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-zinc-400 text-black"
                      />
                    </div>
                  ))
                )}

                <div className="py-6 space-y-2 border-t border-dashed border-zinc-200 mt-4">
                  <div className="flex justify-between text-sm font-medium text-zinc-500">
                    <span>Item Total</span>
                    <span>{currency}{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-zinc-500">
                    <span>Taxes (5%)</span>
                    <span>{currency}{(subtotal * 0.05).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black text-zinc-900 pt-3 border-t border-zinc-200 mt-2">
                    <span>To Pay</span>
                    <span>{currency}{(subtotal * 1.05).toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white border-t border-zinc-100 safe-area-bottom">
                <Button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder || cart.length === 0}
                  className="w-full h-14 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 text-white text-lg font-bold rounded-2xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all"
                >
                  {isPlacingOrder ? <Loader2 className="animate-spin" /> : (
                    <span className="flex items-center gap-2">Place Order <ArrowRight size={20} /></span>
                  )}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
