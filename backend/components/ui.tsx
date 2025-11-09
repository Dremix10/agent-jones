import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-2xl shadow p-4 bg-white ${className}`}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  );
}

interface BigStatProps {
  children: ReactNode;
  className?: string;
}

export function BigStat({ children, className = '' }: BigStatProps) {
  return (
    <div className={`text-4xl font-bold text-gray-900 ${className}`}>
      {children}
    </div>
  );
}

interface PrimaryButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export function PrimaryButton({
  children,
  className = '',
  onClick,
  type = 'button'
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-2xl bg-blue-600 px-6 py-3 text-white font-medium shadow hover:bg-blue-700 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

interface HeaderProps {
  children: ReactNode;
  className?: string;
}

export function Header({ children, className = '' }: HeaderProps) {
  return (
    <header className={`text-2xl font-bold text-gray-900 mb-6 ${className}`}>
      {children}
    </header>
  );
}
