from __future__ import annotations

import sys
from pathlib import Path

import PyPDF2


def extract_text_from_pdf(pdf_path: Path) -> str:
    with pdf_path.open('rb') as file:
        reader = PyPDF2.PdfReader(file)
        pages = (page.extract_text() or '' for page in reader.pages)
        return '\n'.join(pages).strip()


def main() -> int:
    if len(sys.argv) != 2:
        print('Usage: process_resume.py <pdf-path>', file=sys.stderr)
        return 2

    # Node reads stdout as UTF-8, while Windows may default stdout to cp1252.
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

    try:
        resume_text = extract_text_from_pdf(Path(sys.argv[1]))
    except (OSError, PyPDF2.errors.PdfReadError) as error:
        print(f'Unable to read PDF: {error}', file=sys.stderr)
        return 1

    print(resume_text)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
