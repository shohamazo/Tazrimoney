'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirebase, setDocumentNonBlocking } from '@/firebase';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, User, KeyRound, AlertTriangle, Palette, Wand2, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  handleLinkGoogle,
  handleUpdateProfile,
  handleDeleteUser,
} from '@/firebase/auth-actions';
import { useTheme } from '@/components/theme/theme-provider';
import { themes } from '@/lib/themes';
import { cn } from '@/lib/utils';
import { getIdentifierForUser } from '@/lib/utils';
import { useOnboarding } from '@/components/onboarding/onboarding-provider';
import type { UserProfile } from '@/lib/types';


const profileSchema = z.object({
  displayName: z.string().min(2, 'השם חייב להכיל לפחות 2 תווים.'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { user, firestore, isUserLoading, userProfile } = useFirebase();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [deleteConfirmation, setDeleteConfirmation] = React.useState('');
  const { theme, setTheme } = useTheme();
  const { startWizard } = useOnboarding();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
    },
  });
  
  React.useEffect(() => {
    if (user) {
      reset({ displayName: user.displayName || '' });
    }
  }, [user, reset]);


  const onProfileSubmit = (data: ProfileFormData) => {
    startTransition(() => {
      handleUpdateProfile(data)
        .then(() => {
          toast({ title: 'פרופיל עודכן', description: 'השם שלך עודכן בהצלחה.' });
          reset(data); // Resets form dirty state
        })
        .catch((error) => {
          toast({
            variant: 'destructive',
            title: 'שגיאה',
            description: error.message,
          });
        });
    });
  };

  const onLinkGoogle = () => {
    startTransition(() => {
      handleLinkGoogle()
        .then(() => {
          toast({ title: 'חשבון Google קושר', description: 'מעכשיו תוכל להתחבר גם עם Google.' });
        })
        .catch((error) => {
          // Handle specific errors for better UX
          if (error.code === 'auth/credential-already-in-use') {
             toast({ variant: 'destructive', title: 'שגיאה', description: 'חשבון Google זה כבר משוייך למשתמש אחר.' });
          } else {
             toast({ variant: 'destructive', title: 'שגיאה', description: error.message });
          }
        });
    });
  };

  const onDeleteUser = () => {
    startTransition(() => {
      handleDeleteUser().catch((error) => {
        toast({
          variant: 'destructive',
          title: 'שגיאה במחיקת חשבון',
          description: error.message,
        });
      });
      // AuthGuard will handle redirect on successful deletion
    });
  };
  
  const isGoogleLinked = user?.providerData.some(p => p.providerId === 'google.com');
  const identifier = user ? getIdentifierForUser(user) : 'לא זמין';
  const confirmationText = user?.email || identifier;

  if (isUserLoading || !user) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">הגדרות</h1>
        <p className="text-muted-foreground">נהל את הגדרות החשבון והפרופיל שלך.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User /> פרופיל אישי</CardTitle>
          <CardDescription>
            שם זה יוצג באפליקציה.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onProfileSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">שם לתצוגה</Label>
              <Input id="displayName" {...register('displayName')} />
              {errors.displayName && (
                <p className="text-xs text-destructive">
                  {errors.displayName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>אימייל / טלפון</Label>
              <Input value={identifier} disabled />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isPending || !isDirty}>
              {isPending && <Loader2 className="animate-spin ms-2" />}
              שמור שינויים
            </Button>
          </CardFooter>
        </form>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette /> מראה</CardTitle>
          <CardDescription>
            התאם את ערכת הצבעים של האפליקציה.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.values(themes).map((t) => (
              <div key={t.name}>
                <button
                  onClick={() => setTheme(t.name)}
                  className={cn(
                    "w-full rounded-md border-2 p-2 flex flex-col items-start",
                    theme.name === t.name
                      ? "border-primary"
                      : "border-transparent"
                  )}
                >
                  <span className="text-sm font-medium mb-2">{t.label}</span>
                  <div className="flex gap-1 w-full">
                    <div className="h-6 w-full rounded" style={{ backgroundColor: `hsl(${t.colors.light.primary})` }} />
                    <div className="h-6 w-full rounded" style={{ backgroundColor: `hsl(${t.colors.light.accent})` }} />
                     <div className="h-6 w-full rounded" style={{ backgroundColor: `hsl(${t.colors.light.background})` }} />
                  </div>
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wand2 /> אשף הגדרה</CardTitle>
          <CardDescription>
            הפעל מחדש את אשף ההגדרה הראשוני כדי להתאים את התקציב שלך מחדש.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Button onClick={startWizard}>הפעל את אשף ההגדרה</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound /> אבטחה</CardTitle>
          <CardDescription>
            נהל את שיטות ההתחברות שלך.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                   <svg role="img" viewBox="0 0 24 24" className="ms-2 h-6 w-6"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.36 1.67-4.06 1.67-3.4 0-6.17-2.83-6.17-6.23s2.77-6.23 6.17-6.23c1.87 0 3.13.78 3.87 1.48l2.6-2.6C16.3 3.83 14.37 3 12.48 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c4.9 0 8.7-3.34 8.7-8.82 0-.64-.07-1.25-.16-1.84z"></path></svg>
                    <div>
                        <p className="font-medium">Google</p>
                        <p className="text-sm text-muted-foreground">{isGoogleLinked ? 'מקושר' : 'לא מקושר'}</p>
                    </div>
                </div>
                {!isGoogleLinked && (
                    <Button variant="outline" onClick={onLinkGoogle} disabled={isPending}>
                         {isPending && <Loader2 className="animate-spin ms-2" />}
                        קשר חשבון
                    </Button>
                )}
             </div>
        </CardContent>
      </Card>


      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle /> אזור מסוכן</CardTitle>
          <CardDescription>
            פעולות אלו הן קבועות ולא ניתן לשחזר אותן.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div>
                <p className="font-medium">מחק חשבון</p>
                <p className="text-sm text-muted-foreground">מחיקת חשבונך תמחק את כל הנתונים לצמיתות.</p>
            </div>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">מחק חשבון</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                        <AlertDialogDescription>
                            פעולה זו תמחק את חשבונך וכל הנתונים המשוייכים אליו לצמיתות.
                            כדי לאשר, הקלד "{confirmationText}" בתיבה למטה.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Input 
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder={confirmationText}
                    />
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={onDeleteUser}
                            disabled={deleteConfirmation !== confirmationText || isPending}
                        >
                             {isPending ? <Loader2 className="animate-spin ms-2" /> : 'אני מבין, מחק את החשבון'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
