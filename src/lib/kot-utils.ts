import { OrderItem, KOTPreference } from '@/lib/types';

export const groupItemsForKOT = (items: OrderItem[], kotPreference: KOTPreference): { title: string; items: OrderItem[] }[] => {
    if (items.length === 0) return [];

    const { type, categories: kotCategories = [] } = kotPreference;

    switch (type) {
        case 'single':
            return items.length > 0 ? [{ title: 'KOT', items }] : [];

        case 'separate': {
            const kitchenItems = items.filter(item => item.category !== 'Beverages');
            const barItems = items.filter(item => item.category === 'Beverages');
            const groups = [];
            if (kitchenItems.length > 0) groups.push({ title: 'Kitchen KOT', items: kitchenItems });
            if (barItems.length > 0) groups.push({ title: 'Bar KOT', items: barItems });
            return groups;
        }

        case 'category': {
            // Items that are NOT in the special separated categories
            const generalItems = items.filter(item => !kotCategories.includes(item.category || ''));
            const groups = [];

            if (generalItems.length > 0) {
                // Further split general items into kitchen and bar if needed, or keep them as "General KOT"
                // Based on previous logic, we might want to split them by Kitchen/Bar if they aren't in a special category
                // But for now, let's keep the existing logic which seemed to split them too.

                const kitchenItems = generalItems.filter(item => item.category !== 'Beverages');
                const barItems = generalItems.filter(item => item.category === 'Beverages');

                if (kitchenItems.length > 0) groups.push({ title: 'Kitchen KOT', items: kitchenItems });
                if (barItems.length > 0) groups.push({ title: 'Bar KOT', items: barItems });
            }

            // Items that ARE in the special categories
            kotCategories.forEach(category => {
                const categoryItems = items.filter(item => item.category === category);
                if (categoryItems.length > 0) {
                    groups.push({ title: `${category} KOT`, items: categoryItems });
                }
            });
            return groups;
        }

        default:
            return items.length > 0 ? [{ title: 'KOT', items }] : [];
    }
};
