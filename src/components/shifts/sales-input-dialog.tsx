
'use client';

import React, { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';

interface SalesInputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (salesAmount: number) => void;
}

export function SalesInputDialog({ isOpen, onClose, onSubmit }: SalesInputDialogProps) {
  const [amount, setAmount] = useState('');
  const { toast } = useToast();

  const handleSubmit = () => {
    const salesAmount = parseFloat(amount);
    if (isNaN(salesAmount) || salesAmount < 0) {
      toast({
        variant: 'destructive',
        title: 'סכום לא תקין',
        description: 'יש להזין מספר חיובי.',
      });
      return;
    }
    onSubmit(salesAmount);
    setAmount('');
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>הזנת סכום מכירות</DialogTitle>
          <DialogDescription>
            עבודה זו זכאית לבונוס. הזן את סך המכירות במשמרת זו כדי לחשב את העמלה שלך.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="sales-amount">סכום מכירות (₪)</Label>
          <Input
            id="sales-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="לדוגמה: 1500"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            דלג
          </Button>
          <Button onClick={handleSubmit}>שמור וסיים משמרת</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
