import React from 'react';

interface Props {
    text: string;
    sender: 'user' | 'bot';
}

export const ChatMessage: React.FC<Props> = ({ text, sender }) => {
    const isBot = sender === 'bot';
    return (
        <div style={{
            display: 'flex',
            justifyContent: isBot ? 'flex-start' : 'flex-end',
            marginBottom: '10px'
        }}>
            <div style={{
                maxWidth: '80%',
                padding: '10px 15px',
                borderRadius: '12px',
                backgroundColor: isBot ? '#edf2f7' : '#ff6b00',
                color: isBot ? '#2d3748' : 'white',
                borderBottomLeftRadius: isBot ? '2px' : '12px',
                borderBottomRightRadius: isBot ? '12px' : '2px',
                fontSize: '0.9rem',
                whiteSpace: 'pre-line',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
                {text}
            </div>
        </div>
    );
};