import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import HeroSlideshow from './HeroSlideshow';
import { Heart, Users, Leaf, ArrowRight } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Successfully logged in!');
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (error) {
      toast.error('Failed to log in with Google.');
      setIsGoogleLoading(false);
    }
  };

  const FeatureItem = ({ icon: Icon, text }) => (
    <div className="flex items-center gap-4 text-gray-700">
      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <span className="font-medium text-sm">{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#f4f7fb] flex">
      {/* Left Pane - Slideshow */}
      <div className="hidden lg:block lg:w-[55%] p-3 h-screen">
        <HeroSlideshow />
      </div>

      {/* Right Pane - Auth UI */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-8 sm:p-12 h-screen overflow-y-auto relative">
        <div className="w-full max-w-sm py-8 border-y-transparent">
          
          {/* Logo Heading */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/20">
              <div className="flex">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 -mr-1" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 z-10" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 -ml-1" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading text-gray-900 leading-tight">Food Bridge</h2>
              <p className="text-blue-600/80 text-xs font-semibold">Food donation platform</p>
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 font-heading tracking-tight">
              {isSignUp ? 'Create an account' : 'Welcome back 👋'}
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed max-w-[90%]">
              {isSignUp 
                ? 'Sign up to start donating or receiving food today.'
                : 'Sign in to connect with donors and NGOs, and manage donations.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 border border-gray-200/80 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white shadow-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-200/80 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white shadow-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || isGoogleLoading}
              className="w-full h-12 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 font-semibold text-sm transition-all"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Sign Up to Food Bridge' : 'Sign In')}
            </Button>
          </form>

          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200/80"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-[#f4f7fb] text-gray-400 font-medium text-xs uppercase tracking-wider">Or continue with</span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl h-12 bg-white hover:bg-gray-50 border-gray-200 shadow-sm font-semibold text-gray-700 transition-all flex items-center justify-center"
            onClick={handleGoogleLogin}
            disabled={loading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
                Connecting securely...
              </span>
            ) : (
              <>
                <GoogleIcon />
                Sign in with Google
              </>
            )}
          </Button>

          <div className="mt-8 text-center pt-2">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-gray-600 hover:text-blue-600 font-medium transition"
            >
              {isSignUp ? (
                <>Already have an account? <span className="font-bold underline underline-offset-2">Sign in</span></>
              ) : (
                <>New here? <span className="font-bold underline underline-offset-2">Create an account automatically</span></>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
