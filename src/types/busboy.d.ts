declare module 'busboy' {
  import { IncomingMessage } from 'http';
  import { Writable } from 'stream';

  interface BusboyConfig {
    headers: IncomingMessage['headers'];
    limits?: {
      fieldNameSize?: number;
      fieldSize?: number;
      fields?: number;
      fileSize?: number;
      files?: number;
      parts?: number;
      headerPairs?: number;
    };
  }

  interface Busboy extends NodeJS.EventEmitter, Writable {
    on(event: 'file', listener: (fieldname: string, file: NodeJS.ReadableStream, info: { filename: string; encoding: string; mimeType: string }) => void): this;
    on(event: 'field', listener: (fieldname: string, val: string, info: { nameTruncated: boolean; valueTruncated: boolean; encoding: string; mimeType: string }) => void): this;
    on(event: 'finish', listener: () => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
  }

  function Busboy(config: BusboyConfig): Busboy;
  export = Busboy;
} 