'use client'

import { useRef, useState, useTransition } from 'react'
import { applyToJob, type ApplyResult } from './actions'

export default function ApplyForm({ jobId }: { jobId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [result, setResult] = useState<ApplyResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await applyToJob(formData)
      setResult(res)
      if (res.success) formRef.current?.reset()
    })
  }

  if (result?.success) {
    return (
      <div className="bg-vine-50 border border-vine-200 rounded-xl p-6 text-center">
        <p className="text-vine-700 font-medium text-lg">Application submitted!</p>
        <p className="text-vine-600 text-sm mt-1">
          We&apos;ll be in touch at the email you provided.
        </p>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="job_id" value={jobId} />

      {result && !result.success && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">
          {result.error}
        </div>
      )}

      <div>
        <label htmlFor="candidate_name" className="block text-sm font-medium text-gray-700 mb-1">
          Full name
        </label>
        <input
          id="candidate_name"
          name="candidate_name"
          type="text"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vine-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="candidate_email" className="block text-sm font-medium text-gray-700 mb-1">
          Email address
        </label>
        <input
          id="candidate_email"
          name="candidate_email"
          type="email"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vine-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-1">
          Resume <span className="text-gray-400 font-normal">(PDF, DOCX — optional)</span>
        </label>
        <input
          id="resume"
          name="resume"
          type="file"
          accept=".pdf,.doc,.docx"
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-vine-50 file:text-vine-700 hover:file:bg-vine-100"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2 px-4 bg-vine-600 text-white text-sm font-medium rounded-lg hover:bg-vine-700 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Submitting…' : 'Submit application'}
      </button>
    </form>
  )
}
