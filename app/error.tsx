'use client'
import { useEffect } from 'react'
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.warn('route error', error?.message) }, [error])
  return <div role="alert" className="p-6">
    <h2 className="text-xl font-semibold mb-2">This section crashed</h2>
    <button className="btn" onClick={()=>reset()}>Retry</button>
  </div>
}
