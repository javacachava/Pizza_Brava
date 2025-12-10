import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, hoverable = false }) => {
    return (
        <div 
            onClick={onClick}
            className={`
                bg-white rounded-xl border border-slate-100 p-4
                ${hoverable ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : 'shadow-sm'}
                transition-all duration-300 ease-out
                ${className}
            `}
        >
            {children}
        </div>
    );
};