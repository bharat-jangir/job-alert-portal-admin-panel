'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Faq {
  _id: string;
  question: string;
  answer: string;
  category?: string;
}

export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?._id ?? null);

  const categories = [...new Set(faqs.map((f) => f.category || 'General'))];

  return (
    <div className="space-y-8">
      {categories.map((cat) => {
        const group = faqs.filter((f) => (f.category || 'General') === cat);
        return (
          <div key={cat}>
            {categories.length > 1 && (
              <h2 className="text-base font-bold text-blue-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="h-0.5 w-5 bg-blue-400 rounded inline-block" />
                {cat}
              </h2>
            )}
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              {group.map((faq) => {
                const isOpen = openId === faq._id;
                return (
                  <div key={faq._id}>
                    <button
                      onClick={() => setOpenId(isOpen ? null : faq._id)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 hover:bg-blue-50 transition-colors group"
                      aria-expanded={isOpen}
                    >
                      <span className={`text-sm font-medium leading-snug ${isOpen ? 'text-blue-700' : 'text-gray-800 group-hover:text-blue-700'}`}>
                        {faq.question}
                      </span>
                      <span className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                        {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-sm text-gray-600 leading-relaxed bg-blue-50 border-t border-blue-100">
                        <div dangerouslySetInnerHTML={{ __html: faq.answer.replace(/\n/g, '<br />') }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
