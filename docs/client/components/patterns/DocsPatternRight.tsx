const svg = `<svg xmlns="http://www.w3.org/2000/svg" style="height: 100%; width: 100%;">
  <defs>
    <pattern id="a" width="20" height="20" patternTransform="rotate(15)scale(2)" patternUnits="userSpaceOnUse">
      <path fill="none" stroke="#4f4f4f1A" d="M10 0v20ZM0 10h20Z"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#a)"/>
</svg>`;

// <rect width="100%" height="100%" fill="#2b2b31"/>

export default function DocsPattern() {
  return (
    <div
      aria-hidden
      className="w-full h-full overflow-x-hidden"
      dangerouslySetInnerHTML={{ __html: svg }}
    ></div>
  );
}
