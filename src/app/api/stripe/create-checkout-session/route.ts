import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { config } from 'dotenv';

config(); // Ensure all environment variables are loaded

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

        const successUrl = `${appUrl}/`;
        const cancelUrl = `${appUrl}/upgrade`;

        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            client_reference_id: uid, // Pass Firebase UID to identify user in webhook
            success_url: successUrl,
            cancel_url: cancelUrl,
        });

        return new NextResponse(JSON.stringify({ id: checkoutSession.id }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        // Log the detailed error from Stripe on the server
        console.error('[STRIPE_CHECKOUT_ERROR]', error);
        // Return a generic error message to the client
        return new NextResponse('Internal Error: Could not create checkout session.', { status: 500 });
    }
}
