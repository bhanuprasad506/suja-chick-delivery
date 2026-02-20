import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string };

export function Input({ label, className = '', ...rest }: Props) {
  return (
    <div>
      {label ? <label className="block text-sm mb-1">{label}</label> : null}
      <input className={`w-full border p-2 rounded ${className}`} {...rest} />
    </div>
  );
}

export default Input;
