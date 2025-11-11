
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
  setAuthPersistence,
} from '@/firebase/auth-actions';
import React, { useTransition, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
});

type FormInputs = z.infer<typeof formSchema>;

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormInputs>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: FormInputs) => {
    startTransition(async () => {
      try {
        await setAuthPersistence(true); // Always remember the user

        if (authMode === 'signup') {
          await handlePasswordSignUp(data.email, data.password);
          toast({ title: 'Account Created', description: "You've been successfully signed in." });
          // AuthGuard will handle redirect
        } else {
          await handlePasswordSignIn(data.email, data.password);
          // AuthGuard will handle redirect
        }
      } catch (error: any) {
        let description = 'An unexpected error occurred.';
        if (error.code) {
          switch (error.code) {
            case 'auth/email-already-in-use':
              description = 'This email is already in use. Please try signing in instead.';
              break;
            case 'auth/user-not-found':
              description = 'No account found with this email. Please sign up first.';
              break;
            case 'auth/wrong-password':
              description = 'Incorrect password. Please try again.';
              break;
            case 'auth/too-many-requests':
              description = 'Too many requests. Please try again later.';
              break;
            default:
              description = error.message;
          }
        }
        toast({
          variant: 'destructive',
          title: 'Error',
          description: description,
        });
      }
    });
  };

  const handleGoogleSignInClick = () => {
    startTransition(async () => {
      try {
        await setAuthPersistence(true);
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
    reset(); // Clear form fields
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
      <div className="text-center mb-8">
        <PiggyBank className="size-16 text-accent mx-auto" />
        <h1 className="mt-4 text-4xl font-bold tracking-tighter">Tazrimoney</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          נהל את הכספים שלך, בדרך החכמה.
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>{authMode === 'signin' ? 'התחברות' : 'יצירת חשבון'}</CardTitle>
          <CardDescription>הזן את המייל והסיסמה שלך להמשיך.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input id="email" placeholder="mail@example.com" {...register('email')} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="animate-spin" />
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
        <div className="mt-4 text-center text-sm pb-6">
          {authMode === 'signin' ? "אין לך חשבון?" : "כבר יש לך חשבון?"}{' '}
          <Button variant="link" className="p-0 h-auto" onClick={switchAuthMode}>
              {authMode === 'signin' ? 'הרשמה' : 'התחברות'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
