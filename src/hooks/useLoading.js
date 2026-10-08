import { useEffect, useState } from 'react';

/** Brief skeleton state so data-heavy pages ease in instead of popping. */
export function useLoading(ms = 450, deps = []) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return loading;
}
