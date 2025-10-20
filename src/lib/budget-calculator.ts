
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
};

// Base percentages for a "standard" budget.
const basePercentages: { [key: string]: number } = {
    'דיור': 0.30,
    'קניות': 0.15, // Groceries, etc.
    'תחבורה': 0.10,
    'חשבונות ושירותים': 0.05,
    'אוכל ושתיה': 0.07, // Discretionary eating out
    'בילוי ופנאי': 0.05,
    'חיסכון והשקעות': 0.10,
    'בריאות': 0.03,
    'ביגוד והנעלה': 0.03,
    'תשלומים וחיובים': 0.05,
    'חינוך': 0.0, // Conditional
    'חיות מחמד': 0.0, // Conditional
    'משפחה וילדים': 0.0, // Conditional
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
        suggestions['תשלומים וחיובים'] = debtPayment;
        remainingIncome -= debtPayment;
    }

    // Savings
    if (input.savingsGoal !== 'none') {
        let savingsAmount = 0;
        switch (input.savingsGoal) {
            case 'emergency': savingsAmount = monthlyIncome * 0.10; break;
            case 'large-purchase': savingsAmount = monthlyIncome * 0.15; break;
            case 'investing': savingsAmount = monthlyIncome * 0.12; break;
        }
        savingsAmount = Math.min(remainingIncome, savingsAmount);
        suggestions['חיסכון והשקעות'] = savingsAmount;
        remainingIncome -= savingsAmount;
    }
    
    // 2. Adjust percentages based on lifestyle
    const adjustedPercentages = { ...basePercentages };

    // Transportation
    if (input.transportation === 'car') adjustedPercentages['תחבורה'] = 0.15;
    if (input.transportation === 'walk') adjustedPercentages['תחבורה'] = 0.02;

    // Dining out
    if (input.diningOutFrequency === 'rarely') adjustedPercentages['אוכל ושתיה'] = 0.03;
    if (input.diningOutFrequency === 'daily') adjustedPercentages['אוכל ושתיה'] = 0.12;

    // Health
    if (!input.takesMeds) adjustedPercentages['בריאות'] = 0.01; // Lower base for non-meds

    // Conditional Categories
    if (input.hasPets) adjustedPercentages['חיות מחמד'] = 0.04;
    if (input.hasChildren) adjustedPercentages['משפחה וילדים'] = 0.10;
    if (input.isStudent) adjustedPercentages['חינוך'] = 0.05;


    // 3. Allocate remaining income based on adjusted percentages
    const discretionaryCategories = [
        'קניות', 'תחבורה', 'חשבונות ושירותים', 'אוכל ושתיה',
        'בילוי ופנאי', 'בריאות', 'ביגוד והנעלה', 'חינוך', 'חיות מחמד',
        'משפחה וילדים', 'הוצאות שונות'
    ];

    let totalPercentage = discretionaryCategories.reduce((sum, cat) => sum + (adjustedPercentages[cat] || 0), 0);

    for (const category of discretionaryCategories) {
        if (adjustedPercentages[category] > 0) {
            const allocation = (adjustedPercentages[category] / totalPercentage) * remainingIncome;
            suggestions[category] = (suggestions[category] || 0) + allocation;
        }
    }
    
    // 4. Final Formatting and Cleanup
    const finalBudget: BudgetItem[] = [];
    let totalPlanned = 0;

    for (const [category, planned] of Object.entries(suggestions)) {
        // Ensure we don't add categories that should be excluded
        if (category === 'חיות מחמד' && !input.hasPets) continue;
        if (category === 'משפחה וילדים' && !input.hasChildren) continue;
        if (category === 'חינוך' && !input.isStudent) continue;

        const roundedPlanned = Math.round(planned / 10) * 10; // Round to nearest 10
        if (roundedPlanned > 0) {
            finalBudget.push({ category, planned: roundedPlanned });
            totalPlanned += roundedPlanned;
        }
    }
    
    // If we over-budgeted due to rounding, trim from discretionary categories
    let overBudget = totalPlanned - monthlyIncome;
    if (overBudget > 0) {
        const entertainmentItem = finalBudget.find(b => b.category === 'בילוי ופנאי');
        if (entertainmentItem) {
            entertainmentItem.planned = Math.max(0, entertainmentItem.planned - overBudget);
        }
    }
    
     // Add max health budget rule
    const healthItem = finalBudget.find(b => b.category === 'בריאות');
    if (healthItem && !input.takesMeds) {
        healthItem.planned = Math.min(healthItem.planned, 150);
    }


    return finalBudget.filter(item => item.planned > 0);
}
