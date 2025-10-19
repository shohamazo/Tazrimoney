
export type ExpenseSubcategory = {
  value: string;
  label: string;
  defaultFrequency?: 'Monthly' | 'One-Time';
};

export type ExpenseCategory = {
  value: string;
  label: string;
  icon: string;
  defaultFrequency?: 'Monthly' | 'One-Time';
  subcategories: ExpenseSubcategory[];
};

export const expenseCategories: ExpenseCategory[] = [
    {
        value: 'housing',
        label: 'דיור',
        icon: '🏠',
        defaultFrequency: 'Monthly',
        subcategories: [
            { value: 'rent', label: 'שכר דירה', defaultFrequency: 'Monthly' },
            { value: 'mortgage', label: 'משכנתא', defaultFrequency: 'Monthly' },
            { value: 'arnona', label: 'ארנונה' },
            { value: 'electricity-bill', label: 'חשבון חשמל' },
            { value: 'water-bill', label: 'חשבון מים' },
            { value: 'gas-bill', label: 'חשבון גז' },
            { value: 'vaad-bait', label: 'ועד בית' },
        ],
    },
    {
        value: 'shopping',
        label: 'קניות',
        icon: '🛒',
        defaultFrequency: 'One-Time',
        subcategories: [
            { value: 'supermarket', label: 'קניות בסופר' },
            { value: 'home-shopping', label: 'קניות לבית' },
            { value: 'cleaning-products', label: 'מוצרי ניקיון' },
        ],
    },
    {
        value: 'transportation',
        label: 'תחבורה',
        icon: '🚗',
        defaultFrequency: 'One-Time',
        subcategories: [
            { value: 'fuel', label: 'דלק' },
            { value: 'car-insurance', label: 'ביטוח רכב' },
            { value: 'public-transport', label: 'תחבורה ציבורית' },
            { value: 'taxis', label: 'מוניות' },
            { value: 'parking', label: 'חניה' },
        ],
    },
    {
        value: 'food',
        label: 'אוכל ושתיה',
        icon: '🍔',
        defaultFrequency: 'One-Time',
        subcategories: [
            { value: 'restaurants', label: 'מסעדות' },
            { value: 'cafes', label: 'בתי קפה' },
            { value: 'fast-food', label: 'אוכל מהיר' },
            { value: 'deliveries', label: 'משלוחים' },
        ],
    },
    {
        value: 'utilities',
        label: 'חשבונות ושירותים',
        icon: '💡',
        defaultFrequency: 'Monthly',
        subcategories: [
            { value: 'phone', label: 'טלפון' },
            { value 'internet', label: 'אינטרנט' },
            { value: 'cable', label: 'כבלים' },
            { value: 'streaming', label: 'מנויי סטרימינג', defaultFrequency: 'Monthly' },
        ],
    },
    {
        value: 'health',
        label: 'בריאות',
        icon: '🏥',
        defaultFrequency: 'One-Time',
        subcategories: [
            { value: 'doctors', label: 'רופאים', defaultFrequency: 'One-Time' },
            { value: 'medications', label: 'תרופות', defaultFrequency: 'One-Time' },
            { value: 'health-insurance', label: 'ביטוח בריאות', defaultFrequency: 'Monthly' },
            { value: 'treatments', label: 'טיפולים' },
        ],
    },
    {
        value: 'education',
        label: 'חינוך',
        icon: '🎓',
        defaultFrequency: 'Monthly',
        subcategories: [
            { value: 'tuition', label: 'שכר לימוד' },
            { value: 'books', label: 'ספרים' },
            { value: 'classes', label: 'חוגים', defaultFrequency: 'Monthly' },
            { value: 'courses', label: 'קורסים' },
        ],
    },
    {
        value: 'clothing',
        label: 'ביגוד והנעלה',
        icon: '👕',
        defaultFrequency: 'One-Time',
        subcategories: [
            { value: 'clothes', label: 'בגדים' },
            { value: 'shoes', label: 'נעליים' },
            { value: 'accessories', label: 'אקססוריז' },
        ],
    },
    {
        value: 'entertainment',
        label: 'בילוי ופנאי',
        icon: '🎁',
        defaultFrequency: 'One-Time',
        subcategories: [
            { value: 'movies', label: 'סרטים' },
            { value: 'shows', label: 'הצגות' },
            { value: 'trips', label: 'טיולים' },
            { value: 'hobbies', label: 'תחביבים' },
            { value: 'sports', label: 'ספורט' },
        ],
    },
    {
        value: 'payments',
        label: 'תשלומים וחיובים',
        icon: '💳',
        defaultFrequency: 'Monthly',
        subcategories: [
            { value: 'credit-cards', label: 'כרטיסי אשראי', defaultFrequency: 'Monthly' },
            { value: 'loans', label: 'הלוואות' },
            { value: 'debt-payment', label: 'תשלום חובות' },
        ],
    },
    {
        value: 'savings',
        label: 'חיסכון והשקעות',
        icon: '🏦',
        defaultFrequency: 'Monthly',
        subcategories: [
            { value: 'pension', label: 'חיסכון לפנסיה', defaultFrequency: 'Monthly' },
            { value: 'provident-fund', label: 'קופת גמל', defaultFrequency: 'Monthly' },
            { value: 'investments', label: 'השקעות' },
            { value: 'life-insurance', label: 'ביטוח חיים', defaultFrequency: 'Monthly' },
        ],
    },
    {
        value: 'pets',
        label: 'חיות מחמד',
        icon: '🐶',
        defaultFrequency: 'Monthly',
        subcategories: [
            { value: 'pet-food', label: 'אוכל לחיות', defaultFrequency: 'Monthly' },
            { value: 'vet', label: 'וטרינר' },
            { value: 'pet-supplies', label: 'ציוד וצעצועים' },
        ],
    },
    {
        value: 'travel',
        label: 'נסיעות',
        icon: '✈️',
        defaultFrequency: 'One-Time',
        subcategories: [
            { value: 'flights', label: 'טיסות' },
            { value: 'hotels', label: 'מלונות' },
            { value: 'abroad-expenses', label: 'הוצאות בחו"ל' },
            { value: 'travel-insurance', label: 'ביטוח נסיעות' },
        ],
    },
    {
        value: 'beauty',
        label: 'יופי וטיפוח',
        icon: '💃',
        defaultFrequency: 'One-Time',
        subcategories: [
            { value: 'hairdresser', label: 'ספר' },
            { value: 'beautician', label: 'קוסמטיקאית' },
            { value: 'grooming-products', label: 'מוצרי טיפוח' },
            { value: 'nails', label: 'ציפורניים' },
        ],
    },
    {
        value: 'family',
        label: 'משפחה וילדים',
        icon: '👪',
        defaultFrequency: 'Monthly',
        subcategories: [
            { value: 'toys', label: 'צעצועים' },
            { value: 'kids-clothing', label: 'בגדי ילדים' },
            { value: 'babysitter', label: 'בייביסיטר', defaultFrequency: 'Monthly' },
            { value: 'kids-activities', label: 'פעילויות ילדים' },
        ],
    },
    {
        value: 'miscellaneous',
        label: 'הוצאות שונות',
        icon: '📈',
        defaultFrequency: 'One-Time',
        subcategories: [
            { value: 'app-subscriptions', label: 'מנויים לאפליקציות', defaultFrequency: 'Monthly' },
            { value: 'donations', label: 'תרומות' },
            { value: 'unplanned-expenses', label: 'הוצאות לא מתוכננות' },
            { value: 'gifts', label: 'מתנות' },
        ],
    },
];

export const simpleBudgetCategories = [
  'דיור', 
  'קניות', 
  'תחבורה', 
  'אוכל ושתיה', 
  'חשבונות ושירותים', 
  'בריאות',
  'חינוך',
  'ביגוד והנעלה',
  'בילוי ופנאי',
  'תשלומים וחיובים',
  'חיסכון והשקעות',
  'חיות מחמד',
  'נסיעות',
  'יופי וטיפוח',
  'משפחה וילדים',
  'הוצאות שונות'
];
