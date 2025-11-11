'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Check, Info, Sparkles, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useFirebase } from '@/firebase';
import { PremiumBadge } from '@/components/premium/premium-badge';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

const tiers = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'ניהול משמרות והוצאות',
      'מחשבון עלות-עבודה',
      'תמיכה בסיסית',
      'כולל פרסומות',
    ],
    cta: 'התוכנית הנוכחית שלך',
  },
  {
    name: 'Basic',
    monthlyPrice: 10,
    yearlyPrice: 8.4, // 10 * 12 * (1 - 0.16) / 12
    features: [
      'כל יכולות ה-Free',
      'סריקת קבלות (AI)',
      'דוחות וניתוחי AI',
      'חוויה ללא פרסומות',
    ],
    cta: 'בחר תוכנית',
    badge: <PremiumBadge tier="Basic" />,
  },
  {
    name: 'Pro',
    monthlyPrice: 20,
    yearlyPrice: 16, // 20 * 12 * (1 - 0.20) / 12
    features: [
      'כל יכולות ה-Basic',
      'סנכרון אוטומטי לבנקים',
      'תובנות והתראות חכמות',
      'תמיכה מועדפת',
    ],
    cta: 'בקרוב',
    badge: <PremiumBadge tier="Pro" />,
  },
];

export default function UpgradePage() {
  const router = useRouter();
  const { userProfile } = useFirebase();
  const { toast } = useToast();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');


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

            <div className="flex justify-center items-center gap-4 mb-8">
                <Label htmlFor="billing-cycle" className={cn(billingCycle === 'monthly' ? 'text-primary' : 'text-muted-foreground')}>חיוב חודשי</Label>
                <Switch
                    id="billing-cycle"
                    checked={billingCycle === 'yearly'}
                    onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
                    aria-label="Toggle billing cycle"
                />
                <Label htmlFor="billing-cycle" className={cn(billingCycle === 'yearly' ? 'text-primary' : 'text-muted-foreground')}>
                    חיוב שנתי
                </Label>
                <Badge variant="secondary" className="bg-accent/20 text-accent border-accent/30">חסוך עד 20%</Badge>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {tiers.map((tier) => {
                    const isCurrent = tier.name.toLowerCase() === currentTierName;
                    const isRecommended = tier.name === 'Basic';
                    const price = billingCycle === 'yearly' ? tier.yearlyPrice : tier.monthlyPrice;
                    const priceDescription = billingCycle === 'yearly' && tier.name !== 'Free' ? 'לחודש, בחיוב שנתי' : 'לחודש';

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
                                <div className="mt-4 h-20">
                                    <span className="text-4xl font-bold">₪{price.toLocaleString()}</span>
                                    <span className="text-muted-foreground">{priceDescription}</span>
                                    {billingCycle === 'yearly' && tier.name === 'Basic' && <p className="text-sm text-accent font-medium">חסוך 16%</p>}
                                    {billingCycle === 'yearly' && tier.name === 'Pro' && <p className="text-sm text-accent font-medium">חסוך 20%</p>}

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
                                    disabled={isCurrent || (tier.name === 'Pro' && billingCycle === 'monthly') || (tier.name === 'Pro' && billingCycle === 'yearly')} 
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
