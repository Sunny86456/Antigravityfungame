
import re

file_path = 'l:/Antigravityfungame/neon-nexus-games-main/neon-nexus-games-main/src/games/chess/learning/lessonData.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Shift IDs
# We hunt for "id: number," inside the LESSONS array.
# To avoiding messing up other things, we'll manually split the file.
# We know LESSONS starts around line 419.

parts = content.split('export const LESSONS: Lesson[] = [')
header = parts[0]
lessons_block = parts[1]

# Function to increment ID
def increment_id(match):
    num = int(match.group(1))
    return f"id: {num + 3},"

# Replace in reverse order to avoid any overlap issues (though regex replace is usually simultaneous in pass)
# Actually re.sub processes unrelated matches independently.
new_lessons_block = re.sub(r'id: (\d+),', increment_id, lessons_block)

# 2. Define Intro Lessons
intro_lessons = """
  // INTRO LESSONS (1-3)
  {
    id: 1,
    category: 'intro',
    title: 'The Chess Board',
    subtitle: '64 Squares',
    description: 'Welcome to Chess! The board has 64 squares arranged in an 8x8 grid.',
    icon: '▦',
    board: emptyBoard(),
    playerColor: 'white',
    allowedPieces: [],
    mode: 'demonstrate',
    objective: {
      type: 'click',
      description: 'Click the center square e4 (highlighted) to start.',
      targetSquare: { row: 4, col: 4 }
    },
    concept: 'A chessboard consists of 64 alternating light and dark squares. The board is always set up with a light square in the bottom-right corner.',
    hint: 'Click the highlighted square in the center.',
    successMessage: 'Welcome to the game of kings!',
    highlightSquares: [{ row: 4, col: 4 }]
  },
  {
    id: 2,
    category: 'intro',
    title: 'Ranks and Files',
    subtitle: 'Grid Coordinates',
    description: 'Rows are called Ranks. Columns are called Files.',
    icon: '▦',
    board: emptyBoard(),
    playerColor: 'white',
    allowedPieces: [],
    mode: 'demonstrate',
    objective: {
      type: 'click',
      description: 'Click any square on the 4th Rank (row 4).',
      targetSquare: { row: 4, col: 0 }
    },
    concept: 'We describe squares using coordinates. Files are letters (a-h) and Ranks are numbers (1-8).',
    hint: 'Click the specific highlighted square (a5).',
    successMessage: 'Correct! You are learning the coordinates.',
    highlightSquares: [{ row: 4, col: 0 }, { row: 4, col: 1 }, { row: 4, col: 2 }, { row: 4, col: 3 }, { row: 4, col: 4 }, { row: 4, col: 5 }, { row: 4, col: 6 }, { row: 4, col: 7 }]
  },
  {
    id: 3,
    category: 'intro',
    title: 'Starting Out',
    subtitle: 'White Moves First',
    description: 'In Chess, the player with the White pieces always moves first.',
    icon: '🏳️',
    board: emptyBoard(),
    playerColor: 'white',
    allowedPieces: [],
    mode: 'demonstrate',
    objective: {
      type: 'click',
      description: 'Click the white king to acknowledge.',
      targetSquare: { row: 7, col: 4 }
    },
    concept: 'White always moves first. This gives White a slight initiative. Players alternate moves until the game ends.',
    hint: 'Click the white king starting square e1.',
    successMessage: 'Ready? Let\\'s learn how the pieces move!',
    highlightSquares: [{ row: 7, col: 4 }]
  },

"""

# Reassemble
new_content = header + 'export const LESSONS: Lesson[] = [\n' + intro_lessons + new_lessons_block

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully updated lessonData.ts")
