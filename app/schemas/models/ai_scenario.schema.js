// WARNING: This file is auto-generated from within AI HackStack. Do not edit directly.
// Instead, edit the corresponding Zod schema in the HackStack repo and run `npm run build` or `npm run build:schemas
//
// Last updated: 2024-10-03T19:41:05.121Z

const _ = require('lodash')
const c = require('./../schemas')

const AIScenarioSchema = c.object({
  title: 'AI Scenario',
  description: 'A generative AI scenario',
})

_.extend(AIScenarioSchema.properties, {
  persona: {
    title: 'Persona',
    type: 'string',
    description: 'Which persona this scenario is for (kid, teacher, parent, etc.)',
  },
  mode: {
    title: 'Mode',
    type: 'string',
    description: 'Which mode this scenario is for (learn to use, practice using, etc.)',
    enum: ['learn to use', 'practice using', 'use', 'teach how to use'],
  },
  tool: {
    title: 'Tool',
    type: 'string',
    description:
      'Which generative AI tool this scenario is for (ChatGPT 4, ChatGPT 3.5, Stable Diffusion, DALL-E 2, etc.)',
    minLength: 1,
  },
  task: {
    title: 'Task',
    type: 'string',
    description: 'Which task verb this scenario is for (make, edit, explain, etc.)',
    minLength: 1,
  },
  doc: {
    title: 'Doc',
    type: 'string',
    description: 'Which document type this scenario is for (a webpage, an essay, an image, etc.))',
    minLength: 1,
  },
  releasePhase: {
    title: 'Release Phase',
    type: 'string',
    description:
      'Scenarios are initially created as drafts, start off publicly in beta, then are released when they are completed',
    enum: ['beta', 'released', 'draft'],
  },
  labels: c.array({ title: 'Labels', description: 'Labels to help categorize this scenario', uniqueItems: true }, {
    type: 'string',
    enum: ['advertise', 'code', 'graph', 'draw', 'write', 'simulate', 'model', 'study', 'solve', 'learn'],
  }),
  initialActionQueue: {
    title: 'Initial Action Queue',
    type: 'array',
    description: 'Actions to add to a project when it is created from this scenario',
    items: { type: ['object', 'string'], format: 'chat-message-link' },
  },
  archived: { title: 'Archived', type: 'boolean' },
  i18n: {
    title: 'I18n',
    type: 'object',
    description: 'Help translate this property',
    format: 'i18n',
    props: ['mode', 'task', 'doc', 'name', 'description'],
  },
  coverImage: {
    title: 'Cover Image',
    type: 'string',
    description: 'The cover image for this scenario',
    format: 'image-file',
    inEditor: 'codecombat',
  },
  priority: { title: 'Priority', type: 'integer', description: 'Lower numbers will show earlier.' },
  promptType: {
    title: 'Prompt Type',
    type: 'string',
    description: 'The type of system prompt that will be used for this project',
    enum: ['math_1', 'math_2', 'english_1', 'english_2', 'code_1', 'code_2'],
  },
})

AIScenarioSchema.required = ['mode', 'tool', 'task', 'doc', 'releasePhase', 'initialActionQueue']

c.extendNamedProperties(AIScenarioSchema, 'ai_scenario')
c.extendBasicProperties(AIScenarioSchema, 'ai_scenario')
c.extendSearchableProperties(AIScenarioSchema, 'ai_scenario')
c.extendVersionedProperties(AIScenarioSchema, 'ai_scenario')
c.extendPatchableProperties(AIScenarioSchema, 'ai_scenario')
c.extendTranslationCoverageProperties(AIScenarioSchema, 'ai_scenario')

module.exports = AIScenarioSchema
