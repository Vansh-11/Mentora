
// This is a basic type definition to satisfy TypeScript for jspdf-autotable.
// For more advanced usage, consider installing @types/jspdf and creating more detailed types.

import 'jspdf';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}
