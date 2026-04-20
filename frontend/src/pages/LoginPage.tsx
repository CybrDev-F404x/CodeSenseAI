import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Credenciales inválidas. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#180f24] text-[#eddcfb] font-body min-h-screen flex overflow-hidden selection:bg-[#34469C]/40">
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      {/* Left Branding Side - Exact Replication */}
      <section className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-20 bg-[#130a1f] overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #34469C 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#34469c]/5 to-transparent pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-[#34469c] flex items-center justify-center shadow-lg shadow-[#34469c]/20">
              <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
            </div>
            <h1 className="text-2xl font-light tracking-tighter text-[#eddcfb]">CodeSenseAI</h1>
          </div>

          <div className="max-w-md animate-fade-in">
            <h2 className="text-5xl font-light leading-tight mb-6 tracking-tight">
              Refining code into <span className="text-[#b9c3ff] font-medium italic">digital architecture.</span>
            </h2>
            <p className="text-lg text-[#c5c5d3] font-light leading-relaxed">
              The editorial intelligence platform for high-stakes software auditing. Sophisticated insights for the modern curator.
            </p>
          </div>
        </div>

        <div className="relative z-10 self-start">
          <div className="bg-[#21172d] p-6 rounded-xl border border-white/5 shadow-2xl">
            <div className="flex gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#9A1547] shadow-[0_0_8px_#9A1547]"></div>
              <div className="w-2 h-2 rounded-full bg-[#FCAE0A] shadow-[0_0_8px_#FCAE0A]"></div>
              <div className="w-2 h-2 rounded-full bg-[#108023] shadow-[0_0_8px_#108023]"></div>
            </div>
            <code className="font-mono text-sm text-[#b9c3ff] block">
              <span className="text-[#8f909d]">01</span> class Auditor {'{'} <br/>
              <span className="text-[#8f909d]">02</span> &nbsp;&nbsp;async scan(repository) {'{'} <br/>
              <span className="text-[#8f909d]">03</span> &nbsp;&nbsp;&nbsp;&nbsp;return await Intelligence.curate(repo); <br/>
              <span className="text-[#8f909d]">04</span> &nbsp;&nbsp;{'}'} <br/>
              <span className="text-[#8f909d]">05</span> {'}'}
            </code>
          </div>
        </div>

        <div className="relative z-10 text-sm text-[#8f909d] font-light">
          © 2026 Editorial Intelligence. All rights reserved.
        </div>
      </section>

      {/* Right Login Side */}
      <main className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 bg-[#0d0420]">
        <div className="w-full max-w-[420px] animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-lg bg-[#34469c] flex items-center justify-center"><span className="material-symbols-outlined text-white text-base">terminal</span></div>
            <h1 className="text-xl font-light tracking-tighter">CodeSenseAI</h1>
          </div>

          <div className="mb-10">
            <h3 className="text-3xl font-medium tracking-tight mb-2">Welcome Back</h3>
            <p className="text-[#c5c5d3] font-light">Enter your credentials to access the editorial suite.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-2 text-[#ffb4ab] bg-[#93000a]/20 border border-[#93000a]/30 px-4 py-3 rounded-xl text-sm font-light animate-fade-in">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#8f909d] uppercase tracking-widest px-1">Email Address</label>
              <input 
                className="w-full bg-[#130a1f] border border-white/10 rounded-xl px-4 py-3.5 text-[#eddcfb] placeholder:text-[#8f909d]/40 focus:ring-0 focus:border-[#34469c] transition-all outline-none" 
                placeholder="curator@codesense.ai" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="block text-xs font-medium text-[#8f909d] uppercase tracking-widest">Password</label>
                <Link className="text-xs text-[#b9c3ff] hover:text-white transition-colors" to="#">Forgot password?</Link>
              </div>
              <input 
                className="w-full bg-[#130a1f] border border-white/10 rounded-xl px-4 py-3.5 text-[#eddcfb] placeholder:text-[#8f909d]/40 focus:ring-0 focus:border-[#34469c] transition-all outline-none" 
                placeholder="••••••••" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center px-1">
              <input className="w-4 h-4 rounded bg-[#130a1f] border-white/10 text-[#34469c] focus:ring-offset-[#180f24] focus:ring-[#34469c]" id="remember" type="checkbox"/>
              <label className="ml-2 text-sm text-[#c5c5d3] font-light" htmlFor="remember">Keep me signed in for 30 days</label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-[#34469c] hover:brightness-110 text-white font-medium rounded-xl transition-all shadow-xl shadow-[#34469c]/10 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Sign In to Dashboard'}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <div className="relative flex justify-center text-xs uppercase tracking-tighter"><span className="bg-[#0d0420] px-4 text-[#8f909d]">or continue with</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 py-3 px-4 border border-white/5 rounded-xl bg-[#130a1f] hover:bg-[#21172d] transition-colors group" type="button">
                <img alt="Google" className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZUm-lzSpXBHB6b2FEEZECo6xYAID2MkHs4QDd60h4DuStLLEuE6E634brnFxG2KBIBKcGFEaUxhcjBtNk_NOC7Uu4ArHVfXnQaBDOelWy2wlVi406Y4MwhO6OhfPCySnbikYyRjIb19UZFn1_aUr3uEO8z5Baff_TV7FnP8KUkcXUmnYjOSbr9sags-YNHYnRkGvNUoyY15rX0sO2LXSqwN7XNSE8H1C2iYh1F73LTQ98lM9uKg3phBtercDyqhJ51Bbsj4bL7uYE"/>
                <span className="text-sm font-medium text-[#c5c5d3]">Google</span>
              </button>
              <button className="flex items-center justify-center gap-2 py-3 px-4 border border-white/5 rounded-xl bg-[#130a1f] hover:bg-[#21172d] transition-colors group" type="button">
                <span className="material-symbols-outlined text-xl text-[#c5c5d3] opacity-70 group-hover:opacity-100" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
                <span className="text-sm font-medium text-[#c5c5d3]">GitHub</span>
              </button>
            </div>
          </form>

          <p className="mt-12 text-center text-[#c5c5d3] font-light text-sm">
            Don't have an account? <Link className="text-[#b9c3ff] font-medium hover:underline decoration-[#34469c]/30 underline-offset-4 ml-1" to="/register">Request access</Link>
          </p>
        </div>
      </main>

      {/* Floating Decorative Element */}
      <div className="absolute bottom-10 right-10 pointer-events-none hidden xl:block">
        <div className="bg-[#21172d]/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex items-center gap-4 shadow-2xl">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full border-2 border-[#0d0420] bg-[#3b3047] flex items-center justify-center overflow-hidden italic text-[8px] font-bold text-white">IA</div>
            <div className="w-8 h-8 rounded-full border-2 border-[#0d0420] bg-[#34469c] flex items-center justify-center overflow-hidden italic text-[8px] font-bold text-white">AI</div>
          </div>
          <div className="text-xs">
            <p className="text-[#eddcfb] font-medium">Join 2k+ Curators</p>
            <p className="text-[#8f909d]">Auditing 500K+ Lines Weekly</p>
          </div>
        </div>
      </div>
    </div>
  );
}
