// ─────────────────────────────────────────────────────────────────────────────
// onboarding.component.ts
//
// Responsabilidades:
//   1. Manejar el drag & drop / selección del archivo .txt
//   2. Llamar al IndexParserService para parsear el contenido
//   3. Mostrar los 3 estados: vacío, cargado, error
//   4. Al confirmar: guardar en DashboardService y navegar al dashboard
//
// Ubicación: src/app/features/onboarding/
// ─────────────────────────────────────────────────────────────────────────────

import { Component, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IndexParserService } from './parser/index-parser.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardState } from '../../core/models';

// Estados posibles del componente
type OnboardingState = 'empty' | 'loaded' | 'error';

@Component({
   selector: 'app-onboarding',
   standalone: true,
   imports: [],
   templateUrl: './onboarding.component.html',
   styleUrl: './onboarding.component.scss',
})
export class OnboardingComponent {
   @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

   private readonly parser = inject(IndexParserService);
   private readonly svc = inject(DashboardService);
   private readonly router = inject(Router);

   // ── Estado del componente ─────────────────────────────────────────────────
   state = signal<OnboardingState>('empty');
   isDragActive = signal(false);

   // ── Datos del archivo cargado ─────────────────────────────────────────────
   fileName = signal('');
   fileSize = signal('');
   parsedData = signal<DashboardState | null>(null);
   errorMessage = signal('');

   // ── Drag & Drop ───────────────────────────────────────────────────────────
   onDragOver(e: DragEvent): void {
      e.preventDefault();
      this.isDragActive.set(true);
   }

   onDragLeave(): void {
      this.isDragActive.set(false);
   }

   onDrop(e: DragEvent): void {
      e.preventDefault();
      this.isDragActive.set(false);
      const file = e.dataTransfer?.files[0];
      if (file) this.processFile(file);
   }

   // ── Selección manual ──────────────────────────────────────────────────────
   openFilePicker(): void {
      this.fileInput.nativeElement.click();
   }

   onFileSelected(e: Event): void {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];
      if (file) this.processFile(file);
   }

   // ── Procesamiento del archivo ─────────────────────────────────────────────
   private processFile(file: File): void {
      if (!file.name.endsWith('.txt')) {
         this.errorMessage.set('El archivo debe tener extensión .txt');
         this.state.set('error');
         return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
         const text = e.target?.result as string;
         const result = this.parser.parse(text);

         if (result.ok) {
            this.fileName.set(file.name);
            this.fileSize.set((file.size / 1024).toFixed(1) + ' KB');
            this.parsedData.set(result.data);
            this.state.set('loaded');
         } else {
            this.errorMessage.set(result.error);
            this.state.set('error');
         }
      };
      reader.readAsText(file);
   }

   // ── Confirmar y navegar al dashboard ──────────────────────────────────────
   confirm(): void {
      const data = this.parsedData();
      if (!data) return;
      this.svc.loadFromParsed(data); // guarda en localStorage via servicio
      this.router.navigate(['/dashboard']); // navega al dashboard
   }

   // ── Reset ─────────────────────────────────────────────────────────────────
   reset(): void {
      this.state.set('empty');
      this.parsedData.set(null);
      this.errorMessage.set('');
      this.fileInput.nativeElement.value = '';
   }

   // ── Helper para el template ───────────────────────────────────────────────
   getBranchColor(index: number): string {
      return ['#3b71fe', '#a676f2', '#f25a8a'][index % 3];
   }
}
