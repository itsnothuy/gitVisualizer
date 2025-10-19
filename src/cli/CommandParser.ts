/**
 * Command Parser for Git commands
 * Parses user input into structured command objects with validation
 */

import type { ParsedCommand, CommandParseResult } from './types';

/**
 * Supported Git commands
 */
const SUPPORTED_COMMANDS = new Set([
  'commit',
  'branch',
  'checkout',
  'switch',
  'merge',
  'rebase',
  'cherry-pick',
  'reset',
  'revert',
  'push',
  'pull',
  'fetch',
  'clone',
  'tag',
  'describe',
  'log',
  'status',
  'undo',
  'redo',
]);

/**
 * Command aliases
 */
const COMMAND_ALIASES: Record<string, string> = {
  co: 'checkout',
  br: 'branch',
  ci: 'commit',
  st: 'status',
};

/**
 * Short options that take values (not flags)
 * Other short options are treated as boolean flags
 */
const VALUE_OPTIONS = new Set(['m', 'message', 'onto']);

/**
 * Long options that are boolean flags (don't take values)
 * Used to distinguish between `--option value` (takes value) and `--flag value` (flag + arg)
 */
const BOOLEAN_LONG_OPTIONS = new Set([
  'amend',
  'all',
  'no-ff',
  'squash',
  'hard',
  'soft',
  'force',
  'rebase',
  'delete',
]);

/**
 * Parse a command string into a structured command object
 * 
 * Examples:
 * - "commit -m 'Initial commit'" → { name: 'commit', args: [], options: { m: 'Initial commit' } }
 * - "branch -d feature" → { name: 'branch', args: ['feature'], options: { d: true } }
 * - "checkout -b feature" → { name: 'checkout', args: ['feature'], options: { b: true } }
 */
export function parseCommand(input: string): CommandParseResult {
  // Trim and handle empty input
  const trimmed = input.trim();
  if (!trimmed) {
    return { success: false, error: 'Empty command' };
  }

  // Tokenize the input, handling quoted strings
  const tokens = tokenize(trimmed);
  if (tokens.length === 0) {
    return { success: false, error: 'Empty command' };
  }

  // Extract command name
  let commandName = tokens[0].toLowerCase();
  
  // Handle aliases
  if (commandName in COMMAND_ALIASES) {
    commandName = COMMAND_ALIASES[commandName];
  }

  // Validate command
  if (!SUPPORTED_COMMANDS.has(commandName)) {
    return {
      success: false,
      error: `Unknown command: '${commandName}'. Type 'help' for available commands.`,
    };
  }

  // Parse arguments and options
  const args: string[] = [];
  const options: Record<string, string | boolean> = {};
  
  let i = 1;
  while (i < tokens.length) {
    const token = tokens[i];
    
    if (token.startsWith('--')) {
      // Long option (--option or --option=value)
      const optName = token.slice(2);
      const eqIndex = optName.indexOf('=');
      
      if (eqIndex !== -1) {
        // --option=value
        const name = optName.slice(0, eqIndex);
        const value = optName.slice(eqIndex + 1);
        options[name] = value;
      } else if (
        !BOOLEAN_LONG_OPTIONS.has(optName) &&
        i + 1 < tokens.length &&
        !tokens[i + 1].startsWith('-')
      ) {
        // --option value (for non-boolean options)
        options[optName] = tokens[i + 1];
        i++;
      } else {
        // --option (boolean flag)
        options[optName] = true;
      }
    } else if (token.startsWith('-') && token.length > 1 && !token.startsWith('--')) {
      // Short option(s) (-o or -abc)
      const flags = token.slice(1);
      
      // Check if it's embedded value (e.g., -m=value)
      if (flags.includes('=')) {
        const eqIndex = flags.indexOf('=');
        const name = flags.slice(0, eqIndex);
        const value = flags.slice(eqIndex + 1);
        options[name] = value;
      } else {
        // Check if there's a following value token
        const hasValueAfter = i + 1 < tokens.length && !tokens[i + 1].startsWith('-');
        
        // For single flag that takes a value
        if (flags.length === 1 && VALUE_OPTIONS.has(flags) && hasValueAfter) {
          options[flags] = tokens[i + 1];
          i++;
        } else {
          // All flags are boolean
          for (const flag of flags) {
            options[flag] = true;
          }
        }
      }
    } else {
      // Positional argument
      args.push(token);
    }
    
    i++;
  }

  // Validate command-specific syntax
  const validation = validateCommandSyntax(commandName, args, options);
  if (!validation.valid) {
    return { success: false, error: validation.error! };
  }

  return {
    success: true,
    command: {
      name: commandName,
      args,
      options,
    },
  };
}

/**
 * Tokenize input string, handling quoted strings
 */
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';
  
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    
    if ((char === '"' || char === "'") && !inQuote) {
      inQuote = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuote) {
      inQuote = false;
      quoteChar = '';
    } else if (char === ' ' && !inQuote) {
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  
  if (current) {
    tokens.push(current);
  }
  
  return tokens;
}

/**
 * Validate command-specific syntax
 */
function validateCommandSyntax(
  command: string,
  args: string[],
  options: Record<string, string | boolean>
): { valid: true } | { valid: false; error: string } {
  switch (command) {
    case 'commit':
      // commit requires -m message or --amend
      if (!options.m && !options.message && !options.amend) {
        return {
          valid: false,
          error: "commit requires -m <message> or --amend",
        };
      }
      // -am is shorthand for -a -m
      if (options.am) {
        return {
          valid: false,
          error: "Use -a -m <message> instead of -am",
        };
      }
      break;

    case 'branch':
      // branch -d/-D requires branch name
      if ((options.d || options.D) && args.length === 0) {
        return {
          valid: false,
          error: "branch -d/-D requires a branch name",
        };
      }
      break;

    case 'checkout':
      // checkout requires a target (branch name or commit)
      if (args.length === 0 && !options.b && !options.B) {
        return {
          valid: false,
          error: "checkout requires a branch name or commit SHA",
        };
      }
      // -b/-B requires branch name
      if ((options.b || options.B) && args.length === 0) {
        return {
          valid: false,
          error: "checkout -b/-B requires a branch name",
        };
      }
      break;

    case 'switch':
      // switch requires branch name or -c
      if (args.length === 0 && !options.c && !options.C) {
        return {
          valid: false,
          error: "switch requires a branch name",
        };
      }
      // -c/-C requires branch name
      if ((options.c || options.C) && args.length === 0) {
        return {
          valid: false,
          error: "switch -c/-C requires a branch name",
        };
      }
      break;

    case 'merge':
      // merge requires branch name
      if (args.length === 0) {
        return {
          valid: false,
          error: "merge requires a branch name",
        };
      }
      break;

    case 'rebase':
      // rebase can have target or use current branch
      // -i, --onto, -p are all valid options
      break;

    case 'cherry-pick':
      // cherry-pick requires at least one commit SHA
      if (args.length === 0) {
        return {
          valid: false,
          error: "cherry-pick requires at least one commit SHA",
        };
      }
      break;

    case 'reset':
      // reset requires target commit or HEAD~n
      if (args.length === 0) {
        return {
          valid: false,
          error: "reset requires a target (commit SHA or HEAD~n)",
        };
      }
      break;

    case 'revert':
      // revert requires commit SHA
      if (args.length === 0) {
        return {
          valid: false,
          error: "revert requires a commit SHA",
        };
      }
      break;

    case 'push':
      // push can have remote and branch
      break;

    case 'pull':
      // pull can have remote and branch
      break;

    case 'fetch':
      // fetch can have remote
      break;

    case 'clone':
      // clone requires URL
      if (args.length === 0) {
        return {
          valid: false,
          error: "clone requires a repository URL",
        };
      }
      break;

    case 'tag':
      // tag can list or create
      break;

    case 'describe':
      // describe can have commit
      break;

    case 'log':
      // log options are all optional
      break;

    case 'status':
      // status has no required args
      break;

    case 'undo':
    case 'redo':
      // undo/redo have no args
      if (args.length > 0 || Object.keys(options).length > 0) {
        return {
          valid: false,
          error: `${command} does not take arguments`,
        };
      }
      break;

    default:
      // Unknown command (should not reach here)
      return {
        valid: false,
        error: `Unknown command: ${command}`,
      };
  }

  return { valid: true };
}

/**
 * Get help text for a command
 */
export function getCommandHelp(command: string): string {
  const helpTexts: Record<string, string> = {
    commit: `Usage: commit -m <message> [options]
  Options:
    -m, --message <msg>  Commit message
    -a, --all           Stage all changes
    --amend             Amend previous commit`,
    
    branch: `Usage: branch [options] [branch-name]
  Options:
    -b <name>  Create new branch
    -d <name>  Delete branch
    -D <name>  Force delete branch`,
    
    checkout: `Usage: checkout [options] <branch|commit>
  Options:
    -b <name>  Create and checkout new branch
    -B <name>  Create/reset and checkout branch`,
    
    switch: `Usage: switch [options] <branch>
  Options:
    -c <name>  Create and switch to new branch
    -C <name>  Create/reset and switch to branch`,
    
    merge: `Usage: merge [options] <branch>
  Options:
    --no-ff     Create merge commit even if fast-forward
    --squash    Squash commits into one`,
    
    rebase: `Usage: rebase [options] [target]
  Options:
    -i              Interactive rebase
    --onto <base>   Rebase onto base
    -p              Preserve merges`,
    
    'cherry-pick': `Usage: cherry-pick <commit>...
  Pick one or more commits to apply`,
    
    reset: `Usage: reset [options] <target>
  Options:
    --soft  Keep changes in staging
    --hard  Discard all changes`,
    
    revert: `Usage: revert <commit>
  Create new commit that undoes changes`,
    
    push: `Usage: push [remote] [branch]
  Options:
    --force   Force push
    --delete  Delete remote branch`,
    
    pull: `Usage: pull [remote] [branch]
  Options:
    --rebase  Rebase instead of merge
    --force   Force pull`,
    
    fetch: `Usage: fetch [remote]
  Fetch remote changes`,
    
    clone: `Usage: clone <url>
  Clone a repository`,
    
    tag: `Usage: tag [name] [commit]
  Create or list tags`,
    
    describe: `Usage: describe [commit]
  Describe commit with nearest tag`,
    
    log: `Usage: log [options]
  Show commit history`,
    
    status: `Usage: status
  Show working tree status`,
    
    undo: `Usage: undo
  Undo last command`,
    
    redo: `Usage: redo
  Redo previously undone command`,
  };

  return helpTexts[command] || `No help available for: ${command}`;
}

/**
 * Get list of all supported commands
 */
export function getSupportedCommands(): string[] {
  return Array.from(SUPPORTED_COMMANDS).sort();
}
