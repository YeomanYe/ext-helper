import * as React from "react"

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack)
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="font-punk-body text-base text-punk-cta">SYSTEM ERROR</p>
          <p className="font-mono text-xs text-punk-text-muted">
            {this.state.error?.message ?? "An unexpected error occurred"}
          </p>
          <button
            className="font-punk-btn px-4 py-2 punk-btn-primary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            RETRY
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
