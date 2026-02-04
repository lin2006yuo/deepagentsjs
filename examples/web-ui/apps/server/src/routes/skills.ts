import { Router } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import type { SkillInfo } from '@deepagents/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Skills storage path
const SKILLS_PATH = path.join(__dirname, '../../data/skills');

// Ensure skills directory exists
if (!fs.existsSync(SKILLS_PATH)) {
  fs.mkdirSync(SKILLS_PATH, { recursive: true });
}

// Parse SKILL.md frontmatter
function parseSkillMd(content: string): { name: string; description: string } {
  const lines = content.split('\n');
  let name = 'Unknown';
  let description = '';

  if (lines[0] === '---') {
    const endIndex = lines.slice(1).findIndex(line => line === '---');
    if (endIndex !== -1) {
      const frontmatter = lines.slice(1, endIndex + 1).join('\n');
      const nameMatch = frontmatter.match(/name:\s*(.+)/);
      const descMatch = frontmatter.match(/description:\s*(.+)/);
      if (nameMatch) name = nameMatch[1].trim();
      if (descMatch) description = descMatch[1].trim();
    }
  }

  return { name, description };
}

// GET /api/skills - List all skills
router.get('/', (req, res) => {
  try {
    const skills: SkillInfo[] = [];

    if (fs.existsSync(SKILLS_PATH)) {
      const entries = fs.readdirSync(SKILLS_PATH, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillMdPath = path.join(SKILLS_PATH, entry.name, 'SKILL.md');
          if (fs.existsSync(skillMdPath)) {
            const content = fs.readFileSync(skillMdPath, 'utf-8');
            const { name, description } = parseSkillMd(content);
            skills.push({
              name: name || entry.name,
              description,
              path: entry.name
            });
          }
        }
      }
    }

    res.json({ skills });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list skills' });
  }
});

// GET /api/skills/:name - Get skill details
router.get('/:name', (req, res) => {
  try {
    const skillName = req.params.name;
    const skillDir = path.join(SKILLS_PATH, skillName);
    const skillMdPath = path.join(skillDir, 'SKILL.md');

    if (!fs.existsSync(skillMdPath)) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }

    const content = fs.readFileSync(skillMdPath, 'utf-8');
    const { name, description } = parseSkillMd(content);

    res.json({
      name: name || skillName,
      description,
      path: skillName,
      content
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get skill' });
  }
});

// POST /api/skills - Create new skill
const createSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  content: z.string()
});

router.post('/', (req, res) => {
  try {
    const result = createSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Invalid request', details: result.error.errors });
      return;
    }

    const { name, description, content } = result.data;
    const skillDir = path.join(SKILLS_PATH, name);

    if (fs.existsSync(skillDir)) {
      res.status(409).json({ error: 'Skill already exists' });
      return;
    }

    fs.mkdirSync(skillDir, { recursive: true });

    const skillMdContent = `---
name: ${name}
description: ${description}
---

${content}`;

    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skillMdContent, 'utf-8');

    res.json({ success: true, name });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create skill' });
  }
});

// PUT /api/skills/:name - Update skill
const updateSchema = z.object({
  description: z.string().optional(),
  content: z.string()
});

router.put('/:name', (req, res) => {
  try {
    const skillName = req.params.name;
    const result = updateSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Invalid request', details: result.error.errors });
      return;
    }

    const { description, content } = result.data;
    const skillDir = path.join(SKILLS_PATH, skillName);
    const skillMdPath = path.join(skillDir, 'SKILL.md');

    if (!fs.existsSync(skillMdPath)) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }

    // Parse existing to keep name
    const existing = fs.readFileSync(skillMdPath, 'utf-8');
    const { name: existingName } = parseSkillMd(existing);

    const skillMdContent = `---
name: ${existingName || skillName}
description: ${description || ''}
---

${content}`;

    fs.writeFileSync(skillMdPath, skillMdContent, 'utf-8');

    res.json({ success: true, name: skillName });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update skill' });
  }
});

// DELETE /api/skills/:name - Delete skill
router.delete('/:name', (req, res) => {
  try {
    const skillName = req.params.name;
    const skillDir = path.join(SKILLS_PATH, skillName);

    if (!fs.existsSync(skillDir)) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }

    fs.rmdirSync(skillDir, { recursive: true });
    res.json({ success: true, name: skillName });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

export default router;
