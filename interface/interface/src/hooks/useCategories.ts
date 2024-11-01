// useCategories.ts

import { useState, useEffect } from "react";
import axios from "axios";

export interface Category {
  name: string;
  // Other properties...
}

interface UseCategoriesResult {
  data: Category[] | undefined;
  isLoading: boolean;
  error: any;
}

function useCategories(categoryTypeToFetch?: string): UseCategoriesResult {
  const [data, setData] = useState<Category[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    // Fetch categories based on categoryTypeToFetch
    axios
      .get<Category[]>(`/api/categories?type=${categoryTypeToFetch}`)
      .then((response) => {
        setData(response.data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, [categoryTypeToFetch]);

  return { data, isLoading, error };
}

export default useCategories;
