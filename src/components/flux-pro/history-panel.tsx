"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  SearchIcon, 
  TrashIcon, 
  CheckIcon,
  ClockIcon,
  ImageIcon
} from "lucide-react";

type HistoryItem = {
  id: string;
  thumbnail: string;
  timestamp: number;
  description: string;
};

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}

export default function HistoryPanel({
  history,
  onSelect,
  onDelete
}: HistoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  // Filter history items based on search query
  const filteredHistory = searchQuery
    ? history.filter(item => 
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : history;
  
  // Format timestamp to readable date/time
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Edit History</h3>
        
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search history..."
            className="pl-9 bg-gray-800/50 border-gray-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            {searchQuery ? (
              <>
                <SearchIcon className="w-8 h-8 text-gray-500 mb-2" />
                <p className="text-sm text-gray-500">No matching results</p>
              </>
            ) : (
              <>
                <ClockIcon className="w-8 h-8 text-gray-500 mb-2" />
                <p className="text-sm text-gray-500">No history yet</p>
                <p className="text-xs text-gray-600 mt-1">
                  Generate images to build your history
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredHistory.map(item => (
              <div 
                key={item.id}
                className={`
                  flex items-start p-2 rounded-md cursor-pointer
                  ${selectedItemId === item.id ? 'bg-blue-500/20' : 'hover:bg-gray-800/50'}
                `}
                onClick={() => setSelectedItemId(item.id)}
              >
                <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-800 flex-shrink-0">
                  {item.thumbnail ? (
                    <img 
                      src={item.thumbnail} 
                      alt={item.description}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                </div>
                
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm text-gray-300 line-clamp-2">{item.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatTimestamp(item.timestamp)}</p>
                </div>
                
                <div className="ml-2 flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(item);
                    }}
                  >
                    <CheckIcon className="h-4 w-4 text-gray-400 hover:text-blue-400" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                  >
                    <TrashIcon className="h-4 w-4 text-gray-400 hover:text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
