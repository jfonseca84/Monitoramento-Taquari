import React, { useCallback, useEffect, useRef, useState } from 'react';

// Barra de rolagem fina e branca, fixa na borda direita da tela (só em telas largas; no celular vale a rolagem nativa).
// Controla a rolagem principal: a coluna central das páginas Início/Histórico (marcada com data-main-scroll)
// ou, nas demais páginas, a rolagem da própria janela.

const MIN_THUMB = 40; // altura mínima do polegar (px)
const HEADER_H = 56; // a barra começa abaixo do cabeçalho

interface Metrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

const getMainScroller = (): HTMLElement | null => {
  // O painel admin abre por cima da página e vem depois dela no documento: vale o último elemento marcado que estiver rolando
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-main-scroll]')).reverse();
  for (const el of els) {
    if (el.offsetParent !== null && getComputedStyle(el).overflowY !== 'visible' && el.scrollHeight > el.clientHeight + 1) return el;
  }
  return null;
};

const readMetrics = (el: HTMLElement | null): Metrics => {
  if (el) return { scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
  const d = document.scrollingElement || document.documentElement;
  return { scrollTop: d.scrollTop, scrollHeight: d.scrollHeight, clientHeight: window.innerHeight };
};

// smooth: rolagem animada (cliques na trilha e roda do mouse); sem animação ao arrastar o polegar
const scrollTarget = (el: HTMLElement | null, top: number, smooth = false) => {
  const behavior: ScrollBehavior = smooth ? 'smooth' : 'auto';
  if (el) el.scrollTo({ top, behavior });
  else window.scrollTo({ top, behavior });
};

export const SiteScrollbar: React.FC = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [m, setM] = useState<Metrics>({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 });
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState(false);
  const drag = useRef<{ startY: number; startScroll: number; scroller: HTMLElement | null } | null>(null);

  const update = useCallback(() => {
    const next = readMetrics(getMainScroller());
    setM((prev) =>
      prev.scrollTop === next.scrollTop && prev.scrollHeight === next.scrollHeight && prev.clientHeight === next.clientHeight ? prev : next
    );
  }, []);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    document.addEventListener('scroll', onScroll, true); // captura a rolagem de qualquer elemento
    window.addEventListener('resize', onScroll);
    const poll = window.setInterval(update, 400); // acompanha mudança de conteúdo/página
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
      window.clearInterval(poll);
    };
  }, [update]);

  const range = m.scrollHeight - m.clientHeight;
  if (range <= 1 || m.clientHeight <= 0) return null;

  const trackHeight = window.innerHeight - HEADER_H;
  const thumbH = Math.min(Math.max((m.clientHeight / m.scrollHeight) * trackHeight, MIN_THUMB), trackHeight);
  const travel = Math.max(trackHeight - thumbH, 1);
  const thumbTop = Math.min(Math.max((m.scrollTop / range) * travel, 0), travel);
  const active = dragging || hover;

  const onThumbDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation(); // não deixa o clique cair na trilha (que rola uma página)
    try {
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    } catch {
      /* sem captura, o arraste continua funcionando enquanto o ponteiro está sobre o polegar */
    }
    const scroller = getMainScroller();
    drag.current = { startY: e.clientY, startScroll: readMetrics(scroller).scrollTop, scroller };
    setDragging(true);
  };
  const onThumbMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    scrollTarget(d.scroller, d.startScroll + ((e.clientY - d.startY) / travel) * range);
  };
  const onThumbUp = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = null;
    setDragging(false);
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* já liberado */
    }
  };
  // Clique na trilha: rola uma "página" (com animação) na direção do clique
  const onTrackDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scroller = getMainScroller();
    const cur = readMetrics(scroller);
    const dir = e.clientY < rect.top + thumbTop ? -1 : 1;
    scrollTarget(scroller, cur.scrollTop + dir * cur.clientHeight * 0.9, true);
  };
  // Roda do mouse / touchpad sobre a barra também rola a página
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const scroller = getMainScroller();
    if (scroller) scroller.scrollTop += e.deltaY;
    else window.scrollBy({ top: e.deltaY });
  };

  return (
    <div
      ref={trackRef}
      onPointerDown={onTrackDown}
      onWheel={onWheel}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      className="hidden lg:block fixed right-0 bottom-0 w-4 z-50"
      style={{ top: HEADER_H }}
      role="scrollbar"
      aria-orientation="vertical"
      aria-label="Rolagem da página"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round((m.scrollTop / range) * 100)}
    >
      {/* Área de agarrar: ocupa a largura toda da trilha (16 px), então é fácil pegar o polegar de 4 px */}
      <div
        onPointerDown={onThumbDown}
        onPointerMove={onThumbMove}
        onPointerUp={onThumbUp}
        onPointerCancel={onThumbUp}
        className={`absolute right-0 w-4 touch-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ top: thumbTop, height: thumbH }}
      >
        <div
          className="absolute right-[3px] top-0 bottom-0 rounded-full bg-white pointer-events-none transition-[width,opacity] duration-150"
          style={{ width: active ? 6 : 4, opacity: active ? 1 : 0.75 }}
        />
      </div>
    </div>
  );
};
