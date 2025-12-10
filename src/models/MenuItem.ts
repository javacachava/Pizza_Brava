export interface MenuItem {
    id: string;
    categoryId: string;
    name: string;
    price: number;
    isAvailable: boolean;
    description?: string;
    image?: string;

    usesIngredients: boolean;
    usesFlavors: boolean;
    usesSizeVariant: boolean;
    comboEligible: boolean;
}