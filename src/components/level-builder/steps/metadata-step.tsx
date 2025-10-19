/**
 * Metadata Step
 * Edit level ID, name, description, difficulty, and order
 */

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { Level } from '@/tutorial/types';
import { generateLevelId } from '@/lib/level-builder/serialization';
import { sanitizeLevelId } from '@/lib/level-builder/validation';

interface MetadataStepProps {
  level: Partial<Level>;
  onChange: (updates: Partial<Level>) => void;
}

export function MetadataStep({ level, onChange }: MetadataStepProps) {
  const handleNameChange = (name: string) => {
    onChange({
      name: { ...level.name, en_US: name },
    });

    // Auto-generate ID if not set
    if (!level.id || level.id === '') {
      onChange({ id: generateLevelId(name) });
    }
  };

  const handleIdChange = (id: string) => {
    onChange({ id: sanitizeLevelId(id) });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Level Metadata</CardTitle>
        <CardDescription>Basic information about your tutorial level</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="level-name">Level Name (English) *</Label>
          <input
            id="level-name"
            type="text"
            value={level.name?.en_US || ''}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g., Introduction to Branching"
            className="w-full px-3 py-2 border rounded-md"
            required
            aria-required="true"
          />
          <p className="text-sm text-muted-foreground">
            A clear, descriptive name for your level
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="level-id">Level ID *</Label>
          <input
            id="level-id"
            type="text"
            value={level.id || ''}
            onChange={(e) => handleIdChange(e.target.value)}
            placeholder="e.g., intro-branching"
            className="w-full px-3 py-2 border rounded-md font-mono"
            required
            aria-required="true"
          />
          <p className="text-sm text-muted-foreground">
            Unique identifier (lowercase, hyphens/underscores only)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="level-description">Description (English) *</Label>
          <textarea
            id="level-description"
            value={level.description?.en_US || ''}
            onChange={(e) =>
              onChange({
                description: { ...level.description, en_US: e.target.value },
              })
            }
            placeholder="e.g., Learn how to create and switch between branches in Git"
            className="w-full px-3 py-2 border rounded-md min-h-[100px]"
            required
            aria-required="true"
          />
          <p className="text-sm text-muted-foreground">
            Brief description of what users will learn
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="level-difficulty">Difficulty *</Label>
            <select
              id="level-difficulty"
              value={level.difficulty || 'intro'}
              onChange={(e) =>
                onChange({
                  difficulty: e.target.value as Level['difficulty'],
                })
              }
              className="w-full px-3 py-2 border rounded-md"
              required
              aria-required="true"
            >
              <option value="intro">Introduction</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="level-order">Order</Label>
            <input
              id="level-order"
              type="number"
              value={level.order || 1}
              onChange={(e) =>
                onChange({ order: parseInt(e.target.value, 10) || 1 })
              }
              min="1"
              className="w-full px-3 py-2 border rounded-md"
            />
            <p className="text-sm text-muted-foreground">
              Position in sequence
            </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-2">Optional: Add Translations</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add localized versions of the name and description
          </p>
          <Button variant="outline" size="sm" disabled>
            Add Translation (Coming Soon)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
