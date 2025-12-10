import { ContextRetriever } from './ContextRetriever';

export interface ChatMessage {
    id: string;
    sender: 'user' | 'bot';
    text: string;
    timestamp: Date;
}

export class ChatService {
    private retriever = new ContextRetriever();

    async processMessage(userQuery: string, userRole: string): Promise<string> {
        const context = await this.retriever.retrieveContext(userQuery, userRole);
        
        if (!context) {
            return "Lo siento, no encontré información específica en mis manuales o reportes sobre eso. ¿Podrías intentar preguntar de otra forma? (Ej: 'Cómo cerrar caja', 'Cuánto vendí hoy')";
        }

        return `Aquí tienes la información que encontré:\n\n${context}\nSi necesitas más detalles, consulta con el administrador.`;
    }
}