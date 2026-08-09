export type CardOrientation = 'UPRIGHT' | 'REVERSED';

export interface TarotCardData {
  id: number;
  name: string;
  image: string;
  arcana: string;
  suit: string;
  keywords: string[];
  uprightMeaning: string;
  reversedMeaning: string;
}

export interface PickedCard extends TarotCardData {
  orientation: CardOrientation;
}

export type TarotStateStatus = 
  | 'WELCOME'
  | 'QUESTION_READY'
  | 'SHUFFLING'
  | 'PICKING'
  | 'READY_TO_REVEAL'
  | 'REVEALING'
  | 'INTERPRETING'
  | 'RESULT'
  | 'ERROR';

export interface TarotState {
  status: TarotStateStatus;
  question: string;
  spreadCount: number; // 1 or 3
  deck: PickedCard[]; // shuffled deck with random orientations
  pickedIndices: number[]; // indices of picked cards in the deck
  interpretation: InterpretationResult | null;
  error: string | null;
}

export interface InterpretationResult {
  summary: string;
  cards: { card: string; interpretation: string }[];
  connection: string;
  guidance: string;
  reflectionQuestion: string;
}

export type TarotAction = 
  | { type: 'SET_QUESTION'; payload: string }
  | { type: 'SET_SPREAD_COUNT'; payload: number }
  | { type: 'START_READING'; payload: PickedCard[] } // triggers shuffle, passes deck
  | { type: 'FINISH_SHUFFLE' }
  | { type: 'PICK_CARD'; payload: number } // card index
  | { type: 'REVEAL_CARDS' }
  | { type: 'FINISH_REVEAL' } // starts interpreting
  | { type: 'SET_INTERPRETATION'; payload: InterpretationResult }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESTART' };
