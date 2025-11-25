// Servicio puro para IA
const GEMINI_API_KEY = "TU_GEMINI_KEY_AQUI"; 
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

export const standardizeNotesService = async (text) => {
  if (!text) return null;
  const prompt = `Actúa como Jefe de Cocina. Reescribe esta nota de cliente para que sea un comando de cocina BREVE, CLARO y en MAYÚSCULAS. Elimina saludos. Nota: "${text}"`;
  
  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return result ? result.replace(/\n+/g, " | ").trim() : null;
  } catch (error) {
    console.error("Error Gemini Notes:", error);
    return null;
  }
};

export const suggestUpsellService = async (cartItems, menuItems) => {
  const cartSummary = cartItems.map(i => i.name).join(", ");
  const menuCompact = menuItems.map(i => ({ id: i.id, name: i.name, cat: i.category, price: i.price }));
  
  const prompt = `Actúa como mesero experto. Orden actual: [${cartSummary}]. Menú disponible: ${JSON.stringify(menuCompact)}. 
  Sugiere UN solo producto adicional del menú para acompañar. 
  Responde SOLO JSON: { "recommendedItemId": "ID", "reason": "frase corta persuasiva" }. Sin markdown.`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) return null;

    const cleanJson = textResponse
  .replace(/```json/g, '')
  .replace(/```/g, '')
  .trim();

try {
  return JSON.parse(cleanJson);
} catch (e) {
  console.warn("Gemini devolvió JSON inválido:", cleanJson);
  return null;
}

  } catch (error) {
    console.error("Error Gemini Upsell:", error);
    return null;
  }
};