import React, {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import gsap from "gsap";

export const Card = forwardRef(
  ({ customClass, ...rest }, ref) => (
    <div
      ref={ref}
      {...rest}
      className={`absolute top-1/2 left-1/2 rounded-xl border border-white bg-black [transform-style:preserve-3d] [will-change:transform] [backface-visibility:hidden] ${customClass ?? ""} ${rest.className ?? ""}`.trim()}
    />
  )
);
Card.displayName = "Card";

const makeSlot = (
  i,
  distX,
  distY,
  total
) => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i,
});

const CardSwap = ({
  cardDistance,
  verticalDistance,
  delay = 3000, 
  pauseOnHover = false,
  onCardClick,
  skewAmount = 6,
  easing = "elastic",
  children,
}) => {
  const config = useMemo(() => {
    return easing === "elastic"
      ? {
          ease: "elastic.out(0.6,0.9)",
          duration: 0.8,
          promoteOverlap: 0.9,
        }
      : {
          ease: "power1.inOut",
          duration: 0.4,
          promoteOverlap: 0.45,
        };
  }, [easing]);

  const childArr = useMemo(() => Children.toArray(children), [children]);
  const refs = useMemo(
    () => childArr.map(() => React.createRef()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [childArr.length]
  );

  const order = useRef(
    Array.from({ length: childArr.length }, (_, i) => i)
  );

  const tlRef = useRef(null);
  const intervalRef = useRef();
  const container = useRef(null);

  const placeNow = useCallback((el, slot) => {
    gsap.set(el, {
      x: slot.x,
      y: slot.y,
      z: slot.z,
      xPercent: -50,
      yPercent: -50,
      skewY: skewAmount,
      transformOrigin: "center center",
      zIndex: slot.zIndex,
      force3D: true,
    });
  }, [skewAmount]);

  const swap = useCallback(() => {
    if (order.current.length < 2) return;

    const [front, ...rest] = order.current;
    const elFront = refs[front].current;
    const total = refs.length;

    const newOrder = [...rest, front];
    
    // Clear the existing timeline if it exists
    if (tlRef.current) {
        tlRef.current.kill();
    }
    
    const tl = gsap.timeline();
    tlRef.current = tl;

    // Animate the front card dropping down and returning to the back
    tl.to(elFront, {
      y: "+=500",
      duration: config.duration,
      ease: config.ease,
      onComplete: () => {
        const backSlot = makeSlot(total - 1, cardDistance, verticalDistance, total);
        placeNow(elFront, backSlot);
        order.current = newOrder;
      },
    });

    // Animate the rest of the cards moving forward in the stack
    rest.forEach((idx, i) => {
      const el = refs[idx].current;
      const slot = makeSlot(i, cardDistance, verticalDistance, total);
      tl.to(
        el,
        {
          x: slot.x,
          y: slot.y,
          z: slot.z,
          zIndex: slot.zIndex,
          duration: config.duration,
          ease: config.ease,
        },
        `<+=${config.duration * config.promoteOverlap / total}`
      );
    });

  }, [cardDistance, verticalDistance, refs, config, placeNow]);

  useEffect(() => {
    const total = refs.length;
    refs.forEach((r, i) =>
      placeNow(r.current, makeSlot(i, cardDistance, verticalDistance, total))
    );

    // Initial swap call and interval setup
    intervalRef.current = window.setInterval(swap, delay);

    // Handle pause on hover
    if (pauseOnHover) {
        const node = container.current;
        const pause = () => {
          gsap.killTweensOf(tlRef.current);
          clearInterval(intervalRef.current);
        };
        const resume = () => {
          swap(); // Resume from the current state
          intervalRef.current = window.setInterval(swap, delay);
        };
        node.addEventListener("mouseenter", pause);
        node.addEventListener("mouseleave", resume);
        return () => {
          node.removeEventListener("mouseenter", pause);
          node.removeEventListener("mouseleave", resume);
          clearInterval(intervalRef.current);
          if (tlRef.current) {
              tlRef.current.kill();
          }
        };
    }
    
    return () => {
      clearInterval(intervalRef.current);
      if (tlRef.current) {
          tlRef.current.kill();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, easing, refs]);

  const rendered = childArr.map((child, i) =>
    isValidElement(child)
      ? cloneElement(child, {
          key: i,
          ref: refs[i],
          style: { ...(child.props.style ?? {}) },
          onClick: (e) => {
            child.props.onClick?.(e);
            onCardClick?.(i);
          },
        }) : child
  );

  return (
    <div
      ref={container}
      className="absolute bottom-0 right-0 w-full h-full transform translate-x-[5%] translate-y-[20%] origin-bottom-right perspective-[900px] overflow-visible max-[768px]:translate-x-[25%] max-[768px]:translate-y-[25%] max-[768px]:scale-[0.75] max-[480px]:translate-x-[25%] max-[480px]:translate-y-[25%] max-[480px]:scale-[0.55]"
    >
      {rendered}
    </div>
  );
};

export default CardSwap;