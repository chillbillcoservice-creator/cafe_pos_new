
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Utensils, LayoutGrid, Soup, Users, Shield, Receipt, Users2, HelpCircle, Zap, MousePointerClick, Keyboard, FileInput } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface HelpDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const quickTips = [
  {
    icon: Keyboard,
    title: 'Keyboard Shortcuts',
    description: 'Use Enter and Escape to navigate between table selection, order entry, and confirmation modes in the POS for faster checkout.',
  },
  {
    icon: MousePointerClick,
    title: 'Easy Mode',
    description: 'Toggle on "Easy Mode" in the POS to add items to an order with a single click. You can also drag & drop items onto tables.',
  },
  {
    icon: FileInput,
    title: 'Item Codes',
    description: 'Type an item\'s short code directly into the search bar and press Enter to instantly add it to the current order.',
  }
];

const features = [
  {
    icon: Utensils,
    title: 'Main POS (Point of Sale)',
    description: 'This is where you take orders. You can see the menu, add items to an order, apply discounts, and process payments. 🍽️',
  },
  {
    icon: LayoutGrid,
    title: 'Tables',
    description: 'Manage your restaurant layout. See which tables are available, occupied, or reserved. You can reserve tables for guests, view performance metrics like turnover and revenue, and even give tables custom names (e.g., "Window Seat"). 🪑',
  },
  {
    icon: Soup,
    title: 'Kitchen & Inventory',
    description: 'The kitchen screen shows active orders for the chefs. You can configure how orders (KOTs) are printed—either as a single combined ticket, or as separate tickets for different sections like the kitchen and bar. The inventory section helps you track stock levels. 📦',
  },
  {
    icon: Users2,
    title: 'Customers',
    description: 'A list of all your customers. You can see their contact details, how many times they have visited, and their total spending. 👤',
  },
  {
    icon: Receipt,
    title: 'Expenses',
    description: 'Track all your business expenses here, from rent to supplier payments. Also, manage pending payments to vendors and from customers. 💰',
  },
  {
    icon: Users,
    title: 'Staff',
    description: 'Manage your employee details, track their attendance, and record any salary advances. 🧑‍🍳',
  },
  {
    icon: Shield,
    title: 'Admin',
    description: 'This is the control center. View sales reports, manage staff, handle inventory, and configure various settings for the app. ⚙️',
  },
];


export function HelpDialog({ isOpen, onOpenChange }: HelpDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle />
            App Guide
          </DialogTitle>
          <DialogDescription>
            A quick overview of the main features and tips for the application.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] -mx-6 px-6">
            <div className="py-4 space-y-6">
                <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-primary"><Zap/>Quick Tips</h3>
                    <div className="space-y-4">
                    {quickTips.map((tip) => (
                        <div key={tip.title} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                        <div className="flex-shrink-0 bg-primary/10 text-primary p-3 rounded-lg">
                            <tip.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg">{tip.title}</h4>
                            <p className="text-muted-foreground mt-1">{tip.description}</p>
                        </div>
                        </div>
                    ))}
                    </div>
                </div>

                <Separator />

                <div>
                     <h3 className="text-xl font-semibold mb-4">Main Features</h3>
                     <div className="space-y-4">
                        {features.map((feature) => (
                            <div key={feature.title} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                            <div className="flex-shrink-0 bg-primary/10 text-primary p-3 rounded-lg">
                                <feature.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">{feature.title}</h4>
                                <p className="text-muted-foreground mt-1">{feature.description}</p>
                            </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Got it, thanks!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
