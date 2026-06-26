// src/hooks/useProducts.js
import { useState, useEffect } from 'react';
import client from '../api/client';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    client('/api/products')
      .then(data => setProducts(data.data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { products, loading, error };
}
