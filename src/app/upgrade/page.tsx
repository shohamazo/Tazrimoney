
'use client';

import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { StripePricingTable } from '@/components/premium/stripe-pricing-table';

export default function UpgradePage() {
  const router = useRouter();
  const { user } = useFirebase();

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
            
            {user && (
              <StripePricingTable pricingTableId={process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID!} publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!} userId={user.uid} />
            )}

            <div className="mt-8 text-center text-xs text-muted-foreground">
                <p>התשלומים מאובטחים. ניתן לבטל את המנוי בכל עת דרך עמוד ההגדרות.</p>
            </div>
        </div>
    </div>
  );
}
