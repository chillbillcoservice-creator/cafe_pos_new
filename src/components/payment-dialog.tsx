
"use client";

import { useState, useEffect, useRef } from 'react';
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
import { QrCode, Wallet, Users2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  receiptPreview: string;
  onPaymentSuccess: (customerDetails?: { name: string; phone: string }) => void;
  onNavigate: (tab: string) => void;
}

export function PaymentDialog({ isOpen, onOpenChange, total, receiptPreview, onPaymentSuccess, onNavigate }: PaymentDialogProps) {
  const [cashReceived, setCashReceived] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();
  const cashInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Use a short timeout to ensure the input is rendered and visible before focusing
      const timer = setTimeout(() => {
        cashInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);


  const change = cashReceived !== null ? cashReceived - total : null;

  const processPayment = () => {
    const details = customerName && customerMobile ? { name: customerName, phone: customerMobile } : undefined;
    onPaymentSuccess(details);
  }

  const handleCashConfirm = () => {
    if (cashReceived === null || cashReceived < total) {
      setError('Cash received must be equal to or greater than the total amount.');
      return;
    }
    setError('');
    processPayment();
  };

  const handleOnlineConfirm = () => {
    processPayment();
  };

  const handleClose = () => {
    setCashReceived(null);
    setCustomerName('');
    setCustomerMobile('');
    setError('');
    onOpenChange(false);
  }

  const handleGoToCustomerDatabase = () => {
    onNavigate('customers');
    handleClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 border-b pt-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Customer Name (Optional)</Label>
              <Input id="customer-name" placeholder="Name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-mobile">Mobile No. (Optional)</Label>
              <Input id="customer-mobile" placeholder="Mobile" value={customerMobile} onChange={e => setCustomerMobile(e.target.value)} />
            </div>
          </div>
          <div className="text-center">
            <Button variant="link" size="sm" className="text-sm" onClick={handleGoToCustomerDatabase}>
              <Users2 className="mr-2 h-4 w-4" />
              Go to customer database
            </Button>
          </div>
        </div>

        <div className="text-center py-6">
          <p className="text-muted-foreground">Total Amount to be Paid</p>
          <p className="text-6xl font-bold">Rs. {total.toFixed(2)}</p>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Cash Payment Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wallet /> Cash Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cash-received">Cash Received</Label>
                <Input
                  id="cash-received"
                  ref={cashInputRef}
                  type="number"
                  value={cashReceived === null ? '' : cashReceived}
                  onChange={(e) => setCashReceived(e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="e.g., 50.00"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {change !== null && change >= 0 && (
                <div className="text-center text-2xl font-bold text-primary py-4 bg-muted rounded-md">
                  Change Due: Rs.{change.toFixed(2)}
                </div>
              )}
              <Button onClick={handleCashConfirm} className="w-full" size="lg">Confirm Cash Payment</Button>
            </CardContent>
          </Card>

          {/* Online Payment Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><QrCode /> Online Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center space-y-2 py-4 border-dashed border-2 rounded-lg h-52">
                <QrCode className="h-20 w-20 text-muted-foreground" />
                <p className="text-muted-foreground text-center text-sm">
                  Show QR code to customer.
                </p>
              </div>
              <Button onClick={handleOnlineConfirm} className="w-full" size="lg">Confirm Online Payment</Button>
            </CardContent>
          </Card>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel Payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
