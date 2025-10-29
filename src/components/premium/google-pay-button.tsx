'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// This is a placeholder component for the Google Pay button.
// To fully implement this, you would need to:
// 1. Load the Google Pay JS library in your main layout.
// 2. Configure the button with your merchant ID and payment details.
// 3. Handle the payment response and send the token to your backend for processing.

export function GooglePayButton() {
  const { toast } = useToast();

  const handleGooglePayClick = () => {
    // In a real implementation, this would trigger the Google Pay API.
    // For now, we'll just show a placeholder toast message.
    toast({
      title: 'תכונה בפיתוח',
      description: 'התשלום באמצעות Google Pay עדיין לא מחובר.',
    });
  };

  return (
    <Button
      onClick={handleGooglePayClick}
      className="w-full h-12 bg-black text-white hover:bg-gray-800 flex items-center justify-center gap-2 text-lg"
    >
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#FFFFFF">
            <path d="M20,4H4C2.89,4,2,4.89,2,6v12c0,1.11,0.89,2,2,2h16c1.11,0,2-0.89,2-2V6C22,4.89,21.11,4,20,4z M10.4,14.6H7.6V9.4h2.8 c1.21,0,2.1,0.9,2.1,2.1S11.61,14.6,10.4,14.6z" fillOpacity="0.54"/>
            <path d="M10.4,10.5H8.7v3h1.7c0.66,0,1.2-0.54,1.2-1.2S11.06,10.5,10.4,10.5z"/>
            <path d="M16.5,14.6h-1.4l-1-1.89h-0.8v1.89h-1.1V9.4h2.9c1.21,0,2.1,0.9,2.1,2.1c0,0.85-0.5,1.59-1.23,1.91L16.5,14.6z M14.3,10.5h-1.7v1.8h1.7c0.66,0,1.2-0.54,1.2-1.2S14.96,10.5,14.3,10.5z"/>
        </svg>
      <span>Pay</span>
    </Button>
  );
}
