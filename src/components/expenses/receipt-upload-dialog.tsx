'use client';

import React, { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Upload, ScanLine, Camera, RefreshCw, CircleDot } from 'lucide-react';
import { analyzeReceipt } from '@/ai/flows/analyze-receipt-flow';
import { useToast } from '@/hooks/use-toast';
import type { Expense } from '@/lib/types';
import { cn } from '@/lib/utils';


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

  const [activeTab, setActiveTab] = useState('upload');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);


  const getCameraPermission = useCallback(async () => {
    if (hasCameraPermission === null) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setError("גישה למצלמה נדחתה. אנא אפשר גישה בהגדרות הדפדפן.");
      }
    }
  }, [hasCameraPermission]);

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      getCameraPermission();
    } else if (!isOpen || activeTab !== 'camera') {
      // Stop camera stream when dialog is closed or tab is switched
      const stream = videoRef.current?.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        videoRef.current!.srcObject = null;
      }
    }
  }, [isOpen, activeTab, getCameraPermission]);


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

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    const dataUri = canvas.toDataURL('image/jpeg');
    setPreview(dataUri);
    setFile(null); // Reset file upload if photo is taken
  };

  const handleRetake = () => {
    setPreview(null);
  };

  const handleAnalyze = () => {
    if (!preview) return;

    startTransition(async () => {
      setError(null);
      try {
        const result = await analyzeReceipt({ photoDataUri: preview });
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
    setHasCameraPermission(null);
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
          <DialogDescription>העלה תמונה או צלם קבלה והמערכת תנסה לחלץ את הפרטים.</DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload"><Upload className="ms-2 h-4 w-4" />העלאת קובץ</TabsTrigger>
                <TabsTrigger value="camera"><Camera className="ms-2 h-4 w-4" />צילום</TabsTrigger>
            </TabsList>
            <div className="py-4">
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertTitle>שגיאה</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <TabsContent value="upload">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="receipt-file">בחר קובץ תמונה</Label>
                            <Input id="receipt-file" type="file" accept="image/*" onChange={handleFileChange} className="flex-1"/>
                        </div>
                        {preview && file && (
                            <div className="relative w-full aspect-video rounded-md overflow-hidden border">
                                <Image src={preview} alt="תצוגה מקדימה של קבלה" layout="fill" objectFit="contain" />
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="camera">
                     <div className="space-y-4">
                        {!preview && (
                            <div className={cn("relative w-full aspect-video rounded-md overflow-hidden border bg-black", !hasCameraPermission && "flex items-center justify-center")}>
                                <video ref={videoRef} className={cn("w-full h-full object-contain", !hasCameraPermission && "hidden")} autoPlay muted playsInline />
                                {hasCameraPermission === false && <p className="text-destructive-foreground p-4 text-center">נדרשת גישה למצלמה. אנא אפשר גישה בהגדרות הדפדפן שלך.</p>}
                                {hasCamerašení === null && <Loader2 className="h-8 w-8 animate-spin text-white" />}
                            </div>
                        )}
                         {preview && !file && (
                             <div className="relative w-full aspect-video rounded-md overflow-hidden border">
                                <Image src={preview} alt="תצוגה מקדימה של קבלה" layout="fill" objectFit="contain" />
                            </div>
                        )}
                        <canvas ref={canvasRef} className="hidden"></canvas>
                        
                        {!preview ? (
                            <Button onClick={handleCapture} disabled={!hasCameraPermission} className="w-full">
                                <CircleDot className="ms-2 h-4 w-4" />
                                צלם
                            </Button>
                        ) : (
                            <Button onClick={handleRetake} variant="outline" className="w-full">
                                <RefreshCw className="ms-2 h-4 w-4" />
                                צלם שוב
                            </Button>
                        )}
                    </div>
                </TabsContent>
            </div>
        </Tabs>
        
        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={isPending}>ביטול</Button>
          <Button onClick={handleAnalyze} disabled={!preview || isPending}>
            {isPending ? <Loader2 className="animate-spin ms-2" /> : <ScanLine className="ms-2 h-4 w-4" />}
            נתח קבלה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
