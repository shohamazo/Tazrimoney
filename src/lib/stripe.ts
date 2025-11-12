import Stripe from 'stripe';
import { config } from 'dotenv';

config(); // Load environment variables from .env file

export const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
    apiVersion: '2024-06-20',
    typescript: true,
});
