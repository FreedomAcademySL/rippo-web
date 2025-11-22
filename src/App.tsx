import { HeroSection } from '@/components/hero-section'
import { ContactForm } from '@/components/contact-form'
import falogo from '@/assets/falogo.png'
import './App.css'

function App() {
  return (
    <>
      <main className="w-full">
        <HeroSection />
        <div
          id="contacto"
          className="w-full min-h-screen bg-background flex items-center justify-center"
          style={{ scrollMarginTop: '0' }}
        >
          <ContactForm />
        </div>
      </main>
      <footer className="bg-black text-white py-6 px-4 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="opacity-75">
            ¿Dudas o consultas? Escribinos a{' '}
            <a
              href="mailto:contacto.cuerpofit@gmail.com"
              className="font-semibold text-white hover:text-primary transition-colors"
            >
              contacto.cuerpofit@gmail.com
            </a>
          </p>
          <a href="https://www.freedomacademy.app/es" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity underline">
            <span className="uppercase tracking-wide">Powered by Freedom Academy</span>
            <img src={falogo} alt="Freedom Academy logo" className="h-6 w-auto object-contain" />
          </a>
        </div>
      </footer>
      <div className="wip-badge fixed bottom-4 left-4 z-50 px-4 py-1 text-xs font-semibold backdrop-blur-sm md:text-sm">
        WIP · Work in progress
      </div>
    </>
  )
}

export default App
