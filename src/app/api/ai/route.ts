import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import {
  generateStructuredClinicalNotes,
  assistPrescription,
  explainLabResult,
} from '@/lib/ai-assistant';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    if (action === 'structure_clinical_notes') {
      const { rawNotes, patientAge, patientGender, vitals } = body;
      if (!rawNotes) {
        return NextResponse.json({ error: 'Clinical raw notes are required' }, { status: 400 });
      }

      const structured = generateStructuredClinicalNotes({
        rawNotes,
        patientAge,
        patientGender,
        vitals,
      });

      return NextResponse.json({ success: true, ...structured });
    }

    if (action === 'assist_prescription') {
      const { diagnosisText } = body;
      if (!diagnosisText) {
        return NextResponse.json({ error: 'Diagnosis text is required' }, { status: 400 });
      }

      const suggestions = assistPrescription(diagnosisText);
      return NextResponse.json({ success: true, ...suggestions });
    }

    if (action === 'explain_lab_result') {
      const { testName, value, unit, referenceRange } = body;
      if (!testName || !value) {
        return NextResponse.json({ error: 'Test name and value are required' }, { status: 400 });
      }

      const explanation = explainLabResult(testName, String(value), unit, referenceRange);
      return NextResponse.json({ success: true, ...explanation });
    }

    return NextResponse.json({ error: 'Invalid AI action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('AI assistant error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
