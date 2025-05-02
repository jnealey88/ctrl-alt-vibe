import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
}

const TagsInput = ({
  value = [],
  onChange,
  placeholder = "Add tags...",
  maxTags = 5,
  className = "",
}: TagsInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [tags, setTags] = useState<string[]>(value);

  useEffect(() => {
    setTags(value);
  }, [value]);

  useEffect(() => {
    onChange(tags);
  }, [tags, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === "," || e.key === " ") && inputValue.trim()) {
      e.preventDefault();
      
      const newTag = inputValue.trim().toLowerCase();
      if (newTag && !tags.includes(newTag) && tags.length < maxTags) {
        const newTags = [...tags, newTag];
        setTags(newTags);
        onChange(newTags);
      }
      
      setInputValue("");
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      const newTags = tags.slice(0, -1);
      setTags(newTags);
      onChange(newTags);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    onChange(newTags);
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 p-2 border rounded-md ${className}`}>
      {tags.map(tag => (
        <span
          key={tag}
          className="bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full flex items-center"
        >
          {tag}
          <button
            type="button"
            className="ml-1 text-gray-500 hover:text-gray-800"
            onClick={() => removeTag(tag)}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        placeholder={tags.length < maxTags ? placeholder : `Maximum ${maxTags} tags`}
        className="flex-1 min-w-[120px] border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm"
        disabled={tags.length >= maxTags}
      />
    </div>
  );
};

export default TagsInput;
