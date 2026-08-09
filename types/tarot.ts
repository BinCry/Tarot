export type CardOrientation = 'UPRIGHT' | 'REVERSED';

export interface TarotCardData {
  id: number;
  name: string;
  image: string;
  arcana: string;
  suit: string;
  keywords: string[];
  fortuneTelling?: string[];
  uprightMeaning: string;
  reversedMeaning: string;
}

export interface PickedCard extends TarotCardData {
  orientation: CardOrientation;
}

export type TarotStateStatus = 
  | 'WELCOME'
  | 'SHUFFLING'
  | 'PICKING'
  | 'INTERPRETING'
  | 'RESULT'
  | 'ERROR';

export interface TarotState {
  status: TarotStateStatus;
  question: string;
  spreadCount: number; // 1, 3, 6, 12
  deck: PickedCard[]; // shuffled deck with random orientations
  pickedCards: PickedCard[]; // cards currently picked and in slots
  interpretation: InterpretationResult | null;
  error: string | null;
}

export interface InterpretationResult {
  summary: string;
  cards: { card: string; interpretation: string }[];
  connection: string;
  guidance: string;
  reflectionQuestion: string;
  notice?: string;
}

export interface InterpretationErrorPayload {
  error: string;
  details?: string;
}

export type TarotAction = 
  | { type: 'SET_QUESTION'; payload: string }
  | { type: 'SET_SPREAD_COUNT'; payload: number }
  | { type: 'START_READING'; payload: PickedCard[] } 
  | { type: 'FINISH_SHUFFLE' }
  | { type: 'PICK_CARD'; payload: PickedCard } 
  | { type: 'START_INTERPRETATION' }
  | { type: 'SET_INTERPRETATION'; payload: InterpretationResult }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESTART' };
