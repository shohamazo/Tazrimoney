'use client';
import React, { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Wand2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useFirebase, setDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc } from 'firebase/firestore';
import { generateInitialBudget, type InitialBudgetInput, type BudgetItem } from '@/lib/budget-calculator';

interface OnboardingDialogProps {
  isOpen: boolean;
  onFinish: () => void;
}

const STEPS = [
  { id: 'welcome', title: 'ברוך הבא ל-Tazrimoney' },
  { id: 'income', title: 'הכנסה חודשית' },
  { id: 'lifestyle', title: 'שאלון סגנון חיים' },
  { id: 'ai-suggestions', title: 'הצעות תקציב מותאמות' },
  { id: 'summary', title: 'סיכום וסיום' },
];

export function OnboardingDialog({ isOpen, onFinish }: OnboardingDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  // State for all user inputs
  const [income, setIncome] = useState<number>(5000);
  const [housing, setHousing] = useState('rent');
  const [housingCost, setHousingCost] = useState<number>(0);
  const [transportation, setTransportation] = useState('public');
  const [diningOut, setDiningOut] = useState('weekly');
  const [hasDebt, setHasDebt] = useState('no');
  const [savingsGoal, setSavingsGoal] = useState('none');
  const [hasChildren, setHasChildren] = useState('no');
  const [hasPets, setHasPets] = useState('no');
  const [takesMeds, setTakesMeds] = useState('no');
  const [isStudent, setIsStudent] = useState('no');
  
  const [suggestions, setSuggestions] = useState<BudgetItem[]>([]);


  const handleNext = () => {
    if (currentStep === 2) { // After lifestyle questions, generate budget locally
      handleGetSuggestions();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleGetSuggestions = () => {
    startTransition(() => {
        const input: InitialBudgetInput = {
            monthlyIncome: income,
            housing,
            monthlyHousingCost: housingCost,
            transportation,
            diningOutFrequency: diningOut,
            hasChildren: hasChildren === 'yes',
            hasDebt: hasDebt === 'yes',
            savingsGoal,
            hasPets: hasPets === 'yes',
            takesMeds: takesMeds === 'yes',
            isStudent: isStudent === 'yes',
        };
        const result = generateInitialBudget(input);
        setSuggestions(result);
        setCurrentStep(prev => prev + 1);
    });
  }
  
  const handleFinishAndSave = () => {
    if(!firestore || !user) return;

    startTransition(async () => {
        // Save budget suggestions to Firestore
        if(suggestions.length > 0) {
            suggestions.forEach(suggestion => {
                const budgetRef = doc(firestore, 'users', user.uid, 'budgets', suggestion.category);
                const budgetData = {
                    category: suggestion.category,
                    planned: suggestion.planned,
                    alertThreshold: 80, // Default threshold
                };
                // Use non-blocking write
                setDocumentNonBlocking(budgetRef, budgetData, { merge: true });
            });
        }
        
        // Also mark onboarding as complete in Firestore
        const userProfileRef = doc(firestore, 'users', user.uid);
        await setDoc(userProfileRef, { onboardingComplete: true }, { merge: true });

        toast({ title: "התקציב שלך נוצר!", description: "התקציבים הראשוניים שלך נשמרו." });
        
        // This will now correctly trigger the state update in AuthGuard
        onFinish();
    });
  }
  
  const handleSuggestionChange = (category: string, value: string) => {
    const newSuggestions = suggestions.map(s => {
      if (s.category === category) {
        return { ...s, planned: Number(value) || 0 };
      }
      return s;
    });
    setSuggestions(newSuggestions);
  };

  const progress = (currentStep / (STEPS.length - 1)) * 100;

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return (
          <>
            <DialogHeader>
              <DialogTitle>{STEPS[currentStep].title}</DialogTitle>
              <DialogDescription>
                בוא ניקח כמה רגעים להגדיר את האפליקציה כדי שתתאים לך בדיוק.
                התהליך ייקח פחות מדקה.
              </DialogDescription>
            </DialogHeader>
            <div className="text-center p-8">
              <p className="text-4xl">👋</p>
            </div>
          </>
        );
      case 'income':
        return (
            <>
                <DialogHeader>
                    <DialogTitle>{STEPS[currentStep].title}</DialogTitle>
                    <DialogDescription>
                        כדי לתת לך המלצות תקציב טובות, נצטרך לדעת מהי הכנסתך החודשית המוערכת (נטו).
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Label htmlFor="income">הכנסה חודשית (₪)</Label>
                    <Input id="income" type="number" value={income} onChange={(e) => setIncome(Number(e.target.value))} />
                </div>
            </>
        )
      case 'lifestyle':
        return (
            <>
                <DialogHeader>
                    <DialogTitle>{STEPS[currentStep].title}</DialogTitle>
                    <DialogDescription>
                        כמה שאלות קצרות על סגנון החיים שלך כדי שנוכל להתאים לך תקציב.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto px-1">
                     <div>
                        <Label>מה מצב הדיור שלך?</Label>
                        <RadioGroup value={housing} onValueChange={setHousing} className="mt-2">
                           <div className="flex items-center space-x-2 space-x-reverse">
                             <RadioGroupItem value="rent" id="r1" /><Label htmlFor="r1">שכירות</Label>
                           </div>
                           <div className="flex items-center space-x-2 space-x-reverse">
                             <RadioGroupItem value="parents" id="r2" /><Label htmlFor="r2">גר עם ההורים</Label>
                           </div>
                           <div className="flex items-center space-x-2 space-x-reverse">
                             <RadioGroupItem value="own" id="r3" /><Label htmlFor="r3">דירה בבעלותי</Label>
                           </div>
                        </RadioGroup>
                        {(housing === 'rent' || housing === 'own') && (
                             <div className="mt-4">
                                <Label htmlFor="housing-cost">{housing === 'rent' ? 'שכר דירה חודשי (₪)' : 'תשלום משכנתא חודשי (₪)'}</Label>
                                <Input id="housing-cost" type="number" value={housingCost} onChange={(e) => setHousingCost(Number(e.target.value))} />
                             </div>
                        )}
                    </div>
                     <div>
                        <Label>איך אתה מתנייד בדרך כלל?</Label>
                        <RadioGroup value={transportation} onValueChange={setTransportation} className="mt-2">
                           <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="car" id="t1" /><Label htmlFor="t1">רכב פרטי</Label></div>
                           <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="public" id="t2" /><Label htmlFor="t2">תחבורה ציבורית</Label></div>
                           <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="walk" id="t3" /><Label htmlFor="t3">הולך ברגל / אופניים</Label></div>
                        </RadioGroup>
                    </div>
                    <div>
                        <Label>באיזו תדירות אתה אוכל בחוץ?</Label>
                        <RadioGroup value={diningOut} onValueChange={setDiningOut} className="mt-2">
                           <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="rarely" id="d1" /><Label htmlFor="d1">לעיתים רחוקות</Label></div>
                           <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="weekly" id="d2" /><Label htmlFor="d2">פעם-פעמיים בשבוע</Label></div>
                           <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="daily" id="d3" /><Label htmlFor="d3">רוב הימים</Label></div>
                        </RadioGroup>
                    </div>
                    <div>
                        <Label>האם יש לך ילדים?</Label>
                        <RadioGroup value={hasChildren} onValueChange={setHasChildren} className="mt-2">
                           <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="yes" id="children-yes" /><Label htmlFor="children-yes">כן</Label></div>
                           <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="no" id="children-no" /><Label htmlFor="children-no">לא</Label></div>
                        </RadioGroup>
                    </div>
                    <div>
                        <Label>האם יש לך חיות מחמד?</Label>
                        <RadioGroup value={hasPets} onValueChange={setHasPets} className="mt-2">
                           <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="yes" id="pets-yes" /><Label htmlFor="pets-yes">כן</Label></div>
                           <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="no" id="pets-no" /><Label htmlFor="pets-no">לא</Label></div>
                        </RadioGroup>
                    </div>
                    <div>
                        <Label>האם אתה נוטל תרופות קבועות / מיוחדות?</Label>
                        <RadioGroup value={takesMeds} onValueChange={setTakesMeds} className="mt-2">
                           <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="yes" id="meds-yes" /><Label htmlFor="meds-yes">כן</Label></div>
                           <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="no" id="meds-no" /><Label htmlFor="meds-no">לא</Label></div>
                        </RadioGroup>
                    </div>
                    <div>
                        <Label>האם אתה סטודנט או לוקח קורסים?</Label>
                        <RadioGroup value={isStudent} onValueChange={setIsStudent} className="mt-2">
                           <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="yes" id="student-yes" /><Label htmlFor="student-yes">כן</Label></div>
                           <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="no" id="student-no" /><Label htmlFor="student-no">לא</Label></div>
                        </RadioGroup>
                    </div>
                    <div>
                        <Label>האם יש לך חובות פעילים (הלוואות, מינוס)?</Label>
                        <RadioGroup value={hasDebt} onValueChange={setHasDebt} className="mt-2">
                           <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="yes" id="debt-yes" /><Label htmlFor="debt-yes">כן</Label></div>
                           <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="no" id="debt-no" /><Label htmlFor="debt-no">לא</Label></div>
                        </RadioGroup>
                    </div>
                     <div>
                        <Label>מהי מטרת החיסכון העיקרית שלך כרגע?</Label>
                        <RadioGroup value={savingsGoal} onValueChange={setSavingsGoal} className="mt-2">
                           <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="none" id="sg-none" /><Label htmlFor="sg-none">אין מטרה מוגדרת</Label></div>
                           <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="emergency" id="sg-emergency" /><Label htmlFor="sg-emergency">קרן חירום</Label></div>
                           <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="large-purchase" id="sg-large-purchase" /><Label htmlFor="sg-large-purchase">רכישה גדולה (רכב, חופשה)</Label></div>
                           <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="investing" id="sg-investing" /><Label htmlFor="sg-investing">השקעה</Label></div>
                        </RadioGroup>
                    </div>
                </div>
            </>
        )
      case 'ai-suggestions':
        return (
            <>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Wand2 className="text-primary"/>{STEPS[currentStep].title}</DialogTitle>
                    <DialogDescription>
                        בהתבסס על התשובות שלך, הנה נקודת פתיחה לתקציב שלך. תוכל לשנות אותה בכל עת.
                    </DialogDescription>
                </DialogHeader>
                {isPending ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-2">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p>מעבד נתונים...</p>
                    </div>
                ) : (
                    <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
                        {suggestions.map((suggestion) => (
                            <div key={suggestion.category} className="flex items-center gap-4">
                                <Label htmlFor={suggestion.category} className="w-24">{suggestion.category}</Label>
                                <Input id={suggestion.category} type="number" value={suggestion.planned} onChange={e => handleSuggestionChange(suggestion.category, e.target.value)} />
                            </div>
                        ))}
                    </div>
                )}
            </>
        )
       case 'summary':
        return (
            <>
                <DialogHeader>
                    <DialogTitle>{STEPS[currentStep].title}</DialogTitle>
                    <DialogDescription>
                        מעולה! התקציב הראשוני שלך מוכן. זכור, זוהי רק המלצה ותוכל להתאים אותה מתוך האפליקציה בכל רגע.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <p>בשלב הבא, תוכל להתחיל להזין משמרות והוצאות כדי לראות את התמונה המלאה.</p>
                </div>
            </>
        )
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isPending) onFinish(); }}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} hideCloseButton={true}>
        <div className="p-2 space-y-4">
          <Progress value={progress} className="w-full" />
          {renderStepContent()}
        </div>
        <DialogFooter className="flex justify-between w-full">
            <div>
                 {currentStep > 0 && (
                    <Button variant="ghost" onClick={handleBack} disabled={isPending}>
                    חזור
                    </Button>
                )}
            </div>
           <div>
            {currentStep < 3 ? (
                <Button onClick={handleNext} disabled={isPending}>
                  {isPending ? <Loader2 className="animate-spin" /> : 'הבא'}
                </Button>
              ) : currentStep === 3 ? (
                 <Button onClick={() => setCurrentStep(prev => prev + 1)} disabled={isPending}>
                  {isPending ? <Loader2 className="animate-spin" /> : 'המשך לסיכום'}
                </Button>
              ) : (
                <Button onClick={handleFinishAndSave} disabled={isPending}>
                    {isPending ? <Loader2 className="animate-spin" /> : 'התחל להשתמש'}
                </Button>
              )
            }
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
