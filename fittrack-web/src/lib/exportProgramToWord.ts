import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';
import { TrainingProgram } from '@/types';

const PHASE_LABEL: Record<string, string> = {
  adaptation: 'Адаптация',
  progression: 'Прогрессия',
  peaking: 'Пиковая фаза',
  deload: 'Разгрузка',
};

function cell(text: string, opts: { bold?: boolean; width?: number } = {}): TableCell {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: opts.bold ?? false, size: 20 })],
      }),
    ],
  });
}

function exerciseTable(exercises: TrainingProgram['weeks'][number]['days'][number]['exercises']): Table {
  const header = new TableRow({
    tableHeader: true,
    children: [
      cell('#', { bold: true, width: 5 }),
      cell('Упражнение', { bold: true, width: 35 }),
      cell('Подходы × Повторы', { bold: true, width: 18 }),
      cell('RIR', { bold: true, width: 8 }),
      cell('Вес', { bold: true, width: 12 }),
      cell('Отдых', { bold: true, width: 10 }),
      cell('Темп', { bold: true, width: 12 }),
    ],
  });

  const rows = exercises.map((ex, idx) => {
    const reps = ex.repsMin === ex.repsMax ? `${ex.repsMin}` : `${ex.repsMin}–${ex.repsMax}`;
    const load =
      ex.targetLoadKg != null
        ? `${ex.targetLoadKg} кг`
        : ex.loadPctE1rm != null
          ? `${ex.loadPctE1rm}% e1RM`
          : '—';
    return new TableRow({
      children: [
        cell(String(idx + 1)),
        cell(ex.exerciseName),
        cell(`${ex.sets} × ${reps}`),
        cell(ex.targetRir != null ? String(ex.targetRir) : '—'),
        cell(load),
        cell(`${ex.restSeconds}с`),
        cell(ex.tempo ?? '—'),
      ],
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [header, ...rows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '999999' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '999999' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '999999' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '999999' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' },
    },
  });
}

function heading(text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel]): Paragraph {
  return new Paragraph({
    heading: level,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text })],
  });
}

function paragraph(text: string, opts: { bold?: boolean; italic?: boolean; size?: number } = {}): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: opts.bold ?? false,
        italics: opts.italic ?? false,
        size: opts.size ?? 22,
      }),
    ],
  });
}

export async function exportProgramToWord(program: TrainingProgram, fileName?: string): Promise<void> {
  const sortedWeeks = [...program.weeks].sort((a, b) => a.weekNumber - b.weekNumber);

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: program.name, bold: true })],
    }),
    paragraph(
      `${program.totalWeeks} недель · ${program.weeklyDays} дней в неделю · сплит ${program.splitType}`,
      { italic: true },
    ),
    paragraph(`Цель: ${program.primaryGoal} · Уровень: ${program.experienceLevel}`, { italic: true }),
  ];

  if (program.description) {
    children.push(paragraph(program.description));
  }

  for (const week of sortedWeeks) {
    const phaseLabel = PHASE_LABEL[week.phase] ?? week.phase;
    children.push(
      heading(
        `Неделя ${week.weekNumber} — ${phaseLabel}${week.isDeload ? ' (deload)' : ''}`,
        HeadingLevel.HEADING_1,
      ),
    );

    if (week.description) {
      children.push(paragraph(week.description, { italic: true }));
    }
    children.push(
      paragraph(
        `Объём: ×${week.volumeModifier.toFixed(2)} · Интенсивность: ×${week.intensityModifier.toFixed(2)}`,
        { italic: true, size: 18 },
      ),
    );

    const sortedDays = [...week.days].sort((a, b) => a.dayNumber - b.dayNumber);
    for (const day of sortedDays) {
      children.push(heading(`День ${day.dayNumber}: ${day.name}`, HeadingLevel.HEADING_2));

      if (day.isRestDay) {
        children.push(paragraph('Отдых.', { italic: true }));
        continue;
      }

      if (day.targetMuscles?.length) {
        children.push(
          paragraph(`Целевые мышцы: ${day.targetMuscles.join(', ')}`, { size: 20, italic: true }),
        );
      }

      if (day.exercises.length === 0) {
        children.push(paragraph('Упражнения не назначены.', { italic: true }));
      } else {
        children.push(exerciseTable(day.exercises));
      }
    }
  }

  const doc = new Document({
    creator: 'FitTrack',
    title: program.name,
    description: 'Персональная тренировочная программа',
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, fileName ?? `${slugify(program.name)}.docx`);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/giu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'program';
}
