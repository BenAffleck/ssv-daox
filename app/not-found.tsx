export default function NotFound() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="text-center">
        <h1 className="mb-4 font-heading text-4xl font-bold text-foreground">
          Module Not Found
        </h1>
        <p className="font-body text-muted">
          The module you're looking for doesn't exist.
        </p>
      </div>
    </div>
  );
}
