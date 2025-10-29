'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function WorkGrantInfoCard() {
  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          מענק עבודה (מס הכנסה שלילי)
        </CardTitle>
        <CardDescription>
            שמת לב שאחת העבודות שלך עשויה להיות זכאית למענק עבודה. בדוק אם אתה עומד בתנאים!
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
            <p className="text-sm">
                מענק עבודה הוא הטבה מהמדינה לעובדים שכירים ועצמאים בעלי הכנסה נמוכה.
                הזכאות תלויה בגורמים כמו הכנסה שנתית, גיל, מצב משפחתי ועוד.
            </p>
        </div>
        <Button asChild>
            <Link href="https://www.gov.il/he/service/work_grant_2022" target="_blank" rel="noopener noreferrer">
                 <ExternalLink className="ms-2 h-4 w-4" />
                 מידע נוסף ובדיקת זכאות
            </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
