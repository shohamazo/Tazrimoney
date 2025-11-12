import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/firebase/firebase-admin';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
    try {
        const { uid } = await req.json();
        
        if (!uid) {
            return new NextResponse('User not found', { status: 400 });
        }

        const admin = await getFirebaseAdmin();
        const firestore = admin.firestore();
        const userDoc = await firestore.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            return new NextResponse('User not found in database', { status: 404 });
        }

        const userProfile = userDoc.data();
        let customerId = userProfile?.stripeCustomerId;

        // If the user does not have a Stripe Customer ID, create one.
        // This is crucial for users who have never subscribed but want to view the portal.
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: userProfile?.email,
                metadata: { userId: uid },
                name: userProfile?.displayName || undefined,
            });
            customerId = customer.id;
            await firestore.collection('users').doc(uid).update({ stripeCustomerId: customerId });
             console.log(`Created Stripe customer ${customerId} for user ${uid}`);
        }
        
        const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings`;

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });

        return new NextResponse(JSON.stringify({ url: portalSession.url }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('[STRIPE_PORTAL_ERROR]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
