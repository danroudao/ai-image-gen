'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error('ErrorBoundary caught:', error)
    console.error('Component stack:', info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-background text-foreground p-8">
          <div className="max-w-lg text-center space-y-4">
            <h1 className="text-xl font-bold text-destructive">渲染错误</h1>
            <pre className="text-sm text-left bg-muted p-4 rounded-lg overflow-auto max-h-60">
              {this.state.error?.message}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
            <button
              type="button"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80"
              onClick={() => window.location.reload()}
            >
              刷新页面
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
