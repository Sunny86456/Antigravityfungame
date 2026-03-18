interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-8 animate-rise">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text neon-text mb-3 tracking-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-lg text-muted-strong max-w-xl">{subtitle}</p>
      )}
      <div className="gradient-line mt-4 w-24 rounded-full" />
    </div>
  );
}
