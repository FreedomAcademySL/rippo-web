'use client';

import { useState, useEffect } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { ArrowDown } from 'lucide-react';
import { motion } from 'motion/react';
import ripo from '@/assets/ripo.jpeg';
import nnnoise from '@/assets/nnnoise.svg';
import logocuerpofit from '@/assets/image.png';

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

  const smoothScrollTo = (targetY: number, duration = 700) => {
    const startY = window.scrollY;
    const distance = targetY - startY;
    const startTime = performance.now();

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);

      window.scrollTo(0, startY + distance * easedProgress);

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  const handleSmoothScroll = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const target = document.querySelector('#contacto');
    if (!target) {
      return;
    }

    const targetOffset = target.getBoundingClientRect().top + window.scrollY;
    smoothScrollTo(targetOffset);
  };

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
      <div className="relative z-10 w-full h-full flex items-start pt-0 md:items-center">
        <div className="w-full h-full">
          <div className="flex flex-col md:flex-row items-center md:items-stretch gap-0 h-full md:h-screen">

            {/* Left: Text Content with fluid background */}
            <div className="relative pt-16 h-full md:pt-0 flex-1 flex flex-col justify-center py-12 lg:py-0 z-10 pr-0 lg:pl-32">
              <div className="relative z-30">
                <div className="relative z-40 space-y-10 px-6 md:px-6 xl:pl-16">
                  {/* Name */}
                  <div className="space-y-0 relative z-50 mb-0 ">

                    <motion.h1
                      className="russo-title text-4xl sm:text-5xl uppercase sm:text-5xl lg:text-6xl 2xl:text-8xl 3xl:text-10xl font-black text-white tracking-wider text-balance flex gap-2"
                      initial={{ opacity: 0, y: -50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    >
                      <span className="relative w-fit break-keep">
                        CuerpoFit
                        <img src={logocuerpofit} alt="Cuerpofit" style={{
                        }} className="absolute -right-14 sm:-right-20 md:-right-20 lg:-right-32 object-cover h-[80px] md:h-[100px] lg:h-[120px] xl:h-[150px] lg:-right-22  block top-1/2 -translate-y-1/2" />
                      </span>
                    </motion.h1>
                    <motion.p
                      className="text-red-400 max-w-[200px] md:max-w-none text-xs md:text-xs lg:text-base xl:text-base 2xl:text-lg tracking-wider uppercase"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                    >
                      Soy Joa Ripo, tu entrenador personal
                    </motion.p>
                  </div>

                  {/* Description */}
                  <div className="space-y-6 relative z-50 max-w-xl mt-10">
                    <motion.p
                      className="text-base sm:text-lg md:text-lg lg:text-xl xl:text-2xl text-slate-200 font-light leading-relaxed text-balance"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                    >
                      Un programa directo y efectivo para transformar tu cuerpo con <span className="text-red-300 font-semibold">método, constancia y datos</span>
                    </motion.p>
                    <motion.p
                      className="text-lg text-slate-300 leading-relaxed text-balance"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
                    >
                      Periodización inteligente, nutrición simple que podés sostener, seguimiento semanal y ajustes precisos. Sin humo, sin excusas: <span className="text-red-300 font-semibold">progreso medible todas las semanas</span>
                    </motion.p>
                  </div>

                  {/* CTA Button */}
                  <div className='relative w-fit'>
                    <motion.a
                      role="button"
                      href="#contacto"
                      onClick={handleSmoothScroll}
                      className="group/cta w-fit inline-block z-0"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.8, ease: 'easeOut' }}
                    >
                      <div className=" text-base sm:text-lg md:text-lg lg:text-xl xl:text-2xl inline-flex items-center gap-3 px-8 py-4 bg-red-500 hover/cta:bg-red-600 text-white font-bold rounded-lg transition-all duration-300 group-hover/cta:shadow-xl group-hover/cta:shadow-red-500/50 group-hover/cta:scale-110 z-10">
                        Empezá tu transformación
                        <ArrowDown className="w-5 h-5 group-hover/cta:translate-y-1 transition-transform duration-300" />
                      </div>
                    </motion.a>
                    <div
                      className="user-select-none user-drag-none pointer-events-none absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-[520px] h-[320px] bg-red-500/20 group-hover/cta:bg-red-500/25 rounded-full blur-3xl animate-float-reverse z-0"
                      style={parallaxStyle(60)}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -right-[0px] w-[250px] md:right-0 md:relative h-full flex-1 overflow-hidden scale-100">
              <div className="relative group/image flex-1 h-full md:flex items-center justify-end overflow-hidden">
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
                  <div className='absolute block md:hidden top-0 left-0 w-full h-full bg-slate-900/60'>

                  </div>
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
      <motion.a
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 hidden lg:flex cursor-pointer"
        role="button"
        href="#contacto"
        onClick={handleSmoothScroll}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2, ease: 'easeOut' }}
      >
        <div className="flex flex-col items-center gap-2 text-red-400">
          <span className="text-sm font-medium">Desliza para más</span>
          <ArrowDown className="w-5 h-5 animate-bounce" />
        </div>
      </motion.a>
    </section>
  );
}
