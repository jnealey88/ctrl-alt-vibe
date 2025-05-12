import React, { useMemo } from 'react';
import 'quill/dist/quill.snow.css';
import type { ReactQuillProps } from 'react-quill';

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

// Define our extended props type
export interface QuillEditorProps extends Omit<ReactQuillProps, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// Create a component that dynamically loads ReactQuill
const DynamicQuill = ({ 
  forwardedRef, 
  ...props 
}: QuillEditorProps & { forwardedRef: React.Ref<any> }) => {
  const ReactQuill = React.lazy(() => 
    import('react-quill').then(module => ({
      default: module.default || module
    }))
  );

  return (
    <ReactQuill ref={forwardedRef} {...props} />
  );
};

// Use a wrapper to handle the dynamic import and provide a fallback
function DynamicQuillWrapper(
  props: QuillEditorProps & { forwardedRef: React.Ref<any> }
) {
  return (
    <React.Suspense fallback={<QuillFallback className={props.className} />}>
      <DynamicQuill {...props} />
    </React.Suspense>
  );
}

// Our wrapped Quill component with error handling and ref forwarding
const QuillEditor = React.forwardRef<any, QuillEditorProps>((props, ref) => {
  // Use standard modules if none are provided
  const defaultModules = useMemo(() => ({
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
  }), []);

  // Merge default modules with provided modules
  const mergedProps = {
    ...props,
    modules: props.modules || defaultModules,
    theme: props.theme || "snow",
    forwardedRef: ref,
  };

  return <DynamicQuillWrapper {...mergedProps} />;
});

QuillEditor.displayName = 'QuillEditor';

export default QuillEditor;