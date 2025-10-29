'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wand2, Sparkles } from 'lucide-react';

interface UpgradeTierCardProps {
    featureName: string;
}

export function UpgradeTierCard({ featureName }: UpgradeTierCardProps) {
    return (
        <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20">
            <CardHeader>
                <div className="flex items-center gap-3">
                     <div className="p-3 bg-accent rounded-full">
                        <Wand2 className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <div>
                        <CardTitle className="text-primary">שדרג ופתח את {featureName}</CardTitle>
                        <CardDescription>תכונה זו זמינה למשתמשי פרימיום בלבד.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="mb-4">
                    שדרג את החשבון שלך כדי ליהנות מכל יכולות ה-AI, כולל ניתוח קבלות אוטומטי, דוחות כספיים חכמים, הצעות תקציב מותאמות אישית ועוד.
                </p>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Sparkles className="ms-2 h-4 w-4" />
                    שדרג לפרימיום
                </Button>
            </CardContent>
        </Card>
    );
}
