'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    goal: '',
  });
  
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', phone: '', goal: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="w-full max-w-2xl px-6">
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <h2 className="text-5xl lg:text-6xl font-black text-foreground">
            Inicia Tu Viaje
          </h2>
          <p className="text-lg text-muted-foreground">
            Completa el formulario y nos pondremos en contacto pronto.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-semibold text-foreground">
              Nombre Completo
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Juan García"
              required
              className="bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-semibold text-foreground">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              required
              className="bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-semibold text-foreground">
              Teléfono
            </label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+34 612 345 678"
              className="bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="goal" className="block text-sm font-semibold text-foreground">
              Mi Objetivo Principal
            </label>
            <select
              id="goal"
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Selecciona una opción</option>
              <option value="perder-peso">Perder Peso</option>
              <option value="ganar-musculo">Ganar Músculo</option>
              <option value="resistencia">Mejorar Resistencia</option>
              <option value="general">Bienestar General</option>
            </select>
          </div>

          <Button
            type="submit"
            className="w-full py-6 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-lg rounded-lg transition-all"
          >
            {submitted ? '✓ Mensaje Enviado' : 'Contactar Ahora'}
          </Button>
        </form>

        {submitted && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
            <p className="text-green-600 font-semibold">¡Gracias! Nos pondremos en contacto en breve.</p>
          </div>
        )}
      </div>
    </div>
  );
}
