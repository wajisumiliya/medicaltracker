const FIREBASE_API_KEY = 'AIzaSyBrvs_SB8pKst_tdVec1sF6NlsQsxER0HY';
const AUTHORIZED_EMAIL = 'hasanibooks.otp@gmail.com';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Cache-Control': 'no-store'
    }
  });
}

function clean(value, max) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

async function verifyFirebaseUser(request) {
  const header = request.headers.get('Authorization') || '';
  if (!header.startsWith('Bearer ')) {
    const e = new Error('Missing Firebase ID token');
    e.status = 401;
    throw e;
  }

  const idToken = header.slice(7);
  const response = await fetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(FIREBASE_API_KEY),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    }
  );

  if (!response.ok) {
    const e = new Error('Invalid Firebase session');
    e.status = 401;
    throw e;
  }

  const data = await response.json();
  const user = data.users && data.users[0];

  if (!user || String(user.email || '').toLowerCase() !== AUTHORIZED_EMAIL || user.emailVerified !== true) {
    const e = new Error('Not authorized');
    e.status = 403;
    throw e;
  }
}

async function callGemini(apiKey, prompt, jsonMode = false) {
  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' +
    encodeURIComponent(apiKey);

  const body = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  if (jsonMode) {
    body.generationConfig = { responseMimeType: 'application/json' };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (response.status === 429) {
    const e = new Error('Quota exceeded');
    e.status = 429;
    throw e;
  }

  if (!response.ok) {
    const e = new Error('Gemini request failed');
    e.status = 502;
    throw e;
  }

  const data = await response.json();
  return (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return json({ ok: true });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    if (!env.GEMINI_API_KEY) return json({ error: 'Server secret is not configured' }, 500);

    try {
      await verifyFirebaseUser(request);
      const body = await request.json();
      const action = clean(body?.action, 20);

      if (action === 'daily') {
        const name = clean(body?.profile?.name, 100) || 'the child';
        const age = clean(body?.profile?.age, 100) || 'not provided';

        const prompt =
          name + '-க்கு இன்றைய ஆதரவான குறிப்பை உருவாக்கவும். குழந்தையின் தற்போதைய வயது: ' + age + '. ' +
          'முழுப் பதிலும் இயல்பான, எளிய தமிழில் மட்டுமே இருக்க வேண்டும். ஆங்கில வாக்கியங்களைப் பயன்படுத்த வேண்டாம். ' +
          name + ' அம்மாவிடம் அன்பாகப் பேசுவது போன்ற ஒரு சிறிய கற்பனைச் செய்தியையும், வயதிற்கு ஏற்ற பொதுவான உடல்நல ஆலோசனையை அம்மாவுக்கு ஒரு சுருக்கமான பத்தியாகவும் வழங்கவும். ' +
          'நோயைக் கண்டறியவோ, மருந்தைப் பரிந்துரைக்கவோ, குழந்தைக்கான மருந்தளவைக் கூறவோ கூடாது. ' +
          'Return only valid JSON with keys babyMessage and momAdvice.';

        const output = await callGemini(env.GEMINI_API_KEY, prompt, true);
        let parsed = {};
        try { parsed = JSON.parse(output); } catch {}

        return json({
          babyMessage: clean(parsed.babyMessage, 4000),
          momAdvice: clean(parsed.momAdvice, 4000)
        });
      }

      if (action === 'islamicQuiz') {
        const date = clean(body?.date, 20);
        const prompt =
          'தேதி: ' + date + '. குடும்பத்திற்காக ஒரு புதிய தினசரி இஸ்லாமிய பல்தேர்வு வினாவை உருவாக்கவும். ' +
          'கேள்வி, நான்கு பதில் விருப்பங்கள், மற்றும் விளக்கம் அனைத்தும் இயல்பான எளிய தமிழில் மட்டுமே இருக்க வேண்டும். ' +
          'குர்ஆன், நபிமார்கள், இஸ்லாமிய வரலாறு, வணக்கங்கள், நல்லொழுக்கம் போன்ற அடிப்படை தலைப்புகளில் இருந்து தேர்வு செய்யவும். ' +
          'சர்ச்சைக்குரிய பிரிவினை கருத்துகள், அரசியல், மருத்துவ அல்லது சட்ட ஃபத்வாக்கள் வேண்டாம். ' +
          'ஒரே ஒரு தெளிவான சரியான பதில் இருக்க வேண்டும். correctIndex பூஜ்ஜியத்திலிருந்து தொடங்கும் options பட்டியலின் சரியான இடமாக இருக்க வேண்டும். ' +
          'தவறான பதிலைத் தேர்ந்தெடுத்தவரும் புரிந்துகொள்ளும் வகையில் explanation மூலம் உண்மையை சுருக்கமாக கற்பிக்கவும். ' +
          'Return only valid JSON with keys question, options, correctIndex, and explanation.';

        const output = await callGemini(env.GEMINI_API_KEY, prompt, true);
        let parsed = {};
        try { parsed = JSON.parse(output); } catch {}
        const options = Array.isArray(parsed.options) ? parsed.options.slice(0, 4).map(value => clean(value, 500)) : [];
        const correctIndex = Number(parsed.correctIndex);
        if (options.length !== 4 || !Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
          return json({ error: 'Invalid quiz response' }, 502);
        }
        return json({
          question: clean(parsed.question, 2000),
          options,
          correctIndex,
          explanation: clean(parsed.explanation, 4000)
        });
      }

      if (action === 'ask') {
        const question = clean(body?.question, 4000);
        if (!question) return json({ error: 'Question is required' }, 400);

        const name = clean(body?.profile?.name, 100) || 'selected profile';
        const age = clean(body?.profile?.age, 100) || 'not provided';
        const allergies = clean(body?.profile?.allergies, 500) || 'not recorded';
        const context = clean(body?.context, 12000);

        const prompt =
          'You are a cautious family health information assistant. Give concise general information, not a diagnosis. ' +
          'Never calculate or recommend a child medicine dose. Encourage a qualified clinician for treatment decisions. ' +
          'Clearly advise urgent local medical care for breathing difficulty, seizure, blue lips, severe dehydration, unresponsiveness, or other emergency signs. ' +
          'Mention that AI can be wrong. Do not confuse records between profiles.\n\n' +
          'Question: ' + question + '\n\nSelected profile: ' + name + ', age ' + age + ', allergies: ' + allergies +
          '.\nRecent records:\n' + (context || 'No records yet.');

        const output = await callGemini(env.GEMINI_API_KEY, prompt, false);
        return json({ text: clean(output, 12000) });
      }

      return json({ error: 'Unknown action' }, 400);
    } catch (error) {
      const status = error?.status || 500;
      return json(
        { error: status >= 500 ? 'Secure AI service unavailable' : String(error?.message || 'Request failed') },
        status
      );
    }
  }
};
