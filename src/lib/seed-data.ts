
'use client';

const defaultMenuRaw = [
    {
      "category": "All Day Breakfast",
      "items": [
        { "name": "Aloo Parantha", "price": 49, "isVeg": true },
        { "name": "Gobhi Parantha", "price": 59, "isVeg": true },
        { "name": "Paneer Parantha", "price": 69, "isVeg": true },
        { "name": "Mix Parantha", "price": 79, "isVeg": true },
        { "name": "Egg Parantha", "price": 89, "isVeg": false },
        { "name": "Amul Butter", "price": 20, "isVeg": true },
        { "name": "Curd", "price": 30, "isVeg": true },
        { "name": "Plain Omelette", "price": 129, "isVeg": false },
        { "name": "Scrambled Egg", "price": 129, "isVeg": false },
        { "name": "Sunny Side Up", "price": 139, "isVeg": false },
        { "name": "Tomatoe Basil Omelette", "price": 139, "isVeg": false },
        { "name": "Mushroom Omelette", "price": 149, "isVeg": false },
        { "name": "Cheese Omelette", "price": 159, "isVeg": false },
        { "name": "Cheese & Corn Omelette", "price": 169, "isVeg": false },
        { "name": "Butter Toast", "price": 99, "isVeg": true },
        { "name": "Jam Toast", "price": 119, "isVeg": true },
        { "name": "French Toast", "price": 129, "isVeg": true },
        { "name": "Chilly Cheese Toast", "price": 149, "isVeg": true },
        { "name": "Peanut Butter Toast", "price": 169, "isVeg": true },
        { "name": "Banana Nutella Toast", "price": 179, "isVeg": true },
        { "name": "Cornflakes", "price": 119, "isVeg": true },
        { "name": "Chocos", "price": 119, "isVeg": true },
        { "name": "Poha", "price": 139, "isVeg": true },
        { "name": "Lemon Rice", "price": 149, "isVeg": true },
        { "name": "Porridge", "price": 179, "isVeg": true }
      ]
    },
    {
      "category": "Beverages",
      "items": [
        { "name": "Espresso", "price": 95, "isVeg": true },
        { "name": "Double Espresso", "price": 125, "isVeg": true },
        { "name": "Americano", "price": 125, "isVeg": true },
        { "name": "Latte", "price": 89, "isVeg": true },
        { "name": "Cappuccino", "price": 89, "isVeg": true },
        { "name": "Macchiato", "price": 105, "isVeg": true },
        { "name": "Flat White", "price": 135, "isVeg": true },
        { "name": "Mocha", "price": 145, "isVeg": true },
        { "name": "Pour Over", "price": 165, "isVeg": true },
        { "name": "Cold Brew", "price": 155, "isVeg": true },
        { "name": "Iced Latte", "price": 145, "isVeg": true },
        { "name": "Iced Americano", "price": 135, "isVeg": true },
        { "name": "Affogato", "price": 175, "isVeg": true },
        { "name": "Masala Chai", "price": 80, "isVeg": true },
        { "name": "English Breakfast Tea", "price": 90, "isVeg": true },
        { "name": "Green Tea", "price": 90, "isVeg": true },
        { "name": "Chamomile Tea", "price": 100, "isVeg": true },
        { "name": "Hot Chocolate", "price": 150, "isVeg": true },
        { "name": "Turmeric Latte", "price": 130, "isVeg": true },
        { "name": "Lemon Iced Tea", "price": 130, "isVeg": true },
        { "name": "Classic Milkshake", "price": 180, "isVeg": true },
        { "name": "Oreo Milkshake", "price": 200, "isVeg": true },
        { "name": "Fresh Lime Soda", "price": 120, "isVeg": true },
        { "name": "Orange Juice", "price": 150, "isVeg": true },
        { "name": "Banana Flax", "price": 179, "isVeg": true },
        { "name": "Stress Buster Smoothie", "price": 199, "isVeg": true },
        { "name": "The Energizer", "price": 169, "isVeg": true },
        { "name": "ABC", "price": 179, "isVeg": true },
        { "name": "The Refresher", "price": 189, "isVeg": true },
        { "name": "Soda", "price": 30, "isVeg": true },
        { "name": "Coke", "price": 40, "isVeg": true },
        { "name": "Sprite", "price": 40, "isVeg": true }
      ]
    },
    {
        "category": "Pizza's",
        "items": [
            { "name": "Margherita (Medium)", "price": 299, "isVeg": true },
            { "name": "Margherita (Large)", "price": 399, "isVeg": true },
            { "name": "Vegie Supreme (Medium)", "price": 319, "isVeg": true },
            { "name": "Vegie Supreme (Large)", "price": 419, "isVeg": true },
            { "name": "Loaded Paneer (Medium)", "price": 379, "isVeg": true },
            { "name": "Loaded Paneer (Large)", "price": 479, "isVeg": true },
            { "name": "Loaded Chicken (Medium)", "price": 389, "isVeg": false },
            { "name": "Loaded Chicken (Large)", "price": 489, "isVeg": false },
            { "name": "Pesto Pizza Veg (Medium)", "price": 349, "isVeg": true },
            { "name": "Pesto Pizza Veg (Large)", "price": 449, "isVeg": true },
            { "name": "Pesto Pizza Chicken (Medium)", "price": 399, "isVeg": false },
            { "name": "Pesto Pizza Chicken (Large)", "price": 499, "isVeg": false }
        ]
    },
    {
        "category": "Pasta (Penne / Spaghetti)",
        "items": [
            { "name": "Alfredo Pasta (Veg)", "price": 229, "isVeg": true },
            { "name": "Alfredo Pasta (Non-Veg)", "price": 329, "isVeg": false },
            { "name": "Arrabiatta Pasta (Veg)", "price": 229, "isVeg": true },
            { "name": "Arrabiatta Pasta (Non-Veg)", "price": 329, "isVeg": false },
            { "name": "Preme Rose Pasta (Veg)", "price": 229, "isVeg": true },
            { "name": "Preme Rose Pasta (Non-Veg)", "price": 329, "isVeg": false }
        ]
    },
    {
        "category": "Sandwiches",
        "items": [
            { "name": "Bombay Sandwich", "price": 139, "isVeg": true },
            { "name": "All Veg Sub", "price": 149, "isVeg": true },
            { "name": "Veg Grilled Cheese", "price": 179, "isVeg": true },
            { "name": "Tangy Paneer Salsa", "price": 189, "isVeg": true },
            { "name": "Egg Masala", "price": 199, "isVeg": false },
            { "name": "Masala Chicken", "price": 229, "isVeg": false },
            { "name": "Mayo Chicken", "price": 239, "isVeg": false }
        ]
    },
    {
        "category": "Garlic Bread",
        "items": [
            { "name": "Plain Garlic Bread", "price": 149, "isVeg": true },
            { "name": "Cheese Garlic Bread", "price": 209, "isVeg": true },
            { "name": "Stuffed Garlic Bread", "price": 229, "isVeg": true },
            { "name": "Creamy Chicken Bruschetta", "price": 259, "isVeg": false },
            { "name": "Corn & Cheese Bruschetta", "price": 209, "isVeg": true },
            { "name": "Creamy Mushroom Bruschetta", "price": 229, "isVeg": true },
            { "name": "Chicken Bruschetta", "price": 249, "isVeg": false }
        ]
    },
    {
        "category": "Burger's",
        "items": [
            { "name": "Veggie Burger", "price": 169, "isVeg": true },
            { "name": "Paneer Burger", "price": 189, "isVeg": true },
            { "name": "Chicken Burger", "price": 199, "isVeg": false },
            { "name": "Tawa Paneer Burger", "price": 179, "isVeg": true },
            { "name": "Tawa Chicken Burger", "price": 209, "isVeg": false }
        ]
    }
];

const slugify = (text: string) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}


export const seedData = () => {
    let codeCounter = 1;
    const defaultMenu = defaultMenuRaw.map(category => ({
        id: slugify(category.category),
        name: category.category,
        items: category.items.map(item => ({
            ...item,
            history: [], 
            ingredients: [],
            code: String(codeCounter++).padStart(2, '0')
        }))
    }));
    return defaultMenu;
};
