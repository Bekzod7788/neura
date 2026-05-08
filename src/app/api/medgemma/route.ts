import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  const system = `Siz tajribali shifokor va ilmiy maslahatchisiz. Foydalanuvchiga tashxis yoki segmentatsiya natijasi haqida quyidagilarni o'z ichiga olgan batafsil, ammo oddiy tilda javob bering:
1. Kasallik yoki topilma haqida qisqacha tushuncha.
2. Bemor uchun nima qilish kerakligi (turmush tarzi, parhez, kuzatuv).
3. Kamida 2 ta qo'shimcha tekshiruv usuli (masalan, MRT, PET, qon biomarkerlari).
4. Shifokor uchun davolash mexanizmlari (farmakologik va nofarmakologik).
5. Tavsiya etiladigan dorilar (umumiy nomlari, dozalarsiz).
Javobni o'zbek tilida, xotirjam va dalillarga asoslangan tarzda yozing. Tokenni behuda, keraksiz so'zlarga sarflamang`;
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
      })
    });
    if (!res.ok) throw new Error('Groq xatosi');
    const data = await res.json();
    return NextResponse.json({ result: data.choices[0].message.content });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ result: 'AI izohini hozircha olib bo‘lmadi. Tahlil natijalari yuqorida ko‘rsatilgan.' });
  }
}