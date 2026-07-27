import { useState, useEffect } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export const PublicLayout = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header 
        className={`fixed top-0 w-full z-50 transition-all duration-300 bg-white ${
          isScrolled ? 'border-b border-black py-4' : 'py-6'
        }`}
      >
        <div className="max-w-screen-2xl mx-auto px-6 flex items-center justify-between">
          <Link to="/web" className="flex items-center">
            <span className="font-serif text-2xl tracking-tight text-black">
              TERRAVALL
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-10">
            <NavLink to="/web" end className={({ isActive }) => `text-[11px] uppercase tracking-[0.2em] font-medium transition-colors ${isActive ? 'text-black' : 'text-gray-500 hover:text-black'}`}>
              Inicio
            </NavLink>
            <NavLink to="/web/propiedades" className={({ isActive }) => `text-[11px] uppercase tracking-[0.2em] font-medium transition-colors ${isActive ? 'text-black' : 'text-gray-500 hover:text-black'}`}>
              Propiedades
            </NavLink>
            <a href="#contacto" className="text-[11px] uppercase tracking-[0.2em] font-medium text-gray-500 hover:text-black transition-colors">
              Contacto
            </a>
            <Link to="/crm/login" className="ml-8 px-6 py-2 border border-black text-[11px] uppercase tracking-[0.2em] font-medium text-black hover:bg-black hover:text-white transition-colors">
              Agentes
            </Link>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-black"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-black py-8 px-6 flex flex-col gap-6 md:hidden">
            <NavLink to="/web" end onClick={() => setMobileMenuOpen(false)} className="text-[11px] uppercase tracking-[0.2em] text-black">Inicio</NavLink>
            <NavLink to="/web/propiedades" onClick={() => setMobileMenuOpen(false)} className="text-[11px] uppercase tracking-[0.2em] text-black">Propiedades</NavLink>
            <a href="#contacto" onClick={() => setMobileMenuOpen(false)} className="text-[11px] uppercase tracking-[0.2em] text-black">Contacto</a>
            <Link to="/crm/login" onClick={() => setMobileMenuOpen(false)} className="text-[11px] uppercase tracking-[0.2em] text-black border border-black px-6 py-3 text-center mt-4">Acceso Agentes</Link>
          </div>
        )}
      </header>

      <main className="flex-grow pt-24">
        <Outlet />
      </main>

      <footer id="contacto" className="bg-black text-white pt-24 pb-12">
        <div className="max-w-screen-2xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-white/20 pb-16">
          <div className="md:col-span-5">
            <span className="font-serif text-3xl mb-8 block">TERRAVALL</span>
            <p className="text-sm font-light leading-relaxed max-w-sm opacity-80">
              Comisarios de arquitectura y diseño. Seleccionamos cuidadosamente las propiedades más excepcionales para clientes que valoran el espacio, la luz y los materiales.
            </p>
          </div>
          
          <div className="md:col-span-3">
            <h4 className="text-[11px] uppercase tracking-[0.2em] font-semibold mb-8 opacity-50">Contacto</h4>
            <ul className="space-y-4 text-sm font-light opacity-80">
              <li>Paseo de la Castellana 15<br/>28046 Madrid, España</li>
              <li className="pt-2">+34 900 123 456</li>
              <li>info@terravall.com</li>
            </ul>
          </div>

          <div className="md:col-span-4 flex flex-col justify-between">
            <div>
              <h4 className="text-[11px] uppercase tracking-[0.2em] font-semibold mb-8 opacity-50">Legal</h4>
              <ul className="space-y-4 text-sm font-light opacity-80">
                <li><a href="#" className="hover:opacity-100 transition-opacity">Aviso Legal</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Política de Privacidad</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Política de Cookies</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-screen-2xl mx-auto px-6 mt-8 flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-widest opacity-50">
          <p>© {new Date().getFullYear()} Terravall. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
