export interface CustomerContractFile {
  orderId: string; documentId: string; contractNumber: string; fileName: string; generatedAt: string;
  url?: string; blob?: Blob; orderLifecycleStatus?: string;
}
export function isCustomerContractFile(value: unknown): value is CustomerContractFile {
  const file = value as CustomerContractFile | null;
  return Boolean(file && typeof file.orderId === 'string' && file.orderId && typeof file.documentId === 'string' && file.documentId
    && typeof file.contractNumber === 'string' && file.contractNumber && typeof file.fileName === 'string' && file.fileName
    && Number.isFinite(Date.parse(file.generatedAt))
    && ((file.blob instanceof Blob && file.blob.type === 'application/pdf' && file.blob.size > 0)
      || (typeof file.url === 'string' && /^https?:\/\//.test(file.url))));
}
