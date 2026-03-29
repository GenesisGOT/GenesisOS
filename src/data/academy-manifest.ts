/**
 * Academy Content Manifest
 * 
 * Complete mapping of all academy phases, topics, lessons, cheatsheets, and music tracks.
 * Generated from the /mnt/data/tmp/academy/ directory structure.
 */

// ── Types ──

export interface AcademyPhase {
  id: string;
  name: string;
  description: string;
  color: string;
  gradient: string;
  icon: string;
  topics: AcademyTopic[];
}

export interface AcademyTopic {
  id: string;
  name: string;
  lessons: AcademyLesson[];
}

export interface AcademyLesson {
  id: string;
  title: string;
  path: string; // relative to academy root
  estimatedMinutes: number;
}

export interface Track {
  title: string;
  path: string; // relative to academy root
  category: MusicCategory;
}

export interface Cheatsheet {
  id: string;
  title: string;
  path: string;
  icon: string;
  color: string;
}

export type MusicCategory = 
  | 'Essentials'
  | 'Conscious'
  | 'Boom Bap'
  | 'Street Poetry'
  | 'West Coast'
  | 'Deep Cuts';

// ── Academy Root Path ──
export const ACADEMY_ROOT = '/mnt/data/tmp/academy';

// ── Phases ──

export const PHASES: AcademyPhase[] = [
  {
    id: 'foundations',
    name: 'Phase 1: Foundations',
    description: 'Python, how computers work, terminal mastery, and Git',
    color: '#39FF14',
    gradient: 'linear-gradient(135deg, #39FF14, #00D4FF)',
    icon: '🌱',
    topics: [
      {
        id: 'python',
        name: 'Python',
        lessons: [
          { id: 'python-00', title: 'Why Python', path: '01-foundations/python/00-why-python.md', estimatedMinutes: 10 },
          { id: 'python-01', title: 'Installation & Setup', path: '01-foundations/python/01-installation-and-setup.md', estimatedMinutes: 15 },
          { id: 'python-02', title: 'Variables & Types', path: '01-foundations/python/02-variables-and-types.md', estimatedMinutes: 25 },
          { id: 'python-03', title: 'Control Flow', path: '01-foundations/python/03-control-flow.md', estimatedMinutes: 30 },
          { id: 'python-04', title: 'Data Structures', path: '01-foundations/python/04-data-structures.md', estimatedMinutes: 35 },
          { id: 'python-05', title: 'Functions', path: '01-foundations/python/05-functions.md', estimatedMinutes: 30 },
          { id: 'python-06', title: 'Strings & I/O', path: '01-foundations/python/06-strings-and-io.md', estimatedMinutes: 25 },
          { id: 'python-07', title: 'OOP Basics', path: '01-foundations/python/07-oop-basics.md', estimatedMinutes: 35 },
          { id: 'python-08', title: 'Error Handling', path: '01-foundations/python/08-error-handling.md', estimatedMinutes: 20 },
          { id: 'python-09', title: 'Modules & Packages', path: '01-foundations/python/09-modules-and-packages.md', estimatedMinutes: 20 },
          { id: 'python-challenges', title: '50 Python Challenges', path: '01-foundations/python/exercises/50_python_challenges.md', estimatedMinutes: 120 },
        ],
      },
      {
        id: 'how-computers-work',
        name: 'How Computers Work',
        lessons: [
          { id: 'hcw-01', title: 'Binary & Data', path: '01-foundations/how-computers-work/01-binary-and-data.md', estimatedMinutes: 30 },
          { id: 'hcw-02', title: 'Hardware', path: '01-foundations/how-computers-work/02-hardware.md', estimatedMinutes: 25 },
          { id: 'hcw-03', title: 'Operating Systems', path: '01-foundations/how-computers-work/03-operating-systems.md', estimatedMinutes: 25 },
        ],
      },
      {
        id: 'terminal',
        name: 'Terminal',
        lessons: [
          { id: 'terminal-01', title: 'Terminal Mastery', path: '01-foundations/terminal/terminal-mastery.md', estimatedMinutes: 45 },
        ],
      },
      {
        id: 'git',
        name: 'Git',
        lessons: [
          { id: 'git-01', title: 'Git Mastery', path: '01-foundations/git/git-mastery.md', estimatedMinutes: 45 },
        ],
      },
    ],
  },
  {
    id: 'cs-core',
    name: 'Phase 2: CS Core',
    description: 'Data structures, algorithms, discrete math, and computer architecture',
    color: '#A855F7',
    gradient: 'linear-gradient(135deg, #A855F7, #EC4899)',
    icon: '🧠',
    topics: [
      {
        id: 'data-structures',
        name: 'Data Structures',
        lessons: [
          { id: 'ds-01', title: 'Arrays & Lists', path: '02-cs-core/data-structures/01-arrays-and-lists.md', estimatedMinutes: 30 },
          { id: 'ds-02', title: 'Linked Lists', path: '02-cs-core/data-structures/02-linked-lists.md', estimatedMinutes: 35 },
          { id: 'ds-03', title: 'Stacks & Queues', path: '02-cs-core/data-structures/03-stacks-and-queues.md', estimatedMinutes: 25 },
          { id: 'ds-04', title: 'Hash Tables', path: '02-cs-core/data-structures/04-hash-tables.md', estimatedMinutes: 30 },
          { id: 'ds-05', title: 'Trees', path: '02-cs-core/data-structures/05-trees.md', estimatedMinutes: 40 },
          { id: 'ds-06', title: 'Heaps', path: '02-cs-core/data-structures/06-heaps.md', estimatedMinutes: 25 },
          { id: 'ds-07', title: 'Graphs', path: '02-cs-core/data-structures/07-graphs.md', estimatedMinutes: 35 },
          { id: 'ds-08', title: 'Advanced Structures', path: '02-cs-core/data-structures/08-advanced.md', estimatedMinutes: 40 },
        ],
      },
      {
        id: 'algorithms',
        name: 'Algorithms',
        lessons: [
          { id: 'algo-01', title: 'Big O Notation', path: '02-cs-core/algorithms/01-big-o-notation.md', estimatedMinutes: 25 },
          { id: 'algo-02', title: 'Sorting', path: '02-cs-core/algorithms/02-sorting.md', estimatedMinutes: 35 },
          { id: 'algo-03', title: 'Searching', path: '02-cs-core/algorithms/03-searching.md', estimatedMinutes: 25 },
          { id: 'algo-04', title: 'Recursion & Backtracking', path: '02-cs-core/algorithms/04-recursion-and-backtracking.md', estimatedMinutes: 40 },
          { id: 'algo-05', title: 'Dynamic Programming', path: '02-cs-core/algorithms/05-dynamic-programming.md', estimatedMinutes: 45 },
          { id: 'algo-06', title: 'Greedy Algorithms', path: '02-cs-core/algorithms/06-greedy-algorithms.md', estimatedMinutes: 30 },
          { id: 'algo-07', title: 'Graph Algorithms', path: '02-cs-core/algorithms/07-graph-algorithms.md', estimatedMinutes: 40 },
        ],
      },
      {
        id: 'discrete-math',
        name: 'Discrete Math',
        lessons: [
          { id: 'dm-01', title: 'Discrete Math Complete', path: '02-cs-core/discrete-math/discrete-math-complete.md', estimatedMinutes: 60 },
        ],
      },
      {
        id: 'computer-architecture',
        name: 'Computer Architecture',
        lessons: [
          { id: 'ca-01', title: 'Computer Architecture', path: '02-cs-core/computer-architecture/computer-architecture.md', estimatedMinutes: 50 },
        ],
      },
    ],
  },
  {
    id: 'systems',
    name: 'Phase 3: Systems',
    description: 'C programming, operating systems, networking, and Rust',
    color: '#F97316',
    gradient: 'linear-gradient(135deg, #F97316, #EF4444)',
    icon: '⚙️',
    topics: [
      {
        id: 'c-programming',
        name: 'C Programming',
        lessons: [
          { id: 'c-01', title: 'Getting Started', path: '03-systems/c-programming/01-getting-started.md', estimatedMinutes: 25 },
          { id: 'c-02', title: 'Types & Operators', path: '03-systems/c-programming/02-types-and-operators.md', estimatedMinutes: 30 },
          { id: 'c-03', title: 'Control Flow', path: '03-systems/c-programming/03-control-flow.md', estimatedMinutes: 25 },
          { id: 'c-04', title: 'Functions', path: '03-systems/c-programming/04-functions.md', estimatedMinutes: 25 },
          { id: 'c-05', title: 'Pointers', path: '03-systems/c-programming/05-pointers.md', estimatedMinutes: 40 },
          { id: 'c-06', title: 'Memory Management', path: '03-systems/c-programming/06-memory-management.md', estimatedMinutes: 35 },
          { id: 'c-07', title: 'Strings & Structs', path: '03-systems/c-programming/07-strings-and-structs.md', estimatedMinutes: 30 },
          { id: 'c-08', title: 'File I/O', path: '03-systems/c-programming/08-file-io.md', estimatedMinutes: 25 },
          { id: 'c-09', title: 'Advanced C', path: '03-systems/c-programming/09-advanced.md', estimatedMinutes: 40 },
        ],
      },
      {
        id: 'operating-systems',
        name: 'Operating Systems',
        lessons: [
          { id: 'os-01', title: 'Introduction', path: '03-systems/operating-systems/01-intro.md', estimatedMinutes: 25 },
          { id: 'os-02', title: 'Processes', path: '03-systems/operating-systems/02-processes.md', estimatedMinutes: 30 },
          { id: 'os-03', title: 'Threads', path: '03-systems/operating-systems/03-threads.md', estimatedMinutes: 30 },
          { id: 'os-04', title: 'Synchronization', path: '03-systems/operating-systems/04-synchronization.md', estimatedMinutes: 35 },
          { id: 'os-05', title: 'Memory Management', path: '03-systems/operating-systems/05-memory-management.md', estimatedMinutes: 35 },
          { id: 'os-06', title: 'File Systems', path: '03-systems/operating-systems/06-file-systems.md', estimatedMinutes: 30 },
          { id: 'os-07', title: 'I/O Systems', path: '03-systems/operating-systems/07-io-systems.md', estimatedMinutes: 25 },
          { id: 'os-08', title: 'Build Your Own OS', path: '03-systems/operating-systems/08-build-your-own-os.md', estimatedMinutes: 60 },
        ],
      },
      {
        id: 'networking',
        name: 'Networking',
        lessons: [
          { id: 'net-01', title: 'Networking Complete', path: '03-systems/networking/networking-complete.md', estimatedMinutes: 50 },
        ],
      },
      {
        id: 'rust',
        name: 'Rust',
        lessons: [
          { id: 'rust-01', title: 'Why Rust', path: '03-systems/rust/01-why-rust.md', estimatedMinutes: 15 },
          { id: 'rust-02', title: 'Basics', path: '03-systems/rust/02-basics.md', estimatedMinutes: 30 },
          { id: 'rust-03', title: 'Ownership', path: '03-systems/rust/03-ownership.md', estimatedMinutes: 35 },
          { id: 'rust-04', title: 'Structs & Enums', path: '03-systems/rust/04-structs-enums.md', estimatedMinutes: 30 },
          { id: 'rust-05', title: 'Error Handling', path: '03-systems/rust/05-error-handling.md', estimatedMinutes: 25 },
          { id: 'rust-06', title: 'Collections', path: '03-systems/rust/06-collections.md', estimatedMinutes: 25 },
          { id: 'rust-07', title: 'Traits', path: '03-systems/rust/07-traits.md', estimatedMinutes: 35 },
          { id: 'rust-08', title: 'Concurrency', path: '03-systems/rust/08-concurrency.md', estimatedMinutes: 35 },
          { id: 'rust-09', title: 'Unsafe & FFI', path: '03-systems/rust/09-unsafe-and-ffi.md', estimatedMinutes: 30 },
        ],
      },
    ],
  },
  {
    id: 'engineering',
    name: 'Phase 4: Engineering',
    description: 'TypeScript, React, databases, system design, and testing',
    color: '#00D4FF',
    gradient: 'linear-gradient(135deg, #00D4FF, #3B82F6)',
    icon: '🏗️',
    topics: [
      {
        id: 'typescript',
        name: 'TypeScript',
        lessons: [
          { id: 'ts-01', title: 'JavaScript Essentials', path: '04-engineering/typescript/01-javascript-essentials.md', estimatedMinutes: 40 },
          { id: 'ts-02', title: 'TypeScript Basics', path: '04-engineering/typescript/02-typescript-basics.md', estimatedMinutes: 35 },
          { id: 'ts-03', title: 'Advanced TypeScript', path: '04-engineering/typescript/03-advanced-typescript.md', estimatedMinutes: 45 },
        ],
      },
      {
        id: 'react',
        name: 'React',
        lessons: [
          { id: 'react-01', title: 'React Fundamentals', path: '04-engineering/react/01-react-fundamentals.md', estimatedMinutes: 40 },
          { id: 'react-02', title: 'React Patterns', path: '04-engineering/react/02-react-patterns.md', estimatedMinutes: 35 },
          { id: 'react-03', title: 'React Projects', path: '04-engineering/react/03-react-projects.md', estimatedMinutes: 60 },
        ],
      },
      {
        id: 'databases',
        name: 'Databases',
        lessons: [
          { id: 'db-01', title: 'SQL Fundamentals', path: '04-engineering/databases/01-sql-fundamentals.md', estimatedMinutes: 35 },
          { id: 'db-02', title: 'Database Design', path: '04-engineering/databases/02-database-design.md', estimatedMinutes: 30 },
          { id: 'db-03', title: 'SQLite & Postgres', path: '04-engineering/databases/03-sqlite-and-postgres.md', estimatedMinutes: 30 },
        ],
      },
      {
        id: 'system-design',
        name: 'System Design',
        lessons: [
          { id: 'sd-01', title: 'System Design Complete', path: '04-engineering/system-design/system-design-complete.md', estimatedMinutes: 60 },
        ],
      },
      {
        id: 'testing',
        name: 'Testing',
        lessons: [
          { id: 'test-01', title: 'Testing Complete', path: '04-engineering/testing/testing-complete.md', estimatedMinutes: 45 },
        ],
      },
    ],
  },
  {
    id: 'advanced',
    name: 'Phase 5: Advanced',
    description: 'Machine learning, embedded systems, compilers, and mathematics',
    color: '#EC4899',
    gradient: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
    icon: '🚀',
    topics: [
      {
        id: 'machine-learning',
        name: 'Machine Learning',
        lessons: [
          { id: 'ml-01', title: 'Math Foundations', path: '05-advanced/machine-learning/01-math-foundations.md', estimatedMinutes: 45 },
          { id: 'ml-02', title: 'ML from Scratch', path: '05-advanced/machine-learning/02-ml-from-scratch.md', estimatedMinutes: 50 },
          { id: 'ml-03', title: 'Neural Networks', path: '05-advanced/machine-learning/03-neural-networks.md', estimatedMinutes: 45 },
          { id: 'ml-04', title: 'LLM & Transformers', path: '05-advanced/machine-learning/04-llm-and-transformers.md', estimatedMinutes: 50 },
        ],
      },
      {
        id: 'embedded',
        name: 'Embedded Systems',
        lessons: [
          { id: 'emb-01', title: 'Embedded & Jetson', path: '05-advanced/embedded/embedded-jetson.md', estimatedMinutes: 45 },
        ],
      },
      {
        id: 'compilers',
        name: 'Compilers',
        lessons: [
          { id: 'comp-01', title: 'Build a Compiler', path: '05-advanced/compilers/build-a-compiler.md', estimatedMinutes: 60 },
        ],
      },
      {
        id: 'mathematics',
        name: 'Mathematics',
        lessons: [
          { id: 'math-01', title: 'Linear Algebra', path: '05-advanced/mathematics/01-linear-algebra.md', estimatedMinutes: 45 },
          { id: 'math-02', title: 'Calculus', path: '05-advanced/mathematics/02-calculus.md', estimatedMinutes: 45 },
          { id: 'math-03', title: 'Statistics', path: '05-advanced/mathematics/03-statistics.md', estimatedMinutes: 40 },
        ],
      },
    ],
  },
  {
    id: 'mastery',
    name: 'Phase 6: Mastery',
    description: 'Competitive programming, build-your-own-X projects, and landmark papers',
    color: '#D4AF37',
    gradient: 'linear-gradient(135deg, #D4AF37, #F59E0B)',
    icon: '👑',
    topics: [
      {
        id: 'competitive-programming',
        name: 'Competitive Programming',
        lessons: [
          { id: 'cp-01', title: 'Problems', path: '06-mastery/competitive-programming/problems.md', estimatedMinutes: 60 },
        ],
      },
      {
        id: 'build-your-own-x',
        name: 'Build Your Own X',
        lessons: [
          { id: 'byo-shell', title: 'Build Your Own Shell', path: '06-mastery/build-your-own-x/build-your-own-shell.md', estimatedMinutes: 60 },
          { id: 'byo-http', title: 'Build Your Own HTTP Server', path: '06-mastery/build-your-own-x/build-your-own-http-server.md', estimatedMinutes: 60 },
          { id: 'byo-db', title: 'Build Your Own Database', path: '06-mastery/build-your-own-x/build-your-own-database.md', estimatedMinutes: 90 },
          { id: 'byo-nn', title: 'Build Your Own Neural Network', path: '06-mastery/build-your-own-x/build-your-own-neural-network.md', estimatedMinutes: 75 },
          { id: 'byo-game', title: 'Build Your Own Game Engine', path: '06-mastery/build-your-own-x/build-your-own-game-engine.md', estimatedMinutes: 90 },
        ],
      },
      {
        id: 'papers',
        name: 'Landmark Papers',
        lessons: [
          { id: 'papers-01', title: 'Landmark Papers', path: '06-mastery/papers/landmark-papers.md', estimatedMinutes: 60 },
        ],
      },
    ],
  },
];

// ── Cheatsheets ──

export const CHEATSHEETS: Cheatsheet[] = [
  { id: 'cs-python', title: 'Python', path: 'references/cheatsheets/python-cheatsheet.md', icon: '🐍', color: '#39FF14' },
  { id: 'cs-git', title: 'Git', path: 'references/cheatsheets/git-cheatsheet.md', icon: '📝', color: '#F97316' },
  { id: 'cs-linux', title: 'Linux Commands', path: 'references/cheatsheets/linux-commands-cheatsheet.md', icon: '🐧', color: '#A855F7' },
  { id: 'cs-bigo', title: 'Big O', path: 'references/cheatsheets/big-o-cheatsheet.md', icon: '📊', color: '#EC4899' },
  { id: 'cs-sql', title: 'SQL', path: 'references/cheatsheets/sql-cheatsheet.md', icon: '🗃️', color: '#00D4FF' },
  { id: 'cs-regex', title: 'Regex', path: 'references/cheatsheets/regex-cheatsheet.md', icon: '🔍', color: '#FACC15' },
  { id: 'cs-typescript', title: 'TypeScript', path: 'references/cheatsheets/typescript-cheatsheet.md', icon: '🔷', color: '#3B82F6' },
  { id: 'cs-rust', title: 'Rust', path: 'references/cheatsheets/rust-cheatsheet.md', icon: '🦀', color: '#D4AF37' },
];

// ── Music Tracks ──

export const MUSIC_TRACKS: Track[] = [
  // Essentials
  { title: 'CRU - Just Another Case', path: 'study-music/CRU - Just Another Case (1997).mp3', category: 'Essentials' },
  { title: 'Black Star - Thieves In The Night', path: 'study-music/Thieves In The Night.mp3', category: 'Essentials' },
  { title: 'Mos Def - Mathematics', path: 'study-music/Mathematics.mp3', category: 'Essentials' },
  { title: 'Black Star - Definition', path: 'study-music/Black Star (Mos Def & Talib Kweli) - Definition.mp3', category: 'Essentials' },
  { title: 'Black Star - Respiration ft. Common', path: 'study-music/Black Star - Respiration ft. Common.mp3', category: 'Essentials' },
  { title: 'Nas - The World Is Yours', path: 'study-music/Nas - The World Is Yours (Official HD Video).mp3', category: 'Essentials' },
  { title: 'Nas - N.Y. State of Mind', path: 'study-music/Nas - N.Y. State of Mind (Official Audio).mp3', category: 'Essentials' },
  { title: 'Nas - It Ain\'t Hard To Tell', path: 'study-music/Nas - It Ain\'t Hard To Tell (Official Video).mp3', category: 'Essentials' },
  { title: 'Mobb Deep - Shook Ones Pt. II', path: 'study-music/Mobb Deep - Shook Ones, Pt. II (Official HD Video).mp3', category: 'Essentials' },
  { title: 'Mobb Deep - Survival of the Fittest', path: 'study-music/Mobb Deep - Survival of the Fittest (Official Video) [Explicit].mp3', category: 'Essentials' },
  // Conscious
  { title: 'ATCQ - Can I Kick It?', path: 'study-music/A Tribe Called Quest - Can I Kick It？ (Official HD Video).mp3', category: 'Conscious' },
  { title: 'ATCQ - Electric Relaxation', path: 'study-music/A Tribe Called Quest - Electric Relaxation (Official HD Video).mp3', category: 'Conscious' },
  { title: 'ATCQ - Award Tour', path: 'study-music/A Tribe Called Quest - Award Tour (Official HD Video) ft. Trugoy The Dove.mp3', category: 'Conscious' },
  { title: 'De La Soul - Stakes Is High', path: 'study-music/De La Soul - Stakes Is High (Official Music Video) [HD].mp3', category: 'Conscious' },
  { title: 'Fugees - Ready Or Not', path: 'study-music/Fugees - Ready Or Not (Official HD Video).mp3', category: 'Conscious' },
  { title: 'Fugees - Killing Me Softly', path: 'study-music/Fugees - Killing Me Softly With His Song (Official Video).mp3', category: 'Conscious' },
  { title: 'Lauryn Hill - Everything Is Everything', path: 'study-music/Lauryn Hill - Everything Is Everything (Official HD Video).mp3', category: 'Conscious' },
  { title: 'Common - I Used to Love H.E.R.', path: 'study-music/Common - I Used to Love H.E.R. (Official Video).mp3', category: 'Conscious' },
  { title: 'Common - The Light', path: 'study-music/Common - The Light.mp3', category: 'Conscious' },
  { title: 'Talib Kweli - Get By', path: 'study-music/Talib Kweli - Get By.mp3', category: 'Conscious' },
  // Boom Bap
  { title: 'Pete Rock & CL Smooth - T.R.O.Y.', path: 'study-music/Pete Rock & CL Smooth - They Reminisce Over You (T.R.O.Y.) (Official Video).mp3', category: 'Boom Bap' },
  { title: 'Gang Starr - Mass Appeal', path: 'study-music/Gang Starr - Mass Appeal.mp3', category: 'Boom Bap' },
  { title: 'Gang Starr - Moment Of Truth', path: 'study-music/Moment Of Truth.mp3', category: 'Boom Bap' },
  { title: 'Gang Starr - Above The Clouds', path: 'study-music/Above The Clouds.mp3', category: 'Boom Bap' },
  { title: 'Gang Starr - Full Clip', path: 'study-music/Gang Starr - Full Clip.mp3', category: 'Boom Bap' },
  { title: 'Jeru The Damaja - Come Clean', path: 'study-music/Jeru The Damaja - Come Clean.mp3', category: 'Boom Bap' },
  { title: 'Big L - Put It On', path: 'study-music/Big L - Put It On (Official Music Video).mp3', category: 'Boom Bap' },
  { title: 'Big L - MVP', path: 'study-music/Big L - MVP (Official Music Video).mp3', category: 'Boom Bap' },
  { title: 'AZ - Rather Unique', path: 'study-music/Rather Unique.mp3', category: 'Boom Bap' },
  { title: 'Smoothe Da Hustler - Broken Language', path: 'study-music/Smoothe Da Hustler ft Trigga The Gambler- Broken Language.mp3', category: 'Boom Bap' },
  // Street Poetry
  { title: 'Wu-Tang - C.R.E.A.M.', path: 'study-music/Wu-Tang Clan - C.R.E.A.M. (Official HD Video).mp3', category: 'Street Poetry' },
  { title: 'Wu-Tang - Protect Ya Neck', path: 'study-music/Wu-Tang Clan - Protect Ya Neck (Official HD Video).mp3', category: 'Street Poetry' },
  { title: 'Raekwon - Ice Cream', path: 'study-music/Raekwon - Ice Cream (Official HD Video) ft. Ghostface Killah, Method Man, Cappadonna.mp3', category: 'Street Poetry' },
  { title: 'GZA - Liquid Swords', path: 'study-music/GZA - Liquid Swords.mp3', category: 'Street Poetry' },
  { title: 'Inspectah Deck - Triumph', path: "study-music/Deconstructing Inspectah Deck's Verse On Wu-Tang Clan's ＂Triumph＂ ｜ Check The Rhyme.mp3", category: 'Street Poetry' },
  { title: 'Method Man - Bring The Pain', path: 'study-music/Method Man - Bring The Pain.mp3', category: 'Street Poetry' },
  { title: 'Biggie - Juicy', path: 'study-music/The Notorious B.I.G. - Juicy (Official Video) [4K].mp3', category: 'Street Poetry' },
  { title: 'Biggie - Hypnotize', path: 'study-music/The Notorious B.I.G. - Hypnotize (Official Music Video) [4K].mp3', category: 'Street Poetry' },
  { title: 'Jay-Z - Dead Presidents', path: 'study-music/JAŸ-Z - Dead Presidents.mp3', category: 'Street Poetry' },
  { title: "Jay-Z - D'Evils", path: 'study-music/The Day Everyone Found Out How Dangerous Jay Z Was.mp3', category: 'Street Poetry' },
  // West Coast
  { title: '2Pac - Dear Mama', path: 'study-music/2Pac - Dear Mama.mp3', category: 'West Coast' },
  { title: '2Pac - Changes', path: 'study-music/2Pac - Changes ft. Talent.mp3', category: 'West Coast' },
  { title: '2Pac - Ambitionz Az a Ridah', path: 'study-music/2Pac - Ambitionz Az a Ridah.mp3', category: 'West Coast' },
  { title: 'Snoop Dogg - Gin And Juice', path: 'study-music/Snoop Dogg - Gin And Juice.mp3', category: 'West Coast' },
  { title: 'Dr. Dre - Still D.R.E.', path: 'study-music/Dr. Dre - Still D.R.E. ft. Snoop Dogg.mp3', category: 'West Coast' },
  { title: 'Warren G - Regulate', path: 'study-music/Warren G - Regulate (Official Music Video) ft. Nate Dogg.mp3', category: 'West Coast' },
  { title: "The Pharcyde - Passin' Me By", path: "study-music/The Pharcyde - Passin' Me By (Official HD Music Video).mp3", category: 'West Coast' },
  { title: "The Pharcyde - Runnin'", path: "study-music/The Pharcyde - Runnin' (Official HD Music Video).mp3", category: 'West Coast' },
  { title: "Souls Of Mischief - 93 'Til Infinity", path: "study-music/Souls Of Mischief - 93 'Til Infinity (Official Video).mp3", category: 'West Coast' },
  { title: 'Digable Planets - Rebirth of Slick', path: 'study-music/Digable Planets - Rebirth of Slick (Cool Like Dat) (Official Music Video).mp3', category: 'West Coast' },
  // Deep Cuts
  { title: 'Outkast - Aquemini', path: 'study-music/Aquemini.mp3', category: 'Deep Cuts' },
  { title: 'Outkast - SpottieOttieDopaliscious', path: 'study-music/Outkast - SpottieOttieDopaliscious (Animated Music Video).mp3', category: 'Deep Cuts' },
  { title: 'Outkast - ATliens', path: 'study-music/Outkast - ATliens (Official HD Video).mp3', category: 'Deep Cuts' },
  { title: 'Goodie Mob - Cell Therapy', path: 'study-music/Goodie Mob - Cell Therapy (Official HD Video).mp3', category: 'Deep Cuts' },
  { title: 'Organized Konfusion - Stress', path: 'study-music/Organized Konfusion ＂Stress＂ [HD].mp3', category: 'Deep Cuts' },
  { title: 'KRS-One - Sound of da Police', path: 'study-music/KRS-One - Sound of da Police (Official Video).mp3', category: 'Deep Cuts' },
  { title: 'BDP - My Philosophy', path: 'study-music/Boogie Down Productions - My Philosophy (Official HD Video).mp3', category: 'Deep Cuts' },
  { title: 'Eric B. & Rakim - Paid In Full', path: 'study-music/Eric B. & Rakim - Paid In Full.mp3', category: 'Deep Cuts' },
  { title: 'Brand Nubian - Punks Jump Up', path: 'study-music/Brand Nubian - Punks Jump Up to Get Beat Down (Official Music Video).mp3', category: 'Deep Cuts' },
  { title: 'Busta Rhymes - Woo-Hah!!', path: 'study-music/Busta Rhymes - Woo-Hah!! Got You All In Check (Official Video) [Explicit].mp3', category: 'Deep Cuts' },
];

export const MUSIC_CATEGORIES: MusicCategory[] = [
  'Essentials', 'Conscious', 'Boom Bap', 'Street Poetry', 'West Coast', 'Deep Cuts',
];

export const CATEGORY_COLORS: Record<MusicCategory, string> = {
  'Essentials': '#EF4444',
  'Conscious': '#8B5CF6',
  'Boom Bap': '#F97316',
  'Street Poetry': '#64748B',
  'West Coast': '#22C55E',
  'Deep Cuts': '#D4AF37',
};

export const CATEGORY_EMOJIS: Record<MusicCategory, string> = {
  'Essentials': '🔥',
  'Conscious': '🌌',
  'Boom Bap': '🥁',
  'Street Poetry': '📝',
  'West Coast': '🌴',
  'Deep Cuts': '💎',
};

// ── Helpers ──

/** Get all lessons flat */
export function getAllLessons(): AcademyLesson[] {
  return PHASES.flatMap(p => p.topics.flatMap(t => t.lessons));
}

/** Get total lesson count */
export function getTotalLessonCount(): number {
  return getAllLessons().length;
}

/** Get total estimated study time in minutes */
export function getTotalEstimatedMinutes(): number {
  return getAllLessons().reduce((sum, l) => sum + l.estimatedMinutes, 0);
}

/** Find a lesson by ID */
export function findLesson(lessonId: string): { phase: AcademyPhase; topic: AcademyTopic; lesson: AcademyLesson } | null {
  for (const phase of PHASES) {
    for (const topic of phase.topics) {
      const lesson = topic.lessons.find(l => l.id === lessonId);
      if (lesson) return { phase, topic, lesson };
    }
  }
  return null;
}

/** Get prev/next lesson relative to current */
export function getAdjacentLessons(lessonId: string): { prev: AcademyLesson | null; next: AcademyLesson | null } {
  const all = getAllLessons();
  const idx = all.findIndex(l => l.id === lessonId);
  return {
    prev: idx > 0 ? all[idx - 1] : null,
    next: idx < all.length - 1 ? all[idx + 1] : null,
  };
}
