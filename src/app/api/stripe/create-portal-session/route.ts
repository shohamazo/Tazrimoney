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

        if (!customerId) {
            // This is a fallback. Ideally, the customer ID is created upon first checkout.
            const customer = await stripe.customers.create({
                email: userProfile?.email,
                metadata: { userId: uid },
            });
            customerId = customer.id;
            await firestore.collection('users').doc(uid).update({ stripeCustomerId: customerId });
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
