
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
import { Utensils, LayoutGrid, Soup, Users, Shield, Receipt, Users2, HelpCircle, Zap, MousePointerClick, Keyboard, FileInput, Languages, Camera } from 'lucide-react';
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
    title: 'Tables & QR Codes',
    description: 'Manage your restaurant layout and see which tables are available. You can also generate special QR codes for each table. When customers scan these codes with their phones, they can see your menu and place orders directly! 📱',
  },
  {
    icon: Soup,
    title: 'Kitchen & Inventory',
    description: 'The kitchen screen shows active orders for the chefs. You can configure how orders (KOTs) are printed—either as a single combined ticket, or as separate tickets for different sections like the kitchen and bar. The inventory section helps you track stock levels. 📦',
  },
  {
    icon: Languages,
    title: 'Language Support',
    description: 'The app works in many languages, including English and Hindi. You can easily switch your preferred language from the settings to make it easier for you and your staff to use. 🌐',
  },
  {
    icon: Camera,
    title: 'AI Menu Scanner',
    description: 'Adding your items is easy! Instead of typing everything, you can just take a photo of your printed menu, and our AI will automatically read the names and prices to set up your digital menu in seconds. 📸',
  },
  {
    icon: Users2,
    title: 'Customers & CRM',
    description: 'Keep a list of your customers. See how often they visit and what they like to order, so you can provide them with a better experience next time. 👤',
  },
  {
    icon: Receipt,
    title: 'Expenses & Business',
    description: 'Track all your business costs, like rent and electricity. You can also manage payments you owe to suppliers or money you need to collect from customers. 💰',
  },
  {
    icon: Users,
    title: 'Staff Management',
    description: 'Keep track of your team, their roles (like Chef or Manager), their attendance, and any salary advances they take. 🧑‍🍳',
  },
  {
    icon: Shield,
    title: 'Admin Control',
    description: 'The "Admin" section is your main dashboard. View daily sales reports, check top-performing items, and change how your shop works. ⚙️',
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
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-primary"><Zap />Quick Tips</h3>
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
