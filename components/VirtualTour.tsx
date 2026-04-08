
import React, { useState } from 'react';
import { Artwork } from '../types';

interface Props {
  artworks: Artwork[];
  onClose: () => void;
}

const VirtualTour: React.FC<Props> = ({ artworks, onClose }) => {
  const [index, setIndex] = useState(0);
  const current = artworks[index];

  const next = () => setIndex((prev) => (prev + 1) % artworks.length);
  const prev = () => setIndex((prev) => (prev - 1 + artworks.length) % artworks.length);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4 sm:p-8 animate-fadeIn">
      {/* Exit Button */}
      <button 
        onClick={onClose} 
        className="fixed top-6 right-6 sm:top-10 sm:right-10 z-50 text-white/50 hover:text-white flex items-center gap-2 uppercase text-[10px] sm:text-xs tracking-[0.2em] font-black bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 transition-all hover:bg-red-500/10 hover:border-red-500/20"
      >
        <span>Exit Tour</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="relative w-full max-w-5xl h-[60vh] sm:h-[75vh] flex items-center justify-center">
        {/* Gradients */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/40 to-transparent z-10 pointer-events-none"></div>
        
        {/* Main Image */}
        <div className="relative w-full h-full flex items-center justify-center animate-fadeIn group">
          <img 
            src={current.imageUrl} 
            alt={current.title} 
            className="max-w-full max-h-full object-contain shadow-[0_40px_100px_rgba(0,0,0,0.8)] transition-all duration-1000 group-hover:scale-[1.03]"
          />
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-6 left-4 right-4 sm:bottom-12 sm:left-12 sm:right-auto z-20 max-w-lg animate-fadeInUp">
          <span className="text-amber-500 text-[9px] sm:text-[10px] font-black tracking-[0.3em] mb-2 block uppercase">Virtual Exhibition</span>
          <h2 className="text-3xl sm:text-5xl font-serif text-white mb-2 italic font-bold leading-tight">{current.title}</h2>
          <p className="text-white/60 text-sm sm:text-lg mb-3 sm:mb-5 font-light">{current.artist}, {current.year}</p>
          <p className="text-white/30 text-[11px] sm:text-sm italic font-light sm:max-w-md line-clamp-3 sm:line-clamp-none">{current.description}</p>
        </div>

        {/* Desktop Navigation Arrows */}
        <button 
          onClick={prev}
          className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 p-4 sm:p-5 bg-white/5 hover:bg-white/10 rounded-full transition-all group-hover:translate-x-4 border border-white/5 text-white shadow-2xl"
        >
          <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <button 
          onClick={next}
          className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 p-4 sm:p-5 bg-white/5 hover:bg-white/10 rounded-full transition-all group-hover:-translate-x-4 border border-white/5 text-white shadow-2xl"
        >
          <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>

      {/* Mobile Controls / Progress */}
      <div className="mt-16 sm:mt-24 flex flex-col items-center gap-8 w-full max-w-sm">
        {/* Navigation Dots */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
          {artworks.map((_, i) => (
            <button 
              key={i} 
              onClick={() => setIndex(i)}
              className={`h-1 rounded-full transition-all duration-500 ${i === index ? 'w-10 sm:w-16 bg-amber-500' : 'w-3 sm:w-4 bg-white/20 hover:bg-white/40'}`}
            />
          ))}
        </div>
        
        {/* Mobile-only Nav Buttons */}
        <div className="flex sm:hidden gap-6">
           <button onClick={prev} className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white active:bg-amber-500 active:text-black transition-all">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
           </button>
           <button onClick={next} className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white active:bg-amber-500 active:text-black transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
           </button>
        </div>

        <p className="text-[9px] sm:text-[10px] tracking-[0.3em] text-white/25 uppercase font-bold text-center">Lot {index + 1} of {artworks.length} • Digital Canvas Experience</p>
      </div>
    </div>
  );
};


export default VirtualTour;
