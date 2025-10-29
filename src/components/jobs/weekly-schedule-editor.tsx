'use client';

import React from 'react';
import { useForm, useFieldArray, Controller, Control } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

const days: { key: DayOfWeek, label: string }[] = [
    { key: 'sunday', label: 'יום ראשון' },
    { key: 'monday', label: 'יום שני' },
    { key: 'tuesday', label: 'יום שלישי' },
    { key: 'wednesday', label: 'יום רביעי' },
    { key: 'thursday', label: 'יום חמישי' },
    { key: 'friday', label: 'יום שישי' },
    { key: 'saturday', label: 'יום שבת' },
];

interface WeeklyScheduleEditorProps {
    control: Control<any>;
}

export function WeeklyScheduleEditor({ control }: WeeklyScheduleEditorProps) {

    return (
        <div className="space-y-4">
            {days.map((day, index) => (
                <div key={day.key} className="flex flex-col sm:flex-row items-center gap-4 p-3 border rounded-lg">
                    <div className="flex items-center gap-3 w-full sm:w-32">
                         <Controller
                            name={`weeklySchedule.${day.key}.enabled`}
                            control={control}
                            render={({ field }) => (
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    aria-label={`Enable ${day.label}`}
                                />
                            )}
                        />
                        <Label className="font-medium">{day.label}</Label>
                    </div>
                     <Controller
                        name={`weeklySchedule.${day.key}.enabled`}
                        control={control}
                        render={({ field: { value: isEnabled } }) => (
                            <div className={cn("flex items-center gap-2 flex-1", !isEnabled && "opacity-50 pointer-events-none")}>
                                <div className="flex items-center gap-2">
                                     <Controller
                                        name={`weeklySchedule.${day.key}.startTime`}
                                        control={control}
                                        render={({ field }) => <Input type="time" {...field} className="w-28" />}
                                    />
                                    <span>-</span>
                                     <Controller
                                        name={`weeklySchedule.${day.key}.endTime`}
                                        control={control}
                                        render={({ field }) => <Input type="time" {...field} className="w-28" />}
                                    />
                                </div>
                            </div>
                        )}
                    />
                </div>
            ))}
        </div>
    );
}
