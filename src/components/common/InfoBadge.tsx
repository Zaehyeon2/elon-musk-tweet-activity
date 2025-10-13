import React, { useState } from 'react';

interface InfoBadgeProps {
  title: string;
  description: string;
  formula?: string;
}

export const InfoBadge: React.FC<InfoBadgeProps> = ({ title, description, formula }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => {
          if (!('ontouchstart' in window)) setIsOpen(true);
        }}
        onMouseLeave={() => {
          if (!('ontouchstart' in window)) setIsOpen(false);
        }}
        className="inline-flex items-center justify-center w-4 h-4 ml-1 text-[10px] font-bold rounded-full border border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:border-blue-500 hover:text-white dark:hover:bg-blue-500 dark:hover:border-blue-500 cursor-help transition-all duration-200"
      >
        i
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg shadow-xl z-50">
          <div className="font-semibold mb-1">{title}</div>
          <div className="text-gray-300 dark:text-gray-600 mb-1">{description}</div>
          {formula && (
            <div className="text-gray-400 dark:text-gray-500 text-[10px] mt-2 pt-2 border-t border-gray-700 dark:border-gray-300">
              {formula}
            </div>
          )}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100" />
        </div>
      )}
    </div>
  );
};
