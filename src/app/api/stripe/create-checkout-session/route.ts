import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
    try {
        const { uid, priceId } = await req.json();
        
        if (!uid || !priceId) {
            return new NextResponse('User ID and Price ID are required', { status: 400 });
        }

        const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/`;
        const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/upgrade`;

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
        console.error('[STRIPE_CHECKOUT_ERROR]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
