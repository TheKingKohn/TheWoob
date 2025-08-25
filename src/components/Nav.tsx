import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

interface NavProps {
  authed: boolean;
  user?: { role: string; email: string; name?: string } | null;
}

export default function Nav({ authed, user }: NavProps) {
  const [showLogout, setShowLogout] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (response.ok) {
      window.location.href = "/";
    }
  };

  return (
    <div className="border-b border-white/10 sticky top-0 z-40 bg-woob-bg/80 backdrop-blur-md shadow-md">
      <div className="woob-container flex items-center justify-between py-4 sm:py-6 min-h-[64px] sm:min-h-[80px]">
        <Link href="/" className="flex items-center gap-2 z-50 py-3 pr-6 flex-shrink-0 min-h-[56px]">
          <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 bg-clip-text text-transparent hover:from-purple-400 hover:via-blue-500 hover:to-purple-400 transition-all duration-300 tracking-tight">
            TheWoob
          </span>
        </Link>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-3">
          <Link className="btn-outline" href="/browse">
            <span className="hidden lg:inline">Browse</span>
            <span className="lg:hidden">🔍</span>
          </Link>
          <Link className="btn-outline border-blue-400/40 text-blue-400 hover:bg-blue-400/10" href="/deals">
            <span className="hidden lg:inline">🌟 Local Deals</span>
            <span className="lg:hidden">🌟</span>
          </Link>
          {authed && (
            <>
              <Link className="btn" href="/sell/new">
                <span className="hidden lg:inline">+ Sell Item</span>
                <span className="lg:hidden">+ Sell</span>
              </Link>
              <Link className="btn-outline" href="/messages">
                <span className="hidden lg:inline">Messages</span>
                <span className="lg:hidden">💬</span>
              </Link>
              <Link className="btn-outline" href="/dashboard">
                <span className="hidden lg:inline">Dashboard</span>
                <span className="lg:hidden">📊</span>
              </Link>
              {user?.role === "admin" && (
                <Link className="btn-outline border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10" href="/admin">
                  <span className="hidden lg:inline">🛡️ Admin</span>
                  <span className="lg:hidden">🛡️</span>
                </Link>
              )}
            </>
          )}
          <ThemeToggle />
          <div className="relative">
            <button
              className="btn-outline flex items-center gap-1"
              onClick={() => setShowLogout(!showLogout)}
            >
              <span className="hidden lg:inline">Account</span>
              <span className="lg:hidden">👤</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {showLogout && (
              <div className="absolute right-0 mt-2 w-48 panel p-2 space-y-1 z-50">
                <Link href="/profile" className="block px-3 py-2 text-sm hover:bg-white/5 rounded transition-colors">Public Profile</Link>
                <Link href="/account" className="block px-3 py-2 text-sm hover:bg-white/5 rounded transition-colors">Account Settings</Link>
                <Link href="/help" className="block px-3 py-2 text-sm hover:bg-white/5 rounded transition-colors text-blue-400">🛡️ Trust & Safety</Link>
                <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-sm hover:bg-white/5 rounded text-red-400 transition-colors">Sign Out</button>
              </div>
            )}
          </div>
          {!authed && (
            <>
              <Link className="btn-outline" href="/signin">Sign In</Link>
              <Link className="btn" href="/signin">Get Started</Link>
            </>
          )}
        </nav>
        {/* Mobile menu button */}
        <button
          className="md:hidden btn-outline p-3 rounded-lg"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          aria-label="Toggle mobile menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {showMobileMenu ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
      {/* Mobile Navigation */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-white/10 bg-woob-bg/95 backdrop-blur-md shadow-lg">
          <div className="woob-container py-6 space-y-3">
            <Link className="block btn-outline w-full text-left" href="/browse">🔍 Browse</Link>
            <Link className="block btn-outline border-blue-400/40 text-blue-400 hover:bg-blue-400/10 w-full text-left" href="/deals">🌟 Local Deals</Link>
            {authed && (
              <>
                <Link className="block btn w-full text-left" href="/sell/new">+ Sell Item</Link>
                <Link className="block btn-outline w-full text-left" href="/messages">💬 Messages</Link>
                <Link className="block btn-outline w-full text-left" href="/dashboard">📊 Dashboard</Link>
                {user?.role === "admin" && (
                  <Link className="block btn-outline border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10 w-full text-left" href="/admin">🛡️ Admin</Link>
                )}
              </>
            )}
            <Link className="block btn-outline w-full text-left" href="/help">🛡️ Trust & Safety</Link>
            <ThemeToggle />
            {authed ? (
              <button onClick={handleLogout} className="block w-full text-left btn-outline text-red-400 mt-2">Sign Out</button>
            ) : (
              <>
                <Link className="block btn-outline w-full text-left" href="/signin">Sign In</Link>
                <Link className="block btn w-full text-left" href="/signin">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}