/**
 * Helper functions for product URLs
 */

/**
 * Check if a string is a UUID
 */
export function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Generate SEO-friendly product URL
 * Uses backend-provided slug when available, falls back to ID
 */
export function getProductUrl(product: { id: string; slug?: string | null; name?: string | null }): string {
  // Use existing slug if available
  if (product.slug && product.slug.trim()) {
    return `/products/${product.slug}`;
  }

  // Fallback to ID
  return `/products/${product.id}`;
}

/**
 * Extract product ID from a slug that contains ID at the end
 * Format: name-part-id (where id is UUID)
 * Returns the ID if found, null otherwise
 */
export function extractIdFromSlug(slug: string): string | null {
  // Try to extract UUID from the end of slug
  // UUID format: 8-4-4-4-12 hex characters
  const uuidMatch = slug.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
  if (uuidMatch) {
    return uuidMatch[1];
  }
  
  // If no UUID found, try to extract last segment that looks like an ID
  // Check if last segment after last dash is a valid UUID
  const parts = slug.split('-');
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1];
    // If last part is exactly 8 hex chars, it might be a partial ID
    // But we need full UUID, so check if we can reconstruct it
    // Actually, if slug was generated with full ID, it should be there
    // Let's try matching the pattern: ...-uuid
    const fullUuidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
    const match = slug.match(fullUuidPattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Generate product URL from ID or slug
 * If input is UUID, returns ID-based URL (for backward compatibility)
 * Otherwise, treats as slug
 */
export function getProductUrlFromIdentifier(identifier: string, isSlug: boolean = false): string {
  if (isSlug || !isUUID(identifier)) {
    return `/products/${identifier}`;
  }
  return `/products/${identifier}`;
}

