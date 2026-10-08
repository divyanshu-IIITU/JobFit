import UploadForm from './components/UploadForm'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">Resume Matcher</h1>
        <p className="text-center mb-8">Upload your resume and paste a job description to see how well they match!</p>
        <UploadForm />
      </div>
    </main>
  )
}

