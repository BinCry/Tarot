import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import tarotCards from '@/data/tarot-cards.json';
import { getVietnameseCardContext, localizeTarotTerms } from '@/data/tarot-vi';
import type { InterpretationResult, TarotCardData } from '@/types/tarot';

type RequestCard = {
  name: string;
  orientation: 'UPRIGHT' | 'REVERSED';
};

const INTERPRETATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    cards: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          card: { type: 'string' },
          interpretation: { type: 'string' }
        },
        required: ['card', 'interpretation']
      }
    },
    connection: { type: 'string' },
    guidance: { type: 'string' },
    reflectionQuestion: { type: 'string' }
  },
  required: ['summary', 'cards', 'connection', 'guidance', 'reflectionQuestion']
} as const;

const tarotCardMap = new Map(
  (tarotCards as TarotCardData[]).map((card) => [card.name, card])
);

function isRequestCard(value: unknown): value is RequestCard {
  if (!value || typeof value !== 'object') return false;

  const card = value as Partial<RequestCard>;
  return typeof card.name === 'string' && (card.orientation === 'UPRIGHT' || card.orientation === 'REVERSED');
}

function isInterpretationResult(value: unknown): value is InterpretationResult {
  if (!value || typeof value !== 'object') return false;

  const result = value as Partial<InterpretationResult>;

  return (
    typeof result.summary === 'string' &&
    Array.isArray(result.cards) &&
    result.cards.every((card) => {
      if (!card || typeof card !== 'object') return false;

      const item = card as { card?: unknown; interpretation?: unknown };
      return typeof item.card === 'string' && typeof item.interpretation === 'string';
    }) &&
    typeof result.connection === 'string' &&
    typeof result.guidance === 'string' &&
    typeof result.reflectionQuestion === 'string'
  );
}

function normalizeInterpretationResult(
  result: InterpretationResult,
  requestedCards: RequestCard[]
): InterpretationResult {
  return {
    summary: localizeTarotTerms(result.summary.trim()),
    cards: requestedCards.map((requestedCard, index) => {
      const interpretedCard = result.cards[index];
      const localizedCard = getVietnameseCardContext(
        requestedCard.name,
        requestedCard.orientation
      );

      return {
        card: localizedCard.name,
        interpretation: localizeTarotTerms(
          interpretedCard?.interpretation?.trim() ||
            `Lá ${index + 1} chưa nhận được luận giải chi tiết.`
        )
      };
    }),
    connection: localizeTarotTerms(result.connection.trim()),
    guidance: localizeTarotTerms(result.guidance.trim()),
    reflectionQuestion: localizeTarotTerms(result.reflectionQuestion.trim()),
    notice: result.notice ? localizeTarotTerms(result.notice.trim()) : undefined
  };
}

function getErrorStatus(error: unknown) {
  if (!error || typeof error !== 'object') return undefined;

  const status = Reflect.get(error, 'status');
  return typeof status === 'number' ? status : undefined;
}

function getErrorDetails(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;

  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown Gemini error';
  }
}

function getGeminiFailureReason(error: unknown) {
  const status = getErrorStatus(error);

  if (status === 401 || status === 403) {
    return 'Khóa truy cập Gemini bị từ chối hoặc chưa được cấp quyền sử dụng dịch vụ tạo nội dung.';
  }

  if (status === 429) {
    return 'Gemini đang bận hoặc tài khoản đã chạm hạn mức sử dụng.';
  }

  return 'Gemini chưa trả về phản hồi hợp lệ từ máy chủ.';
}

function getSpreadLabel(index: number, count: number) {
  if (count === 1) return 'thông điệp cốt lõi';
  if (count === 3) return ['tình huống hiện tại', 'thử thách chính', 'hướng mở ra'][index] || `lá ${index + 1}`;
  return `lá ${index + 1}`;
}

function buildFallbackCardInterpretation(
  card: RequestCard,
  index: number,
  count: number
) {
  const localizedCard = getVietnameseCardContext(card.name, card.orientation);
  const orientationLabel = card.orientation === 'UPRIGHT' ? 'xuôi' : 'ngược';

  return `Ở vị trí ${getSpreadLabel(index, count)}, lá ${localizedCard.name} ở chiều ${orientationLabel} nói về ${localizedCard.meaning}. Trọng tâm của lá nằm ở ${localizedCard.focus}. Khi đối chiếu với câu hỏi hiện tại, hãy quan sát biểu hiện cụ thể của chủ đề này trong lời nói, cảm xúc và hành động thực tế thay vì vội kết luận từ một dấu hiệu đơn lẻ.`;
}

function buildFallbackInterpretation(
  requestedCards: RequestCard[],
  reason: string
): InterpretationResult {
  const cardInterpretations = requestedCards.map((card, index) => ({
    card: getVietnameseCardContext(card.name, card.orientation).name,
    interpretation: buildFallbackCardInterpretation(card, index, requestedCards.length)
  }));

  const cardNames = requestedCards
    .map((card) => getVietnameseCardContext(card.name, card.orientation).name)
    .join(', ');

  return {
    summary: `Trải bài gồm ${cardNames} mở ra nhiều lớp của câu hỏi: cảm xúc bên trong, cách bạn đang nhìn nhận tình huống và hành động có thể thực hiện trong thực tế. Đây là bản luận giải nền dựa trực tiếp trên từng lá và chiều xuất hiện; hãy đọc các phần theo thứ tự để nhận ra chủ đề nào đang lặp lại rõ nhất.`,
    cards: cardInterpretations,
    connection: 'Nhìn toàn cục, các lá bài tạo thành một mạch đọc thống nhất thay vì những thông điệp tách rời. Lá ở vị trí đầu mô tả nền của câu chuyện, các lá tiếp theo chỉ ra lực cản, nguồn lực hoặc hướng chuyển động. Khi một chủ đề lặp lại ở nhiều vị trí, đó là phần nên được ưu tiên quan sát; khi các lá trái chiều, trải bài đang nhắc bạn cân bằng hai nhu cầu cùng tồn tại.',
    guidance: 'Hãy quay về điều cốt lõi của câu hỏi: điều gì đã có bằng chứng rõ, điều gì mới chỉ là nỗi lo, và việc nhỏ nào có thể thực hiện ngay để kiểm chứng hướng đi. Ghi lại một đến hai chủ đề lặp lại nhất, đối chiếu chúng với tình huống thật và tránh đưa ra quyết định lớn chỉ dựa trên một lần trải bài.',
    reflectionQuestion: 'Điều gì trong tình huống này đang cần mình nhìn thẳng vào, thay vì chỉ chờ một câu trả lời chắc chắn từ bên ngoài?',
    notice: `Hệ thống đang dùng bản luận giải dự phòng. ${reason}`
  };
}

function buildCardContext(card: RequestCard, index: number, count: number) {
  const referenceCard = tarotCardMap.get(card.name);
  const orientationLabel = card.orientation === 'UPRIGHT' ? 'Xuôi' : 'Ngược';
  const coreMeaning =
    card.orientation === 'UPRIGHT'
      ? referenceCard?.uprightMeaning
      : referenceCard?.reversedMeaning;
  const keywords = referenceCard?.keywords?.slice(0, 5).join(', ');

  return [
    `Vị trí ${index + 1} (${getSpreadLabel(index, count)}): ${card.name} - ${orientationLabel}`,
    keywords ? `Từ khóa nền: ${keywords}` : '',
    coreMeaning ? `Nghĩa tham chiếu: ${coreMeaning}` : ''
  ]
    .filter(Boolean)
    .join('\n');
}

export async function POST(req: Request) {
  const body = await req.json() as { question?: unknown; cards?: unknown };
  const { question, cards } = body;

  if (
    typeof question !== 'string' ||
    !question.trim() ||
    !Array.isArray(cards) ||
    cards.length === 0 ||
    !cards.every(isRequestCard)
  ) {
    return NextResponse.json({ error: 'Payload không hợp lệ.' }, { status: 400 });
  }

  const trimmedQuestion = question.trim();
  const requestedCards = cards as RequestCard[];
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    console.error('API Interpretation Error: Missing GEMINI_API_KEY / GOOGLE_API_KEY in environment');
    return NextResponse.json(
      buildFallbackInterpretation(
        requestedCards,
        'Máy chủ chưa nhận được khóa truy cập Gemini sau lần triển khai gần nhất.'
      )
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    const systemInstruction = `
Bạn là một tarot reader giàu kinh nghiệm. Nhiệm vụ của bạn là luận giải chi tiết nhưng không khẳng định tuyệt đối.

Nguyên tắc:
1. Bám sát ý nghĩa lá bài và chiều xuôi/ngược.
2. Dùng tiếng Việt tự nhiên, rõ ràng, ấm áp và có chiều sâu.
3. Liên hệ trực tiếp đến câu hỏi của người dùng.
4. Không bịa thông tin ngoài dữ liệu được cung cấp.
5. Chỉ trả về JSON hợp lệ theo schema yêu cầu.
`;

    const prompt = `
Câu hỏi của người dùng: "${trimmedQuestion}"

Dữ liệu tham chiếu cho các lá bài:
${requestedCards.map((card, index) => buildCardContext(card, index, requestedCards.length)).join('\n\n')}

Hãy tạo một bản luận giải chi tiết, mạch lạc, gắn sát câu hỏi và nhấn mạnh mối liên kết giữa các lá bài.
`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.6,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
        responseJsonSchema: INTERPRETATION_SCHEMA
      }
    });

    const resultText = response.text?.trim();

    if (!resultText) {
      throw new Error(
        `Gemini returned an empty response. Finish reason: ${response.candidates?.[0]?.finishReason ?? 'UNKNOWN'}`
      );
    }

    let parsedResult: InterpretationResult;

    try {
      parsedResult = JSON.parse(resultText) as InterpretationResult;
    } catch {
      const cleaned = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleaned) as InterpretationResult;
    }

    if (!isInterpretationResult(parsedResult)) {
      throw new Error(`Gemini returned malformed JSON: ${resultText}`);
    }

    return NextResponse.json(normalizeInterpretationResult(parsedResult, requestedCards));
  } catch (error) {
    const details = getErrorDetails(error);
    console.error('API Interpretation Error:', details);

    return NextResponse.json(
      buildFallbackInterpretation(requestedCards, getGeminiFailureReason(error))
    );
  }
}
