import { Clipboard, ClipboardCheck } from 'lucide-react';
import { copyToClipboard } from '../../utils';
import { useCopyFeedback } from '../../hooks/useCopyFeedback';

type CopyButtonProps = {
  field: string;
  value: string;
};

export function CopyButton({ field, value }: CopyButtonProps) {
  const { copiedField, markCopied } = useCopyFeedback();
  const copied = copiedField === field;

  const handleCopy = async () => {
    const success = await copyToClipboard(value);
    if (success) markCopied(field);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded-md border border-tm-border px-2 py-1 text-[11px] text-tm-muted transition hover:text-tm-text"
    >
      {copied ? (
        <>
          <ClipboardCheck className="h-3 w-3 text-profit" />
          Copied ✓
        </>
      ) : (
        <>
          <Clipboard className="h-3 w-3" />
          Copy
        </>
      )}
    </button>
  );
}
