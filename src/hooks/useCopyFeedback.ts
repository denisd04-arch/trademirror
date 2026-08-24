import { useEffect, useState } from 'react';

export function useCopyFeedback(duration = 2000) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!copiedField) return;
    const timer = setTimeout(() => setCopiedField(null), duration);
    return () => clearTimeout(timer);
  }, [copiedField, duration]);

  const markCopied = (field: string) => setCopiedField(field);

  return { copiedField, markCopied };
}
