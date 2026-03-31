const { GoogleGenerativeAI } = require("@google/generative-ai");
const ollama = require("ollama").default;

// Controller to handle conversation logic
const generateChatResponse = async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Invalid messages format. Must be an array of objects with {role, content}." });
  }

  // Define the master system prompt to rigidly adhere to financial context
  const systemInstructionContent = `You are an AI financial assistant for FinMate, an app dedicated to personal finance, budgeting, investing, and economics.
    YOUR CORE DIRECTIVE: 
    1. Only answer questions related to personal finance, budgeting, investing, economics, savings, trading, taxes, or general financial literacy.
    2. If the user asks ANY question outside of these topics (like programming, history, general chatter not tied to finance, etc.), you MUST politely decline and remind them that you can only discuss financial topics.
    3. Keep your answers concise, clear, and helpful. Format your responses with markdown if it helps readability.
    4. Provide factual information but remind users that you are an AI assistant, not a certified financial advisor.`;

  // === PRIMARY ENGINE: GOOGLE GEMINI ===
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY in environment"); // Forces fallback instantly
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: systemInstructionContent,
    });

    const lastMessage = messages[messages.length - 1];
    const previousMessages = messages.slice(0, -1);

    // Map FinMate message schema -> Gemini History Schema
    const geminiHistory = previousMessages.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Google Gemini API requires the first message in history to be from a 'user'
    while (geminiHistory.length > 0 && geminiHistory[0].role === "model") {
      geminiHistory.shift();
    }

    const chatSession = model.startChat({ history: geminiHistory });
    const result = await chatSession.sendMessage(lastMessage.content);

    return res.status(200).json({
      reply: { role: "assistant", content: result.response.text() }
    });

  } catch (geminiError) {
    console.warn("Gemini API skipped or failed (Falling back to Ollama):", geminiError.message);

    // === FALLBACK ENGINE: LOCAL OLLAMA ===
    const payloadMessages = [
      { role: "system", content: systemInstructionContent },
      ...messages
    ];

    try {
      const response = await ollama.chat({
        model: "llama3.2", // Local lightweight model fallback
        messages: payloadMessages,
        stream: false,
      });

      return res.status(200).json({ reply: response.message });
    } catch (ollamaError) {
      console.error("Local Ollama Fallback Error:", ollamaError);

      // Handle memory errors gracefully
      if (ollamaError.message && ollamaError.message.includes("requires more system memory")) {
        return res.status(500).json({ error: "Your computer lacks the memory to run the fallback AI model." });
      }

      if (ollamaError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "No AI services are currently available. Gemini key missing and local Ollama is offline." });
      }
      return res.status(500).json({ error: "An error occurred while communicating with the AI model." });
    }
  }
};

module.exports = {
  generateChatResponse,
};
