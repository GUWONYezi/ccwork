import { useState } from 'react';
import { validateTag } from '../utils/tags';

export interface UseTagEditorResult {
  tags: string[];
  isInputOpen: boolean;
  inputValue: string;
  toggleInput: () => void;
  changeInput: (value: string) => void;
  addTag: () => void; // inputValue를 검증해 추가한다. Enter에서 호출된다
  reset: (initialTags: string[]) => void; // tags 교체 + 입력창 닫기 + inputValue 비우기
  removeTag: (index: number) => void; // tags에서 해당 위치의 태그를 제거한다
  errorMessage: string | null; // 안내 문구
}

export function useTagEditor(): UseTagEditorResult {
  const [tags, setTags] = useState<string[]>([]);
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleInput = () => setIsInputOpen((prev) => !prev);

  const changeInput = (value: string) => {
    setInputValue(value);
    setErrorMessage(null);
  };

  const addTag = () => {
    const result = validateTag(inputValue, tags);
    if (!result.canAdd) {
      if (result.message) setErrorMessage(result.message);
      return;
    }
    setTags([...tags, result.tag]);
    setInputValue('');
    setErrorMessage(null);
  };

  const reset = (initialTags: string[]) => {
    setTags([...initialTags]);
    setIsInputOpen(false);
    setInputValue('');
    setErrorMessage(null);
  };

  const removeTag = (index: number) => setTags((prev) => prev.filter((_, i) => i !== index));

  return {
    tags,
    isInputOpen,
    inputValue,
    toggleInput,
    changeInput,
    addTag,
    reset,
    removeTag,
    errorMessage,
  };
}
