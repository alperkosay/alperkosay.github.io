import { createElement, useEffect, useRef, type HTMLAttributes, type JSX } from 'react';
import { projector, type SelfMode } from './projector';

type StepProps = {
  as?: keyof JSX.IntrinsicElements;
  /** Kaç karede bir poz değiştirir. 3 = "on 3s" = saniyede 8 poz. 0 = akıcı. */
  on?: number;
  /** Kare cinsinden gecikme. Yelek gövdeden 1-2 kare geç gelir. */
  offset?: number;
  /** Sahne yerine kendi konumunu izler. */
  self?: SelfMode;
} & HTMLAttributes<HTMLElement>;

/** `--p` değişkenini kendi kare hızında güncellenen bir katman. */
export function Step({ as = 'div', on = 3, offset = 0, self, ...rest }: StepProps) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    return projector.addLayer(ref.current, { on, offset, self });
  }, [on, offset, self]);
  return createElement(as as string, { ref, ...rest });
}
