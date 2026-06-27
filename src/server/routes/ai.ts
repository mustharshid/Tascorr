import { Router, Request, Response } from 'express';
import { authenticateSession } from '../middleware/auth.middleware.js';
import { Validator } from '../utils/validator.js';

const router = Router();

/**
 * POST /api/ai/refine
 * Refines a task title or description using Google Gemini API
 */
router.post('/refine', authenticateSession, async (req: Request, res: Response) => {
  const { text, type } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ 
      error: 'AI formatting is not configured. Please define the GEMINI_API_KEY environment variable in your server configurations.' 
    });
  }

  // Validate required inputs
  const missing = Validator.validateRequired(req.body, ['text', 'type']);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing mandatory parameter fields: ${missing.join(', ')}` });
  }

  if (type !== 'title' && type !== 'description') {
    return res.status(400).json({ error: 'Type parameter must be either "title" or "description".' });
  }

  const cleanText = text.trim();
  if (cleanText.length === 0) {
    return res.status(400).json({ error: 'Text cannot be empty.' });
  }

  try {
    // Construct prompt based on field type
    let prompt = '';
    if (type === 'title') {
      prompt = `Act as a professional task coordinator. Rewrite the following task title to be clear, concise, and professional (maximum 8 words). Respond with ONLY the polished title and nothing else. Do not add quotes, introductory remarks, explanation, or markdown wrap.\n\nTitle to polish:\n${cleanText}`;
    } else {
      prompt = `Act as a professional task coordinator. Rewrite the following task description to correct grammar and spelling mistakes, format it clearly, and make it highly professional. Keep it concise. If it lists multiple items or steps, format them with simple markdown bullet points (- item). Respond with ONLY the polished description and nothing else. Do not add quotes, explanation, introductory remarks, or markdown code wraps.\n\nDescription to polish:\n${cleanText}`;
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const apiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      console.error('[Gemini API Error Response]:', errText);
      return res.status(502).json({ error: 'Failed to communicate with the Gemini API server.' });
    }

    const data = (await apiResponse.json()) as any;
    const refinedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!refinedText) {
      console.error('[Gemini Response Schema Error]:', JSON.stringify(data));
      return res.status(502).json({ error: 'Unexpected response format from the AI generator.' });
    }

    return res.status(200).json({ refinedText });

  } catch (error: any) {
    console.error('[AI Refinement Exception]:', error);
    return res.status(500).json({ error: `An error occurred during text refinement: ${error.message}` });
  }
});

export default router;
