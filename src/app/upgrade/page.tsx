'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle, Wand2, ScanLine, X } from 'lucide-react';
import { GooglePayButton } from '@/components/premium/google-pay-button';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const premiumFeatures = [
  {
    icon: Wand2,
    title: 'דוחות וניתוחי AI',
    description: 'קבל תובנות חכמות וסיכומים אוטומטיים על הפעילות הפיננסית שלך.',
  },
  {
    icon: ScanLine,
    title: 'סריקת קבלות',
    description: 'צלם קבלה והמערכת תזין את ההוצאה עבורך באופן אוטומטי.',
  },
    {
    icon: CheckCircle,
    title: 'חוויה ללא פרסומות',
    description: 'תהנה משימוש נקי ורציף באפליקציה, ללא כל הפרעות.',
    },
];

export default function UpgradePage() {
  const router = useRouter();

  return (
    <div className="flex justify-center items-center py-8">
      <Card className="w-full max-w-lg relative">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 h-8 w-8 rounded-full"
          onClick={() => router.back()}
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </Button>
        <CardHeader className="text-center pt-12">
          <Wand2 className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="mt-4 text-3xl">שדרג ל-Tazrimoney Premium</CardTitle>
          <CardDescription>
            קח את ניהול הכספים שלך לשלב הבא עם כל יכולות ה-AI שלנו.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 bg-primary/10 text-primary p-2 rounded-full">
                    <feature.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{feature.title}</p>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            <div className="text-center">
                <p className="text-4xl font-bold">₪19.90</p>
                <p className="text-muted-foreground">לחודש</p>
            </div>
            <GooglePayButton />
            <p className="text-xs text-muted-foreground text-center">
                תוכל לבטל את המנוי בכל עת. התשלום יתבצע דרך Google Pay.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
