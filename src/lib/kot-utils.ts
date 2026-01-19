import { OrderItem, KOTPreference } from '@/lib/types';

export const groupItemsForKOT = (items: OrderItem[], kotPreference: KOTPreference): { title: string; items: OrderItem[] }[] => {
    if (items.length === 0) return [];

    const { type, categories: kotCategories = [] } = kotPreference;

    switch (type) {
        case 'single':
            return items.length > 0 ? [{ title: 'KOT', items }] : [];

        case 'separate': {
            const isBeverage = (cat: string) => cat.trim().toLowerCase() === 'beverages';
            const kitchenItems = items.filter(item => !isBeverage(item.category || ''));
            const barItems = items.filter(item => isBeverage(item.category || ''));
            const groups = [];
            if (kitchenItems.length > 0) groups.push({ title: 'Kitchen KOT', items: kitchenItems });
            if (barItems.length > 0) groups.push({ title: 'Bar KOT', items: barItems });
            return groups;
        }

        case 'category': {
            const generalItems = items.filter(item => !kotCategories.includes(item.category || ''));
            const groups = [];

            if (generalItems.length > 0) {
                groups.push({ title: 'KOT', items: generalItems });
            }

            // Items that ARE in the special categories
            kotCategories.forEach(category => {
                const categoryItems = items.filter(item => item.category === category);
                if (categoryItems.length > 0) {
                    const isBeverage = (cat: string) => cat.trim().toLowerCase() === 'beverages';
                    const title = isBeverage(category) ? 'Bar KOT' : `${category} KOT`;
                    groups.push({ title, items: categoryItems });
                }
            });
            return groups;
        }

        default:
            return items.length > 0 ? [{ title: 'KOT', items }] : [];
    }
};
