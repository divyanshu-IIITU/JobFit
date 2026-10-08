import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import { unlink, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request): Promise<NextResponse> {
  let tempFilePath: string | undefined;

  try {
    const data = await req.formData();
    const file = data.get('resume');

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'A non-empty PDF file is required' }, { status: 400 });
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    tempFilePath = path.join(os.tmpdir(), `jobfit-${randomUUID()}.pdf`);
    await writeFile(tempFilePath, Buffer.from(await file.arrayBuffer()));

    const pythonCommand = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
    const scriptPath = path.join(process.cwd(), 'process_resume.py');

    return await new Promise<NextResponse>((resolve) => {
      const pythonProcess = spawn(pythonCommand, [scriptPath, tempFilePath!], { windowsHide: true });
      let result = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (chunk: Buffer) => {
        result += chunk.toString('utf8');
      });

      pythonProcess.stderr.on('data', (chunk: Buffer) => {
        errorOutput += chunk.toString('utf8');
      });

      pythonProcess.once('error', async (error) => {
        await unlink(tempFilePath!).catch(() => undefined);
        console.error('Could not start Python PDF extractor:', error);
        resolve(NextResponse.json({ error: 'Python PDF extractor is unavailable' }, { status: 500 }));
      });

      pythonProcess.once('close', async (code) => {
        await unlink(tempFilePath!).catch(() => undefined);
        if (code !== 0) {
          console.error('PDF extraction failed:', errorOutput);
          resolve(NextResponse.json({ error: 'Failed to extract text from PDF' }, { status: 500 }));
        } else {
          resolve(NextResponse.json({ text: result }));
        }
      });
    });
  } catch (error) {
    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => undefined);
    }
    console.error('Unexpected PDF extraction error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
