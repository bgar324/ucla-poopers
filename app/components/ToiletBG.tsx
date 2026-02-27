const TOILET_PATTERN_SVG = encodeURIComponent(
  `<svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="220" 
    height="220" 
    viewBox="0 0 220 220" 
    fill="none" 
    stroke="#78350f" 
    stroke-width="1.75" 
    stroke-linecap="round" 
    stroke-linejoin="round">

    <g
      transform="translate(104 104) 
      scale(1.5)">
      <path 
        d="M7 12h13a1 1 0 0 1 1 1 5 5 0 0 1-5 5h-.598a.5.5 0 0 0-.424.765l1.544 2.47a.5.5 0 0 1-.424.765H5.402a.5.5 0 0 1-.424-.765L7 18"/>
      <path 
        d="M8 18a5 5 0 0 1-5-5V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8"/>
    </g>
  </svg>`
  
);

const TOILET_PATTERN_URL = `url("data:image/svg+xml,${TOILET_PATTERN_SVG}")`;

export default function ToiletBG() {
    return (
    <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <div
          className="absolute -inset-[65%] rotate-[-12deg] opacity-[0.15]"
          style={{
            backgroundImage: `${TOILET_PATTERN_URL}, ${TOILET_PATTERN_URL}`,
            backgroundRepeat: "repeat, repeat",
            backgroundSize: "150px 150px, 150px 150px",
            backgroundPosition: "0 0, 85px 85px",
          }}
        />
      </div>
    );
}

