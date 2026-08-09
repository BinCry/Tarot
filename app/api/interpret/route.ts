import { NextResponse } from 'next/server';
import { GoogleGenAI, type GenerateContentResponse } from '@google/genai';
import tarotCards from '@/data/tarot-cards.json';
import { getVietnameseCardContext, localizeTarotTerms } from '@/data/tarot-vi';
import type { InterpretationResult, TarotCardData } from '@/types/tarot';

export const maxDuration = 60;

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const FALLBACK_GEMINI_MODEL = 'gemini-2.5-flash-lite';

type RequestCard = {
  name: string;
  orientation: 'UPRIGHT' | 'REVERSED';
};

type GeminiFailureCode =
  | 'MISSING_KEY'
  | 'INVALID_KEY'
  | 'BLOCKED_KEY'
  | 'RESTRICTED_KEY'
  | 'PERMISSION_DENIED'
  | 'QUOTA_EXHAUSTED'
  | 'MODEL_UNAVAILABLE'
  | 'INVALID_REQUEST'
  | 'EMPTY_RESPONSE'
  | 'INVALID_RESPONSE'
  | 'REQUEST_TIMEOUT'
  | 'SERVICE_UNAVAILABLE'
  | 'UNKNOWN_ERROR';

type GeminiFailure = {
  code: GeminiFailureCode;
  message: string;
  status?: number;
};

class GeminiResponseError extends Error {
  code: Extract<GeminiFailureCode, 'EMPTY_RESPONSE' | 'INVALID_RESPONSE'>;

  constructor(
    code: Extract<GeminiFailureCode, 'EMPTY_RESPONSE' | 'INVALID_RESPONSE'>,
    message: string
  ) {
    super(message);
    this.name = 'GeminiResponseError';
    this.code = code;
  }
}

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

  const status = Reflect.get(error, 'status') ?? Reflect.get(error, 'statusCode');
  return typeof status === 'number' ? status : undefined;
}

function getErrorDetails(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;

  try {
    return JSON.stringify(error) || 'Không đọc được nội dung lỗi Gemini.';
  } catch {
    return 'Không đọc được nội dung lỗi Gemini.';
  }
}

function classifyGeminiFailure(error: unknown): GeminiFailure {
  const status = getErrorStatus(error);
  const details = getErrorDetails(error).toLowerCase();

  if (error instanceof GeminiResponseError) {
    return {
      code: error.code,
      status,
      message: error.code === 'EMPTY_RESPONSE'
        ? 'Gemini đã nhận yêu cầu nhưng không tạo được nội dung luận giải.'
        : 'Gemini trả về nội dung không đúng định dạng luận giải.'
    };
  }

  if (details.includes('reported as leaked') || details.includes('api key was leaked')) {
    return {
      code: 'BLOCKED_KEY',
      status,
      message: 'Khóa truy cập đã bị Google đánh dấu là lộ và không còn được phép sử dụng.'
    };
  }

  if (
    details.includes('api key not valid') ||
    details.includes('invalid api key') ||
    details.includes('api_key_invalid') ||
    status === 401
  ) {
    return {
      code: 'INVALID_KEY',
      status,
      message: 'Khóa truy cập Gemini không hợp lệ hoặc đã bị thu hồi.'
    };
  }

  if (
    details.includes('referer') ||
    details.includes('referrer') ||
    details.includes('application restriction')
  ) {
    return {
      code: 'RESTRICTED_KEY',
      status,
      message: 'Khóa truy cập đang bị giới hạn theo trang web hoặc loại ứng dụng nên máy chủ Vercel không thể dùng.'
    };
  }

  if (status === 403) {
    return {
      code: 'PERMISSION_DENIED',
      status,
      message: 'Khóa truy cập chưa được cấp quyền gọi dịch vụ Gemini từ máy chủ.'
    };
  }

  if (status === 429) {
    return {
      code: 'QUOTA_EXHAUSTED',
      status,
      message: 'Tài khoản Gemini đã chạm hạn mức hoặc đang bị giới hạn tần suất.'
    };
  }

  if (
    status === 404 ||
    (details.includes('model') && (details.includes('not found') || details.includes('not supported')))
  ) {
    return {
      code: 'MODEL_UNAVAILABLE',
      status,
      message: 'Mẫu Gemini đang cấu hình không tồn tại hoặc không hỗ trợ cách gọi hiện tại.'
    };
  }

  if (status === 400) {
    return {
      code: 'INVALID_REQUEST',
      status,
      message: 'Gemini từ chối cấu trúc yêu cầu được gửi từ máy chủ.'
    };
  }

  if (status === 408 || details.includes('timeout') || details.includes('timed out')) {
    return {
      code: 'REQUEST_TIMEOUT',
      status,
      message: 'Yêu cầu tới Gemini mất quá nhiều thời gian và đã hết hạn chờ.'
    };
  }

  if (status && status >= 500) {
    return {
      code: 'SERVICE_UNAVAILABLE',
      status,
      message: 'Dịch vụ Gemini đang tạm thời không sẵn sàng.'
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    status,
    message: 'Gemini chưa trả về phản hồi hợp lệ từ máy chủ.'
  };
}

function normalizeApiKey(value: string | undefined) {
  if (!value) return '';

  const trimmed = value.trim();
  const isWrappedInQuotes =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));

  return isWrappedInQuotes ? trimmed.slice(1, -1).trim() : trimmed;
}

function getAiHeaders(
  mode: 'gemini' | 'fallback',
  code?: GeminiFailureCode,
  model?: string,
  format?: 'schema' | 'json'
) {
  const headers: Record<string, string> = {
    'X-Tarot-AI-Mode': mode
  };

  if (code) headers['X-Tarot-AI-Code'] = code;
  if (model) headers['X-Tarot-AI-Model'] = model;
  if (format) headers['X-Tarot-AI-Format'] = format;

  return headers;
}

function getSpreadLabel(index: number, count: number) {
  if (count === 1) return 'thông điệp cốt lõi';
  if (count === 3) return ['tình huống hiện tại', 'thử thách chính', 'hướng mở ra'][index] || `lá ${index + 1}`;
  return `lá ${index + 1}`;
}

function getMaxOutputTokens(cardCount: number) {
  return Math.min(12_288, 4_096 + cardCount * 640);
}

async function generateGeminiInterpretation(
  ai: GoogleGenAI,
  model: string,
  prompt: string,
  systemInstruction: string,
  cardCount: number,
  useSchema: boolean
) {
  return ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      httpOptions: {
        timeout: 45_000,
        retryOptions: {
          attempts: 2,
          initialDelay: 0.5,
          maxDelay: 1.5,
          expBase: 2,
          jitter: 0.3,
          httpStatusCodes: [408, 429, 500, 502, 503, 504]
        }
      },
      systemInstruction,
      ...(model.startsWith('gemini-3') ? {} : { temperature: 0.6 }),
      ...(model.startsWith('gemini-2.5')
        ? { thinkingConfig: { thinkingBudget: 512 } }
        : {}),
      maxOutputTokens: getMaxOutputTokens(cardCount),
      responseMimeType: 'application/json',
      ...(useSchema ? { responseJsonSchema: INTERPRETATION_SCHEMA } : {})
    }
  });
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
  const apiKey = normalizeApiKey(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  const configuredModel = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

  if (!apiKey) {
    console.error('API Interpretation Error: Missing GEMINI_API_KEY / GOOGLE_API_KEY in environment');
    return NextResponse.json(
      buildFallbackInterpretation(
        requestedCards,
        'Máy chủ chưa nhận được khóa truy cập Gemini sau lần triển khai gần nhất.'
      ),
      { headers: getAiHeaders('fallback', 'MISSING_KEY', configuredModel) }
    );
  }

  let attemptedModel = configuredModel;

  try {
    const ai = new GoogleGenAI({ apiKey });
    let activeModel = configuredModel;
    let responseFormat: 'schema' | 'json' = 'schema';

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
Kết quả phải có đúng 5 trường: summary, cards, connection, guidance và reflectionQuestion. Mỗi phần tử trong cards phải có card và interpretation.
`;

    const candidateModels = Array.from(
      new Set([configuredModel, DEFAULT_GEMINI_MODEL, FALLBACK_GEMINI_MODEL])
    );
    let response: GenerateContentResponse | undefined;
    let lastError: unknown;

    for (const candidateModel of candidateModels) {
      activeModel = candidateModel;
      attemptedModel = candidateModel;
      responseFormat = 'schema';

      try {
        try {
          response = await generateGeminiInterpretation(
            ai,
            candidateModel,
            prompt,
            systemInstruction,
            requestedCards.length,
            true
          );
        } catch (error) {
          const failure = classifyGeminiFailure(error);

          if (failure.code !== 'INVALID_REQUEST') throw error;

          console.warn('Gemini schema request rejected; retrying with JSON mode.', {
            code: failure.code,
            status: failure.status,
            model: candidateModel
          });
          responseFormat = 'json';
          response = await generateGeminiInterpretation(
            ai,
            candidateModel,
            prompt,
            systemInstruction,
            requestedCards.length,
            false
          );
        }

        break;
      } catch (error) {
        lastError = error;
        const failure = classifyGeminiFailure(error);
        const canTryDefaultModel =
          failure.code === 'MODEL_UNAVAILABLE' &&
          candidateModel !== candidateModels.at(-1);

        if (!canTryDefaultModel) throw error;

        console.warn('Configured Gemini model unavailable; trying the stable default.', {
          model: candidateModel,
          fallbackModel: DEFAULT_GEMINI_MODEL
        });
      }
    }

    if (!response) throw lastError ?? new Error('Gemini request did not run.');

    const resultText = response.text?.trim();

    if (!resultText) {
      throw new GeminiResponseError(
        'EMPTY_RESPONSE',
        `Gemini returned an empty response. Finish reason: ${response.candidates?.[0]?.finishReason ?? 'UNKNOWN'}`
      );
    }

    let parsedResult: InterpretationResult;

    try {
      parsedResult = JSON.parse(resultText) as InterpretationResult;
    } catch {
      const cleaned = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();

      try {
        parsedResult = JSON.parse(cleaned) as InterpretationResult;
      } catch {
        throw new GeminiResponseError(
          'INVALID_RESPONSE',
          'Gemini returned content that could not be parsed as interpretation JSON.'
        );
      }
    }

    if (!isInterpretationResult(parsedResult)) {
      throw new GeminiResponseError('INVALID_RESPONSE', 'Gemini returned malformed interpretation JSON.');
    }

    return NextResponse.json(
      normalizeInterpretationResult(parsedResult, requestedCards),
      { headers: getAiHeaders('gemini', undefined, activeModel, responseFormat) }
    );
  } catch (error) {
    const failure = classifyGeminiFailure(error);
    const details = getErrorDetails(error);
    console.error('API Interpretation Error:', {
      code: failure.code,
      status: failure.status,
      model: attemptedModel,
      details: details.slice(0, 1000)
    });

    return NextResponse.json(
      buildFallbackInterpretation(requestedCards, failure.message),
      { headers: getAiHeaders('fallback', failure.code, attemptedModel) }
    );
  }
}
