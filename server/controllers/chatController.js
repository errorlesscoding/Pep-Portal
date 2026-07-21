const ChatHistory = require('../models/ChatHistory');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// @desc    Get user's chat history
// @route   GET /api/chat/history
// @access  Private
const getChatHistory = async (req, res, next) => {
  try {
    let chat = await ChatHistory.findOne({ user: req.user._id });

    if (!chat) {
      chat = await ChatHistory.create({
        user: req.user._id,
        messages: [],
      });
    }

    res.status(200).json({
      success: true,
      data: chat.messages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send message to chatbot and get Gemini response (context-aware)
// @route   POST /api/chat/message
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { text, pageContext } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide message text' });
    }

    // 1. Fetch or create chat record
    let chat = await ChatHistory.findOne({ user: req.user._id });
    if (!chat) {
      chat = await ChatHistory.create({
        user: req.user._id,
        messages: [],
      });
    }

    // 2. Append user's message to history
    chat.messages.push({
      sender: 'user',
      text: text.trim(),
    });

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    let replyText = '';

    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. Returning chatbot mock response.');
      replyText = `I received your message: "${text}". The current page context is ${pageContext || 'General'}. Please ensure GEMINI_API_KEY is configured in the environment variables to unlock real conversational capabilities.`;
    } else {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // Maintain conversation history context (send last 8 messages)
        const recentMessages = chat.messages.slice(-8);
        const contextHistory = recentMessages
          .map((m) => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
          .join('\n');

        const prompt = `
          You are a professional, helpful, and expert AI Career Coach and Technical Interview Preparer.
          Your task is to answer candidate queries regarding Data Structures, Algorithms (DSA), Resume audits, system design, portfolio additions, and HR behavioral scenarios.
          
          *Current Candidate Context:*
          - Active App Screen Path: ${pageContext || '/dashboard (General)'}
          - Direct your focus: If path is "/resume" prioritize ATS matching, keywords, action verbs, and design layout structure questions. If path is "/interview" prioritize question preparation, active dictation tips, coding syntax, and STAR interview structure answers.
          
          Provide detailed, clear explanations. If code snippets are requested, format them cleanly using Markdown.
          
          Recent chat history:
          ${contextHistory}
          
          Assistant Response:
          `;

        const result = await model.generateContent(prompt);
        replyText = result.response.text().trim();
      } catch (error) {
        console.error("Gemini Chat Error:", error);
        replyText = `I'm sorry, I encountered a temporary connection issue. Please check your network or try asking your question again in a moment.`;
      }
    }

    // 3. Append AI reply to history
    chat.messages.push({
      sender: 'ai',
      text: replyText,
    });

    await chat.save();

    res.status(200).json({
      success: true,
      data: chat.messages,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChatHistory,
  sendMessage,
};
