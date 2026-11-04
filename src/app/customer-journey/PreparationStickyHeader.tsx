import React, { useEffect, useRef, type ReactNode } from 'react';

export function PreparationStickyHeader({ children }: { children: ReactNode }) {
  const headerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const header = headerRef.current;
    const container = header?.parentElement;
    if (!header || !container) return;
    const measure = () => container.style.setProperty('--prep-sticky-height', `${header.getBoundingClientRect().height}px`);
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => { window.removeEventListener('resize', measure); container.style.removeProperty('--prep-sticky-height'); };
    }
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => { observer.disconnect(); container.style.removeProperty('--prep-sticky-height'); };
  }, []);
  return <div ref={headerRef} className="sticky top-0 z-20 bg-customer-page">{children}</div>;
}
