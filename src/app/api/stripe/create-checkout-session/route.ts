
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getFirebaseAdmin } from '@/firebase/firebase-admin';
import "dotenv/config";

export async function POST(req: Request) {
    try {
        const { uid, priceId } = await req.json();
        
        if (!uid || !priceId) {
            console.error('[STRIPE_CHECKOUT_ERROR] Missing uid or priceId');
            return new NextResponse('User ID and Price ID are required', { status: 400 });
        }
        
        const appUrl = process.env.NEXT_PUBLIC_APP_URL;
        if (!appUrl) {
            console.error('[STRIPE_CHECKOUT_ERROR] NEXT_PUBLIC_APP_URL is not set in .env file');
            return new NextResponse('Server configuration error: App URL is not defined.', { status: 500 });
        }
        
        const admin = await getFirebaseAdmin();
        const firestore = admin.firestore();
        const userDocRef = firestore.collection('users').doc(uid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            console.error(`[STRIPE_CHECKOUT_ERROR] User with UID ${uid} not found in database.`);
            return new NextResponse('User not found in database', { status: 404 });
        }

        const userProfile = userDoc.data();
        let customerId = userProfile?.stripeCustomerId;

        // If the user does not have a Stripe Customer ID, create one.
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: userProfile?.email,
                metadata: { userId: uid },
                name: userProfile?.displayName || undefined,
            });
            customerId = customer.id;
            await userDocRef.update({ stripeCustomerId: customerId });
            console.log(`[STRIPE] Created Stripe customer ${customerId} for user ${uid}`);
        }

        const successUrl = `${appUrl}/?success=true&session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${appUrl}/upgrade?canceled=true`;

        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            billing_address_collection: 'auto',
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            customer: customerId,
            client_reference_id: uid,
            success_url: successUrl,
            cancel_url: cancelUrl,
        });

        return new NextResponse(JSON.stringify({ id: checkoutSession.id }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        // Log the detailed error from Stripe on the server
        console.error('[STRIPE_CHECKOUT_ERROR] Failed to create session:', error);
        // Return a generic error message to the client
        return new NextResponse('Internal Error: Could not create checkout session.', { status: 500 });
    }
}
