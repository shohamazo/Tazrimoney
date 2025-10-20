
export type BudgetItem = {
    category: string;
    planned: number;
};

export type InitialBudgetInput = {
    monthlyIncome: number;
    housing: string;
    monthlyHousingCost: number;
    transportation: string;
    diningOutFrequency: string;
    hasChildren: boolean;
    hasDebt: boolean;
    savingsGoal: string;
    hasPets: boolean;
    takesMeds: boolean;
    isStudent: boolean;
    groceryStyle: string;
    subscriptions: string[];
    clothingHabits: string;
    entertainmentHabits: string;
    groomingBudget: number;
    travelPlans: boolean;
};

// Base percentages for a "standard" budget, used as a fallback or starting point.
const basePercentages: { [key: string]: number } = {
    'קניות': 0.15,
    'תחבורה': 0.10,
    'חשבונות ושירותים': 0.05,
    'אוכל ושתיה': 0.07,
    'בילוי ופנאי': 0.05,
    'חיסכון והשקעות': 0.10,
    'בריאות': 0.03,
    'ביגוד והנעלה': 0.03,
    'תשלומים וחיובים': 0.05,
    'חינוך': 0.0,
    'חיות מחמד': 0.0,
    'משפחה וילדים': 0.0,
    'יופי וטיפוח': 0.02,
    'נסיעות': 0.03,
    'הוצאות שונות': 0.02,
};


export function generateInitialBudget(input: InitialBudgetInput): BudgetItem[] {
    const { monthlyIncome } = input;
    const suggestions: { [key: string]: number } = {};
    let remainingIncome = monthlyIncome;

    // 1. Handle Fixed & High Priority Costs First
    // Housing
    if (input.housing === 'rent' || input.housing === 'own') {
        const cost = Math.min(input.monthlyHousingCost, monthlyIncome * 0.5); // Cap at 50% of income
        suggestions['דיור'] = cost;
        remainingIncome -= cost;
    } else {
        suggestions['דיור'] = 50; // Nominal amount for parent-living
        remainingIncome -= 50;
    }

    // Debt
    if (input.hasDebt) {
        const debtPayment = Math.min(remainingIncome, monthlyIncome * 0.1); // Up to 10% for debt
        suggestions['תשלומים וחיובים'] = (suggestions['תשלומים וחיובים'] || 0) + debtPayment;
        remainingIncome -= debtPayment;
    }

    // Savings
    if (input.savingsGoal !== 'none') {
        let savingsPercentage = 0.10; // Default
        if (input.savingsGoal === 'large-purchase') savingsPercentage = 0.15;
        if (input.savingsGoal === 'investing') savingsPercentage = 0.12;
        
        let savingsAmount = monthlyIncome * savingsPercentage;
        if (input.travelPlans) {
            savingsAmount += monthlyIncome * 0.05; // Add extra for travel goal
        }
        savingsAmount = Math.min(remainingIncome, savingsAmount);
        suggestions['חיסכון והשקעות'] = savingsAmount;
        remainingIncome -= savingsAmount;
    }

    // 2. Calculate budgets from direct user input and clear rules
    // Groceries
    let groceryMultiplier = 1.0;
    if (input.groceryStyle === 'frugal') groceryMultiplier = 0.7;
    if (input.groceryStyle === 'premium') groceryMultiplier = 1.3;
    suggestions['קניות'] = monthlyIncome * basePercentages['קניות'] * groceryMultiplier;

    // Transportation
    let transportMultiplier = 1.0;
    if (input.transportation === 'car') transportMultiplier = 1.5;
    if (input.transportation === 'walk') transportMultiplier = 0.2;
    suggestions['תחבורה'] = monthlyIncome * basePercentages['תחבורה'] * transportMultiplier;

    // Food & Drink (Dining Out)
    let diningMultiplier = 1.0;
    if (input.diningOutFrequency === 'rarely') diningMultiplier = 0.4;
    if (input.diningOutFrequency === 'daily') diningMultiplier = 1.8;
    suggestions['אוכל ושתיה'] = monthlyIncome * basePercentages['אוכל ושתיה'] * diningMultiplier;
    
    // Bills & Services from subscriptions
    let billsTotal = 50; // Base for unknown utilities
    if (input.subscriptions.includes('tv')) billsTotal += 70;
    if (input.subscriptions.includes('music')) billsTotal += 25;
    if (input.subscriptions.includes('gym')) billsTotal += 200;
    suggestions['חשבונות ושירותים'] = billsTotal;

    // Health
    suggestions['בריאות'] = input.takesMeds === 'yes' ? 300 : 100;

    // Clothing
    let clothingMultiplier = 1.0;
    if (input.clothingHabits === 'rarely') clothingMultiplier = 0.5;
    if (input.clothingHabits === 'monthly') clothingMultiplier = 1.5;
    suggestions['ביגוד והנעלה'] = monthlyIncome * basePercentages['ביגוד והנעלה'] * clothingMultiplier;
    
    // Entertainment
    let entertainmentMultiplier = 1.0;
    if (input.entertainmentHabits === 'out') entertainmentMultiplier = 1.5;
    if (input.entertainmentHabits === 'sports') entertainmentMultiplier = 2.0;
    suggestions['בילוי ופנאי'] = monthlyIncome * basePercentages['בילוי ופנאי'] * entertainmentMultiplier;

    // Grooming
    suggestions['יופי וטיפוח'] = input.groomingBudget > 0 ? input.groomingBudget : 50;

    // Conditional categories
    if (input.isStudent) suggestions['חינוך'] = 250;
    if (input.hasPets) suggestions['חיות מחמד'] = 250;
    if (input.hasChildren) suggestions['משפחה וילדים'] = 500;
    if (input.travelPlans) suggestions['נסיעות'] = (suggestions['נסיעות'] || 0) + 150;


    // 3. Sum up calculated discretionary spending and scale if over budget
    const discretionaryCategories = [
        'קניות', 'תחבורה', 'אוכל ושתיה', 'חשבונות ושירותים', 'בריאות', 'ביגוד והנעלה', 
        'בילוי ופנאי', 'יופי וטיפוח', 'חינוך', 'חיות מחמד', 'משפחה וילדים', 'נסיעות'
    ];
    let totalDiscretionaryPlanned = discretionaryCategories.reduce((sum, cat) => sum + (suggestions[cat] || 0), 0);

    if (totalDiscretionaryPlanned > remainingIncome) {
        const scalingFactor = remainingIncome / totalDiscretionaryPlanned;
        discretionaryCategories.forEach(cat => {
            if (suggestions[cat]) {
                suggestions[cat] *= scalingFactor;
            }
        });
    }

    // 4. Final Formatting and Cleanup
    const finalBudget: BudgetItem[] = [];
    for (const category of simpleBudgetCategories) {
        // Skip categories that should be removed
        if (category === 'חיות מחמד' && !input.hasPets) continue;
        if (category === 'משפחה וילדים' && !input.hasChildren) continue;
        if (category === 'חינוך' && !input.isStudent) continue;
        
        const planned = suggestions[category] || 0;
        const roundedPlanned = Math.round(planned / 10) * 10; // Round to nearest 10
        
        if (roundedPlanned > 0) {
            finalBudget.push({ category, planned: roundedPlanned });
        }
    }
    
    return finalBudget;
}
