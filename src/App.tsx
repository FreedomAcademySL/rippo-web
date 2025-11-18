import { HeroSection } from '@/components/hero-section'
import { ContactForm } from '@/components/contact-form'
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
      <div className="wip-badge fixed bottom-4 left-4 z-50 px-4 py-1 text-xs font-semibold backdrop-blur-sm md:text-sm">
        WIP · Work in progress
      </div>
    </>
  )
}

export default App
