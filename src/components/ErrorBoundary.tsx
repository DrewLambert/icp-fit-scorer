import { Component, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-6">
          <div className="text-center max-w-md space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">Something went wrong</h2>
              <p className="text-muted-foreground">
                An unexpected error occurred. Try refreshing or resetting the view.
              </p>
            </div>
            {this.state.error && (
              <pre className="text-xs text-muted-foreground bg-secondary/30 rounded-xl p-4 text-left overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={this.handleReset} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()} className="gap-2 bg-primary hover:bg-primary/90">
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
