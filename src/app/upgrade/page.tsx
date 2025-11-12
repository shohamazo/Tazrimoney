'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { X, CheckCircle2, Wand2, Settings, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';

const tiers = [
  {
    name: 'Free',
    priceId: null,
    yearlyPriceId: null,
    price: 0,
    yearlyPrice: 0,
    features: [
      'ניהול הכנסות והוצאות',
      'ניהול תקציב',
      'סריקת קבלות (עד 5 בחודש)',
      'דוחות חודשיים בסיסיים',
    ],
    isPro: false,
    isFree: true,
  },
  {
    name: 'Basic',
    priceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID,
    yearlyPriceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID,
    price: 10,
    yearlyPrice: 100,
    features: [
      'ניהול הכנסות והוצאות',
      'ניהול תקציב',
      'סריקת קבלות (עד 20 בחודש)',
      'דוחות AI (עדכון שבועי)',
    ],
    isPro: false,
    isFree: false,
  },
  {
    name: 'Pro',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
    yearlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
    price: 20,
    yearlyPrice: 192,
    features: [
      'כל יכולות ה-Basic',
      'סריקת קבלות ללא הגבלה',
      'דוחות AI מתקדמים (עדכון יומי)',
      'תחזיות והמלצות מותאמות אישית',
      'תמיכה קודמת במייל',
    ],
    isPro: true,
    isFree: false,
  },
];

// Lazily load Stripe.js
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function UpgradePage() {
  const router = useRouter();
  const { user, userProfile } = useFirebase();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubscribe = (tier: typeof tiers[0]) => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Please log in',
            description: 'You must be logged in to subscribe.',
        });
        return;
    }

    startTransition(async () => {
        const priceId = billingInterval === 'monthly' ? tier.priceId : tier.yearlyPriceId;
        if (!priceId) return;

        try {
            // 1. Create a checkout session on the server
            const response = await fetch('/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: user.uid, priceId: priceId }),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error("Checkout session creation failed:", errorBody);
                throw new Error('Failed to create checkout session.');
            }

            const session = await response.json();

            // 2. Redirect to Stripe Checkout
            const stripe = await stripePromise;
            if (!stripe) {
                throw new Error('Stripe.js has not loaded yet.');
            }

            const { error } = await stripe.redirectToCheckout({
                sessionId: session.id,
            });

            if (error) {
                console.error("Stripe redirection error:", error);
                throw new Error(error.message);
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Could not start the payment process.',
            });
        }
    });
  };

  const currentTier = userProfile?.tier || 'free';

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

            <div className="flex justify-center mb-8">
                 <Tabs value={billingInterval} onValueChange={(value) => setBillingInterval(value as any)} className="w-auto">
                    <TabsList>
                        <TabsTrigger value="monthly">חיוב חודשי</TabsTrigger>
                        <TabsTrigger value="yearly">חיוב שנתי (חסוך עד 20%)</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {tiers.map((tier) => (
                    <Card key={tier.name} className={cn("flex flex-col", tier.isPro && "border-primary shadow-lg", currentTier === tier.name.toLowerCase() && "ring-2 ring-primary")}>
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2">{tier.isPro && <Wand2 className="text-primary"/>}{tier.name}</CardTitle>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold">₪{billingInterval === 'monthly' || tier.isFree ? tier.price : tier.yearlyPrice}</span>
                                {!tier.isFree && <span className="text-muted-foreground">/ {billingInterval === 'monthly' ? 'חודש' : 'שנה'}</span>}
                            </div>
                            {!tier.isFree && <CardDescription>
                                {billingInterval === 'monthly'
                                ? `חויב חודשית.`
                                : `שווה ערך ל-₪${Math.round(tier.yearlyPrice / 12)} לחודש. חסוך ${Math.round(100 - (tier.yearlyPrice / (tier.price * 12)) * 100)}%!`}
                            </CardDescription>}
                        </CardHeader>
                        <CardContent className="flex-1 space-y-3">
                            <p className="font-semibold">מה כלול:</p>
                             <ul className="space-y-2">
                                {tier.features.map((feature, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            {currentTier === tier.name.toLowerCase() ? (
                                <Button className="w-full" disabled variant="outline">
                                    התוכנית הנוכחית שלך
                                </Button>
                            ) : tier.isFree ? (
                                 <Button asChild className="w-full" variant="secondary">
                                    <a href="/settings"><Settings className="ms-2 h-4 w-4"/>נהל מנוי</a>
                                </Button>
                            ) : (
                                <Button 
                                    className="w-full" 
                                    variant={tier.isPro ? 'default' : 'outline'}
                                    onClick={() => handleSubscribe(tier)}
                                    disabled={isPending}
                                >
                                    {isPending && <Loader2 className="animate-spin ms-2 h-4 w-4" />}
                                    בחר {tier.name}
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <div className="mt-8 text-center text-xs text-muted-foreground">
                <p>התשלומים מאובטחים. ניתן לבטל את המנוי בכל עת דרך עמוד ההגדרות.</p>
            </div>
        </div>
    </div>
  );
}