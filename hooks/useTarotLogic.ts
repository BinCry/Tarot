import { useReducer, useCallback, useRef } from 'react';
import { TarotState, TarotAction, PickedCard, InterpretationResult } from '@/types/tarot';

const initialState: TarotState = {
  status: 'WELCOME',
  question: '',
  spreadCount: 3,
  deck: [],
  pickedIndices: [],
  interpretation: null,
  error: null,
};

function tarotReducer(state: TarotState, action: TarotAction): TarotState {
  switch (action.type) {
    case 'SET_QUESTION':
      return { ...state, question: action.payload, status: action.payload.trim() ? 'QUESTION_READY' : 'WELCOME' };
    case 'SET_SPREAD_COUNT':
      return { ...state, spreadCount: action.payload };
    case 'START_READING':
      return { ...state, status: 'SHUFFLING', deck: action.payload, pickedIndices: [], interpretation: null, error: null };
    case 'FINISH_SHUFFLE':
      return { ...state, status: 'PICKING' };
    case 'PICK_CARD':
      if (state.status !== 'PICKING' || state.pickedIndices.includes(action.payload)) return state;
      const newPicked = [...state.pickedIndices, action.payload];
      const isReady = newPicked.length === state.spreadCount;
      return { ...state, pickedIndices: newPicked, status: isReady ? 'READY_TO_REVEAL' : 'PICKING' };
    case 'REVEAL_CARDS':
      return { ...state, status: 'REVEALING' };
    case 'FINISH_REVEAL':
      return { ...state, status: 'INTERPRETING' };
    case 'SET_INTERPRETATION':
      return { ...state, status: 'RESULT', interpretation: action.payload };
    case 'SET_ERROR':
      return { ...state, status: 'ERROR', error: action.payload };
    case 'RESTART':
      return { ...initialState, question: state.question, spreadCount: state.spreadCount, status: 'QUESTION_READY' };
    default:
      return state;
  }
}

export function useTarotLogic(allCards: any[]) {
  const [state, dispatch] = useReducer(tarotReducer, initialState);

  const setQuestion = (q: string) => dispatch({ type: 'SET_QUESTION', payload: q });
  const setSpreadCount = (count: number) => dispatch({ type: 'SET_SPREAD_COUNT', payload: count });
  
  const startReading = useCallback(() => {
    // Generate a shuffled deck with random orientations
    const shuffled: PickedCard[] = [...allCards]
      .sort(() => Math.random() - 0.5)
      .map(card => ({
        ...card,
        orientation: Math.random() > 0.5 ? 'UPRIGHT' : 'REVERSED'
      }));
    
    dispatch({ type: 'START_READING', payload: shuffled });
    
    // Simulate shuffle duration
    setTimeout(() => {
      dispatch({ type: 'FINISH_SHUFFLE' });
    }, 1500);
  }, [allCards]);

  const pickCard = (index: number) => dispatch({ type: 'PICK_CARD', payload: index });
  const isFetching = useRef(false);
  
  const fetchInterpretation = async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      const selectedCards = state.pickedIndices.map(idx => state.deck[idx]);
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: state.question,
          cards: selectedCards.map(c => ({ name: c.name, orientation: c.orientation }))
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

  const revealCards = () => {
    dispatch({ type: 'REVEAL_CARDS' });
    // Sequential reveal animation takes some time, then we move to interpreting
    setTimeout(() => {
      dispatch({ type: 'FINISH_REVEAL' });
      fetchInterpretation();
    }, 500 * state.spreadCount + 500); 
  };

  const restart = () => dispatch({ type: 'RESTART' });

  // Expose picked cards for UI
  const getPickedCards = () => state.pickedIndices.map(idx => state.deck[idx]);

  return {
    state,
    setQuestion,
    setSpreadCount,
    startReading,
    pickCard,
    revealCards,
    fetchInterpretation, // For retry
    restart,
    getPickedCards
  };
}
