export default function EventRing() {
  return (
    <svg
      className="business-event-ring"
      viewBox="0 0 800 800"
      overflow="visible"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <path
          id="event-orbit-path"
          d="M 790 400 C 790 329.3 615.4 272 400 272 C 184.6 272 10 329.3 10 400 C 10 470.7 184.6 528 400 528 C 615.4 528 790 470.7 790 400 Z"
        />
      </defs>
      <ellipse
        cx="400"
        cy="400"
        rx="390"
        ry="128"
        fill="none"
        stroke="#3f3026"
        strokeWidth="1.5"
      />
      <g>
        <path
          className="business-event-sparkle"
          fill="#3f3026"
          d="M0,-14 C3,-3 3,-3 14,0 C3,3 3,3 0,14 C-3,3 -3,3 -14,0 C-3,-3 -3,-3 0,-14 Z"
        />
        <animateMotion dur="10s" repeatCount="indefinite" rotate="auto">
          <mpath href="#event-orbit-path" />
        </animateMotion>
      </g>
    </svg>
  );
}
