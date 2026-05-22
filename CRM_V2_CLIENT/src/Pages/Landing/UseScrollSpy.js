import { useState, useEffect } from 'react';

function useScrollSpy(sectionIds, offset = 0) {
  const [activeId, setActiveId] = useState(sectionIds[0] || '');

  useEffect(() => {
    function onScroll() {
      const scrollPosition = window.scrollY + offset + 1;

      let current = sectionIds[0];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) current = id;
        }
      }
      setActiveId(current);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, [sectionIds, offset]);

  return activeId;
}

export default useScrollSpy;
