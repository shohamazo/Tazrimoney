'use client';

import { useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { resendVerificationEmail } from '@/firebase/auth-actions';
import { useToast } from '@/hooks/use-toast';
import { MailCheck, Loader2 } from 'lucide-react';
import React from 'react';

export default function VerifyEmailPage() {
  const { user } = useFirebase();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const handleResend = () => {
    startTransition(() => {
      resendVerificationEmail()
        .then(() => {
          toast({
            title: 'Email Sent',
            description: 'A new verification email has been sent to your address.',
          });
        })
        .catch((error) => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'Failed to send verification email.',
          });
        });
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <MailCheck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="mt-4">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to{' '}
            <span className="font-semibold text-foreground">{user?.email}</span>.
            Please check your inbox (and spam folder) to complete your registration.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Didn't receive an email?
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleResend} className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
            Resend Verification Email
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
