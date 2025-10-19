'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { ShiftsTable } from '@/components/shifts/shifts-table';
import { ShiftDialog } from '@/components/shifts/shift-dialog';
import type { Shift } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

export default function ShiftsPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedShift, setSelectedShift] = React.useState<Shift | null>(null);
  
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
  const { data: jobs, isLoading: jobsLoading } = useCollection(jobsQuery);

  const handleEdit = (shift: Shift) => {
    setSelectedShift(shift);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedShift(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedShift(null);
  };

  const isLoading = isUserLoading || shiftsLoading || jobsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">ניהול משמרות</h2>
            <p className="text-muted-foreground">הצג, הוסף וערוך את המשמרות שלך.</p>
        </div>
        <Button onClick={handleAddNew}>
          <PlusCircle className="ms-2 h-4 w-4" />
          הוסף משמרת
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <ShiftsTable shifts={shifts || []} jobs={jobs || []} onEdit={handleEdit} />
      )}
      <ShiftDialog
        isOpen={dialogOpen}
        onOpenChange={handleDialogClose}
        shift={selectedShift}
        jobs={jobs || []}
      />
    </div>
  );
}
