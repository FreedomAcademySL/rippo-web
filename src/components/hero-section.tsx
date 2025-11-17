'use client';

import { useState, useEffect } from 'react';
import { ArrowDown } from 'lucide-react';
import ripo from '@/assets/ripo.jpeg';
import nnnoise from '@/assets/nnnoise.svg';
import logocuerpofit from '@/assets/image.webp';

export function HeroSection() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const parallaxStyle = (intensity: number) => ({
    transform: `translate(${mousePosition.x * intensity}px, ${mousePosition.y * intensity}px)`,
    transition: 'transform 0.1s ease-out',
  });

  return (
    <section className="relative w-full h-screen bg-slate-900 overflow-hidden flex items-center justify-center">
      {/* Graining overlay */}
      <div
        className="absolute inset-0 opacity-35 mix-blend-soft-light pointer-events-none z-10"
        style={{
          backgroundImage: `url(${nnnoise})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '700px 700px',
          backgroundPosition: 'top left',
        }}
      />

      <div className="absolute inset-0 overflow-hidden">
        {/* Blob 1 - Large top right */}
        {/* <div 
          className="absolute -top-60 -right-60 w-[600px] h-[600px] bg-red-500/20 rounded-full blur-3xl animate-pulse-slow"
          style={parallaxStyle(30)}
        ></div> */}

        {/* Blob 2 - Bottom left */}
        {/* <div 
          className="absolute -bottom-60 -left-60 w-[600px] h-[600px] bg-rose-500/15 rounded-full blur-3xl animate-float"
          style={parallaxStyle(25)}
        ></div> */}

        {/* Blob 3 - Center right */}
        {/* <div 
          className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-red-400/10 rounded-full blur-3xl animate-float-reverse"
          style={parallaxStyle(20)}
        ></div> */}

        {/* Blob 4 - Top left */}
        <div
          className="absolute -top-40 -left-40 w-[550px] h-[550px] bg-red-600/12 rounded-full blur-3xl animate-pulse-slow"
          style={parallaxStyle(35)}
        ></div>




        {/* Blob 7 - Top center */}
        {/* <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[580px] h-[580px] bg-red-400/16 rounded-full blur-3xl animate-pulse-slow"
          style={parallaxStyle(15)}
        ></div> */}

        {/* Blob 8 - Bottom center */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[540px] h-[540px] bg-rose-500/12 rounded-full blur-3xl animate-float"
          style={parallaxStyle(5)}
        ></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full h-full flex items-center">
        <div className="w-full">
          <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-0 h-full lg:h-screen">

            {/* Left: Text Content with fluid background */}
            <div className="relative flex-1 flex flex-col justify-center py-12 lg:py-0 z-10 pr-0 lg:pl-32">
              <div className="relative z-30">
                <div className="relative z-40 space-y-10 px-6 lg:pl-16">
                  {/* Name */}
                  <div className="space-y-0 relative z-50 mb-0 ">

                    <h1 className="russo-title text-3xl sm:text-4xl uppercase sm:text-5xl lg:text-6xl 2xl:text-8xl 3xl:text-10xl font-black text-white tracking-wider text-balance flex gap-2">
                      <span className="relative w-fit break-keep">
                        CuerpoFit
                        <img src={logocuerpofit} alt="Cuerpofit" style={{
                        }} className="absolute -right-24 md:-right-42 lg:-right-42 object-cover h-[80px] md:h-[100px] lg:h-[120px] xl:h-[150px] lg:-right-22  block top-1/2 -translate-y-1/2" />
                      </span>
                    </h1>
                    <p className="text-red-400 max-w-[200px] md:max-w-none text-xs md:text-xs lg:text-base xl:text-base 2xl:text-lg tracking-wider uppercase">Soy Joa Ripo, tu entrenador personal</p>
                  </div>

                  {/* Description */}
                  <div className="space-y-6 relative z-50 max-w-xl mt-10">
                    <p className="text-xl lg:text-2xl text-slate-200 font-light leading-relaxed text-balance">
                      Un programa directo y efectivo para transformar tu cuerpo con <span className="text-red-300 font-semibold">método, constancia y datos</span>
                    </p>
                    <p className="text-lg text-slate-300 leading-relaxed text-balance">
                      Periodización inteligente, nutrición simple que podés sostener, seguimiento semanal y ajustes precisos. Sin humo, sin excusas: <span className="text-red-300 font-semibold">progreso medible todas las semanas</span>
                    </p>
                  </div>

                  {/* CTA Button */}
                  <a
                    href="#contacto"
                    className="group/cta relative w-fit mt-4 inline-block z-0"
                  >
                    <div className="relative text-base md:text-2xl inline-flex items-center gap-3 px-8 py-4 bg-red-500 hover/cta:bg-red-600 text-white font-bold rounded-lg transition-all duration-300 group-hover/cta:shadow-xl group-hover/cta:shadow-red-500/50 group-hover/cta:scale-110 z-10">
                      Empezá tu transformación
                      <ArrowDown className="w-5 h-5 group-hover/cta:translate-y-1 transition-transform duration-300" />
                    </div>
                    <div
                      className="user-select-none user-drag-none pointer-events-none absolute top-1/2 -translate-y-1/2 right-1/2 translate-x-1/2 w-[520px] h-[320px] bg-red-500/20 group-hover/cta:bg-red-500/25 rounded-full blur-3xl animate-float-reverse z-0"
                      style={parallaxStyle(50)}
                    ></div>
                  </a>
                </div>
              </div>
            </div>
            <div className="relative flex-1 overflow-hidden scale-110">
              <div className="relative group/image flex-1 h-full hidden lg:flex items-center justify-end overflow-hidden">
                <div
                  className="relative w-full h-full"
                  style={{
                    clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)',
                    transform: 'skewY(0.001deg)',
                  }}
                >
                  <img
                    src={ripo}
                    alt="Cuerpofit - Joa Ripo"
                    className="w-full h-full object-cover group-hover/image:scale-115 transition-all duration-500"
                  />
                </div>
                <div
                  style={{
                    clipPath: 'polygon(30% 0, 30.5% 0, 0.5% 100%, 0% 100%)',
                    transform: 'skewY(0.001deg)',
                  }}
                  className="hero-laser-beam pointer-events-none absolute top-0 right-0 w-full h-full transition-all duration-500 border-r-[0.25%]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 hidden lg:flex">
        <div className="flex flex-col items-center gap-2 text-red-400">
          <span className="text-sm font-medium">Desliza para más</span>
          <ArrowDown className="w-5 h-5 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
