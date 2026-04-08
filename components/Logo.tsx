
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  size = 'md', 
  showText = true, 
  showTagline = false 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8 sm:w-10 sm:h-10',
    lg: 'w-12 h-12 sm:w-16 sm:h-16',
    xl: 'w-20 h-20 sm:w-24 sm:h-24'
  };

  const iconSize = sizeClasses[size];

  return (
    <div className={`flex items-center gap-3 sm:gap-4 ${className}`}>
      <div className="relative group">
        {/* Glow Effect */}
        <div className={`absolute inset-0 bg-amber-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>
        
        <div className={`${iconSize} bg-zinc-900 text-amber-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/5 relative z-10 overflow-hidden group-hover:border-amber-500/50 transition-all duration-500`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <svg className="w-3/5 h-3/5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M12 3L4 19H20L12 3Z" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="group-hover:stroke-[2] transition-all duration-500"
            />
            <path 
              d="M12 8V15" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              className="animate-pulse"
            />
            <path 
              d="M8 19V21H16V19" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
            <circle cx="12" cy="12" r="0.5" fill="currentColor">
              <animate 
                attributeName="r" 
                values="0.5;1.5;0.5" 
                dur="2s" 
                repeatCount="indefinite" 
              />
            </circle>
          </svg>
          
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>

        {/* Status Indicator */}
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full border-2 border-black flex items-center justify-center z-20">
          <div className="w-1 h-1 bg-black rounded-full animate-ping"></div>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <h1 className={`font-serif font-black text-white tracking-[0.2em] uppercase leading-none ${size === 'xl' ? 'text-3xl sm:text-4xl' : size === 'lg' ? 'text-xl sm:text-2xl' : 'text-xs sm:text-sm'}`}>
            Art<span className="text-amber-500">Forge</span>
          </h1>
          {showTagline && (
            <span className={`font-bold text-zinc-600 tracking-[0.4em] uppercase mt-1.5 border-t border-white/5 pt-1.5 ${size === 'xl' ? 'text-[9px] sm:text-[10px]' : 'text-[6px] sm:text-[7px]'}`}>
              Est. 2026 • Digital Excellence
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
