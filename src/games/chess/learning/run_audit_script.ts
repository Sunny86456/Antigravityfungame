
import { LESSONS } from './lessonData';
import { ChessValidator } from './ChessValidator';

async function runuser() {
    console.log('STARTING AUDIT...');
    const invalid: any[] = [];

    LESSONS.forEach(l => {
        const audits = ChessValidator.sanityCheckLesson(l);
        if (audits.length > 0) {
            console.log(`[FAIL] Lesson ${l.id} | ${l.title}`);
            audits.forEach(a => console.log(`  Error: ${a.reason}`));
            invalid.push({ id: l.id, errors: audits });
        }
    });

    console.log(`\nDONE. Total: ${LESSONS.length}, Invalid: ${invalid.length}`);
    if (invalid.length > 0) process.exit(1);
}

runuser();
