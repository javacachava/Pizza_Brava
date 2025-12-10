import React, { useState, useRef, useEffect } from 'react';
import { ChatService, type ChatMessage as MessageModel } from '../../../services/ai/ChatService';
import { ChatMessage } from './ChatMessage';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '../ui/Button';

export const ChatWidget: React.FC = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<MessageModel[]>([
        { id: '1', sender: 'bot', text: `Hola ${user?.name || ''}, soy tu asistente virtual. ¿En qué puedo ayudarte hoy?`, timestamp: new Date() }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    
    const chatService = useRef(new ChatService());
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    if (user?.role === 'kitchen') return null;

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMsg: MessageModel = {
            id: Date.now().toString(),
            sender: 'user',
            text: inputText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        try {
            setTimeout(async () => {
                const response = await chatService.current.processMessage(userMsg.text, user?.role || 'cashier');
                
                const botMsg: MessageModel = {
                    id: (Date.now() + 1).toString(),
                    sender: 'bot',
                    text: response,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, botMsg]);
                setIsTyping(false);
            }, 800);
        } catch (error) {
            console.error(error);
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    width: '60px',
                    height: '60px',
                    backgroundColor: '#ff6b00',
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                    zIndex: 2000,
                    transition: 'transform 0.2s'
                }}
            >
                <span style={{ fontSize: '30px' }}>🤖</span>
            </div>

            {isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '90px',
                    right: '20px',
                    width: '350px',
                    height: '500px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 2000,
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{ backgroundColor: '#2d3748', color: 'white', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold' }}>Asistente Pizza Brava</span>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
                    </div>

                    <div style={{ flex: 1, padding: '15px', overflowY: 'auto', backgroundColor: '#f7fafc' }}>
                        {messages.map(msg => (
                            <ChatMessage key={msg.id} text={msg.text} sender={msg.sender} />
                        ))}
                        {isTyping && <div style={{ fontSize: '0.8rem', color: '#718096', fontStyle: 'italic', marginLeft: '10px' }}>Escribiendo...</div>}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={{ padding: '10px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '5px' }}>
                        <input 
                            type="text" 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Pregunta algo..."
                            style={{ flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid #cbd5e0', outline: 'none' }}
                        />
                        <Button onClick={handleSend} style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}>
                            ➤
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
};