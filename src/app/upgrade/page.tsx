'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Check, Info, Sparkles, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useFirebase } from '@/firebase';
import { PremiumBadge } from '@/components/premium/premium-badge';
import { useToast } from '@/hooks/use-toast';

const tiers = [
  {
    name: 'Free',
    price: '₪0',
    priceDescription: 'ללא עלות',
    features: [
      'ניהול משמרות והוצאות',
      'מחשבון עלות-עבודה',
      'תמיכה בסיסית',
      'כולל פרסומות',
    ],
    isCurrent: false,
    cta: 'התוכנית הנוכחית שלך',
  },
  {
    name: 'Basic',
    price: '₪10',
    priceDescription: 'לחודש',
    features: [
      'כל יכולות ה-Free',
      'סריקת קבלות (AI)',
      'דוחות וניתוחי AI',
      'חוויה ללא פרסומות',
    ],
    isCurrent: false,
    cta: 'בחר תוכנית',
    badge: <PremiumBadge tier="Basic" />,
  },
  {
    name: 'Pro',
    price: 'בקרוב',
    priceDescription: 'יתומחר בהמשך',
    features: [
      'כל יכולות ה-Basic',
      'סנכרון אוטומטי לבנקים',
      'תובנות והתראות חכמות',
      'תמיכה מועדפת',
    ],
    isCurrent: false,
    cta: 'בקרוב',
    badge: <PremiumBadge tier="Pro" />,
  },
];

export default function UpgradePage() {
  const router = useRouter();
  const { userProfile } = useFirebase();
  const { toast } = useToast();

  const handleChoosePlan = (tierName: string) => {
    if(tierName === 'Pro' || tierName === 'Basic'){
         toast({
            title: 'בקרוב...',
            description: `התשלום עבור תוכנית ${tierName} יהיה זמין בקרוב.`,
        });
    }
  }

  const currentTierName = userProfile?.tier || 'free';

  return (
    <div className="bg-muted/40 min-h-screen w-full p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-end mb-4">
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full bg-background"
                    onClick={() => router.back()}
                    >
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close</span>
                 </Button>
            </div>
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold tracking-tight">שדרג את התוכנית שלך</h1>
                <p className="mt-2 text-lg text-muted-foreground">בחר את התוכנית המתאימה ביותר לצרכים שלך.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {tiers.map((tier) => {
                    const isCurrent = tier.name.toLowerCase() === currentTierName;
                    const isRecommended = tier.name === 'Basic';

                    return (
                        <Card key={tier.name} className={cn("flex flex-col h-full", isRecommended && 'border-primary border-2 shadow-lg')}>
                            {isRecommended && (
                                <div className="py-2 px-4 bg-primary text-primary-foreground text-sm font-semibold text-center rounded-t-lg">
                                    הכי פופולרי
                                </div>
                            )}
                            <CardHeader className="text-center">
                                <div className="flex justify-center items-center gap-2">
                                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                                    {tier.badge}
                                </div>
                                <div className="mt-4">
                                    <span className="text-4xl font-bold">{tier.price}</span>
                                    <span className="text-muted-foreground">{tier.priceDescription}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-4 text-sm text-muted-foreground">
                                    {tier.features.map((feature, index) => (
                                        <li key={index} className="flex items-center gap-3">
                                            <Check className="h-5 w-5 text-green-500" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button 
                                    className="w-full" 
                                    disabled={isCurrent || tier.name === 'Pro'} 
                                    variant={isRecommended ? 'default' : 'outline'}
                                    onClick={() => handleChoosePlan(tier.name)}
                                >
                                    {isCurrent ? 'התוכנית הנוכחית' : tier.cta}
                                </Button>
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>

            <div className="mt-8 text-center text-xs text-muted-foreground">
                <p>התשלומים מאובטחים. ניתן לבטל את המנוי בכל עת.</p>
            </div>
        </div>
    </div>
  );
}
