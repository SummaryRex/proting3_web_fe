import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();
  const { login, isLoading, error, clearError, user } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (isLoading) return;
    if (!username || !password) return;

    try {
      await login(username, password);

      // ambil dari context (bukan dari response lagi)
      const role = user?.role;

      if (role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }

    } catch (err) {
      console.error("LOGIN FAILED:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 font-primary"
      style={{
        background:
          "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/mining.jpg') no-repeat center/cover",
      }}
    >
      <div className="bg-[rgba(10,12,18,0.82)] border-[1.5px] border-djati-border-amber rounded-[18px] backdrop-blur-[18px] shadow-card px-8 pt-9 pb-6 max-w-[400px] w-full">

        <h1 className="text-[1.65rem] mb-7 font-extrabold text-white text-center">
          Welcome Back Coworkers!
        </h1>

        {/* ERROR */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500 text-red-400 text-sm flex gap-2">
            <span>⚠</span>
            <span>{error}</span>
            <button onClick={clearError} className="ml-auto text-white/40">
              &times;
            </button>
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* USERNAME */}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              clearError();
            }}
            className="input-base w-full mb-4"
          />

          {/* PASSWORD */}
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError();
              }}
              className="input-base w-full pr-10"
            />

            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </span>
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                SIGNING IN...
              </>
            ) : (
              <>
                SIGN IN
                <LogIn size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}