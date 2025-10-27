/**
 * AI Service Client - Python Microservice Integration
 *
 * This client communicates with the Python AI microservice for face recognition tasks.
 * The microservice handles InsightFace model inference for embedding extraction.
 */

interface ExtractEmbeddingResponse {
  face_detected: boolean
  embedding: number[]
  bbox: number[]
  confidence: number
  error?: string
}

interface CompareFacesResponse {
  similarity: number
  distance: number
}

interface BatchExtractResponse {
  results: Array<{
    index: number
    face_detected: boolean
    embedding?: number[]
    bbox?: number[]
    confidence?: number
    error?: string
  }>
  total: number
  successful: number
  failed: number
}

const AI_SERVICE_URL = process.env.PYTHON_AI_SERVICE_URL!
const AI_SERVICE_API_KEY = process.env.PYTHON_AI_SERVICE_API_KEY!

/**
 * Extract face embedding from image buffer
 *
 * @param imageBuffer - Image file buffer (JPEG, PNG)
 * @returns 512-dimensional face embedding
 * @throws Error if no face detected or API fails
 *
 * @example
 * ```typescript
 * const imageBuffer = await file.arrayBuffer();
 * const embedding = await extractEmbedding(Buffer.from(imageBuffer));
 * await upsertFaceEmbedding(faceId, embedding);
 * ```
 */
export async function extractEmbedding(
  imageBuffer: Buffer
): Promise<number[]> {
  const formData = new FormData()
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' })
  formData.append('file', blob, 'face.jpg')

  const response = await fetch(`${AI_SERVICE_URL}/extract-embedding`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AI_SERVICE_API_KEY}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to extract embedding')
  }

  const data: ExtractEmbeddingResponse = await response.json()

  if (!data.face_detected) {
    throw new Error('No face detected in image')
  }

  return data.embedding
}

/**
 * Extract face embedding from base64-encoded image
 *
 * @param imageBase64 - Base64-encoded image data
 * @returns 512-dimensional face embedding
 * @throws Error if no face detected or API fails
 *
 * @example
 * ```typescript
 * const base64 = imageBuffer.toString('base64');
 * const embedding = await extractEmbeddingFromBase64(base64);
 * ```
 */
export async function extractEmbeddingFromBase64(
  imageBase64: string
): Promise<number[]> {
  const response = await fetch(`${AI_SERVICE_URL}/extract-embedding`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AI_SERVICE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_base64: imageBase64,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to extract embedding')
  }

  const data: ExtractEmbeddingResponse = await response.json()

  if (!data.face_detected) {
    throw new Error('No face detected in image')
  }

  return data.embedding
}

/**
 * Compare two face embeddings using cosine similarity
 *
 * @param embeddingA - First face embedding (512D)
 * @param embeddingB - Second face embedding (512D)
 * @returns Similarity score (0-1, higher = more similar)
 *
 * @example
 * ```typescript
 * const similarity = await compareFaces(userEmbedding, matchEmbedding);
 * if (similarity > 0.7) {
 *   console.log("High similarity match!");
 * }
 * ```
 */
export async function compareFaces(
  embeddingA: number[],
  embeddingB: number[]
): Promise<number> {
  const response = await fetch(`${AI_SERVICE_URL}/compare-faces`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AI_SERVICE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      embedding_a: embeddingA,
      embedding_b: embeddingB,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to compare faces')
  }

  const data: CompareFacesResponse = await response.json()
  return data.similarity
}

/**
 * Extract embeddings from multiple images in batch
 *
 * Useful for processing multiple face uploads efficiently.
 *
 * @param imageBase64Array - Array of base64-encoded images
 * @returns Batch processing results
 *
 * @example
 * ```typescript
 * const images = [base64_1, base64_2, base64_3];
 * const results = await batchExtractEmbeddings(images);
 *
 * results.results.forEach((result, i) => {
 *   if (result.face_detected) {
 *     console.log(`Image ${i}: embedding extracted`);
 *   } else {
 *     console.error(`Image ${i}: ${result.error}`);
 *   }
 * });
 * ```
 */
export async function batchExtractEmbeddings(
  imageBase64Array: string[]
): Promise<BatchExtractResponse> {
  const response = await fetch(`${AI_SERVICE_URL}/batch-extract`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AI_SERVICE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      images: imageBase64Array,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to batch extract embeddings')
  }

  return await response.json()
}

/**
 * Check if AI service is healthy and ready
 *
 * @returns True if service is healthy, false otherwise
 *
 * @example
 * ```typescript
 * const isHealthy = await checkAIServiceHealth();
 * if (!isHealthy) {
 *   console.error("AI service is down!");
 * }
 * ```
 */
export async function checkAIServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/health`, {
      method: 'GET',
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.status === 'healthy'

  } catch (error) {
    console.error('AI service health check failed:', error)
    return false
  }
}

/**
 * Validate embedding dimensions
 *
 * @param embedding - Face embedding array
 * @returns True if valid (512 dimensions), false otherwise
 */
export function validateEmbedding(embedding: number[]): boolean {
  return Array.isArray(embedding) && embedding.length === 512
}

/**
 * Error types for AI service
 */
export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: 'NO_FACE_DETECTED' | 'API_ERROR' | 'NETWORK_ERROR'
  ) {
    super(message)
    this.name = 'AIServiceError'
  }
}

/**
 * Extract embedding with enhanced error handling
 *
 * @param imageBuffer - Image buffer
 * @returns Embedding or throws AIServiceError
 */
export async function extractEmbeddingWithErrorHandling(
  imageBuffer: Buffer
): Promise<number[]> {
  try {
    return await extractEmbedding(imageBuffer)
  } catch (error: any) {
    if (error.message.includes('No face detected')) {
      throw new AIServiceError('No face detected in image', 'NO_FACE_DETECTED')
    } else if (error.message.includes('Failed to extract')) {
      throw new AIServiceError('AI service error', 'API_ERROR')
    } else {
      throw new AIServiceError('Network error', 'NETWORK_ERROR')
    }
  }
}
