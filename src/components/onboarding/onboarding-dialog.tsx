
'use client';
import React, { useState, useTransition, useMemo, useEffect } from 'react';
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
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc } from 'firebase/firestore';
import { generateInitialBudget, type InitialBudgetInput, type BudgetItem } from '@/lib/budget-calculator';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Checkbox } from '../ui/checkbox';
import { simpleBudgetCategories } from '@/lib/expense-categories';

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
  const [housing, setHousing] = useState('parents');
  const [housingCost, setHousingCost] = useState<number>(0);
  const [transportation, setTransportation] = useState('public');
  const [diningOut, setDiningOut] = useState('weekly');
  const [hasDebt, setHasDebt] = useState('no');
  const [savingsGoal, setSavingsGoal] = useState('none');
  const [hasChildren, setHasChildren] = useState('no');
  const [hasPets, setHasPets] = useState('no');
  const [takesMeds, setTakesMeds] = useState('no');
  const [isStudent, setIsStudent] = useState('no');
  const [groceryStyle, setGroceryStyle] = useState('standard');
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [clothingHabits, setClothingHabits] = useState('seasonally');
  const [entertainmentHabits, setEntertainmentHabits] = useState('home');
  const [groomingBudget, setGroomingBudget] = useState<number>(0);
  const [travelPlans, setTravelPlans] = useState('no');
  
  const [suggestions, setSuggestions] = useState<BudgetItem[]>([]);
  
  const totalBudgeted = useMemo(() => {
    return suggestions.reduce((acc, curr) => acc + curr.planned, 0);
  }, [suggestions]);

  const remainingIncome = useMemo(() => {
    return income - totalBudgeted;
  }, [income, totalBudgeted]);


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
            groceryStyle,
            subscriptions,
            clothingHabits,
            entertainmentHabits,
            groomingBudget,
            travelPlans: travelPlans === 'yes',
        };
        const result = generateInitialBudget(input);
        setSuggestions(result);
        setCurrentStep(prev => prev + 1);
    });
  }
  
  const handleFinishAndSave = () => {
    if (!firestore || !user) return;
  
    startTransition(async () => {
      try {
        const suggestionsMap = new Map(suggestions.map(s => [s.category, s.planned]));
    
        // Explicitly save a budget of 0 for categories not in the suggestions
        simpleBudgetCategories.forEach(categoryName => {
          if (!suggestionsMap.has(categoryName)) {
            suggestionsMap.set(categoryName, 0);
          }
        });

        const budgetPromises = Array.from(suggestionsMap.entries()).map(([categoryName, plannedAmount]) => {
          const budgetRef = doc(firestore, 'users', user.uid, 'budgets', categoryName);
          const budgetData = {
            category: categoryName,
            planned: plannedAmount,
            alertThreshold: 80, // Default threshold
          };
          return setDoc(budgetRef, budgetData, { merge: true });
        });
    
        await Promise.all(budgetPromises);
    
        toast({ title: "התקציב שלך נוצר!", description: "התקציבים הראשוניים שלך נשמרו." });
        
        onFinish();
      } catch (error) {
        console.error("Failed to save onboarding data:", error);
        toast({ variant: 'destructive', title: "שגיאה", description: "לא ניתן היה לשמור את נתוני התקציב." });
      }
    });
  };
  
  const handleSuggestionChange = (category: string, value: string) => {
    const newSuggestions = suggestions.map(s => {
      if (s.category === category) {
        return { ...s, planned: Number(value) || 0 };
      }
      return s;
    });
    setSuggestions(newSuggestions);
  };
  
  const handleSubscriptionChange = (id: string) => {
    setSubscriptions(prev => 
      prev.includes(id) ? prev.filter(sub => sub !== id) : [...prev, id]
    );
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
                    <Label htmlFor="income" className="text-right">הכנסה חודשית (₪)</Label>
                    <Input id="income" type="number" value={income} onChange={(e) => setIncome(Number(e.target.value))} className="text-right" />
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
                     <div className="text-right">
                        <Label>מה מצב הדיור שלך?</Label>
                        <RadioGroup value={housing} onValueChange={setHousing} className="mt-2">
                           <div className="flex items-center justify-end"><Label htmlFor="r1" className="mr-2">שכירות</Label><RadioGroupItem value="rent" id="r1" /></div>
                           <div className="flex items-center justify-end"><Label htmlFor="r2" className="mr-2">גר עם ההורים</Label><RadioGroupItem value="parents" id="r2" /></div>
                           <div className="flex items-center justify-end"><Label htmlFor="r3" className="mr-2">דירה בבעלותי (עם/בלי משכנתא)</Label><RadioGroupItem value="own" id="r3" /></div>
                        </RadioGroup>
                        {(housing === 'rent' || housing === 'own') && (
                             <div className="mt-4">
                                <Label htmlFor="housing-cost">{housing === 'rent' ? 'שכר דירה חודשי (₪)' : 'תשלום משכנתא חודשי (₪)'}</Label>
                                <Input id="housing-cost" type="number" value={housingCost} onChange={(e) => setHousingCost(Number(e.target.value))} className="text-right mt-1"/>
                             </div>
                        )}
                    </div>

                    <div className="text-right">
                        <Label>איך אתה מתנייד בדרך כלל?</Label>
                        <RadioGroup value={transportation} onValueChange={setTransportation} className="mt-2">
                           <div className="flex items-center justify-end"><Label htmlFor="t1" className="mr-2">רכב פרטי</Label><RadioGroupItem value="car" id="t1" /></div>
                           <div className="flex items-center justify-end"><Label htmlFor="t2" className="mr-2">תחבורה ציבורית</Label><RadioGroupItem value="public" id="t2" /></div>
                           <div className="flex items-center justify-end"><Label htmlFor="t3" className="mr-2">הולך ברגל / אופניים</Label><RadioGroupItem value="walk" id="t3" /></div>
                        </RadioGroup>
                    </div>

                    <div className="text-right">
                      <Label>איך היית מתאר את סגנון קניות המזון שלך?</Label>
                      <RadioGroup value={groceryStyle} onValueChange={setGroceryStyle} className="mt-2">
                        <div className="flex items-center justify-end"><Label htmlFor="g1" className="mr-2">חסכני (מבשל בעיקר בבית)</Label><RadioGroupItem value="frugal" id="g1" /></div>
                        <div className="flex items-center justify-end"><Label htmlFor="g2" className="mr-2">סטנדרטי (קונה מה שצריך)</Label><RadioGroupItem value="standard" id="g2" /></div>
                        <div className="flex items-center justify-end"><Label htmlFor="g3" className="mr-2">פרימיום (אוכל אורגני, מותגים)</Label><RadioGroupItem value="premium" id="g3" /></div>
                      </RadioGroup>
                    </div>

                    <div className="text-right">
                        <Label>באיזו תדירות אתה אוכל בחוץ?</Label>
                        <RadioGroup value={diningOut} onValueChange={setDiningOut} className="mt-2">
                           <div className="flex items-center justify-end"><Label htmlFor="d1" className="mr-2">לעיתים רחוקות</Label><RadioGroupItem value="rarely" id="d1" /></div>
                           <div className="flex items-center justify-end"><Label htmlFor="d2" className="mr-2">פעם-פעמיים בשבוע</Label><RadioGroupItem value="weekly" id="d2" /></div>
                           <div className="flex items-center justify-end"><Label htmlFor="d3" className="mr-2">רוב הימים</Label><RadioGroupItem value="daily" id="d3" /></div>
                        </RadioGroup>
                    </div>

                     <div className="text-right">
                        <Label>אילו מנויים/שירותים חודשיים יש לך?</Label>
                        <div className="mt-2 space-y-2">
                            <div className="flex items-center justify-end"><Checkbox id="sub-tv" checked={subscriptions.includes('tv')} onCheckedChange={() => handleSubscriptionChange('tv')} className="ml-2"/><Label htmlFor="sub-tv" className="mr-2">שירותי סטרימינג (נטפליקס, דיסני+)</Label></div>
                            <div className="flex items-center justify-end"><Checkbox id="sub-music" checked={subscriptions.includes('music')} onCheckedChange={() => handleSubscriptionChange('music')} className="ml-2"/><Label htmlFor="sub-music" className="mr-2">מנוי מוזיקה (ספוטיפיי, אפל מיוזיק)</Label></div>
                            <div className="flex items-center justify-end"><Checkbox id="sub-gym" checked={subscriptions.includes('gym')} onCheckedChange={() => handleSubscriptionChange('gym')} className="ml-2"/><Label htmlFor="sub-gym" className="mr-2">מנוי לחדר כושר</Label></div>
                        </div>
                    </div>

                     <div className="text-right">
                        <Label>האם אתה נוטל תרופות קבועות / מיוחדות?</Label>
                        <RadioGroup value={takesMeds} onValueChange={setTakesMeds} className="mt-2">
                           <div className="flex items-center justify-end"><Label htmlFor="meds-yes" className="mr-2">כן</Label><RadioGroupItem value="yes" id="meds-yes" /></div>
                           <div className="flex items-center justify-end"><Label htmlFor="meds-no" className="mr-2">לא</Label><RadioGroupItem value="no" id="meds-no" /></div>
                        </RadioGroup>
                    </div>

                    <div className="text-right">
                        <Label>האם אתה סטודנט או לוקח קורסים?</Label>
                        <RadioGroup value={isStudent} onValueChange={setIsStudent} className="mt-2">
                           <div className="flex items-center justify-end"><Label htmlFor="student-yes" className="mr-2">כן</Label><RadioGroupItem value="yes" id="student-yes" /></div>
                           <div className="flex items-center justify-end"><Label htmlFor="student-no" className="mr-2">לא</Label><RadioGroupItem value="no" id="student-no" /></div>
                        </RadioGroup>
                    </div>
                    
                    <div className="text-right">
                      <Label>באיזו תדירות אתה קונה בגדים או נעליים?</Label>
                      <RadioGroup value={clothingHabits} onValueChange={setClothingHabits} className="mt-2">
                        <div className="flex items-center justify-end"><Label htmlFor="c1" className="mr-2">לעיתים רחוקות</Label><RadioGroupItem value="rarely" id="c1" /></div>
                        <div className="flex items-center justify-end"><Label htmlFor="c2" className="mr-2">בתחילת עונה / בחגים</Label><RadioGroupItem value="seasonally" id="c2" /></div>
                        <div className="flex items-center justify-end"><Label htmlFor="c3" className="mr-2">פעם בחודש או יותר</Label><RadioGroupItem value="monthly" id="c3" /></div>
                      </RadioGroup>
                    </div>

                    <div className="text-right">
                      <Label>מהן פעילויות הפנאי העיקריות שלך?</Label>
                      <RadioGroup value={entertainmentHabits} onValueChange={setEntertainmentHabits} className="mt-2">
                        <div className="flex items-center justify-end"><Label htmlFor="e1" className="mr-2">בעיקר בבית (ספרים, משחקים)</Label><RadioGroupItem value="home" id="e1" /></div>
                        <div className="flex items-center justify-end"><Label htmlFor="e2" className="mr-2">יציאות (סרטים, פאבים)</Label><RadioGroupItem value="out" id="e2" /></div>
                        <div className="flex items-center justify-end"><Label htmlFor="e3" className="mr-2">ספורט או תחביבים יקרים</Label><RadioGroupItem value="sports" id="e3" /></div>
                      </RadioGroup>
                    </div>
                    
                    <div className="text-right">
                        <Label>האם יש לך חובות פעילים (הלוואות, מינוס)?</Label>
                        <RadioGroup value={hasDebt} onValueChange={setHasDebt} className="mt-2">
                           <div className="flex items-center justify-end"><Label htmlFor="debt-yes" className="mr-2">כן</Label><RadioGroupItem value="yes" id="debt-yes" /></div>
                           <div className="flex items-center justify-end"><Label htmlFor="debt-no" className="mr-2">לא</Label><RadioGroupItem value="no" id="debt-no" /></div>
                        </RadioGroup>
                    </div>

                     <div className="text-right">
                        <Label>מהי מטרת החיסכון העיקרית שלך כרגע?</Label>
                        <RadioGroup value={savingsGoal} onValueChange={setSavingsGoal} className="mt-2">
                           <div className="flex items-center justify-end"><Label htmlFor="sg-none" className="mr-2">אין מטרה מוגדרת</Label><RadioGroupItem value="none" id="sg-none" /></div>
                           <div className="flex items-center justify-end"><Label htmlFor="sg-emergency" className="mr-2">קרן חירום</Label><RadioGroupItem value="emergency" id="sg-emergency" /></div>
                           <div className="flex items-center justify-end"><Label htmlFor="sg-large-purchase" className="mr-2">רכישה גדולה (רכב, חופשה)</Label><RadioGroupItem value="large-purchase" id="sg-large-purchase" /></div>
                           <div className="flex items-center justify-end"><Label htmlFor="sg-investing" className="mr-2">השקעה</Label><RadioGroupItem value="investing" id="sg-investing" /></div>
                        </RadioGroup>
                    </div>
                    
                    <div className="text-right">
                        <Label>האם יש לך חיות מחמד?</Label>
                        <RadioGroup value={hasPets} onValueChange={setHasPets} className="mt-2">
                           <div className="flex items-center justify-end"><Label htmlFor="pets-yes" className="mr-2">כן</Label><RadioGroupItem value="yes" id="pets-yes" /></div>
                           <div className="flex items-center justify-end"><Label htmlFor="pets-no" className="mr-2">לא</Label><RadioGroupItem value="no" id="pets-no" /></div>
                        </RadioGroup>
                    </div>
                    
                    <div className="text-right">
                        <Label>האם יש לך ילדים?</Label>
                        <RadioGroup value={hasChildren} onValueChange={setHasChildren} className="mt-2">
                           <div className="flex items-center justify-end"><Label htmlFor="children-yes" className="mr-2">כן</Label><RadioGroupItem value="yes" id="children-yes" /></div>
                           <div className="flex items-center justify-end"><Label htmlFor="children-no" className="mr-2">לא</Label><RadioGroupItem value="no" id="children-no" /></div>
                        </RadioGroup>
                    </div>
                    
                    <div className="text-right">
                        <Label htmlFor="grooming-budget">כמה אתה מוציא בחודש על טיפוח ויופי (תספורת, קוסמטיקה)? (₪)</Label>
                        <Input id="grooming-budget" type="number" value={groomingBudget} onChange={(e) => setGroomingBudget(Number(e.target.value))} className="mt-1 text-right" />
                    </div>

                    <div className="text-right">
                        <Label>האם אתה מתכנן לטוס לחו"ל או חופשה גדולה בשנה הקרובה?</Label>
                        <RadioGroup value={travelPlans} onValueChange={setTravelPlans} className="mt-2">
                           <div className="flex items-center justify-end"><Label htmlFor="travel-yes" className="mr-2">כן</Label><RadioGroupItem value="yes" id="travel-yes" /></div>
                           <div className="flex items-center justify-end"><Label htmlFor="travel-no" className="mr-2">לא</Label><RadioGroupItem value="no" id="travel-no" /></div>
                        </RadioGroup>
                    </div>
                </div>
            </>
        )
      case 'ai-suggestions':
        return (
            <>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 "><Wand2 className="text-primary"/>{STEPS[currentStep].title}</DialogTitle>
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
                    <div className="space-y-4 py-4">
                        <div className="max-h-72 overflow-y-auto pr-2 space-y-4">
                            {suggestions.map((suggestion) => (
                                <div key={suggestion.category} className="flex items-center gap-4">
                                    <Label htmlFor={suggestion.category} className="w-28 text-right">{suggestion.category}</Label>
                                    <Input id={suggestion.category} type="number" value={suggestion.planned} onChange={e => handleSuggestionChange(suggestion.category, e.target.value)} className="flex-1" />
                                </div>
                            ))}
                        </div>
                        <Card className="mt-4 bg-muted/50">
                            <CardContent className="p-4 space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">הכנסה חודשית:</span>
                                    <span className="font-medium">₪{income.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">סה"כ תקציב:</span>
                                    <span className="font-medium">₪{totalBudgeted.toLocaleString()}</span>
                                </div>
                                <div className={cn("flex justify-between items-center font-bold text-base pt-2 border-t", remainingIncome >= 0 ? "text-green-600" : "text-destructive")}>
                                    <span>יתרה:</span>
                                    <span>₪{remainingIncome.toLocaleString()}</span>
                                </div>
                            </CardContent>
                        </Card>
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
                <div className="py-4 text-right">
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
