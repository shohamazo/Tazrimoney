import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { getFirebaseAdmin } from '@/firebase/firebase-admin';

// Helper function to map Stripe Price ID to our internal tier name
function priceIdToTier(priceId: string): 'basic' | 'pro' | null {
    if ([process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID, process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID].includes(priceId)) {
        return 'basic';
    }
    if ([process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID, process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID].includes(priceId)) {
        return 'pro';
    }
    return null;
}

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
        if (!webhookSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET is not set');
        }
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`❌ Webhook signature verification failed: ${err.message}`);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    
    try {
        const admin = await getFirebaseAdmin();
        const firestore = admin.firestore();

        // Handle checkout session completion
        if (event.type === 'checkout.session.completed') {
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            
            const userId = session.client_reference_id;
            const customerId = session.customer as string;

            if (!userId) {
                console.error('Webhook Error: No userId in session metadata (client_reference_id)');
                return new NextResponse('User ID missing', { status: 400 });
            }

            const priceId = subscription.items.data[0].price.id;
            const newTier = priceIdToTier(priceId);

            if (!newTier) {
                console.error(`Webhook Error: Unrecognized Price ID: ${priceId}`);
                return new NextResponse('Unrecognized Price ID', { status: 400 });
            }

            // Create or update stripeCustomerId when checkout is complete
            await firestore.collection('users').doc(userId).update({
                stripeCustomerId: customerId,
                tier: newTier,
                stripeSubscriptionId: subscription.id,
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cachedReport: null, // Reset cache on upgrade
                lastReportDate: null,
            });
            console.log(`✅ Updated user ${userId} to tier ${newTier}`);
        }
        // Handle subscription updates (e.g., cancellations, plan changes)
        else if (event.type === 'customer.subscription.updated') {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;
            
            const usersRef = firestore.collection('users');
            const q = usersRef.where('stripeCustomerId', '==', customerId);
            const userSnapshot = await q.get();

            if (userSnapshot.empty) {
                console.error(`Webhook Error: No user found for customer ID ${customerId}`);
                return new NextResponse('User not found', { status: 404 });
            }

            const userDoc = userSnapshot.docs[0];
            const userId = userDoc.id;

            const priceId = subscription.items.data[0].price.id;
            const newTier = priceIdToTier(priceId);

            await firestore.collection('users').doc(userId).update({
                tier: newTier,
                stripeSubscriptionId: subscription.id,
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            });
             console.log(`✅ Updated subscription for user ${userId} to tier ${newTier}`);
        }
         // Handle subscription deletion (e.g., after cancellation)
        else if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;
            
            const usersRef = firestore.collection('users');
            const q = usersRef.where('stripeCustomerId', '==', customerId);
            const userSnapshot = await q.get();

            if (userSnapshot.empty) {
                console.error(`Webhook Error: No user found for customer ID ${customerId}`);
                return new NextResponse('User not found', { status: 404 });
            }

            const userDoc = userSnapshot.docs[0];

            // Downgrade user to free tier
            await firestore.collection('users').doc(userDoc.id).update({
                tier: 'free',
                stripeSubscriptionId: null,
                stripeCurrentPeriodEnd: null,
            });
            console.log(`✅ Downgraded user ${userDoc.id} to free tier after subscription deletion.`);
        }

    } catch (error) {
        console.error('Webhook handler error:', error);
        return new NextResponse('Internal webhook handler error', { status: 500 });
    }

    return new NextResponse(null, { status: 200 });
}
