import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
    variant = 'primary', 
    isLoading = false, 
    icon,
    children, 
    className = '', 
    disabled,
    ...props 
}) => {
    const baseClass = "flex items-center justify-center gap-2 font-medium py-2.5 px-5 rounded-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-sm tracking-wide";
    
    const variants = {
        primary: "bg-[#ff6b00] hover:bg-[#e65a00] text-white shadow-md shadow-orange-500/20 border border-transparent",
        secondary: "bg-white hover:bg-gray-50 text-slate-700 border border-gray-200 shadow-sm",
        danger: "bg-red-50 hover:bg-red-100 text-red-600 border border-transparent",
        ghost: "bg-transparent hover:bg-slate-100 text-slate-600 border-none shadow-none"
    };

    return (
        <button 
            className={`${baseClass} ${variants[variant]} ${className}`} 
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"/>}
            {!isLoading && icon}
            {children}
        </button>
    );
};