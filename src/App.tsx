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
    </>
  )
}

export default App
