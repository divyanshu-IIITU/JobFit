import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not configured');
      return NextResponse.json({ error: 'The Gemini API key is not configured' }, { status: 500 });
    }

    const body = await req.json();
    const resumeText = typeof body.resumeText === 'string' ? body.resumeText.trim() : '';
    const jobDescription = typeof body.jobDescription === 'string' ? body.jobDescription.trim() : '';

    if (!resumeText || !jobDescription) {
      return NextResponse.json({ error: 'Missing resume text or job description' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Match the following resume with this job description and provide suggestions:

Resume:
${resumeText}

Job Description:
${jobDescription}`;
    const result = await model.generateContent([prompt]);

    return NextResponse.json({ result: result.response.text() });
  } catch (error) {
    console.error('Error occurred while matching resume:', error);
    return NextResponse.json({ error: 'An error occurred while processing your request.' }, { status: 500 });
  }
}
