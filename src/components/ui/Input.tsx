import React from 'react';

// Adicionamos 'icon' aqui na interface
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode; 
}

export function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-semibold text-slate-700">
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        {/* Se tiver ícone, renderiza ele posicionado à esquerda */}
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
        
        <input 
          className={`
            w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm 
            placeholder:text-slate-400 focus:border-blue-500 focus:outline-none 
            focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50
            ${icon ? 'pl-10' : ''} /* Adiciona padding na esquerda se tiver ícone */
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''} 
            ${className}
          `}
          {...props}
        />
      </div>
      
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
    </div>
  );
}