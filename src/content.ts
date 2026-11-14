/**
 * Sitedeki bütün yazılar burada. Bir şeyi değiştirmek için başka dosyaya
 * bakmana gerek yok: proje ekle, link ekle, cümleyi değiştir, kaydet.
 */

export const me = {
  name: 'Alper Koşay',
  role: 'Fullstack web geliştirici',
  lede: 'React, TypeScript, Postgres. Bir de orkestra halinde çalışan Claude’lar.',
  manifesto: ['Kes.', 'Yapıştır.', 'Deploy et.'],
  year: 2026,
};

/** Hakkımda paragrafları. *yıldız arası* fosforlu kalemle çizilir. */
export const about: string[] = [
  'Selam, ben Alper. *Fullstack web geliştiriciyim.* İşin çoğu React ve TypeScript ile önde, Node ve Postgres ile arkada geçiyor.',
  'İhtiyacım olan aracı bulamazsam oturur kendim yaparım. Bir dosya yöneticisi, ekranın tepesinde duran bir durum barı, tarayıcıda dönen bir FPS böyle çıktı.',
  'Artık kodu tek başıma yazmıyorum. İşi parçalara bölüp *Claude ajanlarına dağıtıyorum,* ben de şeflik yapıyorum.',
];

/** Maskotun ekranında, her paragraftan önce sorulan soru. */
export const aboutAsk: string[] = ['kimsin?', 'boş vaktinde?', 'peki şimdi?'];

/** Gitarın sapından fırlayan promptlar. */
export const prompts: string[] = [
  '> bug’ı bul',
  '> testleri yaz',
  '> bunu refactor et',
  '> 5 ajana böl',
  '> PR aç',
  '> deploy et',
  '> neden kırıldı?',
  '> bir daha dene',
  '> ultra düşün',
  '> planı çıkar',
  '> log’lara bak',
  '> commit at',
];

/** Hakkımda'nın ikinci panelinde maskotun etrafında uçuşan, yaptığım şeyler. */
export const made: string[] = ['dosya yöneticisi', 'durum barı', 'tarayıcıda FPS'];

/** Ekrana vurunca çıkan çıkartmalar. */
export const hits: string[] = ['PAT', 'ÇAT', 'GÜM', 'ZZT', 'DAN'];

/** Kadro sayfasının ön grupları. Sıra önemli: sahneye bu sırayla çıkarlar. */
export const stack: string[] = [
  'React',
  'TypeScript',
  'PostgreSQL',
  'Next.js',
  'Node.js',
  'Prisma',
  'Tailwind',
  'Docker',
  'Rust + Tauri',
];

/** Orkestradaki ajanların üstlendiği işler. */
export const agents: string[] = ['plan', 'arayüz', 'api', 'veritabanı', 'test', 'inceleme'];

export interface Project {
  name: string;
  kind: string;
  text: string;
  stack: string[];
  repo: string;
  live?: string;
  /** Afişin kağıt rengi, mürekkebi ve ikinci rengi. */
  paper: string;
  ink: string;
  spot: string;
  /** İkinci rengin üstündeki yazı. Koyu bir ikinci renk seçersen '#fff' yap. */
  spotInk?: string;
  /** Afiş başlığının yazı tipi. */
  face: string;
}

const gh = (repo: string) => `https://github.com/alperkosay/${repo}`;

export const projects: Project[] = [
  {
    name: 'devbar',
    kind: 'masaüstü uygulaması',
    text: 'Aynı anda çalışan Claude Code oturumlarını ekranın tepesinde gösteren durum barı. Portlar, Docker, git ve telefondan erişim de içinde.',
    stack: ['Tauri 2', 'Rust', 'xterm.js'],
    repo: gh('devbar'),
    live: 'https://alperkosay.github.io/devbar/',
    paper: '#ffe600',
    ink: '#000',
    spot: '#ff2e88',
    face: "'Anton'",
  },
  {
    name: 'theFinder',
    kind: 'npm paketi',
    text: 'React için hızlı, klavyeyle kullanılan bir dosya yöneticisi. npm’de @thefinder/react adıyla duruyor.',
    stack: ['TypeScript', 'React'],
    repo: gh('theFinder'),
    live: 'https://alperkosay.github.io/theFinder/',
    paper: '#f1f1ea',
    ink: '#000',
    spot: '#e10600',
    face: "'Abril Fatface'",
  },
  {
    name: 'theShare',
    kind: 'PWA',
    text: 'Sunucusuz dosya paylaşımı. İki cihazı QR kodla ya da 6 haneli kodla eşleştir, dosya doğrudan karşıya gitsin.',
    stack: ['React', 'WebRTC', 'Workbox'],
    repo: gh('theShare'),
    live: 'https://alperkosay.github.io/theShare/',
    paper: '#00b7eb',
    ink: '#000',
    spot: '#ffe600',
    face: "'Bungee'",
  },
  {
    name: 'Sigara Molası',
    kind: 'oyun',
    text: 'Tarayıcıda çalışan, Doom tadında, piksel piksel bir FPS. Kurulum yok, sekmeyi aç ve oyna.',
    stack: ['Vanilla JS'],
    repo: gh('sigara-molasi'),
    live: 'https://alperkosay.github.io/sigara-molasi/',
    paper: '#e10600',
    ink: '#fff',
    spot: '#ffe600',
    face: "'Alfa Slab One'",
  },
  {
    name: 'Pixel Paws',
    kind: 'tarayıcı oyuncağı',
    text: 'Tarayıcında yaşayan ve imlecini kovalayan piksel kediler.',
    stack: ['Vanilla JS'],
    repo: gh('pixel-paws'),
    paper: '#ff2e88',
    ink: '#000',
    spot: '#fff',
    face: "'Bangers'",
  },
  {
    name: 'flipzy',
    kind: 'React bileşeni',
    text: 'Gerçek bir dergi gibi sayfa çeviren flipbook bileşeni. React ve Next.js ile çalışır.',
    stack: ['TypeScript', 'React'],
    repo: gh('flipzy'),
    paper: '#fff',
    ink: '#000',
    spot: '#1f3bff',
    spotInk: '#fff',
    face: "'Shrikhand'",
  },
  {
    name: 'elfinder-next',
    kind: 'npm paketi',
    text: 'elFinder bağlantı protokolünü Next.js App Router’a taşıyan paket.',
    stack: ['TypeScript', 'Next.js'],
    repo: gh('elfinder-next'),
    paper: '#7dffc8',
    ink: '#000',
    spot: '#2b1055',
    spotInk: '#fff',
    face: "'Archivo Black'",
  },
];

export interface LinkItem {
  label: string;
  handle: string;
  href: string;
}

/** Arka kapaktaki koparmalık fişler. Yeni bir link eklemek için buraya bir satır yaz. */
export const links: LinkItem[] = [
  { label: 'GitHub', handle: 'alperkosay', href: 'https://github.com/alperkosay' },
  { label: 'LinkedIn', handle: 'alper-koşay', href: 'https://www.linkedin.com/in/alper-ko%C5%9Fay' },
  { label: 'npm', handle: '~alperkosay', href: 'https://www.npmjs.com/~alperkosay' },
];

export const sections = [
  { id: 'kapak', label: 'kapak' },
  { id: 'hakkimda', label: 'ben' },
  { id: 'kadro', label: 'kadro' },
  { id: 'projeler', label: 'işler' },
  { id: 'linkler', label: 'çıkış' },
] as const;
