/**
 * @file MobileMenu.tsx
 * @description Mobile-first navigation menu with touch-friendly interactions
 * 
 * Features:
 * - Touch targets >= 48px (WCAG AAA compliant)
 * - Smooth animations optimized for mobile
 * - Safe area insets for notched devices
 * - Accessible with ARIA labels
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Home, Search, Heart, MessageCircle, User, LogIn } from 'lucide-react';

interface MobileMenuProps {
  isAuthenticated?: boolean;
  userName?: string;
}

export default function MobileMenu({ isAuthenticated = false, userName }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Hamburger Button - Touch-friendly 48px */}
      <button
        onClick={toggleMenu}
        className="lg:hidden relative z-50 flex h-touch-sm w-touch-sm items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in lg:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Panel */}
      <nav
        className={`
          fixed right-0 top-0 z-40 h-full w-80 max-w-[85vw] 
          bg-white shadow-2xl transform transition-transform duration-300 ease-out
          lg:hidden
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        aria-label="Mobile navigation"
      >
        {/* Safe area for notched devices */}
        <div className="flex h-full flex-col pt-safe-top pb-safe-bottom">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white font-bold">
                P
              </div>
              <span className="text-lg font-bold text-gray-900">PayEasy</span>
            </div>
            <button
              onClick={closeMenu}
              className="flex h-touch-sm w-touch-sm items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>

          {/* User Info (if authenticated) */}
          {isAuthenticated && userName && (
            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{userName}</p>
                  <p className="text-sm text-gray-500">View profile</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  onClick={closeMenu}
                  className="flex items-center gap-4 rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-touch-sm"
                >
                  <Home size={20} className="text-gray-500" />
                  <span className="text-base font-medium">Home</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/browse"
                  onClick={closeMenu}
                  className="flex items-center gap-4 rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-touch-sm"
                >
                  <Search size={20} className="text-gray-500" />
                  <span className="text-base font-medium">Browse Listings</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/favorites"
                  onClick={closeMenu}
                  className="flex items-center gap-4 rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-touch-sm"
                >
                  <Heart size={20} className="text-gray-500" />
                  <span className="text-base font-medium">Favorites</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/messages"
                  onClick={closeMenu}
                  className="flex items-center gap-4 rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-touch-sm"
                >
                  <MessageCircle size={20} className="text-gray-500" />
                  <span className="text-base font-medium">Messages</span>
                </Link>
              </li>
            </ul>

            <hr className="my-6 border-gray-200" />

            <ul className="space-y-2">
              {isAuthenticated ? (
                <li>
                  <Link
                    href="/profile"
                    onClick={closeMenu}
                    className="flex items-center gap-4 rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-touch-sm"
                  >
                    <User size={20} className="text-gray-500" />
                    <span className="text-base font-medium">Profile</span>
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link
                      href="/auth/login"
                      onClick={closeMenu}
                      className="flex items-center gap-4 rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-touch-sm"
                    >
                      <LogIn size={20} className="text-gray-500" />
                      <span className="text-base font-medium">Login</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/auth/register"
                      onClick={closeMenu}
                      className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-white hover:bg-primary/90 active:bg-primary/80 transition-colors min-h-touch-sm font-medium shadow-sm shadow-primary/20"
                    >
                      Get Started
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 text-center">
            <p className="text-xs text-gray-500">
              © 2026 PayEasy. Powered by Stellar.
            </p>
          </div>
        </div>
      </nav>
    </>
  );
}
