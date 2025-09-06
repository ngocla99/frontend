import { useState } from "react";
import { Search, Star, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Celebrity {
  id: string;
  name: string;
  image: string;
  age: number;
  profession: string;
  category: string;
  popularity: number;
}

interface CelebritySearchProps {
  onSelectCelebrity: (celebrity: Celebrity) => void;
  selectedCelebrity?: Celebrity;
}

export const CelebritySearch = ({ onSelectCelebrity, selectedCelebrity }: CelebritySearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Placeholder celebrity database
  const celebrities: Celebrity[] = [
    {
      id: "1",
      name: "Emma Stone",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face",
      age: 35,
      profession: "Actress",
      category: "Hollywood",
      popularity: 95
    },
    {
      id: "2", 
      name: "Ryan Gosling",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      age: 43,
      profession: "Actor",
      category: "Hollywood",
      popularity: 92
    },
    {
      id: "3",
      name: "Zendaya",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b647?w=400&h=400&fit=crop&crop=face",
      age: 27,
      profession: "Actress/Singer",
      category: "Hollywood",
      popularity: 98
    },
    {
      id: "4",
      name: "Michael B. Jordan",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      age: 37,
      profession: "Actor",
      category: "Hollywood",
      popularity: 89
    },
    {
      id: "5",
      name: "Margot Robbie",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
      age: 33,
      profession: "Actress",
      category: "Hollywood",
      popularity: 94
    },
    {
      id: "6",
      name: "Chris Hemsworth",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
      age: 40,
      profession: "Actor",
      category: "Marvel",
      popularity: 91
    }
  ];

  const filteredCelebrities = celebrities.filter(celebrity =>
    celebrity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    celebrity.profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
    celebrity.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateMatchPercentage = (celebrity: Celebrity): number => {
    // Simple algorithm based on popularity and random factor
    const baseMatch = 70;
    const popularityBonus = Math.floor(celebrity.popularity / 10);
    const randomFactor = Math.floor(Math.random() * 15);
    return Math.min(99, baseMatch + popularityBonus + randomFactor);
  };

  return (
    <Card className="p-4 sm:p-6 bg-gradient-card shadow-soft border-0 hover:shadow-match transition-all duration-300">
      <div className="text-center mb-4 sm:mb-6">
        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gradient-primary rounded-full flex items-center justify-center">
          <Star className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2">Celebrity Matches</h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">Find your celebrity look-alike and see your baby!</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4 sm:mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Search celebrities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
        {filteredCelebrities.map((celebrity) => {
          const matchPercentage = calculateMatchPercentage(celebrity);
          const isSelected = selectedCelebrity?.id === celebrity.id;
          
          return (
            <div
              key={celebrity.id}
              className={`p-3 sm:p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-match ${
                isSelected 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => onSelectCelebrity(celebrity)}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative">
                  <img 
                    src={celebrity.image} 
                    alt={celebrity.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Star className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <h3 className="font-bold text-foreground text-sm sm:text-base truncate">{celebrity.name}</h3>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-love" />
                      <span className="font-bold text-love text-sm sm:text-base">{matchPercentage}%</span>
                    </div>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2 truncate">
                    {celebrity.profession} • Age {celebrity.age}
                  </p>
                  
                  <div className="flex gap-1 mb-2 sm:mb-3 flex-wrap">
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      {celebrity.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      {celebrity.popularity}% Popular
                    </Badge>
                  </div>
                </div>
                
                <div className="text-center flex-shrink-0">
                  {isSelected ? (
                    <div className="text-primary font-medium text-xs sm:text-sm">
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1" />
                      Selected
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" className="text-match hover:text-match-light text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden sm:inline">See </span>Baby
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {filteredCelebrities.length === 0 && (
          <div className="text-center py-8">
            <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No celebrities found. Try a different search term!</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-xs sm:text-sm text-yellow-700 text-center leading-relaxed">
          ✨ Celebrity database with placeholder data. Click any celebrity to generate your baby together!
        </p>
      </div>
    </Card>
  );
};