declare module 'react-quill' {
  import * as React from 'react';
  
  export interface ReactQuillProps {
    id?: string;
    className?: string;
    theme?: string;
    style?: React.CSSProperties;
    readOnly?: boolean;
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    tabIndex?: number;
    bounds?: string | HTMLElement;
    scrollingContainer?: string | HTMLElement;
    onChange?: (content: string, delta: any, source: any, editor: any) => void;
    onChangeSelection?: (range: any, source: any, editor: any) => void;
    onFocus?: (range: any, source: any, editor: any) => void;
    onBlur?: (previousRange: any, source: any, editor: any) => void;
    onKeyPress?: React.EventHandler<any>;
    onKeyDown?: React.EventHandler<any>;
    onKeyUp?: React.EventHandler<any>;
    preserveWhitespace?: boolean;
    formats?: string[];
    modules?: {
      [key: string]: any;
    };
  }
  
  // Define type for the Quill editor instance
  export interface QuillInstance {
    root: HTMLElement;
    clipboard: any;
    getLength(): number;
    getText(index?: number, length?: number): string;
    getContents(index?: number, length?: number): any;
    getSelection(focus?: boolean): any;
    getBounds(index: number, length?: number): any;
    getFormat(range?: any): any;
    getIndex(blot: any): number;
    getLeaf(index: number): any;
    getLine(index: number): any;
    getLines(index?: number, length?: number): any;
    getModule(name: string): any;
    getSelection(focus?: boolean): any;
    getText(index?: number, length?: number): string;
    hasFocus(): boolean;
    history: {
      undo: () => void;
      redo: () => void;
    };
    insertEmbed(index: number, type: string, value: any): void;
    insertText(index: number, text: string, formats?: any): void;
    isEnabled(): boolean;
    off(eventName: string, handler: Function): void;
    on(eventName: string, handler: Function): void;
    once(eventName: string, handler: Function): void;
    format(name: string, value: any): void;
    formatLine(index: number, length: number, formats: any): void;
    formatText(index: number, length: number, formats: any): void;
    removeFormat(index: number, length: number): void;
    deleteText(index: number, length: number): void;
    enable(enabled?: boolean): void;
    focus(): void;
    blur(): void;
    update(source?: string): void;
    updateContents(delta: any): void;
    setContents(delta: any): void;
    setText(text: string): void;
    setSelection(range: any): void;
    dangerouslyPasteHTML(html: string): void;
    dangerouslyPasteHTML(index: number, html: string, source?: string): void;
  }

  export interface ReactQuillComponent extends React.ForwardRefExoticComponent<ReactQuillProps & React.RefAttributes<any>> {
    Quill: any;
    displayName?: string;
  }

  const ReactQuill: ReactQuillComponent;
  export default ReactQuill;
}