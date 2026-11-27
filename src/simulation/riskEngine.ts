// Thin re-export: the risk engine lives in ./simulation/ grouped by theme
// (time, microclimate, decisions, stepping). Public API unchanged.
export { formatSimTime, getDayPhaseLabel, getNightFactor } from './time';
export { computeMicroclimate, estimateDryMinutes } from './microclimate';
export { evaluateAiotDecision, evaluateCanopyLeafCondition } from './decisions';
export { advanceOneDay, stepSimulation } from './stepping';
