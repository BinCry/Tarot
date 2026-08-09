import { useReducer, useRef } from 'react';
import { TarotState, TarotAction, PickedCard, InterpretationResult } from '@/types/tarot';

const initialState: TarotState = {
  status: 'WELCOME',
  question: '',
  spreadCount: 3,
  deck: [],
  pickedCards: [],
  interpretation: null,
  error: null,
};

function tarotReducer(state: TarotState, action: TarotAction): TarotState {
  switch (action.type) {
    case 'SET_QUESTION':
      return { ...state, question: action.payload };
    case 'SET_SPREAD_COUNT':
      return { ...state, spreadCount: action.payload };
    case 'START_READING':
      return { ...state, status: 'SHUFFLING', deck: action.payload, pickedCards: [], interpretation: null, error: null };
    case 'FINISH_SHUFFLE':
      return { ...state, status: 'PICKING' };
    case 'PICK_CARD':
      if (state.status !== 'PICKING' || state.pickedCards.length >= state.spreadCount) return state;
      // Remove the picked card from the deck so it visually disappears
      const newDeck = state.deck.filter(c => c.id !== action.payload.id);
      const newPicked = [...state.pickedCards, action.payload];
      return { ...state, deck: newDeck, pickedCards: newPicked };
    case 'START_INTERPRETATION':
      return { ...state, status: 'INTERPRETING' };
    case 'SET_INTERPRETATION':
      return { ...state, status: 'RESULT', interpretation: action.payload };
    case 'SET_ERROR':
      return { ...state, status: 'ERROR', error: action.payload };
    case 'RESTART':
      return { ...initialState, question: state.question, spreadCount: state.spreadCount };
    default:
      return state;
  }
}

export function useTarotLogic(allCards: any[]) {
  const [state, dispatch] = useReducer(tarotReducer, initialState);
  const isFetching = useRef(false);

  const setQuestion = (q: string) => dispatch({ type: 'SET_QUESTION', payload: q });
  const setSpreadCount = (count: number) => dispatch({ type: 'SET_SPREAD_COUNT', payload: count });
  
  const startReading = () => {
    // Shuffled deck logic (draw without replacement implicitly handled by full 78 card array)
    const shuffled: PickedCard[] = [...allCards]
      .sort(() => Math.random() - 0.5)
      .map(card => ({
        ...card,
        orientation: Math.random() > 0.5 ? 'UPRIGHT' : 'REVERSED'
      }));
    
    dispatch({ type: 'START_READING', payload: shuffled });
    
    // Shuffle duration ~1200ms
    setTimeout(() => {
      dispatch({ type: 'FINISH_SHUFFLE' });
    }, 1200);
  };

  const pickCard = (card: PickedCard) => {
    if (state.status !== 'PICKING' || state.pickedCards.length >= state.spreadCount) return;
    dispatch({ type: 'PICK_CARD', payload: card });
  };
  
  const startInterpretation = () => {
    if (state.pickedCards.length === state.spreadCount) {
      dispatch({ type: 'START_INTERPRETATION' });
      fetchInterpretation();
    }
  };

  const fetchInterpretation = async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: state.question,
          cards: state.pickedCards.map(c => ({ name: c.name, orientation: c.orientation }))
        })
      });

      if (!res.ok) throw new Error('Failed to fetch interpretation');
      
      const data: InterpretationResult = await res.json();
      dispatch({ type: 'SET_INTERPRETATION', payload: data });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Unknown error' });
    } finally {
      isFetching.current = false;
    }
  };

  const restart = () => dispatch({ type: 'RESTART' });

  return {
    state,
    setQuestion,
    setSpreadCount,
    startReading,
    pickCard,
    startInterpretation,
    fetchInterpretation,
    restart
  };
}
