// pages/analysis/_shared.jsx
// Reusable UI primitives for Analysis module
// Aesthetic: Clean Functional (Lucide/Shadcn Style)

import React from 'react';

export const sharedCss = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .page-root {
    font-family: 'Inter', -apple-system, sans-serif;
    background: #ffffff;
    min-height: 100vh;
    color: #0f172a; /* Slate 900 */
    padding: 40px;
  }

  .page-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid #f1f5f9; /* Slate 100 */
    flex-wrap: wrap;
    gap: 16px;
  }

  .page-title { 
    font-size: 32px; 
    font-weight: 700; 
    letter-spacing: -0.025em; 
    color: #0f172a;
  }

  .page-sub {
    font-size: 14px;
    color: #64748b; /* Slate 500 */
    margin-top: 4px;
    font-weight: 400;
  }

  /* Buttons - Clean & Rounded */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 6px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    white-space: nowrap;
    border: 1px solid transparent;
  }

  .btn-primary {
    background: #10b981; /* Emerald 500 */
    color: #ffffff;
  }
  .btn-primary:hover { background: #059669; }

  .btn-ghost {
    background: #ffffff;
    color: #64748b;
    border: 1px solid #e2e8f0; /* Slate 200 */
  }
  .btn-ghost:hover { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }

  .btn-danger {
    background: #ffffff;
    color: #ef4444;
    border: 1px solid #fee2e2;
  }
  .btn-danger:hover { background: #fef2f2; border-color: #fca5a5; }

  .btn-sm { padding: 4px 12px; font-size: 13px; }

  /* Toolbar */
  .toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
  }

  .search-input {
    flex: 1;
    max-width: 320px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px 12px 8px 36px;
    font-size: 14px;
    outline: none;
    transition: all 0.2s;
  }
  .search-input:focus { 
    border-color: #10b981; 
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1); 
  }

  /* Table - Minimalist */
  .table-wrap {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
  }
  .data-table { width: 100%; border-collapse: collapse; }
  .data-table thead th {
    background: #f8fafc;
    padding: 12px 16px;
    text-align: left;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #e2e8f0;
  }
  .data-table td {
    padding: 16px;
    font-size: 14px;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
  }
  .data-table tr:last-child td { border-bottom: none; }
  .data-table tr:hover td { background: #f8fafc; }

  .mono { font-family: 'JetBrains Mono', monospace; font-size: 13px; }

  /* Badges - Subtle Soft Colors */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }
  .badge-pending   { background: #fef3c7; color: #d97706; } /* Amber */
  .badge-submitted { background: #e0f2fe; color: #0284c7; } /* Sky */
  .badge-approved  { background: #d1fae5; color: #059669; } /* Emerald */
  .badge-rejected  { background: #fee2e2; color: #dc2626; } /* Red */
  .badge-active    { background: #d1fae5; color: #059669; }
  .badge-pass      { background: #d1fae5; color: #059669; border: 1px solid rgba(5,150,105,0.2); }
  .badge-fail      { background: #fee2e2; color: #dc2626; border: 1px solid rgba(220,38,38,0.2); }

  /* Forms */
  .form-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 32px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }
  .form-label {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    margin-bottom: 6px;
    display: block;
  }
  .form-input {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 12px;
    font-size: 14px;
    width: 100%;
    transition: all 0.2s;
  }
  .form-input:focus { border-color: #10b981; outline: none; }

  /* Skeleton */
  .skeleton {
    background: #f1f5f9;
    position: relative;
    overflow: hidden;
    border-radius: 4px;
  }
  .skeleton::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
    animation: shimmer 1.5s infinite;
  }
  @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
`;

export function StatusBadge({ status }) {
  const map = {
    pending:   'badge-pending',
    submitted: 'badge-submitted',
    approved:  'badge-approved',
    rejected:  'badge-rejected',
    active:    'badge-active',
    pass:      'badge-pass',
    fail:      'badge-fail',
  };

  const labels = {
    pending: 'Menunggu',
    submitted: 'Disubmit',
    approved: 'Selesai',
    rejected: 'Ditolak',
    active: 'Aktif',
    pass: 'Lulus',
    fail: 'Gagal',
  };

  return (
    <span className={`badge ${map[status] || 'badge-pending'}`}>
      {labels[status] || status}
    </span>
  );
}

export function SkeletonLoader({ rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 4 }).map((_, j) => (
            <td key={j}>
              <div className="skeleton" style={{ height: '16px', width: `${40 + Math.random() * 40}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function Skeleton({ className, style, width, height }) {
  return (
    <div 
      className={`skeleton ${className || ''}`} 
      style={{ 
        width: width || '100%', 
        height: height || '20px', 
        ...style 
      }} 
    />
  );
}