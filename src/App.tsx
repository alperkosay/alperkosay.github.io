import { Grain, SvgDefs } from './components/Bits';
import { useEffect } from 'react';
import { FilmStrip, Gate, PasteLayer } from './components/Film';
import { startBand } from './engine/band';
import { About } from './sections/About';
import { BackCover } from './sections/BackCover';
import { Cover } from './sections/Cover';
import { Lineup } from './sections/Lineup';
import { Projects } from './sections/Projects';

/**
 * Site bir film: beş çekim, aralarında kesme. Altta film şeridi (menü),
 * üstte fotokopi greni ve klavyeden basılan harflerin yapıştığı katman.
 */
export function App() {
  useEffect(() => startBand(), []);

  return (
    <>
      <SvgDefs />
      <main className="film">
        <Cover />
        <About />
        <Lineup />
        <Projects />
        <BackCover />
      </main>
      <PasteLayer />
      <Grain />
      <FilmStrip />
      <Gate />
    </>
  );
}
