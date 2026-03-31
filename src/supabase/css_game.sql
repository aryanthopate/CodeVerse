-- SQL instructions for inserting CSS Styling Battle game into Supabase
-- WARNING: Ensure you execute this on your Supabase dashboard or via your Supabase CLI.

-- 1. Insert Game
INSERT INTO public.games (id, title, description, thumbnail_url, is_free, language, slug)
VALUES (
    '11111111-1111-1111-1111-111111111111', 
    'Styling Battle', 
    'Master CSS layouts and styling in a gamified code arena.', 
    'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2070&auto=format&fit=crop', 
    true, 
    'css', 
    'styling-battle'
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert Chapter
INSERT INTO public.game_chapters (id, game_id, title, "order", image_url)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'CSS Layouts',
    1,
    'https://images.unsplash.com/photo-1550439062-609e1531270e?q=80&w=2070&auto=format&fit=crop'
) ON CONFLICT (id) DO NOTHING;

-- 3. Insert Levels
-- Level 1: Flex Center
INSERT INTO public.game_levels (id, chapter_id, "order", slug, title, intro_text, objective, starter_code, expected_output, reward_xp, correct_feedback, incorrect_feedback)
VALUES (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222',
    1,
    'flex-center',
    'Flex Center',
    'Welcome to the CSS Battle! In this arena, you must use CSS Flexbox to move the element into the exact center.',
    'Center the box horizontally and vertically using flexbox properties on the container.',
    '.container {
  height: 100vh;
  /* Add your flexbox rules here */
}

.box {
  width: 100px;
  height: 100px;
  background: white;
  border-radius: 8px;
}',
    'display: flex;;justify-content: center;;align-items: center;',
    50,
    'Perfectly balanced, as all things should be!',
    'Not quite aligned. Make sure you are using display: flex, justify-content for horizontal alignment, and align-items for vertical alignment.'
) ON CONFLICT (slug) DO NOTHING;

-- Level 2: Flex Space Between
INSERT INTO public.game_levels (id, chapter_id, "order", slug, title, intro_text, objective, starter_code, expected_output, reward_xp, correct_feedback, incorrect_feedback)
VALUES (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222',
    2,
    'flex-space',
    'Flex Spacing',
    'Sometimes you need items pushed to the absolute edges of their container.',
    'Use flexbox to align the two boxes so they are pushed to opposite ends horizontally.',
    '.container {
  display: flex;
  height: 100vh;
  /* Push items apart */
}

.box {
  width: 100px;
  height: 100px;
  background: white;
  border-radius: 8px;
}',
    'justify-content: space-between;',
    75,
    'Great spacing! Space-between perfectly distributes the extra space.',
    'Check your justify-content value. You want space exactly BETWEEN the items.'
) ON CONFLICT (slug) DO NOTHING;

-- Level 3: Grid Basics
INSERT INTO public.game_levels (id, chapter_id, "order", slug, title, intro_text, objective, starter_code, expected_output, reward_xp, correct_feedback, incorrect_feedback)
VALUES (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222',
    3,
    'grid-basics',
    'Enter the Grid',
    'CSS Grid is a powerful 2D layout system.',
    'Create a 3-column grid where each column takes up 1 fraction space (1fr).',
    '.container {
  /* Set display and define columns */
  
  gap: 16px;
  padding: 16px;
}

.box {
  height: 100px;
  background: white;
  border-radius: 8px;
}',
    'display: grid;;grid-template-columns: repeat(3, 1fr);',
    100,
    'Excellent grid work!',
    'Remember you need display: grid AND grid-template-columns to define the layout.'
) ON CONFLICT (slug) DO NOTHING;

-- Level 4: Border Radius
INSERT INTO public.game_levels (id, chapter_id, "order", slug, title, intro_text, objective, starter_code, expected_output, reward_xp, correct_feedback, incorrect_feedback)
VALUES (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222',
    4,
    'border-radius-circle',
    'Shape Shifter',
    'Everything is a box in CSS... until you curve the edges.',
    'Turn the square box into a perfect circle.',
    '.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.box {
  width: 150px;
  height: 150px;
  background: white;
  /* Make me a circle */
}',
    'border-radius: 50%;',
    50,
    'A perfect circle! The 50% border radius trick works every time.',
    'To make a perfect circle from a square, the border-radius should equal 50%.'
) ON CONFLICT (slug) DO NOTHING;

-- Level 5: CSS Variables
INSERT INTO public.game_levels (id, chapter_id, "order", slug, title, intro_text, objective, starter_code, expected_output, reward_xp, correct_feedback, incorrect_feedback)
VALUES (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222',
    5,
    'css-variables',
    'Vibrant Variables',
    'Modern CSS utilizes Custom Properties (variables) for scalable design. We defined --neon-blue in the :root!',
    'Use the --neon-blue variable to set the background color of the box.',
    ':root {
  --neon-blue: #00f3ff;
}

.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.box {
  width: 200px;
  height: 200px;
  /* Set the background here */
  
  border-radius: 16px;
}',
    'background: var(--neon-blue);',
    100,
    'Neon achieved! Variables are extremely powerful for scalable web design.',
    'Remember the var() syntax to reference a custom property.'
) ON CONFLICT (slug) DO NOTHING;
