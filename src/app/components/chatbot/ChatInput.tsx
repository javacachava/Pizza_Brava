import React from 'react';
import { Button } from '../ui/Button';

interface ChatInputProps {
    value: string;
    onChange: (v: string) => void;
    onSend: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ value, onChange, onSend }) => {
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <div
            style={{
                padding: '10px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                gap: '8px',
                backgroundColor: 'white'
            }}
        >
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe un mensaje..."
                style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '20px',
                    border: '1px solid #cbd5e0',
                    outline: 'none',
                    fontSize: '0.9rem',
                    backgroundColor: '#f7fafc'
                }}
            />

            <Button
                onClick={onSend}
                style={{
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                ➤
            </Button>
        </div>
    );
};
