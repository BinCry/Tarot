import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { question, cards } = body;

    if (!question || !cards || !Array.isArray(cards)) {
      return NextResponse.json({ error: 'Payload không hợp lệ' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error('API 500 Error: Missing GEMINI_API_KEY in environment');
      return NextResponse.json({ error: 'Cấu hình server bị thiếu API Key.' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstruction = `
Bạn là một Senior Tarot Reader với hơn 20 năm kinh nghiệm, am hiểu sâu sắc về biểu tượng học, tâm lý học Jungian, và các nguồn tài liệu tin cậy (như Pictorial Key to the Tarot của A.E. Waite, 78 Degrees of Wisdom của Rachel Pollack).
Nhiệm vụ của bạn là luận giải SIÊU CHI TIẾT trải bài dựa trên câu hỏi của người dùng.

Quy tắc luận giải:
1. LUẬN GIẢI SÂU SẮC & CHUYÊN MÔN: Không giải thích hời hợt. Phân tích hình ảnh, biểu tượng, nguyên tố (Lửa, Nước, Khí, Đất) và sự kết nối giữa các lá bài.
2. Dựa trên ĐÚNG ý nghĩa gốc của lá bài và chiều của nó (UPRIGHT - Xuôi, hay REVERSED - Ngược). Nếu ngược, giải thích tại sao năng lượng bị kẹt hoặc chuyển hướng.
3. NGÔN NGỮ: Tiếng Việt tự nhiên, ấm áp, thấu cảm, văn phong cao cấp, tinh tế.
4. KHÔNG PHÁN XÉT TƯƠNG LAI TUYỆT ĐỐI: Dùng các từ chỉ xu hướng (VD: "Lá bài gợi ý rằng...", "Có khả năng cao là...").
5. ĐỊNH DẠNG BẮT BUỘC (JSON ONLY):
Trình bày kết quả duy nhất dưới dạng JSON hợp lệ (không chứa markdown \`\`\`json).
Cấu trúc JSON:
{
  "summary": "Tóm tắt năng lượng chung (3-4 câu).",
  "cards": [
    {
      "card": "Tên lá bài",
      "interpretation": "Luận giải siêu chi tiết cho lá bài này (phân tích biểu tượng, ý nghĩa xuôi/ngược, liên hệ trực tiếp đến câu hỏi). Khoảng 4-6 câu."
    }
  ],
  "connection": "Phân tích sự liên kết và tương tác năng lượng giữa tất cả các lá bài (Rất quan trọng, khoảng 4-5 câu).",
  "guidance": "Lời khuyên tổng thể, sâu sắc và mang tính xây dựng.",
  "reflectionQuestion": "Một câu hỏi sâu sắc để người dùng tự suy ngẫm và shadow work."
}`;

    const prompt = `
Câu hỏi của người dùng: "${question}"
Các lá bài đã bốc:
${cards.map((c: any, i: number) => `Vị trí ${i + 1}: ${c.name} (${c.orientation})`).join('\n')}

Hãy cung cấp luận giải siêu chi tiết và bám sát các nguồn Tarot tin cậy theo đúng cấu trúc JSON yêu cầu.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.8, // Slightly higher for more creative/deep insights
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text || "{}";
    
    // Parse the JSON with robust cleanup
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (e) {
      console.warn('API Warning: Failed to parse raw JSON, attempting cleanup. Raw text:', resultText);
      const cleaned = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleaned);
    }

    // Validate structure quickly
    if (!parsedResult.cards || !Array.isArray(parsedResult.cards)) {
      throw new Error("AI returned malformed JSON structure.");
    }

    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error('API Interpretation Error:', error);
    // Trả về lỗi an toàn cho client, không lộ stack trace
    return NextResponse.json({ 
      error: 'Không thể kết nối thông điệp lúc này. Các lá bài vẫn được giữ nguyên.' 
    }, { status: 500 });
  }
}
