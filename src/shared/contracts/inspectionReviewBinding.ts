/** Photo revisions change independently of the same-vehicle review/signing scope. */
export function inspectionReviewRevision(snapshot: { revision: string | number; reviewRevision?: string | number }): string {
  return String(snapshot.reviewRevision ?? snapshot.revision);
}
