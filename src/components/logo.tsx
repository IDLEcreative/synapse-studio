export function Logo() {
  return (
    <div className="flex items-center">
      {/* SVG Logo */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mr-2.5"
      >
        {/* Base circular gradient */}
        <circle
          cx="16"
          cy="16"
          r="14"
          fill="url(#circleGradient)"
          filter="drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.25))"
        />

        {/* Lens/aperture shape */}
        <path
          d="M16 8C11.582 8 8 11.582 8 16C8 20.418 11.582 24 16 24C20.418 24 24 20.418 24 16C24 11.582 20.418 8 16 8Z"
          fill="url(#innerGradient)"
          stroke="url(#strokeGradient)"
          strokeWidth="0.75"
          strokeOpacity="0.8"
        />

        {/* Aperture blades */}
        <path
          d="M16 10L13 16L16 22L19 16L16 10Z"
          fill="url(#bladeGradient1)"
          stroke="white"
          strokeWidth="0.5"
          strokeOpacity="0.8"
        />
        <path
          d="M10 16L16 13L22 16L16 19L10 16Z"
          fill="url(#bladeGradient2)"
          stroke="white"
          strokeWidth="0.5"
          strokeOpacity="0.8"
        />

        {/* Center highlight */}
        <circle cx="16" cy="16" r="2" fill="white" fillOpacity="0.9" />

        {/* Subtle glow effect */}
        <circle
          cx="16"
          cy="16"
          r="5"
          fill="url(#glowGradient)"
          fillOpacity="0.4"
        />

        {/* Subtle reflection highlight */}
        <path
          d="M14 10C12.5 10.5 11.5 11.5 11 13C10.5 14.5 10.8 16 11.5 17.5"
          stroke="white"
          strokeWidth="0.5"
          strokeOpacity="0.6"
          strokeLinecap="round"
        />

        <defs>
          {/* Main circle gradient */}
          <linearGradient
            id="circleGradient"
            x1="6"
            y1="6"
            x2="26"
            y2="26"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#0055FF" />
            <stop offset="50%" stopColor="#0088FF" />
            <stop offset="100%" stopColor="#00CCFF" />
          </linearGradient>

          {/* Inner lens gradient */}
          <linearGradient
            id="innerGradient"
            x1="8"
            y1="8"
            x2="24"
            y2="24"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#001E3C" />
            <stop offset="100%" stopColor="#0D47A1" />
          </linearGradient>

          {/* Stroke gradient */}
          <linearGradient
            id="strokeGradient"
            x1="8"
            y1="8"
            x2="24"
            y2="24"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#29B6F6" />
            <stop offset="100%" stopColor="#0288D1" />
          </linearGradient>

          {/* Blade gradients */}
          <linearGradient
            id="bladeGradient1"
            x1="13"
            y1="10"
            x2="19"
            y2="22"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#E3F2FD" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0D47A1" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient
            id="bladeGradient2"
            x1="10"
            y1="16"
            x2="22"
            y2="16"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#E3F2FD" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0D47A1" stopOpacity="0.4" />
          </linearGradient>

          {/* Glow gradient */}
          <radialGradient
            id="glowGradient"
            cx="16"
            cy="16"
            r="5"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="white" stopOpacity="0.8" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {/* Text part of the logo */}
      <div className="flex flex-col leading-tight">
        <span className="text-blue-500 font-bold text-sm tracking-wide">
          SYNAPSE
        </span>
        <span className="text-cyan-400 font-bold text-sm tracking-wide">
          STUDIO
        </span>
      </div>
    </div>
  );
}
