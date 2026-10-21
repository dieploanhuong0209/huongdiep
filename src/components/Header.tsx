import React from 'react';
import { ProfileData } from '../types/portfolio';

interface HeaderProps {
  profile: ProfileData;
}

export const Header: React.FC<HeaderProps> = ({ profile }) => {
  return (
    <header className="pt-12 sm:pt-16 pb-8 border-b border-stone-200/80">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        {/* Name and Title */}
        <div>
          <h1 className="font-editorial-serif italic text-4xl sm:text-5xl font-normal text-stone-900 tracking-tight leading-none select-none">
            {profile.name || 'Hương Diệp'}
          </h1>
          <p className="font-editorial-mono text-xs tracking-[0.28em] text-stone-700 uppercase font-medium mt-2">
            {profile.title || 'WRITER'}
          </p>
        </div>

        {/* Contact links: Email / Facebook */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-editorial-mono text-xs sm:text-[13px] text-stone-700">
          {profile.email && (
            <a
              href={`mailto:${profile.email}`}
              className="hover:text-stone-950 transition-colors"
              title={profile.email}
            >
              Email
            </a>
          )}

          {profile.email && profile.facebook && (
            <span className="text-stone-300 select-none">/</span>
          )}

          {profile.facebook && (
            <a
              href={profile.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-stone-950 transition-colors"
            >
              Facebook
            </a>
          )}

          {profile.customLinks?.map((link, idx) => (
            <React.Fragment key={idx}>
              <span className="text-stone-300 select-none">/</span>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-stone-950 transition-colors"
              >
                {link.label}
              </a>
            </React.Fragment>
          ))}
        </div>
      </div>
    </header>
  );
};
