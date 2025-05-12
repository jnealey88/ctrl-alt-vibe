import React from 'react';
import 'quill/dist/quill.snow.css';

// Define a fallback component that will be used until the real ReactQuill is loaded
const QuillFallback = ({ className }: { className?: string }) => (
  <div className={`border rounded-md p-4 min-h-[250px] ${className || ''}`}>
    <div className="w-full h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
    <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
    <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
    <div className="w-5/6 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
    <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
    <div className="w-4/5 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
  </div>
);

// Create a dynamic import for ReactQuill to prevent SSR issues
const ReactQuill = React.lazy(() => 
  import('react-quill').then(module => ({
    default: module.default || module
  }))
);

// Our wrapped Quill component with error handling
const QuillEditor = React.forwardRef(({ 
  value, 
  onChange, 
  placeholder, 
  modules,
  formats,
  theme = "snow",
  className,
  ...props 
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  modules?: any;
  formats?: string[];
  theme?: string;
  className?: string;
  [key: string]: any;
}, ref: any) => {
  // Use standard modules if none are provided
  const defaultModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'image', 'code-block'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    }
  };

  return (
    <React.Suspense fallback={<QuillFallback className={className} />}>
      <ReactQuill
        ref={ref}
        theme={theme}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules || defaultModules}
        formats={formats}
        className={className}
        {...props}
      />
    </React.Suspense>
  );
});

QuillEditor.displayName = 'QuillEditor';

export default QuillEditor;