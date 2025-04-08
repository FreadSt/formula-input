import axios from 'axios';

export type Suggestion = {
  id: string;
  name: string;
  category: string;
  value: string | number;
};

export const fetchSuggestions = async (query: string): Promise<Suggestion[]> => {
  const response = await axios.get<Suggestion[]>(
    'https://652f91320b8d8ddac0b2b62b.mockapi.io/autocomplete'
  );
  const suggestions = response.data;

  const uniqueSuggestions = Array.from(
    new Map(suggestions.map((item) => [item.id, item])).values()
  );

  return uniqueSuggestions.filter((suggestion) =>
    query
      ? suggestion.name.toLowerCase().includes(query.toLowerCase()) ||
      suggestion.category.toLowerCase().includes(query.toLowerCase())
      : true
  );
};