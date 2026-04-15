import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch {
      // error is already set in AuthContext
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 font-primary"
      style={{ background: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/mining.jpg') no-repeat center/cover" }}
    >
      <div className="text-center w-[min(100%,1000px)] mx-auto">
        {/* Card */}
        <div className="bg-[rgba(10,12,18,0.82)] border-[1.5px] border-djati-border-amber rounded-[18px] backdrop-blur-[18px] shadow-card px-8 pt-9 pb-6 max-w-[400px] mx-auto">
          <h1 className="text-[1.65rem] leading-tight mb-7 font-extrabold tracking-tight text-white">
            Welcome Back Coworkers!
          </h1>

          {/* Error message */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-status-critical-bg border border-status-critical-border text-status-critical text-[0.82rem] font-medium text-left flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5">⚠</span>
              <span>{error}</span>
              <button onClick={clearError} className="ml-auto text-white/40 hover:text-white transition-colors">&times;</button>
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Username */}
            <div className="mb-4 text-left">
              <label htmlFor="username" className="block mb-1.5 text-[0.72rem] font-bold tracking-widest text-[rgba(220,190,120,0.92)] uppercase">
                USERNAME
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                className="input-base !bg-[rgba(12,14,22,0.7)] disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div className="mb-4 text-left">
              <label htmlFor="password" className="block mb-1.5 text-[0.72rem] font-bold tracking-widest text-[rgba(220,190,120,0.92)] uppercase">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="input-base !bg-[rgba(12,14,22,0.7)] !pr-12 disabled:opacity-50"
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[rgba(255,200,80,0.75)] cursor-pointer flex items-center hover:text-djati-amber transition-colors"
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </span>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full mt-2.5 py-[15px] text-[1.05rem] font-extrabold tracking-widest disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  SIGNING IN...
                </>
              ) : (
                <>
                  SIGN IN
                  <LogIn size={20} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          {/* Helper Links */}
          <div className="mt-5 flex justify-between items-center text-[0.82rem]">
            <a href="#" className="text-white/80 no-underline hover:text-djati-amber transition-colors">
              Forgot Password?
            </a>
            <a href="#" className="text-white/80 no-underline inline-flex items-center gap-1.5 hover:text-djati-amber transition-colors">
              Technical Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}