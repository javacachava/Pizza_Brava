export interface Ingredient {
    id: string;
    name: string;
    price: number; 
    isAvailable: boolean;
    unit: 'g' | 'ml' | 'unit';
    stock?: number;
}