/**
 * Master Persona Simulation & Adversarial Runner
 * Executes all 3 customer persona journeys and adversarial stress tests,
 * generating consolidated metrics and log files.
 */

import { runPersonaA } from './persona_a_epc_contractor.js';
import { runPersonaB } from './persona_b_repeat_client.js';
import { runPersonaC } from './persona_c_mobile_supervisor.js';
import { runAdversarialStressSuite } from './adversarial_stress_suite.js';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('C:/Users/gupta/.gemini/antigravity/scratch/urbanspan-website/.agents/challenger_personas');

async function runAll() {
  console.log('################################################################');
  console.log('# URBANSPAN MASTER CUSTOMER PERSONA SIMULATION & AUDIT SUITE   #');
  console.log('# Environments: Live Production & Headless API Gateway         #');
  console.log('################################################################\n');

  const suiteResults = {
    startedAt: new Date().toISOString(),
    completedAt: null,
    overallPassed: false,
    personas: {}
  };

  // Run Persona A
  try {
    console.log('\n>>> RUNNING PERSONA A (EPC CONTRACTOR)...');
    suiteResults.personas.personaA = await runPersonaA();
  } catch (err) {
    console.error('Persona A Execution Error:', err);
    suiteResults.personas.personaA = { passed: false, error: err.message };
  }

  // Run Persona B
  try {
    console.log('\n>>> RUNNING PERSONA B (REPEAT CLIENT)...');
    suiteResults.personas.personaB = await runPersonaB();
  } catch (err) {
    console.error('Persona B Execution Error:', err);
    suiteResults.personas.personaB = { passed: false, error: err.message };
  }

  // Run Persona C
  try {
    console.log('\n>>> RUNNING PERSONA C (MOBILE SITE SUPERVISOR)...');
    suiteResults.personas.personaC = await runPersonaC();
  } catch (err) {
    console.error('Persona C Execution Error:', err);
    suiteResults.personas.personaC = { passed: false, error: err.message };
  }

  // Run Adversarial Stress Suite
  try {
    console.log('\n>>> RUNNING ADVERSARIAL STRESS SUITE...');
    suiteResults.personas.adversarial = await runAdversarialStressSuite();
  } catch (err) {
    console.error('Adversarial Stress Suite Error:', err);
    suiteResults.personas.adversarial = { passed: false, error: err.message };
  }

  suiteResults.completedAt = new Date().toISOString();
  suiteResults.overallPassed = 
    suiteResults.personas.personaA?.passed &&
    suiteResults.personas.personaB?.passed &&
    suiteResults.personas.personaC?.passed &&
    suiteResults.personas.adversarial?.passed;

  const jsonPath = path.join(OUT_DIR, 'simulation_results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(suiteResults, null, 2), 'utf-8');
  console.log(`\n📄 Saved detailed simulation metrics to: ${jsonPath}`);

  console.log('\n================================================================');
  console.log('📊 SIMULATION RESULTS SUMMARY:');
  console.log(`  Persona A (EPC Contractor Desktop): ${suiteResults.personas.personaA?.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Persona B (Repeat Client Desktop & Mobile): ${suiteResults.personas.personaB?.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Persona C (Mobile Site Supervisor): ${suiteResults.personas.personaC?.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Adversarial Stress Suite: ${suiteResults.personas.adversarial?.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  OVERALL SUITE STATUS: ${suiteResults.overallPassed ? '🏆 ALL PASS' : '⚠️ FAILURES DETECTED'}`);
  console.log('================================================================\n');

  return suiteResults;
}

runAll().then(res => {
  process.exit(res.overallPassed ? 0 : 1);
});
