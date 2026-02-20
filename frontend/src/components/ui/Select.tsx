import React from 'react';

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string };

export function Select({ label, className = '', children, ...rest }: Props) {
  return (
    <div>
      {label ? <label className="block text-sm mb-1">{label}</label> : null}
      <select className={`w-full border p-2 rounded ${className}`} {...rest}>
        {children}
      </select>
    </div>
  );
}

export default Select;
