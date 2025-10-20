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
  setAuthPersistence,
} from '@/firebase/auth-actions';
import React, { useTransition, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { useFirebase } from '@/firebase';

const formSchema = z.object({
  emailOrPhone: z.string().min(1, 'Please enter an email or phone number.'),
  password: z.string().optional(),
  code: z.string().optional(),
});

type FormInputs = z.infer<typeof formSchema>;

export default function LoginPage() {
  const { auth } = useFirebase();
  const [isPending, startTransition] = useTransition();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isPhoneAuth, setIsPhoneAuth] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const { toast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormInputs>({
    resolver: zodResolver(formSchema),
  });
  
  const emailOrPhone = watch('emailOrPhone');

  useEffect(() => {
    setIsPhoneAuth(/^\+?[0-9\s-]{8,}$/.test(emailOrPhone));
  }, [emailOrPhone]);
  
  useEffect(() => {
    if (!auth) return;

    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
        }
      });
    }
  }, [auth]);


  const onSubmit = (data: FormInputs) => {
    startTransition(async () => {
      const verifier = window.recaptchaVerifier;
      if (!verifier) {
          toast({ variant: 'destructive', title: 'Error', description: 'reCAPTCHA verifier not initialized.' });
          return;
      }
      
      try {
        // Always set persistence to remember the user
        await setAuthPersistence(true);

        if (isPhoneAuth) {
          if (confirmationResult) {
            // Step 2: Verify code
            await verifyPhoneCode(confirmationResult, data.code || '');
            toast({ title: 'Signed In', description: 'You have successfully signed in.' });
             // AuthGuard will handle redirect
          } else {
            // Step 1: Send verification code
            const result = await sendPhoneVerificationCode(data.emailOrPhone, verifier);
            setConfirmationResult(result);
            toast({ title: 'Code Sent', description: 'A verification code has been sent to your phone.' });
             // Correctly reset only the fields that need to be cleared.
             reset({ ...data, password: '', code: '' });
          }
        } else {
          // Email/Password Auth
          const email = data.emailOrPhone;
          const password = data.password || '';
          if (!password) {
            toast({ variant: 'destructive', title: 'Error', description: 'Password is required for email sign-in.' });
            return;
          }

          if (authMode === 'signup') {
            await handlePasswordSignUp(email, password);
            toast({ title: 'Account Created', description: 'Please check your email to verify your account.' });
            router.push('/verify-email');
          } else {
            await handlePasswordSignIn(email, password);
            // AuthGuard will redirect on success
          }
        }
      } catch (error: any) {
        let description = 'An unexpected error occurred.';
         if (error.code) {
          switch (error.code) {
            case 'auth/email-already-in-use':
              description = 'This email is already in use. Please try signing in instead.';
              break;
            case 'auth/user-not-found':
               if (authMode === 'signin' && !isPhoneAuth) {
                description = 'No account found with this email. Please sign up first.';
              } else if(authMode === 'signin' && isPhoneAuth) {
                description = 'No account found with this phone number. Please sign up first.';
              }
              break;
            case 'auth/wrong-password':
              description = 'Incorrect password. Please try again.';
              break;
            case 'auth/invalid-phone-number':
              description = 'The phone number is not valid. Please check the format (e.g., 0501234567).';
              break;
            case 'auth/too-many-requests':
              description = 'Too many requests. Please try again later.';
              // Reset reCAPTCHA to allow user to try again.
              verifier.render().then((widgetId: any) => {
                window.grecaptcha?.reset(widgetId);
              });
              break;
            case 'auth/invalid-verification-code':
              description = 'The verification code is incorrect. Please try again.';
              break;
            default:
              description = error.message;
          }
        }
        
        toast({
            variant: 'destructive',
            title: `Error`,
            description: description,
        });
      }
    });
  };

  const handleGoogleSignInClick = () => {
    startTransition(async () => {
      try {
        await setAuthPersistence(true); // Assume "remember me" for Google sign-in
        await handleGoogleSignIn();
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Sign-in Error',
          description: error.message,
        });
      }
    });
  };
  
  const switchAuthMode = () => {
    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
    setConfirmationResult(null); // Reset phone auth flow
    reset(); // Clear form fields
  }

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div id="recaptcha-container"></div>
      <div className="flex items-center justify-center p-6 lg:p-10">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle>{authMode === 'signin' ? 'התחברות' : 'יצירת חשבון'}</CardTitle>
            <CardDescription>הזן את המייל או הטלפון שלך להמשיך.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {confirmationResult ? (
                 <div className="space-y-2">
                    <Label htmlFor="code">קוד אימות</Label>
                    <Input id="code" type="text" {...register('code')} placeholder="123456" />
                     {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="emailOrPhone">אימייל או טלפון</Label>
                    <Input id="emailOrPhone" placeholder="mail@example.com / 050-123-4567" {...register('emailOrPhone')} />
                    {errors.emailOrPhone && (
                      <p className="text-xs text-destructive">{errors.emailOrPhone.message}</p>
                    )}
                  </div>
                  {!isPhoneAuth && (
                    <div className="space-y-2">
                      <Label htmlFor="password">סיסמה</Label>
                      <Input id="password" type="password" {...register('password')} />
                      {errors.password && (
                        <p className="text-xs text-destructive">{errors.password.message}</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button className="w-full" type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="animate-spin" />
                ) : confirmationResult ? (
                  'אימות והתחברות'
                ) : isPhoneAuth ? (
                  authMode === 'signin' ? 'התחברות עם SMS' : 'הרשמה עם SMS'
                ) : (
                  authMode === 'signin' ? 'התחברות' : 'יצירת חשבון'
                )}
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
            <Button variant="link" className="p-0 h-auto" onClick={switchAuthMode}>
               {authMode === 'signin' ? 'הרשמה' : 'התחברות'}
            </Button>
          </div>
        </Card>
      </div>
      <div className="hidden bg-muted lg:flex items-center justify-center p-10">
        <div className="text-center">
            <PiggyBank className="size-24 text-accent mx-auto" />
            <h1 className="mt-6 text-4xl font-bold tracking-tighter">Tazrimoney</h1>
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

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    grecaptcha?: any;
  }
}
    