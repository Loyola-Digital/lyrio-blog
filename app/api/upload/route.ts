import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { isAdmin } from '@/app/(admin)/admin/guard'

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!(await isAdmin())) throw new Error('Não autorizado.')
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          maximumSizeInBytes: 8 * 1024 * 1024,
          addRandomSuffix: true,
        }
      },
    })
    return Response.json(result)
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 })
  }
}
