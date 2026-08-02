import { useEffect } from 'react';

const SUFFIX = 'Thiệp Việt';

/** Keeps the tab title in sync with `handle.title` of the active route. */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    document.title = title ? `${title} · ${SUFFIX}` : SUFFIX;
  }, [title]);
}
