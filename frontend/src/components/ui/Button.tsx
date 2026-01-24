import React from 'react';
import { Loader2 } from 'lucide-react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export function Button({ children, className = '', loading, ...rest }: Props) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-2 text-sm disabled:opacity-60 ${className}`}
      {...rest}
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : null}
      {children}
    </button>
  );
}

export default Button;
