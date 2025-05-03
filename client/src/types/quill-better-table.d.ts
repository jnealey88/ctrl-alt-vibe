declare module 'quill-better-table' {
  import { Quill } from 'quill';
  
  export default class QuillBetterTable {
    constructor(quill: any, options: any);
    insertTable(rows: number, columns: number): void;
  }
}