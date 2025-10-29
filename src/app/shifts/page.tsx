'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { ShiftsTable } from '@/components/shifts/shifts-table';
import { ShiftDialog } from '@/components/shifts/shift-dialog';
import type { Shift, Job } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { ClockInOut } from '@/components/shifts/clock-in-out';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';

export default function ShiftsPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedShift, setSelectedShift] = React.useState<Shift | null>(null);
  const [showNoJobsAlert, setShowNoJobsAlert] = useState(false);
  const router = useRouter();

  const { firestore, user, isUserLoading } = useFirebase();

  const shiftsQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(collection(firestore, 'users', user.uid, 'shifts'), orderBy('start', 'desc'))
        : null,
    [firestore, user]
  );
  const { data: shifts, isLoading: shiftsLoading } = useCollection<Shift>(shiftsQuery);
  
  const jobsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users', user.uid, 'jobs') : null),
    [firestore, user]
  );
  const { data: jobs, isLoading: jobsLoading } = useCollection<Job>(jobsQuery);

  const isLoading = isUserLoading || shiftsLoading || jobsLoading;

  useEffect(() => {
    // Only trigger the alert if loading is finished and there are no jobs.
    if (!isLoading && jobs && jobs.length === 0) {
      setShowNoJobsAlert(true);
    }
  }, [isLoading, jobs]);


  const handleEdit = (shift: Shift) => {
    setSelectedShift(shift);
    setDialogOpen(true);
  };
  
  const handleAddNew = () => {
    if (!jobs || jobs.length === 0) {
      setShowNoJobsAlert(true);
      return;
    }
    setSelectedShift(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedShift(null);
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">ניהול משמרות</h2>
            <p className="text-muted-foreground">התחל משמרת חדשה או הצג, וערוך את המשמרות הקודמות שלך.</p>
        </div>
        <Button onClick={handleAddNew}>
            <PlusCircle className="ms-2 h-4 w-4" />
            הוסף משמרת
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <>
            <ClockInOut jobs={jobs || []} />
            <ShiftsTable shifts={shifts || []} jobs={jobs || []} onEdit={handleEdit} />
        </>
      )}

      <ShiftDialog
        isOpen={dialogOpen}
        onOpenChange={handleDialogClose}
        shift={selectedShift}
        jobs={jobs || []}
      />
      <AlertDialog open={showNoJobsAlert} onOpenChange={setShowNoJobsAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>יש להגדיר עבודה תחילה</AlertDialogTitle>
            <AlertDialogDescription>
              כדי להתחיל לתעד משמרות או להשתמש בשעון הנוכחות, עליך להגדיר לפחות עבודה אחת עם תעריף שעתי.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => router.push('/jobs')}>
              עבור לדף עבודות
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
