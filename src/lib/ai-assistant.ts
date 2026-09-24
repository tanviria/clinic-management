// ClinicPro AI Assistant Layer
// Notice: AI assists documentation and suggestions. It never makes autonomous medical decisions.
// All outputs are labeled with AI disclaimers and require doctor review and sign-off.

export interface ClinicalNoteInput {
  rawNotes: string;
  patientAge?: number;
  patientGender?: string;
  vitals?: {
    bp?: string;
    pulse?: number;
    temp?: number;
    spO2?: number;
  };
}

export interface StructuredClinicalDoc {
  chiefComplaint: string;
  historyOfPresentIllness: string;
  vitalInterpretation: string;
  clinicalImpressionSuggestions: string[];
  suggestedInvestigations: string[];
  lifestyleAdvice: string[];
  disclaimer: string;
}

export function generateStructuredClinicalNotes(input: ClinicalNoteInput): StructuredClinicalDoc {
  const notesLower = input.rawNotes.toLowerCase();

  // Clinical impressions reasoning
  const impressions: string[] = [];
  const investigations: string[] = [];
  const advice: string[] = [];

  if (notesLower.includes('fever') || notesLower.includes('temperature') || (input.vitals?.temp && input.vitals.temp > 99.5)) {
    impressions.push('Acute Febrile Illness / Possible Viral Infection');
    investigations.push('Complete Blood Count (CBC) with ESR', 'Urine R/M/E', 'Dengue NS1 Antigen (if acute)');
    advice.push('Adequate oral hydration (minimum 2.5-3L water/ORS daily)', 'Tepid sponging if temperature > 101°F');
  }

  if (notesLower.includes('cough') || notesLower.includes('breath') || notesLower.includes('wheez')) {
    impressions.push('Upper / Lower Respiratory Tract Infection or Reactive Airway Disease');
    investigations.push('Chest X-Ray P/A view', 'CBC with Absolute Eosinophil Count');
    advice.push('Avoid cold drinks and direct AC air', 'Steam inhalation 2-3 times daily');
  }

  if (notesLower.includes('sugar') || notesLower.includes('diabet') || notesLower.includes('thirst') || notesLower.includes('polyuria')) {
    impressions.push('Type 2 Diabetes Mellitus (Assessment for Glycemic Control)');
    investigations.push('HbA1c', 'Fasting Blood Sugar & 2h Post-prandial', 'Serum Creatinine', 'Urine for Microalbumin');
    advice.push('Strict diabetic diet (avoid sugar, sweets, white bread)', 'Regular 30 min daily brisk walk');
  }

  if (notesLower.includes('pressure') || notesLower.includes('hypertens') || notesLower.includes('headache') || (input.vitals?.bp && parseInt(input.vitals.bp) > 139)) {
    impressions.push('Essential Hypertension (Stage 1 or 2)');
    investigations.push('12-Lead ECG', 'Lipid Profile', 'Serum Electrolytes', 'Serum Creatinine');
    advice.push('Low salt intake (< 5g per day, no raw table salt)', 'Monitor BP morning and evening');
  }

  if (notesLower.includes('chest pain') || notesLower.includes('angina')) {
    impressions.push('Chest Discomfort / Rule out Ischemic Heart Disease (Urgent)');
    investigations.push('Immediate 12-Lead ECG', 'Serum Troponin-I', 'Echocardiogram');
    advice.push('Seek emergency medical care immediately if chest tightness radiates to left jaw/arm');
  }

  if (impressions.length === 0) {
    impressions.push('General Medical Evaluation / Symptomatic Presentation');
    investigations.push('Baseline CBC', 'RBS');
    advice.push('Maintain balanced nutrition, proper hydration, and restful sleep');
  }

  // Vitals summary
  let vitalInterpretation = 'Vitals documented within stable physiological limits.';
  if (input.vitals) {
    const alerts = [];
    if (input.vitals.temp && input.vitals.temp > 99) alerts.push(`Elevated body temperature (${input.vitals.temp}°F)`);
    if (input.vitals.pulse && (input.vitals.pulse > 100 || input.vitals.pulse < 60)) alerts.push(`Pulse rate ${input.vitals.pulse} bpm`);
    if (input.vitals.spO2 && input.vitals.spO2 < 95) alerts.push(`Suboptimal oxygen saturation SpO2 ${input.vitals.spO2}%`);
    if (alerts.length > 0) {
      vitalInterpretation = `Clinical Attention: ${alerts.join('; ')}.`;
    }
  }

  return {
    chiefComplaint: input.rawNotes.split('\n')[0] || input.rawNotes.slice(0, 100),
    historyOfPresentIllness: `Patient presented with complaints of: ${input.rawNotes.trim()}. Symptoms noted in clinical session.`,
    vitalInterpretation,
    clinicalImpressionSuggestions: impressions,
    suggestedInvestigations: investigations,
    lifestyleAdvice: advice,
    disclaimer: 'AI-Generated Clinical Documentation Draft. NOT a medical diagnosis. The attending physician must verify, edit, and approve before finalizing.',
  };
}

export interface PrescriptionAssistantItem {
  medicineName: string;
  genericName: string;
  dosage: string;
  timing: string;
  duration: string;
  instructions: string;
}

export function assistPrescription(diagnosisText: string): {
  suggestedMedicines: PrescriptionAssistantItem[];
  precautions: string[];
  disclaimer: string;
} {
  const diagLower = diagnosisText.toLowerCase();
  const medicines: PrescriptionAssistantItem[] = [];
  const precautions: string[] = [];

  if (diagLower.includes('diabet')) {
    medicines.push({
      medicineName: 'Metfo 500 (Metformin)',
      genericName: 'Metformin Hydrochloride',
      dosage: '1+0+1',
      timing: 'After Meal',
      duration: '30 days',
      instructions: 'Take immediately after food to minimize GI discomfort',
    });
    precautions.push('Check kidney function (eGFR / Serum Creatinine) before long-term biguanide therapy.');
  }

  if (diagLower.includes('hypertens') || diagLower.includes('pressure')) {
    medicines.push({
      medicineName: 'Bizoran 5/20 (Amlodipine + Olmesartan)',
      genericName: 'Amlodipine + Olmesartan',
      dosage: '0+0+1',
      timing: 'After Meal',
      duration: '30 days',
      instructions: 'Take regularly at night',
    });
    precautions.push('Monitor for peripheral edema or postural dizziness.');
  }

  if (diagLower.includes('gastrit') || diagLower.includes('peptic') || diagLower.includes('acid') || medicines.length > 0) {
    medicines.push({
      medicineName: 'Seclo 20 (Omeprazole)',
      genericName: 'Omeprazole',
      dosage: '1+0+0',
      timing: 'Before Meal',
      duration: '14 days',
      instructions: 'Take 30 minutes before breakfast',
    });
  }

  if (diagLower.includes('fever') || diagLower.includes('pain') || diagLower.includes('headache')) {
    medicines.push({
      medicineName: 'Napa Extra (Paracetamol + Caffeine)',
      genericName: 'Paracetamol + Caffeine',
      dosage: '1+1+1',
      timing: 'After Meal',
      duration: '5 days',
      instructions: 'Take if fever > 100°F or body ache persists',
    });
    precautions.push('Do not exceed 4000mg Paracetamol in 24 hours to prevent hepatotoxicity.');
  }

  if (diagLower.includes('asthma') || diagLower.includes('cough') || diagLower.includes('allergy')) {
    medicines.push({
      medicineName: 'Monas 10 (Montelukast)',
      genericName: 'Montelukast Sodium',
      dosage: '0+0+1',
      timing: 'After Meal',
      duration: '14 days',
      instructions: 'Take at bedtime',
    });
    medicines.push({
      medicineName: 'Fexo 120 (Fexofenadine)',
      genericName: 'Fexofenadine',
      dosage: '1+0+0',
      timing: 'After Meal',
      duration: '7 days',
      instructions: 'Non-sedating antihistamine',
    });
  }

  return {
    suggestedMedicines: medicines,
    precautions,
    disclaimer: 'AI-assisted prescription formatting for clinical convenience. The prescribing physician holds sole medical and legal responsibility for drug choice, dosages, and interactions.',
  };
}

export function explainLabResult(testName: string, value: string, unit?: string, referenceRange?: string): {
  explanation: string;
  clinicalContext: string;
  patientFriendlySummary: string;
  disclaimer: string;
} {
  const nameLower = testName.toLowerCase();
  let explanation = `The test ${testName} measures specific biochemical or cellular markers in the specimen.`;
  let clinicalContext = `Recorded value is ${value} ${unit || ''}. Normal clinical reference range is typically ${referenceRange || 'established by laboratory'}.`;
  let patientSummary = 'Please consult your attending physician to understand what this result means in context of your overall health and symptoms.';

  if (nameLower.includes('hba1c')) {
    explanation = 'HbA1c measures the percentage of your hemoglobin coated with sugar over the previous 2 to 3 months.';
    const num = parseFloat(value);
    if (!isNaN(num)) {
      if (num < 5.7) {
        patientSummary = 'Your 3-month average blood glucose is within the normal non-diabetic range.';
      } else if (num <= 6.4) {
        patientSummary = 'Your average glucose level is in the prediabetes range. Lifestyle modifications, balanced diet, and exercise are recommended.';
      } else {
        patientSummary = 'Your average glucose level indicates diabetes or higher than target blood sugar. Medical follow-up with your doctor is advised.';
      }
    }
  } else if (nameLower.includes('creatinine')) {
    explanation = 'Serum Creatinine is a waste product produced by muscles that healthy kidneys filter out from the blood.';
    patientSummary = 'This test helps your doctor check how well your kidneys are filtering and cleaning your blood.';
  } else if (nameLower.includes('rbs') || nameLower.includes('sugar') || nameLower.includes('glucose')) {
    explanation = 'Random Blood Sugar measures the concentration of glucose circulating in the bloodstream at the time of sample collection.';
    patientSummary = 'Blood sugar supplies energy to your body cells. Elevated levels may indicate diabetes or recent carbohydrate intake.';
  } else if (nameLower.includes('cbc') || nameLower.includes('blood count') || nameLower.includes('hemoglobin')) {
    explanation = 'A Complete Blood Count analyzes red blood cells (carrying oxygen), white blood cells (fighting infection), and platelets (clotting blood).';
    patientSummary = 'This provides an overall snapshot of your blood health, helping rule out anemia, inflammation, or infection.';
  }

  return {
    explanation,
    clinicalContext,
    patientFriendlySummary: patientSummary,
    disclaimer: 'AI Informational Summary only. Laboratory results should always be interpreted by a qualified healthcare professional in conjunction with clinical examination.',
  };
}
