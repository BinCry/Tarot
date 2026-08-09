import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import tarotCards from '@/data/tarot-cards.json';
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
    summary: result.summary.trim(),
    cards: requestedCards.map((requestedCard, index) => {
      const interpretedCard = result.cards[index];

      return {
        card: interpretedCard?.card?.trim() || requestedCard.name,
        interpretation:
          interpretedCard?.interpretation?.trim() ||
          `Lá ${index + 1} chưa nhận được luận giải chi tiết.`
      };
    }),
    connection: result.connection.trim(),
    guidance: result.guidance.trim(),
    reflectionQuestion: result.reflectionQuestion.trim(),
    notice: result.notice?.trim()
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
    return 'Gemini từ chối API key. Hãy kiểm tra key có đúng project và đã bật Generative Language API chưa.';
  }

  if (status === 429) {
    return 'Gemini đang bận hoặc đã chạm quota.';
  }

  return 'Gemini không trả về phản hồi hợp lệ từ server.';
}

function getSpreadLabel(index: number, count: number) {
  if (count === 1) return 'thông điệp cốt lõi';
  if (count === 3) return ['tình huống hiện tại', 'thử thách chính', 'hướng mở ra'][index] || `lá ${index + 1}`;
  return `lá ${index + 1}`;
}

function buildFallbackCardInterpretation(
  question: string,
  card: RequestCard,
  index: number,
  count: number
) {
  const referenceCard = tarotCardMap.get(card.name);
  const orientationLabel = card.orientation === 'UPRIGHT' ? 'xuôi' : 'ngược';
  const keyMeaning =
    card.orientation === 'UPRIGHT'
      ? referenceCard?.uprightMeaning
      : referenceCard?.reversedMeaning;
  const keywords = referenceCard?.keywords?.slice(0, 4).join(', ');
  const fortune = referenceCard?.fortuneTelling?.[0];

  const meaningText = keyMeaning
    ? `Năng lượng chính của lá này xoay quanh ${keyMeaning.toLowerCase()}.`
    : 'Lá này cho thấy một tầng ý nghĩa quan trọng cần được nhìn chậm và kỹ hơn.';

  const keywordText = keywords ? `Các từ khóa nổi bật là ${keywords}.` : '';
  const fortuneText = fortune ? `Một gợi ý ngắn từ lá bài là: ${fortune}.` : '';

  return `Ở vị trí ${getSpreadLabel(index, count)}, ${card.name} ở chiều ${orientationLabel} cho thấy chủ đề này đang tác động trực tiếp lên câu hỏi "${question}". ${keywordText} ${meaningText} ${fortuneText}`.trim();
}

function buildFallbackInterpretation(
  question: string,
  requestedCards: RequestCard[],
  reason: string
): InterpretationResult {
  const cardInterpretations = requestedCards.map((card, index) => ({
    card: card.name,
    interpretation: buildFallbackCardInterpretation(question, card, index, requestedCards.length)
  }));

  const cardNames = requestedCards.map((card) => card.name).join(', ');

  return {
    summary: `Gemini hiện chưa phản hồi ổn định từ server, nên hệ thống đang dùng bản luận giải dự phòng để bạn không bị gián đoạn. Trải bài này xoay quanh các lá ${cardNames}, nhấn mạnh rằng câu hỏi của bạn cần được nhìn qua nhiều lớp: cảm xúc, nhận thức và hành động thực tế. Hãy xem đây là một nhịp đọc nền để định hướng, sau đó có thể thử lại khi kết nối AI ổn định hơn.`,
    cards: cardInterpretations,
    connection: `Nhìn toàn cục, các lá bài đang tạo thành một mạch đọc thống nhất thay vì tách rời. Chúng cho thấy vấn đề không nằm ở một chi tiết đơn lẻ mà ở cách nhiều yếu tố cùng kéo năng lượng của bạn theo những hướng khác nhau. Khi một lá nhấn vào cảm xúc, lá khác thường sẽ bổ sung bằng hành động hoặc bài học nhận thức, vì vậy điều quan trọng là đọc chúng như một cuộc đối thoại giữa các tầng vấn đề.`,
    guidance: `Trong lúc AI đang lỗi, lời khuyên an toàn nhất là quay về điều cốt lõi của câu hỏi: bạn đang cần làm rõ điều gì, điều gì chỉ là nỗi lo, và điều gì thật sự cần hành động ngay. Hãy ghi lại 1 đến 2 điểm bạn thấy lặp lại nhất từ các lá bài rồi đối chiếu với tình huống thật ngoài đời trước khi ra quyết định lớn.`,
    reflectionQuestion: 'Điều gì trong tình huống này đang cần mình nhìn thẳng vào, thay vì chỉ chờ một câu trả lời chắc chắn từ bên ngoài?',
    notice: `Đang dùng bản luận giải dự phòng vì ${reason}`
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
        trimmedQuestion,
        requestedCards,
        'server chưa nhận được GEMINI_API_KEY. Trên Vercel cần redeploy lại sau khi thêm biến môi trường.'
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
      buildFallbackInterpretation(trimmedQuestion, requestedCards, getGeminiFailureReason(error))
    );
  }
}
