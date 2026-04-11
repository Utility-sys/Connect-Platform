export default function Logo({ className = "h-8" }) {
  return (
    <img 
      src="/logo.png" 
      alt="Connect Logo" 
      className={`${className} object-contain transition-transform duration-300 hover:scale-110 active:scale-95`}
    />
  );
}
