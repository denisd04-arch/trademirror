import { Clipboard, ClipboardCheck } from 'lucide-react';
import { copyToClipboard } from '../../utils';
import { useCopyFeedback } from '../../hooks/useCopyFeedback';
import { Button } from '../ui/Button';

type CopyButtonProps = {
  field: string;
  value: string;
  label?: string;
};

export function CopyButton({ field, value, label = 'Copy' }: CopyButtonProps) {
  const { copiedField, markCopied } = useCopyFeedback();
  const copied = copiedField === field;

  const handleCopy = async () => {
    const success = await copyToClipboard(value);
    if (success) markCopied(field);
  };

  return (
    <Button
      variant="ghost"
      className="h-8 px-2 py-1 text-xs"
      onClick={handleCopy}
      type="button"
    >
      {copied ? (
        <>
          <ClipboardCheck className="h-3.5 w-3.5 text-profit" />
          Copied ✓
        </>
      ) : (
        <>
          <Clipboard className="h-3.5 w-3.5" />
          {label}
        </>
      )}
    </Button>
  );
}
