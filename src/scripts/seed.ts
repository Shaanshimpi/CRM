/**
 * Seed script for CRM data
 * Creates pipelines, stages, and leads for testing
 * 
 * Usage: pnpm seed
 * 
 * Make sure you have a .env file with:
 * - PAYLOAD_SECRET (required)
 * - DATABASE_URI (required)
 * - PAYLOAD_PUBLIC_SERVER_URL (optional, defaults to http://localhost:3000)
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../payload.config.js'
import type { Payload } from 'payload'

// Sample data
const pipelineData = [
  {
    name: 'Sales Pipeline',
    description: 'Main sales pipeline for B2B opportunities',
    color: '#6366f1',
    isActive: true,
    stages: [
      { name: 'New Lead', order: 0, color: '#94a3b8', isDefault: true, description: 'Newly acquired lead' },
      { name: 'Qualified', order: 1, color: '#3b82f6', description: 'Lead has been qualified' },
      { name: 'Proposal', order: 2, color: '#8b5cf6', description: 'Proposal sent to client' },
      { name: 'Negotiation', order: 3, color: '#f59e0b', description: 'In negotiation phase' },
      { name: 'Closed Won', order: 4, color: '#10b981', isClosedStage: true, closedType: 'won', description: 'Deal won' },
      { name: 'Closed Lost', order: 5, color: '#ef4444', isClosedStage: true, closedType: 'lost', description: 'Deal lost' },
    ],
  },
  {
    name: 'Marketing Pipeline',
    description: 'Marketing qualified leads and campaigns',
    color: '#8b5cf6',
    isActive: true,
    stages: [
      { name: 'MQL', order: 0, color: '#94a3b8', isDefault: true, description: 'Marketing Qualified Lead' },
      { name: 'Engaged', order: 1, color: '#3b82f6', description: 'Lead has engaged with content' },
      { name: 'Nurturing', order: 2, color: '#8b5cf6', description: 'Lead in nurturing campaign' },
      { name: 'SQL', order: 3, color: '#f59e0b', description: 'Sales Qualified Lead' },
      { name: 'Converted', order: 4, color: '#10b981', isClosedStage: true, closedType: 'won', description: 'Converted to customer' },
    ],
  },
  {
    name: 'Customer Success Pipeline',
    description: 'Upsell and expansion opportunities',
    color: '#10b981',
    isActive: true,
    stages: [
      { name: 'Identified', order: 0, color: '#94a3b8', isDefault: true, description: 'Upsell opportunity identified' },
      { name: 'Discovery', order: 1, color: '#3b82f6', description: 'Discovery call scheduled' },
      { name: 'Proposal', order: 2, color: '#8b5cf6', description: 'Proposal sent' },
      { name: 'Approval', order: 3, color: '#f59e0b', description: 'Awaiting approval' },
      { name: 'Closed', order: 4, color: '#10b981', isClosedStage: true, closedType: 'won', description: 'Upsell completed' },
    ],
  },
]

const leadSources = ['website', 'referral', 'cold-call', 'email-campaign', 'social-media', 'trade-show', 'partner', 'other']
const leadStatuses = ['new', 'contacted', 'qualified', 'unqualified']
const jobTitles = [
  'CEO', 'CTO', 'CFO', 'CMO', 'VP of Sales', 'VP of Marketing', 'Director of Operations',
  'Product Manager', 'Sales Manager', 'Marketing Manager', 'Business Development Manager',
  'Account Executive', 'Sales Representative', 'Marketing Specialist', 'Operations Manager',
]
const companies = [
  'Acme Corporation', 'TechStart Inc', 'Global Solutions Ltd', 'Digital Innovations',
  'Cloud Services Co', 'Enterprise Systems', 'Future Tech', 'Smart Solutions',
  'Innovation Labs', 'NextGen Industries', 'Prime Technologies', 'Advanced Systems',
  'Mega Corp', 'StartupHub', 'Business Pro', 'TechVenture', 'Digital Dynamics',
  'CloudFirst', 'DataDriven Inc', 'AI Solutions', 'Blockchain Ventures',
]

const firstNames = [
  'Raj', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Rahul', 'Kavya',
  'Arjun', 'Meera', 'Siddharth', 'Divya', 'Karan', 'Isha', 'Rohan', 'Neha',
  'Aditya', 'Pooja', 'Varun', 'Shreya', 'Nikhil', 'Tanvi', 'Sahil', 'Ananya',
]
const lastNames = [
  'Sharma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Verma', 'Reddy', 'Mehta',
  'Joshi', 'Malhotra', 'Agarwal', 'Kapoor', 'Chopra', 'Nair', 'Iyer', 'Rao',
  'Desai', 'Shah', 'Bansal', 'Arora', 'Saxena', 'Tiwari', 'Mishra', 'Pandey',
]

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad']
const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal', 'Gujarat']

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function generateEmail(firstName: string, lastName: string, company: string): string {
  const domain = company.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}.com`
}

function generatePhone(): string {
  const digits = Math.floor(1000000000 + Math.random() * 9000000000)
  return `+91 ${digits.toString().slice(0, 5)} ${digits.toString().slice(5)}`
}

async function seed() {
  console.log('🌱 Starting seed process...\n')

  // Check for required environment variables
  if (!process.env.PAYLOAD_SECRET) {
    console.error('❌ Missing required environment variable: PAYLOAD_SECRET')
    console.error('   Please create a .env file with PAYLOAD_SECRET set')
    console.error('   Example: PAYLOAD_SECRET=your-secret-key-here')
    process.exit(1)
  }

  if (!process.env.DATABASE_URI) {
    console.error('❌ Missing required environment variable: DATABASE_URI')
    console.error('   Please create a .env file with DATABASE_URI set')
    console.error('   Example: DATABASE_URI=postgresql://user:password@localhost:5432/crm')
    process.exit(1)
  }

  let payload: Payload
  try {
    const config = await configPromise
    payload = await getPayload({ config })
    console.log('✅ Connected to Payload\n')
  } catch (error) {
    console.error('❌ Failed to connect to Payload:', error)
    if (error instanceof Error && error.message.includes('secret')) {
      console.error('\n   Make sure PAYLOAD_SECRET is set in your .env file')
    }
    if (error instanceof Error && error.message.includes('database')) {
      console.error('\n   Make sure DATABASE_URI is set correctly in your .env file')
    }
    process.exit(1)
  }

  try {
    // Get or create a default user for assignments
    let defaultUser
    const users = await payload.find({
      collection: 'users',
      limit: 1,
    })

    if (users.docs.length > 0) {
      defaultUser = users.docs[0]
      console.log(`✅ Using existing user: ${defaultUser.email}`)
    } else {
      console.log('⚠️  No users found. Please create a user first in the admin panel.')
      console.log('   The seed script will continue but leads will not be assigned.\n')
    }

    // Create Pipelines and Stages
    const createdPipelines: { id: number; name: string }[] = []
    
    for (const pipelineInfo of pipelineData) {
      console.log(`📊 Creating pipeline: ${pipelineInfo.name}...`)
      
      // Check if pipeline already exists
      const existingPipeline = await payload.find({
        collection: 'pipelines',
        where: {
          name: {
            equals: pipelineInfo.name,
          },
        },
        limit: 1,
      })

      let pipeline
      if (existingPipeline.docs.length > 0) {
        console.log(`   ⚠️  Pipeline "${pipelineInfo.name}" already exists, skipping...`)
        pipeline = existingPipeline.docs[0]
      } else {
        pipeline = await payload.create({
          collection: 'pipelines',
          data: {
            name: pipelineInfo.name,
            description: pipelineInfo.description,
            color: pipelineInfo.color,
            isActive: pipelineInfo.isActive,
          },
        })
        console.log(`   ✅ Created pipeline: ${pipeline.name}`)
      }

      createdPipelines.push({ id: pipeline.id as number, name: pipeline.name })

      // Create Stages for this pipeline
      let defaultStageId: number | null = null
      
      for (const stageInfo of pipelineInfo.stages) {
        // Check if stage already exists
        const existingStage = await payload.find({
          collection: 'stages',
          where: {
            and: [
              {
                pipeline: {
                  equals: pipeline.id,
                },
              },
              {
                name: {
                  equals: stageInfo.name,
                },
              },
            ],
          },
          limit: 1,
        })

        if (existingStage.docs.length > 0) {
          console.log(`   ⚠️  Stage "${stageInfo.name}" already exists, skipping...`)
          if (stageInfo.isDefault) {
            defaultStageId = existingStage.docs[0].id as number
          }
          continue
        }

        const stage = await payload.create({
          collection: 'stages',
          data: {
            name: stageInfo.name,
            pipeline: pipeline.id,
            order: stageInfo.order,
            color: stageInfo.color,
            description: stageInfo.description,
            isDefault: stageInfo.isDefault || false,
            isClosedStage: stageInfo.isClosedStage || false,
            closedType: (stageInfo.closedType as 'won' | 'lost' | undefined) || undefined,
          },
        })

        if (stageInfo.isDefault) {
          defaultStageId = stage.id as number
        }

        console.log(`   ✅ Created stage: ${stage.name} (order: ${stage.order})`)
      }

      // Update pipeline with default stage if we have one
      if (defaultStageId) {
        await payload.update({
          collection: 'pipelines',
          id: pipeline.id,
          data: {
            defaultStage: defaultStageId,
          },
        })
        console.log(`   ✅ Set default stage for pipeline: ${pipeline.name}`)
      }

      console.log('')
    }

    // Create Leads
    console.log('👥 Creating leads...\n')
    const leadsToCreate = 20
    let createdLeads = 0
    let skippedLeads = 0

    for (let i = 0; i < leadsToCreate; i++) {
      const firstName = getRandomItem(firstNames)
      const lastName = getRandomItem(lastNames)
      const company = getRandomItem(companies)
      const email = generateEmail(firstName, lastName, company)
      const phone = generatePhone()
      const source = getRandomItem(leadSources) as 'website' | 'referral' | 'cold-call' | 'email-campaign' | 'social-media' | 'trade-show' | 'partner' | 'other'
      const status = getRandomItem(leadStatuses) as 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted'
      const jobTitle = getRandomItem(jobTitles)
      const city = getRandomItem(cities)
      const state = getRandomItem(states)
      const tags = getRandomItems(['high-priority', 'enterprise', 'startup', 'mid-market', 'qualified', 'hot'], Math.floor(Math.random() * 3) + 1)

      // Check if lead with this email already exists
      const existingLead = await payload.find({
        collection: 'leads',
        where: {
          email: {
            equals: email,
          },
        },
        limit: 1,
      })

      if (existingLead.docs.length > 0) {
        skippedLeads++
        continue
      }

      try {
        await payload.create({
          collection: 'leads',
          data: {
            firstName,
            lastName,
            email,
            phone,
            company,
            jobTitle,
            source,
            status,
            assignedTo: defaultUser?.id || undefined,
            address: {
              street: `${Math.floor(Math.random() * 999) + 1} Main Street`,
              city,
              state,
              zip: `${Math.floor(100000 + Math.random() * 900000)}`,
              country: 'India',
            },
            tags,
          },
        })
        createdLeads++
        console.log(`   ✅ Created lead: ${firstName} ${lastName} (${company})`)
      } catch (error) {
        console.error(`   ❌ Failed to create lead ${firstName} ${lastName}:`, error)
      }
    }

    // Create Opportunities
    console.log('💼 Creating opportunities...\n')
    const opportunitiesToCreate = 30 // Total opportunities across all pipelines
    let createdOpportunities = 0
    let skippedOpportunities = 0

    // Get all created leads for potential linking
    const allLeads = await payload.find({
      collection: 'leads',
      limit: 100,
    })

    // Get all stages grouped by pipeline
    const allStages = await payload.find({
      collection: 'stages',
      depth: 1,
      limit: 100,
    })

    // Group stages by pipeline
    const stagesByPipeline = new Map<number, typeof allStages.docs>()
    for (const stage of allStages.docs) {
      const pipelineId = typeof stage.pipeline === 'number' 
        ? stage.pipeline 
        : typeof stage.pipeline === 'object' && stage.pipeline?.id
          ? stage.pipeline.id as number
          : null
      
      if (pipelineId !== null) {
        if (!stagesByPipeline.has(pipelineId)) {
          stagesByPipeline.set(pipelineId, [])
        }
        stagesByPipeline.get(pipelineId)?.push(stage)
      }
    }

    for (const pipeline of createdPipelines) {
      const pipelineStages = stagesByPipeline.get(pipeline.id) || []
      if (pipelineStages.length === 0) {
        console.log(`   ⚠️  No stages found for pipeline "${pipeline.name}", skipping opportunities...`)
        continue
      }

      // Create opportunities for this pipeline (distribute across pipelines)
      const opportunitiesPerPipeline = Math.ceil(opportunitiesToCreate / createdPipelines.length)
      
      for (let i = 0; i < opportunitiesPerPipeline; i++) {
        const firstName = getRandomItem(firstNames)
        const lastName = getRandomItem(lastNames)
        const company = getRandomItem(companies)
        const opportunityName = `${company} - ${getRandomItem(['Enterprise Deal', 'Annual Contract', 'SaaS Subscription', 'Service Package', 'Product License', 'Partnership'])}`
        
        // Get a random stage from this pipeline
        const stage = getRandomItem(pipelineStages)
        
        // Calculate value (1000 to 500000)
        const value = Math.floor(Math.random() * 499000) + 1000
        const currency = getRandomItem(['INR', 'USD', 'EUR', 'GBP']) as 'INR' | 'USD' | 'EUR' | 'GBP'
        
        // Probability based on stage order (later stages = higher probability)
        const maxProbability = Math.min(30 + (stage.order * 15), 90)
        const probability = Math.floor(Math.random() * (maxProbability - 20)) + 20
        
        // Expected close date (15-90 days from now)
        const daysUntilClose = Math.floor(Math.random() * 75) + 15
        const expectedCloseDate = new Date()
        expectedCloseDate.setDate(expectedCloseDate.getDate() + daysUntilClose)
        
        // Sometimes link to a lead
        const linkedLead = Math.random() > 0.5 && allLeads.docs.length > 0 
          ? getRandomItem(allLeads.docs)
          : null
        
        // Check if opportunity with this name already exists
        const existingOpportunity = await payload.find({
          collection: 'opportunities',
          where: {
            name: {
              equals: opportunityName,
            },
          },
          limit: 1,
        })

        if (existingOpportunity.docs.length > 0) {
          skippedOpportunities++
          continue
        }

        try {
          await payload.create({
            collection: 'opportunities',
            data: {
              name: opportunityName,
              lead: linkedLead?.id || undefined,
              pipeline: pipeline.id as number,
              currentStage: stage.id as number,
              value,
              currency,
              probability,
              expectedCloseDate: expectedCloseDate.toISOString(),
              assignedTo: defaultUser?.id || undefined,
              company,
              contactName: `${firstName} ${lastName}`,
              contactEmail: generateEmail(firstName, lastName, company),
              contactPhone: generatePhone(),
              tags: getRandomItems(['enterprise', 'high-value', 'hot', 'qualified', 'mid-market'], Math.floor(Math.random() * 3) + 1),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
          })
          createdOpportunities++
          console.log(`   ✅ Created opportunity: ${opportunityName} (${company}) in ${pipeline.name} - ${stage.name}`)
        } catch (error) {
          console.error(`   ❌ Failed to create opportunity ${opportunityName}:`, error)
        }
      }
    }

    console.log('')
    console.log('📊 Seed Summary:')
    console.log(`   Pipelines: ${createdPipelines.length} created`)
    console.log(`   Stages: ${pipelineData.reduce((sum, p) => sum + p.stages.length, 0)} total stages`)
    console.log(`   Leads: ${createdLeads} created, ${skippedLeads} skipped (duplicates)`)
    console.log(`   Opportunities: ${createdOpportunities} created, ${skippedOpportunities} skipped (duplicates)`)
    console.log('')
    console.log('✅ Seed process completed successfully!')
    console.log('')
    console.log('You can now:')
    console.log('   1. View pipelines in /admin/collections/pipelines')
    console.log('   2. View stages in /admin/collections/stages')
    console.log('   3. View leads in /admin/collections/leads')
    console.log('   4. View opportunities in /admin/collections/opportunities')
    console.log('   5. View opportunities in Kanban view at /admin/collections/opportunities/kanban')
    console.log('')

    process.exit(0)
  } catch (error) {
    console.error('❌ Seed process failed:', error)
    process.exit(1)
  }
}

// Run seed
seed().catch((error) => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})

