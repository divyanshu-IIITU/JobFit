'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    setFile(acceptedFiles[0] ?? null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDropRejected: () => {
      setFile(null);
      setError('Please select one PDF file.');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !jobDescription) {
      setError('Please provide both a resume and a job description.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const extractionResponse = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!extractionResponse.ok) {
        throw new Error('Failed to extract text from PDF');
      }

      const { text: resumeText } = await extractionResponse.json();

      const matchingResponse = await fetch('/api/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          jobDescription,
        }),
      });

      if (!matchingResponse.ok) {
        throw new Error('Failed to process resume');
      }

      const data = await matchingResponse.json();
      setResult(data.result);
    } catch (err) {
      console.error(err); // Log the error for debugging
      setError('An error occurred while processing your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6">Resume Matcher</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          {...getRootProps()}
          className={`p-6 border-2 border-dashed rounded-md text-center cursor-pointer ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <p>File selected: {file.name}</p>
          ) : (
            <p>{isDragActive ? "Drop the file here" : "Drag 'n' drop a resume PDF here, or click to select a file"}</p>
          )}
        </div>
        <div>
          <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700">
            Job Description
          </label>
          <textarea
            id="jobDescription"
            name="jobDescription"
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-black"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          ></textarea>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#ffa500] hover:bg-[#e69500] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ffa500] disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Match Resume'}
        </button>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {result && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          <h2 className="font-bold text-lg mb-2">Results</h2>
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
}
