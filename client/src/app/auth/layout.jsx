export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 bg-radial-glow overflow-hidden">
      <div className="absolute inset-0 bg-ink-950" />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
