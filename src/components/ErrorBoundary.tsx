import { Component } from 'react'
import type React from 'react'

type Props = { children: React.ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen bg-black px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
          <div className="text-xs font-semibold tracking-[0.25em] text-[#1f5f3a]">ERROR</div>
          <h1 className="mt-2 text-2xl font-extrabold">App crashed</h1>
          <pre className="mt-4 overflow-auto rounded-xl bg-black/40 p-4 text-xs text-white/80">
            {this.state.error.message}
          </pre>
          <div className="mt-4 text-xs text-white/50">Fix the error and reload the page.</div>
        </div>
      </div>
    )
  }
}

