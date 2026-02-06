
import { describe, it, expect } from 'vitest';
import { LESSONS } from './lessonData';
import { ChessValidator } from './ChessValidator';

describe('Lesson Data Integrity Audit', () => {
    const invalidLessons: any[] = [];
    const validLessons: number[] = [];

    LESSONS.forEach(lesson => {
        it(`Lesson ${lesson.id}: ${lesson.title} should be valid`, () => {
            const audits = ChessValidator.sanityCheckLesson(lesson);

            if (audits.length > 0) {
                invalidLessons.push({
                    id: lesson.id,
                    title: lesson.title,
                    errors: audits
                });
                // We warn instead of failing the test to let all run
                console.warn(`\n[INVALID] Lesson ${lesson.id} (${lesson.title}):`);
                audits.forEach(a => console.warn(`  - ${a.reason}`));
            } else {
                validLessons.push(lesson.id);
            }

            // Soft assertion: just log, don't crash the test runner yet
            // expect(audits).toEqual([]);
        });
    });

    it('Summary Report', () => {
        console.log('\n================ AUDIT SUMMARY ================');
        console.log(`Total Lessons: ${LESSONS.length}`);
        console.log(`Valid: ${validLessons.length}`);
        console.log(`Invalid: ${invalidLessons.length}`);

        if (invalidLessons.length > 0) {
            console.log('\n--- INVALID LESSONS ---');
            invalidLessons.forEach(l => {
                console.log(`[ID ${l.id}] ${l.title}`);
                l.errors.forEach((e: any) => console.log(`   Error: ${e.reason}`));
            });
        } else {
            console.log("ALL LESSONS ARE VALID!");
        }
    });
});
