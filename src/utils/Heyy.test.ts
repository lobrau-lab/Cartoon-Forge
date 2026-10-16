import { expect, test, describe } from 'vitest';
import { mapCognitiveContextToPredictiveAgent, CognitiveContext } from './Heyy';

describe('mapCognitiveContextToPredictiveAgent', () => {
    test('maps synergy enterprise cognitive', () => {
        const context: CognitiveContext = { intent: 'synergy', scale: 'enterprise', mode: 'cognitive' };
        expect(mapCognitiveContextToPredictiveAgent(context)).toBe('Predictive Agent Alpha: Synergy');
    });

    test('maps disruption global', () => {
        const context: CognitiveContext = { intent: 'disruption', scale: 'global' };
        expect(mapCognitiveContextToPredictiveAgent(context)).toBe('Predictive Agent Theta: Global Disrupter');
    });

    test('maps fallback absolute default', () => {
        const context: CognitiveContext = { intent: 'unknown' };
        expect(mapCognitiveContextToPredictiveAgent(context)).toBe('Predictive Agent Epsilon-2: Absolute Default');
    });
});
