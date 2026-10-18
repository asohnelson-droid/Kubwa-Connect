/**
 * Product categories for Mart, in groups.
 *
 * `id` is what is stored on each product (and on a vendor's profile as their
 * main category), so never rename an id once products use it: change the
 * label instead. To add a category, add a line to a group.
 */

export interface ProductCategory { id: string; label: string }
export interface CategoryGroup { id: string; label: string; categories: ProductCategory[] }

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: 'food', label: 'Food & Drinks', categories: [
      { id: 'Food', label: 'Food & Groceries' },
      { id: 'Drinks', label: 'Drinks & Beverages' },
    ],
  },
  {
    id: 'fashion', label: 'Fashion', categories: [
      { id: 'FashionWomen', label: "Women's Fashion" },
      { id: 'FashionMen', label: "Men's Fashion" },
      { id: 'FashionKids', label: "Children's Fashion" },
      { id: 'ShoesBags', label: 'Shoes & Bags' },
      { id: 'Jewellery', label: 'Watches, Jewellery & Accessories' },
      { id: 'Fabrics', label: 'Fabrics & Tailoring' },
    ],
  },
  {
    id: 'beauty', label: 'Beauty & Health', categories: [
      { id: 'Beauty', label: 'Beauty & Cosmetics' },
      { id: 'Fragrances', label: 'Perfumes & Fragrances' },
      { id: 'Hair', label: 'Hair, Wigs & Braids' },
      { id: 'Health', label: 'Health & Wellness' },
    ],
  },
  {
    id: 'electronics', label: 'Phones & Electronics', categories: [
      { id: 'Electronics', label: 'Phones & Tablets' },
      { id: 'Computers', label: 'Computers & Accessories' },
      { id: 'Appliances', label: 'Home Appliances, TVs & Audio' },
      { id: 'Solar', label: 'Solar, Generators & Power' },
    ],
  },
  {
    id: 'home', label: 'Home & Living', categories: [
      { id: 'Home', label: 'Furniture & Home Decor' },
      { id: 'Kitchen', label: 'Kitchen & Dining' },
      { id: 'Building', label: 'Building Materials & Hardware' },
    ],
  },
  {
    id: 'kids', label: 'Baby & Kids', categories: [
      { id: 'BabyKids', label: 'Baby & Kids Essentials' },
      { id: 'Toys', label: 'Toys & Games' },
    ],
  },
  {
    id: 'agric', label: 'Agriculture', categories: [
      { id: 'Agriculture', label: 'Farm Produce & Livestock' },
      { id: 'AgroInputs', label: 'Farm Inputs & Equipment' },
    ],
  },
  {
    id: 'more', label: 'More', categories: [
      { id: 'Auto', label: 'Vehicles & Auto Parts' },
      { id: 'Sports', label: 'Sports & Fitness' },
      { id: 'Books', label: 'Books, Stationery & Office' },
      { id: 'Gifts', label: 'Gifts, Arts & Crafts' },
      { id: 'Events', label: 'Party & Event Supplies' },
      { id: 'Other', label: 'Other' },
    ],
  },
];

/**
 * Older ids still on some products. They keep working and show in their
 * group, but are not offered when adding a product.
 */
const LEGACY: Record<string, { label: string; group: string }> = {
  Fashion: { label: 'Fashion', group: 'fashion' },
};

/** Every category a vendor can pick, in order. */
export const ALL_CATEGORIES: ProductCategory[] = CATEGORY_GROUPS.flatMap(g => g.categories);

const GROUP_BY_CATEGORY = new Map<string, string>();
for (const g of CATEGORY_GROUPS) for (const c of g.categories) GROUP_BY_CATEGORY.set(c.id, g.id);
for (const [id, l] of Object.entries(LEGACY)) GROUP_BY_CATEGORY.set(id, l.group);

const LABEL_BY_CATEGORY = new Map<string, string>(ALL_CATEGORIES.map(c => [c.id, c.label]));
for (const [id, l] of Object.entries(LEGACY)) LABEL_BY_CATEGORY.set(id, l.label);

export const isGroupId = (id: string) => CATEGORY_GROUPS.some(g => g.id === id);

/** The group a product's category belongs to ('more' when unknown). */
export const groupOfCategory = (categoryId: string | undefined | null) =>
  (categoryId && GROUP_BY_CATEGORY.get(categoryId)) || 'more';

/** A readable name for a stored category id. */
export const categoryLabel = (categoryId: string | undefined | null) =>
  (categoryId && LABEL_BY_CATEGORY.get(categoryId)) || 'Other';

export const isKnownCategory = (categoryId: string | undefined | null) =>
  !!categoryId && ALL_CATEGORIES.some(c => c.id === categoryId);
