/**
 * Unit tests for CommandParser
 * Tests command parsing, validation, and error handling
 */

import { describe, it, expect } from 'vitest';
import { parseCommand, getCommandHelp, getSupportedCommands } from '../CommandParser';

describe('CommandParser', () => {
  describe('parseCommand', () => {
    describe('basic parsing', () => {
      it('should parse simple command', () => {
        const result = parseCommand('status');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.name).toBe('status');
          expect(result.command.args).toEqual([]);
          expect(result.command.options).toEqual({});
        }
      });

      it('should reject empty command', () => {
        const result = parseCommand('');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Empty command');
        }
      });

      it('should reject unknown command', () => {
        const result = parseCommand('foo');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Unknown command');
        }
      });
    });

    describe('commit command', () => {
      it('should parse commit with message', () => {
        const result = parseCommand('commit -m "Initial commit"');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.name).toBe('commit');
          expect(result.command.options.m).toBe('Initial commit');
        }
      });

      it('should parse commit with single-quoted message', () => {
        const result = parseCommand("commit -m 'Fix bug'");
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.options.m).toBe('Fix bug');
        }
      });

      it('should parse commit with --message', () => {
        const result = parseCommand('commit --message "Test"');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.options.message).toBe('Test');
        }
      });

      it('should parse commit with -a flag', () => {
        const result = parseCommand('commit -a -m "All changes"');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.options.a).toBe(true);
          expect(result.command.options.m).toBe('All changes');
        }
      });

      it('should parse commit --amend', () => {
        const result = parseCommand('commit --amend');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.options.amend).toBe(true);
        }
      });

      it('should reject commit without message or amend', () => {
        const result = parseCommand('commit');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('requires -m');
        }
      });
    });

    describe('branch command', () => {
      it('should parse branch list', () => {
        const result = parseCommand('branch');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.name).toBe('branch');
          expect(result.command.args).toEqual([]);
        }
      });

      it('should parse branch create', () => {
        const result = parseCommand('branch feature');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.args).toEqual(['feature']);
        }
      });

      it('should parse branch delete', () => {
        const result = parseCommand('branch -d feature');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.options.d).toBe(true);
          expect(result.command.args).toEqual(['feature']);
        }
      });

      it('should parse branch force delete', () => {
        const result = parseCommand('branch -D feature');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.options.D).toBe(true);
          expect(result.command.args).toEqual(['feature']);
        }
      });

      it('should reject delete without branch name', () => {
        const result = parseCommand('branch -d');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('requires a branch name');
        }
      });
    });

    describe('checkout command', () => {
      it('should parse checkout branch', () => {
        const result = parseCommand('checkout main');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.args).toEqual(['main']);
        }
      });

      it('should parse checkout with new branch', () => {
        const result = parseCommand('checkout -b feature');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.options.b).toBe(true);
          expect(result.command.args).toEqual(['feature']);
        }
      });

      it('should parse checkout with force new branch', () => {
        const result = parseCommand('checkout -B feature');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.options.B).toBe(true);
          expect(result.command.args).toEqual(['feature']);
        }
      });

      it('should reject checkout without target', () => {
        const result = parseCommand('checkout');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('requires a branch');
        }
      });

      it('should reject checkout -b without name', () => {
        const result = parseCommand('checkout -b');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('requires a branch name');
        }
      });
    });

    describe('switch command', () => {
      it('should parse switch branch', () => {
        const result = parseCommand('switch main');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.args).toEqual(['main']);
        }
      });

      it('should parse switch with create', () => {
        const result = parseCommand('switch -c feature');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.options.c).toBe(true);
          expect(result.command.args).toEqual(['feature']);
        }
      });

      it('should reject switch without target', () => {
        const result = parseCommand('switch');
        expect(result.success).toBe(false);
      });
    });

    describe('merge command', () => {
      it('should parse merge', () => {
        const result = parseCommand('merge feature');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.args).toEqual(['feature']);
        }
      });

      it('should parse merge with --no-ff', () => {
        const result = parseCommand('merge --no-ff feature');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.options['no-ff']).toBe(true);
          expect(result.command.args).toEqual(['feature']);
        }
      });

      it('should parse merge with --squash', () => {
        const result = parseCommand('merge --squash feature');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.options.squash).toBe(true);
        }
      });

      it('should reject merge without branch', () => {
        const result = parseCommand('merge');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('requires a branch');
        }
      });
    });

    describe('rebase command', () => {
      it('should parse rebase', () => {
        const result = parseCommand('rebase main');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.args).toEqual(['main']);
        }
      });

      it('should parse interactive rebase', () => {
        const result = parseCommand('rebase -i HEAD~3');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.options.i).toBe(true);
          expect(result.command.args).toEqual(['HEAD~3']);
        }
      });

      it('should parse rebase --onto', () => {
        const result = parseCommand('rebase --onto main feature');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.options.onto).toBe('main');
          expect(result.command.args).toEqual(['feature']);
        }
      });
    });

    describe('cherry-pick command', () => {
      it('should parse cherry-pick', () => {
        const result = parseCommand('cherry-pick abc123');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.args).toEqual(['abc123']);
        }
      });

      it('should parse cherry-pick multiple commits', () => {
        const result = parseCommand('cherry-pick abc123 def456');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.args).toEqual(['abc123', 'def456']);
        }
      });

      it('should reject cherry-pick without commit', () => {
        const result = parseCommand('cherry-pick');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('requires at least one commit');
        }
      });
    });

    describe('reset command', () => {
      it('should parse reset', () => {
        const result = parseCommand('reset HEAD~1');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.args).toEqual(['HEAD~1']);
        }
      });

      it('should parse reset --hard', () => {
        const result = parseCommand('reset --hard HEAD~1');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.options.hard).toBe(true);
          expect(result.command.args).toEqual(['HEAD~1']);
        }
      });

      it('should parse reset --soft', () => {
        const result = parseCommand('reset --soft HEAD~1');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.options.soft).toBe(true);
        }
      });

      it('should reject reset without target', () => {
        const result = parseCommand('reset');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('requires a target');
        }
      });
    });

    describe('revert command', () => {
      it('should parse revert', () => {
        const result = parseCommand('revert abc123');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.args).toEqual(['abc123']);
        }
      });

      it('should reject revert without commit', () => {
        const result = parseCommand('revert');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('requires a commit');
        }
      });
    });

    describe('remote operations', () => {
      it('should parse push', () => {
        const result = parseCommand('push origin main');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.args).toEqual(['origin', 'main']);
        }
      });

      it('should parse push --force', () => {
        const result = parseCommand('push --force');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.options.force).toBe(true);
        }
      });

      it('should parse pull', () => {
        const result = parseCommand('pull origin main');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.args).toEqual(['origin', 'main']);
        }
      });

      it('should parse pull --rebase', () => {
        const result = parseCommand('pull --rebase');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.options.rebase).toBe(true);
        }
      });

      it('should parse fetch', () => {
        const result = parseCommand('fetch origin');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.args).toEqual(['origin']);
        }
      });
    });

    describe('clone command', () => {
      it('should parse clone', () => {
        const result = parseCommand('clone https://github.com/user/repo.git');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.args).toEqual(['https://github.com/user/repo.git']);
        }
      });

      it('should reject clone without URL', () => {
        const result = parseCommand('clone');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('requires a repository URL');
        }
      });
    });

    describe('tag command', () => {
      it('should parse tag list', () => {
        const result = parseCommand('tag');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.args).toEqual([]);
        }
      });

      it('should parse tag create', () => {
        const result = parseCommand('tag v1.0.0');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.args).toEqual(['v1.0.0']);
        }
      });
    });

    describe('undo/redo commands', () => {
      it('should parse undo', () => {
        const result = parseCommand('undo');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.name).toBe('undo');
          expect(result.command.args).toEqual([]);
          expect(result.command.options).toEqual({});
        }
      });

      it('should parse redo', () => {
        const result = parseCommand('redo');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.name).toBe('redo');
        }
      });

      it('should reject undo with args', () => {
        const result = parseCommand('undo 5');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('does not take arguments');
        }
      });

      it('should reject redo with options', () => {
        const result = parseCommand('redo --force');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('does not take arguments');
        }
      });
    });

    describe('command aliases', () => {
      it('should support co alias for checkout', () => {
        const result = parseCommand('co main');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.name).toBe('checkout');
        }
      });

      it('should support br alias for branch', () => {
        const result = parseCommand('br feature');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.name).toBe('branch');
        }
      });

      it('should support ci alias for commit', () => {
        const result = parseCommand('ci -m "Test"');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.name).toBe('commit');
        }
      });

      it('should support st alias for status', () => {
        const result = parseCommand('st');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.command.name).toBe('status');
        }
      });
    });
  });

  describe('getCommandHelp', () => {
    it('should return help for commit', () => {
      const help = getCommandHelp('commit');
      expect(help).toContain('commit -m');
      expect(help).toContain('--amend');
    });

    it('should return help for branch', () => {
      const help = getCommandHelp('branch');
      expect(help).toContain('branch');
      expect(help).toContain('-d');
    });

    it('should return fallback for unknown command', () => {
      const help = getCommandHelp('foo');
      expect(help).toContain('No help available');
    });
  });

  describe('getSupportedCommands', () => {
    it('should return list of supported commands', () => {
      const commands = getSupportedCommands();
      expect(commands).toContain('commit');
      expect(commands).toContain('branch');
      expect(commands).toContain('checkout');
      expect(commands).toContain('merge');
      expect(commands).toContain('undo');
      expect(commands).toContain('redo');
    });

    it('should return sorted commands', () => {
      const commands = getSupportedCommands();
      const sorted = [...commands].sort();
      expect(commands).toEqual(sorted);
    });
  });
});
