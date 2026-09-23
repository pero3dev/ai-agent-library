'use client'

import { Component } from 'react'

/** A failed scene or shared figure chunk must not replace the article with an error. */
export class DiagramBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return <section className="reading-figure-fallback">
        <p role="status">図解を読み込めませんでした。本文は引き続き読めます。</p>
        {this.props.fallback}
      </section>
    }
    return this.props.children
  }
}
