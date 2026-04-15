import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div
      className="relative w-full h-screen bg-cover bg-center flex items-center justify-center overflow-hidden font-primary"
      style={{ backgroundImage: "url('/mining.jpg')" }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/55 z-[1]" />

      {/* Centered content */}
      <div className="relative z-[2] text-center flex flex-col items-center gap-2.5 animate-fade-in-up">
        <h1 className="text-[clamp(3rem,6vw,5.5rem)] font-black tracking-wider leading-tight mb-0.5 uppercase">
          <span className="text-white">DJATI</span>
          <span className="text-[#f5a623]">MINING</span>
        </h1>

        <p className="text-[clamp(1rem,2vw,1.45rem)] font-medium text-white/[0.88] tracking-wider mb-5">
          Mining Equipment Maintenance System
        </p>

        <button
          id="btnSignIn"
          onClick={() => navigate('/login')}
          className="btn-primary min-w-[380px] py-4 px-14 text-lg font-extrabold tracking-[0.18em] uppercase !shadow-[0_6px_32px_rgba(255,179,0,0.4),0_0_80px_rgba(255,179,0,0.15)] hover:!shadow-[0_12px_48px_rgba(255,179,0,0.55),0_0_120px_rgba(255,179,0,0.22)] hover:!-translate-y-[3px] hover:scale-[1.02] active:!translate-y-0 active:scale-100"
        >
          SIGN IN
        </button>
      </div>
    </div>
  );
}