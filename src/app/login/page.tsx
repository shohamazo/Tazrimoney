'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PiggyBank, Loader2 } from 'lucide-react';
import {
  handleGoogleSignIn,
  handlePhoneSignUp,
  handlePhoneSignIn,
} from '@/firebase/auth-actions';
import { useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

const signUpSchema = z
  .object({
    phone: z.string().regex(phoneRegex, 'מספר טלפון לא תקין.'),
    password: z.string().min(6, 'הסיסמה חייבת להכיל לפחות 6 תווים.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'הסיסמאות אינן תואמות.',
    path: ['confirmPassword'],
  });

const signInSchema = z.object({
  phone: z.string().regex(phoneRegex, 'מספר טלפון לא תקין.'),
  password: z.string().min(1, 'יש להזין סיסמה.'),
});

type SignUpFormData = z.infer<typeof signUpSchema>;
type SignInFormData = z.infer<typeof signInSchema>;

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const {
    register: registerSignUp,
    handleSubmit: handleSubmitSignUp,
    formState: { errors: signUpErrors },
  } = useForm<SignUpFormData>({ resolver: zodResolver(signUpSchema) });
  const {
    register: registerSignIn,
    handleSubmit: handleSubmitSignIn,
    formState: { errors: signInErrors },
  } = useForm<SignInFormData>({ resolver: zodResolver(signInSchema) });

  const onGoogleSignIn = () => {
    startTransition(() => {
      handleGoogleSignIn().catch((error) => {
        toast({
          variant: 'destructive',
          title: 'שגיאת התחברות',
          description: error.message,
        });
      });
    });
  };
  const onSignUp = (data: SignUpFormData) => {
    startTransition(() => {
      handlePhoneSignUp(data.phone, data.password).catch((error) => {
        toast({
          variant: 'destructive',
          title: 'שגיאת הרשמה',
          description: error.message,
        });
      });
    });
  };
  const onSignIn = (data: SignInFormData) => {
    startTransition(() => {
      handlePhoneSignIn(data.phone, data.password).catch((error) => {
        toast({
          variant: 'destructive',
          title: 'שגיאת התחברות',
          description: 'מספר טלפון או סיסמה שגויים. נסה שוב.',
        });
      });
    });
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <PiggyBank className="size-12 text-primary" />
            <h1 className="mt-4 text-3xl font-bold tracking-tighter">
              Tazrimony
            </h1>
            <p className="text-muted-foreground">
              מנהל הכספים האישי שלך לעבודה במשמרות.
            </p>
          </div>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">התחברות</TabsTrigger>
              <TabsTrigger value="signup">הרשמה</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <Card className="border-0 shadow-none">
                <CardHeader className="text-center">
                  <CardTitle>התחברות</CardTitle>
                  <CardDescription>התחבר לחשבון קיים.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmitSignIn(onSignIn)}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone-in">מספר טלפון</Label>
                      <Input
                        id="phone-in"
                        type="tel"
                        placeholder="050-123-4567"
                        {...registerSignIn('phone')}
                      />
                      {signInErrors.phone && (
                        <p className="text-xs text-destructive">
                          {signInErrors.phone.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-in">סיסמה</Label>
                      <Input
                        id="password-in"
                        type="password"
                        {...registerSignIn('password')}
                      />
                      {signInErrors.password && (
                        <p className="text-xs text-destructive">
                          {signInErrors.password.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Button
                      className="w-full"
                      type="submit"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        'התחבר'
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card className="border-0 shadow-none">
                <CardHeader className="text-center">
                  <CardTitle>הרשמה</CardTitle>
                  <CardDescription>
                    צור חשבון חדש כדי להתחיל לנהל את הכספים שלך.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmitSignUp(onSignUp)}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone-up">מספר טלפון</Label>
                      <Input
                        id="phone-up"
                        type="tel"
                        placeholder="050-123-4567"
                        {...registerSignUp('phone')}
                      />
                      {signUpErrors.phone && (
                        <p className="text-xs text-destructive">
                          {signUpErrors.phone.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-up">סיסמה</Label>
                      <Input
                        id="password-up"
                        type="password"
                        {...registerSignUp('password')}
                      />
                      {signUpErrors.password && (
                        <p className="text-xs text-destructive">
                          {signUpErrors.password.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">אימות סיסמה</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        {...registerSignUp('confirmPassword')}
                      />
                      {signUpErrors.confirmPassword && (
                        <p className="text-xs text-destructive">
                          {signUpErrors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      type="submit"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        'צור חשבון'
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  או המשך עם
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={onGoogleSignIn}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <svg role="img" viewBox="0 0 24 24" className="ms-2 h-4 w-4">
                    <path
                      fill="currentColor"
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.36 1.67-4.06 1.67-3.4 0-6.17-2.83-6.17-6.23s2.77-6.23 6.17-6.23c1.87 0 3.13.78 3.87 1.48l2.6-2.6C16.3 3.83 14.37 3 12.48 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c4.9 0 8.7-3.34 8.7-8.82 0-.64-.07-1.25-.16-1.84z"
                    ></path>
                  </svg>
                  Google
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:flex items-center justify-center p-10">
        <div className="text-center">
            <PiggyBank className="size-24 text-primary mx-auto" />
            <h1 className="mt-6 text-4xl font-bold tracking-tighter">
              Tazrimony
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              מנהל הכספים האישי שלך לעבודה במשמרות.
              <br />
              התחבר כדי להתחיל לעקוב אחר ההכנסות וההוצאות שלך.
            </p>
        </div>
      </div>
    </div>
  );
}