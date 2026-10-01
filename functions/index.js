import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { GoogleGenAI, Type } from '@google/genai';

initializeApp();

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
const AUTHORIZED_EMAIL = 'hasanibooks.otp@gmail.com';

async function verifyFamilyOwner(req) {
  const header = req.get('authorization') || '';
  if (!header.startsWith('Bearer ')) {
    const error = new Error('Missing Firebase ID token');
    error.status = 401;
    throw error;
  }

  const decoded = await getAuth().verifyIdToken(header.slice(7));
  if (
    String(decoded.email || '').toLowerCase() !== AUTHORIZED_EMAIL ||
    decoded.email_verified !== true
  ) {
    const error = new Error('Not authorized');
    error.status = 403;
    throw error;
  }
  return decoded;
}

function cleanString(value, maxLength) {
  return typeof value === 'string' ? value.slice(0, maxLength) : '';
}

export const geminiProxy = onRequest(
  {
    region: 'asia-southeast1',
    cors: true,
    secrets: [GEMINI_API_KEY],
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.set('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      await verifyFamilyOwner(req);

      const body = req.body || {};
      const action = cleanString(body.action, 20);
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() });

      if (action === 'daily') {
        const name = cleanString(body.profile?.name, 100) || 'the child';
        const age = cleanString(body.profile?.age, 100) || 'not provided';
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `${name}-க்கு இன்றைய ஆதரவான குறிப்பை உருவாக்கவும். குழந்தையின் தற்போதைய வயது: ${age}. முழுப் பதிலும் இயல்பான, எளிய தமிழில் மட்டுமே இருக்க வேண்டும். ஆங்கில வாக்கியங்களைப் பயன்படுத்த வேண்டாம். ${name} அம்மாவிடம் அன்பாகப் பேசுவது போன்ற ஒரு சிறிய கற்பனைச் செய்தியையும், வயதிற்கு ஏற்ற பொதுவான உடல்நல ஆலோசனையை அம்மாவுக்கு ஒரு சுருக்கமான பத்தியாகவும் வழங்கவும். நோயைக் கண்டறியவோ, மருந்தைப் பரிந்துரைக்கவோ, குழந்தைக்கான மருந்தளவைக் கூறவோ கூடாது.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                babyMessage: { type: Type.STRING },
                momAdvice: { type: Type.STRING },
              },
              required: ['babyMessage', 'momAdvice'],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        return res.json({
          babyMessage: cleanString(parsed.babyMessage, 4000),
          momAdvice: cleanString(parsed.momAdvice, 4000),
        });
      }

      if (action === 'ask') {
        const question = cleanString(body.question, 4000);
        const name = cleanString(body.profile?.name, 100) || 'selected profile';
        const age = cleanString(body.profile?.age, 100) || 'not provided';
        const allergies = cleanString(body.profile?.allergies, 500) || 'not recorded';
        const context = cleanString(body.context, 12000);

        if (!question) return res.status(400).json({ error: 'Question is required' });

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Question: ${question}\n\nSelected profile: ${name}, age ${age}, allergies: ${allergies}.\nRecent records:\n${context || 'No records yet.'}`,
          config: {
            systemInstruction:
              'You are a cautious family health information assistant. Give concise general information, not a diagnosis. Never calculate or recommend a child medicine dose. Encourage a qualified clinician for treatment decisions. Clearly advise urgent local medical care for breathing difficulty, seizure, blue lips, severe dehydration, unresponsiveness, or other emergency signs. Mention that AI can be wrong. Do not confuse records between profiles.',
          },
        });

        return res.json({ text: cleanString(response.text, 12000) });
      }

      return res.status(400).json({ error: 'Unknown action' });
    } catch (error) {
      console.error('geminiProxy error', error);
      const status = error?.status || (String(error?.message || '').includes('429') ? 429 : 500);
      return res.status(status).json({
        error: status === 500 ? 'Secure AI service unavailable' : String(error.message || 'Request failed'),
      });
    }
  }
);
