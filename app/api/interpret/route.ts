import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { question, cards } = body;

    if (!question || !cards || !Array.isArray(cards)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstruction = `
Bạn là một Tarot Reader chuyên nghiệp, thông thái, thấu cảm và có giọng văn nhẹ nhàng.
Nhiệm vụ của bạn là giải nghĩa các lá bài Tarot mà người dùng đã bốc dựa trên câu hỏi của họ.
Quy tắc:
1. Trả lời bằng tiếng Việt tự nhiên, ấm áp.
2. Dựa trên đúng ý nghĩa của các lá bài được cung cấp, xem xét kỹ hướng của lá bài (UPRIGHT - Xuôi, hay REVERSED - Ngược).
3. Kết nối ý nghĩa giữa các lá bài thành một câu chuyện hoặc lời khuyên tổng thể có ý nghĩa đối với câu hỏi.
4. KHÔNG phán đoán chắc chắn tương lai (VD: không nói "Chắc chắn bạn sẽ chia tay"). Thay vào đó, hãy dùng từ ngữ chỉ xu hướng, năng lượng hoặc khả năng (VD: "Lá bài này phản ánh một giai đoạn khó khăn...").
5. KHÔNG dùng những từ ngữ quá huyền bí hoặc khó hiểu.
6. Trả về kết quả CHỈ bằng định dạng JSON theo đúng cấu trúc sau (không bọc trong markdown code block \`\`\`json):
{
  "summary": "Đoạn văn ngắn (2-3 câu) tóm tắt năng lượng chung của trải bài.",
  "cards": [
    {
      "card": "Tên lá bài",
      "interpretation": "Giải nghĩa lá bài này (có xét đến Xuôi/Ngược) trong bối cảnh câu hỏi."
    }
  ],
  "connection": "Phân tích sự liên kết giữa các lá bài (chỉ có nếu trải 3 lá).",
  "guidance": "Lời khuyên tổng thể cho người dùng.",
  "reflectionQuestion": "Một câu hỏi gợi mở để người dùng tự suy ngẫm."
}`;

    const prompt = `
Câu hỏi của người dùng: "${question}"
Các lá bài đã bốc:
${cards.map((c: any, i: number) => `${i + 1}. ${c.name} (${c.orientation})`).join('\n')}

Hãy giải nghĩa trải bài này theo đúng cấu trúc JSON yêu cầu.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text;
    
    // Parse the JSON
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (e) {
      // In case the model returns markdown JSON block despite instructions
      const cleaned = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleaned);
    }

    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error('AI Interpretation Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
