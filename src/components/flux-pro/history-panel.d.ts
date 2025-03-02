declare module './history-panel' {
  interface HistoryItem {
    id: string;
    thumbnail: string;
    timestamp: number;
    description: string;
  }
  
  interface HistoryPanelProps {
    history: HistoryItem[];
    onSelect: (item: HistoryItem) => void;
    onDelete: (id: string) => void;
  }
  
  const HistoryPanel: React.FC<HistoryPanelProps>;
  export default HistoryPanel;
}
