'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Upload } from 'lucide-react';
import { analyzeReceipt } from '@/ai/flows/analyze-receipt-flow';
import { useToast } from '@/hooks/use-toast';
import type { Expense } from '@/lib/types';

interface ReceiptUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onReceiptAnalyzed: (data: Partial<Expense>) => void;
}

export function ReceiptUploadDialog({ isOpen, onOpenChange, onReceiptAnalyzed }: ReceiptUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 4 * 1024 * 1024) { // 4MB limit
        setError("גודל הקובץ לא יכול לעלות על 4MB.");
        setFile(null);
        setPreview(null);
        return;
      }
      setError(null);
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleAnalyze = () => {
    if (!file || !preview) return;

    startTransition(async () => {
      setError(null);
      try {
        const result = await analyzeReceipt({ photoDataUri: preview });

        // Map AI result to Expense fields
        const expenseData: Partial<Expense> = {
          amount: result.amount,
          date: result.date as any, // Will be parsed in the next dialog
          description: result.vendor || 'הוצאה מקבלה',
          category: result.suggestedCategory,
          subcategory: result.suggestedSubcategory,
        };
        
        onReceiptAnalyzed(expenseData);

      } catch (e: any) {
        console.error("Receipt analysis failed:", e);
        setError("ניתוח הקבלה נכשל. נסה שוב או מלא את הפרטים ידנית.");
        toast({
          variant: 'destructive',
          title: 'שגיאת ניתוח',
          description: e.message || 'הייתה בעיה בעיבוד הקבלה.',
        });
      }
    });
  };

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setError(null);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>סריקת קבלה</DialogTitle>
          <DialogDescription>העלה תמונה של קבלה והמערכת תנסה לחלץ את הפרטים באופן אוטומטי.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>שגיאה</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="receipt-file">בחר קובץ תמונה</Label>
            <div className="flex items-center gap-2">
              <Input id="receipt-file" type="file" accept="image/*" onChange={handleFileChange} className="flex-1"/>
            </div>
          </div>
          
          {preview && (
            <div className="relative w-full aspect-video rounded-md overflow-hidden border">
              <Image src={preview} alt="תצוגה מקדימה של קבלה" layout="fill" objectFit="contain" />
            </div>
          )}

        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={isPending}>ביטול</Button>
          <Button onClick={handleAnalyze} disabled={!file || isPending}>
            {isPending ? <Loader2 className="animate-spin ms-2" /> : <ScanLine className="ms-2 h-4 w-4" />}
            נתח קבלה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
