declare module './batch-processor' {
  interface BatchProcessorProps {
    projectId: string;
    onComplete: (result: { url: string; metadata: any }) => void;
  }
  
  const BatchProcessor: React.FC<BatchProcessorProps>;
  export default BatchProcessor;
}
