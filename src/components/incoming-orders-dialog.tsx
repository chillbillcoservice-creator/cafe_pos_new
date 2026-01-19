import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { CustomerOrder } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, Printer } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface IncomingOrdersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customerOrders: CustomerOrder[];
  onAccept: (tableId: number, items: CustomerOrder['items']) => any[]; // Expect return value
}

interface GeneratedKOT {
  title: string;
  items: any[];
}

import { useLanguage } from '@/contexts/language-context';

export default function IncomingOrdersDialog({
  isOpen,
  onOpenChange,
  customerOrders,
  onAccept,
}: IncomingOrdersDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const db = useFirestore();
  const [generatedKots, setGeneratedKots] = useState<{ tableId: number; kots: GeneratedKOT[] } | null>(null);

  const handleAccept = (order: CustomerOrder) => {
    // 1. Process the order in MainLayout (adds to POS, splits items)
    const kots = onAccept(Number(order.tableId), order.items);

    // 2. Mark as handled in Firebase
    const orderRef = doc(db, 'customerOrders', order.id);
    updateDoc(orderRef, { status: 'handled' });

    // 3. If Kot groups were generated, show the print dashboard
    if (kots && kots.length > 0) {
      setGeneratedKots({ tableId: Number(order.tableId), kots });
    } else {
      // No KOTs? Just close if it was the last order
      if (customerOrders.length === 1) {
        onOpenChange(false);
      }
    }
  };

  const handlePrintKot = (kot: GeneratedKOT, index: number) => {
    const printWindow = window.open('', `_blank_kot_${Date.now()}`);
    if (printWindow) {
      printWindow.document.write(`
            <html><head><title>${kot.title}</title><style>body { font-family: monospace; }</style></head><body>
            <h2>${kot.title}</h2><h3>Table ${generatedKots?.tableId}</h3>
            <ul>${kot.items.map((item: any) => `<li>${item.quantity} x ${item.name}${item.instruction ? `<br/><small><i>Note: ${item.instruction}</i></small>` : ''}</li>`).join('')}</ul>
            <script>window.onload = function() { window.print(); window.close(); }</script>
            </body></html>`
      );
      printWindow.document.close();

      // Remove the printed KOT from the list
      if (generatedKots) {
        const updatedKots = generatedKots.kots.filter((_, i) => i !== index);
        if (updatedKots.length === 0) {
          // All printed, close the dashboard
          handleClose();
        } else {
          setGeneratedKots({ ...generatedKots, kots: updatedKots });
        }
      }
    }
  };

  const handleDismiss = (orderId: string) => {
    const orderRef = doc(db, 'customerOrders', orderId);
    updateDoc(orderRef, { status: 'handled' });
    toast({ title: t('Order dismissed.') });
    if (customerOrders.length === 1) {
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setGeneratedKots(null);
    if (customerOrders.length === 0) {
      onOpenChange(false);
    }
  }


  // If we have generated KOTs, show the Print Dashboard state
  if (generatedKots) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Print KOTs - Table')} {generatedKots.tableId}</DialogTitle>
            <DialogDescription>
              {t('Please print each ticket to its designated printer.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {generatedKots.kots.map((kot, idx) => (
              <div key={idx} className="flex items-center justify-between border p-3 rounded">
                <span className="font-bold">{kot.title}</span>
                <Button size="sm" onClick={() => handlePrintKot(kot, idx)}>
                  <Printer className="mr-2 h-4 w-4" /> {t('Print')}
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={handleClose}>{t('Done')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('Incoming Customer Orders')}</DialogTitle>
          <DialogDescription>
            {t('New orders placed by customers via QR code.')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] -mx-6 px-6">
          <div className="space-y-4 py-4">
            {customerOrders.length > 0 ? (
              customerOrders.map(order => (
                <div key={order.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg">{t('Table')} {order.tableId}</h3>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(order.createdAt.toDate(), { addSuffix: true })}
                    </p>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-sm mb-4">
                    {order.items.map(item => (
                      <li key={item.name}>
                        {item.quantity}x {t(item.name)}
                        {item.instruction && (
                          <div className="text-xs text-orange-600 font-medium italic mt-0.5">
                            {t('Note:')} {item.instruction}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismiss(order.id)}
                    >
                      <X className="mr-2 h-4 w-4" /> {t('Dismiss')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAccept(order)}
                    >
                      <Check className="mr-2 h-4 w-4" /> {t('Accept & Print KOTs')}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-16">
                {t('No incoming orders at the moment.')}
              </p>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
