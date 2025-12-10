import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'outline';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className, style, ...props }) => {
    const baseStyle: React.CSSProperties = {
        padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', ...style
    };

    const variants = {
        primary: { backgroundColor: '#ff6b00', color: 'white' }, 
        secondary: { backgroundColor: '#4a5568', color: 'white' },
        danger: { backgroundColor: '#e53e3e', color: 'white' },
        outline: { backgroundColor: 'transparent', border: '1px solid #cbd5e0', color: '#2d3748' }
    };

    return <button style={{ ...baseStyle, ...variants[variant] }} {...props} />;
};