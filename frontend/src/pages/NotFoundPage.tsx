import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#180f24] text-[#eddcfb] flex items-center justify-center font-body selection:bg-[#34469C]/40 overflow-hidden relative">
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      {/* Atmospheric background elements */}
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#b9c3ff]/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#ffb1c1]/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="text-center animate-fade-in max-w-lg px-8">
        {/* 404 Number */}
        <div className="relative mb-8">
          <span className="text-[160px] font-mono font-bold text-[#130a1f] leading-none select-none">404</span>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-7xl text-[#34469c]/40" style={{ fontVariationSettings: "'FILL' 1" }}>explore_off</span>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl font-light tracking-tight mb-4">Nodo No Encontrado</h1>
        <p className="text-[#8f909d] font-light leading-relaxed mb-10 max-w-sm mx-auto">
          La ruta solicitada no existe en la red de curación editorial. Es posible que el recurso haya sido archivado o reasignado.
        </p>

        {/* Action */}
        <Link 
          to="/"
          className="inline-flex items-center gap-3 px-8 py-3.5 bg-[#34469c] hover:brightness-110 text-white font-medium rounded-xl transition-all shadow-xl shadow-[#34469c]/20 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Volver al Dashboard
        </Link>

        {/* Status Badge */}
        <div className="mt-16 flex items-center justify-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#108023] shadow-[0_0_8px_#108023] animate-pulse"></div>
          <span className="text-[10px] uppercase tracking-widest text-[#8f909d] font-bold">
            Sistema Operativo — Ruta Inválida
          </span>
        </div>
      </div>
    </div>
  );
}
