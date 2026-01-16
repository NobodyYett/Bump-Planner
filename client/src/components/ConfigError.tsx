// client/src/components/ConfigError.tsx

interface ConfigErrorProps {
  missingVars: string[];
}

export function ConfigError({ missingVars }: ConfigErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-foreground">
          Configuration Required
        </h1>
        <p className="text-muted-foreground">
          The app cannot start because required environment variables are missing.
        </p>
        <div className="bg-muted/50 border border-border rounded-lg p-4 text-left">
          <p className="text-sm font-medium text-foreground mb-2">
            Missing variables:
          </p>
          <ul className="space-y-1">
            {missingVars.map((varName) => (
              <li
                key={varName}
                className="text-sm font-mono text-destructive bg-destructive/10 px-2 py-1 rounded"
              >
                {varName}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground/70 pt-4 border-t border-border">
          If you're seeing this in production, contact the development team.
        </p>
      </div>
    </div>
  );
}