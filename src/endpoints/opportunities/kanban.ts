import type { PayloadRequest } from 'payload'
import type { Endpoint } from 'payload'

// Log when module loads to verify it's being imported
console.log('[Kanban Endpoint] Module loaded - endpoint definition starting')

export interface KanbanOpportunity {
  id: string
  name: string
  value?: number
  currency?: string
  probability?: number
  expectedCloseDate?: string
  assignedTo?: {
    id: string
    email: string
    firstName?: string
    lastName?: string
  }
  company?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  leadId?: string
  stage: {
    id: string
    name: string
    color?: string
    order: number
  }
  notes?: {
    count: number
    pendingCount?: number
  }
  tasks?: {
    count: number
    pendingCount?: number
    completedCount?: number
  }
  reminders?: {
    count: number
    pendingCount?: number
  }
}

export interface KanbanColumn {
  stage: {
    id: string
    name: string
    color?: string
    order: number
  }
  opportunities: KanbanOpportunity[]
  totalValue: number
  count: number
}

export interface KanbanData {
  pipeline: {
    id: string
    name: string
  }
  columns: KanbanColumn[]
  totalOpportunities: number
  totalValue: number
}

/**
 * GET /api/kanban/opportunities
 * Get opportunities grouped by stage for Kanban view
 * 
 * Note: Using /kanban/opportunities instead of /opportunities/kanban
 * to avoid routing conflict with Payload's /opportunities/:id route
 */
export const kanbanEndpoint: Endpoint = {
  path: '/kanban/opportunities',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    console.log('[Kanban Endpoint] ========== ENDPOINT CALLED ==========')
    console.log('[Kanban Endpoint] Handler started')
    console.log('[Kanban Endpoint] Request URL:', (req as any).url)
    console.log('[Kanban Endpoint] Request method:', (req as any).method || 'GET')
    
    const { payload, user, query } = req

    if (!user) {
      console.log('[Kanban Endpoint] No user found, returning 401')
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Kanban Endpoint] User authenticated:', user.email)

    try {
      // STEP 1: Just log what we receive - don't do anything else yet
      const requestObj = req as any
      console.log('[Kanban Endpoint] === STEP 1: Logging request details ===')
      console.log('[Kanban Endpoint] query:', JSON.stringify(query, null, 2))
      console.log('[Kanban Endpoint] query type:', typeof query)
      console.log('[Kanban Endpoint] req.url:', requestObj.url)
      console.log('[Kanban Endpoint] req.request?.url:', requestObj.request?.url)
      console.log('[Kanban Endpoint] req.headers:', requestObj.headers)
      
      // STEP 2: Try to parse pipeline parameter
      let pipelineId: string | undefined
      
      // Method 1: From query object
      if (query && typeof query === 'object' && 'pipeline' in query) {
        const pipelineParam = (query as Record<string, unknown>).pipeline
        console.log('[Kanban Endpoint] Found pipeline in query.pipeline:', pipelineParam)
        pipelineId = String(pipelineParam || '').trim() || undefined
      }
      
      // Method 2: From URL string
      if (!pipelineId) {
        const urlString = requestObj.url || requestObj.request?.url
        console.log('[Kanban Endpoint] Trying to parse URL:', urlString)
        if (urlString && typeof urlString === 'string') {
          try {
            const host = requestObj.headers?.get?.('host') || requestObj.headers?.host || 'localhost:3001'
            const origin = urlString.startsWith('http') ? '' : `http://${host}`
            const url = new URL(urlString, origin)
            pipelineId = url.searchParams.get('pipeline') || undefined
            console.log('[Kanban Endpoint] Parsed pipeline from URL:', pipelineId)
          } catch (urlErr) {
            console.error('[Kanban Endpoint] URL parse error:', urlErr)
          }
        }
      }
      
      console.log('[Kanban Endpoint] Final pipelineId:', pipelineId)
      
      if (!pipelineId) {
        console.log('[Kanban Endpoint] No pipeline ID - returning error')
        return Response.json({ 
          error: 'Pipeline ID is required',
          message: 'Please provide a pipeline ID in the query parameter: ?pipeline=<pipeline-id>'
        }, { status: 400 })
      }
      
      // STEP 3: Just fetch and log pipelines - nothing else
      console.log('[Kanban Endpoint] === STEP 3: Fetching all pipelines ===')
      const allPipelines = await payload.find({
        collection: 'pipelines',
        where: {
          isActive: {
            equals: true,
          },
        },
        limit: 10,
        req,
      })
      console.log('[Kanban Endpoint] Found', allPipelines.docs.length, 'active pipelines')
      allPipelines.docs.forEach((p, idx) => {
        console.log(`[Kanban Endpoint]   Pipeline ${idx + 1}: ID=${p.id}, Name=${p.name}`)
      })
      
      // STEP 4: Handle numeric pipeline ID (convert to UUID)
      if (/^\d+$/.test(pipelineId)) {
        console.log('[Kanban Endpoint] === STEP 4: Converting numeric pipeline ID ===')
        const pipelineIndex = parseInt(pipelineId, 10) - 1
        console.log('[Kanban Endpoint] Pipeline index:', pipelineIndex, '(from input:', pipelineId + ')')
        
        if (pipelineIndex >= 0 && pipelineIndex < allPipelines.docs.length) {
          const oldPipelineId = pipelineId
          pipelineId = String(allPipelines.docs[pipelineIndex].id)
          console.log('[Kanban Endpoint] Converted', oldPipelineId, 'to UUID:', pipelineId)
        } else {
          console.log('[Kanban Endpoint] ERROR: Index out of range')
          return Response.json({ 
            error: 'Invalid pipeline index',
            message: `Pipeline index "${pipelineId}" is out of range (1-${allPipelines.docs.length})`,
            availablePipelines: allPipelines.docs.map((p, idx) => ({ 
              index: idx + 1,
              id: p.id, 
              name: p.name 
            }))
          }, { status: 400 })
        }
      }
      
      // STEP 5: Fetch the specific pipeline
      console.log('[Kanban Endpoint] === STEP 5: Fetching pipeline with ID:', pipelineId, '===')
      // TypeScript guard: pipelineId is guaranteed to be defined at this point
      if (!pipelineId) {
        return Response.json({ error: 'Pipeline ID is required' }, { status: 400 })
      }
      const pipeline = await payload.findByID({
        collection: 'pipelines',
        id: pipelineId as string | number,
        req,
      })
      console.log('[Kanban Endpoint] Pipeline found:', JSON.stringify({
        id: pipeline.id,
        name: pipeline.name,
        isActive: pipeline.isActive
      }, null, 2))
      
      // STEP 6: Fetch stages
      console.log('[Kanban Endpoint] === STEP 6: Fetching stages ===')
      const stagesResult = await payload.find({
        collection: 'stages',
        where: {
          pipeline: {
            equals: pipelineId,
          },
        },
        sort: 'order',
        req,
      })
      console.log('[Kanban Endpoint] Found', stagesResult.docs.length, 'stages')
      stagesResult.docs.forEach((s, idx) => {
        console.log(`[Kanban Endpoint]   Stage ${idx + 1}: ID=${s.id}, Name=${s.name}, Order=${s.order}`)
      })
      
      // STEP 7: Fetch opportunities
      console.log('[Kanban Endpoint] === STEP 7: Fetching opportunities ===')
      const opportunitiesResult = await payload.find({
        collection: 'opportunities',
        where: {
          pipeline: {
            equals: pipelineId,
          },
        },
        depth: 2,
        req,
      })
      console.log('[Kanban Endpoint] Found', opportunitiesResult.docs.length, 'opportunities')
      opportunitiesResult.docs.forEach((opp, idx) => {
        const stageId = typeof opp.currentStage === 'string' 
          ? opp.currentStage 
          : typeof opp.currentStage === 'object' && opp.currentStage?.id
            ? opp.currentStage.id
            : 'NO STAGE'
        console.log(`[Kanban Endpoint]   Opp ${idx + 1}: ID=${opp.id}, Name=${opp.name}, Stage=${stageId}`)
      })
      
      // STEP 8: Group opportunities by stage and format response
      console.log('[Kanban Endpoint] === STEP 8: Grouping opportunities by stage ===')
      const columns: KanbanColumn[] = stagesResult.docs.map((stage) => {
        const stageOpportunities = opportunitiesResult.docs
          .filter((opp) => {
            const oppStageId = typeof opp.currentStage === 'string' 
              ? opp.currentStage 
              : typeof opp.currentStage === 'object' && opp.currentStage?.id
                ? String(opp.currentStage.id)
                : null
            return oppStageId === String(stage.id)
          })
          .map((opp): KanbanOpportunity => {
            const assignedTo = typeof opp.assignedTo === 'object' && opp.assignedTo
              ? {
                  id: String(opp.assignedTo.id),
                  email: opp.assignedTo.email,
                  firstName: opp.assignedTo.firstName || undefined,
                  lastName: opp.assignedTo.lastName || undefined,
                }
              : undefined

            const leadId = typeof opp.lead === 'string' 
              ? opp.lead 
              : typeof opp.lead === 'object' && opp.lead?.id
                ? String(opp.lead.id)
                : undefined

            // Process notes
            const notesArray = Array.isArray(opp.notes) ? opp.notes : []
            const notes = notesArray.length > 0 ? {
              count: notesArray.length,
              pendingCount: notesArray.length, // All notes are considered "pending" for display
            } : undefined

            // Process tasks
            const tasksArray = Array.isArray(opp.tasks) ? opp.tasks : []
            const tasks = tasksArray.length > 0 ? {
              count: tasksArray.length,
              pendingCount: tasksArray.filter((t) => t.status && t.status !== 'completed' && t.status !== 'cancelled').length,
              completedCount: tasksArray.filter((t) => t.status === 'completed').length,
            } : undefined

            // Process reminders
            const remindersArray = Array.isArray(opp.reminders) ? opp.reminders : []
            const reminders = remindersArray.length > 0 ? {
              count: remindersArray.length,
              pendingCount: remindersArray.filter((r) => r.status === 'pending').length,
            } : undefined

            return {
              id: String(opp.id),
              name: opp.name,
              value: opp.value ?? undefined,
              currency: opp.currency ?? undefined,
              probability: opp.probability ?? undefined,
              expectedCloseDate: opp.expectedCloseDate ?? undefined,
              assignedTo,
              company: opp.company ?? undefined,
              contactName: opp.contactName ?? undefined,
              contactEmail: opp.contactEmail ?? undefined,
              contactPhone: opp.contactPhone ?? undefined,
              leadId,
              notes,
              tasks,
              reminders,
              stage: {
                id: String(stage.id),
                name: stage.name,
                color: stage.color ?? undefined,
                order: stage.order,
              },
            }
          })

        const totalValue = stageOpportunities.reduce((sum, opp) => sum + (opp.value || 0), 0)

        return {
          stage: {
            id: String(stage.id),
            name: stage.name,
            color: stage.color ?? undefined,
            order: stage.order,
          },
          opportunities: stageOpportunities,
          totalValue,
          count: stageOpportunities.length,
        }
      })

      console.log('[Kanban Endpoint] Created', columns.length, 'columns')
      columns.forEach((col, idx) => {
        console.log(`[Kanban Endpoint]   Column ${idx + 1}: ${col.stage.name} - ${col.count} opportunities`)
      })

      // Calculate totals
      const totalOpportunities = opportunitiesResult.docs.length
      const totalValue = opportunitiesResult.docs.reduce((sum, opp) => sum + (opp.value || 0), 0)

      console.log('[Kanban Endpoint] === STEP 9: Returning formatted response ===')
      const result: KanbanData = {
        pipeline: {
          id: String(pipeline.id),
          name: pipeline.name,
        },
        columns,
        totalOpportunities,
        totalValue,
      }

      return Response.json(result)
    } catch (error) {
      console.error('[Kanban Endpoint] ========== ERROR ==========')
      console.error('[Kanban Endpoint] Error:', error)
      console.error('[Kanban Endpoint] Error message:', error instanceof Error ? error.message : 'Unknown error')
      console.error('[Kanban Endpoint] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      return Response.json(
        {
          error: 'Failed to fetch Kanban data',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
        { status: 500 }
      )
    }
  },
}

/**
 * PATCH /api/kanban/opportunities/stage
 * Update opportunity stage
 * Body: { opportunityId: string, stageId: string }
 */
export const updateStageEndpoint: Endpoint = {
  path: '/kanban/opportunities/stage',
  method: 'patch',
  handler: async (req: PayloadRequest) => {
    console.log('[UpdateStage Endpoint] ========== ENDPOINT CALLED ==========')
    console.log('[UpdateStage Endpoint] Handler started')
    
    const { payload, user } = req

    if (!user) {
      console.log('[UpdateStage Endpoint] No user found, returning 401')
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[UpdateStage Endpoint] User authenticated:', user.email)

    try {
      let body: { opportunityId?: string | number; newStageId?: string | number }
      if (typeof req.json === 'function') {
        body = await req.json()
      } else if ((req as { request?: { json?: () => Promise<{ opportunityId?: string | number; newStageId?: string | number }> } }).request?.json) {
        body = await (req as { request: { json: () => Promise<{ opportunityId?: string | number; newStageId?: string | number }> } }).request.json()
      } else {
        console.log('[UpdateStage Endpoint] ERROR: Cannot read request body')
        return Response.json({ error: 'Request body is required' }, { status: 400 })
      }
      
      if (!body) {
        console.log('[UpdateStage Endpoint] ERROR: No request body')
        return Response.json({ error: 'Request body is required' }, { status: 400 })
      }
      console.log('[UpdateStage Endpoint] Request body:', body)
      
      const { opportunityId, newStageId: stageId } = body
      console.log('[UpdateStage Endpoint] Opportunity ID:', opportunityId)
      console.log('[UpdateStage Endpoint] Stage ID:', stageId)

      if (!opportunityId) {
        console.log('[UpdateStage Endpoint] ERROR: No opportunity ID')
        return Response.json({ error: 'Opportunity ID is required' }, { status: 400 })
      }

      if (!stageId) {
        console.log('[UpdateStage Endpoint] ERROR: No stage ID')
        return Response.json({ error: 'Stage ID is required' }, { status: 400 })
      }

      // Get current opportunity
      console.log('[UpdateStage Endpoint] Fetching opportunity:', opportunityId)
      const opportunity = await payload.findByID({
        collection: 'opportunities',
        id: opportunityId,
        depth: 1,
        req,
      })
      console.log('[UpdateStage Endpoint] Opportunity found:', opportunity.name)

      // Validate stage belongs to same pipeline
      console.log('[UpdateStage Endpoint] Fetching stage with ID:', stageId, 'Type:', typeof stageId)
      
      // If stageId is numeric (like "1"), try to find the actual stage UUID from the opportunity's pipeline
      let actualStageId = stageId
      let newStage
      
      try {
        newStage = await payload.findByID({
          collection: 'stages',
          id: stageId,
          depth: 1,
          req,
        })
        console.log('[UpdateStage Endpoint] Stage found via findByID:', newStage.name, 'ID:', newStage.id)
        actualStageId = String(newStage.id)
      } catch (findError) {
        console.log('[UpdateStage Endpoint] findByID failed, trying to find stage by index in pipeline...')
        // If findByID fails, the stageId might be a numeric index
        // Get the opportunity's pipeline and find the stage by index
        const pipelineId = typeof opportunity.pipeline === 'string' 
          ? opportunity.pipeline 
          : typeof opportunity.pipeline === 'object' && opportunity.pipeline?.id
            ? opportunity.pipeline.id
            : null
        
        if (pipelineId && /^\d+$/.test(String(stageId))) {
          const stagesResult = await payload.find({
            collection: 'stages',
            where: {
              pipeline: {
                equals: pipelineId,
              },
            },
            sort: 'order',
            req,
          })
          
          const stageIndex = parseInt(String(stageId), 10) - 1
          if (stageIndex >= 0 && stageIndex < stagesResult.docs.length) {
            newStage = stagesResult.docs[stageIndex]
            actualStageId = String(newStage.id)
            console.log('[UpdateStage Endpoint] Stage found via index:', newStage.name, 'Actual ID:', actualStageId)
          } else {
            throw new Error(`Stage index ${stageId} is out of range`)
          }
        } else {
          throw findError
        }
      }

      const pipelineId = typeof opportunity.pipeline === 'string' 
        ? opportunity.pipeline 
        : typeof opportunity.pipeline === 'object' && opportunity.pipeline?.id
          ? opportunity.pipeline.id
          : null

      const stagePipelineId = typeof newStage.pipeline === 'string' 
        ? newStage.pipeline 
        : typeof newStage.pipeline === 'object' && newStage.pipeline?.id
          ? newStage.pipeline.id
          : null

      console.log('[UpdateStage Endpoint] Pipeline IDs - Opportunity:', pipelineId, 'Stage:', stagePipelineId)
      console.log('[UpdateStage Endpoint] Pipeline ID types - Opportunity:', typeof pipelineId, 'Stage:', typeof stagePipelineId)
      console.log('[UpdateStage Endpoint] Stage ID - Input:', stageId, 'Actual:', actualStageId)
      console.log('[UpdateStage Endpoint] Stage details - Name:', newStage.name, 'Pipeline:', stagePipelineId)

      // Convert to strings for comparison
      const pipelineIdStr = pipelineId ? String(pipelineId) : null
      const stagePipelineIdStr = stagePipelineId ? String(stagePipelineId) : null

      console.log('[UpdateStage Endpoint] Comparing pipeline IDs (strings):', {
        opportunityPipeline: pipelineIdStr,
        stagePipeline: stagePipelineIdStr,
        match: pipelineIdStr === stagePipelineIdStr
      })

      if (pipelineIdStr && stagePipelineIdStr && pipelineIdStr !== stagePipelineIdStr) {
        console.log('[UpdateStage Endpoint] ERROR: Pipeline mismatch')
        console.log('[UpdateStage Endpoint] Opportunity pipeline ID:', pipelineIdStr)
        console.log('[UpdateStage Endpoint] Stage pipeline ID:', stagePipelineIdStr)
        return Response.json(
          { 
            error: 'Stage must belong to the same pipeline as the opportunity',
            details: {
              opportunityPipeline: pipelineIdStr,
              stagePipeline: stagePipelineIdStr,
              stageName: newStage.name
            }
          },
          { status: 400 }
        )
      }

      if (!pipelineIdStr) {
        console.log('[UpdateStage Endpoint] ERROR: No pipeline ID found on opportunity')
        return Response.json(
          { error: 'Opportunity must have a pipeline assigned' },
          { status: 400 }
        )
      }

      // Update opportunity stage
      // Include pipeline in update data so validation hook can check stage belongs to pipeline
      console.log('[UpdateStage Endpoint] Updating opportunity stage...')
      
      // Determine the correct type for IDs based on what Payload expects
      // Check the actual type of IDs in the database
      const opportunityIdType = typeof opportunity.id
      const stageIdType = typeof newStage.id
      const pipelineIdType = typeof pipelineId
      
      console.log('[UpdateStage Endpoint] ID types - Opportunity:', opportunityIdType, 'Stage:', stageIdType, 'Pipeline:', pipelineIdType)
      
      const updateData: Record<string, unknown> = {
        // Use the actual stage ID with proper type
        currentStage: stageIdType === 'number' ? Number(actualStageId) : actualStageId,
      }
      
      // Include pipeline if it exists (for validation hook)
      if (pipelineId) {
        // Use the same type as the opportunity's pipeline ID
        updateData.pipeline = pipelineIdType === 'number' ? Number(pipelineId) : String(pipelineId)
      }
      
      console.log('[UpdateStage Endpoint] Update data:', updateData)
      console.log('[UpdateStage Endpoint] Update data types:', {
        currentStage: typeof updateData.currentStage,
        pipeline: typeof updateData.pipeline
      })
      
      const updated = await payload.update({
        collection: 'opportunities',
        id: opportunityIdType === 'number' ? Number(opportunityId) : String(opportunityId),
        data: updateData,
        req,
      })

      console.log('[UpdateStage Endpoint] Update successful')
      return Response.json({
        success: true,
        opportunity: updated,
      })
    } catch (error) {
      console.error('[UpdateStage Endpoint] ========== ERROR ==========')
      console.error('[UpdateStage Endpoint] Error:', error)
      console.error('[UpdateStage Endpoint] Error message:', error instanceof Error ? error.message : 'Unknown error')
      console.error('[UpdateStage Endpoint] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      
      return Response.json(
        {
          error: 'Failed to update opportunity stage',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
        { status: 500 }
      )
    }
  },
}

