import { useState, useCallback } from 'react';

export function useHistory<T>(initialState: T) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [index, setIndex] = useState(0);

  const push = useCallback((newState: T) => {
    setHistory(prev => {
      const nextHistory = prev.slice(0, index + 1);
      return [...nextHistory, newState];
    });
    setIndex(prev => prev + 1);
  }, [index]);

  const undo = useCallback(() => {
    if (index > 0) {
      setIndex(prev => prev - 1);
      return history[index - 1];
    }
    return null;
  }, [index, history]);

  const redo = useCallback(() => {
    if (index < history.length - 1) {
      setIndex(prev => prev + 1);
      return history[index + 1];
    }
    return null;
  }, [index, history]);

  const current = history[index];
  const canUndo = index > 0;
  const canRedo = index < history.length - 1;

  return {
    current,
    push,
    undo,
    redo,
    canUndo,
    canRedo,
    history,
    index
  };
}
