import { createClient } from '@/lib/supabase/server'
import ShareView from './ShareView'

interface Props {
  params: Promise<{ token: string }>
}

export default async function SharePage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, content, is_shared')
    .eq('share_token', token)
    .eq('is_shared', true)
    .single()

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-center p-8">
        <div className="text-gray-600 text-5xl mb-4">🔗</div>
        <h1 className="text-white text-xl font-semibold mb-2">Mindmap not available</h1>
        <p className="text-gray-500 text-sm">
          This mindmap is no longer available or sharing has been disabled.
        </p>
        <a href="/auth" className="mt-6 text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
          Go to Markmap →
        </a>
      </div>
    )
  }

  return <ShareView project={project} />
}
