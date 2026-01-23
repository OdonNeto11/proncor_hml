import React from 'react';

// Adicionamos 'icon' aqui também
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Textarea({ label, error, icon, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-semibold text-slate-700">
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        {/* Ícone no textarea geralmente fica no topo */}
        {icon && (
          <div className="absolute left-3 top-3 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}

        <textarea 
          className={`
            w-full min-h-[80px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm 
            placeholder:text-slate-400 focus:border-blue-500 focus:outline-none 
            focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50
            ${icon ? 'pl-10' : ''} /* Padding para não escrever em cima do ícone */
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