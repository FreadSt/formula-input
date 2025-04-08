import React, { useState, useRef, useCallback } from 'react';
import { useFormulaStore } from '../store/formulaStore';
import { useQuery } from '@tanstack/react-query';
import { fetchSuggestions, Suggestion } from '../api/autocomplete';
import {
  Input,
  Select,
  Badge,
  Group,
  Paper,
  Text,
  List,
  Box,
  Loader,
  Button,
} from '@mantine/core';
import { useClickOutside, useDebouncedValue } from '@mantine/hooks';

const VALID_OPERANDS = ['+', '-', '*', '/', '^', '(', ')'] as const;

const FormulaInput: React.FC = () => {
  const { formula, addTag, removeTag, updateTag, clearFormula } = useFormulaStore();
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useClickOutside(() => setShowSuggestions(false));

  const [debouncedInputValue] = useDebouncedValue(inputValue, 300);

  const { data: allSuggestions = [] } = useQuery({
    queryKey: ['allSuggestions'],
    queryFn: () => fetchSuggestions(''),
    staleTime: 5 * 60 * 1000,
  });

  const cleanedInput = debouncedInputValue.replace(/[+*\-/^()]+/g, '').trim();
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['suggestions', cleanedInput],
    queryFn: () => fetchSuggestions(cleanedInput),
    enabled: cleanedInput.length >= 1,
    staleTime: 60 * 1000,
  });

  const getTagType = useCallback((value: string): 'tag' | 'operand' | 'number' => {
    const trimmed = value.trim();
    if (VALID_OPERANDS.includes(trimmed as any)) return 'operand';
    if (/^-?\d*\.?\d+$/.test(trimmed) || /^-?\d+\/\d+$/.test(trimmed)) return 'number';
    return 'tag';
  }, []);

  const isValidNextType = useCallback(
    (type: string, lastTag?: typeof formula[0]) => {
      const lastType = lastTag?.type;
      const isLastValue = lastType === 'tag' || lastType === 'number';
      return (
        (type === 'operand' && isLastValue) ||
        ((type === 'tag' || type === 'number') && (!lastType || lastType === 'operand'))
      );
    },
    []
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    const trimmed = value.trim();
    setShowSuggestions(
      !VALID_OPERANDS.includes(trimmed as any) &&
      !/^-?\d*\.?\d+$/.test(trimmed) &&
      !/^-?\d+\/\d+$/.test(trimmed) &&
      trimmed.length >= 1
    );
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const value = inputValue.trim();
      if (!value) {
        if (e.key === 'Backspace' && formula.length > 0) {
          removeTag(formula[formula.length - 1].id);
        }
        return;
      }

      const type = getTagType(value);
      const lastTag = formula[formula.length - 1];

      if ((e.key === 'Enter' || (e.key === ' ' && type === 'operand')) && isValidNextType(type, lastTag)) {
        if (type === 'tag') {
          const suggestion = allSuggestions.find((s) => s.name.toLowerCase() === value.toLowerCase());
          addTag(value, type, suggestion);
        } else {
          addTag(value, type);
        }
        setInputValue('');
        setShowSuggestions(false);
        if (e.key === ' ') e.preventDefault();
      }
    },
    [inputValue, formula, allSuggestions, addTag, removeTag, getTagType, isValidNextType]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: Suggestion) => {
      const lastTag = formula[formula.length - 1];
      if (!lastTag || lastTag.type === 'operand') {
        addTag(suggestion.name, 'tag', suggestion);
        setInputValue('');
        setShowSuggestions(false);
        inputRef.current?.focus();
      }
    },
    [formula, addTag]
  );

  const handleDropdownChange = useCallback(
    (id: string, value: string | null) => {
      if (value) {
        const suggestion = allSuggestions.find((s) => s.name === value);
        updateTag(id, value, suggestion);
      }
    },
    [allSuggestions, updateTag]
  );

  const parseNumber = (value: string): number => {
    if (/^-?\d+\/\d+$/.test(value)) {
      const [numerator, denominator] = value.split('/').map(Number);
      return numerator / denominator;
    }
    return Number(value);
  };

  const calculateFormula = useCallback(() => {
    if (!formula.length) return 0;

    let result = 0;
    let currentOperator: string | null = null;

    formula.forEach((item, index) => {
      let value: number | string;
      if (item.type === 'tag') {
        value = Number(item.suggestion?.value || 0);
      } else if (item.type === 'number') {
        value = parseNumber(item.value);
      } else {
        value = item.value;
      }

      if (item.type === 'number' || item.type === 'tag') {
        const num = Number(value);
        if (index === 0) {
          result = num;
        } else if (currentOperator) {
          switch (currentOperator) {
            case '+': result += num; break;
            case '-': result -= num; break;
            case '*': result *= num; break;
            case '/': result /= num || 1; break;
            case '^': result = Math.pow(result, num); break;
            default: break;
          }
        }
      } else if (item.type === 'operand' && item.value !== '(' && item.value !== ')') {
        currentOperator = item.value;
      }
    });

    return result;
  }, [formula]);

  const formatResult = (result: number): string => {
    if (Number.isNaN(result) || !Number.isFinite(result)) return 'Invalid';
    return result.toString();
  };

  return (
    <Paper shadow="sm" p="md" withBorder style={{ margin: '0 auto', width: '70vw' }}>
      <Group align="center" style={{ flexWrap: 'wrap', gap: 8 }}>
        {formula.map((tag) => (
          <Group key={tag.id} gap={4}>
            {tag.type === 'tag' ? (
              <Group gap={4}>
                <Badge color="blue" variant="light">{tag.value}</Badge>
                <Select
                  data={allSuggestions.map((s) => ({
                    value: s.name,
                    label: `${s.name} (${s.category})`,
                  }))}
                  value={tag.value}
                  onChange={(value) => handleDropdownChange(tag.id, value)}
                  size="xs"
                  style={{ width: 200 }}
                  searchable
                />
              </Group>
            ) : (
              <Text variant="outline">
                {tag.value}
              </Text>
            )}
          </Group>
        ))}
        <Box style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Add tag, number (e.g., -5, 1/2, 3.14), or operand..."
            size="sm"
          />
          {showSuggestions && (
            <Paper
              ref={suggestionsRef}
              shadow="sm"
              p="xs"
              style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, maxHeight: 200, overflowY: 'auto' }}
            >
              {isLoading ? (
                <Loader size="sm" />
              ) : suggestions.length > 0 ? (
                <List>
                  {suggestions.map((suggestion) => (
                    <List.Item
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      style={{
                        padding: '8px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee',
                        ':hover': { backgroundColor: '#f0f0f0' },
                      }}
                    >
                      <Text size="sm">
                        {suggestion.name} ({suggestion.category})
                      </Text>
                    </List.Item>
                  ))}
                </List>
              ) : (
                <Text size="sm">No suggestions found</Text>
              )}
            </Paper>
          )}
        </Box>
      </Group>
      <Group mt="md" justify="space-between">
        <Text size="lg" fw={500}>Result: {formatResult(calculateFormula())}</Text>
        <Button size="xs" variant="outline" onClick={clearFormula}>
          Clear
        </Button>
      </Group>
    </Paper>
  );
};

export default FormulaInput;