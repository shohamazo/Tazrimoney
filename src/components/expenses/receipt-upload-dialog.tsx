'use client';

import React, { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Upload, Camera, RefreshCw, CircleDot } from 'lucide-react';
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
        // First, try to get the back camera
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Could not get environment camera, falling back.", err);
        try {
            // If that fails, try getting any camera
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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

        // Validate the AI's output
        if (!result.amount || result.amount === 0 || !result.vendor) {
          setError("לא הצלחנו לחלץ את כל הפרטים מהקבלה. נסה לצלם תמונה ברורה יותר, בתאורה טובה, ונסה שוב.");
          return;
        }

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
    // Do not reset camera permission, as the user has already granted it.
    // setHasCameraPermission(null); 
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0">
        <div className="flex flex-col h-[80vh]">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>סריקת קבלה</DialogTitle>
            <DialogDescription>העלה תמונה או צלם קבלה והמערכת תנסה לחלץ את הפרטים.</DialogDescription>
          </DialogHeader>

          <div className="px-6 mt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload"><Upload className="ms-2 h-4 w-4" />העלאת קובץ</TabsTrigger>
                      <TabsTrigger value="camera"><Camera className="ms-2 h-4 w-4" />צילום</TabsTrigger>
                  </TabsList>
              </Tabs>
          </div>
          
          <div className="flex-1 min-h-0 p-6 pt-4">
              {error && (
                  <Alert variant="destructive" className="mb-4">
                      <AlertTitle>שגיאה</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                  </Alert>
              )}

              {activeTab === 'upload' && (
                <div className="h-full flex flex-col gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="receipt-file">בחר קובץ תמונה</Label>
                        <Input id="receipt-file" type="file" accept="image/*" onChange={handleFileChange} className="flex-1"/>
                    </div>
                    {preview && file && (
                        <div className="relative flex-1 w-full rounded-md overflow-hidden border">
                            <Image src={preview} alt="תצוגה מקדימה של קבלה" layout="fill" objectFit="contain" />
                        </div>
                    )}
                </div>
              )}
              
              {activeTab === 'camera' && (
                <div className="h-full w-full relative flex flex-col items-center justify-center">
                    <div className={cn("relative w-full h-full rounded-md overflow-hidden border bg-black flex items-center justify-center", preview && !file ? 'hidden' : 'flex' )}>
                        <video ref={videoRef} className={cn("w-full h-full object-contain", !hasCameraPermission && "hidden")} autoPlay muted playsInline />
                        {hasCameraPermission === false && <p className="text-destructive-foreground p-4 text-center">נדרשת גישה למצלמה. אנא אפשר גישה בהגדרות הדפדפן שלך.</p>}
                        {hasCameraPermission === null && <Loader2 className="h-8 w-8 animate-spin text-white" />}
                    </div>

                    {preview && !file && (
                        <div className="relative w-full h-full rounded-md overflow-hidden border">
                          <Image src={preview} alt="תצוגה מקדימה של קבלה" layout="fill" objectFit="contain" />
                        </div>
                    )}

                    <canvas ref={canvasRef} className="hidden"></canvas>
                    
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
                      {!preview ? (
                          <Button onClick={handleCapture} disabled={!hasCameraPermission} size="icon" className="w-16 h-16 rounded-full">
                              <CircleDot className="h-8 w-8" />
                          </Button>
                      ) : (
                          <Button onClick={handleRetake} variant="secondary" className="w-16 h-16 rounded-full" size="icon">
                              <RefreshCw className="h-7 w-7" />
                          </Button>
                      )}
                    </div>
                </div>
              )}
          </div>
          
          <DialogFooter className="p-6 pt-0 mt-auto border-t">
            <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={isPending}>ביטול</Button>
            <Button onClick={handleAnalyze} disabled={!preview || isPending}>
              {isPending ? <Loader2 className="animate-spin ms-2" /> : 'נתח קבלה'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
