// FILE: frontend/modules/ethikos/decide/public/page.tsx
'use client';

// The historical /api/home/* implementation duplicated a now-forbidden API
// surface. Keep this compatibility module, but delegate to the canonical
// ethiKos page, which uses services/decide -> /api/ethikos/*.
export { default } from '@/app/ethikos/decide/public/page';
