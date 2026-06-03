'use client';

export function ThemeBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-slate-50/20 dark:bg-[#080c14]/40">
      {/* SVG Container for trade finance routes */}
      <svg
        className="h-full w-full opacity-[0.35] dark:opacity-[0.22] transition-opacity duration-500"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="gradient-line-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
          </linearGradient>
          
          <linearGradient id="gradient-line-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
          </linearGradient>

          <radialGradient id="glow-node" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Major Trade Route Connections (Bezier Curves) */}
        <path
          d="M 100,150 C 300,50 500,300 700,200 C 900,100 1100,400 1400,250"
          fill="none"
          stroke="url(#gradient-line-1)"
          strokeWidth="2"
        />
        <path
          className="animate-dash"
          d="M 100,150 C 300,50 500,300 700,200 C 900,100 1100,400 1400,250"
          fill="none"
          stroke="#818cf8"
          strokeWidth="2"
          strokeDasharray="8, 20"
          strokeDashoffset="100"
        />

        <path
          d="M 200,600 C 500,400 600,800 900,500 C 1200,200 1300,700 1600,450"
          fill="none"
          stroke="url(#gradient-line-2)"
          strokeWidth="1.5"
        />
        <path
          className="animate-dash-reverse"
          d="M 200,600 C 500,400 600,800 900,500 C 1200,200 1300,700 1600,450"
          fill="none"
          stroke="#34d399"
          strokeWidth="1.5"
          strokeDasharray="6, 15"
          strokeDashoffset="-80"
        />

        <path
          d="M 150,300 C 400,500 700,300 900,700"
          fill="none"
          stroke="url(#gradient-line-1)"
          strokeWidth="1"
          strokeOpacity="0.7"
        />

        <path
          d="M 900,200 C 1100,500 1300,100 1500,350"
          fill="none"
          stroke="url(#gradient-line-2)"
          strokeWidth="1"
          strokeOpacity="0.6"
        />

        {/* Global Connection Nodes (Hubs) */}
        {/* Node 1: New York Hub */}
        <circle cx="100" cy="150" r="24" fill="url(#glow-node)" />
        <circle cx="100" cy="150" r="5" fill="#6366f1" />
        <circle cx="100" cy="150" r="8" fill="none" stroke="#6366f1" strokeOpacity="0.5" className="animate-ping" style={{ animationDuration: '3s' }} />

        {/* Node 2: London Hub */}
        <circle cx="700" cy="200" r="30" fill="url(#glow-node)" />
        <circle cx="700" cy="200" r="6" fill="#818cf8" />
        <circle cx="700" cy="200" r="10" fill="none" stroke="#818cf8" strokeOpacity="0.4" className="animate-ping" style={{ animationDuration: '4s' }} />

        {/* Node 3: Dubai Hub */}
        <circle cx="900" cy="500" r="35" fill="url(#glow-node)" />
        <circle cx="900" cy="500" r="7" fill="#3b82f6" />
        <circle cx="900" cy="500" r="12" fill="none" stroke="#3b82f6" strokeOpacity="0.5" className="animate-ping" style={{ animationDuration: '3.5s' }} />

        {/* Node 4: Singapore Hub */}
        <circle cx="1400" cy="250" r="28" fill="url(#glow-node)" />
        <circle cx="1400" cy="250" r="5" fill="#10b981" />
        <circle cx="1400" cy="250" r="9" fill="none" stroke="#10b981" strokeOpacity="0.4" className="animate-ping" style={{ animationDuration: '4.5s' }} />

        {/* Node 5: Tokyo Hub */}
        <circle cx="1600" cy="450" r="26" fill="url(#glow-node)" />
        <circle cx="1600" cy="450" r="4" fill="#a78bfa" />
      </svg>
      
      {/* Background radial soft ambient glow */}
      <div className="absolute top-[-10%] right-[-10%] h-[50vw] w-[50vw] rounded-full bg-indigo-200/10 blur-[120px] dark:bg-indigo-950/15 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] h-[45vw] w-[45vw] rounded-full bg-emerald-200/5 blur-[100px] dark:bg-emerald-950/10 pointer-events-none" />
    </div>
  );
}
