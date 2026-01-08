import React from 'react';

interface ButtonProps {
  onClick: () => void;
  label: string;
  colorClass: string;
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fontSize?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  onClick, 
  label, 
  colorClass, 
  fullWidth = false, 
  disabled = false,
  icon,
  fontSize = "text-2xl"
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${fullWidth ? 'w-full' : ''}
        ${colorClass}
        ${fontSize}
        font-bold
        py-6 px-4
        rounded-2xl
        shadow-lg
        transform transition-all duration-100
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        flex flex-col items-center justify-center gap-2
        border-b-4 border-black/20
      `}
      aria-label={label}
    >
      {icon && <span className="text-4xl mb-1">{icon}</span>}
      {label}
    </button>
  );
};