'use client'

import { useState, useTransition } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toggleVineyardListing, reorderVineyardListings } from './actions'
import CopyButton from '../copy-button'

interface Job {
  jobId: string
  token: string
  clicks: number
  title: string
  company: string
  location: string | null
  fee: number
  active: boolean
  sortOrder: number
}

function SortableRow({
  job,
  appUrl,
  onToggle,
}: {
  job: Job
  appUrl: string
  onToggle: (jobId: string, active: boolean) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: job.jobId, disabled: !job.active })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 bg-white rounded-xl border px-4 py-3 transition-colors ${
        job.active ? 'border-gray-200' : 'border-dashed border-gray-200 opacity-60'
      }`}
    >
      {/* Drag handle — only shown when active */}
      {job.active ? (
        <button
          {...attributes}
          {...listeners}
          className="text-gray-300 hover:text-gray-400 cursor-grab active:cursor-grabbing touch-none p-1 -ml-1"
          aria-label="Drag to reorder"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <circle cx="6" cy="4" r="1.2"/><circle cx="10" cy="4" r="1.2"/>
            <circle cx="6" cy="8" r="1.2"/><circle cx="10" cy="8" r="1.2"/>
            <circle cx="6" cy="12" r="1.2"/><circle cx="10" cy="12" r="1.2"/>
          </svg>
        </button>
      ) : (
        <div className="w-6" />
      )}

      {/* Job info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 truncate">{job.title}</div>
        <div className="text-xs text-gray-400 truncate">
          {job.company}{job.location ? ` · ${job.location}` : ''} · {fmt(job.fee)} fee · {job.clicks} clicks
        </div>
      </div>

      {/* Copy link */}
      <CopyButton url={`${appUrl}/r/${job.token}`} />

      {/* Toggle */}
      <button
        onClick={() => onToggle(job.jobId, !job.active)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
          job.active ? 'bg-vine-600' : 'bg-gray-200'
        }`}
        title={job.active ? 'Remove from Vineyard' : 'Add to Vineyard'}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
          job.active ? 'translate-x-4' : 'translate-x-0'
        }`} />
      </button>
    </div>
  )
}

export default function VineyardManager({ jobs: initialJobs }: { jobs: Job[] }) {
  const [jobs, setJobs] = useState(() =>
    [...initialJobs].sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1
      return a.sortOrder - b.sortOrder
    })
  )
  const [appUrl, setAppUrl] = useState('')
  const [isPending, startTransition] = useTransition()

  // Get app URL client-side
  if (typeof window !== 'undefined' && !appUrl) {
    setAppUrl(window.location.origin)
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const activeJobs = jobs.filter((j) => j.active)
  const inactiveJobs = jobs.filter((j) => !j.active)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = jobs.findIndex((j) => j.jobId === active.id)
    const newIndex = jobs.findIndex((j) => j.jobId === over.id)
    const reordered = arrayMove(jobs, oldIndex, newIndex)
    setJobs(reordered)

    startTransition(async () => {
      const activeIds = reordered.filter((j) => j.active).map((j) => j.jobId)
      await reorderVineyardListings(activeIds)
    })
  }

  const handleToggle = (jobId: string, active: boolean) => {
    setJobs((prev) => {
      const updated = prev.map((j) => j.jobId === jobId ? { ...j, active } : j)
      return [...updated].sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1
        return a.sortOrder - b.sortOrder
      })
    })
    startTransition(async () => {
      await toggleVineyardListing(jobId, active)
    })
  }

  return (
    <div className={`space-y-4 ${isPending ? 'opacity-70' : ''}`}>
      {/* Active / on vineyard */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700">
            On your Vineyard
            <span className="text-gray-400 font-normal ml-1">({activeJobs.length})</span>
          </h2>
          {activeJobs.length > 1 && (
            <p className="text-xs text-gray-400">Drag to reorder</p>
          )}
        </div>

        {activeJobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center">
            <p className="text-sm text-gray-400">Toggle jobs on to feature them on your public Vineyard.</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={activeJobs.map((j) => j.jobId)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {activeJobs.map((job) => (
                  <SortableRow key={job.jobId} job={job} appUrl={appUrl} onToggle={handleToggle} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Inactive / off vineyard */}
      {inactiveJobs.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-gray-500">
            Not on Vineyard
            <span className="text-gray-400 font-normal ml-1">({inactiveJobs.length})</span>
          </h2>
          <div className="space-y-2">
            {inactiveJobs.map((job) => (
              <SortableRow key={job.jobId} job={job} appUrl={appUrl} onToggle={handleToggle} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
