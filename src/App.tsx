import { Band, Grain, SvgDefs } from './components/Bits';
import { me } from './content';
import { Nav } from './components/Nav';
import { About } from './sections/About';
import { BackCover } from './sections/BackCover';
import { Cover } from './sections/Cover';
import { Lineup } from './sections/Lineup';
import { Projects } from './sections/Projects';

const BAND = me.manifesto.map((w) => w.replace('.', ''));

export function App() {
  return (
    <>
      <SvgDefs />
      <Nav />
      <main>
        <Cover />
        <About />
        <Band words={BAND} />
        <Lineup />
        <Projects />
      </main>
      <Band words={BAND} />
      <BackCover />
      <Grain />
    </>
  );
}
