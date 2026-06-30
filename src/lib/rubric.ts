export interface RubricCriterion {
  key: string;
  label: string;
  desc: string;
  max: number;
}

export const RUBRIC_DEFINITIONS: Record<string, RubricCriterion> = {
  // Round 1 & 2
  functionality: { key: 'functionality', label: 'Functionality', desc: 'Does the application work properly and behave exactly as intended?', max: 25 },
  code_quality: { key: 'code_quality', label: 'Code Quality', desc: 'Is the codebase organized, readable, and cleanly structured?', max: 20 },
  integration: { key: 'integration', label: 'Integration', desc: 'Do frontend, backend, and DB connect correctly?', max: 20 },
  ux: { key: 'ux', label: 'User Experience', desc: 'Is the application highly usable with a smooth flow?', max: 20 },
  architecture: { key: 'architecture', label: 'Architecture & Logic', desc: 'Are the DB schema, API routing, and data flow logically designed?', max: 15 },
  
  // Round 3
  presentation: { key: 'presentation', label: 'Presentation', desc: 'Quality of the final pitch and demo.', max: 25 },
  e2e_functionality: { key: 'e2e_functionality', label: 'End-to-End Functionality', desc: 'Does the final application work from start to finish?', max: 25 },
  product_flow: { key: 'product_flow', label: 'Product Flow', desc: 'Is the user flow smooth and are features purposeful?', max: 25 },
  arch_understanding: { key: 'arch_understanding', label: 'Architecture Understanding', desc: 'Can they articulate system design decisions?', max: 25 },
  
  setup: { key: 'setup', label: 'Setup', desc: 'Is the development environment set up correctly?', max: 10 },
}

export function getCriteriaForRubric(keys: string[]): RubricCriterion[] {
  if (!Array.isArray(keys)) return []
  return keys.map((key) => {
    return (
      RUBRIC_DEFINITIONS[key] || {
        key,
        label: key
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        desc: `Evaluate based on ${key.replace(/_/g, ' ')}`,
        max: 10,
      }
    )
  })
}

export function getMaxScoreForRubric(keys: string[]): number {
  return getCriteriaForRubric(keys).reduce((sum, criterion) => sum + criterion.max, 0)
}
