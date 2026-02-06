
import re

file_path = 'l:/Antigravityfungame/neon-nexus-games-main/neon-nexus-games-main/src/games/chess/learning/lessonData.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix duplicate moveSequence in Lesson interface
# We see it appears twice. We'll remove the second occurrence.
# The interface ends around line 85.
start_interface = content.find('export interface Lesson {')
end_interface = content.find('// ============= Board Builders =============')

interface_block = content[start_interface:end_interface]
# Remove the second moveSequence checking exact indentation
if interface_block.count('moveSequence?:') > 1:
    # Keeps the first one, removes subsequent
    parts = interface_block.split('moveSequence?:')
    new_interface = parts[0] + 'moveSequence?:' + parts[1] + parts[2].split(';', 1)[1]
    content = content[:start_interface] + new_interface + content[end_interface:]

# 2. Add bishopBlockingBoard function
board_builder_marker = '// ============= Board Builders ============='
new_builder = """
const bishopBlockingBoard = (): Board => {
  const board = emptyBoard();
  board[7][4] = { type: 'king', color: 'white' }; // King at E1
  board[3][0] = { type: 'bishop', color: 'black' }; // Bishop at A5 (Check)
  board[7][2] = { type: 'bishop', color: 'white' }; // Bishop at C1 (Blocker)
  return board;
};
"""

if 'const bishopBlockingBoard' not in content:
    content = content.replace(board_builder_marker, board_builder_marker + '\n' + new_builder)


# 3. Add the Lesson 31
lesson_end_marker = '];'
new_lesson = """
  {
    id: 31,
    category: 'check',
    title: 'Bishop Block',
    subtitle: 'Diagonal Defense',
    description: 'Block the check relative to the diagonal path.',
    icon: '🛡️',
    board: bishopBlockingBoard(),
    playerColor: 'white',
    allowedPieces: ['bishop'],
    mode: 'specific',
    objective: {
      type: 'make-move',
      description: 'Block the check from the black bishop on a5!',
      acceptedMoves: [{ from: { row: 7, col: 2 }, to: { row: 6, col: 3 } }]
    },
    concept: 'When blocking a bishop, you must place your piece on the exact diagonal line between the attacker and your king. Geometry matters!',
    hint: 'Move your bishop to d2 to intercept the attack.',
    successMessage: 'Perfect! The line of attack is broken.',
    highlightSquares: [{ row: 6, col: 3 }]
  }
"""

# Check if lesson 31 already exists
if 'id: 31' not in content:
    # Insert before the last closing bracket of LESSONS array
    # We find the last occurrences of '];' which should be the end of LESSONS
    content = content[:content.rfind('];')] + ',' + new_lesson + '\n];'


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated lessonData.ts")
