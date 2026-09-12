import Link from 'next/link';

export default function TopBar() {
  return (
    <div className="bg-blue-600 text-white py-2">
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
        <div className="text-sm">
          Last Updated: <span id="lastUpdated">14 February 2024</span>
        </div>
        <div className="flex space-x-4 text-sm">
          <Link href="/" className="hover:text-blue-200">
            Home
          </Link>
          <Link href="/contact" className="hover:text-blue-200">
            Contact
          </Link>
          <Link href="/about" className="hover:text-blue-200">
            About
          </Link>
        </div>
      </div>
    </div>
  );
} 