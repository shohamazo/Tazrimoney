'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ShiftsTable } from '@/components/shifts/shifts-table';
import { ShiftDialog } from '@/components/shifts/shift-dialog';
import type { Shift } from '@/lib/types';

export default function ShiftsPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedShift, setSelectedShift] = React.useState<Shift | null>(null);

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
      <ShiftsTable onEdit={handleEdit} />
      <ShiftDialog
        isOpen={dialogOpen}
        onOpenChange={handleDialogClose}
        shift={selectedShift}
      />
    </div>
  );
}
