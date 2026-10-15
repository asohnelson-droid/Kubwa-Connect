/**
 * A one-off hand-off between pages: a landing page such as "Plumbers in Kubwa"
 * opens FixIt (or Mart) already filtered to the right category.
 * Read with peek in a state initialiser, then clear once mounted.
 */
let fixitCategory: string | null = null;
let martCategory: string | null = null;

export const setFixitCategoryIntent = (category: string) => { fixitCategory = category; };
export const peekFixitCategoryIntent = () => fixitCategory;
export const clearFixitCategoryIntent = () => { fixitCategory = null; };

export const setMartCategoryIntent = (category: string) => { martCategory = category; };
export const peekMartCategoryIntent = () => martCategory;
export const clearMartCategoryIntent = () => { martCategory = null; };
