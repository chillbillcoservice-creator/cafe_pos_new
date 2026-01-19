
'use client';

import { useState, useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import type { MenuCategory, MenuItem, OrderItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Plus, Minus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface CustomerOrderClientProps {
  menuData: { category: string; items: MenuItem[] }[];
  tableId: string;
  venueName: string;
  currency?: string;
}

export function CustomerOrderClient({ menuData, tableId, venueName, currency = 'Rs.' }: CustomerOrderClientProps) {
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const { toast } = useToast();
  const db = useFirestore();

  const addToCart = (item: MenuItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.name === item.name);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.name === item.name ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      }
      const itemWithCategory = {
        ...item,
        category: menuData.find(c => c.items.some(i => i.name === item.name))?.category,
      };
      return [...prevCart, { ...itemWithCategory, quantity: 1 }];
    });
    toast({
      title: `${item.name} added to cart!`,
    })
  };

  const updateQuantity = (itemName: string, quantity: number) => {
    setCart(prevCart => {
      if (quantity <= 0) {
        return prevCart.filter(item => item.name !== itemName);
      }
      return prevCart.map(item => item.name === itemName ? { ...item, quantity } : item);
    })
  }

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const totalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setIsPlacingOrder(true);
    try {
      // Add order to customerOrders collection
      await addDoc(collection(db, 'customerOrders'), {
        tableId,
        items: cart,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Mark the table as occupied
      const tableRef = doc(db, 'tables', tableId);
      await updateDoc(tableRef, { status: 'Occupied' });

      toast({
        title: 'Order Placed!',
        description: 'Your order has been sent to the kitchen. We will notify you when it is ready.',
      });
      setCart([]);
      setIsCartOpen(false);
    } catch (error) {
      console.error("Error placing order: ", error);
      toast({
        variant: 'destructive',
        title: 'Order Failed',
        description: 'Could not place your order. Please try again or ask for help.',
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Welcome to {venueName}</CardTitle>
          <CardDescription className="text-lg">Order for Table {tableId}</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-350px)]">
            <div className="space-y-6">
              {menuData.map((category) => (
                <div key={category.category}>
                  <h2 className="text-2xl font-semibold tracking-tight border-b pb-2 mb-4">{category.category}</h2>
                  <div className="space-y-4">
                    {category.items.map((item) => (
                      <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{currency}{item.price.toFixed(2)}</p>
                        </div>
                        <Button size="sm" onClick={() => addToCart(item)}>
                          <Plus className="mr-2 h-4 w-4" /> Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg">
          <div className="container mx-auto max-w-2xl">
            <Button className="w-full h-14 text-lg" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart className="mr-4 h-6 w-6" />
              View Your Order ({totalItems} items)
              <span className="ml-auto font-mono">{currency}{subtotal.toFixed(2)}</span>
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Your Order</DialogTitle>
            <DialogDescription>
              Review your items before placing the order.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto my-4 -mx-6 px-6">
            {cart.length > 0 ? (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.name} className="flex items-center">
                    <div className="flex-grow">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{currency}{item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.name, item.quantity - 1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.name, item.quantity + 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Your cart is empty.</p>
            )}
          </div>
          {cart.length > 0 && (
            <>
              <Separator />
              <div className="flex justify-between items-center text-lg font-bold py-2">
                <span>Subtotal:</span>
                <span>{currency}{subtotal.toFixed(2)}</span>
              </div>
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCartOpen(false)}>Continue Browsing</Button>
            <Button onClick={handlePlaceOrder} disabled={cart.length === 0 || isPlacingOrder}>
              {isPlacingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Place Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
