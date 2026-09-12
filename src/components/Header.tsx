'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/latest-jobs', label: 'Latest Jobs' },
    { href: '/jobs/admit-cards', label: 'Admit Cards' },
    { href: '/jobs/results', label: 'Results' },
    { href: '/jobs/answer-keys', label: 'Answer Keys' },
    { href: '/about-us', label: 'About Us' },
  ];

  return (
    <>
      {/* Top Bar */}
      <div className="bg-blue-600 text-white py-2">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="text-sm">
              <span>Last Updated: <span id="lastUpdated">14 February 2024</span></span>
            </div>
            <div className="hidden md:flex space-x-4 text-sm">
              <Link href="/sitemap.xml" className="hover:text-blue-200">Sitemap</Link>
              <Link href="/contact" className="hover:text-blue-200">Contact Us</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center py-4">
            <div className="flex items-center justify-between w-full md:w-auto mb-4 md:mb-0">
              <Link href="/" className="text-2xl font-bold text-blue-600">Job Alert</Link>
              {/* Mobile Menu Button */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-gray-600 hover:text-blue-600 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>
            </div>

            {/* Search Bar */}
            <div className="w-full md:w-1/3 mb-4 md:mb-0">
              <form action="/search" method="GET" className="flex">
                <input 
                  type="text" 
                  name="q" 
                  placeholder="Search jobs..." 
                  className="w-full px-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  type="submit" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6 bg-white">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    (item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(item.href + '/'))
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Mobile Navigation */}
          <div className={`md:hidden pb-4 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    (item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(item.href + '/'))
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/sitemap.xml" className="text-gray-600 hover:text-blue-600 py-2">Sitemap</Link>
              <Link href="/contact" className="text-gray-600 hover:text-blue-600 py-2">Contact Us</Link>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
} 