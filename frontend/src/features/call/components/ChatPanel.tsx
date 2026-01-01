import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: number;
}

interface ChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
    isOpen,
    onClose,
    messages,
    onSendMessage,
}) => {
    const [input, setInput] = useState('');

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSendMessage(input);
            setInput('');
        }
    };

    return (
        <div className={cn(
            "fixed inset-0 md:top-0 md:right-0 md:left-auto md:bottom-0 md:h-full w-full md:w-80 bg-card md:border-l border-border shadow-lg transform transition-transform duration-300 ease-in-out z-40 flex flex-col",
            isOpen ? "translate-x-0" : "translate-x-full"
        )}>
            <div className="flex items-center justify-between px-2 md:px-4 py-3 md:py-2 border-b border-border flex-shrink-0">
                <h3 className="font-semibold text-base md:text-lg">In-Call Messages</h3>
                <button onClick={onClose} className="p-1 hover:bg-secondary rounded">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-4 min-h-0">
                {messages.map((msg) => (
                    <div key={msg.id} className="flex flex-col">
                        <div className="flex items-baseline gap-2">
                            <span className="font-bold text-sm">{msg.sender}</span>
                            <span className="text-xs text-muted-foreground">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="bg-secondary/50 p-2 rounded-md mt-1 text-sm">{msg.text}</p>
                    </div>
                ))}
            </div>

            <div className="border-t border-border bg-card flex-shrink-0 pb-12 md:pb-0">
                <form onSubmit={handleSend} className="p-2 md:p-4">
                    <div className="flex gap-2">
                        <input
                            className="flex-1 bg-secondary rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Type a message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <button type="submit" className="bg-primary text-primary-foreground p-2 rounded-md hover:bg-primary/90 flex-shrink-0">
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
