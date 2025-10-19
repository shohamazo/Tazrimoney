import { PiggyBank, Car, PartyPopper, Home, Receipt, Package, RotateCcw, Utensils, Briefcase, ShoppingCart, HeartPulse, GraduationCap, Shirt, Gamepad, CreditCard, Landmark, Dog, Plane, Sparkles, Baby } from 'lucide-react';
import React from 'react';

export const categoryIcons: { [key: string]: React.ElementType } = {
    'דיור': Home,
    'קניות': ShoppingCart,
    'תחבורה': Car,
    'אוכל ושתיה': Utensils,
    'חשבונות ושירותים': Receipt,
    'בריאות': HeartPulse,
    'חינוך': GraduationCap,
    'ביגוד והנעלה': Shirt,
    'בילוי ופנאי': Gamepad,
    'תשלומים וחיובים': CreditCard,
    'חיסכון והשקעות': Landmark,
    'חיות מחמד': Dog,
    'נסיעות': Plane,
    'יופי וטיפוח': Sparkles,
    'משפחה וילדים': Baby,
    'הוצאות שונות': Package,
};
