import React from 'react';
import { Link } from 'react-router-dom';

type StubPageProps = {
  title: string;
  description?: string;
  relatedTo?: { label: string; href: string };
};

const StubPage: React.FC<StubPageProps> = ({ title, description, relatedTo }) => (
  <div className="max-w-lg mx-auto rounded-2xl border border-white/10 bg-admin-surface/60 p-8 text-center glass-panel">
    <h1 className="text-xl font-semibold text-white mb-2">{title}</h1>
    <p className="text-sm text-zinc-400 mb-6">
      {description ?? 'This area is on the roadmap. Use related tools below in the meantime.'}
    </p>
    {relatedTo ? (
      <Link
        to={relatedTo.href}
        className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
      >
        {relatedTo.label}
      </Link>
    ) : (
      <Link to="/" className="text-violet-400 text-sm hover:underline">
        Back to dashboard
      </Link>
    )}
  </div>
);

export default StubPage;
