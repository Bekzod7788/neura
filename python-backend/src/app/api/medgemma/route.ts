import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  const systemMessage = `Siz tibbiy maslahatchi botsiz. Bemorga tushunarli tilda:
- Tashxis haqida qisqacha izoh bering.
- Kasallikni aniqlashtirish uchun kamida 2 ta qo'shimcha tekshiruv usulini tavsiya qiling (masalan, MRT, PET, qon biomarkerlari, neyropsixologik test).
- Qisqa va aniq javob bering, keraksiz tafsilotlarsiz.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 400,
      }),
    });

    if (!response.ok) throw new Error(`Groq API xatosi: ${response.status}`);
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'Izoh olinmadi.';
    return NextResponse.json({ result: text });
  } catch (error) {
    console.error('AI izoh xatosi:', error);
    return NextResponse.json({ result: 'AI izohini hozircha olib bo‘lmadi.' });
  }
}
