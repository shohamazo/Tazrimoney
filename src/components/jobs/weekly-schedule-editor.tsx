'use client';

import React, { useEffect } from 'react';
import { useForm, useFieldArray, Controller, Control, useWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { addHours, setHours, setMinutes, min, format, parse } from 'date-fns';


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

// A new component to encapsulate the logic for a single day
function DayRow({ day, control }: { day: { key: DayOfWeek, label: string }, control: Control<any> }) {
    const isEnabled = useWatch({ control, name: `weeklySchedule.${day.key}.enabled` });
    const startTime = useWatch({ control, name: `weeklySchedule.${day.key}.startTime` });
    
    // We need setValue from the form, so we get it from the control object.
    const { setValue } = useForm({ control });


    useEffect(() => {
        if (!isEnabled || !startTime || !/^\d{2}:\d{2}$/.test(startTime)) {
            return;
        }

        const today = new Date();
        const startDateTime = parse(startTime, 'HH:mm', today);

        if (isNaN(startDateTime.getTime())) return;

        const suggestedEndDateTime = addHours(startDateTime, 7);
        const capDateTime = setHours(setMinutes(today, 0), 23);

        const finalEndDateTime = min([suggestedEndDateTime, capDateTime]);
        
        // This check prevents an infinite loop if the user has already set the same end time
        const currentEndTime = control._getWatch(`weeklySchedule.${day.key}.endTime`);
        const formattedNewEndTime = format(finalEndDateTime, 'HH:mm');

        if(currentEndTime !== formattedNewEndTime) {
            setValue(`weeklySchedule.${day.key}.endTime`, formattedNewEndTime, { shouldDirty: true });
        }
        
    }, [startTime, isEnabled, day.key, setValue, control]);

    return (
        <div className="flex flex-col sm:flex-row items-center gap-4 p-3 border rounded-lg">
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
        </div>
    );
}

export function WeeklyScheduleEditor({ control }: WeeklyScheduleEditorProps) {

    return (
        <div className="space-y-4">
            {days.map((day) => (
                <DayRow key={day.key} day={day} control={control} />
            ))}
        </div>
    );
}
