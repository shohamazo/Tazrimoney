'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PiggyBank, Loader2 } from 'lucide-react';
import {
  handleGoogleSignIn,
  handlePasswordSignUp,
  handlePasswordSignIn,
  sendPhoneVerificationCode,
  verifyPhoneCode,
} from '@/firebase/auth-actions';
import { useTransition, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Auth, RecaptchaVerifier } from 'firebase/auth';
import { useFirebase } from '@/firebase';

const identifierSchema = z.string().min(1, 'Please enter an email or phone number.');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters.');
const codeSchema = z.string().min(6, 'Verification code must be 6 characters.');

const isEmail = (identifier: string) => z.string().email().safeParse(identifier).success;

type LoginStep = 'identifier' | 'password' | 'code';

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [loginStep, setLoginStep] = useState<LoginStep>('identifier');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [identifier, setIdentifier] = useState('');
  const [isIdentifierEmail, setIsIdentifierEmail] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const { toast } = useToast();
  const router = useRouter();
  const { auth } = useFirebase();

  // Initialize reCAPTCHA verifier
  useEffect(() => {
    if (!auth) return;
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'callback': () => {
        // reCAPTCHA solved, allow sign-in
      }
    });

    return () => {
      window.recaptchaVerifier?.clear();
    };
  }, [auth]);

  const {
    register: registerIdentifier,
    handleSubmit: handleSubmitIdentifier,
    formState: { errors: identifierErrors },
  } = useForm<{ identifier: string }>({
    resolver: zodResolver(z.object({ identifier: identifierSchema })),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
  } = useForm<{ password: string }>({
    resolver: zodResolver(z.object({ password: passwordSchema })),
  });

  const {
    register: registerCode,
    handleSubmit: handleSubmitCode,
    formState: { errors: codeErrors },
  } = useForm<{ code: string }>({
    resolver: zodResolver(z.object({ code: codeSchema })),
  });

  const handleIdentifierSubmit = (data: { identifier: string }) => {
    const isMail = isEmail(data.identifier);
    setIdentifier(data.identifier);
    setIsIdentifierEmail(isMail);

    if (isMail) {
      setLoginStep('password');
    } else {
      // Phone number flow
      startTransition(async () => {
        try {
          const verifier = window.recaptchaVerifier;
          const result = await sendPhoneVerificationCode(data.identifier, verifier);
          setConfirmationResult(result);
          setLoginStep('code');
          toast({ title: 'Code Sent', description: 'A verification code has been sent to your phone.' });
        } catch (error: any) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not send verification code. Please check the number and try again.',
          });
        }
      });
    }
  };

  const onPasswordSubmit = (data: { password: string }) => {
    startTransition(async () => {
      try {
        if (authMode === 'signup') {
          await handlePasswordSignUp(identifier, data.password);
          toast({ title: 'Account Created', description: 'Please check your email to verify your account.' });
          router.push('/verify-email');
        } else {
          await handlePasswordSignIn(identifier, data.password);
          // AuthGuard will redirect on success
        }
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: `Error ${authMode === 'signup' ? 'signing up' : 'signing in'}`,
          description: error.message || 'An unexpected error occurred.',
        });
      }
    });
  };

  const onCodeSubmit = (data: { code: string }) => {
    startTransition(async () => {
      try {
        await verifyPhoneCode(confirmationResult, data.code);
        // AuthGuard will redirect on success
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Verification Failed',
          description: 'The code you entered is incorrect. Please try again.',
        });
      }
    });
  };
  
  const handleGoogleSignInClick = () => {
    startTransition(() => {
      handleGoogleSignIn().catch((error) => {
        toast({
          variant: 'destructive',
          title: 'Sign-in Error',
          description: error.message,
        });
      });
    });
  };

  const resetFlow = () => {
    setLoginStep('identifier');
    setIdentifier('');
    setConfirmationResult(null);
  };

  const renderStep = () => {
    switch (loginStep) {
      case 'password':
        return (
          <form onSubmit={handleSubmitPassword(onPasswordSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...registerPassword('password')} />
                {passwordErrors.password && (
                  <p className="text-xs text-destructive">{passwordErrors.password.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button className="w-full" type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : (authMode === 'signin' ? 'Sign In' : 'Create Account')}
              </Button>
              <Button variant="link" size="sm" onClick={resetFlow}>Back</Button>
            </CardFooter>
          </form>
        );
      case 'code':
        return (
          <form onSubmit={handleSubmitCode(onCodeSubmit)}>
            <CardHeader>
                <CardTitle>Enter Code</CardTitle>
                <CardDescription>Enter the 6-digit code sent to {identifier}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input id="code" type="text" {...registerCode('code')} />
                {codeErrors.code && (
                  <p className="text-xs text-destructive">{codeErrors.code.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button className="w-full" type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : 'Verify and Sign In'}
              </Button>
               <Button variant="link" size="sm" onClick={resetFlow}>Use another number</Button>
            </CardFooter>
          </form>
        );
      case 'identifier':
      default:
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</CardTitle>
              <CardDescription>Enter your email or phone number to continue.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitIdentifier(handleIdentifierSubmit)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email or Phone Number</Label>
                  <Input id="identifier" type="text" placeholder="email@example.com or 0501234567" {...registerIdentifier('identifier')} />
                  {identifierErrors.identifier && (
                    <p className="text-xs text-destructive">{identifierErrors.identifier.message}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="animate-spin" /> : 'Continue'}
                </Button>
              </CardFooter>
            </form>
             <div className="my-4 px-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                <Button variant="outline" className="mt-4 w-full" onClick={handleGoogleSignInClick} disabled={isPending}>
                  {isPending ? <Loader2 className="animate-spin" /> : <> <svg role="img" viewBox="0 0 24 24" className="ms-2 h-4 w-4"> <path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.36 1.67-4.06 1.67-3.4 0-6.17-2.83-6.17-6.23s2.77-6.23 6.17-6.23c1.87 0 3.13.78 3.87 1.48l2.6-2.6C16.3 3.83 14.37 3 12.48 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c4.9 0 8.7-3.34 8.7-8.82 0-.64-.07-1.25-.16-1.84z"></path> </svg> Google</>}
                </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              {authMode === 'signin' ? "Don't have an account?" : "Already have an account?"}{' '}
              <Button variant="link" className="p-0 h-auto" onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}>
                 {authMode === 'signin' ? 'Sign up' : 'Sign in'}
              </Button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div id="recaptcha-container" />
      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <PiggyBank className="size-12 text-primary" />
            <h1 className="mt-4 text-3xl font-bold tracking-tighter">Tazrimony</h1>
            <p className="text-muted-foreground">Your personal finance manager for shift work.</p>
          </div>
          <Card className="border-0 shadow-none">
            {renderStep()}
          </Card>
        </div>
      </div>
      <div className="hidden bg-muted lg:flex items-center justify-center p-10">
        <div className="text-center">
            <PiggyBank className="size-24 text-primary mx-auto" />
            <h1 className="mt-6 text-4xl font-bold tracking-tighter">Tazrimony</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Manage your finances, the smart way.
              <br />
              Sign in to track your income and expenses.
            </p>
        </div>
      </div>
    </div>
  );
}
