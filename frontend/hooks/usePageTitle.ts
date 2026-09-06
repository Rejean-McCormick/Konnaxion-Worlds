// FILE: frontend/hooks/usePageTitle.ts
'use client'

// hooks/usePageTitle.ts
import { useEffect } from 'react';

/**
 * Sets <title> in the browser tab whenever `title` changes.
 * Optionally you can extend this to push breadcrumbs into
 * Ant Design ProLayout via context, but for now we just set
 * the document title.
 */
export default function usePageTitle(title: string) {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = title;
    }
  }, [title]);
}
