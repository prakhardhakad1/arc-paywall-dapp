import { useEffect, useRef } from 'react';

/**
 * Focus trap for modal dialogs. On mount: moves focus into the dialog and
 * keeps Tab/Shift+Tab cycling among its focusable elements. On unmount:
 * restores focus to whatever had it before the dialog opened.
 * The dialog element gets tabIndex={-1} so it is a valid initial target.
 */
export default function useFocusTrap() {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const previouslyFocused = document.activeElement;

    // Move focus into the dialog (to the first focusable element, else the dialog itself).
    const focusables = getFocusable(node);
    (focusables[0] || node).focus({ preventScroll: true });

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const els = getFocusable(node);
      if (els.length === 0) {
        e.preventDefault();
        return;
      }
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, []);

  return ref;
}

function getFocusable(root) {
  return Array.from(
    root.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => el.offsetParent !== null);
}
