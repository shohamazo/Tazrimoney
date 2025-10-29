'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { Budget } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { categoryIcons } from '@/lib/category-icons';
import { Package, Plus } from 'lucide-react';

interface AddBudgetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  inactiveBudgets: Budget[];
  onCategorySelect: (category: string) => void;
}

export function AddBudgetDialog({ isOpen, onOpenChange, inactiveBudgets, onCategorySelect }: AddBudgetDialogProps) {

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>הוספת קטגוריית תקציב</DialogTitle>
          <DialogDescription>
            בחר קטגוריה מהרשימה כדי להגדיר לה תקציב חודשי.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-72 my-4">
            <div className="space-y-2 pr-2">
                {inactiveBudgets.map(budget => {
                    const Icon = categoryIcons[budget.category] || Package;
                    return (
                        <button 
                            key={budget.category} 
                            onClick={() => onCategorySelect(budget.category)}
                            className="w-full flex items-center justify-between p-3 rounded-md text-sm font-medium hover:bg-accent transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Icon className="h-5 w-5 text-muted-foreground" />
                                <span>{budget.category}</span>
                            </div>
                            <Plus className="h-5 w-5 text-primary"/>
                        </button>
                    )
                })}
                 {inactiveBudgets.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">כל קטגוריות התקציב כבר בשימוש.</p>
                )}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
