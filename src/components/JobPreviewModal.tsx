'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Eye,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  X,
  Search,
  Calendar,
  MapPin,
  Building2,
  Clock,
  GraduationCap,
  Briefcase,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface JobPreviewData {
  _id?: string;
  title: string;
  slug?: string;
  organization?: string;
  location?: string;
  salary?: string;
  qualification?: string;
  experience?: string;
  lastDate?: string;
  applyLink?: string;
  description?: string;
  eligibility?: string;
  totalVacancy?: string;
  ageLimit?: string;
  tags?: string[];
  importantDates?: { label: string; date: string }[];
  metaTitle?: string;
  metaDescription?: string;
  sourceUrl?: string;
  type?: string;
  status?: string;
  scheduledAt?: string;
  states?: string;
  updateNote?: string;
  htmlContent?: string;
  sections?: any[];
}

interface JobPreviewModalProps {
  job: JobPreviewData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

// Safe inline text formatter for **bold**, *italic*, [text](url), etc.
function renderInlineText(text?: string) {
  if (!text) return null;

  // Simple and safe regex-based inline parser
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining) {
    // Links: [label](url)
    const linkMatch = remaining.match(/^\[(.*?)\]\((https?:\/\/.*?)\)/);
    if (linkMatch) {
      parts.push(
        <a
          key={key++}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Bold: **text**
    const boldMatch = remaining.match(/^\*\*(.*?)\*\*/);
    if (boldMatch) {
      parts.push(<strong key={key++} className="font-bold">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic: *text*
    const italicMatch = remaining.match(/^\*(.*?)\*/);
    if (italicMatch) {
      parts.push(<em key={key++} className="italic">{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Code: `code`
    const codeMatch = remaining.match(/^`(.*?)`/);
    if (codeMatch) {
      parts.push(
        <code key={key++} className="px-1 py-0.5 rounded bg-slate-100 text-xs font-mono text-slate-800">
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Plain text up to next token
    const nextSpecial = remaining.search(/(\*\*|\*|`|\[)/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return <>{parts}</>;
}

// Resolves context-aware action button text based on post type
function getActionLabel(type?: string, title?: string): string {
  const t = (type || '').toLowerCase().trim();
  const lowerTitle = (title || '').toLowerCase();

  if (t === 'admit-card' || lowerTitle.includes('admit card') || lowerTitle.includes('hall ticket') || lowerTitle.includes('call letter')) {
    return 'Download Admit Card';
  }
  if (t === 'result' || lowerTitle.includes('result') || lowerTitle.includes('score card') || lowerTitle.includes('merit list')) {
    return 'Check Result';
  }
  if (t === 'answer-key' || lowerTitle.includes('answer key') || lowerTitle.includes('ans key') || lowerTitle.includes('objection')) {
    return 'Check Answer Key';
  }
  if (t === 'syllabus' || lowerTitle.includes('syllabus') || lowerTitle.includes('exam pattern')) {
    return 'Download Syllabus';
  }
  if (t === 'admission' || lowerTitle.includes('admission')) {
    return 'Apply for Admission';
  }
  return 'Apply Online';
}

function getDateLabel(type?: string, title?: string): string {
  const t = (type || '').toLowerCase().trim();
  const lowerTitle = (title || '').toLowerCase();

  if (t === 'admit-card' || lowerTitle.includes('admit card') || lowerTitle.includes('hall ticket')) {
    return 'Download Last Date';
  }
  if (t === 'result' || lowerTitle.includes('result')) {
    return 'Result Declared Date';
  }
  if (t === 'answer-key' || lowerTitle.includes('answer key')) {
    return 'Objection Last Date';
  }
  return 'Last Date to Apply';
}

// Resolves block styles into style object
function resolveBlockStyles(styles?: any): React.CSSProperties {
  if (!styles || typeof styles !== 'object') return {};
  const s: React.CSSProperties = {};
  if (styles.textColor) s.color = styles.textColor;
  if (styles.bgColor) s.backgroundColor = styles.bgColor;
  if (styles.borderColor) s.borderColor = styles.borderColor;
  if (styles.borderWidth) s.borderWidth = styles.borderWidth;
  if (styles.borderStyle && styles.borderStyle !== 'none') {
    s.borderStyle = styles.borderStyle;
  } else if ((styles.borderColor || styles.borderWidth) && !styles.borderStyle) {
    s.borderStyle = 'solid';
  }
  if (styles.borderRadius) s.borderRadius = styles.borderRadius;
  if (styles.padding) s.padding = styles.padding;
  if (styles.margin) s.margin = styles.margin;
  if (styles.fontSize) s.fontSize = styles.fontSize;
  if (styles.fontWeight) s.fontWeight = styles.fontWeight as any;
  if (styles.textAlign) s.textAlign = styles.textAlign;
  return s;
}

export function JobPreviewModal({ job, open, onOpenChange }: JobPreviewModalProps) {
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [activeTab, setActiveTab] = useState<'page' | 'seo'>('page');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  if (!job) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const isExpired = job.lastDate ? new Date(job.lastDate).getTime() < Date.now() : false;
  const formattedLastDate = formatDate(job.lastDate);

  const statusConfig = {
    published: { label: 'Live / Published', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    draft: { label: 'Draft (Not Live)', bg: 'bg-slate-100 text-slate-700 border-slate-300' },
    review: { label: 'In Review', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
    scheduled: { label: 'Scheduled', bg: 'bg-blue-100 text-blue-800 border-blue-300' },
    archived: { label: 'Archived', bg: 'bg-rose-100 text-rose-800 border-rose-300' },
  };

  const curStatus = statusConfig[(job.status as keyof typeof statusConfig) || 'draft'] || statusConfig.draft;

  // Frontend public URL
  const publicSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const publicPostUrl = `${publicSiteUrl}/jobs/${job.slug || 'slug'}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] max-h-[90vh] p-0 flex flex-col gap-0 bg-slate-100 overflow-hidden shadow-2xl">
        {/* Top Header Bar */}
        <DialogHeader className="px-6 py-3.5 bg-white border-b border-slate-200 flex flex-row items-center justify-between shrink-0 m-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span className="truncate max-w-[350px]">{job.title || 'Untitled Post Preview'}</span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${curStatus.bg}`}>
                  {curStatus.label}
                </span>
              </DialogTitle>
              <p className="text-xs text-slate-500">Live preview of how candidates will experience this post</p>
            </div>
          </div>

          {/* Controls: Device Mode & View Tab Switcher */}
          <div className="flex items-center gap-3">
            {/* View Mode Tabs */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('page')}
                className={cn(
                  'px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5',
                  activeTab === 'page' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                Page Layout
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('seo')}
                className={cn(
                  'px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5',
                  activeTab === 'seo' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <Search className="w-3.5 h-3.5" />
                Google Snippet
              </button>
            </div>

            {/* Device Switcher (Page mode only) */}
            {activeTab === 'page' && (
              <div className="hidden sm:flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setDevice('desktop')}
                  className={cn(
                    'p-1.5 rounded-md transition-all',
                    device === 'desktop' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  )}
                  title="Desktop View (Full Width)"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDevice('tablet')}
                  className={cn(
                    'p-1.5 rounded-md transition-all',
                    device === 'tablet' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  )}
                  title="Tablet View (768px)"
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDevice('mobile')}
                  className={cn(
                    'p-1.5 rounded-md transition-all',
                    device === 'mobile' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  )}
                  title="Mobile View (390px)"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* External link to live page if published */}
            {job.status === 'published' && job.slug && (
              <a
                href={publicPostUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-md transition font-medium"
              >
                <span>Live Page</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Modal Body Container with robust scroll constraints */}
        <div className="flex-1 min-h-0 h-full overflow-y-auto overscroll-contain p-4 sm:p-6 bg-slate-100">
          <div className="flex justify-center w-full pb-16">
            {activeTab === 'seo' ? (
            /* Google Search Snippet Preview */
            <div className="w-full max-w-3xl space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-600" />
                  Google Search Result Preview (Desktop)
                </h3>
                <p className="text-xs text-slate-500 mb-5">
                  How this job post appears when users search on Google
                </p>

                {/* Google Snippet Card */}
                <div className="p-4 rounded-lg border border-slate-200 bg-white hover:shadow-md transition max-w-2xl font-sans">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                      JA
                    </div>
                    <div className="text-xs text-slate-700">
                      <span className="font-medium text-slate-900">Job Alert Portal</span>
                      <span className="text-slate-400 mx-1.5">•</span>
                      <span className="text-slate-500">{publicPostUrl}</span>
                    </div>
                  </div>
                  <h4 className="text-lg text-blue-800 hover:underline cursor-pointer font-medium leading-snug mb-1">
                    {job.metaTitle || job.title || 'Page Title'}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {job.metaDescription ||
                      job.description ||
                      'Official recruitment details, eligibility criteria, application dates and direct links.'}
                  </p>
                </div>

                {/* Meta details analysis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-100 text-xs">
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Meta Title Length:</span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded font-mono',
                        (job.metaTitle || job.title || '').length > 65
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      )}
                    >
                      {(job.metaTitle || job.title || '').length} / 60 characters
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Meta Description Length:</span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded font-mono',
                        (job.metaDescription || '').length > 160
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      )}
                    >
                      {(job.metaDescription || '').length} / 160 characters
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags Cloud Preview */}
              {job.tags && job.tags.length > 0 && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Search Keywords & Tags ({job.tags.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-100 text-slate-700 border border-slate-200 text-xs px-2.5 py-1 rounded-md"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Page Layout Preview */
            <div
              className={cn(
                'transition-all duration-300 bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col',
                device === 'desktop' && 'w-full max-w-4xl',
                device === 'tablet' && 'w-[768px]',
                device === 'mobile' && 'w-[390px]'
              )}
            >
              {/* Device framing indicator on mobile/tablet */}
              {device !== 'desktop' && (
                <div className="bg-slate-800 text-slate-300 text-[11px] py-1 text-center font-medium tracking-wide">
                  {device === 'tablet' ? 'Tablet View (768px)' : 'Mobile Phone View (390px)'}
                </div>
              )}

              {/* Post Container */}
              <div className="p-5 sm:p-8 space-y-6">
                {/* Header Card */}
                <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-blue-50/60 to-white p-6 sm:p-7 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-blue-700">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{job.organization || 'Hiring Authority'}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {job.location || 'All India'}
                        </span>
                      </div>
                      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                        {job.title || 'Untitled Notification'}
                      </h1>
                    </div>

                    {job.applyLink && (
                      <a
                        href={job.applyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition shadow-sm whitespace-nowrap self-start"
                      >
                        {getActionLabel(job.type, job.title)}
                        <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                      </a>
                    )}
                  </div>

                  {job.updateNote && (
                    <div className="mt-4 p-3 rounded-lg border border-amber-200 bg-amber-50/80 text-amber-900 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Update:</strong> {job.updateNote}
                      </span>
                    </div>
                  )}

                  {/* Last Date banner */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50/80 rounded-lg border border-blue-100 text-xs">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-slate-700">{getDateLabel(job.type, job.title)}:</span>
                      <span
                        className={cn(
                          'font-semibold',
                          isExpired ? 'text-rose-600' : 'text-blue-800'
                        )}
                      >
                        {formattedLastDate || 'Refer to notification'}
                        {isExpired ? ' (Expired)' : ''}
                      </span>
                    </div>
                    <span className="text-slate-400">Post Type: <strong className="capitalize text-slate-600">{job.type || 'job'}</strong></span>
                  </div>
                </div>

                {/* 3-Column Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-200 rounded-xl bg-white p-4 shadow-sm">
                  {/* Job Details */}
                  <div className="space-y-2.5 md:border-r border-slate-100 md:pr-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                      Overview
                    </h3>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Vacancy:</span>
                        <span className="font-semibold text-slate-900">{job.totalVacancy || 'Various'}</span>
                      </div>
                      {job.ageLimit && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Age Limit:</span>
                          <span className="font-semibold text-slate-900 truncate max-w-[150px]">{job.ageLimit}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-500">Qualification:</span>
                        <span className="font-semibold text-slate-900">{job.qualification || 'OTHER'}</span>
                      </div>
                      {job.salary && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Salary:</span>
                          <span className="font-semibold text-emerald-600">{job.salary}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Important Dates */}
                  <div className="space-y-2.5 md:border-r border-slate-100 md:pr-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <Calendar className="w-3.5 h-3.5 text-orange-500" />
                      Important Dates
                    </h3>
                    <div className="space-y-1.5 text-xs">
                      {job.importantDates && job.importantDates.length > 0 ? (
                        job.importantDates.slice(0, 5).map((d, i) => (
                          <div key={i} className="flex justify-between">
                            <span className="text-slate-500 truncate mr-2">{d.label}:</span>
                            <span className="font-semibold text-slate-900 shrink-0">{formatDate(d.date)}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">No dates configured</span>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <Search className="w-3.5 h-3.5 text-purple-600" />
                      Categories
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {job.tags && job.tags.length > 0 ? (
                        job.tags.slice(0, 8).map((t, i) => (
                          <span
                            key={i}
                            className="bg-slate-50 border border-slate-200 text-slate-600 text-[11px] px-2 py-0.5 rounded"
                          >
                            {t}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic text-xs">No tags set</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Structured Section Builder Blocks */}
                {Array.isArray(job.sections) && job.sections.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Structured Content Blocks ({job.sections.length})
                      </span>
                    </div>

                    <div className="space-y-5">
                      {job.sections.map((sec: any, idx: number) => {
                        const style = resolveBlockStyles(sec.styles);
                        const customClass = sec.styles?.className || '';

                        switch (sec.type) {
                          case 'heading': {
                            const H = sec.level === 3 ? 'h3' : sec.level === 4 ? 'h4' : 'h2';
                            const sizeClass =
                              sec.level === 3 ? 'text-lg' : sec.level === 4 ? 'text-base' : 'text-xl';
                            return (
                              <H
                                key={idx}
                                style={style}
                                className={cn('font-bold text-slate-900 mt-4 mb-2', sizeClass, customClass)}
                              >
                                {renderInlineText(sec.text)}
                              </H>
                            );
                          }

                          case 'paragraph':
                            return (
                              <p
                                key={idx}
                                style={style}
                                className={cn('text-sm text-slate-700 leading-relaxed mb-3 whitespace-pre-line', customClass)}
                              >
                                {renderInlineText(sec.text)}
                              </p>
                            );

                          case 'callout': {
                            const toneClasses = {
                              info: 'bg-blue-50 border-blue-200 text-blue-900',
                              warning: 'bg-amber-50 border-amber-200 text-amber-900',
                              success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
                            };
                            return (
                              <div
                                key={idx}
                                style={style}
                                className={cn(
                                  'border rounded-lg p-4 text-sm my-3',
                                  toneClasses[(sec.tone as keyof typeof toneClasses) || 'info'],
                                  customClass
                                )}
                              >
                                {renderInlineText(sec.text)}
                              </div>
                            );
                          }

                          case 'table':
                            return (
                              <div key={idx} style={style} className={cn('my-4 overflow-hidden rounded-lg border border-slate-200 shadow-sm', customClass)}>
                                {sec.title && (
                                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-semibold text-xs text-slate-800 uppercase tracking-wide">
                                    {sec.title}
                                  </div>
                                )}
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs text-left border-collapse">
                                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                      <tr>
                                        {sec.headers?.map((h: string, hi: number) => (
                                          <th key={hi} className="p-3 border-r border-slate-200 last:border-r-0">
                                            {renderInlineText(h)}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 bg-white">
                                      {sec.rows?.map((row: string[], ri: number) => (
                                        <tr key={ri} className="hover:bg-slate-50/80 transition">
                                          {row.map((cell: string, ci: number) => (
                                            <td key={ci} className="p-3 border-r border-slate-100 last:border-r-0 text-slate-700">
                                              {renderInlineText(cell)}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );

                          case 'steps':
                            return (
                              <div key={idx} style={style} className={cn('my-4 p-4 rounded-xl border border-slate-200 bg-slate-50/70', customClass)}>
                                {sec.title && (
                                  <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    {sec.title}
                                  </h4>
                                )}
                                <ol className="space-y-2.5 text-xs text-slate-700 pl-1">
                                  {sec.items?.map((it: string, ii: number) => (
                                    <li key={ii} className="flex items-start gap-2.5">
                                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                        {ii + 1}
                                      </span>
                                      <span className="leading-relaxed">{renderInlineText(it)}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            );

                          case 'keyvalue':
                            return (
                              <div key={idx} style={style} className={cn('my-4 p-4 rounded-xl border border-slate-200 bg-slate-50/60', customClass)}>
                                {sec.title && (
                                  <h4 className="font-bold text-sm text-slate-900 mb-3">{sec.title}</h4>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                  {sec.items?.map((it: any, ki: number) => (
                                    <div key={ki} className="flex justify-between p-2 rounded bg-white border border-slate-200/80">
                                      <span className="text-slate-500 font-medium">{it.label}:</span>
                                      <span className="font-semibold text-slate-900 text-right ml-2">{renderInlineText(it.value)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );

                          case 'links':
                            return (
                              <div key={idx} style={style} className={cn('my-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50/60', customClass)}>
                                {sec.title && (
                                  <h4 className="font-bold text-sm text-emerald-950 mb-3 flex items-center gap-2">
                                    <ExternalLink className="w-4 h-4 text-emerald-700" />
                                    {sec.title}
                                  </h4>
                                )}
                                <div className="space-y-2">
                                  {sec.items?.map((it: any, li: number) => (
                                    <div
                                      key={li}
                                      className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-emerald-200 hover:border-emerald-400 transition shadow-sm"
                                    >
                                      <span className="font-medium text-xs text-slate-800">{it.label}</span>
                                      <a
                                        href={it.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1 rounded transition flex items-center gap-1"
                                      >
                                        Click Here
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );

                          case 'faq':
                            return (
                              <div key={idx} style={style} className={cn('my-4 space-y-2', customClass)}>
                                {sec.title && (
                                  <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4 text-indigo-600" />
                                    {sec.title}
                                  </h4>
                                )}
                                {sec.items?.map((it: any, fi: number) => {
                                  const isOpen = openFaqIndex === fi;
                                  return (
                                    <div
                                      key={fi}
                                      className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm"
                                    >
                                      <button
                                        type="button"
                                        onClick={() => setOpenFaqIndex(isOpen ? null : fi)}
                                        className="w-full text-left p-3.5 flex justify-between items-center text-xs font-semibold text-slate-800 hover:bg-slate-50 transition"
                                      >
                                        <span>{it.question}</span>
                                        <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
                                      </button>
                                      {isOpen && (
                                        <div className="p-3.5 pt-0 text-xs text-slate-600 border-t border-slate-100 bg-slate-50/50 leading-relaxed">
                                          {renderInlineText(it.answer)}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );

                          case 'list': {
                            const L = sec.ordered ? 'ol' : 'ul';
                            return (
                              <div key={idx} style={style} className={cn('my-3 text-xs text-slate-700', customClass)}>
                                {sec.title && <h4 className="font-bold text-sm text-slate-900 mb-2">{sec.title}</h4>}
                                <L className={cn('space-y-1 pl-5', sec.ordered ? 'list-decimal' : 'list-disc')}>
                                  {sec.items?.map((it: string, li: number) => (
                                    <li key={li}>{renderInlineText(it)}</li>
                                  ))}
                                </L>
                              </div>
                            );
                          }

                          default:
                            return null;
                        }
                      })}
                    </div>
                  </div>
                )}

                {/* Free-form HTML Content if any */}
                {job.htmlContent && (
                  <div className="pt-4 border-t border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      HTML Content
                    </h4>
                    {/* sandbox="" = no scripts, no same-origin access: the admin token in localStorage stays out of reach */}
                    <iframe
                      title="HTML content preview"
                      sandbox=""
                      referrerPolicy="no-referrer"
                      srcDoc={`<base target="_blank"><style>body{font:13px/1.5 system-ui,sans-serif;color:#334155;margin:0}table{border-collapse:collapse;width:100%}td,th{border:1px solid #cbd5e1;padding:6px}img{max-width:100%}</style>${job.htmlContent}`}
                      className="w-full min-h-[320px] rounded border border-slate-200 bg-white"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

