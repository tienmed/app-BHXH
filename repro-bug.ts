import { runDecisionEngine, EngineInput } from './packages/decision-engine/src/index';

async function test() {
    const input: EngineInput = {
        diagnoses: [{ icd: 'E11.9', label: 'Diabetes' }],
        protocols: [{
            code: 'P1',
            items: [
                { type: 'CLS', code: 'C1', name: 'Test CLS 1' },
                { type: 'CLS', code: 'C2', name: 'Test CLS 2' }
            ]
        }],
        rules: {
            claimRisk: []
        }
    };

    try {
        const output = await runDecisionEngine(input);
        console.log('OUTPUT_START');
        console.log(JSON.stringify(output, null, 2));
        console.log('OUTPUT_END');
    } catch (e) {
        console.error(e);
    }
}

test();
