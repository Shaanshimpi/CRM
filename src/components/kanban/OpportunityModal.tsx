'use client'

import React, { useState, useEffect, useCallback } from 'react'
import type { KanbanOpportunity, KanbanColumn } from '../../endpoints/opportunities/kanban'

interface OpportunityModalProps {
  opportunity: KanbanOpportunity | null
  columns: KanbanColumn[]
  currentStageId: string
  pipelineId?: string | null
  onClose: () => void
  onStageChange: (opportunityId: string, newStageId: string) => Promise<void>
  onSave?: () => void
  apiUrl?: string
}

interface Task {
  id?: string
  title: string
  description?: string
  status: 'pending' | 'inProgress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string
  assignedTo?: string | number
}

interface Note {
  id?: string
  content: string
  isPrivate: boolean
  tags?: string[]
}

interface Reminder {
  id?: string
  title: string
  description?: string
  reminderDate: string
  type: 'in-app' | 'email' | 'sms' | 'call'
  status: 'pending' | 'sent' | 'dismissed'
}

interface User {
  id: string | number
  email: string
  firstName?: string
  lastName?: string
}

export const OpportunityModal: React.FC<OpportunityModalProps> = ({
  opportunity,
  columns,
  currentStageId,
  pipelineId,
  onClose,
  onStageChange,
  onSave,
  apiUrl = '/api',
}) => {
  const isCreateMode = !opportunity
  const [fullOpportunity, setFullOpportunity] = useState<{
    id?: string | number
    name?: string
    company?: string
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    value?: number
    currency?: string
    probability?: number
    expectedCloseDate?: string
    assignedTo?: string | number | { id: string | number }
    currentStage?: string | number | { id: string | number }
    pipeline?: string | number | { id: string | number }
    tasks?: Task[]
    notes?: Note[]
    reminders?: Reminder[]
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [createLead, setCreateLead] = useState(false)
  const [leadId, setLeadId] = useState<string | number | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [value, setValue] = useState<number | ''>('')
  const [currency, setCurrency] = useState('INR')
  const [probability, setProbability] = useState<number | ''>('')
  const [expectedCloseDate, setExpectedCloseDate] = useState('')
  const [assignedTo, setAssignedTo] = useState<string | number>('')
  const [selectedStageId, setSelectedStageId] = useState(currentStageId)

  // Tasks, Notes, Reminders state
  const [tasks, setTasks] = useState<Task[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])

  // UI state for adding new items
  // These state variables are used for future UI expansion
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_showAddTask, setShowAddTask] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_showAddNote, setShowAddNote] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_showAddReminder, setShowAddReminder] = useState(false)

  const fetchFullOpportunity = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`${apiUrl}/opportunities/${opportunity?.id}?depth=2`)
      if (!response.ok) throw new Error('Failed to fetch opportunity')
      const data = await response.json()
      setFullOpportunity(data)
    } catch (error) {
      console.error('Failed to fetch opportunity:', error)
      alert('Failed to load opportunity details')
    } finally {
      setLoading(false)
    }
  }, [apiUrl, opportunity?.id])

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/users?where[isActive][equals]=true&limit=100`)
      if (!response.ok) return
      const data = await response.json()
      setUsers(data.docs || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }, [apiUrl])

  useEffect(() => {
    if (opportunity?.id) {
      fetchFullOpportunity()
    }
    // Always fetch users for assignee selection
    fetchUsers()
  }, [opportunity?.id, fetchFullOpportunity, fetchUsers])

  useEffect(() => {
    if (fullOpportunity) {
      setName(fullOpportunity.name || '')
      setCompany(fullOpportunity.company || '')
      setContactName(fullOpportunity.contactName || '')
      setContactEmail(fullOpportunity.contactEmail || '')
      setContactPhone(fullOpportunity.contactPhone || '')
      setValue(fullOpportunity.value || '')
      setCurrency(fullOpportunity.currency || 'INR')
      setProbability(fullOpportunity.probability || '')
      setExpectedCloseDate(fullOpportunity.expectedCloseDate ? new Date(fullOpportunity.expectedCloseDate).toISOString().split('T')[0] : '')
      setAssignedTo(typeof fullOpportunity.assignedTo === 'object' ? fullOpportunity.assignedTo?.id : fullOpportunity.assignedTo || '')
      setSelectedStageId(currentStageId)
      setTasks(Array.isArray(fullOpportunity.tasks) ? fullOpportunity.tasks : [])
      setNotes(Array.isArray(fullOpportunity.notes) ? fullOpportunity.notes : [])
      setReminders(Array.isArray(fullOpportunity.reminders) ? fullOpportunity.reminders : [])
    }
  }, [fullOpportunity, currentStageId])

  const handleCreateLead = async () => {
    if (!contactEmail || !contactName) {
      alert('Contact email and name are required to create a lead')
      return
    }

    try {
      const [firstName, ...lastNameParts] = contactName.trim().split(' ')
      const lastName = lastNameParts.join(' ') || ''
      
      const leadData = {
        firstName: firstName || contactName,
        lastName: lastName,
        email: contactEmail,
        phone: contactPhone || undefined,
        company: company || undefined,
        source: 'website',
        status: 'new',
      }

      const response = await fetch(`${apiUrl}/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to create lead')
      }

      const created = await response.json()
      setLeadId(created.doc.id)
      setCreateLead(false)
      alert('Lead created successfully!')
    } catch (error) {
      console.error('Failed to create lead:', error)
      alert(`Failed to create lead: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Opportunity name is required')
      return
    }

    if (!selectedStageId) {
      alert('Please select a stage')
      return
    }

    if (!assignedTo) {
      alert('Please assign the opportunity to a user')
      return
    }

    if (!pipelineId) {
      alert('Pipeline is required')
      return
    }

    setSaving(true)
    try {
      // Determine ID types
      const stageIdType = 'number'
      const assignedToType = 'number'
      const pipelineIdType = 'number'

      // Convert IDs to correct types
      const convertedStageId = /^\d+$/.test(String(selectedStageId))
        ? Number(selectedStageId)
        : selectedStageId
      
      const convertedAssignedTo = assignedTo && /^\d+$/.test(String(assignedTo))
        ? Number(assignedTo)
        : assignedTo

      const convertedPipelineId = pipelineId && /^\d+$/.test(String(pipelineId))
        ? Number(pipelineId)
        : pipelineId

      const opportunityData: Record<string, unknown> = {
        name,
        company: company || undefined,
        contactName: contactName || undefined,
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
        value: value ? Number(value) : undefined,
        currency: currency || 'INR',
        probability: probability ? Number(probability) : undefined,
        expectedCloseDate: expectedCloseDate || undefined,
        assignedTo: convertedAssignedTo,
        currentStage: convertedStageId,
        pipeline: convertedPipelineId,
        ...(leadId && { lead: leadId }),
        tasks: tasks.map(task => {
          // Convert task assignedTo ID type
          const taskAssignedTo = task.assignedTo 
            ? (assignedToType === 'number' && /^\d+$/.test(String(task.assignedTo)) ? Number(task.assignedTo) : task.assignedTo)
            : undefined

          return {
            ...(task.id && { id: task.id }),
            title: task.title,
            description: task.description || undefined,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate || undefined,
            assignedTo: taskAssignedTo,
          }
        }),
        notes: notes.map(note => ({
          ...(note.id && { id: note.id }),
          content: note.content,
          isPrivate: note.isPrivate || false,
          tags: note.tags || [],
        })),
        reminders: reminders.map(reminder => ({
          ...(reminder.id && { id: reminder.id }),
          title: reminder.title,
          description: reminder.description || undefined,
          reminderDate: reminder.reminderDate,
          type: reminder.type,
          status: reminder.status,
        })),
      }

      if (isCreateMode) {
        // Create new opportunity
        const response = await fetch(`${apiUrl}/opportunities`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          body: JSON.stringify(opportunityData as any),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData.errors 
            ? errorData.errors.map((err: { message?: string; path?: string }) => err.message || err.path || 'Validation error').join(', ')
            : errorData.message || `Failed to create opportunity (${response.status})`
          throw new Error(errorMessage)
        }

        const created = await response.json()
        alert('Opportunity created successfully!')
        onSave?.()
        onClose()
      } else {
        // Update existing opportunity
        const response = await fetch(`${apiUrl}/opportunities/${opportunity!.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(opportunityData),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData.errors 
            ? errorData.errors.map((err: { message?: string; path?: string }) => err.message || err.path || 'Validation error').join(', ')
            : errorData.message || `Failed to update opportunity (${response.status})`
          throw new Error(errorMessage)
        }

        await onStageChange(opportunity!.id, selectedStageId)
        onSave?.()
        onClose()
      }
    } catch (error) {
      console.error('Failed to save opportunity:', error)
      alert(error instanceof Error ? error.message : 'Failed to save opportunity')
    } finally {
      setSaving(false)
    }
  }

  // Task management
  const addTask = () => {
    setTasks([...tasks, {
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      dueDate: '',
    }])
    setShowAddTask(true)
  }

  const updateTask = (index: number, field: keyof Task, value: Task[keyof Task]) => {
    const updated = [...tasks]
    updated[index] = { ...updated[index], [field]: value }
    setTasks(updated)
  }

  const deleteTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index))
  }

  // Note management
  const addNote = () => {
    setNotes([...notes, {
      content: '',
      isPrivate: false,
      tags: [],
    }])
    setShowAddNote(true)
  }

  const updateNote = (index: number, field: keyof Note, value: Note[keyof Note]) => {
    const updated = [...notes]
    updated[index] = { ...updated[index], [field]: value }
    setNotes(updated)
  }

  const deleteNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index))
  }

  // Reminder management
  const addReminder = () => {
    setReminders([...reminders, {
      title: '',
      description: '',
      reminderDate: new Date().toISOString().split('T')[0],
      type: 'in-app',
      status: 'pending',
    }])
    setShowAddReminder(true)
  }

  const updateReminder = (index: number, field: keyof Reminder, value: Reminder[keyof Reminder]) => {
    const updated = [...reminders]
    updated[index] = { ...updated[index], [field]: value }
    setReminders(updated)
  }

  const deleteReminder = (index: number) => {
    setReminders(reminders.filter((_, i) => i !== index))
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }

  // Show loading only when fetching an existing opportunity
  // In create mode (isCreateMode = true), we should never show loading
  if (isCreateMode) {
    // In create mode, render the form immediately
  } else if (!opportunity || loading) {
    // In edit mode, show loading while fetching opportunity data
    return (
      <div
        className="kanban-modal-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'hsl(var(--theme-text) / 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}
      >
        <div
          className="kanban-modal"
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'hsl(var(--theme-elevation-0))',
            border: '1px solid hsl(var(--theme-border-color))',
            borderRadius: 'var(--radius)',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 4px 16px hsl(var(--theme-text) / 0.2)',
            padding: '2rem',
          }}
        >
          <p>Loading opportunity details...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="kanban-modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'hsl(var(--theme-text) / 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        className="kanban-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'hsl(var(--theme-elevation-0))',
          border: '1px solid hsl(var(--theme-border-color))',
          borderRadius: 'var(--radius)',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 4px 16px hsl(var(--theme-text) / 0.2)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid hsl(var(--theme-border-color))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Opportunity Name"
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'hsl(var(--theme-text))',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              flex: 1,
              padding: '0.25rem 0',
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              color: 'hsl(var(--theme-text) / 0.6)',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
              lineHeight: 1,
              marginLeft: '1rem',
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* Basic Information */}
          <div style={{ marginBottom: '2rem' }}>
            <h3
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'hsl(var(--theme-text) / 0.7)',
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Basic Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'hsl(var(--theme-text) / 0.7)' }}>
                  Company
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'hsl(var(--theme-elevation-0))',
                    border: '1px solid hsl(var(--theme-border-color))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--theme-text))',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'hsl(var(--theme-text) / 0.7)' }}>
                  Contact Name
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'hsl(var(--theme-elevation-0))',
                    border: '1px solid hsl(var(--theme-border-color))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--theme-text))',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'hsl(var(--theme-text) / 0.7)' }}>
                  Contact Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'hsl(var(--theme-elevation-0))',
                    border: '1px solid hsl(var(--theme-border-color))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--theme-text))',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'hsl(var(--theme-text) / 0.7)' }}>
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'hsl(var(--theme-elevation-0))',
                    border: '1px solid hsl(var(--theme-border-color))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--theme-text))',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
            </div>
            {!leadId && contactEmail && contactName && (
              <div style={{ marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={handleCreateLead}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'hsl(var(--theme-elevation-1))',
                    border: '1px solid hsl(var(--theme-border-color))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--theme-text))',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Create Lead from Contact
                </button>
              </div>
            )}
            {leadId && (
              <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'hsl(var(--theme-elevation-1))', borderRadius: 'var(--radius)', fontSize: '0.875rem', color: 'hsl(var(--theme-text) / 0.7)' }}>
                ✓ Lead created (ID: {leadId})
              </div>
            )}
          </div>

          {/* Deal Information */}
          <div style={{ marginBottom: '2rem' }}>
            <h3
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'hsl(var(--theme-text) / 0.7)',
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Deal Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'hsl(var(--theme-text) / 0.7)' }}>
                  Value
                </label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value ? Number(e.target.value) : '')}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'hsl(var(--theme-elevation-0))',
                    border: '1px solid hsl(var(--theme-border-color))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--theme-text))',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'hsl(var(--theme-text) / 0.7)' }}>
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'hsl(var(--theme-elevation-0))',
                    border: '1px solid hsl(var(--theme-border-color))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--theme-text))',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'hsl(var(--theme-text) / 0.7)' }}>
                  Win Probability (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={probability}
                  onChange={(e) => setProbability(e.target.value ? Number(e.target.value) : '')}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'hsl(var(--theme-elevation-0))',
                    border: '1px solid hsl(var(--theme-border-color))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--theme-text))',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'hsl(var(--theme-text) / 0.7)' }}>
                  Expected Close Date
                </label>
                <input
                  type="date"
                  value={expectedCloseDate}
                  onChange={(e) => setExpectedCloseDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'hsl(var(--theme-elevation-0))',
                    border: '1px solid hsl(var(--theme-border-color))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--theme-text))',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'hsl(var(--theme-text) / 0.7)' }}>
                  Assigned To
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'hsl(var(--theme-elevation-0))',
                    border: '1px solid hsl(var(--theme-border-color))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--theme-text))',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'hsl(var(--theme-text) / 0.7)' }}>
                  Stage
                </label>
                <select
                  value={selectedStageId}
                  onChange={(e) => setSelectedStageId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'hsl(var(--theme-elevation-0))',
                    border: '1px solid hsl(var(--theme-border-color))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--theme-text))',
                    fontSize: '0.875rem',
                  }}
                >
                  {columns.map((column) => (
                    <option key={column.stage.id} value={column.stage.id}>
                      {column.stage.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'hsl(var(--theme-text) / 0.7)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: 0,
                }}
              >
                Tasks ({tasks.length})
              </h3>
              <button
                onClick={addTask}
                style={{
                  padding: '0.375rem 0.75rem',
                  backgroundColor: 'hsl(var(--theme-elevation-1))',
                  border: '1px solid hsl(var(--theme-border-color))',
                  borderRadius: 'var(--radius)',
                  color: 'hsl(var(--theme-text))',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                + Add Task
              </button>
            </div>
            {tasks.map((task, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  border: '1px solid hsl(var(--theme-border-color))',
                  borderRadius: 'var(--radius)',
                  marginBottom: '0.75rem',
                  backgroundColor: 'hsl(var(--theme-elevation-1))',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) => updateTask(index, 'title', e.target.value)}
                    placeholder="Task title"
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'hsl(var(--theme-elevation-0))',
                      border: '1px solid hsl(var(--theme-border-color))',
                      borderRadius: 'var(--radius)',
                      color: 'hsl(var(--theme-text))',
                      fontSize: '0.875rem',
                      marginRight: '0.5rem',
                    }}
                  />
                  <button
                    onClick={() => deleteTask(index)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'hsl(var(--theme-error-500))',
                      cursor: 'pointer',
                      fontSize: '1rem',
                    }}
                  >
                    ×
                  </button>
                </div>
                <textarea
                  value={task.description || ''}
                  onChange={(e) => updateTask(index, 'description', e.target.value)}
                  placeholder="Description"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'hsl(var(--theme-elevation-0))',
                    border: '1px solid hsl(var(--theme-border-color))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--theme-text))',
                    fontSize: '0.875rem',
                    marginBottom: '0.75rem',
                    resize: 'vertical',
                  }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  <select
                    value={task.status}
                    onChange={(e) => updateTask(index, 'status', e.target.value)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'hsl(var(--theme-elevation-0))',
                      border: '1px solid hsl(var(--theme-border-color))',
                      borderRadius: 'var(--radius)',
                      color: 'hsl(var(--theme-text))',
                      fontSize: '0.75rem',
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="inProgress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <select
                    value={task.priority}
                    onChange={(e) => updateTask(index, 'priority', e.target.value)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'hsl(var(--theme-elevation-0))',
                      border: '1px solid hsl(var(--theme-border-color))',
                      borderRadius: 'var(--radius)',
                      color: 'hsl(var(--theme-text))',
                      fontSize: '0.75rem',
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <input
                    type="date"
                    value={task.dueDate ? formatDate(task.dueDate) : ''}
                    onChange={(e) => updateTask(index, 'dueDate', e.target.value)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'hsl(var(--theme-elevation-0))',
                      border: '1px solid hsl(var(--theme-border-color))',
                      borderRadius: 'var(--radius)',
                      color: 'hsl(var(--theme-text))',
                      fontSize: '0.75rem',
                    }}
                  />
                  <select
                    value={task.assignedTo || ''}
                    onChange={(e) => updateTask(index, 'assignedTo', e.target.value || undefined)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'hsl(var(--theme-elevation-0))',
                      border: '1px solid hsl(var(--theme-border-color))',
                      borderRadius: 'var(--radius)',
                      color: 'hsl(var(--theme-text))',
                      fontSize: '0.75rem',
                    }}
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <p style={{ fontSize: '0.875rem', color: 'hsl(var(--theme-text) / 0.5)', fontStyle: 'italic' }}>
                No tasks yet. Click &quot;Add Task&quot; to create one.
              </p>
            )}
          </div>

          {/* Notes Section */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'hsl(var(--theme-text) / 0.7)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: 0,
                }}
              >
                Notes ({notes.length})
              </h3>
              <button
                onClick={addNote}
                style={{
                  padding: '0.375rem 0.75rem',
                  backgroundColor: 'hsl(var(--theme-elevation-1))',
                  border: '1px solid hsl(var(--theme-border-color))',
                  borderRadius: 'var(--radius)',
                  color: 'hsl(var(--theme-text))',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                + Add Note
              </button>
            </div>
            {notes.map((note, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  border: '1px solid hsl(var(--theme-border-color))',
                  borderRadius: 'var(--radius)',
                  marginBottom: '0.75rem',
                  backgroundColor: 'hsl(var(--theme-elevation-1))',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={note.isPrivate}
                      onChange={(e) => updateNote(index, 'isPrivate', e.target.checked)}
                      style={{ marginRight: '0.25rem' }}
                    />
                    <label style={{ fontSize: '0.75rem', color: 'hsl(var(--theme-text) / 0.7)' }}>
                      Private
                    </label>
                  </div>
                  <button
                    onClick={() => deleteNote(index)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'hsl(var(--theme-error-500))',
                      cursor: 'pointer',
                      fontSize: '1rem',
                    }}
                  >
                    ×
                  </button>
                </div>
                <textarea
                  value={note.content}
                  onChange={(e) => updateNote(index, 'content', e.target.value)}
                  placeholder="Note content"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'hsl(var(--theme-elevation-0))',
                    border: '1px solid hsl(var(--theme-border-color))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--theme-text))',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                  }}
                />
              </div>
            ))}
            {notes.length === 0 && (
              <p style={{ fontSize: '0.875rem', color: 'hsl(var(--theme-text) / 0.5)', fontStyle: 'italic' }}>
                No notes yet. Click &quot;Add Note&quot; to create one.
              </p>
            )}
          </div>

          {/* Reminders Section */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'hsl(var(--theme-text) / 0.7)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: 0,
                }}
              >
                Reminders ({reminders.length})
              </h3>
              <button
                onClick={addReminder}
                style={{
                  padding: '0.375rem 0.75rem',
                  backgroundColor: 'hsl(var(--theme-elevation-1))',
                  border: '1px solid hsl(var(--theme-border-color))',
                  borderRadius: 'var(--radius)',
                  color: 'hsl(var(--theme-text))',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                + Add Reminder
              </button>
            </div>
            {reminders.map((reminder, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  border: '1px solid hsl(var(--theme-border-color))',
                  borderRadius: 'var(--radius)',
                  marginBottom: '0.75rem',
                  backgroundColor: 'hsl(var(--theme-elevation-1))',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    value={reminder.title}
                    onChange={(e) => updateReminder(index, 'title', e.target.value)}
                    placeholder="Reminder title"
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'hsl(var(--theme-elevation-0))',
                      border: '1px solid hsl(var(--theme-border-color))',
                      borderRadius: 'var(--radius)',
                      color: 'hsl(var(--theme-text))',
                      fontSize: '0.875rem',
                      marginRight: '0.5rem',
                    }}
                  />
                  <button
                    onClick={() => deleteReminder(index)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'hsl(var(--theme-error-500))',
                      cursor: 'pointer',
                      fontSize: '1rem',
                    }}
                  >
                    ×
                  </button>
                </div>
                <textarea
                  value={reminder.description || ''}
                  onChange={(e) => updateReminder(index, 'description', e.target.value)}
                  placeholder="Description"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'hsl(var(--theme-elevation-0))',
                    border: '1px solid hsl(var(--theme-border-color))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--theme-text))',
                    fontSize: '0.875rem',
                    marginBottom: '0.75rem',
                    resize: 'vertical',
                  }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  <input
                    type="datetime-local"
                    value={reminder.reminderDate ? new Date(reminder.reminderDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => updateReminder(index, 'reminderDate', e.target.value)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'hsl(var(--theme-elevation-0))',
                      border: '1px solid hsl(var(--theme-border-color))',
                      borderRadius: 'var(--radius)',
                      color: 'hsl(var(--theme-text))',
                      fontSize: '0.75rem',
                    }}
                  />
                  <select
                    value={reminder.type}
                    onChange={(e) => updateReminder(index, 'type', e.target.value)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'hsl(var(--theme-elevation-0))',
                      border: '1px solid hsl(var(--theme-border-color))',
                      borderRadius: 'var(--radius)',
                      color: 'hsl(var(--theme-text))',
                      fontSize: '0.75rem',
                    }}
                  >
                    <option value="in-app">In-App</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="call">Call</option>
                  </select>
                  <select
                    value={reminder.status}
                    onChange={(e) => updateReminder(index, 'status', e.target.value)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'hsl(var(--theme-elevation-0))',
                      border: '1px solid hsl(var(--theme-border-color))',
                      borderRadius: 'var(--radius)',
                      color: 'hsl(var(--theme-text))',
                      fontSize: '0.75rem',
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="sent">Sent</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>
              </div>
            ))}
            {reminders.length === 0 && (
              <p style={{ fontSize: '0.875rem', color: 'hsl(var(--theme-text) / 0.5)', fontStyle: 'italic' }}>
                No reminders yet. Click &quot;Add Reminder&quot; to create one.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1.5rem',
            borderTop: '1px solid hsl(var(--theme-border-color))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
          }}
        >
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'hsl(var(--theme-elevation-1))',
              border: '1px solid hsl(var(--theme-border-color))',
              borderRadius: 'var(--radius)',
              color: 'hsl(var(--theme-text))',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: saving || !name.trim() ? 'hsl(var(--theme-elevation-2))' : 'hsl(var(--theme-success-500))',
              border: 'none',
              borderRadius: 'var(--radius)',
              color: saving || !name.trim() ? 'hsl(var(--theme-text) / 0.5)' : '#fff',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: saving || !name.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? (isCreateMode ? 'Creating...' : 'Saving...') : (isCreateMode ? 'Create Opportunity' : 'Save Changes')}
          </button>
        </div>
      </div>
    </div>
  )
}
