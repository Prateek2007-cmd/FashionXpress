export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-6xl font-serif text-white mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">This page could not be found.</p>
      <a href="/" className="text-primary hover:underline uppercase tracking-widest text-sm font-medium">Return Home</a>
    </div>
  );
}