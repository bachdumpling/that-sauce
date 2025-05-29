interface OnboardingContainerProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}

export function OnboardingContainer({
  children,
  title,
  description,
  className = "",
}: OnboardingContainerProps) {
  return (
    <div className={`w-full max-w-2xl mx-auto px-4 ${className}`}>
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-lg">{description}</p>
          )}
        </div>
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
