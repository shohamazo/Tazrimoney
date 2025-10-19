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
import { Auth, RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
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
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const { auth } = useFirebase();

  // This is a global declaration for Firebase's reCAPTCHA
  declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
        grecaptcha?: any;
    }
  }

  // Initialize reCAPTCHA verifier
  useEffect(() => {
    if (!auth) return;

    if (!window.recaptchaVerifier) {
      // Ensure the container is clean before rendering
      const container = document.getElementById('recaptcha-container');
      if(container) {
        container.innerHTML = '';
      }

      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'normal', // Use a visible reCAPTCHA
          'callback': () => {
            // This callback is intentionally left blank.
            // The phone code sending is triggered by a user button click, not the reCAPTCHA success.
          },
          'expired-callback': () => {
             // Response expired. Ask user to solve reCAPTCHA again.
             if (window.grecaptcha && typeof window.grecaptcha.reset === 'function') {
                window.grecaptcha.reset();
             }
          }
      });
      window.recaptchaVerifier.render();
    }

    // Cleanup on unmount
    return () => {
      window.recaptchaVerifier?.clear();
      const container = document.getElementById('recaptcha-container');
      if (container) container.innerHTML = '';
      window.recaptchaVerifier = undefined;
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
        if (!window.recaptchaVerifier) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'reCAPTCHA not initialized. Please refresh the page.',
            });
            return;
        }
        try {
          const result = await sendPhoneVerificationCode(data.identifier, window.recaptchaVerifier);
          setConfirmationResult(result);
          setLoginStep('code');
          toast({ title: 'Code Sent', description: 'A verification code has been sent to your phone.' });
        } catch (error: any) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'Could not send verification code. Please check the number and try again.',
          });
          // Reset reCAPTCHA for another attempt
           if (window.grecaptcha && typeof window.grecaptcha.reset === 'function') {
            window.grecaptcha.reset();
           }
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
      if (!confirmationResult) {
          toast({ variant: 'destructive', title: 'Error', description: 'Verification session expired. Please try again.' });
          resetFlow();
          return;
      }
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
                <Label htmlFor="password">סיסמה</Label>
                <Input id="password" type="password" {...registerPassword('password')} />
                {passwordErrors.password && (
                  <p className="text-xs text-destructive">{passwordErrors.password.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button className="w-full" type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : (authMode === 'signin' ? 'התחברות' : 'יצירת חשבון')}
              </Button>
              <Button variant="link" size="sm" onClick={resetFlow}>חזרה</Button>
            </CardFooter>
          </form>
        );
      case 'code':
        return (
          <form onSubmit={handleSubmitCode(onCodeSubmit)}>
            <CardHeader>
                <CardTitle>הזן קוד</CardTitle>
                <CardDescription>הזן את הקוד בן 6 הספרות שנשלח אל {identifier}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">קוד אימות</Label>
                <Input id="code" type="text" {...registerCode('code')} />
                {codeErrors.code && (
                  <p className="text-xs text-destructive">{codeErrors.code.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button className="w-full" type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : 'אמת והתחבר'}
              </Button>
               <Button variant="link" size="sm" onClick={resetFlow}>השתמש במספר אחר</Button>
            </CardFooter>
          </form>
        );
      case 'identifier':
      default:
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle>{authMode === 'signin' ? 'התחברות' : 'יצירת חשבון'}</CardTitle>
              <CardDescription>הזן את כתובת המייל או מספר הטלפון שלך להמשיך.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitIdentifier(handleIdentifierSubmit)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">אימייל או מספר טלפון</Label>
                  <Input id="identifier" type="text" placeholder="email@example.com or 0501234567" {...registerIdentifier('identifier')} />
                  {identifierErrors.identifier && (
                    <p className="text-xs text-destructive">{identifierErrors.identifier.message}</p>
                  )}
                </div>
                {/* reCAPTCHA container, rendered for phone number flow */}
                <div id="recaptcha-container" className="flex justify-center" />
              </CardContent>
              <CardFooter>
                <Button className="w-full" type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="animate-spin" /> : 'המשך'}
                </Button>
              </CardFooter>
            </form>
             <div className="my-4 px-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">או המשך עם</span>
                  </div>
                </div>
                <Button variant="outline" className="mt-4 w-full" onClick={handleGoogleSignInClick} disabled={isPending}>
                  {isPending ? <Loader2 className="animate-spin" /> : <> <svg role="img" viewBox="0 0 24 24" className="ms-2 h-4 w-4"> <path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.36 1.67-4.06 1.67-3.4 0-6.17-2.83-6.17-6.23s2.77-6.23 6.17-6.23c1.87 0 3.13.78 3.87 1.48l2.6-2.6C16.3 3.83 14.37 3 12.48 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c4.9 0 8.7-3.34 8.7-8.82 0-.64-.07-1.25-.16-1.84z"></path> </svg> Google</>}
                </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              {authMode === 'signin' ? "אין לך חשבון?" : "כבר יש לך חשבון?"}{' '}
              <Button variant="link" className="p-0 h-auto" onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}>
                 {authMode === 'signin' ? 'הרשמה' : 'התחברות'}
              </Button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <PiggyBank className="size-12 text-primary" />
            <h1 className="mt-4 text-3xl font-bold tracking-tighter">Tazrimony</h1>
            <p className="text-muted-foreground">מנהל הכספים האישי שלך לעבודה במשמרות.</p>
          </div>
          <Card className="border-0 shadow-none lg:border lg:shadow-sm">
            {renderStep()}
          </Card>
        </div>
      </div>
      <div className="hidden bg-muted lg:flex items-center justify-center p-10">
        <div className="text-center">
            <PiggyBank className="size-24 text-primary mx-auto" />
            <h1 className="mt-6 text-4xl font-bold tracking-tighter">Tazrimony</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              נהל את הכספים שלך, בדרך החכמה.
              <br />
              התחבר כדי לעקוב אחר ההכנסות וההוצאות שלך.
            </p>
        </div>
      </div>
    </div>
  );
}
